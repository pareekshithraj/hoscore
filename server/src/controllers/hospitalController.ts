import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { prisma } from '../index.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';
import { ALL_FEATURES, permissionsForRole } from '../utils/features.js';
import { logAudit } from '../utils/auditLogger.js';
import { getHospitalUsage } from '../services/usagePricing.js';
import {
  assertCanAddUser,
} from '../services/subscriptionService.js';
import { signUrl, signHospitalPhotos } from '../services/r2.js';
import { createChallenge, buildSession } from './authController.js';
import { pick } from '../utils/pick.js';
import { parseDateSafe } from '../utils/dateUtils.js';


const getJwtSecret = () => process.env.JWT_SECRET || 'hoscore-development-secret-key-32chars';


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

// Register a new hospital (self-service or authenticated)
// Initiate unauthenticated hospital registration -> creates user (unverified), stashes payload, returns OTP challenge
export const initiateHospitalRegistration = async (req: Request, res: Response) => {
  const { hospitalName, address, country, city, state, contact, description, adminName, adminEmail, adminPassword, adminPhone } = req.body;
  const cleanEmail = String(adminEmail || '').trim().toLowerCase();

  if (!cleanEmail || !adminPassword || !adminName || !hospitalName) {
    return res.status(400).json({ error: 'Hospital name, admin name, email, and password are required.' });
  }

  try {
    let user = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (user) {
      const isMatch = await bcrypt.compare(adminPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: 'An account with this email already exists. Please log in first or check your password.' });
      }
    } else {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      user = await prisma.user.create({
        data: {
          name: adminName,
          email: cleanEmail,
          password: hashedPassword,
          phone: adminPhone || null,
          isActive: true,
          isVerified: false,
        },
      });
    }

    const pendingHospitalToken = jwt.sign(
      {
        hospitalName,
        address,
        country,
        city,
        state,
        contact,
        description,
        userId: user.id,
      },
      getJwtSecret(),
      { expiresIn: '30m' }
    );

    const challengeRes = await createChallenge(user, 'register', { email: true, phone: Boolean(user.phone) });
    if ('error' in challengeRes) {
      return res.status(challengeRes.status || 400).json({ error: challengeRes.error });
    }

    return res.status(200).json({
      message: 'Hospital registration initiated. Verify OTP to complete.',
      challenge: challengeRes.challenge,
      pendingHospitalToken,
    });
  } catch (error: any) {
    console.error('Initiate hospital registration error:', error);
    return res.status(500).json({ error: 'Failed to initiate hospital registration' });
  }
};

