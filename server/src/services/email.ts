// Email Service — delivers via MSG91 (primary). Falls back to Resend if configured,
// then to console logging in dev. All providers are env-driven.
import { sendMsg91Email, isMsg91Live } from './msg91.js';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

const RESEND_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.FROM_EMAIL || 'HOSCORE <noreply@hoscore.in>';

async function sendEmail(options: EmailOptions): Promise<boolean> {
  // Primary: MSG91
  if (isMsg91Live) {
    return sendMsg91Email({ to: options.to, subject: options.subject, html: options.html });
  }
  // Fallback: Resend
  if (RESEND_KEY) {
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(RESEND_KEY);
      await resend.emails.send({ from: FROM, to: options.to, subject: options.subject, html: options.html });
      console.log(`📧 Email sent to ${options.to}: ${options.subject}`);
      return true;
    } catch (err) {
      console.error('Email send failed:', err);
      return false;
    }
  }
  // Dev mock
  console.log(`📧 [MOCK EMAIL] To: ${options.to} | Subject: ${options.subject}`);
  return true;
}

export async function sendAppointmentConfirmation(
  to: string, patientName: string, hospitalName: string, date: string, time: string, token: number
) {
  return sendEmail({
    to,
    subject: `Appointment Confirmed — Token #${token} at ${hospitalName}`,
    html: `
      <div style="font-family:system-ui;max-width:500px;margin:auto;padding:32px;background:#f8fafc;border-radius:24px">
        <div style="text-align:center;margin-bottom:24px">
          <h1 style="color:#1e293b;font-size:24px;margin:0">Appointment Confirmed ✅</h1>
          <p style="color:#64748b;margin-top:4px">Your booking at ${hospitalName} is confirmed</p>
        </div>
        <div style="background:#2563eb;color:white;border-radius:16px;padding:24px;text-align:center;margin:16px 0">
          <p style="margin:0;font-size:12px;opacity:0.7;text-transform:uppercase;letter-spacing:2px">Token Number</p>
          <p style="margin:8px 0 0;font-size:48px;font-weight:900">#${token}</p>
        </div>
        <div style="background:white;border-radius:12px;padding:20px;margin:16px 0">
          <p style="margin:4px 0;color:#475569"><strong>Patient:</strong> ${patientName}</p>
          <p style="margin:4px 0;color:#475569"><strong>Date:</strong> ${date}</p>
          <p style="margin:4px 0;color:#475569"><strong>Time:</strong> ${time}</p>
        </div>
        <p style="color:#94a3b8;font-size:12px;text-align:center;margin-top:24px">
          Please arrive 15 minutes before your scheduled time.<br/>
          Powered by HOSCORE — Global Hospital Network
        </p>
      </div>
    `,
  });
}

export async function sendLeaveApproval(
  to: string, staffName: string, status: string, startDate: string, endDate: string
) {
  const statusColor = status === 'APPROVED' ? '#16a34a' : '#dc2626';
  const statusEmoji = status === 'APPROVED' ? '✅' : '❌';
  return sendEmail({
    to,
    subject: `Leave Request ${status} ${statusEmoji}`,
    html: `
      <div style="font-family:system-ui;max-width:500px;margin:auto;padding:32px;background:#f8fafc;border-radius:24px">
        <h2 style="color:#1e293b;text-align:center">Leave Request Update</h2>
        <div style="background:white;border-radius:12px;padding:20px;margin:16px 0;border-left:4px solid ${statusColor}">
          <p style="margin:4px 0;color:#475569"><strong>Status:</strong> <span style="color:${statusColor};font-weight:700">${status}</span></p>
          <p style="margin:4px 0;color:#475569"><strong>Staff:</strong> ${staffName}</p>
          <p style="margin:4px 0;color:#475569"><strong>Period:</strong> ${startDate} — ${endDate}</p>
        </div>
        <p style="color:#94a3b8;font-size:12px;text-align:center">Powered by HOSCORE</p>
      </div>
    `,
  });
}

export async function sendWelcomeEmail(to: string, name: string) {
  return sendEmail({
    to,
    subject: 'Welcome to HOSCORE 🏥',
    html: `
      <div style="font-family:system-ui;max-width:500px;margin:auto;padding:32px;background:#f8fafc;border-radius:24px">
        <h2 style="color:#1e293b;text-align:center">Welcome, ${name}! 🎉</h2>
        <p style="color:#475569;text-align:center">Your HOSCORE account is ready. You can now book appointments, view prescriptions, and manage your health records.</p>
        <div style="text-align:center;margin:24px 0">
          <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/login" style="background:#2563eb;color:white;padding:12px 32px;border-radius:12px;text-decoration:none;font-weight:700">Login Now</a>
        </div>
        <p style="color:#94a3b8;font-size:12px;text-align:center">Powered by HOSCORE — Global Hospital Network</p>
      </div>
    `,
  });
}
