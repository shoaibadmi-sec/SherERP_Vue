import test from 'node:test';
import assert from 'node:assert/strict';
import { postingForTransaction, trialBalance, profitAndLoss, balanceSheet, ledgerForAccount } from '../src/utils/accountingProjection.ts';

test('cash sale creates a balanced sale and COGS posting', () => {
  const posting = postingForTransaction({
    id: 's1', source: 'sale', reference: 'INV-1',
    transactionDate: '2026-10-07', createdAt: '2026-10-07T10:00:00+06:00', postedBy: 'Rahim',
    amount: 1000, paid: 1000, due: 0,
    paymentAccounts: [{ account: 'Main Cash Counter', amount: 1000 }], cogs: 700
  });
  assert.deepEqual(posting.lines.map((line) => [line.accountId, line.debit, line.credit]), [
    ['asset-cash', 1000, 0], ['income-sales', 0, 1000],
    ['expense-cogs', 700, 0], ['asset-inventory', 0, 700]
  ]);
  assert.equal(posting.lines.reduce((sum, line) => sum + line.debit, 0), 1700);
  assert.equal(posting.lines.reduce((sum, line) => sum + line.credit, 0), 1700);
});

test('credit sale splits paid money from customer due', () => {
  const posting = postingForTransaction({
    id: 's2', source: 'sale', reference: 'INV-2',
    transactionDate: '2026-10-07', createdAt: '2026-10-07T10:00:00+06:00', postedBy: 'Rahim',
    amount: 1500, paid: 500, due: 1000,
    paymentAccounts: [{ account: 'bKash Business · 412', amount: 500 }], cogs: 900
  });
  assert.ok(posting.lines.some((line) => line.accountId === 'asset-mfs' && line.debit === 500));
  assert.ok(posting.lines.some((line) => line.accountId === 'asset-ar' && line.debit === 1000));
  assert.ok(posting.lines.some((line) => line.accountId === 'income-sales' && line.credit === 1500));
});

test('customer payment reduces customer due without adding revenue', () => {
  const posting = postingForTransaction({
    id: 'cp1', source: 'customer-payment', reference: 'CP-1',
    transactionDate: '2026-10-08', createdAt: '2026-10-08T11:00:00+06:00', postedBy: 'Shuvo',
    amount: 1000, paid: 1000, due: 0,
    paymentAccounts: [{ account: 'Dutch-Bangla Bank · 4582', amount: 1000 }]
  });
  assert.deepEqual(posting.lines.map((line) => [line.accountId, line.debit, line.credit]), [
    ['asset-bank', 1000, 0], ['asset-ar', 0, 1000]
  ]);
});

test('internal transfer stays balanced without income or expense', () => {
  const posting = postingForTransaction({
    id: 't1', source: 'transfer', reference: 'TRF-1',
    transactionDate: '2026-10-08', createdAt: '2026-10-08T12:00:00+06:00', postedBy: 'Shuvo',
    amount: 25000, paid: 25000, due: 0,
    fromAccount: 'Main Cash Counter', toAccount: 'Dutch-Bangla Bank · 4582'
  });
  assert.deepEqual(posting.lines.map((line) => [line.accountId, line.debit, line.credit]), [
    ['asset-bank', 25000, 0], ['asset-cash', 0, 25000]
  ]);
});

test('reports use transaction date while ledger may display created date', () => {
  const sale = postingForTransaction({
    id: 's3', source: 'sale', reference: 'INV-3',
    transactionDate: '2026-09-30', createdAt: '2026-10-07T10:00:00+06:00', postedBy: 'Rahim',
    amount: 1000, paid: 1000, due: 0,
    paymentAccounts: [{ account: 'Main Cash Counter', amount: 1000 }], cogs: 600
  });
  const tb = trialBalance([sale]);
  assert.equal(tb.totalDebit, tb.totalCredit);
  assert.deepEqual(profitAndLoss([sale], { from: '2026-09-01', to: '2026-09-30' }), { income: 1000, expenses: 600, netProfit: 400 });
  assert.equal(profitAndLoss([sale], { from: '2026-10-01', to: '2026-10-31' }).income, 0);
  assert.equal(ledgerForAccount('income-sales', [sale], 'created')[0].displayDate, '2026-10-07');
  assert.deepEqual(balanceSheet([sale], '2026-09-30'), { assets: 400, liabilities: 0, equity: 400, balanced: true });
});
