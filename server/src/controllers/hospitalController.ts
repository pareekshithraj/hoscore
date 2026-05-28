import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../index.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';
import { ALL_FEATURES, permissionsForRole } from '../utils/features.js';
import { logAudit } from '../utils/auditLogger.js';

const normalizePermissions = (permissions: unknown) => {
  if (!Array.isArray(permissions)) return undefined;
  const allowed = new Set<string>(ALL_FEATURES);
  return permissions.filter((item): item is string => typeof item === 'string' && allowed.has(item));
};

// Get current hospital data (for settings page)
export const getCurrentHospital = async (req: AuthRequest, res: Response) => {
  const hospitalId = req.user?.hospitalId;
  if (!hospitalId) return res.status(403).json({ error: 'Hospital context required' });

  try {
    const hospital = await prisma.hospital.findUnique({ where: { id: hospitalId } });
    if (!hospital) return res.status(404).json({ error: 'Hospital not found' });
    res.json(hospital);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get hospital' });
  }
};

// Public: list all active hospitals
export const listHospitals = async (_req: Request, res: Response) => {
  try {
    const hospitals = await prisma.hospital.findMany({
      where: { isActive: true },
      select: {
        id: true, name: true, slug: true, address: true, city: true, state: true,
        contact: true, description: true, logo: true, rating: true, isPartnered: true,
      },
      orderBy: { rating: 'desc' },
    });
    res.json(hospitals);
  } catch (error) {
    res.status(500).json({ error: 'Failed to list hospitals' });
  }
};

// Public: get hospital detail
export const getHospital = async (req: Request, res: Response) => {
  try {
    const hospital = await prisma.hospital.findFirst({
      where: { OR: [{ id: req.params.id }, { slug: req.params.id }], isActive: true },
      include: {
        doctors: { select: { id: true, name: true, specialty: true, rating: true, status: true } },
        _count: { select: { rooms: true, doctors: true, appointments: true } },
      },
    });
    if (!hospital) return res.status(404).json({ error: 'Hospital not found' });
    res.json(hospital);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get hospital' });
  }
};

