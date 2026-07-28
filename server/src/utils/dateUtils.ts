export function parseDateSafe(input: any): Date | null {
  if (!input) return null;
  if (input instanceof Date) return isNaN(input.getTime()) ? null : input;
  if (typeof input === 'number') {
    const d = new Date(input);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof input === 'string') {
    const str = input.trim();
    if (!str) return null;

    // 1. DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
    const ddmmyyyyMatch = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
    if (ddmmyyyyMatch) {
      const p1 = parseInt(ddmmyyyyMatch[1], 10);
      const p2 = parseInt(ddmmyyyyMatch[2], 10);
      const year = parseInt(ddmmyyyyMatch[3], 10);

      if (p1 > 12 && p1 <= 31 && p2 >= 1 && p2 <= 12) {
        const d = new Date(year, p2 - 1, p1);
        return isNaN(d.getTime()) ? null : d;
      }
      if (p2 > 12 && p2 <= 31 && p1 >= 1 && p1 <= 12) {
        const d = new Date(year, p1 - 1, p2);
        return isNaN(d.getTime()) ? null : d;
      }
      if (p1 >= 1 && p1 <= 31 && p2 >= 1 && p2 <= 12) {
        const d = new Date(year, p2 - 1, p1);
        return isNaN(d.getTime()) ? null : d;
      }
    }

    // 2. YYYY/MM/DD or YYYY-MM-DD or YYYY.MM.DD
    const yyyymmddMatch = str.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
    if (yyyymmddMatch) {
      const year = parseInt(yyyymmddMatch[1], 10);
      const month = parseInt(yyyymmddMatch[2], 10);
      const day = parseInt(yyyymmddMatch[3], 10);
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        const d = new Date(year, month - 1, day);
        return isNaN(d.getTime()) ? null : d;
      }
    }

    // 3. Fallback to standard JavaScript Date constructor
    const d = new Date(str);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}
