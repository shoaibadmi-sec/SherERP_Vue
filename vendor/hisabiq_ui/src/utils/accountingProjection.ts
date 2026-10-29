import { accountingAccounts } from '../data/accounting.ts';
import type {
  AccountingSourceTransaction,
  LedgerRow,
  Posting,
  PostingLine,
  TrialBalanceRow
} from '../types/accounting.ts';
import type { EntryDateView } from '../types/transactions.ts';

const accountById = new Map(accountingAccounts.map((account) => [account.id, account]));

function moneyAccountId(name?: string) {
  const value = (name ?? '').toLowerCase();
  if (value.includes('cash')) return 'asset-cash';
  if (value.includes('bkash') || value.includes('nagad') || value.includes('rocket') || value.includes('mobile')) return 'asset-mfs';
  return 'asset-bank';
}

function moneyDebitLines(source: AccountingSourceTransaction, amount = source.paid): PostingLine[] {
  if (amount <= 0) return [];
  if (!source.paymentAccounts?.length) return [{ accountId: 'asset-cash', debit: amount, credit: 0 }];
  return source.paymentAccounts
    .filter((payment) => payment.amount > 0)
    .map((payment) => ({ accountId: moneyAccountId(payment.account), debit: payment.amount, credit: 0 }));
}

function moneyCreditLines(source: AccountingSourceTransaction, amount = source.paid): PostingLine[] {
  return moneyDebitLines(source, amount).map((line) => ({
    accountId: line.accountId,
    debit: 0,
    credit: line.debit
  }));
}

function posting(
  source: AccountingSourceTransaction,
  lines: PostingLine[]
): Posting {
  return {
    id: `posting-${source.id}`,
    source: source.source,
    sourceId: source.id,
    reference: source.reference,
    transactionDate: source.transactionDate,
    createdAt: source.createdAt,
    postedBy: source.postedBy,
    description: source.description ?? source.reference,
    status: source.recordStatus === 'Deleted' ? 'Deleted' : 'Posted',
    lines: lines.filter((line) => line.debit !== 0 || line.credit !== 0)
  };
}

export function postingForTransaction(source: AccountingSourceTransaction): Posting {
  if (source.source === 'sale') {
    return posting(source, [
      ...moneyDebitLines(source),
      ...(source.due > 0 ? [{ accountId: 'asset-ar', debit: source.due, credit: 0 }] : []),
      { accountId: 'income-sales', debit: 0, credit: source.amount },
      ...(source.cogs && source.cogs > 0
        ? [
            { accountId: 'expense-cogs', debit: source.cogs, credit: 0 },
            { accountId: 'asset-inventory', debit: 0, credit: source.cogs }
          ]
        : [])
    ]);
  }

  if (source.source === 'customer-payment') {
    return posting(source, [
      ...moneyDebitLines(source, source.amount),
      { accountId: 'asset-ar', debit: 0, credit: source.amount }
    ]);
  }

  if (source.source === 'purchase') {
    return posting(source, [
      { accountId: 'asset-inventory', debit: source.amount, credit: 0 },
      ...moneyCreditLines(source),
      ...(source.due > 0 ? [{ accountId: 'liability-ap', debit: 0, credit: source.due }] : [])
    ]);
  }

  if (source.source === 'supplier-payment') {
    return posting(source, [
      { accountId: 'liability-ap', debit: source.amount, credit: 0 },
      ...moneyCreditLines(source, source.amount)
    ]);
  }

  if (source.source === 'expense') {
    return posting(source, [
      { accountId: source.expenseAccountId ?? 'expense-misc', debit: source.amount, credit: 0 },
      ...moneyCreditLines(source),
      ...(source.due > 0 ? [{ accountId: 'liability-ap', debit: 0, credit: source.due }] : [])
    ]);
  }

  if (source.source === 'transfer') {
    return posting(source, [
      { accountId: moneyAccountId(source.toAccount), debit: source.amount, credit: 0 },
      { accountId: moneyAccountId(source.fromAccount), debit: 0, credit: source.amount }
    ]);
  }

  if (source.source === 'finance') {
    const moneyDebit = moneyDebitLines(source, source.amount);
    const moneyCredit = moneyCreditLines(source, source.amount);
    switch (source.financeKind) {
      case 'owner-investment':
        return posting(source, [...moneyDebit, { accountId: 'equity-capital', debit: 0, credit: source.amount }]);
      case 'owner-withdrawal':
        return posting(source, [{ accountId: 'equity-withdrawal', debit: source.amount, credit: 0 }, ...moneyCredit]);
      case 'loan-received':
        return posting(source, [...moneyDebit, { accountId: 'liability-loan', debit: 0, credit: source.amount }]);
      case 'loan-repayment':
        return posting(source, [{ accountId: 'liability-loan', debit: source.amount, credit: 0 }, ...moneyCredit]);
      case 'borrower-given':
        return posting(source, [{ accountId: 'asset-borrower', debit: source.amount, credit: 0 }, ...moneyCredit]);
      case 'borrower-repayment':
        return posting(source, [...moneyDebit, { accountId: 'asset-borrower', debit: 0, credit: source.amount }]);
      default:
        return posting(source, []);
    }
  }

  if (source.source === 'receipt-voucher') {
    return posting(source, [
      ...(source.debitAccountId
        ? [{ accountId: source.debitAccountId, debit: source.amount, credit: 0 }]
        : moneyDebitLines(source, source.amount)),
      { accountId: source.creditAccountId ?? 'income-other', debit: 0, credit: source.amount }
    ]);
  }

  if (source.source === 'payment-voucher') {
    return posting(source, [
      { accountId: source.debitAccountId ?? 'expense-misc', debit: source.amount, credit: 0 },
      ...(source.creditAccountId
        ? [{ accountId: source.creditAccountId, debit: 0, credit: source.amount }]
        : moneyCreditLines(source, source.amount))
    ]);
  }

  return posting(source, source.lines ?? []);
}

