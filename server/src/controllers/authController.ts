import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { AuthChallenge, User } from '@prisma/client';
import { prisma } from '../index.js';
import { permissionsForRole } from '../utils/features.js';
import { signUrl } from '../services/r2.js';
import { sendSmsOtp, sendMsg91Email } from '../services/msg91.js';
import {
  generateOtp,
  hashOtp,
  verifyOtpHash,
  otpExpiry,
  smsTargetFromPhone,
  OTP_RESEND_COOLDOWN_MS,
  OTP_MAX_ATTEMPTS,
  OTP_TTL_MS,
} from '../utils/otp.js';
import { normalizePhone } from '../utils/phone.js';

const JWT_SECRET = process.env.JWT_SECRET as string;
// Every 90 days a user must re-verify both phone and email (spec requirement).
const OTP_REVERIFY_WINDOW_MS = 90 * 24 * 60 * 60 * 1000;

type ChallengePurpose = 'register' | 'login' | 'reset_password';
type ChallengeChannel = 'email' | 'phone';

interface ChallengeSummary {
  challengeId: string;
  purpose: ChallengePurpose;
  email: string;
  phone: string | null;
  requiredChannels: { email: boolean; phone: boolean };
  verifiedChannels: { email: boolean; phone: boolean };
  expiresAt: string;
  warnings: string[];
}

type ChallengeIssue = { error: string; status: number };
type ChallengeSuccess = { challenge: AuthChallenge };
type ChallengeResult = ChallengeIssue | ChallengeSuccess;
type LoadedChallenge = { challenge: AuthChallenge & { user: User } } | ChallengeIssue;

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

const normalizeEmail = (email: string) => email.trim().toLowerCase();

function normalizeIdentifier(identifier: string): string {
  return String(identifier || '').trim();
}

function maskPhone(phone: string | null | undefined): string | null {
  const digits = String(phone || '').replace(/[^\d]/g, '');
  if (digits.length < 4) return phone || null;
  return `${'*'.repeat(Math.max(0, digits.length - 4))}${digits.slice(-4)}`;
}

function challengeWarnings(challenge: AuthChallenge): string[] {
  const warnings: string[] = [];
  if (challenge.smsFallback) {
    warnings.push('SMS OTP is unavailable right now. Continue with email verification.');
  }
  if (challenge.emailFallback) {
    warnings.push('Email OTP is unavailable right now. Continue with phone verification.');
  }
  return warnings;
}

function hasChallengeIssue(result: ChallengeResult | LoadedChallenge): result is ChallengeIssue {
  return 'error' in result;
}

function buildChallengeSummary(challenge: AuthChallenge, user: Pick<User, 'email' | 'phone'>): ChallengeSummary {
  return {
    challengeId: challenge.id,
    purpose: challenge.purpose as ChallengePurpose,
    email: user.email,
    phone: maskPhone(user.phone),
    requiredChannels: {
      email: challenge.requireEmail,
      phone: challenge.requirePhone,
    },
    verifiedChannels: {
      email: challenge.emailVerified,
      phone: challenge.phoneVerified,
    },
    expiresAt: challenge.expiresAt.toISOString(),
    warnings: challengeWarnings(challenge),
  };
}

function challengePurposeCopy(purpose: ChallengePurpose) {
  if (purpose === 'register') {
    return {
      emailSubject: 'Your HOSCORE email verification code',
      emailIntro: 'Use this code to verify your HOSCORE account.',
      smsText: 'Use this OTP to verify your HOSCORE account.',
    };
  }
  if (purpose === 'reset_password') {
    return {
      emailSubject: 'Your HOSCORE password reset code',
      emailIntro: 'Use this code to reset your HOSCORE password.',
      smsText: 'Use this OTP to reset your HOSCORE password.',
    };
  }
  return {
    emailSubject: 'Your HOSCORE login verification code',
    emailIntro: 'Use this code to complete your HOSCORE login.',
    smsText: 'Use this OTP to complete your HOSCORE login.',
  };
}

