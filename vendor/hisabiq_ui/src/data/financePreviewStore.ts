import type { SetStateAction } from 'react';
import {
  financeAccounts as seedAccounts,
  financeTransactions as seedTransactions,
  financePeople as seedPeople,
  relationshipSummary as seedRelationshipSummary,
  type FinanceAccount,
  type FinanceTransaction,
  type FinancePerson
} from './financeAccounts.ts';

/** Shared in-memory finance preview for both /app/finance and /app/counter.
 *  This does not post to a bank or backend; page navigation must not discard a
 *  transaction that was confirmed in the Counter preview.
 */
type FinancePreviewState = {
  accounts: FinanceAccount[];
  transactions: FinanceTransaction[];
  people: FinancePerson[];
};
const fresh = (): FinancePreviewState => ({
  accounts: seedAccounts.map(account => ({ ...account })),
  transactions: seedTransactions.map(transaction => ({
    ...transaction,
    paymentAccounts: transaction.paymentAccounts?.map(payment => ({ ...payment }))
  })),
  people: seedPeople.map(person => ({ ...person, roles: [...person.roles] }))
});

let state = fresh();
const listeners = new Set<() => void>();
export const getFinancePreviewSnapshot = (): FinancePreviewState => state;
export const subscribeFinancePreview = (listener: () => void) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};
export function updateFinancePreview<K extends keyof FinancePreviewState>(
  key: K,
  change: SetStateAction<FinancePreviewState[K]>
): void {
  const current = state[key];
  const next = typeof change === 'function'
    ? (change as (previous: FinancePreviewState[K]) => FinancePreviewState[K])(current)
    : change;
  if (Object.is(current, next)) return;
  state = { ...state, [key]: next };
  listeners.forEach(listener => listener());
}
export function resetFinancePreviewForTest(): void {
  state = fresh();
  listeners.forEach(listener => listener());
}

// The baseline relationship cards contain historical balances outside the small
// fixture transaction list. Apply only the net change from the original fixtures,
// so Counter-created and Finance-created entries update the same balance cards.
function relationshipNet(
  transactions: readonly FinanceTransaction[],
  credit: FinanceTransaction['type'],
  debit: FinanceTransaction['type'],
  opening: FinanceTransaction['type']
): number {
  return transactions.reduce((total, transaction) => {
    if (transaction.status === 'Reversed') return total;
    if (transaction.type === credit || transaction.type === opening) return total + transaction.amount;
    if (transaction.type === debit) return total - transaction.amount;
    return total;
  }, 0);
}
export function financePreviewRelationshipSummary(transactions: readonly FinanceTransaction[] = state.transactions) {
  const change = (
    credit: FinanceTransaction['type'],
    debit: FinanceTransaction['type'],
    opening: FinanceTransaction['type']
  ) => relationshipNet(transactions, credit, debit, opening)
    - relationshipNet(seedTransactions, credit, debit, opening);
  return {
    ...seedRelationshipSummary,
    ownerCapital: seedRelationshipSummary.ownerCapital
      + change('Owner Credit', 'Owner Debit', 'Opening Owner Capital'),
    outstandingLoan: seedRelationshipSummary.outstandingLoan
      + change('Lender Credit', 'Lender Debit', 'Opening Loan'),
    borrowerReceivable: seedRelationshipSummary.borrowerReceivable
      + change('Borrower Debit', 'Borrower Credit', 'Opening Borrower Loan')
  };
}
