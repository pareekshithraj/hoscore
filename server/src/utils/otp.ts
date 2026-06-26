import crypto from 'crypto';

// OTP secret used to salt the stored hash. Falls back to JWT_SECRET so the app
// works without an extra env var; set OTP_SECRET to rotate independently.
const OTP_SECRET = process.env.OTP_SECRET || process.env.JWT_SECRET || '';

export const OTP_TTL_MS = 5 * 60 * 1000;        // OTP valid for 5 minutes
export const OTP_RESEND_COOLDOWN_MS = 30 * 1000; // min gap between OTP sends
export const OTP_MAX_ATTEMPTS = 5;               // failed verifies before lockout

// We never store the plaintext OTP. The DB holds SHA256(otp + secret).
export function hashOtp(otp: string): string {
  return crypto.createHash('sha256').update(`${otp}${OTP_SECRET}`).digest('hex');
}

export function generateOtp(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

// Constant-time comparison of a candidate OTP against the stored hash.
export function verifyOtpHash(candidate: string, storedHash: string | null | undefined): boolean {
  if (!storedHash) return false;
  const candidateHash = hashOtp(candidate);
  const a = Buffer.from(candidateHash);
  const b = Buffer.from(storedHash);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function otpExpiry(): Date {
  return new Date(Date.now() + OTP_TTL_MS);
}

// Normalise an Indian phone to MSG91's 91XXXXXXXXXX form when possible.
export function smsTargetFromPhone(phone: string | null | undefined): string | null {
  const digits = (phone || '').replace(/[^\d]/g, '');
  if (!digits) return null;
  if (digits.length === 10) return `91${digits}`;
  return digits;
}
