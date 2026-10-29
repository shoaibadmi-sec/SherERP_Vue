import test from 'node:test';
import assert from 'node:assert/strict';
import type { BundleVersion, Product, StockLot } from '../src/types/erp.ts';
import type { CartLine } from '../src/hooks/usePosCart.ts';
import { expandCartStockDemand, projectCartShortages, allocateBundlePreview } from '../src/bundles/bundleCart.ts';

const product=(id:string,stock:number):Product=>({
 id,kind:'Stock',name:id,sku:id,category:'Plumbing',unit:'Pcs',stock,
 minStock:0,sellPrice:100,purchasePrice:50,active:true
});
const pipe=product('pipe',9),sock=product('socket',20),pump=product('pump',3);
const a:Product={...product('set-a',0),kind:'Bundle',unit:'Set',sellPrice:1000,stock:0,purchasePrice:0};
const b:Product={...product('set-b',0),kind:'Bundle',unit:'Set',sellPrice:900,stock:0,purchasePrice:0};
const recipe=(id:string,revision:number,pipes:number):BundleVersion=>({
 bundleProductId:id,revision,createdAt:'2026-10-17T00:00:00Z',components:[
  {productId:'pipe',primaryQty:String(pipes),secondaryQty:'',baseQty:pipes,selectedUnit:'Pcs',unitFactorAtSave:1,sortOrder:0},
  {productId:'socket',primaryQty:'1',secondaryQty:'',baseQty:1,selectedUnit:'Pcs',unitFactorAtSave:1,sortOrder:1}
 ]
});
const recipes=[recipe(a.id,1,3),recipe(b.id,1,2)];
const getRecipe=(id:string,v:number)=>recipes.find(r=>r.bundleProductId===id&&r.revision===v);
const line=(key:string,p:Product,qty:string,revision?:number):CartLine=>({
 key,product:p,qty,unit:p.unit,secondaryQty:'',price:String(p.sellPrice),serials:[],
 ...(revision===undefined?{}:{bundleRevision:revision})
});
const lots:StockLot[]=[
 {id:'pipe-1',productId:'pipe',label:'Old',receivedAt:'2026-01-01',quantity:5,available:5,unitCost:40,source:'Opening'},
 {id:'pipe-2',productId:'pipe',label:'New',receivedAt:'2026-09-01',quantity:4,available:4,unitCost:60,source:'Purchase'},
 {id:'sock-1',productId:'socket',label:'One',receivedAt:'2026-09-01',quantity:20,available:20,unitCost:10,source:'Opening'}
];

