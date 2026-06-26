import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../index.js';
import { permissionsForRole } from '../utils/features.js';
import { signUrl } from '../services/r2.js';
import { sendSmsOtp, sendMsg91Email, verifyMsg91AccessToken as verifyMsg91WidgetAccessToken } from '../services/msg91.js';
import {
  generateOtp,
  hashOtp,
  verifyOtpHash,
  otpExpiry,
  smsTargetFromPhone,
  OTP_RESEND_COOLDOWN_MS,
  OTP_MAX_ATTEMPTS,
} from '../utils/otp.js';
import { normalizePhone } from '../utils/phone.js';

// No fallback — validateEnv() guarantees a strong JWT_SECRET is present at boot.
const JWT_SECRET = process.env.JWT_SECRET as string;

const normalizeEmail = (email: string) => email.trim().toLowerCase();

async function findUserByPhone(phone: string | null | undefined) {
  const normalized = normalizePhone(phone);
  if (!normalized) return null;

  const users = await prisma.user.findMany({
    where: { phone: { not: null } },
    select: { id: true, name: true, email: true, phone: true, password: true, isVerified: true },
  });

  return users.find((user) => normalizePhone(user.phone) === normalized) || null;
}

// Build a signed session token + response payload for a fully-verified user.
async function buildSession(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { patientProfile: true },
  });
  if (!user) return null;

  const contexts = await buildUserContexts(user.id, user.isSuperAdmin, !!user.patientProfile);
  const defaultContext = contexts[0] || { type: 'patient' as const, role: 'PATIENT' };

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

  return {
    token,
    user: { id: user.id, name: user.name, email: user.email, isSuperAdmin: user.isSuperAdmin },
    contexts,
    activeContext: defaultContext,
  };
}

