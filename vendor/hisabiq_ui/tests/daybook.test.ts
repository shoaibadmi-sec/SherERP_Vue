import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cashflowSummary,
  filterDaybookTransactions
} from '../src/utils/daybook.ts';
import type { UnifiedTransaction } from '../src/types/transactions.ts';

const rows: UnifiedTransaction[] = [
  {
    id: 'sale-credit',
    source: 'sale',
    sourceId: 's1',
    reference: 'INV-1',
    type: 'Sale',
    party: 'Rahman Hardware',
    transactionDate: '2026-10-05',
    createdAt: '2026-10-07T09:00:00+06:00',
    postedBy: 'Rahim',
    amount: 15000,
    moneyIn: 0,
    moneyOut: 0,
    accounts: [],
    due: 15000,
    status: 'Posted',
    countsTowardCashflow: true
  },
  {
    id: 'payment',
    source: 'customer-payment',
    sourceId: 'cp1',
    reference: 'PAY-1',
    type: 'Customer Payment',
    party: 'Rahman Hardware',
    transactionDate: '2026-10-06',
    createdAt: '2026-10-07T09:30:00+06:00',
    postedBy: 'Shuvo',
    amount: 10000,
    moneyIn: 10000,
    moneyOut: 0,
    accounts: ['bKash Merchant'],
    status: 'Posted',
    countsTowardCashflow: true
  },
  {
    id: 'refund',
    source: 'sale-return',
    sourceId: 'r1',
    reference: 'RTN-1',
    type: 'Customer Refund',
    party: 'Rahman Hardware',
    transactionDate: '2026-10-07',
    createdAt: '2026-10-07T10:00:00+06:00',
    postedBy: 'Rahim',
    amount: 2000,
    moneyIn: 0,
    moneyOut: 2000,
    accounts: ['Cash'],
    status: 'Posted',
    countsTowardCashflow: true
  },
  {
    id: 'transfer',
    source: 'transfer',
    sourceId: 't1',
    reference: 'TRF-1',
    type: 'Account Transfer',
    transactionDate: '2026-10-07',
    createdAt: '2026-10-07T11:00:00+06:00',
    postedBy: 'Shuvo',
    amount: 25000,
    moneyIn: 25000,
    moneyOut: 25000,
    accounts: ['Cash', 'DBBL'],
    status: 'Posted',
    countsTowardCashflow: false
  }
];

test('filters a selected transaction date', () => {
  const result = filterDaybookTransactions(rows, {
    dateView: 'transaction',
    from: '2026-10-06',
    to: '2026-10-06'
  });
  assert.deepEqual(result.map((row) => row.id), ['payment']);
});

test('filters an inclusive selected date range', () => {
  const result = filterDaybookTransactions(rows, {
    dateView: 'transaction',
    from: '2026-10-05',
    to: '2026-10-06'
  });
  assert.deepEqual(result.map((row) => row.id), ['payment', 'sale-credit']);
});

test('cashflow summary uses actual movement and excludes internal transfers', () => {
  assert.deepEqual(cashflowSummary(rows), {
    moneyIn: 10000,
    moneyOut: 2000,
    net: 8000
  });
});

test('fuzzy party discovery keeps Daybook date, type and account restrictions',()=>{
 const query={dateView:'transaction' as const,search:'Rahamn hardwre',from:'2026-10-06',to:'2026-10-06',type:'Customer Payment',account:'bKash Merchant'};
 assert.deepEqual(filterDaybookTransactions(rows,query).map(row=>row.id),['payment']);
 assert.deepEqual(filterDaybookTransactions(rows,{...query,account:'Cash'}),[]);
 assert.deepEqual(filterDaybookTransactions(rows,{...query,search:'PAY-2'}),[]);
});
