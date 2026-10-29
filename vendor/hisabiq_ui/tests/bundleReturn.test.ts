import test from 'node:test';
import assert from 'node:assert/strict';
import type {SalesInvoice} from '../src/types/erp.ts';
import {planBundleReturn,type BundleReturnRequest} from '../src/bundles/bundleReturn.ts';

const invoice:SalesInvoice={
 id:'posted-1',invoice:'INV-POSTED-1',date:'2026-10-01',time:'11:00',party:'Customer',items:1,
 total:7800,subtotal:7800,discount:0,rounding:0,paid:7800,due:0,method:'Cash',status:'Paid',
 payments:[{id:'pay',method:'Cash',amount:7800}],salesperson:'Counter',
 lines:[{
  id:'parent-1',productId:'set',name:'Tubewell Set',unit:'Set',quantity:'2 Set',returnableQuantity:2,
  price:3900,total:7800,
  bundleSnapshot:{bundleRevision:1,components:[
   {productId:'pipe',name:'PVC Pipe',sku:'PIPE',unit:'Feet',unitFactorAtSale:20,baseQtyPerSet:65,totalBaseQty:130,
     lotAllocations:[{lotId:'pipe-lot-1',quantity:130}],unitCost:20},
   {productId:'pump',name:'Motor Pump',sku:'PUMP',unit:'Pcs',unitFactorAtSale:1,baseQtyPerSet:1,totalBaseQty:2,
     lotAllocations:[{lotId:'pump-old',quantity:1},{lotId:'pump-new',quantity:1}],
     serials:['M-01','M-02'],unitCost:2000}
  ]}
 }]
};
const line=invoice.lines[0],source=invoice.lines[0].bundleSnapshot!;
const choices={
 pipe:{disposition:'Restock' as const},
 pump:{disposition:'Do not restock' as const,serials:['M-01']}
};
const req=(sets:number,options:Partial<BundleReturnRequest>={})=>({
 invoice,line,sets,choices,...options
});
test('one returned Set derives component quantities from original sold recipe, not current catalog',()=>{
 const plan=planBundleReturn(req(1));
 assert.deepEqual(plan.issues,[]);
 assert.equal(plan.bundleRevision,1);
 assert.equal(plan.refundEstimate,3900);
 assert.equal(plan.previewOnly,true);
 assert.deepEqual(plan.components.map(x=>[x.productId,x.returnedBaseQty,x.unit,x.disposition]),[
  ['pipe',65,'Feet','Restock'],['pump',1,'Pcs','Do not restock']]);
 assert.deepEqual(plan.components[0].eligibleLotCandidates,[{lotId:'pipe-lot-1',quantity:65}]);
 assert.deepEqual(plan.components[1].eligibleLotCandidates,[]);
 assert.equal(JSON.stringify(invoice.lines[0].bundleSnapshot),JSON.stringify(source));
});
test('reject decimal, zero, over-return and previously returned whole Sets',()=>{
 for(const sets of [0,1.5,-1,3,NaN]){
  assert.ok(planBundleReturn(req(sets)).issues.some(s=>s.includes('whole Sets')));
 }
 const historical=[{returnId:'RT-1',invoiceId:invoice.id,lineId:line.id,sets:1,
  serials:{pump:['M-01']}}];
 const again=planBundleReturn(req(2,{priorReturns:historical}));
 assert.ok(again.issues.some(x=>x.includes('whole Sets')));
 const duplicateSerial=planBundleReturn(req(1,{priorReturns:historical}));
 assert.ok(duplicateSerial.issues.some(x=>x.includes('already returned')));
});
test('full-Set return with multiple original lots uses exact historical allocations, partial does not guess',()=>{
 const full=planBundleReturn(req(2,{choices:{pipe:{disposition:'Restock'},
  pump:{disposition:'Restock',serials:['M-01','M-02']}}}));
 assert.deepEqual(full.issues,[]);
 assert.deepEqual(full.components[1].eligibleLotCandidates,[
  {lotId:'pump-old',quantity:1},{lotId:'pump-new',quantity:1}]);
 const partial=planBundleReturn(req(1,{choices:{pipe:{disposition:'Restock'},
  pump:{disposition:'Restock',serials:['M-01']}}}));
 assert.ok(partial.issues.some(x=>x.includes('manual original-lot')));
 assert.deepEqual(partial.components[1].eligibleLotCandidates,[]);
});
test('unknown historical lots or vendor sourcing never fabricates restock movements',()=>{
 const changed={...line,bundleSnapshot:{...source,
  components:source.components.map((p,i)=>i===0?{...p,lotAllocations:[]}:p)}};
 const modified={...invoice,lines:[changed]};
 const missing=planBundleReturn(req(1,{invoice:modified,line:changed}));
 assert.ok(missing.issues.some(x=>x.includes('lot evidence')));
 const vendor={...line,bundleSnapshot:{...source,components:source.components.map((p,i)=>i===0?
  {...p,stockSource:{mode:'Vendor' as const,vendorId:'v1',vendorName:'Supplier',unitCost:null}}:p)}};
 const vendorInvoice={...invoice,lines:[vendor]};
 assert.ok(planBundleReturn(req(1,{invoice:vendorInvoice,line:vendor})).issues.some(x=>x.includes('Sourced/negative')));
});
test('historical discount requires posted net parent allocation, never current price or component retail sum',()=>{
 const discounted={...invoice,discount:200,subtotal:8000,total:7800};
 const unknown=planBundleReturn(req(1,{invoice:discounted}));
 assert.equal(unknown.refundEstimate,null);
 assert.ok(unknown.issues.some(x=>x.includes('net parent')));
 const assigned={...line,netSaleTotal:7400};
 const allocated=planBundleReturn(req(1,{invoice:{...discounted,lines:[assigned]},line:assigned}));
 assert.equal(allocated.refundEstimate,3700);
 assert.deepEqual(allocated.issues,[]);
});
test('duplicate historical serials, foreign serials and changed source identity block return',()=>{
 const reused=planBundleReturn(req(2,{choices:{pipe:{disposition:'Restock'},
  pump:{disposition:'Do not restock',serials:['M-01','m-01']}}}));
 assert.ok(reused.issues.some(x=>x.includes('Duplicate')));
 const foreign=planBundleReturn(req(1,{choices:{pipe:{disposition:'Restock'},
  pump:{disposition:'Do not restock',serials:['OTHER']}}}));
 assert.ok(foreign.issues.some(x=>x.includes('original package sale')));
 const alien=planBundleReturn(req(1,{line:{...line,bundleSnapshot:{...source,bundleRevision:44}}}));
 assert.ok(alien.issues.some(x=>x.includes('immutable source')));
});

