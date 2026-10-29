import test from 'node:test';
import assert from 'node:assert/strict';
import {businessToday} from '../src/utils/dateRange.ts';
import {dispatchPartyPreview,getPartyPreviewSnapshot,resetPartyPreviewForTest} from '../src/data/partyPreviewStore.ts';
import {validatePartyPayment} from '../src/utils/partyPayment.ts';
import {customerSettlementAsOf,supplierSettlementAsOf} from '../src/utils/partySettlement.ts';

const today=businessToday();
test('customer discount-only settlement closes due without moving cash or creating refundable credit',()=>{
 resetPartyPreviewForTest();
 const before=customerSettlementAsOf(getPartyPreviewSnapshot().sources,'c1',today);
 assert.ok(before.invoiceDue>=100,'fixture has a customer outstanding due');
 const after=dispatchPartyPreview({type:'record-payment',payload:{
  partyId:'c1',relationship:'Customer',date:today,amount:0,discount:100,
  reason:'Approved balance settlement',splits:[],operationId:'counter-discount-only'
 }});
 const saved=after.sources.find(s=>s.id==='party-payment:counter-discount-only');
 assert.ok(saved);
 assert.equal(saved.amountPaid,0);
 assert.equal(saved.discount,100);
 assert.deepEqual(saved.paymentSplits,[]);
 assert.equal(saved.method,'Settlement');
 const balance=customerSettlementAsOf(after.sources,'c1',today);
 assert.equal(balance.invoiceDue,before.invoiceDue-100);
 assert.equal(balance.refundableCredit,before.refundableCredit);
 assert.equal(balance.nonCashAdjustment,before.nonCashAdjustment+100);
});
test('supplier cash and settlement independently reduce payable',()=>{
 resetPartyPreviewForTest();
 const before=supplierSettlementAsOf(getPartyPreviewSnapshot().sources,'s1',today);
 assert.ok(before.invoiceDue>=150,'fixture has supplier payable');
 const next=dispatchPartyPreview({type:'record-payment',payload:{
  partyId:'s1',relationship:'Supplier',date:today,amount:100,discount:50,
  reason:'Agreed supplier discount',operationId:'counter-supplier-discount',
  splits:[{id:'cash',method:'Cash',accountId:'acc-cash',amount:100}]
 }});
 const saved=next.sources.find(s=>s.id==='party-payment:counter-supplier-discount');
 assert.ok(saved);
 assert.equal(saved.debit,150);
 assert.equal(saved.amountPaid,100);
 assert.equal(saved.discount,50);
 const after=supplierSettlementAsOf(next.sources,'s1',today);
 assert.equal(after.invoiceDue,before.invoiceDue-150);
 assert.equal(after.refundableCredit,before.refundableCredit);
});
test('discount must have a reason; over-settlement rejected atomically',()=>{
 resetPartyPreviewForTest();
 const snapshot=getPartyPreviewSnapshot();
 assert.throws(()=>validatePartyPayment({
  partyId:'c1',relationship:'Customer',date:today,amount:0,discount:20,splits:[]
 }),/reason/i);
 assert.strictEqual(getPartyPreviewSnapshot(),snapshot);
 assert.throws(()=>dispatchPartyPreview({type:'record-payment',payload:{
  partyId:'c1',relationship:'Customer',date:today,amount:0,discount:100000000,
  reason:'Too much',splits:[],operationId:'counter-overdue-rejected'
 }}),/discount|due/i);
 assert.strictEqual(getPartyPreviewSnapshot(),snapshot);
});
