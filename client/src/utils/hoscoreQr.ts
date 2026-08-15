/** Canonical Hoscore QR payloads — must stay in sync with Android `HoscoreQr.kt`. */

export type HoscoreQr =
  | { kind: 'patient'; sixDigitId: string }
  | { kind: 'visit'; sixDigitId: string; appointmentId: string; token: string }
  | { kind: 'hospital'; hospitalId: string }
  | { kind: 'staff'; staffId: string };

const digits = (value: string) => String(value || '').replace(/\D/g, '');

export function encodePatientQr(sixDigitId: string): string {
  return `HOSCORE:PATIENT:${digits(sixDigitId)}`;
}

export function encodeVisitQr(sixDigitId: string, appointmentId: string, token: string | number): string {
  return `HOSCORE:VISIT:${digits(sixDigitId)}:${appointmentId}:${token}`;
}

export function encodeHospitalQr(hospitalId: string): string {
  return `HOSCORE:HOSPITAL:${hospitalId}`;
}

export function encodeStaffQr(staffId: string): string {
  return `HOSCORE:STAFF:${staffId}`;
}

export function qrImageUrl(payload: string, size = 180): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(payload)}`;
}

export function parseHoscoreQr(raw: string): HoscoreQr | null {
  const text = String(raw || '').trim();
  if (!text) return null;

  const bare = text.match(/^(?:HSC-)?(\d{6})$/i);
  if (bare) return { kind: 'patient', sixDigitId: bare[1] };

  const parts = text.split(':');
  if (parts[0] !== 'HOSCORE' || parts.length < 2) return null;

  const a = parts[1] || '';
  const b = parts[2] || '';

  if (a === 'PATIENT' && b) {
    const six = digits(b);
    return six.length === 6 ? { kind: 'patient', sixDigitId: six } : null;
  }
  if (a === 'VISIT' && b) {
    const six = digits(b);
    if (six.length !== 6) return null;
    return {
      kind: 'visit',
      sixDigitId: six,
      appointmentId: parts[3] || '',
      token: String(parts[4] || '').replace(/^TOKEN-/i, ''),
    };
  }
  if (a === 'HOSPITAL' && b) return { kind: 'hospital', hospitalId: b };
  if (a === 'STAFF' && b) return { kind: 'staff', staffId: b };

  // Legacy: HOSCORE:<uuid>:HOSPITAL | :STAFF
  if (b === 'HOSPITAL') return { kind: 'hospital', hospitalId: a };
  if (b === 'STAFF') return { kind: 'staff', staffId: a };

  const six = digits(a);
  if (six.length !== 6) return null;
  if (parts.length >= 4) {
    return {
      kind: 'visit',
      sixDigitId: six,
      appointmentId: parts[2],
      token: String(parts[3] || '').replace(/^TOKEN-/i, ''),
    };
  }
  return { kind: 'patient', sixDigitId: six };
}

export function patientIdFromQr(raw: string): string | null {
  const parsed = parseHoscoreQr(raw);
  if (!parsed) return null;
  if (parsed.kind === 'patient' || parsed.kind === 'visit') return parsed.sixDigitId;
  return null;
}
