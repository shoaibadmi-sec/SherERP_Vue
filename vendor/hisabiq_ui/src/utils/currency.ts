/** Format a number using Bangladeshi lakh/crore grouping, e.g. 1,25,400 */
export function formatNumber(value: number, decimals = 0): string {
  return value.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

/** Money without a currency symbol; keep paisa while leaving generic counts unchanged. */
export function formatMoneyNumber(value: number, decimals = Number.isInteger(value) ? 0 : 2): string {
  return formatNumber(value, decimals);
}

/** Format Taka with paisa when present; callers may request explicit precision. */
export function taka(value: number, decimals = Number.isInteger(value) ? 0 : 2): string {
  const sign = value < 0 ? '−' : '';
  return `${sign}৳${formatMoneyNumber(Math.abs(value), decimals)}`;
}

/** Compact taka for chart axes: ৳1.2L, ৳45K */
export function takaCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 10000000) return `৳${(value / 10000000).toFixed(1)}Cr`;
  if (abs >= 100000) return `৳${(value / 100000).toFixed(1)}L`;
  if (abs >= 1000) return `৳${Math.round(value / 1000)}K`;
  return `৳${value}`;
}

/** Round to the nearest step (e.g. 5 taka) for cash sales */
export function roundTo(value: number, step = 5): number {
  return Math.round(value / step) * step;
}