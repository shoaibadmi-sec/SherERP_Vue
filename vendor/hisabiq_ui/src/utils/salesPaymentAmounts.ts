import {posMoney} from './posCheckoutValidation.ts';

/** Sales and POS must interpret the entire money input, never a parseFloat prefix. */
export function salesPaymentTotal(rows: readonly {amount: string}[]): number {
  if (!rows.length) return NaN;
  const values = rows.map(row => posMoney(row.amount));
  if (values.some(value => !Number.isFinite(value) || value < 0)) return NaN;
  const paisa = values.reduce((sum, value) => sum + Math.round(value * 100), 0);
  return Number.isSafeInteger(paisa) ? paisa / 100 : NaN;
}

export function positiveSalesAmount(raw: string): number {
  const amount = posMoney(raw);
  return Number.isFinite(amount) && amount > 0 ? amount : NaN;
}

/** Fill only the selected payment row, preserving every other split amount. */
export function salesPaymentRemainder(due: number, rows: readonly {id: string; amount: string}[], rowId: string): number {
  const duePaisa = Math.round(due * 100);
  if (!Number.isFinite(due) || due < 0 || !Number.isSafeInteger(duePaisa)) return NaN;
  if (!rows.some(row => row.id === rowId)) return NaN;
  const others = rows.filter(row => row.id !== rowId);
  const paid = others.length ? salesPaymentTotal(others) : 0;
  if (!Number.isFinite(paid)) return NaN;
  return Math.max(0, duePaisa - Math.round(paid * 100)) / 100;
}
