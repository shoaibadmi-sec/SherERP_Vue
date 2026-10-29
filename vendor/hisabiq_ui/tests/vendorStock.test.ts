import test from 'node:test';
import assert from 'node:assert/strict';
import type {Product,StockLot} from '../src/types/erp.ts';
import {compoundBaseQuantity} from '../src/utils/posQuantity.ts';
import {allocatePosStock} from '../src/vendor/vendorStock.ts';

const p:Product={id:'p1',name:'Pipe',sku:'P-1',category:'Hardware',unit:'Pcs',
 altUnit:{unit:'Box',factor:12},stock:5,minStock:0,sellPrice:100,purchasePrice:60,active:true};
const request=(key:string,requestedBaseQty:number,choice?:'Own'|{mode:'Negative'}|{mode:'Vendor';vendorId:string;vendorName:string;unitCost:number|null})=>({
 key,product:p,requestedBaseQty,choice});
const vendor={mode:'Vendor' as const,vendorId:'v1',vendorName:'Nearest shop',unitCost:null};
test('own, negative and Vendor modes have distinct cart-wide quantities',()=>{
 const own=allocatePosStock([request('a',8,'Own')],[]);
 assert.deepEqual([own[0].ownBaseQty,own[0].vendorBaseQty,own[0].negativeBaseQty,own[0].effectiveBaseQty],[5,0,0,5]);
 const neg=allocatePosStock([request('a',8,{mode:'Negative'})],[]);
 assert.deepEqual([neg[0].ownBaseQty,neg[0].vendorBaseQty,neg[0].negativeBaseQty,neg[0].effectiveBaseQty],[5,0,3,8]);
 const ven=allocatePosStock([request('a',8,vendor)],[]);
 assert.deepEqual([ven[0].ownBaseQty,ven[0].vendorBaseQty,ven[0].negativeBaseQty,ven[0].effectiveBaseQty],[5,3,0,8]);
 assert.equal(ven[0].needsSourceBaseQty,0);
});
test('two lines of same product reserve own stock only once',()=>{
 const lines=allocatePosStock([request('a',4),request('b',4,vendor)],[]);
 assert.deepEqual(lines.map(x=>x.ownBaseQty),[4,1]);
 assert.deepEqual(lines.map(x=>x.needsSourceBaseQty),[0,0]);
 assert.equal(lines[1].vendorBaseQty,3);
});
test('unresolved shortage remains unresolved not silently clamped',()=>{
 const [a]=allocatePosStock([request('a',8)],[]);
 assert.equal(a.ownBaseQty,5);
 assert.equal(a.needsSourceBaseQty,3);
 assert.equal(a.effectiveBaseQty,5);
});
test('net stock 1 beats positive-lot sum 3 when OVERSOLD lot -2 remains',()=>{
 const np={...p,stock:1};
 const lots:StockLot[]=[
  {id:'positive',productId:p.id,label:'Own',receivedAt:'2026-09-01',
  quantity:3,available:3,unitCost:60,source:'Purchase'},
  {id:'oversold',productId:p.id,label:'OVERSOLD',receivedAt:'2026-09-01',
  quantity:-2,available:-2,unitCost:60,source:'Adjustment'}];
 const [a]=allocatePosStock([{key:'a',product:np,requestedBaseQty:3,choice:vendor}],lots);
 assert.equal(a.ownBaseQty,1);
 assert.equal(a.vendorBaseQty,2);
});
test('compound units reach exact base units, service never needs sourcing',()=>{
 const base=compoundBaseQuantity('1','5',12);
 assert.equal(base,17);
 const [x]=allocatePosStock([{key:'compound',product:{...p,stock:12},requestedBaseQty:base,choice:vendor}],[]);
 assert.deepEqual([x.ownBaseQty,x.vendorBaseQty],[12,5]);
 const [service]=allocatePosStock([{key:'service',product:{...p,kind:'Service',stock:0},requestedBaseQty:20}],[]);
 assert.equal(service.ownBaseQty,20);
 assert.equal(service.needsSourceBaseQty,0);
});
test('no negative/NaN quantities and no expired lot own stock',()=>{
 assert.throws(()=>allocatePosStock([request('a',-1)],[]),/quantity/i);
 assert.throws(()=>allocatePosStock([request('a',Number.NaN)],[]),/quantity/i);
 const expiry:Product={...p,stock:20,expiry:{enabled:true,dateRequired:false,warningDays:30,allocationMethod:'FEFO'}};
 const lots:StockLot[]=[{id:'old',productId:p.id,label:'Old',receivedAt:'2026-09-01',
  quantity:20,available:20,unitCost:50,source:'Purchase',expiryDate:'2026-09-15'}];
 const [x]=allocatePosStock([{key:'exp',product:expiry,requestedBaseQty:8,choice:vendor}],lots,new Date('2026-10-10'));
 assert.equal(x.ownBaseQty,0);
 assert.equal(x.vendorBaseQty,8);
});