test('demand adds together two packages and a normal pipe line rather than evaluating independently',()=>{
 const expanded=expandCartStockDemand([line('a',a,'1',1),line('b',b,'1',1),line('pipe',pipe,'5')],[a,b,pipe,sock,pump],getRecipe);
 assert.deepEqual(expanded.errors,[]);
 assert.equal(expanded.demands.filter(d=>d.componentProductId==='pipe').reduce((s,d)=>s+d.requiredBaseQty,0),10);
 const shortage=projectCartShortages(expanded.demands,[a,b,pipe,sock],lots,new Date('2026-10-17'));
 assert.deepEqual(shortage.filter(s=>s.shortageBaseQty>0).map(s=>[s.componentProductId,s.requiredBaseQty,s.availableBaseQty,s.shortageBaseQty]),[['pipe',10,9,1]]);
});
test('two Sets multiply every recipe component without creating parent stock requests',()=>{
 const e=expandCartStockDemand([line('a',a,'2',1)],[a,b,pipe,sock],getRecipe);
 assert.equal(e.errors.length,0);
 assert.deepEqual(e.demands.map(d=>[d.componentProductId,d.requiredBaseQty]),[['pipe',6],['socket',2]]);
 assert.ok(!e.demands.some(d=>d.componentProductId==='set-a'));
});
test('stale or missing recipe, decimal Sets, missing stock component, nested bundles are blocked',()=>{
 for(const q of ['1.5','0','-1','NaN','1e3']) {
  const e=expandCartStockDemand([line('a',a,q,1)],[a,pipe,sock],getRecipe);
  assert.ok(e.errors.length, q+' should fail');
 }
 assert.ok(expandCartStockDemand([line('a',a,'1',2)],[a,pipe,sock],getRecipe).errors.some(x=>/revision/i.test(x)));
 assert.ok(expandCartStockDemand([line('a',a,'1')],[a,pipe,sock],getRecipe).errors.some(x=>/revision/i.test(x)));
 assert.ok(expandCartStockDemand([line('a',a,'1',1)],[a,pipe],getRecipe).errors.some(x=>/component/i.test(x)));
 const bad:BundleVersion={...recipes[0],components:[{...recipes[0].components[0],productId:'set-b'},recipes[0].components[1]]};
 assert.ok(expandCartStockDemand([line('a',a,'1',1)],[a,b,pipe,sock],()=>bad).errors.some(x=>/nested|stock/i.test(x)));
});
test('expired lots and stock debt never overstate sellable component stock',()=>{
 const tracked={...pipe,expiry:{enabled:true,dateRequired:true,warningDays:0,allocationMethod:'FEFO' as const},stock:9};
 const expired:StockLot[]=[{...lots[0],available:8,expiryDate:'2026-01-01'},{...lots[1],available:4,expiryDate:'2027-01-01'}];
 const demands=expandCartStockDemand([line('a',a,'2',1)],[a,tracked,sock],getRecipe).demands;
 const projection=projectCartShortages(demands,[a,tracked,sock],expired,new Date('2026-10-17'));
 assert.equal(projection.find(s=>s.componentProductId==='pipe')?.availableBaseQty,4);
 assert.equal(projection.find(s=>s.componentProductId==='pipe')?.shortageBaseQty,2);
 const netDebt=projectCartShortages(demands,[a,{...pipe,stock:-3},sock],lots,new Date('2026-10-17'));
 assert.equal(netDebt.find(s=>s.componentProductId==='pipe')?.availableBaseQty,0);
});
test('preview allocation uses physical lots in stable order, never mutates lots, never invents missing serials',()=>{
 const before=JSON.stringify(lots);
 const expanded=expandCartStockDemand([line('a',a,'2',1)],[a,pipe,sock],getRecipe);
 const result=allocateBundlePreview(expanded.demands,[a,pipe,sock],lots,new Date('2026-10-17'));
 assert.equal(result.errors.length,0);
 assert.equal(result.allocations.filter(l=>l.productId==='pipe').reduce((s,x)=>s+x.quantity,0),6);
 assert.equal(result.allocations.filter(l=>l.productId==='pipe').find(l=>l.lotId==='pipe-1')?.quantity,5);
 assert.equal(result.allocations.filter(l=>l.productId==='pipe').find(l=>l.lotId==='pipe-2')?.quantity,1);
 assert.equal(JSON.stringify(lots),before);
 const serial={...pipe,serialTracking:'Required' as const};
 const serialResult=allocateBundlePreview(expanded.demands,[a,serial,sock],lots,new Date('2026-10-17'));
 assert.ok(serialResult.errors.some(x=>/serial/i.test(x)));
 assert.equal(serialResult.allocations.length,0);
});
test('shortage allocation is all-or-nothing: no partial fake stock when a component is missing',()=>{
 // Four Sets require 12 Pipes, while the combined lot supply is only 9.
 const expanded=expandCartStockDemand([line('a',a,'4',1)],[a,pipe,sock],getRecipe);
 const shortage=projectCartShortages(expanded.demands,[a,pipe,sock],lots,new Date('2026-10-17'));
 assert.equal(shortage.find(s=>s.componentProductId==='pipe')?.shortageBaseQty,3);
 const r=allocateBundlePreview(expanded.demands,[a,pipe,sock],lots,new Date('2026-10-17'));
 assert.ok(r.errors.some(x=>/shortage/i.test(x)));
 assert.deepEqual(r.allocations,[]);
});

test('legacy products with omitted kind behave as Stock, matching existing POS inventory',()=>{
 const legacy={...pipe,kind:undefined};
 const demands=expandCartStockDemand([line('a',a,'1',1)],[a,legacy,sock],getRecipe);
 assert.deepEqual(demands.errors,[]);
 const shortage=projectCartShortages(demands.demands,[a,legacy,sock],lots,new Date('2026-10-17'));
 assert.equal(shortage.find(x=>x.componentProductId==='pipe')?.shortageBaseQty,0);
 assert.equal(allocateBundlePreview(demands.demands,[a,legacy,sock],lots,new Date('2026-10-17')).errors.length,0);
});
