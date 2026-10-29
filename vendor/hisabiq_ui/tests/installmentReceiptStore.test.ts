import assert from 'node:assert/strict';
import {test,beforeEach} from 'node:test';
import {generateInstallmentSchedule} from '../src/installments/schedule.ts';
import {
 recordInstallmentPreview,getInstallmentPreview,recordInstallmentReceiptPreview,listInstallmentReceipts,
 resetInstallmentPreviewsForTest
} from '../src/data/installmentPreviewStore.ts';
import {validateInstallmentCollection} from '../src/installments/validateCollection.ts';
import {allocateOldestInstallments} from '../src/installments/collections.ts';
import {financeAccounts} from '../src/data/financeAccounts.ts';
import {getPartyPreviewSnapshot} from '../src/data/partyPreviewStore.ts';
beforeEach(()=>resetInstallmentPreviewsForTest());
function agreement(){
 return recordInstallmentPreview({
   operationId:'test-sale',invoiceReference:'INV-777',customerId:'c1',customerName:'Customer',
   totalPaisa:3300000,downPaymentPaisa:300000,
   schedule:generateInstallmentSchedule({remainingPaisa:3000000,count:6,firstDueDate:'2026-11-17',frequency:'Monthly'}),
   lineSnapshot:[{key:'line',productId:'p1',amountPaisa:3300000}],
   paymentSnapshot:[{method:'Cash',account:'Cash Register',amountPaisa:300000}]
 });
}
function payload(id:string,amountPaisa=250000){
 const a=agreement();
 return {agreementId:a.id,operationId:id,date:'2026-10-17',amountPaisa,
   allocations:allocateOldestInstallments(a,[],amountPaisa),
   splits:[{method:'Cash' as const,accountId:'acc-cash',amountPaisa}]};
}
test('partial receipt is idempotent and receipt details are immutable snapshots',()=>{
 const input=payload('payment-1');
 const a=recordInstallmentReceiptPreview(input),b=recordInstallmentReceiptPreview(input);
 assert.equal(a.id,b.id);
 assert.equal(listInstallmentReceipts(input.agreementId).length,1);
 a.allocations[0].amountPaisa=1;
 assert.equal(listInstallmentReceipts(input.agreementId)[0].allocations[0].amountPaisa,250000);
 assert.throws(()=>recordInstallmentReceiptPreview({...input,amountPaisa:400000}),/operation|different|idempot/i);
});
test('receipt cannot exceed agreement or use nonexisting installment, wrong split amount',()=>{
 const input=payload('payment-2');
 assert.throws(()=>recordInstallmentReceiptPreview({...input,amountPaisa:3000001,splits:[{method:'Cash',accountId:'acc-cash',amountPaisa:3000001}]}),/outstanding|exceed|allocation/i);
 assert.throws(()=>recordInstallmentReceiptPreview({...input,allocations:[{scheduleItemId:'other',amountPaisa:250000}]}),/unknown|schedule/i);
 assert.throws(()=>recordInstallmentReceiptPreview({...input,splits:[{method:'Cash',accountId:'acc-cash',amountPaisa:10}]}),/split/i);
 assert.equal(listInstallmentReceipts(input.agreementId).length,0);
});
test('inactive/wrong cash or MFS account and future date are rejected before record mutation',()=>{
 const input=payload('payment-3');
 assert.match(validateInstallmentCollection({...input,agreement:getInstallmentPreview(input.agreementId)!,splits:[{method:'Bank',accountId:'acc-cash',amountPaisa:250000}]},[]).join(' '),/method|account/i);
 assert.match(validateInstallmentCollection({...input,agreement:getInstallmentPreview(input.agreementId)!,splits:[{method:'Cash',accountId:'invalid',amountPaisa:250000}]},[]).join(' '),/account/i);
 assert.match(validateInstallmentCollection({...input,agreement:getInstallmentPreview(input.agreementId)!,date:'2030-01-01'},[]).join(' '),/date/i);
 assert.throws(()=>recordInstallmentReceiptPreview({...input,date:'2030-01-01'}),/date/i);
});
test('sequential receipts allocate only unpaid agreement rows without double posting',()=>{
 const first=payload('payment-1',400000),a=recordInstallmentReceiptPreview(first);
 const next={...first,operationId:'payment-2',amountPaisa:200000,
  allocations:allocateOldestInstallments(getInstallmentPreview(first.agreementId)!,[a],200000),
  splits:[{method:'Cash' as const,accountId:'acc-cash',amountPaisa:200000}]};
 const b=recordInstallmentReceiptPreview(next);
 assert.deepEqual(b.allocations,[{scheduleItemId:'inst-1',amountPaisa:100000},{scheduleItemId:'inst-2',amountPaisa:100000}]);
 assert.equal(listInstallmentReceipts(first.agreementId).length,2);
});

test('Cash, Bank and MFS split receipt is source-validated without changing finance or Party ledgers',()=>{
 const input=payload('payment-mixed',600000);
 const before=financeAccounts.map(x=>({id:x.id,balance:x.balance}));
 const partyRevision=getPartyPreviewSnapshot().revision;
 const saved=recordInstallmentReceiptPreview({...input,splits:[
   {method:'Cash',accountId:'acc-cash',amountPaisa:200000},
   {method:'Bank',accountId:'acc-dbl',amountPaisa:150000},
   {method:'Mobile Banking',accountId:'acc-bkash',amountPaisa:250000}
 ]});
 assert.equal(saved.splits.reduce((n,row)=>n+row.amountPaisa,0),600000);
 assert.equal(saved.allocations.reduce((n,row)=>n+row.amountPaisa,0),600000);
 assert.deepEqual(financeAccounts.map(x=>({id:x.id,balance:x.balance})),before);
 assert.equal(getPartyPreviewSnapshot().revision,partyRevision);
});
