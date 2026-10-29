import test from 'node:test';
import assert from 'node:assert/strict';
import type {Product,StockLot} from '../src/types/erp.ts';
import {makeBundleComponent} from '../src/bundles/bundleValidation.ts';
import {priceBundleComponents} from '../src/bundles/bundlePricing.ts';
const item=(id:string,stock:number,buy:number,sell:number,altUnit?:Product['altUnit']):Product=>({
 id,kind:'Stock',name:id,sku:id,category:'Hardware',unit:'Pcs',
 stock,minStock:0, purchasePrice:buy,sellPrice:sell,active:true,altUnit
});
const pipe=item('pipe',50,10,20,{unit:'Box',factor:10,price:170});
const socket=item('socket',100,5,8);
const lots:StockLot[]=[
 {id:'pipe-old',productId:'pipe',label:'Old',source:'Opening',receivedAt:'2026-09-01',available:12,quantity:12,unitCost:7},
 {id:'pipe-new',productId:'pipe',label:'New',source:'Purchase',receivedAt:'2026-10-01',available:20,quantity:20,unitCost:12},
 {id:'socket',productId:'socket',label:'One',source:'Opening',receivedAt:'2026-09-01',available:50,quantity:50,unitCost:5}
];
test('bundle pricing shows current lot purchase cost, POS retail sum, package profit, and margins',()=>{
 const components=[makeBundleComponent(pipe,'Box','2','5',0),makeBundleComponent(socket,'Pcs','4','',1)];
 const result=priceBundleComponents(components,[pipe,socket],lots,490);
 assert.equal(result.lines[0].baseQty,25);
 assert.equal(result.lines[0].retailUnitPrice,170);
 assert.equal(result.lines[0].retailTotal,425,'POS alternate unit price includes secondary base units');
 assert.equal(result.lines[0].purchaseTotal,12*7+13*12);
 assert.equal(result.lines[1].retailTotal,32);
 assert.equal(result.componentPurchaseCost,12*7+13*12+20);
 assert.equal(result.componentsRetailTotal,457);
 assert.equal(result.packagePrice,490);
 assert.equal(result.estimatedProfit,490-result.componentPurchaseCost);
 assert.equal(result.estimatedMarginPercent,((490-result.componentPurchaseCost)/490)*100);
 assert.equal(result.costFromAvailableLots,true);
 assert.deepEqual(result.issues,[]);
});
test('negative package profit shows a loss and missing lots remain an estimate not recorded actual cost',()=>{
 const result=priceBundleComponents([
  makeBundleComponent(pipe,'Pcs','60','',0),makeBundleComponent(socket,'Pcs','2','',1)
 ],[pipe,socket],lots,50);
 assert.equal(result.lines[0].purchaseTotal,12*7+20*12+28*10,'stock shortage falls back to product baseline cost');
 assert.equal(result.costFromAvailableLots,false);
 assert.equal(result.estimatedProfit<0,true);
 assert.ok(result.issues.some(x=>/not enough|shortage/i.test(x)));
});
test('zero and invalid preview package price are explicitly invalid, not a fake profit',()=>{
 const c=[makeBundleComponent(pipe,'Pcs','1','',0),makeBundleComponent(socket,'Pcs','1','',1)];
 const missing=priceBundleComponents(c,[pipe,socket],lots,NaN);
 assert.equal(missing.estimatedProfit,null);
 assert.equal(missing.estimatedMarginPercent,null);
 assert.ok(missing.issues.some(x=>/price/i.test(x)));
});
test('missing components are blocking and do not disappear from calculated totals',()=>{
 const c=[makeBundleComponent(pipe,'Pcs','1','',0),makeBundleComponent(socket,'Pcs','1','',1)];
 const result=priceBundleComponents(c,[pipe],lots,100);
 assert.equal(result.estimatedProfit,null);
 assert.ok(result.issues.some(x=>/missing/i.test(x)));
});
