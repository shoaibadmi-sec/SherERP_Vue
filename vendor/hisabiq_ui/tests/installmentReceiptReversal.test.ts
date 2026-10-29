import {test,beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import {recordInstallmentPreview,recordInstallmentReceiptPreview,listInstallmentReceipts,
 listInstallmentLifecycleEvents,resetInstallmentPreviewsForTest} from '../src/data/installmentPreviewStore.ts';
import {recordInstallmentReceiptReversalPreview} from '../src/installments/reversals.ts';
import {recordInstallmentSettlementPreview} from '../src/installments/adjustments.ts';
import {generateInstallmentSchedule} from '../src/installments/schedule.ts';
import {projectInstallmentLifecycle} from '../src/installments/lifecycle.ts';
beforeEach(()=>resetInstallmentPreviewsForTest());
function fixture(){
 const a=recordInstallmentPreview({operationId:'sale-1',invoiceReference:'INV-0001',
  customerId:'c1',customerName:'Shop customer',totalPaisa:2200000,downPaymentPaisa:200000,
  schedule:generateInstallmentSchedule({remainingPaisa:2000000,count:4,firstDueDate:'2026-11-17',frequency:'Monthly'}),
  lineSnapshot:[{key:'p1',productId:'p1',amountPaisa:2200000}],
  paymentSnapshot:[{method:'Cash',account:'Cash counter',amountPaisa:200000}]});
 const rec=recordInstallmentReceiptPreview({agreementId:a.id,operationId:'receipt-op-1',
  date:'2026-10-17',amountPaisa:500000,
  allocations:[{scheduleItemId:'inst-1',amountPaisa:500000}],
  splits:[{method:'Cash',accountId:'acc-cash',amountPaisa:500000}]});
 return {a,rec};
}
const input=(id:string,sourceReceiptId:string)=>({agreementId:id,sourceReceiptId,
 operationId:'reverse-1',actorId:'manager',reason:'Wrong payment received',
 baseRevision:0,effectiveDate:'2026-10-18'});
test('reversal retains original source receipt and restores exact scheduled outstanding',()=>{
 const {a,rec}=fixture();
 const before=projectInstallmentLifecycle(a,listInstallmentReceipts(a.id),[],'2026-10-18');
 assert.equal(before.totalOutstandingPaisa,1500000);
 const rev=recordInstallmentReceiptReversalPreview(input(a.id,rec.id));
 assert.equal(rev.sourceReceiptId,rec.id);
 assert.equal(listInstallmentReceipts(a.id).length,1);
 const after=projectInstallmentLifecycle(a,listInstallmentReceipts(a.id),listInstallmentLifecycleEvents(a.id),'2026-10-18');
 assert.equal(after.totalOutstandingPaisa,2000000);
 assert.equal(after.rows[0].outstandingPaisa,500000);
 assert.equal(after.audit[0].type,'receipt-reversal');
});
test('duplicate reversal cannot create another event, identical operation is idempotent',()=>{
 const {a,rec}=fixture(),values=input(a.id,rec.id);
 const first=recordInstallmentReceiptReversalPreview(values);
 assert.equal(recordInstallmentReceiptReversalPreview(values).id,first.id);
 assert.throws(()=>recordInstallmentReceiptReversalPreview({...values,operationId:'reverse-2'}),/already reversed|duplicate/i);
 assert.throws(()=>recordInstallmentReceiptReversalPreview({...values,reason:'different'}),/operation|different/i);
 assert.equal(listInstallmentLifecycleEvents(a.id).length,1);
});
test('foreign receipt, actor/reason and stale revision rejected with zero event mutation',()=>{
 const {a,rec}=fixture();
 assert.throws(()=>recordInstallmentReceiptReversalPreview(input(a.id,'receipt-elsewhere')),/receipt|source/i);
 assert.throws(()=>recordInstallmentReceiptReversalPreview({...input(a.id,rec.id),actorId:''}),/actor/i);
 assert.throws(()=>recordInstallmentReceiptReversalPreview({...input(a.id,rec.id),reason:' '}),/reason/i);
 assert.throws(()=>recordInstallmentReceiptReversalPreview({...input(a.id,rec.id),baseRevision:3}),/stale|revision/i);
 assert.equal(listInstallmentLifecycleEvents(a.id).length,0);
});
test('reversing receipt after subsequent settlement requires review, not a silent edit',()=>{
 const {a,rec}=fixture();
 recordInstallmentSettlementPreview({agreementId:a.id,operationId:'settle-1',actorId:'manager',
  reason:'Authorized settlement adjustment',amountPaisa:100000,
  baseRevision:0,effectiveDate:'2026-10-18'});
 assert.throws(()=>recordInstallmentReceiptReversalPreview({...input(a.id,rec.id),baseRevision:1}),
  /later|adjustment|conflict|review/i);
 assert.equal(listInstallmentLifecycleEvents(a.id).length,1);
});
