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
  phone: z.string().optional().nullable().or(z.literal('')),
});

export const verifyOtpSchema = z.object({
  challengeId: z.string().min(1, 'Invalid challenge ID'),
  channel: z.enum(['email', 'phone']),
  otpCode: z.string().optional(),
  code: z.string().optional(),
}).refine(data => Boolean(data.otpCode || data.code), {
  message: 'OTP code is required',
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

export const verifyMsg91Schema = z.object({
  accessToken: z.string().min(1, 'Access token is required'),
  email: z.string().optional(),
  identifier: z.string().optional(),
  challengeId: z.string().optional(),
}).refine(data => Boolean(data.challengeId || data.email || data.identifier), {
  message: 'Either challengeId or email/identifier must be provided',
});

export const switchContextSchema = z.object({
  contextType: z.enum(['hospital', 'patient', 'superadmin']),
  hospitalId: z.string().optional().nullable(),
  password: z.string().min(1, 'Password is required'),
});


export const initiateHospitalRegisterSchema = z.object({
  hospitalName: z.string().min(3, 'Hospital name must be at least 3 characters'),
  address: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  contact: z.string().optional(),
  description: z.string().optional(),
  adminName: z.string().min(2, 'Admin name is required'),
  adminEmail: z.string().email('Valid admin email address required'),
  adminPassword: z.string().min(6, 'Password must be at least 6 characters'),
  adminPhone: z.string().optional(),
}).passthrough();

export const completeHospitalRegisterSchema = z.object({
  challengeId: z.string().min(1, 'Challenge ID is required'),
  pendingHospitalToken: z.string().min(1, 'Pending hospital token is required'),
});

// Hospital Registration — accepts hospital details and admin account details for public/self-service registration.
export const hospitalRegisterSchema = z.object({
  hospitalName: z.string().min(3, 'Hospital name must be at least 3 characters'),
  address: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  contact: z.string().optional(),
  description: z.string().optional(),
  adminName: z.string().optional(),
  adminEmail: z.string().optional(),
  adminPassword: z.string().optional(),
  adminPhone: z.string().optional(),
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
