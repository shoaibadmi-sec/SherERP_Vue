import test from 'node:test';
import assert from 'node:assert/strict';
import type {Product,BundleVersion,SaleLine} from '../src/types/erp.ts';
import type {CartLine} from '../src/hooks/usePosCart.ts';
import {createBundleSaleSnapshot,bundleContentsForReceipt} from '../src/bundles/bundleDocuments.ts';

const stock=(id:string,name:string,unit='Pcs'):Product=>({
 id,kind:'Stock',name,sku:id,category:'Hardware',unit,stock:30,minStock:0,active:true,
 sellPrice:100,purchasePrice:55
});
const pipe=stock('pipe','PVC Pipe','Feet'),socket=stock('socket','Socket');
const bundle:Product={...stock('set','Tubewell Set','Set'),kind:'Bundle',stock:0,purchasePrice:0,sellPrice:4000};
const recipe:BundleVersion={
 bundleProductId:bundle.id,revision:2,createdAt:'2026-10-17T00:00:00Z',
 components:[
  {productId:'pipe',primaryQty:'3',secondaryQty:'5',selectedUnit:'Pipe',baseQty:65,unitFactorAtSave:20,sortOrder:0},
  {productId:'socket',primaryQty:'2',secondaryQty:'',selectedUnit:'Pcs',baseQty:2,unitFactorAtSave:1,sortOrder:1}
 ]
};
const cart:CartLine={key:'cart-1',product:bundle,qty:'2',secondaryQty:'',unit:'Set',price:'3900',serials:[],bundleRevision:2};

test('snapshot freezes chosen recipe and doubles component quantities for 2 Set',()=>{
 const snap=createBundleSaleSnapshot(cart,recipe,[bundle,pipe,socket]);
 assert.equal(snap.bundleRevision,2);
 assert.deepEqual(snap.components.map(x=>[x.productId,x.name,x.sku,x.baseQtyPerSet,x.totalBaseQty,x.unitFactorAtSale]),[
  ['pipe','PVC Pipe','pipe',65,130,20],['socket','Socket','socket',2,4,1]]);
 assert.ok(Object.isFrozen(snap));
 assert.ok(Object.isFrozen(snap.components));
 assert.ok(Object.isFrozen(snap.components[0]));
 assert.equal('unitCost' in snap.components[0],false);
 assert.equal('lotAllocations' in snap.components[0],false);
 assert.equal('serials' in snap.components[0],false);
});

test('historical invoice snapshot contents do not drift when current products are renamed',()=>{
 const snap=createBundleSaleSnapshot(cart,recipe,[bundle,pipe,socket]);
 const original:SaleLine={id:'sold-1',productId:bundle.id,name:bundle.name,quantity:'2 Set',unit:'Set',
  returnableQuantity:2,price:3900,total:7800,bundleSnapshot:snap};
 const labels=bundleContentsForReceipt(original);
 assert.deepEqual(labels.map(x=>x.name),['PVC Pipe','Socket']);
 assert.deepEqual(labels.map(x=>x.quantityLabel),['130 Feet','4 Pcs']);
 const renamed={...pipe,name:'PIPES UPDATED',sellPrice:9999};
 assert.equal(createBundleSaleSnapshot(cart,recipe,[bundle,renamed,socket]).components[0].name,'PIPES UPDATED');
 assert.equal(bundleContentsForReceipt(original)[0].name,'PVC Pipe');
 assert.equal(original.total,7800,'one parent line is the only chargeable line');
 assert.ok(labels.every(x=>!('price' in x)&&!('total' in x)));
});

test('invalid Set counts, foreign recipes, missing products and unknown costs do not fabricate history',()=>{
 assert.throws(()=>createBundleSaleSnapshot({...cart,qty:'1.5'},recipe,[bundle,pipe,socket]),/whole|Set/i);
 assert.throws(()=>createBundleSaleSnapshot(cart,{...recipe,revision:1},[bundle,pipe,socket]),/revision/i);
 assert.throws(()=>createBundleSaleSnapshot(cart,recipe,[bundle,pipe]),/missing/i);
});
