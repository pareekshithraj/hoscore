/** Shared clinical helpers for hospital ops UI */

export function calcAge(dob?: string | Date | null, today = new Date()): string | number {
  if (!dob) return '—';
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return '—';
  return Math.abs(new Date(today.getTime() - d.getTime()).getUTCFullYear() - 1970);
}

export function patientIdLabel(patient: {
  isHoscoreUser?: boolean | null;
  sixDigitId?: string | null;
  id?: string;
} | null | undefined): string {
  if (!patient) return '—';
  if (patient.isHoscoreUser === false) return 'Manual walk-in';
  if (patient.sixDigitId) return `HSC-${patient.sixDigitId}`;
  if (patient.id) return `HSC-${String(patient.id).slice(0, 6).toUpperCase()}`;
  return '—';
}

export function initials(name?: string | null): string {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function formatINR(amount?: number | null): string {
  if (amount == null || Number.isNaN(amount)) return '₹0';
  return `₹${Number(amount).toLocaleString('en-IN')}`;
}

export function formatShortDate(value?: string | Date | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatTime(value?: string | Date | null): string {
  if (!value) return '—';
  if (typeof value === 'string' && value.includes(':') && value.length <= 8) return value;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export function relativeWaitMinutes(from?: string | Date | null): number | null {
  if (!from) return null;
  const d = new Date(from);
  if (Number.isNaN(d.getTime())) return null;
  return Math.max(0, Math.round((Date.now() - d.getTime()) / 60000));
}

/** BP "120/80" → classify */
export function vitalsFlags(v: {
  bloodPressure?: string | null;
  heartRate?: number | null;
  temperature?: number | null;
  oxygenSaturation?: number | null;
}): Array<'high' | 'low' | 'critical'> {
  const flags: Array<'high' | 'low' | 'critical'> = [];
  if (v.heartRate != null) {
    if (v.heartRate > 120 || v.heartRate < 45) flags.push('critical');
    else if (v.heartRate > 100 || v.heartRate < 55) flags.push('high');
  }
  if (v.oxygenSaturation != null) {
    if (v.oxygenSaturation < 90) flags.push('critical');
    else if (v.oxygenSaturation < 95) flags.push('low');
  }
  if (v.temperature != null) {
    if (v.temperature >= 103 || v.temperature <= 95) flags.push('critical');
    else if (v.temperature >= 100.4) flags.push('high');
  }
  if (v.bloodPressure) {
    const [sys] = v.bloodPressure.split('/').map(Number);
    if (sys >= 180) flags.push('critical');
    else if (sys >= 140) flags.push('high');
  }
  return flags;
}
