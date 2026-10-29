import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveUnitChain, productUnitFactor, productUnits, quantityToStockUnit } from '../src/utils/unitChain.ts';

test('three-level chain flattens into the smallest stock unit', () => {
  const rows = [
    {leftUnit:'Bag',rightUnit:'Box',quantity:12},
    {leftUnit:'Box',rightUnit:'Pcs',quantity:15},
    {leftUnit:'Pcs',rightUnit:'Ft',quantity:20}
  ];
  const chain = resolveUnitChain(rows);
  assert.equal(chain.stockUnit,'Ft');
  assert.deepEqual(chain.units,['Bag','Box','Pcs','Ft']);
  assert.deepEqual(chain.factors,{Ft:1,Pcs:20,Box:300,Bag:3600});
  const product = {unit:'Ft',unitRelations:rows};
  assert.equal(quantityToStockUnit(2,'Bag',product),7200);
  assert.equal(productUnitFactor(product,'Box'),300);
});

test('rejects cycles, repeated units, disconnected chains and invalid ratios', () => {
  const valid = {leftUnit:'Bag',rightUnit:'Box',quantity:12};
  for (const bad of [
    [{...valid},{leftUnit:'Box',rightUnit:'Bag',quantity:5}],
    [{...valid},{leftUnit:'Pcs',rightUnit:'Ft',quantity:20}],
    [{...valid},{leftUnit:'Box',rightUnit:'Box',quantity:5}],
    [{...valid},{leftUnit:'Box',rightUnit:'Pcs',quantity:0}],
    [{...valid},{leftUnit:'Box',rightUnit:'Pcs',quantity:Infinity}]
  ]) assert.throws(()=>resolveUnitChain(bad));
});

test('existing products continue to support one alternate unit', () => {
  const product = {unit:'Gira',altUnit:{unit:'Gauge',factor:16}};
  assert.deepEqual(productUnits(product),['Gauge','Gira']);
  assert.equal(productUnitFactor(product,'Gauge'),16);
  assert.equal(productUnitFactor(product,'Gira'),1);
});
