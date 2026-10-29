import test from 'node:test';
import assert from 'node:assert/strict';
import type {Product} from '../src/types/erp.ts';
import {productUnitFactor} from '../src/utils/unitChain.ts';
import {unitsFor,priceFor,formatStock} from '../src/utils/units.ts';
import {effectivePriceForUnit} from '../src/utils/productFeatures.ts';
import {compoundBaseQuantity,compoundLineTotal} from '../src/utils/posQuantity.ts';
import {makePurchaseLine,baseQty,baseCost,lineAmount,switchPurchaseUnit} from '../src/utils/purchaseCart.ts';

const product:Product={
 id:'multi-test',name:'Multi units',sku:'MU-01',kind:'Stock',category:'Hardware',
 unit:'Pcs',stock:450,minStock:0,active:true,stockViewUnit:'Bag',
 sellPrice:10,purchasePrice:8,
 altUnit:{unit:'Bag',factor:180},
 unitRelations:[
  {leftUnit:'Bag',rightUnit:'Box',quantity:12},
  {leftUnit:'Box',rightUnit:'Pcs',quantity:15}
 ]
};

test('POS selected intermediary units calculate quantities and selling prices',()=>{
 assert.deepEqual(unitsFor(product),['Bag','Box','Pcs']);
 assert.equal(productUnitFactor(product,'Box'),15);
 assert.equal(priceFor(product,'Box'),150);
 assert.equal(priceFor(product,'Bag'),1800);
 assert.equal(effectivePriceForUnit(product,undefined,'Box'),150);
 assert.equal(compoundBaseQuantity(2,5,productUnitFactor(product,'Box')),35);
 assert.equal(compoundLineTotal(2,5,productUnitFactor(product,'Box'),150),350);
 assert.equal(formatStock(product),'2 Bag 6 Box');
});

test('purchase switching to an intermediary unit preserves lot quantity and base cost',()=>{
 const original=makePurchaseLine(product);
 assert.equal(original.costUnit,'Bag');
 assert.equal(baseQty(original),180);
 assert.equal(lineAmount(original),1440);
 const next=switchPurchaseUnit(original,'Box');
 assert.equal(next.costUnit,'Box');
 assert.equal(next.bigQty,'12');
 assert.equal(next.smallQty,'0');
 assert.equal(baseQty(next),180);
 assert.equal(baseCost(next),8);
 assert.equal(lineAmount(next),1440);
 const single=switchPurchaseUnit(next,'Pcs');
 assert.equal(single.smallQty,'180');
 assert.equal(baseQty(single),180);
 assert.equal(lineAmount(single),1440);
});

test('legacy one-large-unit product keeps its configured selling-price override',()=>{
 const legacy:Product={...product,unitRelations:undefined,unit:'Pcs',
   altUnit:{unit:'Box',factor:10,price:125},stockViewUnit:'Box'};
 assert.deepEqual(unitsFor(legacy),['Pcs','Box']);
 assert.equal(priceFor(legacy,'Box'),125);
 assert.equal(effectivePriceForUnit(legacy,undefined,'Box'),125);
});

test('a fixed-price offer in an intermediary unit is converted correctly',()=>{
 const offer={id:'x',productId:product.id,discountType:'Fixed' as const,value:15,
 priceUnit:'Box',startAt:'2020-01-01T00:00:00Z',endAt:'2040-01-01T00:00:00Z',enabled:true};
 assert.equal(effectivePriceForUnit(product,offer,'Box'),135);
 assert.equal(effectivePriceForUnit(product,offer,'Pcs'),9);
 assert.equal(effectivePriceForUnit(product,offer,'Bag'),1620);
});
