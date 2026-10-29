import {test} from 'node:test';
import assert from 'node:assert/strict';
import {financeAccounts} from '../src/data/financeAccounts.ts';
import {chequeMoneyAccount} from '../src/utils/chequeAccount.ts';

test('cheque clearance requires one existing active bank identity',()=>{
 const bank=financeAccounts.find(a=>a.id==='acc-dbl');
 assert.ok(bank);
 assert.equal(chequeMoneyAccount(financeAccounts,{depositAccount:bank.name})?.id,bank.id);
 assert.equal(chequeMoneyAccount(financeAccounts,{}) ,undefined);
 assert.equal(chequeMoneyAccount(financeAccounts,{depositAccount:'Nonexistent bank'}),undefined);
 assert.equal(chequeMoneyAccount(financeAccounts,{depositAccount:'Main Cash Counter'}),undefined);
 assert.equal(chequeMoneyAccount([{...bank,status:'Inactive'}],{depositAccount:bank.name}),undefined);
 assert.equal(chequeMoneyAccount([bank,{...bank,id:'different-bank'}],{depositAccount:bank.name}),undefined);
});
