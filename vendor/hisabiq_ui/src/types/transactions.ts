export type TerminologyMode = 'simple' | 'accounting';
export type EntryDateView = 'transaction' | 'created';

export type TransactionStatus = 'Posted' | 'Draft' | 'Deleted' | 'Reversed';
export type TransactionSource =
  | 'sale'
  | 'sale-return'
  | 'purchase'
  | 'purchase-return'
  | 'expense'
  | 'customer-payment'
  | 'supplier-payment'
  | 'finance'
  | 'transfer'
  | 'cheque'
  | 'receipt-voucher'
  | 'payment-voucher'
  | 'adjustment'
  | 'opening'
  | 'stock-adjustment';

export type TransactionMeta = {
  transactionDate: string;
  createdAt: string;
  postedBy: string;
  updatedAt?: string;
  updatedBy?: string;
  deletedAt?: string;
  deletedBy?: string;
  deleteReason?: string;
};

export type UnifiedTransaction = TransactionMeta & {
  id: string;
  source: TransactionSource;
  sourceId: string;
  reference: string;
  type: string;
  party?: string;
  partyId?: string;
  details?: string;
  amount: number;
  moneyIn: number;
  moneyOut: number;
  accounts: string[];
  status: TransactionStatus;
  countsTowardCashflow: boolean;
  sourceRoute?: string;
  paymentBreakdown?: Array<{ label: string; amount: number }>;
  due?: number;
};