async function findUserByPhone(phone: string | null | undefined) {
  const normalized = normalizePhone(phone);
  if (!normalized) return null;

  const users = await prisma.user.findMany({
    where: { phone: { not: null } },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      password: true,
      isVerified: true,
      emailVerifiedAt: true,
      phoneVerifiedAt: true,
      lastOtpVerifiedAt: true,
    },
  });

  return users.find((user) => normalizePhone(user.phone) === normalized) || null;
}

async function findUserByIdentifier(identifier: string) {
  const raw = normalizeIdentifier(identifier);
  if (!raw) return null;
  return raw.includes('@')
    ? prisma.user.findUnique({
      where: { email: raw.toLowerCase() },
    })
    : findUserByPhone(raw);
}

function needsOtpStepUp(user: Pick<User, 'lastOtpVerifiedAt'>): boolean {
  if (!user.lastOtpVerifiedAt) return true;
  return Date.now() - user.lastOtpVerifiedAt.getTime() >= OTP_REVERIFY_WINDOW_MS;
}

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

async function buildUserContexts(userId: string, isSuperAdmin: boolean, hasPatientProfile: boolean): Promise<ContextItem[]> {
  const contexts: ContextItem[] = [];

  if (isSuperAdmin) {
    contexts.push({ type: 'superadmin', role: 'SUPER_ADMIN' });
  }

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

  if (hasPatientProfile) {
    contexts.push({ type: 'patient', role: 'PATIENT' });
  }

  return contexts;
}

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

async function createChallenge(
  user: Pick<User, 'id' | 'name' | 'email' | 'phone'>,
  purpose: ChallengePurpose,
  requestedChannels: { email: boolean; phone: boolean }
): Promise<ChallengeResult> {
  const existing = await prisma.authChallenge.findFirst({
    where: { userId: user.id, purpose, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  });

  if (existing && Date.now() - existing.updatedAt.getTime() < OTP_RESEND_COOLDOWN_MS) {
    const wait = Math.ceil((OTP_RESEND_COOLDOWN_MS - (Date.now() - existing.updatedAt.getTime())) / 1000);
    return { error: `Please wait ${wait}s before requesting another code.`, status: 429 as const };
  }

  const copy = challengePurposeCopy(purpose);
  const emailOtp = requestedChannels.email ? generateOtp() : null;
  const phoneOtp = requestedChannels.phone ? generateOtp() : null;

  let emailDelivered = false;
  if (emailOtp) {
    emailDelivered = await sendMsg91Email({
      to: user.email,
      toName: user.name,
      subject: `${copy.emailSubject}: ${emailOtp}`,
      html: `
        <div style="font-family:system-ui;max-width:480px;margin:auto;padding:32px;background:#f8fafc;border-radius:24px">
          <h2 style="color:#1e293b;text-align:center;margin:0 0 8px">Verification Code</h2>
          <p style="color:#64748b;text-align:center;margin:0 0 20px">${copy.emailIntro} It expires in 5 minutes.</p>
          <div style="background:#2563eb;color:white;border-radius:16px;padding:20px;text-align:center;letter-spacing:8px;font-size:36px;font-weight:900">${emailOtp}</div>
        </div>`,
    });
  }

  const smsTarget = requestedChannels.phone ? smsTargetFromPhone(user.phone) : null;
  let phoneDelivered = false;
  if (phoneOtp && smsTarget) {
    phoneDelivered = await sendSmsOtp(smsTarget, phoneOtp);
  }

  const requireEmail = requestedChannels.email && emailDelivered;
  const requirePhone = requestedChannels.phone && phoneDelivered;
  const emailFallback = requestedChannels.email && !emailDelivered;
  const smsFallback = requestedChannels.phone && !phoneDelivered;

  if (!requireEmail && !requirePhone) {
    return { error: 'Could not deliver a verification code. Please try again.', status: 502 as const };
  }

  await prisma.authChallenge.deleteMany({ where: { userId: user.id, purpose } });

  const challenge = await prisma.authChallenge.create({
    data: {
      userId: user.id,
      purpose,
      emailOtpCode: requireEmail && emailOtp ? hashOtp(emailOtp) : null,
      emailOtpExpiresAt: requireEmail ? otpExpiry() : null,
      phoneOtpCode: requirePhone && phoneOtp ? hashOtp(phoneOtp) : null,
      phoneOtpExpiresAt: requirePhone ? otpExpiry() : null,
      requireEmail,
      requirePhone,
      emailFallback,
      smsFallback,
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    },
  });

  return { challenge };
}

async function finalizeChallenge(user: User, challenge: AuthChallenge) {
  const now = new Date();

  await prisma.authChallenge.delete({ where: { id: challenge.id } });

  if (challenge.purpose === 'reset_password') {
    const resetToken = jwt.sign(
      { userId: user.id, purpose: 'password_reset' },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastOtpVerifiedAt: now,
        emailVerifiedAt: challenge.emailVerified ? now : user.emailVerifiedAt,
        phoneVerifiedAt: challenge.phoneVerified ? now : user.phoneVerifiedAt,
      },
    });

    return { resetToken };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      isVerified: true,
      emailVerifiedAt: challenge.emailVerified ? now : user.emailVerifiedAt,
      phoneVerifiedAt: challenge.phoneVerified ? now : user.phoneVerifiedAt,
      lastOtpVerifiedAt: now,
    },
  });

  await ensurePatientProfile(user);
  return buildSession(user.id);
}

