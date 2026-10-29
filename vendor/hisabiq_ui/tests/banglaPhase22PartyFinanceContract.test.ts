import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {uiText} from '../src/i18n/uiCopy.ts';

const file=(path:string)=>readFileSync(path,'utf8');

test('Financial validation errors use presentation-only Bangla mapping',()=>{
 const copy=file('src/i18n/partyFinancialCopy.ts');
 for(const key of ['Enter a refund reason.','Payment split total does not match entered amount.',
  'Finance amount must be greater than zero.','Payment sources must add up to the amount.',
  'Choose a valid business date not in the future.']){
  assert.ok(copy.includes(key),key);
 }
 assert.match(copy,/if\(language!==['"]Bangla['"]\)return message/);
 assert.match(copy,/validationCopy\[message\]\?\?message/);
 for(const [en,bn] of [
  ['Refundable','ফেরতযোগ্য'],
  ['Review payment','পেমেন্ট যাচাই করুন'],
  ['Confirm the refund','ফেরতের হিসাব নিশ্চিত করুন']
 ]){
  assert.equal(uiText('English',en,bn),en);
  assert.equal(uiText('English + Bangla',en,bn),en);
  assert.equal(uiText('Bangla',en,bn),bn);
 }
});

test('Financial dialogs preserve fields, source-linked correction, separate party roles and preview-only payment',()=>{
 const payment=file('src/components/parties/PartyPaymentDialog.tsx');
 const refund=file('src/components/parties/PartyCreditRefundDialog.tsx');
 const finance=file('src/components/parties/PartyFinanceDialog.tsx');
 const correction=file('src/components/parties/PartyTransactionDialog.tsx');
 const invariant={
  payment:['relationship,date,amount:net,discount:rebate','invoiceId:invoiceId||undefined','paymentSplits'],
  refund:['customerSettlementAsOf(sources,party.id,date)','supplierSettlementAsOf(sources,party.id,date)','amount>available','splits:rows'],
  finance:['validateBusinessDate(date)','validatePartySplits(paymentSplits,money)','financeType:type','opening?[]:splits'],
  correction:['onReverse(source.id,reason.trim())','onEdit(source.id,payload,reason.trim())','source.relationship as'],
 };
 for(const [component,src] of [['payment',payment],['refund',refund],['finance',finance],['correction',correction]] as const){
  for(const match of invariant[component])assert.ok(src.includes(match),component+': '+match);
  assert.ok(src.includes('partyFinancialErrorText(language,'),component+' error localization');
 }
 assert.ok(payment.includes('No bank transfer or real accounting posting occurs.'));
 assert.ok(refund.includes('not a real bank posting.'));
 assert.ok(finance.includes('not a real money transfer.'));
 assert.ok(correction.includes('never the original Sales or Purchase transaction.'));
});

test('Party statement print translates source labels but retains CSV serializer and money/date values',()=>{
 const s=file('src/components/parties/PartyStatementDialog.tsx');
 const copy=file('src/i18n/partyFinancialCopy.ts');
 assert.match(s,/partyLedgerImpactText\(language,ledgerImpact\(row\)\.label\)/);
 for(const label of ['Customer due increased','Supplier payable increased','Non-cash adjustment','Money in','Money out']){
  assert.ok(copy.includes(label));
 }
 for(const source of ['serializePartyStatementCsv(statement,','statementPrintRows(statement)','row.runningBalance','statement.openingBalance','statement.closingBalance']){
  assert.ok(s.includes(source),source);
 }
});
