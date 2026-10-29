import test from 'node:test';
import assert from 'node:assert/strict';
import { baseQty, baseCost, lineAmount, lotBaseSellPrice, makePurchaseLine, priceInUnit, switchPurchaseUnit } from '../src/utils/purchaseCart.ts';

const box = {
  id: 'p2', name: 'LED Bulb 12W', sku: 'LED', category: 'Electrical',
  unit: 'Pcs', altUnit: { unit: 'Box', factor: 10 }, stock: 20, minStock: 0,
  purchasePrice: 128, sellPrice: 165, active: true
};

test('purchase quantity uses large + small units, like POS', () => {
  const line = { ...makePurchaseLine(box), bigQty: '2', smallQty: '5' };
  assert.equal(baseQty(line), 25);
  assert.equal(lineAmount({ ...line, cost: '1500', costUnit: 'Box' }), 3750);
});
test('lot selling price is independently editable and converts between units', () => {
  const line = { ...makePurchaseLine(box), lotSellPrice: '185', lotSellUnit: 'Pcs' };
  assert.equal(lotBaseSellPrice(line), 185);
  assert.equal(priceInUnit(lotBaseSellPrice(line), box, 'Box'), 1850);
  assert.equal(priceInUnit(baseCost({ ...line, cost: '1500', costUnit: 'Box' }), box, 'Pcs'), 150);
});
test('new purchase lines capture an initial lot selling price without mutating product price', () => {
  const line = makePurchaseLine(box);
  assert.equal(line.lotSellUnit, 'Box');
  assert.equal(line.lotSellPrice, '1650');
  assert.equal(lotBaseSellPrice(line), 165);
  assert.equal(box.sellPrice, 165);
  assert.equal(line.detailsOpen, false);
});

test('POS-style unit switch keeps the same compound stock quantity and purchase total', () => {
  const original = { ...makePurchaseLine(box), bigQty: '2', smallQty: '5', cost: '1500' };
  const base = switchPurchaseUnit(original, 'Pcs');
  assert.equal(base.costUnit, 'Pcs');
  assert.equal(base.bigQty, '0');
  assert.equal(base.smallQty, '25');
  assert.equal(base.cost, '150');
  assert.equal(baseQty(base), 25);
  assert.equal(lineAmount(base), 3750);
  const again = switchPurchaseUnit(base, 'Box');
  assert.equal(again.costUnit, 'Box');
  assert.equal(again.bigQty, '2');
  assert.equal(again.smallQty, '5');
  assert.equal(again.cost, '1500');
  assert.equal(lineAmount(again), 3750);
});

test('single-unit product ignores unsupported unit switch', () => {
  const item = { ...box, altUnit: undefined };
  const initial = makePurchaseLine(item);
  assert.deepEqual(switchPurchaseUnit(initial, 'Box'), initial);
});

test('switching units retains independently entered lot selling price', () => {
  const initial = { ...makePurchaseLine(box), lotSellPrice: '185', lotSellUnit: 'Pcs' };
  const base = switchPurchaseUnit(initial, 'Pcs');
  assert.equal(base.lotSellPrice, '185');
  assert.equal(base.lotSellUnit, 'Pcs');
});
