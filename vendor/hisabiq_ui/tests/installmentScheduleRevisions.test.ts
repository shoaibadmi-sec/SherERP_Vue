import {test,beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import {recordInstallmentPreview,recordInstallmentReceiptPreview,resetInstallmentPreviewsForTest} from '../src/data/installmentPreviewStore.ts';
import {previewScheduleRevision,recordScheduleRevisionPreview,listInstallmentRevisions} from '../src/installments/revisions.ts';
import {generateInstallmentSchedule} from '../src/installments/schedule.ts';

beforeEach(()=>resetInstallmentPreviewsForTest());
function create(){
 const schedule=generateInstallmentSchedule({remainingPaisa:3000000,count:6,firstDueDate:'2026-11-17',frequency:'Monthly'});
 const a=recordInstallmentPreview({
  operationId:'sale-1',invoiceReference:'INV-0011',customerId:'c1',customerName:'Shopper',
  totalPaisa:3300000,downPaymentPaisa:300000,schedule,
  lineSnapshot:[{key:'p1',productId:'p1',amountPaisa:3300000}],paymentSnapshot:[{method:'Cash',account:'Cash counter',amountPaisa:300000}]
 });
 recordInstallmentReceiptPreview({agreementId:a.id,operationId:'receipt-1',date:'2026-10-17',amountPaisa:200000,
  allocations:[{scheduleItemId:'inst-1',amountPaisa:200000}],
  splits:[{method:'Cash',accountId:'acc-cash',amountPaisa:200000}]});
 return a;
}
function revision(agreementId:string){
 const original=generateInstallmentSchedule({remainingPaisa:3000000,count:6,firstDueDate:'2026-11-17',frequency:'Monthly'});
 return {agreementId,operationId:'revision-1',baseRevision:0,actorId:'manager',
  reason:'Customer requested later date',effectiveDate:'2026-10-18',
  nextUnpaidRows:[{id:'inst-1-carried-1',dueDate:'2026-11-28',amountPaisa:300000,editedAmount:true,editedDate:true},...original.slice(1)]};
}
test('partial paid row remains anchored while its unpaid 300000 paisa goes into successor',()=>{
 const a=create();
 const prepared=previewScheduleRevision(revision(a.id));
 assert.equal(prepared.afterRows[0].id,'inst-1');
 assert.equal(prepared.afterRows[0].amountPaisa,200000);
 assert.equal(prepared.afterRows[0].dueDate,'2026-11-17');
 assert.equal(prepared.afterRows[1].id,'inst-1-carried-1');
 assert.equal(prepared.afterRows[1].amountPaisa,300000);
 assert.equal(prepared.afterRows.reduce((sum,row)=>sum+row.amountPaisa,0),3000000);
 const saved=recordScheduleRevisionPreview(revision(a.id));
 assert.equal(saved.revision,1);
 assert.equal(listInstallmentRevisions(a.id).length,1);
 assert.equal(recordScheduleRevisionPreview(revision(a.id)).id,saved.id);
});
test('stale versions, duplicate row id and edited locked paid row reject atomically',()=>{
 const a=create(),input=revision(a.id);
 assert.throws(()=>previewScheduleRevision({...input,baseRevision:1}),/stale|revision/i);
 assert.throws(()=>previewScheduleRevision({...input,nextUnpaidRows:[{...input.nextUnpaidRows[0],id:'inst-1'},...input.nextUnpaidRows.slice(1)]}),/paid|anchor|id/i);
 assert.throws(()=>previewScheduleRevision({...input,nextUnpaidRows:[input.nextUnpaidRows[0],input.nextUnpaidRows[0],...input.nextUnpaidRows.slice(1)]}),/duplicate|date|amount/i);
 assert.equal(listInstallmentRevisions(a.id).length,0);
});
test('date, actor, reason and exact unpaid amount are mandatory',()=>{
 const a=create(),input=revision(a.id);
 assert.throws(()=>recordScheduleRevisionPreview({...input,actorId:''}),/actor/i);
 assert.throws(()=>recordScheduleRevisionPreview({...input,reason:' '}),/reason/i);
 assert.throws(()=>recordScheduleRevisionPreview({...input,effectiveDate:'2030-01-01'}),/date|future/i);
 assert.throws(()=>recordScheduleRevisionPreview({...input,nextUnpaidRows:input.nextUnpaidRows.slice(1)}),/unpaid|total|reconcile/i);
 assert.equal(listInstallmentRevisions(a.id).length,0);
});
test('a revised operation id cannot silently overwrite original audit evidence',()=>{
 const a=create(),input=revision(a.id);
 const saved=recordScheduleRevisionPreview(input);
 assert.throws(()=>recordScheduleRevisionPreview({...input,reason:'changed reason'}),/operation|different|idempot/i);
 assert.equal(listInstallmentRevisions(a.id).length,1);
 assert.equal(listInstallmentRevisions(a.id)[0].id,saved.id);
});
