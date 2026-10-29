import assert from 'node:assert/strict';
import {test,beforeEach} from 'node:test';
import {recordInstallmentPreview,recordInstallmentReceiptPreview,resetInstallmentPreviewsForTest,listInstallmentLifecycleEvents,listInstallmentReceipts} from '../src/data/installmentPreviewStore.ts';
import {generateInstallmentSchedule} from '../src/installments/schedule.ts';
import {previewInstallmentReturn,recordInstallmentReturnPreview,recordInstallmentSettlementPreview} from '../src/installments/adjustments.ts';
import {projectInstallmentLifecycle} from '../src/installments/lifecycle.ts';
import type {BundleSaleSnapshot} from '../src/types/erp.ts';
beforeEach(()=>resetInstallmentPreviewsForTest());
const agreement=(amount=100001,qty=3,kind:'Stock'|'Bundle'='Stock')=>{
 const bundleSnapshot:BundleSaleSnapshot|undefined=kind==='Bundle'?{
  bundleRevision:3,components:[
   {productId:'a',name:'Wire',sku:'A',baseQtyPerSet:2,totalBaseQty:qty*2,unit:'Pcs',unitFactorAtSale:1},
   {productId:'b',name:'Fuse',sku:'B',baseQtyPerSet:1,totalBaseQty:qty,unit:'Pcs',unitFactorAtSale:1}
  ]
 }:undefined;
 return recordInstallmentPreview({
  operationId:'sale-1',invoiceReference:'INV-1',customerId:'customer-1',customerName:'Shop',
  totalPaisa:amount,downPaymentPaisa:0,
  schedule:generateInstallmentSchedule({remainingPaisa:amount,count:3,firstDueDate:'2026-11-17',frequency:'Monthly'}),
  lineSnapshot:[{key:'line-a',productId:'p1',amountPaisa:amount}],paymentSnapshot:[],
  historicalLines:[{lineKey:'line-a',productId:'p1',kind,
   originalBaseQuantity:qty,originalNetPaisa:amount,selectedUnit:kind==='Bundle'?'Set':'Pcs',unitFactorAtSale:1,
   ...(bundleSnapshot?{bundleSnapshot}:{})}]
 });
};
const request=(agreementId:string,qty:number,op:string,baseRevision:number)=>({
 agreementId,lineKey:'line-a',returnBaseQuantity:qty,
 disposition:'Adjust due' as const,reason:'Approved damaged item return',actorId:'manager',
 operationId:op,baseRevision,effectiveDate:'2026-10-18'
});
test('two historical partial returns reconcile exactly to original parent net value',()=>{
 const a=agreement();
 const first=previewInstallmentReturn(request(a.id,1,'ret-1',0));
 assert.equal(first.historicalValuePaisa,33334);
 assert.deepEqual(first.issues,[]);
 const event1=recordInstallmentReturnPreview(request(a.id,1,'ret-1',0));
 assert.equal(event1.amountPaisa,33334);
 const second=recordInstallmentReturnPreview(request(a.id,2,'ret-2',1));
 assert.equal(second.amountPaisa,66667);
 assert.equal(event1.amountPaisa+second.amountPaisa,100001);
 assert.throws(()=>recordInstallmentReturnPreview(request(a.id,1,'ret-3',2)),/return|quantity|sold/i);
 const balance=projectInstallmentLifecycle(a,[],listInstallmentLifecycleEvents(a.id),'2026-10-18');
 assert.equal(balance.totalOutstandingPaisa,0);
});
test('bundle return uses original parent Set value and requires frozen source recipe',()=>{
 const a=agreement(75001,2,'Bundle');
 const e1=recordInstallmentReturnPreview(request(a.id,1,'return-b1',0));
 const e2=recordInstallmentReturnPreview(request(a.id,1,'return-b2',1));
 assert.equal(e1.amountPaisa+e2.amountPaisa,75001);
 assert.equal(e1.amountPaisa,37501);
 assert.equal(listInstallmentLifecycleEvents(a.id).length,2);
});
test('paid receipts and larger return leave explicit surplus, not negative due or cash movement',()=>{
 const a=agreement(3300000,3);
 recordInstallmentReceiptPreview({agreementId:a.id,operationId:'payment-1',date:'2026-10-17',
  amountPaisa:2500000,allocations:[
   {scheduleItemId:'inst-1',amountPaisa:1100000},
   {scheduleItemId:'inst-2',amountPaisa:1100000},
   {scheduleItemId:'inst-3',amountPaisa:300000}],
  splits:[{method:'Cash',accountId:'acc-cash',amountPaisa:2500000}]});
 const event=recordInstallmentReturnPreview(request(a.id,1,'return-a',0));
 assert.equal(event.amountPaisa,1100000);
 const b=projectInstallmentLifecycle(a,listInstallmentReceipts(a.id),listInstallmentLifecycleEvents(a.id),'2026-10-18');
 assert.equal(b.totalOutstandingPaisa,0);
 assert.equal(b.surplusPaisa,300000);
});
test('settlement cannot create an unsupported negative due or unreasoned credit',()=>{
 const a=agreement(3000000,3);
 const s=recordInstallmentSettlementPreview({agreementId:a.id,amountPaisa:1000000,
  operationId:'settle-1',actorId:'manager',reason:'Authorized early payoff reduction',
  effectiveDate:'2026-10-18',baseRevision:0});
 assert.equal(s.amountPaisa,1000000);
 assert.throws(()=>recordInstallmentSettlementPreview({agreementId:a.id,amountPaisa:2000001,
  operationId:'settle-2',actorId:'manager',reason:'Authorized discount',
  effectiveDate:'2026-10-18',baseRevision:1}),/outstanding|remaining|exceed/i);
});
test('unknown historical source, stale revision and missing actor create no events',()=>{
 const a=agreement();
 assert.throws(()=>recordInstallmentReturnPreview({...request(a.id,1,'wrong-line',0),lineKey:'bad'}),/line|source/i);
 assert.throws(()=>recordInstallmentReturnPreview({...request(a.id,1,'bad-actor',0),actorId:''}),/actor/i);
 assert.throws(()=>recordInstallmentReturnPreview({...request(a.id,1,'stale',1)}),/stale|revision/i);
 assert.equal(listInstallmentLifecycleEvents(a.id).length,0);
});
