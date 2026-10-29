export type IsoRange = { from: string; to: string };
const iso = (date: Date) => date.toISOString().slice(0, 10);
export const utcDate = (day: string) => new Date(day + 'T12:00:00.000Z');
export const isoDay = (year: number, month: number, day: number) => iso(new Date(Date.UTC(year, month, day, 12)));
export const addDays = (day: string, amount: number) => {
  const date = utcDate(day); date.setUTCDate(date.getUTCDate() + amount); return iso(date);
};
export const addMonths = (day: string, amount: number) => {
  const date = utcDate(day);
  return isoDay(date.getUTCFullYear(), date.getUTCMonth() + amount, 1);
};
/** Use the business calendar date, not device-local time or a hardcoded demo date. */
export const businessToday = (clock = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Dhaka', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(clock);
  const value = (key: string) => parts.find((part) => part.type === key)?.value ?? '';
  return value('year') + '-' + value('month') + '-' + value('day');
};
export const datePreset = (key: string, today = businessToday()): IsoRange => {
  const date = utcDate(today);
  const monthStart = isoDay(date.getUTCFullYear(), date.getUTCMonth(), 1);
  const weekStart = addDays(today, -(date.getUTCDay() + 6) % 7);
  switch (key) {
    case 'Today': return { from: today, to: today };
    case 'Yesterday': { const yesterday = addDays(today, -1); return { from: yesterday, to: yesterday }; }
    case 'Last 7 days': return { from: addDays(today, -6), to: today };
    case 'This week': return { from: weekStart, to: addDays(weekStart, 6) };
    case 'This month': return { from: monthStart, to: addDays(addMonths(monthStart, 1), -1) };
    case 'This quarter': {
      const start = isoDay(date.getUTCFullYear(), Math.floor(date.getUTCMonth() / 3) * 3, 1);
      return { from: start, to: addDays(addMonths(start, 3), -1) };
    }
    case 'This year': {
      const start = isoDay(date.getUTCFullYear(), 0, 1);
      return { from: start, to: isoDay(date.getUTCFullYear(), 11, 31) };
    }
    case 'Last month': { const start = addMonths(monthStart, -1); return { from: start, to: addDays(monthStart, -1) }; }
    default: return { from: '', to: '' };
  }
};
export const formatDay = (date: string) => date
  ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(utcDate(date)).replace('Sept ', 'Sep ') : 'Select date';
export const formatRange = ({ from, to }: IsoRange) =>
  from && to ? (from === to ? formatDay(from) : formatDay(from) + ' – ' + formatDay(to)) : from ? formatDay(from) + ' – …' : 'All dates';

/** ERP demo expense dates are shown as "30 Sep 2026"; compare as calendar dates, not locale-dependent strings. */
export function expenseDateIso(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const match = /^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/.exec(value.trim());
  if (!match) return '';
  const month = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
    .indexOf(match[2].toLowerCase());
  if (month < 0 || Number(match[1]) < 1 || Number(match[1]) > 31) return '';
  const day = isoDay(Number(match[3]), month, Number(match[1]));
  return day.endsWith('-' + match[1].padStart(2, '0')) ? day : '';
}
