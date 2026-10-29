import test from 'node:test';
import assert from 'node:assert/strict';
import {applyVendorCommand,sourceOutstanding,vendorBalances} from '../src/vendor/vendorModel.ts';
import type {VendorPreviewState} from '../src/vendor/vendorTypes.ts';
const fresh=():VendorPreviewState=>({parties:[{id:'v1',roles:['Vendor'],status:'Active'},
 {id:'v2',roles:['Vendor'],status:'Active'}],sources:[],settlements:[],events:[],openings:[],sales:[],operations:[],revision:0,
 inventory:{p1:10}});
const sourced=(id:string)=>applyVendorCommand(fresh(),{type:'record-sourcing',
 operationId:'borrow-'+id,vendorPartyId:'v1',source:{id,productId:'p1',baseQty:3,date:'2026-10-09',unitCostBasePaisa:null,reference:'INV-901'}});
const quote=(sourceId:string,cost=11000)=>({type:'set-source-price' as const,operationId:'quote-'+sourceId,
 vendorPartyId:'v1',sourceId,date:'2026-10-10',unitCostBasePaisa:cost,reason:'Evening vendor quote'});
test('unpriced quantity is an obligation, evening quote creates known payable only once',()=>{
 const before=sourced('src1');assert.equal(vendorBalances(before,'v1').knownPayablePaisa,0);
 assert.equal(sourceOutstanding(before,'src1').unpricedBaseQty,3);
 const after=applyVendorCommand(before,quote('src1'));
 assert.equal(after.sources[0].unitCostBasePaisa,11000);
 assert.equal(after.sources[0].sourceAmountPaisa,33000);
 assert.equal(after.sources[0].pricingStatus,'priced');
 assert.equal(vendorBalances(after,'v1').knownPayablePaisa,33000);
 assert.equal(vendorBalances(after,'v2').knownPayablePaisa,0);
 assert.equal(sourceOutstanding(after,'src1').monetaryDuePaisa,33000);
 assert.equal(applyVendorCommand(after,quote('src1')),after);
});
test('return one matching piece before quote prices only remaining two',()=>{
 let s=sourced('src2');
 s=applyVendorCommand(s,{type:'settle-source',operationId:'return-one',
 vendorPartyId:'v1',side:'payable',kind:'return-to-vendor',date:'2026-10-10',amountPaisa:null,
 allocations:[{sourceId:'src2',baseQty:1,amountPaisa:null}],reason:'Matching product returned'});
 assert.equal(sourceOutstanding(s,'src2').unpricedBaseQty,2);
 s=applyVendorCommand(s,quote('src2'));
 assert.equal(s.sources[0].pricedBaseQty,2);
 assert.equal(vendorBalances(s,'v1').knownPayablePaisa,22000);
 assert.equal(sourceOutstanding(s,'src2').returnedBaseQty,1);
 assert.equal(sourceOutstanding(s,'src2').monetaryDuePaisa,22000);
});
test('fully returned before quote closes quantity without ever valuing it at zero',()=>{
 let s=sourced('src3');
 s=applyVendorCommand(s,{type:'settle-source',operationId:'return-all',vendorPartyId:'v1',side:'payable',
 kind:'return-to-vendor',date:'2026-10-10',amountPaisa:null,
 allocations:[{sourceId:'src3',amountPaisa:null,baseQty:3}],reason:'Three matching Pcs'});
 assert.equal(sourceOutstanding(s,'src3').unpricedBaseQty,0);
 assert.equal(sourceOutstanding(s,'src3').monetaryDuePaisa,null);
 assert.equal(vendorBalances(s,'v1').knownPayablePaisa,0);
 assert.throws(()=>applyVendorCommand(s,quote('src3')),/already|closed|no remaining/i);
});
test('bad quote or cross-Vendor source rejects atomically',()=>{
 const before=sourced('src4'),json=JSON.stringify(before);
 assert.throws(()=>applyVendorCommand(before,quote('src4',Number.NaN)),/cost|paisa/i);
 assert.throws(()=>applyVendorCommand(before,quote('src4',-12)),/cost|paisa/i);
 assert.throws(()=>applyVendorCommand(before,{...quote('src4'),vendorPartyId:'v2'}),/Vendor|source/i);
 assert.equal(JSON.stringify(before),json);
});
