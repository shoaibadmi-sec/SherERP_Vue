import test from 'node:test';
import assert from 'node:assert/strict';
import {applyVendorCommand,vendorBalances,sourceOutstanding} from '../src/vendor/vendorModel.ts';
import type {VendorPreviewState} from '../src/vendor/vendorTypes.ts';
const initial=():VendorPreviewState=>({parties:[{id:'v1',roles:['Vendor'],status:'Active'},{id:'v2',roles:['Vendor'],status:'Active'}],
 sources:[],settlements:[],events:[],openings:[],sales:[],operations:[],revision:0,inventory:{p1:4}});
const sourced=()=>applyVendorCommand(initial(),{type:'record-sourcing',operationId:'source',vendorPartyId:'v1',
 source:{id:'s1',productId:'p1',baseQty:3,unitCostBasePaisa:10000,date:'2026-10-09'}});
const command={type:'clear-source-due' as const,operationId:'mixed',vendorPartyId:'v1',
 sourceId:'s1',date:'2026-10-10',cashPaisa:10000,returnBaseQty:1,
 paymentSplits:[{id:'cash',method:'Cash' as const,accountId:'acc-cash',amountPaisa:10000}]};
test('mixed cash plus returned product is a single atomic Vendor clearance',()=>{
 const before=sourced(),after=applyVendorCommand(before,command);
 assert.equal(after.inventory?.p1,3);
 assert.equal(sourceOutstanding(after,'s1').returnedBaseQty,1);
 assert.equal(sourceOutstanding(after,'s1').monetaryDuePaisa,10000);
 assert.equal(vendorBalances(after,'v1').knownPayablePaisa,10000);
 assert.equal(after.settlements.length,1);
 assert.equal(after.settlements[0].kind,'pay-and-return');
 assert.equal(after.events.length,2);
 assert.equal(applyVendorCommand(after,command),after);
 assert.equal(before.inventory?.p1,4);
});
test('no half post on insufficient stock, split mismatch, wrong Vendor, or overpayment',()=>{
 const before=sourced(),original=JSON.stringify(before);
 for(const wrong of [
  {...command,returnBaseQty:5},
  {...command,cashPaisa:50000},
  {...command,vendorPartyId:'v2'},
  {...command,paymentSplits:[{...command.paymentSplits[0],amountPaisa:9999}]}
 ])assert.throws(()=>applyVendorCommand(before,wrong),/stock|return|Vendor|amount|split|due/i);
 assert.equal(JSON.stringify(before),original);
});
test('reversal restores returned owned stock and full unpaid amount',()=>{
 let state=applyVendorCommand(sourced(),command);
 const event=state.events.find(e=>e.operationId==='mixed')!;
 state=applyVendorCommand(state,{type:'reverse-event',operationId:'undo-mixed',vendorPartyId:'v1',
 eventId:event.id,date:'2026-10-10',actor:'Shop operator',reason:'Mistaken money and goods clearance'});
 assert.equal(state.inventory?.p1,4);
 assert.equal(sourceOutstanding(state,'s1').returnedBaseQty,0);
 assert.equal(sourceOutstanding(state,'s1').monetaryDuePaisa,30000);
 assert.equal(vendorBalances(state,'v1').knownPayablePaisa,30000);
});
test('unpriced items can be fully returned without imaginary money',()=>{
 const pending=applyVendorCommand(initial(),{type:'record-sourcing',operationId:'pending',
  vendorPartyId:'v1',source:{id:'s1',productId:'p1',baseQty:3,unitCostBasePaisa:null,date:'2026-10-09'}});
 const result=applyVendorCommand(pending,{...command,cashPaisa:0,returnBaseQty:3,paymentSplits:[]});
 assert.equal(sourceOutstanding(result,'s1').unpricedBaseQty,0);
 assert.equal(result.sources[0].pricingStatus,'closed');
 assert.equal(vendorBalances(result,'v1').knownPayablePaisa,0);
});
