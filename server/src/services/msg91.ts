// MSG91 Service — transactional Email + SMS/OTP delivery.
// All config comes from env. When MSG91_AUTHKEY is absent we fall back to console
// logging (dev) so the app still runs without credentials.
import axios from 'axios';

const AUTH_KEY = process.env.MSG91_AUTH_KEY;
const TEMPLATE_ID = process.env.MSG91_TEMPLATE_ID; // SMS OTP template
const EMAIL_TEMPLATE_ID = process.env.MSG91_EMAIL_TEMPLATE_ID; // Email OTP template (MSG91 requires this for email/send)
const EMAIL_DOMAIN = process.env.MSG91_EMAIL_DOMAIN; // e.g. hoscore.in
const FROM_EMAIL = process.env.MSG91_FROM_EMAIL || 'noreply@hoscore.in';
const FROM_NAME = process.env.MSG91_FROM_NAME || 'HOSCORE';

export const isMsg91Live = Boolean(AUTH_KEY);

const SMS_OTP_URL = 'https://control.msg91.com/api/v5/otp';
const EMAIL_URL = 'https://control.msg91.com/api/v5/email/send';

/**
 * Send an OTP via MSG91 SMS. `mobile` must include country code without '+',
 * e.g. 919876543210. We send our own pre-generated OTP so it matches what we
 * store in the DB (MSG91 can also generate, but we keep verification server-side).
 */
export async function sendSmsOtp(mobile: string, otp: string): Promise<boolean> {
  const intlMobile = mobile.length === 10 ? `91${mobile}` : mobile;

  if (!isMsg91Live) {
    console.log(`📱 [MOCK SMS OTP] ${intlMobile} -> ${otp}`);
    return true;
  }
  try {
    const payload: Record<string, string> = { mobile: intlMobile, otp };
    if (TEMPLATE_ID) {
      payload.template_id = TEMPLATE_ID;
    }

    const response = await axios.post(
      SMS_OTP_URL,
      payload,
      { headers: { authkey: AUTH_KEY as string, 'Content-Type': 'application/json' }, timeout: 10000 }
    );
    console.log('✅ [MSG91 SMS OTP] Success:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (err: any) {
    console.error('========== MSG91 SMS OTP ERROR ==========');
    console.error('Mobile:', intlMobile);
    console.error('Template ID:', TEMPLATE_ID);
    console.error('Status:', err?.response?.status);
    console.error('Headers:', JSON.stringify(err?.response?.headers, null, 2));
    console.error('Data:', JSON.stringify(err?.response?.data, null, 2));
    console.error('Message:', err?.message);
    console.error('=========================================');
    return false;
  }
}

interface EmailArgs {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  otp?: string;
}

/**
 * Send a transactional email via MSG91 Email API.
 * MSG91's email/send endpoint requires a pre-created template (template_id) on
 * most accounts — inline HTML is rejected with "template id field is required".
 * When MSG91_EMAIL_TEMPLATE_ID is set we send via template with the OTP as a
 * variable; otherwise we attempt inline HTML (works only on inline-enabled accounts).
 */
export async function sendMsg91Email({ to, toName, subject, html, otp }: EmailArgs): Promise<boolean> {
  if (!isMsg91Live || !EMAIL_DOMAIN) {
    console.log(`📧 [MOCK EMAIL] To: ${to} | Subject: ${subject}`);
    return true;
  }
  try {
    const payload: Record<string, unknown> = EMAIL_TEMPLATE_ID
      ? {
        recipients: [{
          to: [{ email: to, name: toName || to }],
          // Common variable aliases so the template can reference any of them.
          variables: { otp, OTP: otp, code: otp, company: FROM_NAME, company_name: FROM_NAME },
        }],
        from: { email: FROM_EMAIL, name: FROM_NAME },
        domain: EMAIL_DOMAIN,
        template_id: EMAIL_TEMPLATE_ID,
      }
      : {
        recipients: [{ to: [{ email: to, name: toName || to }] }],
        from: { email: FROM_EMAIL, name: FROM_NAME },
        domain: EMAIL_DOMAIN,
        subject,
        body: { type: 'text/html', data: html },
      };

    await axios.post(
      EMAIL_URL,
      payload,
      { headers: { authkey: AUTH_KEY as string, 'Content-Type': 'application/json' }, timeout: 10000 }
    );
    return true;
  } catch (err: any) {
    console.error('MSG91 email failed:', err?.response?.data || err?.message);
    return false;
  }
}