async function getChallengeOrError(challengeId: string) {
  const challenge = await prisma.authChallenge.findUnique({
    where: { id: challengeId },
    include: { user: true },
  });

  if (!challenge) {
    return { error: 'Verification request not found. Please start again.', status: 404 as const };
  }

  if (challenge.expiresAt < new Date()) {
    await prisma.authChallenge.delete({ where: { id: challenge.id } }).catch(() => undefined);
    return { error: 'Verification request expired. Please request a new code.', status: 410 as const };
  }

  return { challenge } satisfies LoadedChallenge;
}

export const register = async (req: Request, res: Response) => {
  const { name, password, phone } = req.body;
  const email = normalizeEmail(req.body.email);
  const normalizedPhone = normalizePhone(phone);
  const phoneValue = normalizedPhone || null;

  try {
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail?.isVerified) {
      return res.status(400).json({ error: 'Email already registered. Please log in instead.' });
    }

    const existingPhone = phoneValue ? await findUserByPhone(phoneValue) : null;
    if (existingPhone && existingPhone.id !== existingEmail?.id && existingPhone.isVerified) {
      return res.status(400).json({ error: 'Phone number already registered. Please log in instead.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = existingEmail
      ? await prisma.user.update({
        where: { id: existingEmail.id },
        data: { name, email, password: hashedPassword, phone: phoneValue, isVerified: false },
      })
      : existingPhone && !existingPhone.isVerified
        ? await prisma.user.update({
          where: { id: existingPhone.id },
          data: { name, email, password: hashedPassword, phone: phoneValue, isVerified: false },
        })
        : await prisma.user.create({
          data: { name, email, password: hashedPassword, phone: phoneValue, isVerified: false },
        });

    const issued = await createChallenge(user, 'register', { email: true, phone: Boolean(user.phone) });
    if (hasChallengeIssue(issued)) {
      return res.status(issued.status).json({ error: issued.error });
    }

    return res.status(201).json({
      message: 'Verification codes sent. Verify each required channel to continue.',
      requiresOtp: true,
      challenge: buildChallengeSummary(issued.challenge, user),
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Registration failed' });
  }
};

export const login = async (req: Request, res: Response) => {
  const { identifier, password } = req.body;

  try {
    const user = await findUserByIdentifier(identifier);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.isVerified) {
      const issued = await createChallenge(user, 'register', { email: true, phone: Boolean(user.phone) });
      if (hasChallengeIssue(issued)) {
        return res.status(issued.status).json({ error: issued.error });
      }

      return res.status(403).json({
        error: 'Account not verified. Verify the required channels to continue.',
        isUnverified: true,
        requiresOtp: true,
        challenge: buildChallengeSummary(issued.challenge, user),
      });
    }

    if (needsOtpStepUp(user)) {
      const issued = await createChallenge(user, 'login', { email: true, phone: Boolean(user.phone) });
      if (hasChallengeIssue(issued)) {
        return res.status(issued.status).json({ error: issued.error });
      }

      return res.status(200).json({
        requiresOtp: true,
        challenge: buildChallengeSummary(issued.challenge, user),
        message: 'Verify the required OTP codes to complete sign in.',
      });
    }

    const session = await buildSession(user.id);
    return res.json(session);
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Login failed' });
  }
};

export const startOtpLogin = async (req: Request, res: Response) => {
  const identifier = normalizeIdentifier(req.body.identifier);

  try {
    const user = await findUserByIdentifier(identifier);
    if (!user) {
      return res.status(404).json({ error: 'No account found for that email or phone number.' });
    }

    const purpose: ChallengePurpose = user.isVerified ? 'login' : 'register';
    const issued = await createChallenge(user, purpose, { email: true, phone: Boolean(user.phone) });
    if (hasChallengeIssue(issued)) {
      return res.status(issued.status).json({ error: issued.error });
    }

    return res.json({
      requiresOtp: true,
      challenge: buildChallengeSummary(issued.challenge, user),
      message: 'Verification codes sent. Verify each required channel to continue.',
    });
  } catch (error) {
    console.error('OTP login start error:', error);
    return res.status(500).json({ error: 'Failed to start OTP login' });
  }
};

export const resendOtp = async (req: Request, res: Response) => {
  const challengeId = String(req.body.challengeId || '').trim();

  try {
    const loaded = await getChallengeOrError(challengeId);
    if (hasChallengeIssue(loaded)) {
      return res.status(loaded.status).json({ error: loaded.error });
    }

    const { challenge } = loaded;
    const issued = await createChallenge(challenge.user, challenge.purpose as ChallengePurpose, {
      email: challenge.requireEmail || challenge.emailFallback,
      phone: challenge.requirePhone || challenge.smsFallback,
    });
    if (hasChallengeIssue(issued)) {
      return res.status(issued.status).json({ error: issued.error });
    }

    return res.json({
      message: 'Verification codes resent.',
      challenge: buildChallengeSummary(issued.challenge, challenge.user),
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    return res.status(500).json({ error: 'Failed to resend OTP' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  const identifier = normalizeIdentifier(req.body.identifier);

  try {
    const user = await findUserByIdentifier(identifier);
    if (!user) {
      return res.status(404).json({ error: 'No account found for that email or phone number.' });
    }

    // Spec: password recovery verifies the registered EMAIL only.
    const issued = await createChallenge(user, 'reset_password', { email: true, phone: false });
    if (hasChallengeIssue(issued)) {
      return res.status(issued.status).json({ error: issued.error });
    }

    return res.json({
      requiresOtp: true,
      challenge: buildChallengeSummary(issued.challenge, user),
      message: 'A verification code has been sent to your registered email.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ error: 'Failed to start password reset' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const resetToken = String(req.body.resetToken || '').trim();
  const password = String(req.body.password || '');

  try {
    const payload = jwt.verify(resetToken, JWT_SECRET) as { userId?: string; purpose?: string };
    if (!payload?.userId || payload.purpose !== 'password_reset') {
      return res.status(401).json({ error: 'Invalid reset token' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: payload.userId },
      data: { password: hashedPassword },
    });

    return res.json({ message: 'Password updated successfully. You can log in now.' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(401).json({ error: 'Reset token expired or invalid' });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  const challengeId = String(req.body.challengeId || '').trim();
  const channel = String(req.body.channel || '').trim() as ChallengeChannel;
  const otpCode = String(req.body.otpCode || '').trim();

  try {
    const loaded = await getChallengeOrError(challengeId);
    if (hasChallengeIssue(loaded)) {
      return res.status(loaded.status).json({ error: loaded.error });
    }

    const { challenge } = loaded;
    if (channel !== 'email' && channel !== 'phone') {
      return res.status(400).json({ error: 'Invalid verification channel' });
    }

    const required = channel === 'email' ? challenge.requireEmail : challenge.requirePhone;
    const alreadyVerified = channel === 'email' ? challenge.emailVerified : challenge.phoneVerified;
    const storedHash = channel === 'email' ? challenge.emailOtpCode : challenge.phoneOtpCode;
    const expiresAt = channel === 'email' ? challenge.emailOtpExpiresAt : challenge.phoneOtpExpiresAt;
    const attempts = channel === 'email' ? challenge.emailOtpAttempts : challenge.phoneOtpAttempts;

    if (!required) {
      return res.status(400).json({ error: `${channel === 'email' ? 'Email' : 'Phone'} verification is not required for this request.` });
    }

    if (alreadyVerified) {
      const summary = buildChallengeSummary(challenge, challenge.user);
      return res.json({ challenge: summary, message: `${channel === 'email' ? 'Email' : 'Phone'} already verified.` });
    }

    if (!storedHash || !expiresAt || expiresAt < new Date()) {
      return res.status(401).json({ error: 'OTP code expired. Please request a new code.' });
    }

    if (attempts >= OTP_MAX_ATTEMPTS) {
      return res.status(429).json({ error: 'Too many incorrect attempts. Please request a new code.' });
    }

    if (!verifyOtpHash(otpCode, storedHash)) {
      await prisma.authChallenge.update({
        where: { id: challenge.id },
        data: channel === 'email'
          ? { emailOtpAttempts: { increment: 1 } }
          : { phoneOtpAttempts: { increment: 1 } },
      });
      return res.status(401).json({ error: 'Invalid OTP code' });
    }

    const updated = await prisma.authChallenge.update({
      where: { id: challenge.id },
      data: channel === 'email'
        ? {
          emailVerified: true,
          emailOtpCode: null,
          emailOtpExpiresAt: null,
          emailOtpAttempts: 0,
        }
        : {
          phoneVerified: true,
          phoneOtpCode: null,
          phoneOtpExpiresAt: null,
          phoneOtpAttempts: 0,
        },
      include: { user: true },
    });

    const complete = (!updated.requireEmail || updated.emailVerified) && (!updated.requirePhone || updated.phoneVerified);
    if (!complete) {
      return res.json({
        message: `${channel === 'email' ? 'Email' : 'Phone'} verified. Verify the remaining channel to continue.`,
        challenge: buildChallengeSummary(updated, updated.user),
      });
    }

    const result = await finalizeChallenge(updated.user, updated);
    if (!result) {
      return res.status(500).json({ error: 'Failed to complete verification' });
    }

    if ('resetToken' in result) {
      return res.json({
        message: 'Verification complete. Set your new password.',
        resetToken: result.resetToken,
      });
    }

    return res.json(result);
  } catch (error) {
    console.error('Verify OTP error:', error);
    return res.status(500).json({ error: 'Verification failed' });
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

    return res.json({
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
    return res.status(500).json({ error: 'Failed to switch context' });
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
    return res.json({ contexts });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to get contexts' });
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
    return res.json({ ...user, avatar: signedAvatar });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to get user' });
  }
};