// Generate, store (hashed) and deliver an OTP for a user via SMS + email.
// Returns false if delivery to every channel failed.
async function issueOtp(user: { id: string; email: string; name: string; phone: string | null }): Promise<boolean> {
  const otp = generateOtp();
  await prisma.user.update({
    where: { id: user.id },
    data: { otpCode: hashOtp(otp), otpExpiresAt: otpExpiry(), otpAttempts: 0, otpLastSentAt: new Date() },
  });

  const smsTarget = smsTargetFromPhone(user.phone);
  const deliveries: Promise<boolean>[] = [];
  if (smsTarget) deliveries.push(sendSmsOtp(smsTarget, otp));
  deliveries.push(
    sendMsg91Email({
      to: user.email,
      toName: user.name,
      subject: `Your HOSCORE verification code: ${otp}`,
      html: `
        <div style="font-family:system-ui;max-width:480px;margin:auto;padding:32px;background:#f8fafc;border-radius:24px">
          <h2 style="color:#1e293b;text-align:center;margin:0 0 8px">Verification Code</h2>
          <p style="color:#64748b;text-align:center;margin:0 0 20px">Use this code to verify your HOSCORE account. It expires in 5 minutes.</p>
          <div style="background:#2563eb;color:white;border-radius:16px;padding:20px;text-align:center;letter-spacing:8px;font-size:36px;font-weight:900">${otp}</div>
        </div>`,
    })
  );

  const results = await Promise.allSettled(deliveries);
  return results.some((r) => r.status === 'fulfilled' && r.value === true);
}

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
  const { name, password, phone } = req.body;
  const email = normalizeEmail(req.body.email);
  const normalizedPhone = normalizePhone(phone);
  const phoneValue = normalizedPhone || null;

  try {
    // Email collision: block only if already verified. An unverified record is
    // updated in place (never deleted) so a re-registration just refreshes it.
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail?.isVerified) {
      return res.status(400).json({ error: 'Email already registered. Please log in instead.' });
    }

    // Phone must be globally unique, but we also support reusing an unverified
    // account that already owns the same phone number so retrying signup works.
    const existingPhone = phoneValue ? await findUserByPhone(phoneValue) : null;
    if (existingPhone && existingPhone.id !== existingEmail?.id) {
      if (existingPhone.isVerified) {
        return res.status(400).json({ error: 'Phone number already registered. Please log in instead.' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the verified-pending identity, or refresh the existing unverified one.
    const user = existingEmail
      ? await prisma.user.update({
          where: { id: existingEmail.id },
          data: { name, email, password: hashedPassword, phone: phoneValue },
        })
      : existingPhone && !existingPhone.isVerified
        ? await prisma.user.update({
            where: { id: existingPhone.id },
            data: { name, email, password: hashedPassword, phone: phoneValue, isVerified: false },
          })
        : await prisma.user.create({
            data: { name, email, password: hashedPassword, phone: phoneValue, isVerified: false },
          });

    // Patient profile is created only AFTER verification (see verifyOtp), never here.
    const delivered = await issueOtp(user);
    if (!delivered) {
      return res.status(502).json({ error: 'Could not send your verification code. Please try again.' });
    }

    res.status(201).json({
      message: 'Verification code sent. Please check your email and phone.',
      requiresOtp: true,
      email: user.email,
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

// Ensure a verified user has a personal patient profile (free for every identity).
async function ensurePatientProfile(user: { id: string; name: string; email: string; phone: string | null }) {
  const existing = await prisma.patient.findUnique({ where: { userId: user.id } });
  if (existing) return;
  let sixDigitId = '';
  let unique = false;
  while (!unique) {
    sixDigitId = Math.floor(100000 + Math.random() * 900000).toString();
    const clash = await prisma.patient.findUnique({ where: { sixDigitId } });
    if (!clash) unique = true;
  }
  await prisma.patient.create({
    data: { userId: user.id, name: user.name, email: user.email, contact: user.phone, sixDigitId },
  });
}

export const login = async (req: Request, res: Response) => {
  const { identifier, password } = req.body;
  try {
    // ONE login page: accept either an email or a phone number.
    const raw = String(identifier || '').trim();
    const isEmail = raw.includes('@');
    const user = isEmail
      ? await prisma.user.findUnique({ where: { email: raw.toLowerCase() } })
      : await findUserByPhone(raw);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.isVerified) {
      // Re-issue an OTP so the client can move straight to the verify screen.
      await issueOtp(user);
      return res.status(403).json({
        error: 'Account not verified. We sent you a fresh verification code.',
        isUnverified: true,
        email: user.email,
      });
    }

    const session = await buildSession(user.id);
    res.json(session);
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
        where: { userId, hospitalId, status: 'ACTIVE', hospital: { isActive: true } },
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
  const email = normalizeEmail(String(req.body.email || ''));
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    // Don't leak which emails exist — respond the same whether or not the user is found.
    if (!user) {
      return res.json({ message: 'If an account exists, a verification code has been sent.' });
    }

    // Resend cooldown to prevent SMS/email spam.
    if (user.otpLastSentAt && Date.now() - user.otpLastSentAt.getTime() < OTP_RESEND_COOLDOWN_MS) {
      const wait = Math.ceil((OTP_RESEND_COOLDOWN_MS - (Date.now() - user.otpLastSentAt.getTime())) / 1000);
      return res.status(429).json({ error: `Please wait ${wait}s before requesting another code.` });
    }

    const delivered = await issueOtp(user);
    if (!delivered) {
      return res.status(502).json({ error: 'Failed to deliver OTP. Please try again.' });
    }

    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
};

export const verifyMsg91AccessToken = async (req: Request, res: Response) => {
  const accessToken = String(req.body.accessToken || '').trim();
  const email = normalizeEmail(String(req.body.email || ''));
  const identifier = String(req.body.identifier || '').trim();

  if (!accessToken) {
    return res.status(400).json({ error: 'Access token is required' });
  }

  try {
    const verification = await verifyMsg91WidgetAccessToken(accessToken);
    if (!verification.verified) {
      return res.status(401).json({ error: verification.error || 'OTP verification failed' });
    }

    let user = null;
    if (email) {
      user = await prisma.user.findUnique({ where: { email } });
    } else if (identifier) {
      const isEmail = identifier.includes('@');
      user = isEmail
        ? await prisma.user.findUnique({ where: { email: identifier.toLowerCase() } })
        : await findUserByPhone(identifier);
    }

    if (!user) {
      return res.status(404).json({ error: 'Account not found' });
    }

    if (!user.isVerified) {
      await prisma.user.update({
        where: { id: user.id },
        data: { isVerified: true, otpCode: null, otpExpiresAt: null, otpAttempts: 0 },
      });
      await ensurePatientProfile(user);
    }

    const session = await buildSession(user.id);
    res.json({ message: 'OTP verified successfully', ...session });
  } catch (error) {
    console.error('MSG91 widget verification error:', error);
    res.status(500).json({ error: 'Failed to verify OTP widget access token' });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  const email = normalizeEmail(String(req.body.email || ''));
  const otpCode = String(req.body.otpCode || '').trim();
  if (!email || !otpCode) return res.status(400).json({ error: 'Email and OTP code are required' });

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid OTP code' });

    // Single-use: no active OTP on record means it was already consumed or never issued.
    if (!user.otpCode || !user.otpExpiresAt) {
      return res.status(401).json({ error: 'No active code. Please request a new one.' });
    }

    if (user.otpExpiresAt < new Date()) {
      return res.status(401).json({ error: 'OTP code has expired. Please request a new one.' });
    }

    if (user.otpAttempts >= OTP_MAX_ATTEMPTS) {
      return res.status(429).json({ error: 'Too many incorrect attempts. Please request a new code.' });
    }

    if (!verifyOtpHash(otpCode, user.otpCode)) {
      await prisma.user.update({
        where: { id: user.id },
        data: { otpAttempts: { increment: 1 } },
      });
      return res.status(401).json({ error: 'Invalid OTP code' });
    }

    // Success: mark verified and consume the OTP atomically (single-use).
    await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, otpCode: null, otpExpiresAt: null, otpAttempts: 0 },
    });

    // Every verified identity owns a free personal patient dashboard.
    await ensurePatientProfile(user);

    const session = await buildSession(user.id);
    res.json(session);
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
};
