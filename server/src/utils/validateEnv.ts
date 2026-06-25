/**
 * Validates environment configuration at boot.
 * - Hard-fails (process exit) on missing CRITICAL vars so we never run with an
 *   insecure default (e.g. a fallback JWT secret that would make tokens forgeable).
 * - Warns on missing OPTIONAL integrations (payments/OTP) so dev still runs, but
 *   you know those features are in mock mode.
 */
const isProd = process.env.NODE_ENV === 'production';

// Always required — the app cannot be trusted without these.
const REQUIRED: string[] = ['DATABASE_URL', 'JWT_SECRET'];

// Required only in production (real customers, real money).
const REQUIRED_IN_PROD: string[] = [
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
];

// Nice-to-have; warn only.
const OPTIONAL: string[] = [
  'CLIENT_URL',
  'R2_BUCKET_NAME',
  'MSG91_AUTHKEY',
  'MSG91_TEMPLATE_ID',
  'MSG91_FROM_EMAIL',
  'RAZORPAY_WEBHOOK_SECRET',
];

export function validateEnv() {
  const missingCritical: string[] = [];
  const missingProd: string[] = [];
  const missingOptional: string[] = [];

  for (const key of REQUIRED) {
    if (!process.env[key] || process.env[key]!.trim() === '') missingCritical.push(key);
  }

  // Reject an insecure JWT secret outright.
  const jwt = process.env.JWT_SECRET || '';
  if (jwt && (jwt.length < 32 || jwt === 'hoscore-development-secret-key-32chars')) {
    missingCritical.push('JWT_SECRET (must be a strong, unique value of 32+ chars)');
  }

  for (const key of REQUIRED_IN_PROD) {
    if (!process.env[key] || process.env[key]!.trim() === '') missingProd.push(key);
  }
  for (const key of OPTIONAL) {
    if (!process.env[key] || process.env[key]!.trim() === '') missingOptional.push(key);
  }

  if (missingCritical.length > 0) {
    console.error('\n❌ FATAL: missing/invalid required environment variables:');
    for (const k of missingCritical) console.error(`   - ${k}`);
    console.error('   Refusing to start. Set these in server/.env\n');
    process.exit(1);
  }

  if (missingProd.length > 0) {
    if (isProd) {
      console.error('\n❌ FATAL: missing production environment variables (payments/OTP):');
      for (const k of missingProd) console.error(`   - ${k}`);
      console.error('   Refusing to start in production without these.\n');
      process.exit(1);
    } else {
      console.warn('\n⚠️  Running in MOCK mode for: ' + missingProd.join(', '));
      console.warn('   Payments/OTP will be simulated until these are set.\n');
    }
  }

  if (missingOptional.length > 0) {
    console.warn('ℹ️  Optional env not set: ' + missingOptional.join(', '));
  }
}
