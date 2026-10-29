import assert from 'node:assert/strict';
import test from 'node:test';
import type { ChequeRecord } from '../src/data/cheques.ts';
import type { FinanceAccount } from '../src/data/financeAccounts.ts';
import { chequeMoneyAccount, renameChequeAccountReferences, resolveChequeAccount } from '../src/utils/chequeAccount.ts';

const account = (id: string, name: string, number: string, status: FinanceAccount['status'] = 'Active'): FinanceAccount => ({
  id, name, number, type: 'Bank', balance: 0, openingBalance: 0, status, lastActivity: ''
});

const cheque = (id: string, depositAccount: string, depositAccountId?: string): ChequeRecord => ({
  id, direction: 'Received', chequeNumber: id, bank: 'Cheque bank', amount: 10, party: 'Party',
  receivedOrIssuedDate: '2026-10-17', chequeDate: '2026-10-17', depositAccount, depositAccountId,
  status: 'Received'
});

test('cheque references follow account identity when a duplicate display name is renamed', () => {
  const original = account('acc-original', 'Dutch-Bangla Bank · 4582', '•••• 4582');
  const duplicate = account('acc-duplicate', original.name, '•••• 9999');
  const updated = { ...duplicate, name: 'Renamed duplicate bank' };
  const linked = cheque('CHQ-linked-original', original.name, original.id);

  const changed = renameChequeAccountReferences([linked], [original, duplicate], updated, original.name);

  assert.equal(changed[0].depositAccountId, original.id);
  assert.equal(changed[0].depositAccount, original.name);
  assert.equal(chequeMoneyAccount([original, updated], changed[0])?.id, original.id);
});

test('legacy cheque name resolution rejects duplicate accounts until an ID is selected', () => {
  const name = 'Dutch-Bangla Bank · 4582';
  const accounts = [account('acc-one', name, '•••• 1111'), account('acc-two', name, '•••• 2222')];
  const legacy = cheque('CHQ-legacy', name);

  assert.equal(resolveChequeAccount(accounts, legacy), undefined);
  assert.equal(chequeMoneyAccount(accounts, legacy), undefined);
  assert.equal(resolveChequeAccount(accounts, { ...legacy, depositAccountId: 'acc-two' })?.id, 'acc-two');
});

test('deactivating one duplicate bank does not resolve an ambiguous legacy cheque',()=>{
  const accounts=[account('old','Shared bank','1111','Inactive'),account('new','Shared bank','2222')];
  const legacy=cheque('legacy','Shared bank');
  assert.equal(resolveChequeAccount(accounts,legacy),undefined);
  assert.equal(chequeMoneyAccount(accounts,legacy),undefined);
  assert.equal(chequeMoneyAccount(accounts,{...legacy,depositAccountId:'new'})?.id,'new');
});

test('unique legacy names are upgraded on rename and inactive banks cannot clear', () => {
  const old = account('acc-legacy', 'Legacy Bank', '•••• 1188');
  const updated = { ...old, name: 'Renamed Legacy Bank' };
  const legacy = cheque('CHQ-legacy', old.name);
  const [upgraded] = renameChequeAccountReferences([legacy], [old], updated, old.name);

  assert.equal(upgraded.depositAccountId, old.id);
  assert.equal(upgraded.depositAccount, updated.name);
  assert.equal(resolveChequeAccount([{ ...updated, status: 'Inactive' }], upgraded)?.id, old.id);
  assert.equal(chequeMoneyAccount([{ ...updated, status: 'Inactive' }], upgraded), undefined);
});
