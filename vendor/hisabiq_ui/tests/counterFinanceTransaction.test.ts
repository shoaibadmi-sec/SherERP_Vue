import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  financePreviewRelationshipSummary,
  getFinancePreviewSnapshot,
  resetFinancePreviewForTest,
  subscribeFinancePreview,
  updateFinancePreview
} from '../src/data/financePreviewStore.ts';

test('Counter opens the existing Finance transaction dialog rather than a second form', () => {
  const counter = readFileSync('src/components/finance/CounterWorkspace.tsx', 'utf8');
  const finance = readFileSync('src/pages/Finance.tsx', 'utf8');
  assert.match(counter, /text\('Finance transaction','মালিক ও ঋণের টাকা'\)/);
  assert.match(counter, /aria-haspopup="dialog" onClick=\{onNewFinanceTransaction\}/);
  assert.match(finance, /onNewFinanceTransaction=\{\(\) => setTransactionOpen\(true\)\}/);
  assert.match(finance, /<TransactionDialog[\s\S]*?onSave=\{\(transaction\) => \{/);
  assert.match(finance, /applyTransactionMovement\(current, transaction, 1\)/);
});

test('Counter and Finance navigation share a single subscribed finance preview state', () => {
  resetFinancePreviewForTest();
  let notifications = 0;
  const unsubscribe = subscribeFinancePreview(() => { notifications++; });
  try {
    const before = getFinancePreviewSnapshot();
    const baseline = financePreviewRelationshipSummary(before.transactions);
    const cash = before.accounts.find(account => account.id === 'acc-cash');
    assert.ok(cash);
    const transaction = {
      ...before.transactions[0],
      id: 'FIN-COUNTER-TEST',
      type: 'Lender Credit' as const,
      partyId: 'fp2',
      party: 'Hafizur Rahman',
      amount: 175,
      direction: 'in' as const,
      accountId: 'acc-cash',
      account: cash.name,
      paymentAccounts: [{ method: 'Cash' as const, accountId: cash.id, account: cash.name, amount: 175 }]
    };
    updateFinancePreview('transactions', current => [transaction, ...current]);
    updateFinancePreview('accounts', current =>
      current.map(account => account.id === cash.id ? { ...account, balance: account.balance + transaction.amount } : account));
    const after = getFinancePreviewSnapshot();
    assert.equal(after.transactions[0].id, 'FIN-COUNTER-TEST');
    assert.equal(financePreviewRelationshipSummary(after.transactions).outstandingLoan, baseline.outstandingLoan + 175);
    assert.equal(after.accounts.find(account => account.id === cash.id)?.balance, cash.balance + 175);
    assert.equal(after.people.find(person => person.id === 'fp2')?.name, 'Hafizur Rahman');
    assert.equal(notifications, 2);
    assert.equal(before.transactions.some(row => row.id === transaction.id), false);
    // Opening relationship balances do not move cash/bank by themselves.
    const opening = { ...transaction, id: 'FIN-OPENING-TEST', type: 'Opening Loan' as const, direction: 'none' as const };
    const nextSummary = financePreviewRelationshipSummary([opening, ...after.transactions]);
    assert.equal(nextSummary.outstandingLoan, baseline.outstandingLoan + 350);
    assert.equal(getFinancePreviewSnapshot().accounts.find(account => account.id === cash.id)?.balance, cash.balance + 175);
  } finally {
    unsubscribe();
    resetFinancePreviewForTest();
  }
});

test('Finance person uses the joined select-and-settings action; transaction payment sources cannot create accounts inline', () => {
  const finance = readFileSync('src/pages/Finance.tsx', 'utf8');
  const split = readFileSync('src/components/finance/FinancePaymentSplitEditor.tsx', 'utf8');

  assert.match(finance, /id="finance-person-label"/);
  assert.match(finance, /aria-labelledby="finance-person-label"/);
  assert.match(finance, /\[&>button\]:rounded-r-none/);
  assert.match(finance, /<Settings className="size-4" aria-hidden="true" \/>/);
  assert.match(finance, /aria-label=\{text\('Manage people','ব্যক্তি যোগ \/ সংশোধন'\)\}/);
  assert.match(finance, /aria-haspopup="dialog"[\s\S]*?onClick=\{\(\) => setPeopleOpen\(true\)\}/);
  assert.match(finance, /<FinancePeopleManagerDialog open=\{open && peopleOpen\}/);
  assert.match(finance, /<FinancePaymentSplitEditor[\s\S]*?totalAmount=\{displayAmount\}[\s\S]*?\/>/);
  assert.doesNotMatch(finance, /accountTarget|onCreateAccount=/);
  assert.match(split, /onCreateAccount && <Button/,'other workflows may still opt into account creation');
});

test('new Finance transaction derives Amount and words from payment rows; opening balance remains editable',()=>{
 const finance = readFileSync('src/pages/Finance.tsx','utf8');
 assert.match(finance,/const transactionAmount = isOpening \? Number\(amount\) : financePaymentDraftTotal\(paymentRows\)/);
 assert.match(finance,/const value = transactionAmount/);
 assert.match(finance,/readOnly=\{!isOpening\}/);
 assert.match(finance,/value=\{isOpening \? amount : \(Number\.isFinite\(transactionAmount\)/);
 assert.match(finance,/<AmountInWordsDisplay amount=\{displayAmount\} \/>/);
 assert.match(finance,/financePaymentSplitsAreValid\(paymentRows, accounts, value\)/);
});
