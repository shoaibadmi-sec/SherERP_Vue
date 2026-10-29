import test from 'node:test';
import assert from 'node:assert/strict';
import {applyVendorCommand,vendorBalances,sourceOutstanding} from '../src/vendor/vendorModel.ts';
import {vendorCorrectionImpact} from '../src/vendor/vendorCorrection.ts';
import type {VendorPreviewState} from '../src/vendor/vendorTypes.ts';

const fresh=():VendorPreviewState=>({
 parties:[{id:'v1',roles:['Vendor'],status:'Active'}, {id:'v2',roles:['Vendor'],status:'Active'}],
 sources:[],settlements:[],events:[],openings:[],sales:[],operations:[],revision:0,
 inventory:{p1:10,p2:2}
});
const borrow=(s:VendorPreviewState,id='src1',cost:number|null=11000)=>
 applyVendorCommand(s,{type:'record-sourcing',operationId:'borrow-'+id,vendorPartyId:'v1',
 source:{id,productId:'p1',baseQty:3,unitCostBasePaisa:cost,date:'2026-10-08',reference:'INV-1',sourceInvoiceId:'INV-1'}});
const reverse=(eventId:string,op='reverse1')=>({
 type:'reverse-event' as const,operationId:op,eventId,vendorPartyId:'v1',
 actor:'Demo operator',date:'2026-10-10',reason:'Vendor verified correction of wrong entry'
});
const pay=(id:string,amountPaisa=20000)=>({type:'settle-source' as const,operationId:id,vendorPartyId:'v1',
 side:'payable' as const,kind:'pay' as const,date:'2026-10-09',amountPaisa,
 allocations:[{sourceId:'src1',amountPaisa}],paymentSplits:[{
 id:'cash',method:'Cash' as const,accountId:'acc-cash',amountPaisa
 }]});
