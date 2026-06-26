export function normalizePhone(phone: string | null | undefined): string | null {
  if (typeof phone !== 'string') return null;

  const digits = phone.replace(/\D/g, '');
  if (!digits || digits.length < 7) return null;

  return digits;
}
