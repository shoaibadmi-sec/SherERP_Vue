import test from 'node:test';
import assert from 'node:assert/strict';
import {applyVendorCommand} from '../src/vendor/vendorModel.ts';
import {projectVendorPartyProfile,projectVendorPartyLedger} from '../src/vendor/vendorPartyProjection.ts';
import type {VendorPreviewState} from '../src/vendor/vendorTypes.ts';
import type {Purchase} from '../src/types/erp.ts';
const blank=():VendorPreviewState=>({
 parties:[{id:'v1',roles:['Vendor','Supplier'],status:'Active'},{id:'v2',roles:['Vendor'],status:'Active'}],
 sources:[],settlements:[],events:[],openings:[],sales:[],operations:[],revision:0,inventory:{p1:10}
});
const purchase={id:'p1',supplierId:'v1',total:500,paid:200,ref:'PUR-1',date:'9 Oct 2026',items:'Box'} as Purchase;
test('one multi-role Party keeps Taken, Given and ordinary Purchases independent',()=>{
 let state=blank();
 state=applyVendorCommand(state,{type:'record-sourcing',operationId:'src',vendorPartyId:'v1',
 source:{id:'taken',productId:'p1',baseQty:3,unitCostBasePaisa:10000,date:'2026-10-09'}});
 state=applyVendorCommand(state,{type:'issue-goods',operationId:'given',vendorPartyId:'v1',
 source:{id:'given',productId:'p1',baseQty:1,unitCostBasePaisa:15000,date:'2026-10-09'}});
 const p=projectVendorPartyProfile(state,[purchase],'v1',{from:'',to:''});
 assert.equal(p.summary.takenDuePaisa,30000);
 assert.equal(p.summary.givenDuePaisa,15000);
 assert.equal(p.summary.purchaseDuePaisa,30000);
 assert.equal(p.takenStatement.closingPaisa,30000);
 assert.equal(p.givenStatement.closingPaisa,15000);
 assert.equal(p.summary.priceNotSetBaseQty,0);
 assert.equal(p.activity.filter(a=>a.bucket==='supplier-purchase').length,2);
 assert.equal(projectVendorPartyProfile(state,[purchase],'v2',{from:'',to:''}).activity.length,0);
});
test('unpriced source never becomes a fabricated cash amount',()=>{
 let state=blank();
 state=applyVendorCommand(state,{type:'record-sourcing',operationId:'unknown',vendorPartyId:'v1',
 source:{id:'src1',productId:'p1',baseQty:5,unitCostBasePaisa:null,date:'2026-10-09'}});
 const p=projectVendorPartyProfile(state,[],'v1',{from:'',to:''});
 assert.equal(p.summary.priceNotSetBaseQty,5);
 assert.equal(p.summary.takenDuePaisa,0);
 assert.equal(p.takenStatement.rows.length,0);
 assert.equal(p.activity[0].moneyPaisa,null);
 state=applyVendorCommand(state,{type:'set-source-price',operationId:'quote',vendorPartyId:'v1',
 sourceId:'src1',unitCostBasePaisa:11000,date:'2026-10-10'});
 const quoted=projectVendorPartyProfile(state,[],'v1',{from:'',to:''});
 assert.equal(quoted.activity.find(x=>x.kind==='sourcing')?.moneyPaisa,null);
 assert.equal(quoted.summary.takenDuePaisa,55000);
});
test('separate date filter and source events prevent mixed running balance',()=>{
 const state=applyVendorCommand(blank(),{type:'record-sourcing',operationId:'src',
 vendorPartyId:'v1',source:{id:'src1',productId:'p1',baseQty:3,unitCostBasePaisa:5000,date:'2026-10-09'}});
 const p=projectVendorPartyProfile(state,[],'v1',{from:'2026-10-10',to:'2026-10-10'});
 assert.equal(p.takenStatement.openingPaisa,15000);
 assert.equal(p.takenStatement.rows.length,0);
 assert.equal(p.givenStatement.closingPaisa,0);
});

test('Party Vendor ledger uses Supplier-style debit and credit but never nets its two balances',()=>{
 let state=blank();
 state=applyVendorCommand(state,{type:'record-sourcing',operationId:'borrowed',vendorPartyId:'v1',
 source:{id:'src1',productId:'p1',baseQty:2,unitCostBasePaisa:10000,date:'2026-10-09'}});
 state=applyVendorCommand(state,{type:'issue-goods',operationId:'lent',vendorPartyId:'v1',
 source:{id:'src2',productId:'p1',baseQty:1,unitCostBasePaisa:5000,date:'2026-10-09'}});
 const profile=projectVendorPartyProfile(state,[],'v1',{from:'',to:''});
 const taken=projectVendorPartyLedger(profile,'payable');
 const given=projectVendorPartyLedger(profile,'receivable');
 assert.equal(taken.rows[0].credit,200);
 assert.equal(taken.rows[0].debit,0);
 assert.equal(taken.closingBalance,-200);
 assert.equal(given.rows[0].debit,50);
 assert.equal(given.rows[0].credit,0);
 assert.equal(given.closingBalance,50);
 assert.equal(taken.rows[0].sourceId,'src1');
 assert.equal(given.rows[0].sourceId,'src2');
});
