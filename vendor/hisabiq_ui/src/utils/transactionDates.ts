import type { EntryDateView, UnifiedTransaction } from '../types/transactions.ts';

function createdDate(createdAt: string) {
  return createdAt.slice(0, 10);
}

export function dateForView(transaction: UnifiedTransaction, view: EntryDateView) {
  return view === 'created' ? createdDate(transaction.createdAt) : transaction.transactionDate;
}

export function isInDateRange(
  transaction: UnifiedTransaction,
  view: EntryDateView,
  from: string,
  to: string
) {
  const date = dateForView(transaction, view);
  return date >= from && date <= to;
}

export function sortTransactionsByDate(
  transactions: UnifiedTransaction[],
  view: EntryDateView
) {
  return [...transactions].sort((a, b) => {
    const byDate = dateForView(b, view).localeCompare(dateForView(a, view));
    if (byDate !== 0) return byDate;
    return b.createdAt.localeCompare(a.createdAt);
  });
}
