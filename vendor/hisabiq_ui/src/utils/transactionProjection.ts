import type { PaymentSplit } from '../types/erp.ts';
import type { TransactionMeta, UnifiedTransaction } from '../types/transactions.ts';

type SaleProjectionInput = {
  id: string;
  invoice: string;
  date: string;
  time: string;
  party: string;
  partyId?: string;
  items: number;
  total: number;
  paid: number;
  due?: number;
  method: string;
  payments?: PaymentSplit[];
  salesperson: string;
};

type TransferProjectionInput = {
  id: string;
  date: string;
  from: string;
  to: string;
  amount: number;
  reference?: string;
  status: 'Completed' | 'Reversed';
};

function paymentAccount(payment: PaymentSplit) {
  if (payment.account) return payment.account;
  if (payment.method === 'Customer Credit') return 'Customer Credit';
  return payment.method;
}

export function projectSaleTransaction(
  sale: SaleProjectionInput,
  meta: Omit<TransactionMeta, 'postedBy'> & { postedBy?: string }
): UnifiedTransaction {
  const payments = sale.payments ?? [];
  const accounts = payments.length
    ? Array.from(new Set(payments.map(paymentAccount)))
    : sale.paid > 0
      ? [sale.method]
      : [];

  return {
    id: `sale-${sale.id}`,
    source: 'sale',
    sourceId: sale.id,
    sourceRoute: '/app/sales',
    reference: sale.invoice,
    type: 'Sale',
    party: sale.party,
    partyId: sale.partyId,
    details: `${sale.items} item${sale.items === 1 ? '' : 's'}`,
    transactionDate: meta.transactionDate,
    createdAt: meta.createdAt,
    postedBy: meta.postedBy ?? sale.salesperson,
    amount: sale.total,
    moneyIn: sale.paid,
    moneyOut: 0,
    accounts,
    paymentBreakdown: payments.map((payment) => ({ label: paymentAccount(payment), amount: payment.amount })),
    due: sale.due,
    status: 'Posted',
    countsTowardCashflow: true
  };
}

export function projectTransferTransaction(
  transfer: TransferProjectionInput,
  meta: TransactionMeta
): UnifiedTransaction {
  return {
    id: `transfer-${transfer.id}`,
    source: 'transfer',
    sourceId: transfer.id,
    sourceRoute: '/app/finance',
    reference: transfer.id,
    type: 'Account Transfer',
    details: `${transfer.from} → ${transfer.to}`,
    transactionDate: meta.transactionDate,
    createdAt: meta.createdAt,
    postedBy: meta.postedBy,
    updatedAt: meta.updatedAt,
    updatedBy: meta.updatedBy,
    deletedAt: meta.deletedAt,
    deletedBy: meta.deletedBy,
    amount: transfer.amount,
    moneyIn: transfer.status === 'Reversed' ? 0 : transfer.amount,
    moneyOut: transfer.status === 'Reversed' ? 0 : transfer.amount,
    accounts: [transfer.from, transfer.to],
    status: transfer.status === 'Reversed' ? 'Reversed' : 'Posted',
    countsTowardCashflow: false
  };
}

export function projectUnifiedTransactions(groups: UnifiedTransaction[][]) {
  return groups.flat();
}
