import { salesInvoices, salesReturns } from './sales';
import { purchases, expenses } from './purchases';
import { financeTransactions, accountTransfers } from './financeAccounts';
import { cheques } from './cheques';
import type { UnifiedTransaction } from '../types/transactions';
import { projectSaleTransaction, projectTransferTransaction } from '../utils/transactionProjection';
import { chequeMoneyEffect } from '../utils/financeTransactions';

const months: Record<string, string> = {
  Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
  Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12'
};

export function toIsoDate(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const [day, month, year] = value.split(' ');
  return `${year}-${months[month] ?? '01'}-${day.padStart(2, '0')}`;
}

function createdAt(date: string, time = '09:00:00') {
  return `${toIsoDate(date)}T${time}+06:00`;
}

function paymentAccounts(payments: Array<{ method: string; account?: string }> | undefined, fallback?: string) {
  if (payments?.length) return Array.from(new Set(payments.map((payment) => payment.account || payment.method)));
  return fallback ? [fallback] : [];
}

const saleRows = salesInvoices.map((sale) => projectSaleTransaction(sale, {
  transactionDate: sale.transactionDate ?? toIsoDate(sale.date),
  createdAt: sale.createdAt ?? createdAt(sale.date, sale.time === '11:42 AM' ? '11:42:00' : '10:00:00'),
  postedBy: sale.postedBy ?? sale.salesperson
}));

const saleReturnRows: UnifiedTransaction[] = salesReturns.map((item) => ({
  id: `sale-return-${item.id}`,
  source: 'sale-return',
  sourceId: item.id,
  sourceRoute: '/app/sales',
  reference: item.id,
  type: item.settlement === 'Cash refund' ? 'Customer Refund' : 'Sale Return',
  party: item.customer,
  details: item.items,
  transactionDate: item.transactionDate ?? toIsoDate(item.date),
  createdAt: item.createdAt ?? createdAt(item.date, '15:00:00'),
  postedBy: item.postedBy ?? 'Anis',
  amount: item.amount,
  moneyIn: 0,
  moneyOut: item.settlement === 'Cash refund' ? item.amount : 0,
  accounts: item.settlement === 'Cash refund' ? [item.refundAccount || item.refundMethod || 'Cash'] : [],
  status: item.recordStatus === 'Deleted' ? 'Deleted' : 'Posted',
  countsTowardCashflow: true
}));

const purchaseRows: UnifiedTransaction[] = purchases.map((item) => ({
  id: `purchase-${item.id}`,
  source: 'purchase',
  sourceId: item.id,
  sourceRoute: '/app/purchases',
  reference: item.ref,
  type: 'Purchase',
  party: item.supplier,
  partyId: item.supplierId,
  details: item.items,
  transactionDate: item.transactionDate ?? toIsoDate(item.date),
  createdAt: item.createdAt ?? createdAt(item.date, '12:00:00'),
  postedBy: item.postedBy ?? 'Anis',
  amount: item.total,
  moneyIn: 0,
  moneyOut: item.paid,
  accounts: paymentAccounts(item.payments, item.paid > 0 ? 'Cash' : undefined),
  paymentBreakdown: item.payments?.map((payment) => ({ label: payment.account || payment.method, amount: payment.amount })),
  due: Math.max(0, item.total - item.paid),
  status: item.recordStatus === 'Deleted' ? 'Deleted' : 'Posted',
  countsTowardCashflow: true
}));

const expenseRows: UnifiedTransaction[] = expenses.map((item) => ({
  id: `expense-${item.id}`,
  source: 'expense',
  sourceId: item.id,
  sourceRoute: '/app/expenses',
  reference: item.ref,
  type: 'Expense',
  party: item.payee,
  partyId: item.payeeId,
  details: `${item.category} · ${item.note}`,
  transactionDate: item.transactionDate ?? toIsoDate(item.date),
  createdAt: item.createdAt ?? createdAt(item.date, '18:00:00'),
  postedBy: item.postedBy ?? 'Anis',
  amount: item.amount,
  moneyIn: 0,
  moneyOut: item.paid,
  accounts: paymentAccounts(item.payments, item.paid > 0 ? item.method : undefined),
  paymentBreakdown: item.payments?.map((payment) => ({ label: payment.account || payment.method, amount: payment.amount })),
  due: Math.max(0, item.amount - item.paid),
  status: item.recordStatus === 'Deleted' ? 'Deleted' : 'Posted',
  countsTowardCashflow: true
}));

