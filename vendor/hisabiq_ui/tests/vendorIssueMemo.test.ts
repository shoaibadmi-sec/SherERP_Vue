import test from 'node:test';
import assert from 'node:assert/strict';
import {applyVendorCommand,vendorBalances} from '../src/vendor/vendorModel.ts';
import type {VendorPreviewState} from '../src/vendor/vendorTypes.ts';
const initial=():VendorPreviewState=>({
 parties:[{id:'v1',roles:['Vendor'],status:'Active'},{id:'s1',roles:['Supplier'],status:'Active'}],
 sources:[],settlements:[],events:[],openings:[],sales:[],operations:[],revision:0,
 inventory:{p1:5,p2:4}});
const memo=(operationId:string)=>({type:'issue-goods-memo' as const,operationId,vendorPartyId:'v1',
 memoId:'memo-007',date:'2026-10-10',reference:'V-ISS-007',sources:[
 {id:'issue-1',productId:'p1',baseQty:2,unitCostBasePaisa:10000,date:'2026-10-10'},
 {id:'issue-2',productId:'p2',baseQty:3,unitCostBasePaisa:6000,date:'2026-10-10'}]});
test('two-product memo issues owned stock once and adds receivable, not payable',()=>{
 const s=applyVendorCommand(initial(),memo('memo-first'));
 assert.deepEqual(s.inventory,{p1:3,p2:1});
 assert.equal(s.sources.length,2);
 assert.ok(s.sources.every(x=>x.memoId==='memo-007'&&x.sourceKind==='issue'));
 assert.equal(vendorBalances(s,'v1').knownReceivablePaisa,38000);
 assert.equal(vendorBalances(s,'v1').knownPayablePaisa,0);
 assert.equal(s.events.length,2);
 assert.equal(applyVendorCommand(s,memo('memo-first')),s);
});
test('one invalid memo line rolls back all lines and inventory',()=>{
 const s=initial(),snapshot=JSON.stringify(s);
 assert.throws(()=>applyVendorCommand(s,{...memo('invalid'),sources:[
 ...memo('invalid').sources.slice(0,1),
 {...memo('invalid').sources[1],baseQty:5}]}),/stock/i);
 assert.equal(JSON.stringify(s),snapshot);
});
test('duplicate product source ID and wrong Party reject before writing',()=>{
 const s=initial();
 assert.throws(()=>applyVendorCommand(s,{...memo('repeat'),sources:memo('repeat').sources.map(l=>({...l,id:'same'}))}),/duplicate/i);
 assert.throws(()=>applyVendorCommand(s,{...memo('party'),vendorPartyId:'s1'}),/Vendor role/i);
});