test('source correction replaces an unsettled source exactly once and preserves audit history',()=>{
 let state=borrow(fresh());
 const previous=state.sources[0];
 state=applyVendorCommand(state,{type:'correct-source',operationId:'fix-1',
  vendorPartyId:'v1',sourceId:'src1',actor:'Demo operator',date:'2026-10-10',
  reason:'Vendor confirmed 2 units, not 3',
  replacement:{id:'src1-corrected',productId:'p1',baseQty:2,
   unitCostBasePaisa:12000,date:'2026-10-08',sourceInvoiceId:'INV-1',reference:'INV-1'}});
 assert.equal(state.sources.find(s=>s.id==='src1')?.status,'Reversed');
 assert.equal(state.sources.find(s=>s.id==='src1-corrected')?.correctsSourceId,'src1');
 assert.equal(state.sources.find(s=>s.id==='src1-corrected')?.sourceAmountPaisa,24000);
 assert.equal(vendorBalances(state,'v1').knownPayablePaisa,24000);
 assert.equal(previous.status,'Active');
 assert.ok(state.events.some(e=>e.kind==='reversal'&&e.reversesEventId==='vendor-event:borrow-src1'&&e.reason?.includes('2 units')));
 assert.equal(state.revision,2);
 const original=state.events.find(e=>e.id==='vendor-event:borrow-src1');
 assert.equal(original?.status,'Active');
});
test('settled source cannot be deleted or corrected, so restore settlement first',()=>{
 let state=borrow(fresh());
 state=applyVendorCommand(state,pay('paid'));
 const impact=vendorCorrectionImpact(state,'src1');
 assert.equal(impact.reversible,false);
 assert.deepEqual(impact.linkedSettlementIds,['vendor-settlement:paid']);
 assert.match(impact.blocker??'',/settlement/i);
 assert.throws(()=>applyVendorCommand(state,reverse('vendor-event:borrow-src1')),/settlement/i);
 assert.throws(()=>applyVendorCommand(state,{type:'correct-source',operationId:'fix1',vendorPartyId:'v1',
  sourceId:'src1',actor:'Demo operator',date:'2026-10-10',reason:'Wrong quantity',
  replacement:{id:'new-src',productId:'p1',baseQty:2,unitCostBasePaisa:11000,date:'2026-10-08'}}),/settlement/i);
 assert.equal(vendorBalances(state,'v1').knownPayablePaisa,13000);
});
test('reversing a payment restores payable and records compensating audit entry',()=>{
 let state=borrow(fresh());
 state=applyVendorCommand(state,pay('paid'));
 const settledEvent=state.events.find(e=>e.operationId==='paid');
 assert.ok(settledEvent);
 const before=state;
 state=applyVendorCommand(state,reverse(settledEvent!.id,'reverse-payment'));
 assert.equal(vendorBalances(state,'v1').knownPayablePaisa,33000);
 assert.equal(sourceOutstanding(state,'src1').monetaryDuePaisa,33000);
 assert.equal(state.settlements.find(s=>s.operationId==='paid')?.status,'Reversed');
 assert.equal(state.events.find(e=>e.id===settledEvent!.id)?.status,'Active');
 assert.ok(state.events.some(e=>e.reversesEventId===settledEvent!.id&&e.deltaPaisa===20000));
 assert.equal(before.settlements[0].status,'Active');
 assert.equal(applyVendorCommand(state,reverse(settledEvent!.id,'reverse-payment')),state);
 assert.throws(()=>applyVendorCommand(state,reverse(settledEvent!.id,'reverse-payment-again')),/already reversed/i);
});
test('reversing an in-kind replacement restores owned stock, not money without quote',()=>{
 let state=borrow(fresh(),'src1',null);
 state=applyVendorCommand(state,{type:'settle-source',operationId:'returned',vendorPartyId:'v1',
 side:'payable',kind:'return-to-vendor',date:'2026-10-09',amountPaisa:null,
 allocations:[{sourceId:'src1',baseQty:2,amountPaisa:null}],reason:'Replaced with matching goods'});
 assert.equal(state.inventory?.p1,8);
 const ev=state.events.find(e=>e.operationId==='returned')!;
 state=applyVendorCommand(state,reverse(ev.id,'reverse-return'));
 assert.equal(state.inventory?.p1,10);
 assert.equal(sourceOutstanding(state,'src1').unpricedBaseQty,3);
 assert.equal(vendorBalances(state,'v1').knownPayablePaisa,0);
});
test('priced source quote cannot reverse while settlement is linked; reversal restores unpriced state',()=>{
 let state=borrow(fresh(),'src1',null);
 state=applyVendorCommand(state,{type:'set-source-price',operationId:'quote',vendorPartyId:'v1',
 sourceId:'src1',unitCostBasePaisa:11000,date:'2026-10-09'});
 state=applyVendorCommand(state,pay('paid'));
 const quoteEvent=state.events.find(e=>e.operationId==='quote')!;
 assert.throws(()=>applyVendorCommand(state,reverse(quoteEvent.id,'bad-quote-reverse')),/settlement/i);
 state=applyVendorCommand(state,reverse(state.events.find(e=>e.operationId==='paid')!.id,'reverse-pay'));
 state=applyVendorCommand(state,reverse(quoteEvent.id,'reverse-quote'));
 assert.equal(state.sources[0].unitCostBasePaisa,null);
 assert.equal(state.sources[0].sourceAmountPaisa,null);
 assert.equal(vendorBalances(state,'v1').knownPayablePaisa,0);
 assert.equal(sourceOutstanding(state,'src1').unpricedBaseQty,3);
});
test('reversed physical issue restores stock and receivable without removing history',()=>{
 let state=applyVendorCommand(fresh(),{type:'issue-goods',operationId:'issue',vendorPartyId:'v1',
 source:{id:'issued',productId:'p1',baseQty:2,date:'2026-10-08',unitCostBasePaisa:7000}});
 assert.equal(state.inventory?.p1,8);
 state=applyVendorCommand(state,reverse('vendor-event:issue','reverse-issue'));
 assert.equal(state.inventory?.p1,10);
 assert.equal(vendorBalances(state,'v1').knownReceivablePaisa,0);
 assert.equal(state.sources.find(s=>s.id==='issued')?.status,'Reversed');
});
test('inactive Vendor historical sources remain visible and reversals require reason and actor',()=>{
 let state=borrow(fresh());state={...state,parties:state.parties.map(p=>p.id==='v1'?{...p,status:'Inactive' as const}:p)};
 assert.equal(vendorBalances(state,'v1').knownPayablePaisa,33000);
 assert.throws(()=>applyVendorCommand(state,{...reverse('vendor-event:borrow-src1'),reason:' '}),/reason/i);
 assert.throws(()=>applyVendorCommand(state,{...reverse('vendor-event:borrow-src1'),actor:''}),/actor/i);
 state=applyVendorCommand(state,reverse('vendor-event:borrow-src1'));
 assert.equal(vendorBalances(state,'v1').knownPayablePaisa,0);
});
test('wrong Vendor, malformed date and invalid correction do not mutate state',()=>{
 const s=borrow(fresh()),snapshot=JSON.stringify(s);
 assert.throws(()=>applyVendorCommand(s,{...reverse('vendor-event:borrow-src1'),vendorPartyId:'v2'}),/Vendor|owner/i);
 assert.throws(()=>applyVendorCommand(s,{...reverse('vendor-event:borrow-src1'),date:'2026-02-31'}),/date/i);
 assert.throws(()=>applyVendorCommand(s,{type:'correct-source',operationId:'bad',vendorPartyId:'v1',
  sourceId:'src1',actor:'Demo operator',reason:'Invalid',date:'2026-10-10',
  replacement:{id:'src2',productId:'p1',baseQty:0,unitCostBasePaisa:10000,date:'2026-10-08'}}),/quantity/i);
 assert.equal(JSON.stringify(s),snapshot);
});
test('same operation ID with a changed payload is rejected, exact retry is idempotent',()=>{
 const cmd={type:'record-sourcing' as const,operationId:'id-one',vendorPartyId:'v1',
 source:{id:'new1',productId:'p1',baseQty:3,unitCostBasePaisa:null,date:'2026-10-08'}};
 const state=applyVendorCommand(fresh(),cmd);
 assert.equal(applyVendorCommand(state,cmd),state);
 assert.throws(()=>applyVendorCommand(state,{...cmd,source:{...cmd.source,baseQty:6}}),/operation.*conflict/i);
});
test('customer return from sourced sale needs physical receipt decision; no automatic stock restore',()=>{
 const state=borrow(fresh());
 const impact=vendorCorrectionImpact(state,'src1');
 assert.equal(impact.linkedSaleInvoiceId,'INV-1');
 assert.equal(impact.requiresCustomerReturnReview,true);
 assert.equal(state.inventory?.p1,10);
});

test('source linked to a customer sale cannot silently switch to another product',()=>{
 const state=borrow(fresh());
 assert.throws(()=>applyVendorCommand(state,{
  type:'correct-source',operationId:'switch-product',vendorPartyId:'v1',sourceId:'src1',
  actor:'Demo operator',date:'2026-10-10',reason:'Vendor supplied wrong product',
  replacement:{id:'replacement-product',productId:'p2',baseQty:3,
   unitCostBasePaisa:11000,date:'2026-10-08',sourceInvoiceId:'INV-1'}
 }),/linked sale.*product|product.*linked sale/i);
 assert.equal(state.sources.length,1);
 assert.equal(state.sources[0].productId,'p1');
});