test('a series of partial returns allocates historical net pennies exactly once',()=>{
 const three={...line,quantity:'3 Set',returnableQuantity:3,total:100,netSaleTotal:100,
  bundleSnapshot:{...source,components:source.components.map(child=>({
   ...child,totalBaseQty:child.baseQtyPerSet*3,
   lotAllocations:child.lotAllocations?.length===1?
    [{lotId:child.lotAllocations[0].lotId,quantity:child.baseQtyPerSet*3}]:
    [{lotId:'verified-'+child.productId,quantity:child.baseQtyPerSet*3}],
   serials:undefined
  }))}};
 const doc={...invoice,lines:[three],discount:0,total:100,subtotal:100};
 const picks={pipe:{disposition:'Restock' as const},pump:{disposition:'Restock' as const}};
 const original=planBundleReturn({invoice:doc,line:three,sets:1,choices:picks});
 const afterOne=planBundleReturn({invoice:doc,line:three,sets:1,choices:picks,
  priorReturns:[{returnId:'r1',invoiceId:doc.id,lineId:three.id,sets:1}]});
 const afterTwo=planBundleReturn({invoice:doc,line:three,sets:1,choices:picks,
  priorReturns:[{returnId:'r1',invoiceId:doc.id,lineId:three.id,sets:1},
   {returnId:'r2',invoiceId:doc.id,lineId:three.id,sets:1}]});
 assert.equal(original.refundEstimate,33.33);
 assert.equal(afterOne.refundEstimate,33.34);
 assert.equal(afterTwo.refundEstimate,33.33);
 assert.equal(original.refundEstimate!+afterOne.refundEstimate!+afterTwo.refundEstimate!,100);
});
test('duplicate historical child IDs cannot accidentally produce duplicate restoration candidates',()=>{
 const changed={...line,bundleSnapshot:{...source,components:[source.components[0],source.components[0]]}};
 const doc={...invoice,lines:[changed]};
 const plan=planBundleReturn(req(1,{invoice:doc,line:changed}));
 assert.ok(plan.issues.some(x=>x.includes('Duplicate historical component')));
});
