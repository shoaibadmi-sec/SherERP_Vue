import assert from 'node:assert/strict';
import {test} from 'node:test';
import {financeAccounts} from '../src/data/financeAccounts.ts';
import {normalizeFinancePaymentSplits,financePaymentSplitsAreValid,financePaymentDraftTotal,type FinancePaymentDraft} from '../src/utils/financePaymentDrafts.ts';
const draft=(amount:string,id='one'):FinancePaymentDraft=>({id,method:'Cash',accountId:'acc-cash',amount});
test('only a single blank payment source uses the transaction fallback',()=>{
 assert.equal(normalizeFinancePaymentSplits([draft('')],financeAccounts,100)[0].amount,100);
 assert.equal(financePaymentSplitsAreValid([draft('')],financeAccounts,100),true);
 assert.equal(financePaymentSplitsAreValid([draft('0')],financeAccounts,100),false);
});
test('malformed and nonfinite payment sources cannot be truncated or ignored',()=>{
 for(const value of ['100.0.0','9'.repeat(400)])assert.equal(financePaymentSplitsAreValid([draft(value)],financeAccounts,100),false);
 assert.equal(financePaymentSplitsAreValid([draft('100'),draft('0','two')],financeAccounts,100),false);
 assert.equal(financePaymentSplitsAreValid([draft('100'),draft('','two')],financeAccounts,100),false);
});
test('valid split sources retain exact amounts and must sum to the transaction',()=>{
 const rows=[draft('25.50'),draft('74.50','two')];
 assert.equal(financePaymentSplitsAreValid(rows,financeAccounts,100),true);
 assert.deepEqual(normalizeFinancePaymentSplits(rows,financeAccounts,100).map(x=>x.amount),[25.5,74.5]);
 assert.equal(financePaymentSplitsAreValid(rows,financeAccounts,101),false);
 assert.equal(financePaymentSplitsAreValid([{...draft('100'),accountId:'missing'}],financeAccounts,100),false);
});
test('the existing inclusive 0.001 split tolerance remains unchanged',()=>{
 assert.equal(financePaymentSplitsAreValid([draft('0.002')],financeAccounts,0.001),true);
 assert.equal(financePaymentSplitsAreValid([draft('0.0021')],financeAccounts,0.001),false);
});

test('Finance total follows a single payment source without a second amount entry',()=>{
 assert.equal(financePaymentDraftTotal([draft('4545')]),4545);
 assert.equal(financePaymentDraftTotal([draft('')]),0);
 assert.equal(financePaymentDraftTotal([draft('0')]),0);
});
test('Finance source total updates with split payments, edits and removal in exact paisa',()=>{
 const first=draft('150.10');
 const second=draft('24.35','two');
 assert.equal(financePaymentDraftTotal([first,second]),174.45);
 assert.equal(financePaymentDraftTotal([first,{...second,amount:'25.40'}]),175.50);
 assert.equal(financePaymentDraftTotal([first]),150.10);
 assert.equal(financePaymentDraftTotal([draft('0.10'),draft('0.20','two')]),0.30);
});
test('malformed, nonfinite or sub-paisa payment drafts never create a calculated amount',()=>{
 for(const invalid of ['1.2.3','12.345','-25','abc','9'.repeat(400),'1e3']){
  assert.ok(Number.isNaN(financePaymentDraftTotal([draft(invalid)])),invalid);
 }
 assert.ok(Number.isNaN(financePaymentDraftTotal([draft('25'),draft('bad','two')])));
});
