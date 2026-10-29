import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generateInstallmentSchedule} from '../src/installments/schedule.ts';
import {projectInstallmentLifecycle,type InstallmentLifecycleEvent} from '../src/installments/lifecycle.ts';
import type {PreviewInstallmentAgreement} from '../src/data/installmentPreviewStore.ts';
import type {InstallmentPaymentPreviewEvent} from '../src/installments/collections.ts';
const agreement=():PreviewInstallmentAgreement=>({
 id:'a1',invoiceReference:'INV-000900',customerId:'c1',customerName:'Shop Customer',
 createdAt:'2026-10-17T10:00:00Z',operationId:'sale-1',totalPaisa:3300000,
 downPaymentPaisa:300000,
 schedule:generateInstallmentSchedule({remainingPaisa:3000000,count:6,firstDueDate:'2026-11-17',frequency:'Monthly'}),
 lineSnapshot:[{key:'product-1',productId:'p1',amountPaisa:3300000}],paymentSnapshot:[]
});
const receipt=(id:string,amountPaisa:number,start=0,date='2026-11-17'):InstallmentPaymentPreviewEvent=>({
 id,agreementId:'a1',operationId:'op-'+id,createdAt:date+'T10:00:00Z',
 amountPaisa,date,allocations:Array.from({length:Math.ceil(amountPaisa/500000)},(_,i)=>{
  const index=start+i;return {scheduleItemId:'inst-'+(index+1),amountPaisa:Math.min(500000,amountPaisa-i*500000)};
 }),splits:[{method:'Cash',accountId:'acc-cash',amountPaisa}]
});
test('reduction larger than remaining shows surplus separately, not negative customer due',()=>{
 const a=agreement(),r=receipt('receipt-1',2500000);
 const events:InstallmentLifecycleEvent[]=[{
  type:'agreement-reduction',id:'settlement-1',agreementId:'a1',operationId:'adjust-1',
  actorId:'shop-manager',reason:'Verified settlement',effectiveDate:'2026-12-01',
  revision:1,sequence:1,amountPaisa:1000000
 }];
 const before=projectInstallmentLifecycle(a,[r],events,'2026-11-25');
 assert.equal(before.totalOutstandingPaisa,500000);
 assert.equal(before.surplusPaisa,0);
 const after=projectInstallmentLifecycle(a,[r],events,'2026-12-01');
 assert.equal(after.totalOutstandingPaisa,0);
 assert.equal(after.surplusPaisa,500000);
 assert.equal(after.status,'Surplus pending');
 assert.equal(a.schedule[5].amountPaisa,500000);
 assert.equal(after.audit.length,1);
});
test('a paid installment and partial payment remain anchored through rescheduling',()=>{
 const a=agreement(),r=receipt('part-1',200000);
 const next=a.schedule.map(row=>({...row}));
 next[0]={...next[0],amountPaisa:200000};
 next.splice(1,0,{id:'inst-1-carried-1',dueDate:'2026-11-30',amountPaisa:300000,editedAmount:true,editedDate:true});
 const events:InstallmentLifecycleEvent[]=[{
  type:'schedule-revision',id:'revision-1',agreementId:'a1',operationId:'rev-op-1',
  actorId:'manager',reason:'Customer requested later installment',effectiveDate:'2026-11-18',
  revision:1,sequence:1,beforeRows:a.schedule.map(row=>({...row})),afterRows:next
 }];
 const projected=projectInstallmentLifecycle(a,[r],events,'2026-12-01');
 assert.equal(projected.totalOutstandingPaisa,2800000);
 assert.equal(projected.rows[0].paidPaisa,200000);
 assert.equal(projected.rows[0].outstandingPaisa,0);
 assert.equal(projected.rows[0].dueDate,'2026-11-17');
 assert.equal(projected.rows[1].id,'inst-1-carried-1');
 assert.equal(projected.rows[1].outstandingPaisa,300000);
 assert.equal(a.schedule[0].amountPaisa,500000);
});
test('as-of replay excludes receipts and lifecycle events not yet effective',()=>{
 const a=agreement(),r=receipt('later',500000,0,'2026-12-01');
 const result=projectInstallmentLifecycle(a,[r],[],'2026-11-18');
 assert.equal(result.totalOutstandingPaisa,3000000);
 assert.equal(result.overduePaisa,500000);
 assert.equal(result.rows[0].paidPaisa,0);
});
test('foreign or duplicate lifecycle sources rejected without mutating original invoice',()=>{
 const a=agreement();
 const event:InstallmentLifecycleEvent={type:'agreement-reduction',id:'a',agreementId:'other',
  operationId:'same',actorId:'manager',reason:'return',effectiveDate:'2026-11-17',
  revision:1,sequence:1,amountPaisa:100};
 assert.throws(()=>projectInstallmentLifecycle(a,[],[event],'2026-11-18'),/agreement/i);
 const own={...event,agreementId:'a1'};
 assert.throws(()=>projectInstallmentLifecycle(a,[],[own,own],'2026-11-18'),/duplicate|revision/i);
 assert.equal(a.totalPaisa,3300000);
});
