import test from 'node:test';
import assert from 'node:assert/strict';
import type {Product, StockLot, BundleVersion} from '../src/types/erp.ts';
import type {CartLine} from '../src/hooks/usePosCart.ts';
import {expandCartStockDemand} from '../src/bundles/bundleCart.ts';
import {planComponentFulfillment,maxAffordableBundleSets} from '../src/bundles/bundleFulfillment.ts';

const product=(id:string,stock:number,serialTracking?:Product['serialTracking']):Product=>({
 id,kind:'Stock',name:id,sku:id,unit:'Pcs',category:'Hardware',stock,minStock:0,purchasePrice:30,sellPrice:50,active:true,
 ...(serialTracking?{serialTracking}:{})
});
const pipe=product('pipe',9),socket=product('socket',30);
const pump=product('pump',3,'Required');
const bundle:Product={...product('kit',0),kind:'Bundle',unit:'Set',sellPrice:2000,purchasePrice:0};
const recipe:BundleVersion={bundleProductId:'kit',revision:1,createdAt:'2026-10-17',components:[
 {productId:'pipe',primaryQty:'3',secondaryQty:'',selectedUnit:'Pcs',baseQty:3,unitFactorAtSave:1,sortOrder:0},
 {productId:'socket',primaryQty:'2',secondaryQty:'',selectedUnit:'Pcs',baseQty:2,unitFactorAtSave:1,sortOrder:1}
]};
const getRecipe=(id:string,rev:number)=>id==='kit'&&rev===1?recipe:undefined;
const base=(p:Product,key:string,qty='1'):CartLine=>({key,product:p,qty,unit:p.unit,secondaryQty:'',price:'500',serials:[],
 ...(p.kind==='Bundle'?{bundleRevision:1,bundleRecipeSignature:JSON.stringify(recipe.components)}:{})});
const lots:StockLot[]=[
 {id:'old',productId:'pipe',label:'old',receivedAt:'2026-01-01',quantity:6,available:6,unitCost:10,source:'Opening'},
 {id:'new',productId:'pipe',label:'new',receivedAt:'2026-09-01',quantity:3,available:3,unitCost:20,source:'Purchase'},
 {id:'sock',productId:'socket',label:'socket',receivedAt:'2026-01-01',quantity:30,available:30,unitCost:5,source:'Opening'}
];

