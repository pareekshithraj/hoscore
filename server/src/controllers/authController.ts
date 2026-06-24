import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../index.js';
import { permissionsForRole } from '../utils/features.js';
import { signUrl } from '../services/r2.js';

const JWT_SECRET = process.env.JWT_SECRET || 'hoscore-development-secret-key-32chars';

interface ContextItem {
  type: 'hospital' | 'patient' | 'superadmin';
  hospitalId?: string;
  hospitalName?: string;
  role?: string;
  department?: string;
  permissions?: string[];
  staffTypeId?: string;
  staffTypeName?: string;
}

// Build all available contexts for a user
async function buildUserContexts(userId: string, isSuperAdmin: boolean, hasPatientProfile: boolean): Promise<ContextItem[]> {
  const contexts: ContextItem[] = [];

  // Super admin context
  if (isSuperAdmin) {
    contexts.push({ type: 'superadmin', role: 'SUPER_ADMIN' });
  }

  // Hospital memberships
  const memberships = await prisma.membership.findMany({
    where: { userId, status: 'ACTIVE' },
    include: { hospital: { select: { id: true, name: true } }, staffType: true },
  });

  for (const m of memberships) {
    contexts.push({
      type: 'hospital',
      hospitalId: m.hospital.id,
      hospitalName: m.hospital.name,
      role: m.role,
      department: m.department,
      permissions: permissionsForRole(m.role, m.permissions || m.staffType?.permissions),
      staffTypeId: m.staffTypeId || undefined,
      staffTypeName: m.staffType?.name,
    });
  }

  // Patient context
  if (hasPatientProfile) {
    contexts.push({ type: 'patient', role: 'PATIENT' });
  }

  return contexts;
}

export const register = async (req: Request, res: Response) => {
  const { name, email, password, phone, registerAs } = req.body;
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
      },
    });

    // If registering as a patient, create patient profile
    if (registerAs === 'patient') {
      let uniqueId = '';
      let isUnique = false;
      while (!isUnique) {
        uniqueId = Math.floor(100000 + Math.random() * 900000).toString();
        const existing = await prisma.patient.findUnique({ where: { sixDigitId: uniqueId } });
        if (!existing) isUnique = true;
      }
      await prisma.patient.create({
        data: {
          userId: user.id,
          name: user.name,
          email: user.email,
          contact: phone,
          sixDigitId: uniqueId,
        },
      });
    }

    const contexts = await buildUserContexts(user.id, user.isSuperAdmin, registerAs === 'patient');
    const defaultContext = contexts[0] || { type: 'patient' };

    const token = jwt.sign(
      {
        userId: user.id,
        name: user.name,
        email: user.email,
        isSuperAdmin: user.isSuperAdmin,
        contextType: defaultContext.type,
        hospitalId: defaultContext.hospitalId || null,
        role: defaultContext.role || 'PATIENT',
        permissions: defaultContext.permissions || permissionsForRole(defaultContext.role),
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isSuperAdmin: user.isSuperAdmin,
      },
      contexts,
      activeContext: defaultContext,
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { patientProfile: true },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const hasPatientProfile = !!user.patientProfile;
    const contexts = await buildUserContexts(user.id, user.isSuperAdmin, hasPatientProfile);

    // Default to first context
    const defaultContext = contexts[0] || { type: 'patient', role: 'PATIENT' };

    const token = jwt.sign(
      {
        userId: user.id,
        name: user.name,
        email: user.email,
        isSuperAdmin: user.isSuperAdmin,
        contextType: defaultContext.type,
        hospitalId: defaultContext.hospitalId || null,
        role: defaultContext.role || 'PATIENT',
        permissions: defaultContext.permissions || permissionsForRole(defaultContext.role),
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isSuperAdmin: user.isSuperAdmin,
      },
      contexts,
      activeContext: defaultContext,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

export const switchContext = async (req: Request, res: Response) => {
  const { contextType, hospitalId } = req.body;
  const userId = (req as any).user?.userId;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { patientProfile: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    let role = 'PATIENT';
    let activeHospitalId: string | null = null;
    let permissions: string[] = [];

    if (contextType === 'superadmin' && user.isSuperAdmin) {
      role = 'SUPER_ADMIN';
      permissions = permissionsForRole(role);
    } else if (contextType === 'hospital' && hospitalId) {
      const membership = await prisma.membership.findFirst({
        where: { userId, hospitalId, status: 'ACTIVE' },
        include: { staffType: true },
      });
      if (!membership) return res.status(403).json({ error: 'No access to this hospital' });
      role = membership.role;
      activeHospitalId = hospitalId;
      permissions = permissionsForRole(role, membership.permissions || membership.staffType?.permissions);
    } else if (contextType === 'patient') {
      role = 'PATIENT';
      permissions = [];
    }

    const token = jwt.sign(
      {
        userId: user.id,
        name: user.name,
        email: user.email,
        isSuperAdmin: user.isSuperAdmin,
        contextType,
        hospitalId: activeHospitalId,
        role,
        permissions,
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      activeContext: {
        type: contextType,
        hospitalId: activeHospitalId,
        role,
        permissions,
      },
    });
  } catch (error) {
    console.error('Switch context error:', error);
    res.status(500).json({ error: 'Failed to switch context' });
  }
};

export const getMyContexts = async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { patientProfile: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const contexts = await buildUserContexts(user.id, user.isSuperAdmin, !!user.patientProfile);
    res.json({ contexts });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get contexts' });
  }
};

export const getMe = async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, phone: true, isSuperAdmin: true, avatar: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const signedAvatar = user.avatar ? await signUrl(user.avatar) : null;
    res.json({ ...user, avatar: signedAvatar });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user' });
  }
};

export const sendOtp = async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(404).json({ error: 'No user registered with this email' });
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await prisma.user.update({
      where: { id: user.id },
      data: {
        otpCode: otp,
        otpExpiresAt: expires
      }
    });

    // Mock Send: log to server console
    console.log(`\n==================================================`);
    console.log(`[SMS/Email Gateway Mock] OTP for ${email} is: ${otp}`);
    console.log(`==================================================\n`);

    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  const { email, otpCode } = req.body;
  if (!email || !otpCode) return res.status(400).json({ error: 'Email and OTP code are required' });

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { patientProfile: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.otpCode || user.otpCode !== otpCode) {
      return res.status(401).json({ error: 'Invalid OTP code' });
    }

    if (!user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      return res.status(401).json({ error: 'OTP code has expired' });
    }

    // Clear OTP on success
    await prisma.user.update({
      where: { id: user.id },
      data: {
        otpCode: null,
        otpExpiresAt: null
      }
    });

    const hasPatientProfile = !!user.patientProfile;
    const contexts = await buildUserContexts(user.id, user.isSuperAdmin, hasPatientProfile);
    const defaultContext = contexts[0] || { type: 'patient', role: 'PATIENT' };

    const token = jwt.sign(
      {
        userId: user.id,
        name: user.name,
        email: user.email,
        isSuperAdmin: user.isSuperAdmin,
        contextType: defaultContext.type,
        hospitalId: defaultContext.hospitalId || null,
        role: defaultContext.role || 'PATIENT',
        permissions: defaultContext.permissions || permissionsForRole(defaultContext.role),
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isSuperAdmin: user.isSuperAdmin,
      },
      contexts,
      activeContext: defaultContext,
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
};