export function trialBalance(postings: Posting[]) {
  const totals = new Map<string, { debit: number; credit: number }>();
  for (const entry of postings.filter((item) => item.status === 'Posted')) {
    for (const line of entry.lines) {
      const current = totals.get(line.accountId) ?? { debit: 0, credit: 0 };
      current.debit += line.debit;
      current.credit += line.credit;
      totals.set(line.accountId, current);
    }
  }

  const rows: TrialBalanceRow[] = Array.from(totals.entries()).map(([accountId, value]) => {
    const net = value.debit - value.credit;
    return {
      accountId,
      debit: net > 0 ? net : 0,
      credit: net < 0 ? Math.abs(net) : 0
    };
  }).filter((row) => row.debit || row.credit);

  const totalDebit = rows.reduce((sum, row) => sum + row.debit, 0);
  const totalCredit = rows.reduce((sum, row) => sum + row.credit, 0);
  return { rows, totalDebit, totalCredit };
}

export function profitAndLoss(postings: Posting[], range: { from: string; to: string }) {
  let income = 0;
  let expenses = 0;
  for (const entry of postings) {
    if (entry.status !== 'Posted' || entry.transactionDate < range.from || entry.transactionDate > range.to) continue;
    for (const line of entry.lines) {
      const account = accountById.get(line.accountId);
      if (account?.group === 'Income') income += line.credit - line.debit;
      if (account?.group === 'Expense') expenses += line.debit - line.credit;
    }
  }
  return { income, expenses, netProfit: income - expenses };
}

export function balanceSheet(postings: Posting[], asOf: string) {
  let assets = 0;
  let liabilities = 0;
  let equityAccounts = 0;
  let retainedProfit = 0;

  for (const entry of postings) {
    if (entry.status !== 'Posted' || entry.transactionDate > asOf) continue;
    for (const line of entry.lines) {
      const account = accountById.get(line.accountId);
      if (!account) continue;
      if (account.group === 'Asset') assets += line.debit - line.credit;
      if (account.group === 'Liability') liabilities += line.credit - line.debit;
      if (account.group === 'Equity') equityAccounts += line.credit - line.debit;
      if (account.group === 'Income') retainedProfit += line.credit - line.debit;
      if (account.group === 'Expense') retainedProfit -= line.debit - line.credit;
    }
  }

  const equity = equityAccounts + retainedProfit;
  const rounded = (value: number) => Math.round(value * 100) / 100;
  return {
    assets: rounded(assets),
    liabilities: rounded(liabilities),
    equity: rounded(equity),
    balanced: rounded(assets) === rounded(liabilities + equity)
  };
}

export function ledgerForAccount(
  accountId: string,
  postings: Posting[],
  dateView: EntryDateView
): LedgerRow[] {
  return postings
    .filter((entry) => entry.status === 'Posted')
    .flatMap((entry) => entry.lines
      .filter((line) => line.accountId === accountId)
      .map((line) => ({
        postingId: entry.id,
        reference: entry.reference,
        transactionDate: entry.transactionDate,
        createdAt: entry.createdAt,
        displayDate: dateView === 'created' ? entry.createdAt.slice(0, 10) : entry.transactionDate,
        description: entry.description,
        debit: line.debit,
        credit: line.credit
      })))
    .sort((a, b) => a.displayDate.localeCompare(b.displayDate) || a.createdAt.localeCompare(b.createdAt));
}
