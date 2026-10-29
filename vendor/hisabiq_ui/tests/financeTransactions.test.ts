import test from 'node:test';
import assert from 'node:assert/strict';
import { chequeMoneyEffect } from '../src/utils/financeTransactions.ts';
import type { ChequeRecord } from '../src/data/cheques.ts';

const received: ChequeRecord = {
  id: 'CHQ-1',
  direction: 'Received',
  chequeNumber: '123456',
  bank: 'Dutch-Bangla Bank',
  amount: 20000,
  party: 'Rahman Hardware',
  receivedOrIssuedDate: '2026-10-07',
  chequeDate: '2026-10-10',
  status: 'Received'
};

test('uncleared received cheque does not move bank balance', () => {
  assert.deepEqual(chequeMoneyEffect(received), { moneyIn: 0, moneyOut: 0 });
  assert.deepEqual(chequeMoneyEffect({ ...received, status: 'Deposited' }), { moneyIn: 0, moneyOut: 0 });
});

test('cleared received cheque moves money in once', () => {
  assert.deepEqual(chequeMoneyEffect({ ...received, status: 'Cleared' }), { moneyIn: 20000, moneyOut: 0 });
});

test('cleared issued cheque moves money out', () => {
  assert.deepEqual(chequeMoneyEffect({
    ...received,
    direction: 'Issued',
    party: 'Karim Traders',
    status: 'Cleared'
  }), { moneyIn: 0, moneyOut: 20000 });
});
