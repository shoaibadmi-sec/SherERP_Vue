import test from 'node:test';
import assert from 'node:assert/strict';
import {
  projectSaleTransaction,
  projectTransferTransaction
} from '../src/utils/transactionProjection.ts';

test('credit sale has no money movement', () => {
  const row = projectSaleTransaction({
    id: 's1',
    invoice: 'INV-1',
    date: '07 Oct 2026',
    time: '10:00 AM',
    party: 'Rahman Hardware',
    items: 1,
    total: 15000,
    paid: 0,
    due: 15000,
    method: 'Cash',
    payments: [],
    salesperson: 'Rahim'
  }, {
    transactionDate: '2026-10-07',
    createdAt: '2026-10-07T10:01:00+06:00'
  });

  assert.equal(row.moneyIn, 0);
  assert.equal(row.moneyOut, 0);
  assert.equal(row.amount, 15000);
});

test('partial multi-payment sale is one row with actual money in and account summary', () => {
  const row = projectSaleTransaction({
    id: 's2',
    invoice: 'INV-2',
    date: '07 Oct 2026',
    time: '11:00 AM',
    party: 'Mim Construction',
    items: 1,
    total: 20000,
    paid: 15000,
    due: 5000,
    method: 'Bank',
    payments: [
      { id: 'p1', method: 'Cash', amount: 8000 },
      { id: 'p2', method: 'bKash', amount: 7000, account: 'bKash Merchant' }
    ],
    salesperson: 'Shuvo'
  }, {
    transactionDate: '2026-10-07',
    createdAt: '2026-10-07T11:02:00+06:00'
  });

  assert.equal(row.moneyIn, 15000);
  assert.equal(row.moneyOut, 0);
  assert.deepEqual(row.accounts, ['Cash', 'bKash Merchant']);
});

test('internal transfer shows both directions but does not count toward business cashflow', () => {
  const row = projectTransferTransaction({
    id: 'TRF-1',
    date: '07 Oct 2026',
    from: 'Main Cash Counter',
    to: 'Dutch-Bangla Bank',
    amount: 25000,
    status: 'Completed'
  }, {
    transactionDate: '2026-10-07',
    createdAt: '2026-10-07T12:00:00+06:00',
    postedBy: 'Shuvo'
  });

  assert.equal(row.moneyIn, 25000);
  assert.equal(row.moneyOut, 25000);
  assert.equal(row.countsTowardCashflow, false);
  assert.deepEqual(row.accounts, ['Main Cash Counter', 'Dutch-Bangla Bank']);
});
