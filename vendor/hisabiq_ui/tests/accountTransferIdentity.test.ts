import assert from 'node:assert/strict';
import { test } from 'node:test';
import { financeAccounts, type AccountTransfer, type FinanceAccount } from '../src/data/financeAccounts.ts';
import { financeAccountIdentityLabel, transferAccountId, transferAccountLabel, transferAccountName } from '../src/utils/accountTransferIdentity.ts';

const transfer: AccountTransfer = {
  id: 'TRF-test', date: '06 Oct 2026', from: 'Dutch-Bangla Bank · 4582', to: 'Main Cash Counter',
  fromAccountId: 'acc-dbl', toAccountId: 'acc-cash', amount: 100, status: 'Completed'
};

test('stable transfer IDs keep duplicate-name endpoints distinct', () => {
  const duplicate: FinanceAccount = { ...financeAccounts[1], id: 'acc-dbl-duplicate', balance: 1000, openingBalance: 1000 };
  const accounts = [...financeAccounts, duplicate];
  assert.equal(transferAccountId(transfer, 'from', accounts), 'acc-dbl');
  assert.equal(transferAccountLabel(transfer, 'from', accounts), 'Dutch-Bangla Bank · 4582 · -dbl');
  assert.equal(financeAccountIdentityLabel(duplicate, accounts), 'Dutch-Bangla Bank · 4582 · cate');
});

test('legacy name-only transfers resolve only while the endpoint is unique', () => {
  const legacy = { ...transfer, fromAccountId: undefined, toAccountId: undefined };
  assert.equal(transferAccountId(legacy, 'from', financeAccounts), 'acc-dbl');
  assert.equal(transferAccountName(legacy, 'from', financeAccounts), 'Dutch-Bangla Bank · 4582');
  const duplicate: FinanceAccount = { ...financeAccounts[1], id: 'acc-dbl-duplicate' };
  assert.equal(transferAccountId(legacy, 'from', [...financeAccounts, duplicate]), undefined);
  assert.equal(transferAccountLabel(legacy, 'from', [...financeAccounts, duplicate]), 'Dutch-Bangla Bank · 4582');
});

test('stored IDs follow account rename without rewriting the historical transfer', () => {
  const renamed = financeAccounts.map((account) => account.id === 'acc-dbl' ? { ...account, name: 'Renamed DBL' } : account);
  assert.equal(transferAccountName(transfer, 'from', renamed), 'Renamed DBL');
  assert.equal(transfer.from, 'Dutch-Bangla Bank · 4582');
});
