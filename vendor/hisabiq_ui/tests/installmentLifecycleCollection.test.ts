import {test,beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import {recordInstallmentPreview,recordInstallmentReceiptPreview,
 listInstallmentReceipts,listInstallmentLifecycleEvents,resetInstallmentPreviewsForTest} from '../src/data/installmentPreviewStore.ts';
import {recordInstallmentSettlementPreview} from '../src/installments/adjustments.ts';
import {recordScheduleRevisionPreview} from '../src/installments/revisions.ts';
import {allocateOldestLifecycleInstallments,projectInstallmentLifecycle} from '../src/installments/lifecycle.ts';
import {generateInstallmentSchedule} from '../src/installments/schedule.ts';

beforeEach(()=>resetInstallmentPreviewsForTest());
function agreement(){
 return recordInstallmentPreview({
  operationId:'lifecycle-sale-1',invoiceReference:'INV-LC-001',
  customerId:'customer-1',customerName:'Customer',
  totalPaisa:3000000,downPaymentPaisa:0,
  schedule:generateInstallmentSchedule({remainingPaisa:3000000,count:3,
   firstDueDate:'2026-11-17',frequency:'Monthly'}),
  lineSnapshot:[{key:'sku-1',productId:'p1',amountPaisa:3000000}],paymentSnapshot:[]
 });
}
function payment(agreementId:string,op:string,amountPaisa:number,allocations:
 {scheduleItemId:string;amountPaisa:number}[]){
 return recordInstallmentReceiptPreview({
  agreementId,operationId:op,date:'2026-10-18',amountPaisa,allocations,
  splits:[{method:'Cash',accountId:'acc-cash',amountPaisa}]
 });
}

test('collect after authorized settlement using current reduced agreement only',()=>{
 const a=agreement();
 recordInstallmentSettlementPreview({
  agreementId:a.id,operationId:'settle',actorId:'manager',reason:'Discount approved',
  amountPaisa:500000,baseRevision:0,effectiveDate:'2026-10-18'
 });
 const events=listInstallmentLifecycleEvents(a.id);
 const rows=allocateOldestLifecycleInstallments(a,[],events,1100000,'2026-10-18');
 assert.deepEqual(rows,[{scheduleItemId:'inst-1',amountPaisa:500000},
  {scheduleItemId:'inst-2',amountPaisa:600000}]);
 const recorded=payment(a.id,'payment-after-settlement',1100000,rows);
 assert.equal(recorded.amountPaisa,1100000);
 assert.ok((recorded.sourceSequence??0)>(events[0].sourceSequence??0),
  'later same-day payment follows the adjusted source in deterministic replay');
 const projection=projectInstallmentLifecycle(a,listInstallmentReceipts(a.id),events,'2026-10-18');
 assert.equal(projection.totalOutstandingPaisa,1400000);
 assert.equal(projection.rows[0].outstandingPaisa,0);
 assert.equal(projection.rows[1].outstandingPaisa,400000);
});

test('after partial payment and reschedule, allocation targets linked successor row, not obsolete row',()=>{
 const a=agreement();
 payment(a.id,'first-partial',200000,[{scheduleItemId:'inst-1',amountPaisa:200000}]);
 recordScheduleRevisionPreview({
  agreementId:a.id,operationId:'reschedule',actorId:'manager',
  reason:'Customer requested a later schedule',baseRevision:0,effectiveDate:'2026-10-18',
  nextUnpaidRows:[
   {id:'inst-1-carried-1',dueDate:'2026-11-18',amountPaisa:800000,editedAmount:true,editedDate:true},
   {id:'inst-2',dueDate:'2026-12-17',amountPaisa:1000000,editedAmount:false,editedDate:false},
   {id:'inst-3',dueDate:'2027-01-17',amountPaisa:1000000,editedAmount:false,editedDate:false}
  ]
 });
 const events=listInstallmentLifecycleEvents(a.id);
 const rows=allocateOldestLifecycleInstallments(a,listInstallmentReceipts(a.id),events,500000,'2026-10-18');
 assert.deepEqual(rows,[{scheduleItemId:'inst-1-carried-1',amountPaisa:500000}]);
 payment(a.id,'after-revision',500000,rows);
 const projected=projectInstallmentLifecycle(a,listInstallmentReceipts(a.id),events,'2026-10-18');
 assert.equal(projected.rows[0].paidPaisa,200000);
 assert.equal(projected.rows[1].paidPaisa,500000);
 assert.equal(projected.totalOutstandingPaisa,2300000);
});

test('overpayment and unknown successor ID are rejected without mutating receipts',()=>{
 const a=agreement();
 recordInstallmentSettlementPreview({agreementId:a.id,operationId:'settle',
  actorId:'manager',reason:'Authorized reduction',amountPaisa:2500000,
  baseRevision:0,effectiveDate:'2026-10-18'});
 const events=listInstallmentLifecycleEvents(a.id);
 assert.throws(()=>allocateOldestLifecycleInstallments(a,[],events,500001,'2026-10-18'),/exceeds|outstanding/i);
 assert.throws(()=>payment(a.id,'invalid',100000,[{scheduleItemId:'missing-row',amountPaisa:100000}]),
  /unknown|schedule|allocation/i);
 assert.equal(listInstallmentReceipts(a.id).length,0);
});
