import {matchesSearch as fuzzyMatch} from './fuzzySearch.ts';
import type { EntryDateView, UnifiedTransaction } from '../types/transactions.ts';
import { isInDateRange, sortTransactionsByDate } from './transactionDates.ts';

export type DaybookQuery = {
  dateView: EntryDateView;
  from?: string;
  to?: string;
  search?: string;
  type?: string;
  account?: string;
  user?: string;
  status?: string;
};

export function filterDaybookTransactions(
  transactions: UnifiedTransaction[],
  query: DaybookQuery
) {
  const search = query.search?.trim().toLowerCase() ?? '';
  const filtered = transactions.filter((transaction) => {
    if (query.from && query.to && !isInDateRange(transaction, query.dateView, query.from, query.to)) return false;
    if (query.type && query.type !== 'All types' && transaction.type !== query.type) return false;
    if (query.account && query.account !== 'All accounts' && !transaction.accounts.includes(query.account)) return false;
    if (query.user && query.user !== 'All users' && transaction.postedBy !== query.user) return false;
    if (query.status && query.status !== 'All status' && transaction.status !== query.status) return false;
    if (!search) return true;
    return fuzzyMatch(search,[
      transaction.reference,
      transaction.type,
      transaction.party,
      transaction.details,
      transaction.amount,
      ...transaction.accounts
    ]);
  });
  return sortTransactionsByDate(filtered, query.dateView);
}

export function cashflowSummary(transactions: UnifiedTransaction[]) {
  const totals = transactions.reduce((summary, transaction) => {
    if (!transaction.countsTowardCashflow || transaction.status === 'Deleted' || transaction.status === 'Reversed') return summary;
    summary.moneyIn += transaction.moneyIn;
    summary.moneyOut += transaction.moneyOut;
    return summary;
  }, { moneyIn: 0, moneyOut: 0 });

  return { ...totals, net: totals.moneyIn - totals.moneyOut };
}
