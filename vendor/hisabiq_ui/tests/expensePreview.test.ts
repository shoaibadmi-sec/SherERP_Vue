import test from 'node:test';
import assert from 'node:assert/strict';
import { savePreviewExpense, cancelPreviewExpense, attachPreviewExpenseReceipt, getExpensePreviewSnapshot, resetExpensePreviewForTest } from '../src/data/expensePreviewStore.ts';
import type { Expense } from '../src/types/erp.ts';

const expense = (): Expense => ({ id: 'expense-test', ref: 'EXP-TEST', date: '01 Oct 2026', category: 'Transport', payee: 'Test payee', note: 'Delivery', amount: 100.3, paid: 100.3, method: 'Cash', payments: [{id: 'a', method: 'Cash', account: 'Cash counter', amount: 100}, {id: 'b', method: 'Bank', account: 'Bank', amount: 0.3}] });
test('expense source correction retains identity, records before/after and requires a reason', () => {
  resetExpensePreviewForTest(); savePreviewExpense({...expense(), backdateReason: 'Late delivery entry'});
  const created = getExpensePreviewSnapshot().expenses[0];
  assert.equal(getExpensePreviewSnapshot().audit[0].reason, 'Late delivery entry');
  assert.throws(() => savePreviewExpense({...created, amount: 120}), /reason/);
  assert.throws(() => savePreviewExpense({...created, ref: 'WRONG'}, 'Mistake'), /reference/);
  savePreviewExpense({...created, amount: 120}, 'Correct amount');
  const state = getExpensePreviewSnapshot();
  assert.equal(state.expenses[0].createdAt, created.createdAt);
  assert.equal(state.audit.at(-1)?.before?.amount, 100.3);
  assert.equal(state.audit.at(-1)?.after.amount, 120);
  assert.equal(state.audit.at(-1)?.reason, 'Correct amount');
});
test('invalid money/date/split rejects atomically without changing preview state', () => {
  resetExpensePreviewForTest(); const before = getExpensePreviewSnapshot();
  for (const patch of [{amount: -1}, {amount: NaN}, {amount: Infinity}, {amount: 100.301}, {paid: 101}, {date: '31 Feb 2026'}, {date: '01 Jan 2099'}, {payments: []}, {payments: [{id: 'a', method: 'Cash' as const, account: '', amount: 100.3}]}]) {
    assert.throws(() => savePreviewExpense({...expense(), ...patch}));
    assert.equal(getExpensePreviewSnapshot(), before);
  }
});
test('receipt changes and cancellation preserve source history; cancelled expense cannot change again', () => {
  resetExpensePreviewForTest(); savePreviewExpense(expense());
  attachPreviewExpenseReceipt('expense-test', 'blob:receipt-preview');
  assert.equal(getExpensePreviewSnapshot().expenses[0].receipt, 'blob:receipt-preview');
  assert.throws(() => cancelPreviewExpense('expense-test', ''), /reason/);
  cancelPreviewExpense('expense-test', 'Duplicate expense');
  const state = getExpensePreviewSnapshot();
  assert.equal(state.expenses[0].recordStatus, 'Deleted');
  assert.equal(state.expenses[0].amount, 100.3);
  assert.equal(state.audit.at(-1)?.reason, 'Duplicate expense');
  assert.throws(() => cancelPreviewExpense('expense-test', 'Again'), /active/);
  assert.throws(() => savePreviewExpense(expense(), 'Again'), /Cancelled/);
  assert.throws(() => attachPreviewExpenseReceipt('expense-test', 'new'), /active/);
  assert.equal(getExpensePreviewSnapshot(), state);
});
