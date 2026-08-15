import type { Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../index.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';
import { getDeploymentAudit } from '../services/deploymentAudit.js';
import { getPlatformUsage } from '../services/usagePricing.js';
import { ADMIN_PERMISSIONS } from '../utils/features.js';
import { logAudit } from '../utils/auditLogger.js';

const getJwtSecret = () => process.env.JWT_SECRET || 'hoscore-development-secret-key-32chars';

function buildMonthlyGrowth(dates: Date[]) {
  const now = new Date();
  const months: { name: string; registrations: number; cumulative: number }[] = [];
  let cumulative = 0;
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const next = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const registrations = dates.filter((x) => x >= d && x < next).length;
    cumulative += registrations;
    months.push({
      name: d.toLocaleString('en-IN', { month: 'short', year: '2-digit' }),
      registrations: cumulative,
      cumulative,
    });
  }
  return months;
}

export const getDashboardStats = async (_req: AuthRequest, res: Response) => {
  try {
    const [totalHospitals, totalUsers, totalPatients, activeSubscriptions] = await Promise.all([
      prisma.hospital.count(),
      prisma.user.count(),
      prisma.patient.count(),
      prisma.subscription.count({ where: { status: 'ACTIVE' } }),
    ]);
    const subscriptions = await prisma.subscription.findMany({
      where: { status: 'ACTIVE' },
      include: { hospital: { include: { _count: { select: { memberships: true } } } } },
    });
    const totalRevenue = subscriptions.reduce((sum, s) => sum + (s.pricePerUser * s.hospital._count.memberships), 0);
    const usage = await getPlatformUsage();
    const [hospitalDates, planGroups, failedPayments] = await Promise.all([
      prisma.hospital.findMany({ select: { createdAt: true }, orderBy: { createdAt: 'asc' } }),
      prisma.subscription.groupBy({ by: ['plan'], _count: { plan: true } }),
      prisma.payment.count({ where: { status: 'FAILED' } }),
    ]);
    const growth = buildMonthlyGrowth(hospitalDates.map((h) => h.createdAt));
    const planTotal = planGroups.reduce((s, g) => s + g._count.plan, 0) || 1;
    const planShare = planGroups.map((g) => ({
      name: `${g.plan} Plan`,
      value: Math.round((g._count.plan / planTotal) * 100),
      count: g._count.plan,
    }));
    res.json({
      totalHospitals,
      totalUsers,
      totalPatients,
      activeSubscriptions,
      totalRevenue,
      usage,
      growth,
      planShare,
      failedPayments,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get stats' });
  }
};

export const getUsage = async (_req: AuthRequest, res: Response) => {
  try {
    res.json(await getPlatformUsage());
  } catch (error) {
    console.error('Usage telemetry error:', error);
    res.status(500).json({ error: 'Failed to get usage telemetry' });
  }
};

export const getDeploymentReadiness = async (_req: AuthRequest, res: Response) => {
  try {
    res.json(getDeploymentAudit());
  } catch (error) {
    console.error('Deployment readiness error:', error);
    res.status(500).json({ error: 'Failed to get deployment readiness' });
  }
};

export const getAllHospitals = async (_req: AuthRequest, res: Response) => {
  try {
    const hospitals = await prisma.hospital.findMany({
      include: {
        subscriptions: { orderBy: { createdAt: 'desc' }, take: 1 },
        _count: { select: { memberships: true, rooms: true, doctors: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(hospitals);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get hospitals' });
  }
};

export const getAllUsers = async (_req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true, name: true, email: true, phone: true, isSuperAdmin: true, isActive: true, createdAt: true,
        memberships: { include: { hospital: { select: { id: true, name: true } } } },
        patientProfile: { select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get users' });
  }
};

export const getAllSubscriptions = async (_req: AuthRequest, res: Response) => {
  try {
    const subs = await prisma.subscription.findMany({
      include: { hospital: { select: { id: true, name: true, _count: { select: { memberships: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(subs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get subscriptions' });
  }
};

export const toggleHospitalStatus = async (req: AuthRequest, res: Response) => {
  try {
    const h = await prisma.hospital.findUnique({ where: { id: req.params.id } });
    if (!h) return res.status(404).json({ error: 'Not found' });
    const updated = await prisma.hospital.update({ where: { id: req.params.id }, data: { isActive: !h.isActive } });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle status' });
  }
};

export const toggleUserStatus = async (req: AuthRequest, res: Response) => {
  try {
    const u = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!u) return res.status(404).json({ error: 'Not found' });
    if (u.isSuperAdmin) return res.status(400).json({ error: 'Cannot deactivate a Super Admin' });
    
    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: !u.isActive },
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle user status' });
  }
};

export const getPayments = async (_req: AuthRequest, res: Response) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { status: { in: ['FAILED', 'CREATED'] } },
      orderBy: { createdAt: 'desc' },
      take: 80,
    });
    const hospitalIds = [...new Set(payments.map((p) => p.hospitalId).filter(Boolean))];
    const hospitals = await prisma.hospital.findMany({
      where: { id: { in: hospitalIds } },
      select: { id: true, name: true },
    });
    const names = Object.fromEntries(hospitals.map((h) => [h.id, h.name]));
    res.json(payments.map((p) => ({ ...p, hospitalName: names[p.hospitalId] || 'Unknown' })));
  } catch (error) {
    res.status(500).json({ error: 'Failed to get payments' });
  }
};

export const impersonateHospital = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.isSuperAdmin) return res.status(403).json({ error: 'Super admin access required' });
    const hospital = await prisma.hospital.findUnique({ where: { id: req.params.id } });
    if (!hospital) return res.status(404).json({ error: 'Hospital not found' });
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const token = jwt.sign(
      {
        userId: user.id,
        name: user.name,
        email: user.email,
        isSuperAdmin: true,
        contextType: 'hospital',
        hospitalId: hospital.id,
        role: 'ADMIN',
        permissions: ADMIN_PERMISSIONS,
        impersonating: true,
      },
      getJwtSecret(),
      { expiresIn: '4h' },
    );

    await logAudit(req, 'IMPERSONATE', 'Hospital', hospital.id, `Support session opened for ${hospital.name}`);
    res.json({
      token,
      activeContext: {
        type: 'hospital',
        hospitalId: hospital.id,
        hospitalName: hospital.name,
        role: 'ADMIN',
        permissions: ADMIN_PERMISSIONS,
        impersonating: true,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to open hospital as support' });
  }
};
