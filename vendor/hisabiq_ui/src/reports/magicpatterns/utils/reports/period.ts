import type { Period, PeriodPreset } from '../../types/reports';

export const addDays = (date: string, n: number): string => {
  const d = new Date(date + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

/** a − b in whole days */
export const diffDays = (a: string, b: string): number =>
  Math.round((Date.parse(a + 'T00:00:00Z') - Date.parse(b + 'T00:00:00Z')) / 86400000);

export const weekday = (date: string): number => new Date(date + 'T00:00:00Z').getUTCDay();

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const shortDate = (date: string): string => {
  const [, m, d] = date.split('-');
  return `${Number(d)} ${months[Number(m) - 1]}`;
};

export const longDate = (date: string): string => `${shortDate(date)} ${date.slice(0, 4)}`;

export const presetLabels: Record<PeriodPreset, string> = {
  today: 'Today',
  '7d': 'Last 7 days',
  month: 'This month',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
  custom: 'Custom range',
};

export function resolvePeriod(preset: PeriodPreset, asOf: string, customFrom: string, customTo: string): Period {
  let from = asOf;
  let to = asOf;
  if (preset === '7d') from = addDays(asOf, -6);
  else if (preset === '30d') from = addDays(asOf, -29);
  else if (preset === '90d') from = addDays(asOf, -89);
  else if (preset === 'month') from = asOf.slice(0, 8) + '01';
  else if (preset === 'custom') {
    from = customFrom || asOf;
    to = customTo || asOf;
  }
  if (to > asOf) to = asOf;
  const days = Math.max(1, diffDays(to, from) + 1);
  const prevTo = addDays(from, -1);
  const prevFrom = addDays(prevTo, -(days - 1));
  const label = preset === 'custom' ? `${longDate(from)} – ${longDate(to)}` : presetLabels[preset];
  return { preset, from, to, days, prevFrom, prevTo, label };
}

export const inRange = (date: string, from: string, to: string): boolean => date >= from && date <= to;

/** % change, null when the previous value is zero */
export const pctChange = (current: number, previous: number): number | null =>
  previous === 0 ? null : ((current - previous) / Math.abs(previous)) * 100;