test('component shortage is per parent+component and cannot be covered twice across mixed lines',()=>{
 const lines=[base(pipe,'normal','5'),base(bundle,'kit1','2')]; // 5+6 pipes, available 9: 2 shortage
 const expanded=expandCartStockDemand(lines,[pipe,socket,bundle],getRecipe);
 const result=planComponentFulfillment(expanded.demands,[pipe,socket,bundle],lots,{},new Date('2026-10-17'));
 assert.equal(result.rows.filter(x=>x.componentProductId==='pipe').reduce((s,x)=>s+x.shortageBaseQty,0),2);
 assert.equal(result.errors.some(x=>/shortage/i.test(x)),true);
 assert.equal(result.allocations.length,0);
 // Explicit sourcing is scoped to the bundle component, not all pipes.
 const approved=planComponentFulfillment(expanded.demands,[pipe,socket,bundle],lots,
  {sources:{'kit1:pipe':{mode:'Negative'}}},new Date('2026-10-17'));
 assert.deepEqual(approved.errors,[]);
 assert.equal(approved.rows.find(r=>r.sourceLineKey==='kit1'&&r.componentProductId==='pipe')?.negativeBaseQty,2);
 assert.equal(approved.rows.find(r=>r.sourceLineKey==='normal'&&r.componentProductId==='pipe')?.negativeBaseQty,0);
 assert.equal(approved.allocations.filter(a=>a.productId==='pipe').reduce((s,a)=>s+a.quantity,0),9);
});
test('Vendor pending price is preserved as null, not zero COGS or fabricated physical lots',()=>{
 const expanded=expandCartStockDemand([base(bundle,'b','4')],[pipe,socket,bundle],getRecipe);
 const selected={mode:'Vendor' as const,vendorId:'party-1',vendorName:'Hardware Dealer',unitCost:null};
 const outcome=planComponentFulfillment(expanded.demands,[pipe,socket,bundle],lots,
  {sources:{'b:pipe':selected}},new Date('2026-10-17'));
 assert.deepEqual(outcome.errors,[]);
 assert.equal(outcome.rows.find(r=>r.componentProductId==='pipe')?.vendorBaseQty,3);
 assert.equal(outcome.rows.find(r=>r.componentProductId==='pipe')?.source?.mode,'Vendor');
 assert.equal(outcome.allocations.filter(a=>a.productId==='pipe').reduce((s,a)=>s+a.quantity,0),9);
 assert.equal(outcome.estimatedCostKnown,false);
});
test('Own Stock clamp uses whole Sets and reserves stock for all other cart lines',()=>{
 const lines=[base(pipe,'normal','5'),base(bundle,'b','2')];
 const demand=expandCartStockDemand(lines,[pipe,socket,bundle],getRecipe).demands;
 assert.equal(maxAffordableBundleSets('b',demand,[pipe,socket,bundle],lots,new Date('2026-10-17')),1);
 const impossible=[base(pipe,'normal','9'),base(bundle,'b','2')];
 const second=expandCartStockDemand(impossible,[pipe,socket,bundle],getRecipe).demands;
 assert.equal(maxAffordableBundleSets('b',second,[pipe,socket,bundle],lots,new Date('2026-10-17')),0);
});
test('serial-required component uses selected physical serials and original lots, never guesses',()=>{
 const tracked:StockLot[]=[
 {id:'pump-old',productId:'pump',label:'Pump',receivedAt:'2026-01-01',quantity:2,available:2,unitCost:250,source:'Opening',serials:['A','B']},
 {id:'pump-new',productId:'pump',label:'Pump 2',receivedAt:'2026-09-01',quantity:1,available:1,unitCost:300,source:'Purchase',serials:['C']},
 ...lots
 ];
 const trackedRecipe:BundleVersion={...recipe,components:[recipe.components[0],{...recipe.components[1],productId:'pump',baseQty:1,primaryQty:'1'}]};
 const lines=[base(bundle,'b','2')];
 const demand=expandCartStockDemand(lines,[pipe,pump,bundle],()=>trackedRecipe).demands;
 const missing=planComponentFulfillment(demand,[pipe,pump,bundle],tracked,{},new Date('2026-10-17'));
 assert.ok(missing.errors.some(x=>/serial/i.test(x)));
 const selected=planComponentFulfillment(demand,[pipe,pump,bundle],tracked,
  {serials:{'b:pump':['A','C']}},new Date('2026-10-17'));
 assert.deepEqual(selected.errors,[]);
 assert.deepEqual(selected.allocations.filter(x=>x.productId==='pump').map(x=>[x.lotId,x.quantity]),[['pump-old',1],['pump-new',1]]);
 assert.deepEqual(selected.serialAllocations.map(x=>[x.lotId,x.serial]),[['pump-old','A'],['pump-new','C']]);
 const reuse=planComponentFulfillment(demand,[pipe,pump,bundle],tracked,
  {serials:{'b:pump':['A','C']},soldSerials:['a']},new Date('2026-10-17'));
 assert.ok(reuse.errors.some(x=>/serial/i.test(x)));
 assert.deepEqual(reuse.allocations,[]);
});
test('the same serial cannot be reserved by two bundle lines or a normal POS line',()=>{
 const fullRecipe:BundleVersion={...recipe,components:[recipe.components[0],{...recipe.components[1],productId:'pump',baseQty:1,primaryQty:'1'}]};
 const all=[...lots,{id:'ps',productId:'pump',label:'Pump',receivedAt:'2026-06-01',quantity:3,available:3,unitCost:250,source:'Opening' as const,serials:['A','B','C']}];
 const demands=expandCartStockDemand([base(bundle,'b1'),base(bundle,'b2')],[pipe,pump,bundle],()=>fullRecipe).demands;
 const result=planComponentFulfillment(demands,[pipe,pump,bundle],all,{serials:{'b1:pump':['A'],'b2:pump':['a']}},new Date('2026-10-17'));
 assert.ok(result.errors.some(x=>/serial/i.test(x)));
 assert.equal(result.allocations.length,0);
});
test('expired serial lot, invalid source and serial shortage are never silently accepted',()=>{
 const fullRecipe:BundleVersion={...recipe,components:[recipe.components[0],{...recipe.components[1],productId:'pump',baseQty:1,primaryQty:'1'}]};
 const old={...pump,expiry:{enabled:true,dateRequired:true,warningDays:0,allocationMethod:'FEFO' as const}};
 const all=[...lots,{id:'ps',productId:'pump',label:'Expired pump',receivedAt:'2026-01-01',expiryDate:'2026-03-01',quantity:1,available:1,unitCost:250,source:'Opening' as const,serials:['A']}];
 const demands=expandCartStockDemand([base(bundle,'b')],[pipe,old,bundle],()=>fullRecipe).demands;
 const result=planComponentFulfillment(demands,[pipe,old,bundle],all,{serials:{'b:pump':['A']}},new Date('2026-10-17'));
 assert.ok(result.errors.some(x=>/serial|shortage/i.test(x)));
 const invalid=planComponentFulfillment(demands,[pipe,old,bundle],all,{sources:{'b:pump':{mode:'Vendor',vendorId:'',vendorName:'',unitCost:-1}}},new Date('2026-10-17'));
 assert.ok(invalid.errors.length>0);
});

test('Own Stock clamp honors cart reservation order when two bundles share components',()=>{
 const first=[base(bundle,'first','2'),base(bundle,'second','3')];
 const e1=expandCartStockDemand(first,[pipe,socket,bundle],getRecipe).demands;
 assert.equal(maxAffordableBundleSets('first',e1,[pipe,socket,bundle],lots,new Date('2026-10-17')),2,
  'earlier package owns its 6 Pipes before a later package sources its shortage');
 assert.equal(maxAffordableBundleSets('second',e1,[pipe,socket,bundle],lots,new Date('2026-10-17')),1,
  'later package can reduce to one whole Set with the remaining 3 Pipes');
});
