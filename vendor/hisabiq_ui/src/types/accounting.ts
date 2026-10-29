export type AccountingGroup = 'Asset' | 'Liability' | 'Equity' | 'Income' | 'Expense';
export type VoucherType = 'receipt' | 'payment' | 'transfer' | 'adjustment';

export type AccountingAccount = {
  id: string;
  code: string;
  name: string;
  helperBn: string;
  group: AccountingGroup;
  parent: string;
  active: boolean;
};

export type PostingLine = {
  accountId: string;
  debit: number;
  credit: number;
};

export type Posting = {
  id: string;
  source: string;
  sourceId: string;
  reference: string;
  transactionDate: string;
  createdAt: string;
  postedBy: string;
  description: string;
  status: 'Posted' | 'Deleted';
  lines: PostingLine[];
};

export type PaymentAccountAmount = {
  account: string;
  amount: number;
};

export type AccountingSourceTransaction = {
  id: string;
  source:
    | 'sale'
    | 'customer-payment'
    | 'purchase'
    | 'supplier-payment'
    | 'expense'
    | 'transfer'
    | 'finance'
    | 'receipt-voucher'
    | 'payment-voucher'
    | 'adjustment'
    | 'opening-balance';
  reference: string;
  transactionDate: string;
  createdAt: string;
  postedBy: string;
  amount: number;
  paid: number;
  due: number;
  description?: string;
  paymentAccounts?: PaymentAccountAmount[];
  cogs?: number;
  fromAccount?: string;
  toAccount?: string;
  expenseAccountId?: string;
  financeKind?: 'owner-investment' | 'owner-withdrawal' | 'loan-received' | 'loan-repayment' | 'borrower-given' | 'borrower-repayment';
  debitAccountId?: string;
  creditAccountId?: string;
  lines?: PostingLine[];
  recordStatus?: 'Posted' | 'Deleted';
  updatedAt?: string;
  updatedBy?: string;
  deletedAt?: string;
  deletedBy?: string;
  deleteReason?: string;
};

export type TrialBalanceRow = {
  accountId: string;
  debit: number;
  credit: number;
};

export type LedgerRow = {
  postingId: string;
  reference: string;
  transactionDate: string;
  createdAt: string;
  displayDate: string;
  description: string;
  debit: number;
  credit: number;
};
