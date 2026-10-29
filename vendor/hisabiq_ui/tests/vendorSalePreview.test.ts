import test from 'node:test';
import assert from 'node:assert/strict';
import type {Product} from '../src/types/erp.ts';
import type {CartLine} from '../src/hooks/usePosCart.ts';
import type {VendorPreviewState} from '../src/vendor/vendorTypes.ts';
import {prepareVendorSalePreview} from '../src/vendor/vendorSalePreview.ts';
import {allocatePosStock} from '../src/vendor/vendorStock.ts';
import {applyVendorCommand,vendorBalances} from '../src/vendor/vendorModel.ts';
const p:Product={id:'p1',name:'Test',sku:'T',category:'Hardware',unit:'Pcs',stock:5,
 minStock:0,sellPrice:100,purchasePrice:60,active:true};
const line=(key:string,qty:number,vendorId:string,cost:number|null):CartLine=>({
 key,product:p,qty:String(qty),secondaryQty:'',unit:'Pcs',price:'150',serials:[],
 stockSource:{mode:'Vendor',vendorId,vendorName:vendorId,unitCost:cost}
});
const fresh=():VendorPreviewState=>({parties:[{id:'v1',roles:['Vendor'],status:'Active'},
 {id:'v2',roles:['Vendor'],status:'Active'}],sources:[],settlements:[],events:[],openings:[],
 sales:[],operations:[],revision:0});
test('simulated sale creates linked unpriced source but no monetary payable',()=>{
 const lines=[line('row-1',8,'v1',null)];
 const allocations=allocatePosStock(lines.map(l=>({key:l.key,product:l.product,requestedBaseQty:8,choice:l.stockSource})),[]);
 const preview=prepareVendorSalePreview('INV-DEMO-100',allocations,lines);
 assert.equal(preview.sources.length,1);
 assert.equal(preview.sources[0].source.unitCostBasePaisa,null);
 assert.equal(preview.sources[0].source.baseQty,3);
 const s=applyVendorCommand(fresh(),{type:'simulate-pos-sale',operationId:'demo-inv-100',sale:preview.sale,sources:preview.sources});
 assert.equal(s.sales.length,1);
 assert.equal(s.sources.length,1);
 assert.equal(s.sales[0].invoiceId,'INV-DEMO-100');
 assert.equal(s.sources[0].sourceInvoiceId,'INV-DEMO-100');
 assert.equal(vendorBalances(s,'v1').unpricedSourceBaseQty,3);
 assert.equal(vendorBalances(s,'v1').knownPayablePaisa,0);
 assert.equal(applyVendorCommand(s,{type:'simulate-pos-sale',operationId:'demo-inv-100',sale:preview.sale,sources:preview.sources}),s);
});
test('multi Vendor sources atomically create only linked records or none',()=>{
 const p2={...p,id:'p2',stock:0};
 const lines=[line('a',8,'v1',null),{...line('b',2,'v2',110),product:p2}];
 const a=allocatePosStock(lines.map(l=>({key:l.key,product:l.product,
  requestedBaseQty:Number(l.qty),choice:l.stockSource})),[]);
 const prepared=prepareVendorSalePreview('INV-DEMO-101',a,lines);
 const s=applyVendorCommand(fresh(),{type:'simulate-pos-sale',operationId:'demo-inv-101',...prepared});
 assert.equal(s.sources.length,2);
 assert.equal(vendorBalances(s,'v1').unpricedSourceBaseQty,3);
 assert.equal(vendorBalances(s,'v2').knownPayablePaisa,22000);
 const invalid={...prepared,sources:prepared.sources.map((x,i)=>i===1?{...x,vendorPartyId:'wrong'}:x)};
 const empty=fresh();
 assert.throws(()=>applyVendorCommand(empty,{type:'simulate-pos-sale',operationId:'invalid',...invalid}),/Vendor role/i);
 assert.equal(empty.events.length,0);
 assert.equal(empty.sales.length,0);
});
test('negative stock source does not make a Vendor demo obligation',()=>{
 const lines=[{...line('a',8,'v1',null),stockSource:{mode:'Negative' as const}}];
 const alloc=allocatePosStock(lines.map(l=>({key:l.key,product:l.product,
 requestedBaseQty:Number(l.qty),choice:l.stockSource})),[]);
 const prep=prepareVendorSalePreview('INV-DEMO-102',alloc,lines);
 assert.deepEqual(prep.sources,[]);
});
