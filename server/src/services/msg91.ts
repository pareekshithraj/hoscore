// MSG91 Service — transactional Email + SMS/OTP delivery.
// All config comes from env. When MSG91_AUTHKEY is absent we fall back to console
// logging (dev) so the app still runs without credentials.
import axios from 'axios';

const AUTHKEY = process.env.MSG91_AUTHKEY;
const TEMPLATE_ID = process.env.MSG91_TEMPLATE_ID; // SMS OTP template
const EMAIL_DOMAIN = process.env.MSG91_EMAIL_DOMAIN; // e.g. hoscore.in
const FROM_EMAIL = process.env.MSG91_FROM_EMAIL || 'noreply@hoscore.in';
const FROM_NAME = process.env.MSG91_FROM_NAME || 'HOSCORE';

export const isMsg91Live = Boolean(AUTHKEY);

const SMS_OTP_URL = 'https://control.msg91.com/api/v5/otp';
const EMAIL_URL = 'https://control.msg91.com/api/v5/email/send';

/**
 * Send an OTP via MSG91 SMS. `mobile` must include country code without '+',
 * e.g. 919876543210. We send our own pre-generated OTP so it matches what we
 * store in the DB (MSG91 can also generate, but we keep verification server-side).
 */
export async function sendSmsOtp(mobile: string, otp: string): Promise<boolean> {
  if (!isMsg91Live || !TEMPLATE_ID) {
    console.log(`📱 [MOCK SMS OTP] ${mobile} -> ${otp}`);
    return true;
  }
  try {
    await axios.post(
      SMS_OTP_URL,
      { template_id: TEMPLATE_ID, mobile, otp },
      { headers: { authkey: AUTHKEY as string, 'Content-Type': 'application/json' }, timeout: 10000 }
    );
    return true;
  } catch (err: any) {
    console.error('MSG91 SMS OTP failed:', err?.response?.data || err?.message);
    return false;
  }
}

interface EmailArgs {
  to: string;
  toName?: string;
  subject: string;
  html: string;
}

/**
 * Send a transactional email via MSG91 Email API.
 */
export async function sendMsg91Email({ to, toName, subject, html }: EmailArgs): Promise<boolean> {
  if (!isMsg91Live || !EMAIL_DOMAIN) {
    console.log(`📧 [MOCK EMAIL] To: ${to} | Subject: ${subject}`);
    return true;
  }
  try {
    await axios.post(
      EMAIL_URL,
      {
        recipients: [{ to: [{ email: to, name: toName || to }] }],
        from: { email: FROM_EMAIL, name: FROM_NAME },
        domain: EMAIL_DOMAIN,
        subject,
        body: [{ type: 'text/html', value: html }],
      },
      { headers: { authkey: AUTHKEY as string, 'Content-Type': 'application/json' }, timeout: 10000 }
    );
    return true;
  } catch (err: any) {
    console.error('MSG91 email failed:', err?.response?.data || err?.message);
    return false;
  }
}
