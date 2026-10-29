import { expenses as seedExpenses } from './purchases.ts';
import { validateBusinessDate, toPaisa } from '../utils/partyPayment.ts';
import { expenseDateIso } from '../utils/dateRange.ts';
import type { Expense, PaymentMethod } from '../types/erp';

export const expensePaymentMethods:readonly PaymentMethod[]=['Cash','Bank','bKash','Nagad','Mobile Banking','Card'];

type ExpenseAudit = { id: string; expenseId: string; action: string; reason: string; at: string; before?: Expense; after: Expense };
const fresh = () => ({ expenses: seedExpenses.map(e => ({ ...e })), audit: [] as ExpenseAudit[], revision: 0 });
let state = fresh();
const listeners = new Set<() => void>();
export const getExpensePreviewSnapshot = () => state;
export const subscribeExpensePreview = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
export function resetExpensePreviewForTest() { state = fresh(); listeners.forEach(fn => fn()); }
const commit = (before: Expense | undefined, after: Expense, action: string, reason: string) => {
  const at = new Date().toISOString();
  state = {
    expenses: before ? state.expenses.map(e => e.id === after.id ? after : e) : [after, ...state.expenses],
    audit: [...state.audit, { id: 'expense-audit-' + (state.revision + 1), expenseId: after.id, action, reason, at, before, after }],
    revision: state.revision + 1
  };
  listeners.forEach(fn => fn());
};

/** In-memory UI source preview. No cash, account or ledger posting occurs. */
export function savePreviewExpense(expense: Expense, reason = '') {
  const before = state.expenses.find(e => e.id === expense.id);
  if (before?.recordStatus === 'Deleted') throw new Error('Cancelled expenses cannot be edited.');
  if (before && expense.ref !== before.ref) throw new Error('Keep the original expense reference.');
  if (before && !reason.trim()) throw new Error('Enter a reason for the correction.');
  validateBusinessDate(expenseDateIso(expense.date));
  const amount = toPaisa(expense.amount, 'Expense amount'), paid = toPaisa(expense.paid, 'Paid amount');
  if (amount <= 0) throw new Error('Enter a positive expense amount.');
  if (paid > amount) throw new Error('Payments cannot exceed the expense amount.');
  if (!expense.category.trim() || !expense.payee.trim()) throw new Error('Choose a category and payee.');
  if (expense.payments?.length) {
    let total = 0;
    const ids = new Set<string>();
    for (const payment of expense.payments) {
      if (ids.has(payment.id)) throw new Error('Duplicate payment row.');
      ids.add(payment.id);
      const part = toPaisa(payment.amount, 'Payment');
      if (!part || !payment.account?.trim() || !expensePaymentMethods.includes(payment.method)) throw new Error('Choose a payment account and a positive amount.');
      total += part;
    }
    if (total !== paid) throw new Error('Payment rows must match the paid amount.');
  } else if (paid) throw new Error('Choose the payment account.');
  if (!before && state.expenses.some(e => e.ref === expense.ref)) throw new Error('Expense reference already exists.');
  commit(before, { ...expense, createdAt: before?.createdAt ?? expense.createdAt ?? new Date().toISOString(), updatedAt: new Date().toISOString(), recordStatus: 'Posted' }, before ? 'correct' : 'create', reason.trim() || expense.backdateReason?.trim() || 'New expense');
}

export function cancelPreviewExpense(id: string, reason: string) {
  const before = state.expenses.find(e => e.id === id);
  if (!before || before.recordStatus === 'Deleted') throw new Error('Choose an active expense.');
  if (!reason.trim()) throw new Error('Enter a reason for cancellation.');
  // Retain the original record and amounts; cancelled previews are excluded from totals.
  commit(before, { ...before, recordStatus: 'Deleted', deletedAt: new Date().toISOString() }, 'cancel', reason.trim());
}

export function attachPreviewExpenseReceipt(id: string, receipt?: string) {
  const before = state.expenses.find(e => e.id === id);
  if (!before || before.recordStatus === 'Deleted') throw new Error('Choose an active expense.');
  commit(before, { ...before, receipt, updatedAt: new Date().toISOString() }, 'receipt', 'Receipt updated in UI preview');
}
