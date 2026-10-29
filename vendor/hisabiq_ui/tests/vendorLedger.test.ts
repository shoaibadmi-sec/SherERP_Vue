import test from 'node:test';
import assert from 'node:assert/strict';
import {applyVendorCommand} from '../src/vendor/vendorModel.ts';
import {projectVendorStatement,serializeVendorStatementCsv} from '../src/vendor/vendorLedger.ts';
import type {VendorPreviewState} from '../src/vendor/vendorTypes.ts';
const base:VendorPreviewState={parties:[{id:'v1',roles:['Vendor'],status:'Active'}],
 sources:[],settlements:[],events:[],openings:[],sales:[],operations:[],revision:0};
const add=(state:VendorPreviewState,operationId:string,date:string,cost:number|null)=>applyVendorCommand(state,{
 type:'record-sourcing',vendorPartyId:'v1',operationId,source:{id:'source-'+operationId,
 productId:'p1',baseQty:3,unitCostBasePaisa:cost,date,reference:operationId}
});
test('opening from before selected range remains in payable closing total',()=>{
 let s=applyVendorCommand(base,{type:'set-opening',vendorPartyId:'v1',operationId:'opening',
 side:'payable',amountPaisa:5000,date:'2026-10-01'});
 s=add(s,'priced','2026-10-02',11000);
 const x=projectVendorStatement(s,'v1','payable',{from:'2026-10-02',to:'2026-10-10'},'2026-10-10');
 assert.equal(x.openingPaisa,5000);
 assert.equal(x.periodIncreasePaisa,33000);
 assert.equal(x.closingPaisa,38000);
 assert.deepEqual(x.rows.map(r=>r.runningPaisa),[38000]);
 const recv=projectVendorStatement(s,'v1','receivable',{from:'',to:''},'2026-10-10');
 assert.equal(recv.closingPaisa,0);
});
test('unpriced obligations show in pending quantity queue, not invented money',()=>{
 const s=add(base,'unpriced','2026-10-09',null);
 const x=projectVendorStatement(s,'v1','payable',{from:'',to:''},'2026-10-10');
 assert.equal(x.closingPaisa,0);
 assert.equal(x.rows.length,0);
 assert.equal(x.unpricedSources.length,1);
 assert.equal(x.unpricedSources[0].baseQty,3);
 assert.match(serializeVendorStatementCsv(x,'Vendor'),/Price pending/);
 assert.doesNotMatch(serializeVendorStatementCsv(x,'Vendor'),/Unpriced.*0\.00/);
});
test('date range validation protects print and running balances',()=>{
 const s=add(base,'dated','2026-10-09',11000);
 assert.throws(()=>projectVendorStatement(s,'v1','payable',{from:'2026-10-09',to:''},'2026-10-10'),/both/i);
 assert.throws(()=>projectVendorStatement(s,'v1','payable',{from:'2026-10-12',to:'2026-10-13'},'2026-10-10'),/future/i);
 assert.throws(()=>projectVendorStatement(s,'v1','payable',{from:'2026-02-31',to:'2026-10-09'},'2026-10-10'),/valid/i);
});
test('CSV escapes spreadsheet injection and preserves BOM',()=>{
 let s=add(base,'money','2026-10-09',11000);
 s={...s,events:s.events.map(e=>({...e,description:'=HYPERLINK("evil")'}))};
 const csv=serializeVendorStatementCsv(projectVendorStatement(s,'v1','payable',{from:'',to:''},'2026-10-10'),'Vendor');
 assert.ok(csv.startsWith('\uFEFF'));
 assert.ok(csv.includes("'=HYPERLINK"));
 assert.ok(csv.includes('33000'));
});
