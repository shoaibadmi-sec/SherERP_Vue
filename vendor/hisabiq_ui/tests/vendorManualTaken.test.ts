import test from 'node:test';
import assert from 'node:assert/strict';
import {applyVendorCommand,vendorBalances} from '../src/vendor/vendorModel.ts';
import type {VendorPreviewState} from '../src/vendor/vendorTypes.ts';
const fresh=():VendorPreviewState=>({parties:[{id:'v1',roles:['Vendor'],status:'Active'}],
 sources:[],settlements:[],events:[],openings:[],sales:[],operations:[],revision:0,inventory:{p1:8,p2:20}});
const cmd={type:'record-sourcing-memo' as const,operationId:'take-1',vendorPartyId:'v1',memoId:'memo-1',date:'2026-10-10',reference:'V-TK-1',
 sources:[{id:'s1',productId:'p1',baseQty:3,unitCostBasePaisa:null,date:'2026-10-10'},
 {id:'s2',productId:'p2',baseQty:4,unitCostBasePaisa:10000,date:'2026-10-10'}]};
test('multi-product Taken memo creates one source per line without claiming owned stock',()=>{
 const state=applyVendorCommand(fresh(),cmd);
 assert.equal(state.sources.length,2);
 assert.equal(state.events.length,2);
 assert.ok(state.sources.every(x=>x.memoId==='memo-1'));
 assert.equal(state.inventory?.p1,8);
 assert.equal(vendorBalances(state,'v1').knownPayablePaisa,40000);
 assert.equal(vendorBalances(state,'v1').unpricedSourceBaseQty,3);
 assert.equal(applyVendorCommand(state,cmd),state);
});
test('bad second line, wrong Vendor and changed retry are atomic failures',()=>{
 const before=fresh();
 assert.throws(()=>applyVendorCommand(before,{...cmd,sources:[cmd.sources[0],{...cmd.sources[1],baseQty:0}]}),/quantity/i);
 assert.throws(()=>applyVendorCommand(before,{...cmd,vendorPartyId:'not-exist'}),/Vendor/i);
 assert.equal(before.sources.length,0);
 const once=applyVendorCommand(before,cmd);
 assert.throws(()=>applyVendorCommand(once,{...cmd,sources:[{...cmd.sources[0],baseQty:5},cmd.sources[1]]}),/operation.*conflict/i);
});
