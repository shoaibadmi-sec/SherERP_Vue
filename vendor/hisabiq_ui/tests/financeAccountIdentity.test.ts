import assert from 'node:assert/strict';
import test from 'node:test';
import { financeAccountOptionLabel, type FinanceAccount } from '../src/data/financeAccounts.ts';

const account = (id: string, overrides: Partial<FinanceAccount> = {}): FinanceAccount => ({
  id, name: 'Dutch-Bangla Bank', type: 'Bank', balance: 214650, openingBalance: 214650, status: 'Active', lastActivity: 'Now', ...overrides,
});

test('finance account option labels identify duplicate names by masked account number or source ID', () => {
  const numbered = [account('acc-dbl', { number: '•••• 4582' }), account('acc-9999', { number: '•••• 9999' })];
  assert.equal(financeAccountOptionLabel(numbered[0], numbered), 'Dutch-Bangla Bank · •••• 4582');
  assert.equal(financeAccountOptionLabel(numbered[1], numbered), 'Dutch-Bangla Bank · •••• 9999');

  const repeatedNumbers = [account('account-1031', { number: '•••• 4582' }), account('account-2042', { number: '•••• 4582' })];
  assert.equal(financeAccountOptionLabel(repeatedNumbers[0], repeatedNumbers), 'Dutch-Bangla Bank · 1031');
  assert.equal(financeAccountOptionLabel(repeatedNumbers[1], repeatedNumbers), 'Dutch-Bangla Bank · 2042');
});