// Register a new hospital (self-service)
export const registerHospital = async (req: Request, res: Response) => {
  const { hospitalName, address, city, state, contact, description, adminName, adminEmail, adminPassword, adminPhone } = req.body;

  try {
    // Check if admin email exists
    const existingUser = await prisma.user.findUnique({ where: { email: adminEmail } });

    // Generate slug from hospital name
    const baseSlug = hospitalName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.hospital.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`;
    }

    // Create hospital
    const hospital = await prisma.hospital.create({
      data: {
        name: hospitalName,
        slug,
        address,
        city,
        state,
        contact,
        description,
        isPartnered: true,
        isActive: true,
      },
    });

    // Create subscription (1 year from now)
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1);
    await prisma.subscription.create({
      data: {
        hospitalId: hospital.id,
        plan: 'STARTER',
        pricePerUser: 150,
        maxUsers: 50,
        status: 'ACTIVE',
        endDate,
      },
    });

    // Create or reuse user account for hospital admin
    let user;
    if (existingUser) {
      user = existingUser;
    } else {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      user = await prisma.user.create({
        data: {
          name: adminName,
          email: adminEmail,
          password: hashedPassword,
          phone: adminPhone,
        },
      });
    }

    // Create admin membership
    await prisma.membership.create({
      data: {
        userId: user.id,
        hospitalId: hospital.id,
        role: 'ADMIN',
        department: 'Administration',
        permissions: permissionsForRole('ADMIN'),
        status: 'ACTIVE',
      },
    });

    res.status(201).json({
      message: 'Hospital registered successfully',
      hospital: { id: hospital.id, name: hospital.name, slug: hospital.slug },
    });
  } catch (error: any) {
    console.error('Hospital registration error:', error);
    res.status(500).json({ error: 'Hospital registration failed' });
  }
};

// Update hospital (admin of that hospital)
export const updateHospital = async (req: AuthRequest, res: Response) => {
  const hospitalId = req.user?.hospitalId;
  if (!hospitalId) return res.status(403).json({ error: 'Hospital context required' });

  try {
    const hospital = await prisma.hospital.update({
      where: { id: hospitalId },
      data: req.body,
    });
    await logAudit(req, 'UPDATE', 'Hospital', hospital.id, `Updated hospital ${hospital.name}`);
    res.json(hospital);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update hospital' });
  }
};

// Invite staff to hospital
export const inviteStaff = async (req: AuthRequest, res: Response) => {
  const hospitalId = req.user?.hospitalId;
  if (!hospitalId) return res.status(403).json({ error: 'Hospital context required' });

  const { email, name, role, department, password, staffTypeId, permissions } = req.body;

  try {
    // Find or create user
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      const hashedPassword = await bcrypt.hash(password || 'changeme123', 10);
      user = await prisma.user.create({
        data: { name, email, password: hashedPassword },
      });
    }

    // Check for existing membership
    const existing = await prisma.membership.findFirst({
      where: { userId: user.id, hospitalId, role },
    });
    if (existing) return res.status(400).json({ error: 'User already has this role at this hospital' });

    const staffType = staffTypeId
      ? await prisma.staffType.findFirst({
          where: {
            id: staffTypeId,
            isActive: true,
            OR: [{ hospitalId: null }, { hospitalId }],
          },
        })
      : null;

    const assignedRole = role || staffType?.role || 'STAFF';
    const explicitPermissions = normalizePermissions(permissions);
    const assignedPermissions = explicitPermissions ?? permissionsForRole(assignedRole, staffType?.permissions);

    const membership = await prisma.membership.create({
      data: {
        userId: user.id,
        hospitalId,
        staffTypeId: staffType?.id || null,
        role: assignedRole,
        department: department || 'General',
        permissions: assignedPermissions,
        status: 'ACTIVE',
      },
    });

    await logAudit(req, 'CREATE', 'Membership', membership.id, `Created ${assignedRole} portal login for ${user.email}`);
    res.status(201).json({ message: 'Staff invited', membership });
  } catch (error: any) {
    console.error('Invite staff error:', error);
    res.status(500).json({ error: 'Failed to invite staff' });
  }
};

export const updateStaffMembership = async (req: AuthRequest, res: Response) => {
  const hospitalId = req.user?.hospitalId;
  if (!hospitalId) return res.status(403).json({ error: 'Hospital context required' });

  const { role, department, staffTypeId, permissions, status } = req.body;

  try {
    const existing = await prisma.membership.findFirst({
      where: { id: req.params.id, hospitalId },
      include: { user: { select: { email: true } } },
    });
    if (!existing) return res.status(404).json({ error: 'Membership not found' });

    const staffType = staffTypeId
      ? await prisma.staffType.findFirst({
          where: { id: staffTypeId, isActive: true, OR: [{ hospitalId: null }, { hospitalId }] },
        })
      : null;

    const nextRole = role || staffType?.role || existing.role;
    const explicitPermissions = normalizePermissions(permissions);
    const nextPermissions = explicitPermissions ?? permissionsForRole(nextRole, staffType?.permissions ?? existing.permissions);

    const membership = await prisma.membership.update({
      where: { id: existing.id },
      data: {
        role: nextRole,
        department: department ?? existing.department,
        staffTypeId: staffTypeId === '' ? null : staffType?.id ?? existing.staffTypeId,
        permissions: nextPermissions,
        status: status ?? existing.status,
      },
      include: { user: { select: { id: true, name: true, email: true, phone: true, avatar: true } }, staffType: true },
    });

    await logAudit(req, 'UPDATE', 'Membership', membership.id, `Updated portal access for ${existing.user.email}`);
    res.json(membership);
  } catch (error) {
    console.error('Update staff membership error:', error);
    res.status(500).json({ error: 'Failed to update staff membership' });
  }
};

// List staff of current hospital
export const getHospitalStaff = async (req: AuthRequest, res: Response) => {
  const hospitalId = req.user?.hospitalId;
  if (!hospitalId) return res.status(403).json({ error: 'Hospital context required' });

  try {
    const memberships = await prisma.membership.findMany({
      where: { hospitalId, status: 'ACTIVE' },
      include: { user: { select: { id: true, name: true, email: true, phone: true, avatar: true } }, staffType: true },
    });
    res.json(memberships);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get staff' });
  }
};
