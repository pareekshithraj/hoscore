import { z } from 'zod';

// Authentication
// ONE login page: identifier may be an email OR a phone number.
export const loginSchema = z.object({
  identifier: z.string().min(3, 'Enter your email or phone number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const otpLoginSchema = z.object({
  identifier: z.string().min(3, 'Enter your email or phone number'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().min(10, 'Valid phone number required'),
});

export const verifyOtpSchema = z.object({
  challengeId: z.string().uuid('Invalid challenge ID'),
  channel: z.enum(['email', 'phone']),
  otpCode: z.string().regex(/^\d{6}$/, 'OTP must be 6 digits'),
});

export const resendOtpSchema = z.object({
  challengeId: z.string().uuid('Invalid challenge ID'),
});

export const forgotPasswordSchema = z.object({
  identifier: z.string().min(3, 'Enter your email or phone number'),
});

export const resetPasswordSchema = z.object({
  resetToken: z.string().min(20, 'Reset token is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// Hospital Registration — the admin is the authenticated user, so no admin account
// fields are accepted here. Any legacy admin* fields in the body are ignored.
export const hospitalRegisterSchema = z.object({
  hospitalName: z.string().min(3, 'Hospital name must be at least 3 characters'),
  address: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  contact: z.string().optional(),
  description: z.string().optional(),
}).passthrough();

// Appointment Booking
export const appointmentSchema = z.object({
  hospitalId: z.string().uuid('Invalid hospital ID'),
  patientName: z.string().min(2, 'Patient name required'),
  email: z.string().email().optional().or(z.literal('')),
  contact: z.string().optional(),
  doctorId: z.string().optional().or(z.literal('')),
  date: z.string().min(1, 'Date required'),
  time: z.string().min(1, 'Time required'),
});

// Generic validate middleware factory
export function validate(schema: z.ZodSchema) {
  return (req: any, res: any, next: any) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`);
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }
    req.body = result.data; // Use sanitized data
    next();
  };
}
