import test from 'node:test';
import assert from 'node:assert/strict';
import {dispatchPartyPreview,getPartyPreviewSnapshot,resetPartyPreviewForTest} from '../src/data/partyPreviewStore.ts';
import {customerSettlementAsOf,supplierSettlementAsOf} from '../src/utils/partySettlement.ts';
const split=[{id:'s1',method:'Cash' as const,accountId:'acc-cash',amount:50}];
function newCustomer(){
 dispatchPartyPreview({type:'create-party',party:{id:'credit-qa',name:'Advance Customer',roles:['Customer','Supplier'],phone:'01711111111',area:'Dhaka'}});
}
function deposit(role:'Customer'|'Supplier'='Customer'){
 return dispatchPartyPreview({type:'record-payment',payload:{partyId:'credit-qa',relationship:role,
 date:'2026-10-02',amount:50,splits:split,operationId:'deposit-2026'}});
}
test('customer cash-backed credit can be refunded only once and only as of funding date',()=>{
 resetPartyPreviewForTest();newCustomer();deposit();
 const before=getPartyPreviewSnapshot();
 assert.throws(()=>dispatchPartyPreview({type:'refund-credit',payload:{partyId:'credit-qa',relationship:'Customer',date:'2026-10-01',amount:30,
 reason:'Customer requested cash back',splits:[{...split[0],amount:30}]}}),/credit|available/i);
 assert.strictEqual(getPartyPreviewSnapshot(),before);
 const after=dispatchPartyPreview({type:'refund-credit',payload:{partyId:'credit-qa',relationship:'Customer',date:'2026-10-03',amount:30,
 reason:'Customer requested cash back',splits:[{...split[0],amount:30}],operationId:'refund-2026'}});
 assert.equal(after.sources.filter(x=>x.kind==='customer-credit-refund').length,1);
 assert.equal(customerSettlementAsOf(after.sources,'credit-qa','2026-10-04').refundableCredit,20);
 assert.throws(()=>dispatchPartyPreview({type:'refund-credit',payload:{partyId:'credit-qa',relationship:'Customer',date:'2026-10-03',amount:30,
 reason:'Second payout',splits:[{...split[0],amount:30}]}}),/credit|available/i);
 assert.throws(()=>dispatchPartyPreview({type:'refund-credit',payload:{partyId:'credit-qa',relationship:'Customer',date:'2026-10-03',amount:10,
 reason:'Duplicate operation',splits:[{...split[0],amount:10}],operationId:'refund-2026'}}),/Duplicate/i);
});
test('supplier advance refund records incoming cash/credit, not customer debit',()=>{
 resetPartyPreviewForTest();newCustomer();deposit('Supplier');
 const after=dispatchPartyPreview({type:'refund-credit',payload:{partyId:'credit-qa',relationship:'Supplier',
  date:'2026-10-03',amount:20,reason:'Supplier returned advance',
  splits:[{...split[0],amount:20}]}});
 const evt=after.sources.filter(x=>x.kind==='supplier-credit-refund').at(-1);
 assert.equal(evt?.credit,20);assert.equal(evt?.debit,0);
 assert.equal(supplierSettlementAsOf(after.sources,'credit-qa','2026-10-04').refundableCredit,30);
});
