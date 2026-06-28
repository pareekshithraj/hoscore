// MSG91 Service — transactional Email + SMS/OTP delivery.
// All config comes from env. When MSG91_AUTHKEY is absent we fall back to console
// logging (dev) so the app still runs without credentials.
import axios from 'axios';

const AUTH_KEY = process.env.MSG91_AUTH_KEY;
const TEMPLATE_ID = process.env.MSG91_TEMPLATE_ID; // SMS OTP template
const EMAIL_DOMAIN = process.env.MSG91_EMAIL_DOMAIN; // e.g. hoscore.in
const FROM_EMAIL = process.env.MSG91_FROM_EMAIL || 'noreply@hoscore.in';
const FROM_NAME = process.env.MSG91_FROM_NAME || 'HOSCORE';

export const isMsg91Live = Boolean(AUTH_KEY);

const SMS_OTP_URL = 'https://control.msg91.com/api/v5/otp';
const EMAIL_URL = 'https://control.msg91.com/api/v5/email/send';
const WIDGET_VERIFY_URL = 'https://control.msg91.com/api/v5/widget/verifyAccessToken';

export function buildVerifyAccessTokenPayload(accessToken: string, authKey: string) {
  return {
    authkey: authKey,
    'access-token': accessToken,
  };
}

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
    const response = await axios.post(
      SMS_OTP_URL,
      { template_id: TEMPLATE_ID, mobile, otp },
      { headers: { authkey: AUTH_KEY as string, 'Content-Type': 'application/json' }, timeout: 10000 }
    );
    console.log('✅ [MSG91 SMS OTP] Success:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (err: any) {
    console.error('========== MSG91 SMS OTP ERROR ==========');
    console.error('Mobile:', mobile);
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
        body: { type: 'html', data: html },
      },
      { headers: { authkey: AUTH_KEY as string, 'Content-Type': 'application/json' }, timeout: 10000 }
    );
    return true;
  } catch (err: any) {
    console.error('MSG91 email failed:', err?.response?.data || err?.message);
    return false;
  }
}

export async function verifyMsg91AccessToken(accessToken: string): Promise<{ verified: boolean; response?: any; error?: string }> {
  if (!accessToken?.trim()) {
    return { verified: false, error: 'Access token is required' };
  }

  if (!AUTH_KEY) {
    console.log(`📱 [MOCK MSG91 WIDGET] Verified access token for demo flow`);
    return { verified: true, response: { mocked: true } };
  }

  try {
    const response = await axios.post(
      WIDGET_VERIFY_URL,
      buildVerifyAccessTokenPayload(accessToken, AUTH_KEY),
      { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
    );

    const payload = response?.data ?? {};
    const isSuccess = response.status >= 200 && response.status < 300 && (
      payload?.success === true ||
      payload?.verified === true ||
      payload?.status === 'success' ||
      payload?.message?.toLowerCase?.().includes('success') ||
      payload?.token
    );

    if (!isSuccess) {
      return {
        verified: false,
        response: payload,
        error: payload?.message || payload?.error || 'MSG91 access token verification failed',
      };
    }

    return {
      verified: true,
      response: payload,
    };

  } catch (err: any) {
    console.error("========== MSG91 WIDGET ERROR ==========");
    console.error("Status:", err?.response?.status);
    console.error("Headers:", err?.response?.headers);
    console.error("Data:", JSON.stringify(err?.response?.data, null, 2));
    console.error("Message:", err?.message);
    console.error("========================================");

    return {
      verified: false,
      response: err?.response?.data,
      error:
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "MSG91 access token verification failed",
    };
  }
}