import test from 'node:test';
import assert from 'node:assert/strict';
import {
  dateForView,
  isInDateRange,
  sortTransactionsByDate
} from '../src/utils/transactionDates.ts';
import type { UnifiedTransaction } from '../src/types/transactions.ts';

const rows: UnifiedTransaction[] = [
  {
    id: 'sale-1',
    source: 'sale',
    sourceId: 's1',
    reference: 'INV-1',
    type: 'Sale',
    transactionDate: '2026-10-05',
    createdAt: '2026-10-07T10:30:00+06:00',
    postedBy: 'Rahim',
    amount: 1000,
    moneyIn: 0,
    moneyOut: 0,
    accounts: [],
    status: 'Posted',
    countsTowardCashflow: true
  },
  {
    id: 'sale-2',
    source: 'sale',
    sourceId: 's2',
    reference: 'INV-2',
    type: 'Sale',
    transactionDate: '2026-10-07',
    createdAt: '2026-10-06T09:00:00+06:00',
    postedBy: 'Shuvo',
    amount: 500,
    moneyIn: 500,
    moneyOut: 0,
    accounts: ['Cash'],
    status: 'Posted',
    countsTowardCashflow: true
  }
];

test('date view defaults can use transaction date independently of created date', () => {
  assert.equal(dateForView(rows[0], 'transaction'), '2026-10-05');
  assert.equal(dateForView(rows[0], 'created'), '2026-10-07');
});

test('selected date and inclusive date ranges use the selected date view', () => {
  assert.equal(isInDateRange(rows[0], 'transaction', '2026-10-05', '2026-10-05'), true);
  assert.equal(isInDateRange(rows[0], 'transaction', '2026-10-06', '2026-10-07'), false);
  assert.equal(isInDateRange(rows[0], 'created', '2026-10-07', '2026-10-07'), true);
});

test('sorting follows transaction or created date without mutating source rows', () => {
  assert.deepEqual(sortTransactionsByDate(rows, 'transaction').map((row) => row.id), ['sale-2', 'sale-1']);
  assert.deepEqual(sortTransactionsByDate(rows, 'created').map((row) => row.id), ['sale-1', 'sale-2']);
  assert.deepEqual(rows.map((row) => row.id), ['sale-1', 'sale-2']);
});
