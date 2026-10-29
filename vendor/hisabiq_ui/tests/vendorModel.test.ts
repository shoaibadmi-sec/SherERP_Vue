import test from 'node:test';
import assert from 'node:assert/strict';
import { applyVendorCommand, sourceOutstanding, vendorBalances } from '../src/vendor/vendorModel.ts';
import type { VendorPreviewState } from '../src/vendor/vendorTypes.ts';

function fresh(): VendorPreviewState {
 return {parties:[
  {id:'v1',roles:['Vendor'],status:'Active'},
  {id:'v2',roles:['Vendor','Supplier'],status:'Active'},
  {id:'v3',roles:['Vendor'],status:'Inactive'},
  {id:'s1',roles:['Supplier'],status:'Active'}
 ],sources:[],settlements:[],events:[],openings:[],sales:[],operations:[],revision:0};
}
const sourcing=(operationId:string,vendorPartyId='v1',cost:number|null=null)=>({
 type:'record-sourcing' as const,operationId,vendorPartyId,
 source:{id:'source-'+operationId,productId:'p1',baseQty:3,date:'2026-10-10',
 unitCostBasePaisa:cost,reference:'INV-123'}
});
test('unpriced POS sourcing records quantity but no fabricated payable',()=>{
 const state=applyVendorCommand(fresh(),sourcing('unpriced'));
 const b=vendorBalances(state,'v1');
 assert.equal(b.knownPayablePaisa,0);
 assert.equal(b.unpricedSourceBaseQty,3);
 assert.equal(b.unpricedSourceCount,1);
 assert.equal(state.sources[0].unitCostBasePaisa,null);
 assert.equal(state.sources[0].sourceAmountPaisa,null);
 assert.equal(sourceOutstanding(state,'source-unpriced').unpricedBaseQty,3);
 assert.equal(sourceOutstanding(state,'source-unpriced').monetaryDuePaisa,null);
});
test('known sourcing creates payable and leaves other Vendor roles separate',()=>{
 const s=applyVendorCommand(fresh(),sourcing('priced','v2',11000));
 assert.equal(vendorBalances(s,'v2').knownPayablePaisa,33000);
 assert.equal(vendorBalances(s,'v2').knownReceivablePaisa,0);
 assert.equal(vendorBalances(s,'v1').knownPayablePaisa,0);
 assert.equal(s.sources[0].sourceAmountPaisa,33000);
});
test('goods issued to Vendor creates receivable only',()=>{
 const state=applyVendorCommand(fresh(),{type:'issue-goods',operationId:'give-1',vendorPartyId:'v1',source:{
 id:'issue-1',productId:'p2',baseQty:2,unitCostBasePaisa:7000,date:'2026-10-10',reference:'V-MEMO-1'}});
 assert.equal(vendorBalances(state,'v1').knownReceivablePaisa,14000);
 assert.equal(vendorBalances(state,'v1').knownPayablePaisa,0);
});
test('opening Vendor payable and receivable never net',()=>{
 let s=applyVendorCommand(fresh(),{type:'set-opening',operationId:'open-1',vendorPartyId:'v1',side:'payable',amountPaisa:50000,date:'2026-10-01'});
 s=applyVendorCommand(s,{type:'set-opening',operationId:'open-2',vendorPartyId:'v1',side:'receivable',amountPaisa:12000,date:'2026-10-01'});
 assert.equal(vendorBalances(s,'v1').knownPayablePaisa,50000);
 assert.equal(vendorBalances(s,'v1').knownReceivablePaisa,12000);
});
test('operation retry is idempotent without revision or notifications',()=>{
 const a=applyVendorCommand(fresh(),sourcing('retry', 'v1',11000));
 assert.equal(applyVendorCommand(a,sourcing('retry','v1',11000)),a);
 assert.equal(a.revision,1);
 assert.equal(a.events.length,1);
});
test('invalid Vendor, duplicate source or bad cost reject atomically',()=>{
 const s=fresh(),before=JSON.stringify(s);
 assert.throws(()=>applyVendorCommand(s,sourcing('bad','s1',11000)),/Vendor role/i);
 assert.throws(()=>applyVendorCommand(s,sourcing('inactive','v3',11000)),/inactive/i);
 assert.throws(()=>applyVendorCommand(s,sourcing('nan','v1',NaN)),/cost/i);
 assert.throws(()=>applyVendorCommand(s,sourcing('negative','v1',-1)),/cost/i);
 assert.throws(()=>applyVendorCommand(s,{...sourcing('qty'),source:{...sourcing('qty').source,baseQty:0}}),/quantity/i);
 assert.equal(JSON.stringify(s),before);
 const done=applyVendorCommand(s,sourcing('once'));
 assert.throws(()=>applyVendorCommand(done,{...sourcing('another'),source:{...sourcing('another').source,id:'source-once'}}),/source/i);
});

