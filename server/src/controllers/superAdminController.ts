import type { Response } from 'express';
import { prisma } from '../index.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';
import { getDeploymentAudit } from '../services/deploymentAudit.js';
import { getPlatformUsage } from '../services/usagePricing.js';

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
    res.json({ totalHospitals, totalUsers, totalPatients, activeSubscriptions, totalRevenue, usage });
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
        id: true, name: true, email: true, phone: true, isSuperAdmin: true, createdAt: true,
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