const financeRows: UnifiedTransaction[] = financeTransactions.map((item) => ({
  id: `finance-${item.id}`,
  source: 'finance',
  sourceId: item.id,
  sourceRoute: '/app/finance',
  reference: item.reference || item.id,
  type: item.type,
  party: item.party,
  partyId: item.partyId,
  details: item.note || item.relationship,
  transactionDate: toIsoDate(item.date),
  createdAt: createdAt(item.date, '13:00:00'),
  postedBy: item.createdBy,
  amount: item.amount,
  moneyIn: item.status === 'Reversed' || item.direction !== 'in' ? 0 : item.amount,
  moneyOut: item.status === 'Reversed' || item.direction !== 'out' ? 0 : item.amount,
  accounts: item.account ? [item.account] : [],
  status: item.status === 'Reversed' ? 'Reversed' : 'Posted',
  countsTowardCashflow: true
}));

const transferRows = accountTransfers.map((item) => projectTransferTransaction(item, {
  transactionDate: toIsoDate(item.date),
  createdAt: createdAt(item.date, '14:00:00'),
  postedBy: 'Anis'
}));

const chequeRows: UnifiedTransaction[] = cheques.map((item) => {
  const effect = chequeMoneyEffect(item);
  return {
    id: `cheque-${item.id}`,
    source: 'cheque',
    sourceId: item.id,
    sourceRoute: '/app/finance',
    reference: item.reference || item.id,
    type: `Cheque ${item.direction}`,
    party: item.party,
    partyId: item.partyId,
    details: `${item.bank} · #${item.chequeNumber} · ${item.status}`,
    transactionDate: item.chequeDate,
    createdAt: item.createdAt ?? `${item.receivedOrIssuedDate}T10:00:00+06:00`,
    postedBy: item.postedBy ?? 'Anis',
    amount: item.amount,
    moneyIn: effect.moneyIn,
    moneyOut: effect.moneyOut,
    accounts: item.depositAccount ? [item.depositAccount] : [],
    status: 'Posted',
    countsTowardCashflow: true
  };
});

const todayDemoRows: UnifiedTransaction[] = [
  {
    id: 'customer-payment-demo',
    source: 'customer-payment',
    sourceId: 'CP-000091',
    sourceRoute: '/app/parties',
    reference: 'CP-000091',
    type: 'Customer Payment',
    party: 'Rahman Hardware',
    partyId: 'c1',
    details: 'Payment against INV-000241',
    transactionDate: '2026-10-07',
    createdAt: '2026-10-07T09:42:00+06:00',
    postedBy: 'Rahim',
    amount: 10000,
    moneyIn: 10000,
    moneyOut: 0,
    accounts: ['bKash Business · 412'],
    paymentBreakdown: [{ label: 'bKash Business · 412', amount: 10000 }],
    status: 'Posted',
    countsTowardCashflow: true
  },
  {
    id: 'expense-demo-today',
    source: 'expense',
    sourceId: 'EXP-000062',
    sourceRoute: '/app/expenses',
    reference: 'EXP-000062',
    type: 'Expense',
    party: 'DESCO',
    details: 'Utilities · Electricity',
    transactionDate: '2026-10-07',
    createdAt: '2026-10-07T10:15:00+06:00',
    postedBy: 'Shuvo',
    amount: 2500,
    moneyIn: 0,
    moneyOut: 2500,
    accounts: ['Main Cash Counter'],
    status: 'Posted',
    countsTowardCashflow: true
  }
];

export const daybookTransactions: UnifiedTransaction[] = [
  ...todayDemoRows,
  ...saleRows,
  ...saleReturnRows,
  ...purchaseRows,
  ...expenseRows,
  ...financeRows,
  ...transferRows,
  ...chequeRows
];