test('Vendor money settlement accepts genuine bank splits and replays an exact retry once',()=>{
 const start=applyVendorCommand(fresh(),sourcing('source-for-pay','v1',10000));
 const command={
  type:'settle-source' as const,operationId:'vendor-pay-valid',vendorPartyId:'v1',
  side:'payable' as const,kind:'pay' as const,date:'2026-10-11',amountPaisa:10000,
  allocations:[{sourceId:'source-source-for-pay',amountPaisa:10000}],
  paymentSplits:[{id:'bank-1',accountId:'acc-dbl',method:'Bank' as const,amountPaisa:10000}],
  reason:'Bank settlement'
 };
 const paid=applyVendorCommand(start,command);
 assert.equal(sourceOutstanding(paid,'source-source-for-pay').monetaryDuePaisa,20000);
 assert.equal(paid.settlements[0].paymentSplits?.[0].accountId,'acc-dbl');
 assert.equal(applyVendorCommand(paid,command),paid,'Exact operation retry must not post a second payment');
 assert.equal(paid.events.filter(e=>e.kind==='settlement').length,1);
});

test('Vendor settlement rejects unknown account, wrong method, invalid splits without mutation',()=>{
 const start=applyVendorCommand(fresh(),sourcing('source-for-invalid-pay','v1',10000));
 const unchanged=JSON.stringify(start);
 const payment={
  type:'settle-source' as const,operationId:'vendor-pay-invalid',vendorPartyId:'v1',
  side:'payable' as const,kind:'pay' as const,date:'2026-10-11',amountPaisa:10000,
  allocations:[{sourceId:'source-source-for-invalid-pay',amountPaisa:10000}],
  paymentSplits:[{id:'split-1',accountId:'acc-cash',method:'Cash' as const,amountPaisa:10000}]
 };
 const bad=[
  {splits:[{...payment.paymentSplits[0],accountId:'account-missing'}],reason:/account not found or inactive/i},
  {splits:[{...payment.paymentSplits[0],method:'Bank' as const}],reason:/method does not match/i},
  {splits:[{...payment.paymentSplits[0],amountPaisa:0}],reason:/split must be positive/i},
  {splits:[{...payment.paymentSplits[0],amountPaisa:9999}],reason:/splits do not match/i},
  {splits:[payment.paymentSplits[0],{...payment.paymentSplits[0]}],reason:/duplicate/i},
  {splits:[{...payment.paymentSplits[0],id:''}],reason:/missing/i}
 ];
 for(const entry of bad){
  assert.throws(()=>applyVendorCommand(start,{...payment,paymentSplits:entry.splits}),entry.reason);
  assert.equal(JSON.stringify(start),unchanged,'Failed Vendor command must not change original state');
 }
});

test('Clear Vendor due validates real cash account identity and payment method',()=>{
 const start=applyVendorCommand(fresh(),sourcing('source-for-clear','v1',10000));
 const command={
  type:'clear-source-due' as const,operationId:'vendor-clear-valid',vendorPartyId:'v1',
  sourceId:'source-source-for-clear',date:'2026-10-11',cashPaisa:5000,
  returnBaseQty:0,paymentSplits:[{id:'cash-1',accountId:'acc-cash',method:'Cash' as const,amountPaisa:5000}]
 };
 assert.throws(()=>applyVendorCommand(start,{...command,paymentSplits:[{...command.paymentSplits[0],accountId:'missing'}]}),/account not found/i);
 assert.throws(()=>applyVendorCommand(start,{...command,paymentSplits:[{...command.paymentSplits[0],method:'Mobile Banking' as const}]}),/method does not match/i);
 const paid=applyVendorCommand(start,command);
 assert.equal(sourceOutstanding(paid,'source-source-for-clear').monetaryDuePaisa,25000);
 assert.equal(paid.settlements[0].paymentSplits?.[0].accountId,'acc-cash');
});

test('Product-only Vendor return cannot carry hidden money account splits',()=>{
 const sourceState=applyVendorCommand(fresh(),sourcing('source-for-return','v1',10000));
 const start={...sourceState,inventory:{p1:10}};
 const snapshot=JSON.stringify(start);
 const bad={
  type:'settle-source' as const,operationId:'vendor-return-account',vendorPartyId:'v1',
  side:'payable' as const,kind:'return-to-vendor' as const,date:'2026-10-11',amountPaisa:10000,
  allocations:[{sourceId:'source-source-for-return',amountPaisa:10000,baseQty:1}],
  paymentSplits:[{id:'cash-1',accountId:'acc-cash',method:'Cash' as const,amountPaisa:10000}]
 };
 assert.throws(()=>applyVendorCommand(start,bad),/product-only.*payment accounts/i);
 assert.equal(JSON.stringify(start),snapshot);
});
