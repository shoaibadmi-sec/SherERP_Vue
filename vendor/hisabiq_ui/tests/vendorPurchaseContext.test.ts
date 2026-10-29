import test from 'node:test';
import assert from 'node:assert/strict';
import {applyVendorCommand,vendorBalances} from '../src/vendor/vendorModel.ts';
import type {VendorPreviewState} from '../src/vendor/vendorTypes.ts';
const fresh=():VendorPreviewState=>({parties:[{id:'v1',roles:['Vendor'],status:'Active'}],
 sources:[],settlements:[],events:[],openings:[],sales:[],operations:[],revision:0,inventory:{p1:5}});
test('ordinary Vendor purchase adds owned stock but NOT sourcing payable/receivable',()=>{
 const s=fresh();
 const p={type:'record-purchase-inventory' as const,vendorPartyId:'v1',operationId:'purchase-1',purchaseId:'purchase-1',
 lines:[{productId:'p1',baseQty:10}]};
 const next=applyVendorCommand(s,p);
 assert.equal(next.inventory?.p1,15);
 assert.equal(next.sources.length,0);
 assert.equal(next.events.length,0);
 assert.equal(vendorBalances(next,'v1').knownPayablePaisa,0);
 assert.equal(vendorBalances(next,'v1').knownReceivablePaisa,0);
 assert.equal(applyVendorCommand(next,p),next);
 assert.equal(s.inventory?.p1,5);
});
test('reject invalid purchase stock atomically',()=>{
 const initial=fresh();
 const command={type:'record-purchase-inventory' as const,operationId:'p2',vendorPartyId:'v1',purchaseId:'pu',
 lines:[{productId:'p1',baseQty:10},{productId:'p1',baseQty:-4}]};
 assert.throws(()=>applyVendorCommand(initial,command),/quantity/i);
 assert.equal(initial.inventory?.p1,5);
 assert.equal(initial.events.length,0);
});
test('ordinary replacement purchase and matching return change stock once each',()=>{
 let state=applyVendorCommand(fresh(),{type:'record-sourcing',operationId:'vendor-borrow',vendorPartyId:'v1',
 source:{id:'borrow',productId:'p1',baseQty:3,unitCostBasePaisa:null,date:'2026-10-09'}});
 state=applyVendorCommand(state,{type:'record-purchase-inventory',operationId:'new-pur',vendorPartyId:'v1',purchaseId:'new-pur',
 lines:[{productId:'p1',baseQty:3}]});
 assert.equal(state.inventory?.p1,8);
 state=applyVendorCommand(state,{type:'settle-source',operationId:'return-matching',vendorPartyId:'v1',
 side:'payable',kind:'return-to-vendor',date:'2026-10-10',amountPaisa:null,
 allocations:[{sourceId:'borrow',amountPaisa:null,baseQty:3}]});
 assert.equal(state.inventory?.p1,5);
 assert.equal(vendorBalances(state,'v1').unpricedSourceBaseQty,0);
 assert.equal(vendorBalances(state,'v1').knownPayablePaisa,0);
});

test('same Purchase invoice cannot be added twice with different operation IDs',()=>{
 const first={type:'record-purchase-inventory' as const,operationId:'stock-receipt-1',
  vendorPartyId:'v1',purchaseId:'PUR-DUP-100',lines:[{productId:'p1',baseQty:4}]};
 const once=applyVendorCommand(fresh(),first);
 assert.equal(once.inventory?.p1,9);
 assert.throws(()=>applyVendorCommand(once,{...first,operationId:'stock-receipt-2'}),
  /purchase.*already|duplicate.*purchase/i);
 assert.equal(once.inventory?.p1,9);
 assert.equal(once.revision,1);
});
