export function normalizeDemoPaymentAmount(amount?: number | string | null): number {
  const parsed = typeof amount === 'string' ? Number(amount) : amount;
  if (typeof parsed !== 'number' || !Number.isFinite(parsed)) return 5000;

  const rounded = Math.round(parsed);
  if (rounded < 5000) return 5000;
  if (rounded > 500000) return 500000;
  return rounded;
}