// Complete unauthenticated hospital registration after OTP verification
export const completeHospitalRegistration = async (req: Request, res: Response) => {
  const { challengeId, pendingHospitalToken } = req.body;

  if (!challengeId || !pendingHospitalToken) {
    return res.status(400).json({ error: 'Challenge ID and pending hospital token are required.' });
  }

  try {
    let decoded: any;
    try {
      decoded = jwt.verify(pendingHospitalToken, getJwtSecret());
    } catch {
      return res.status(400).json({ error: 'Invalid or expired hospital registration session. Please start again.' });
    }

    const challenge = await prisma.authChallenge.findUnique({
      where: { id: challengeId },
      include: { user: true },
    });

    if (!challenge || challenge.userId !== decoded.userId) {
      return res.status(400).json({ error: 'Invalid challenge or registration mismatch.' });
    }

    const isFullyVerified = (!challenge.requireEmail || challenge.emailVerified) && (!challenge.requirePhone || challenge.phoneVerified);
    if (!isFullyVerified) {
      return res.status(400).json({ error: 'OTP verification is incomplete. Please verify all required channels.' });
    }

    const user = challenge.user;

    // Deduplicate hospital creation
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
    let hospital = await prisma.hospital.findFirst({
      where: {
        name: { equals: decoded.hospitalName, mode: 'insensitive' },
        createdAt: { gte: fiveMinsAgo },
        memberships: { some: { userId: user.id, role: 'ADMIN' } },
      },
    });

    if (!hospital) {
      const baseSlug = decoded.hospitalName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      let slug = baseSlug || 'hospital';
      let counter = 1;
      while (await prisma.hospital.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${counter++}`;
      }

      hospital = await prisma.hospital.create({
        data: {
          name: decoded.hospitalName,
          slug,
          address: decoded.address,
          country: decoded.country,
          city: decoded.city,
          state: decoded.state,
          contact: decoded.contact,
          description: decoded.description,
          isPartnered: true,
          isActive: true,
        },
      });

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

      await logAudit(req, 'CREATE', 'Hospital', hospital.id, `Registered hospital ${hospital.name} after OTP verification`);
    }

    // Delete completed challenge and mark user verified
    await prisma.authChallenge.delete({ where: { id: challenge.id } }).catch(() => undefined);
    await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, emailVerifiedAt: new Date(), lastOtpVerifiedAt: new Date() },
    });

    const session = await buildSession(user.id);
    return res.status(201).json({
      message: 'Hospital registration completed successfully',
      hospital: { id: hospital.id, name: hospital.name, slug: hospital.slug },
      ...session,
    });
  } catch (error: any) {
    console.error('Complete hospital registration error:', error);
    return res.status(500).json({ error: 'Failed to complete hospital registration' });
  }
};

// Register a new hospital (authenticated path requires password confirm)
export const registerHospital = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  const { hospitalName, address, country, city, state, contact, description, adminName, adminEmail, adminPassword, adminPhone } = req.body;

  try {
    let user;
    if (userId) {
      user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return res.status(404).json({ error: 'User not found' });
      if (adminPassword) {
        const isMatch = await bcrypt.compare(adminPassword, user.password);
        if (!isMatch) {
          return res.status(401).json({ error: 'Incorrect password. Password verification required to register hospital.' });
        }
      }
    } else {
      const cleanEmail = String(adminEmail || '').trim().toLowerCase();
      if (!cleanEmail || !adminPassword || !adminName) {
        return res.status(400).json({ error: 'Admin name, email, and password are required for hospital registration.' });
      }
      if (adminPassword.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters.' });
      }

      const existingUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
      if (existingUser) {
        const isMatch = await bcrypt.compare(adminPassword, existingUser.password);
        if (!isMatch) {
          return res.status(400).json({ error: 'An account with this email already exists. Please log in first or check your password.' });
        }
        user = existingUser;
      } else {
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        user = await prisma.user.create({
          data: {
            name: adminName,
            email: cleanEmail,
            password: hashedPassword,
            phone: adminPhone || null,
            isActive: true,
          },
        });
      }
    }

    // Deduplicate hospital creation if registered by same user within 5 mins
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
    const existingHospital = await prisma.hospital.findFirst({
      where: {
        name: { equals: hospitalName, mode: 'insensitive' },
        createdAt: { gte: fiveMinsAgo },
        memberships: { some: { userId: user.id, role: 'ADMIN' } },
      },
    });
    if (existingHospital) {
      return res.status(200).json({
        message: 'Hospital registered successfully',
        hospital: { id: existingHospital.id, name: existingHospital.name, slug: existingHospital.slug },
      });
    }

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

    // Attach the ADMIN membership to the identity; avoid duplicates if already attached
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
    const safeData = pick(req.body, [
      'name', 'address', 'country', 'city', 'state', 'contact', 'description', 'logo', 'photos',
    ]);

    const hospital = await prisma.hospital.update({
      where: { id: hospitalId },
      data: safeData,
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
      // Fix 4: If phone number belongs to an existing account, attach membership to that user
      if (phone) {
        const phoneClash = await prisma.user.findUnique({ where: { phone } });
        if (phoneClash) {
          user = phoneClash;
        }
      }
      if (!user) {
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

function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 8 * 60;
  const cleanStr = timeStr.trim();
  const isPM = /pm/i.test(cleanStr);
  const isAM = /am/i.test(cleanStr);
  const timeWithoutAmPm = cleanStr.replace(/(am|pm)/i, '').trim();
  const parts = timeWithoutAmPm.split(/[:\.]/);
  let hours = parseInt(parts[0] || '8', 10);
  const minutes = parseInt(parts[1] || '0', 10);

  if (isPM && hours < 12) hours += 12;
  if (isAM && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

function formatMinutesTo12Hour(totalMinutes: number): string {
  const hours24 = Math.floor(totalMinutes / 60) % 24;
  const mins = totalMinutes % 60;
  const period = hours24 >= 12 ? 'PM' : 'AM';
  let hours12 = hours24 % 12;
  if (hours12 === 0) hours12 = 12;
  const formattedHours = hours12 < 10 ? `0${hours12}` : `${hours12}`;
  const formattedMins = mins < 10 ? `0${mins}` : `${mins}`;
  return `${formattedHours}:${formattedMins} ${period}`;
}

export function normalizeTimeString(timeStr: string): string {
  const m = parseTimeToMinutes(timeStr);
  return formatMinutesTo12Hour(m);
}

export function generate30MinSlots(openTimeStr: string, closeTimeStr: string): string[] {
  const startMins = parseTimeToMinutes(openTimeStr);
  let endMins = parseTimeToMinutes(closeTimeStr);
  if (endMins <= startMins) {
    endMins = startMins + 8 * 60;
  }

  const slots: string[] = [];
  for (let m = startMins; m < endMins; m += 30) {
    slots.push(formatMinutesTo12Hour(m));
  }
  return slots;
}

export const getAvailableSlots = async (req: Request, res: Response) => {
  try {
    const { hospitalId } = req.params;
    const { date, doctorId } = req.query;

    const targetDate = parseDateSafe(date) || new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);
    const dayOfWeek = targetDate.getDay();

    const override = await prisma.schedule.findFirst({
      where: { hospitalId, date: { gte: startOfDay, lte: endOfDay } }
    });

    let isOpen = true;
    let openTime = '08:00';
    let closeTime = '20:00';

    if (override) {
      isOpen = override.isOpen;
      openTime = override.openTime || '08:00';
      closeTime = override.closeTime || '20:00';
    } else {
      const defaultSched = await prisma.defaultSchedule.findFirst({
        where: { hospitalId, dayOfWeek }
      });
      if (defaultSched) {
        isOpen = defaultSched.isOpen;
        openTime = defaultSched.openTime || '08:00';
        closeTime = defaultSched.closeTime || '20:00';
      }
    }

    if (!isOpen) {
      return res.json({ isOpen: false, openTime: 'Closed', closeTime: 'Closed', slots: [] });
    }

    const rawSlots = generate30MinSlots(openTime, closeTime);

    const apptWhere: any = {
      hospitalId,
      date: { gte: startOfDay, lte: endOfDay },
      status: { notIn: ['CANCELLED'] }
    };
    if (doctorId && typeof doctorId === 'string' && doctorId.trim()) {
      apptWhere.doctorId = doctorId;
    }

    const existingAppointments = await prisma.appointment.findMany({
      where: apptWhere,
      select: { time: true }
    });

    const bookedSet = new Set(existingAppointments.map(a => normalizeTimeString(a.time)));

    const slots = rawSlots.map(slotTime => ({
      time: slotTime,
      isBooked: bookedSet.has(normalizeTimeString(slotTime))
    }));

    res.json({
      isOpen: true,
      openTime: normalizeTimeString(openTime),
      closeTime: normalizeTimeString(closeTime),
      slots
    });
  } catch (error) {
    console.error('Error fetching available slots:', error);
    res.status(500).json({ error: 'Failed to fetch available slots' });
  }
};
