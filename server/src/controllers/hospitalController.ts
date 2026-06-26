import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../index.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';
import { ALL_FEATURES, permissionsForRole } from '../utils/features.js';
import { logAudit } from '../utils/auditLogger.js';
import { getHospitalUsage } from '../services/usagePricing.js';
import {
  assertCanAddUser,
} from '../services/subscriptionService.js';
import { signUrl, signHospitalPhotos } from '../services/r2.js';

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
    
    const signedLogo = hospital.logo ? await signUrl(hospital.logo) : null;
    const signedPhotos = hospital.photos ? await signHospitalPhotos(hospital.photos) : null;
    res.json({ ...hospital, logo: signedLogo, photos: signedPhotos });
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
        id: true, name: true, slug: true, address: true, country: true, city: true, state: true,
        contact: true, description: true, logo: true, photos: true, rating: true, isPartnered: true,
      },
      orderBy: { rating: 'desc' },
    });
    const signedHospitals = await Promise.all(hospitals.map(async (h) => ({
      ...h,
      logo: h.logo ? await signUrl(h.logo) : null,
      photos: h.photos ? await signHospitalPhotos(h.photos) : null,
    })));
    res.json(signedHospitals);
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
    
    const signedLogo = hospital.logo ? await signUrl(hospital.logo) : null;
    const signedPhotos = hospital.photos ? await signHospitalPhotos(hospital.photos) : null;
    res.json({ ...hospital, logo: signedLogo, photos: signedPhotos });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get hospital' });
  }
};

// Register a new hospital (self-service)
// Register a hospital under the CURRENTLY AUTHENTICATED identity.
// Never creates a new account — it attaches an ADMIN membership to req.user.
export const registerHospital = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ error: 'You must be logged in to register a hospital.' });

  const { hospitalName, address, country, city, state, contact, description } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Generate a unique slug from the hospital name.
    const baseSlug = hospitalName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    let slug = baseSlug || 'hospital';
    let counter = 1;
    while (await prisma.hospital.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`;
    }

    const hospital = await prisma.hospital.create({
      data: {
        name: hospitalName,
        slug,
        address,
        country,
        city,
        state,
        contact,
        description,
        isPartnered: true,
        isActive: true,
      },
    });

    // 30-day trial — add team first, then pay per user on the Subscription page.
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 30);
    await prisma.subscription.create({
      data: {
        hospitalId: hospital.id,
        plan: 'STARTER',
        pricePerUser: 150,
        maxUsers: 50,
        billedSeats: 0,
        status: 'TRIAL',
        trialEndsAt,
        endDate: new Date(trialEndsAt),
      },
    });

    // Attach the ADMIN membership to the existing identity; avoid duplicates if the
    // hospital was registered already by the same user.
    const existingMembership = await prisma.membership.findFirst({
      where: { userId: user.id, hospitalId: hospital.id },
    });

    if (!existingMembership) {
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
    }

    await logAudit(req, 'CREATE', 'Hospital', hospital.id, `Registered hospital ${hospital.name}`);

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
    
    const signedLogo = hospital.logo ? await signUrl(hospital.logo) : null;
    const signedPhotos = hospital.photos ? await signHospitalPhotos(hospital.photos) : null;
    res.json({ ...hospital, logo: signedLogo, photos: signedPhotos });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update hospital' });
  }
};

export const getHospitalUsageTelemetry = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.hospitalId) return res.status(403).json({ error: 'Hospital context required' });
    res.json(await getHospitalUsage(req.user.hospitalId));
  } catch (error) {
    console.error('Hospital usage telemetry error:', error);
    res.status(500).json({ error: 'Failed to get hospital usage telemetry' });
  }
};

// Invite staff to hospital
export const inviteStaff = async (req: AuthRequest, res: Response) => {
  const hospitalId = req.user?.hospitalId;
  if (!hospitalId) return res.status(403).json({ error: 'Hospital context required' });

  const { name, role, department, password, staffTypeId, permissions, phone } = req.body;
  const email = String(req.body.email || '').trim().toLowerCase();
  if (!email) return res.status(400).json({ error: 'Staff email is required' });

  try {
    await assertCanAddUser(hospitalId);

    // Attach the role to the existing identity if the email is already known,
    // never creating a duplicate account.
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // New invitee: ensure phone (if provided) isn't taken, then create an
      // admin-vouched identity with a random password. They sign in via OTP /
      // password reset — we never store a shared default password.
      if (phone) {
        const phoneClash = await prisma.user.findUnique({ where: { phone } });
        if (phoneClash) return res.status(400).json({ error: 'Phone number already registered to another user.' });
      }
      const initialPassword = password && password.length >= 6
        ? password
        : crypto.randomBytes(24).toString('hex');
      const hashedPassword = await bcrypt.hash(initialPassword, 10);
      user = await prisma.user.create({
        data: { name, email, password: hashedPassword, phone: phone || null, isVerified: true },
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
    const msg = error?.message || 'Failed to invite staff';
    res.status(error?.message?.includes('subscription') || error?.message?.includes('Trial') || error?.message?.includes('seats') ? 402 : 500).json({ error: msg });
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
    if (membership.user && membership.user.avatar) {
      const signedAvatar = await signUrl(membership.user.avatar);
      return res.json({
        ...membership,
        user: {
          ...membership.user,
          avatar: signedAvatar,
        }
      });
    }
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
    const signedMemberships = await Promise.all(memberships.map(async (m) => {
      if (m.user && m.user.avatar) {
        return {
          ...m,
          user: {
            ...m.user,
            avatar: await signUrl(m.user.avatar),
          }
        };
      }
      return m;
    }));
    res.json(signedMemberships);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get staff' });
  }
};
