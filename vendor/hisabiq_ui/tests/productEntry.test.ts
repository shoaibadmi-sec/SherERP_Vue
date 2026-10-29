import test from 'node:test';
import assert from 'node:assert/strict';
import { toBasePrice, toBaseQuantity, switchQuantityUnit } from '../src/utils/productEntry.ts';

test('converts a selling price entered in the larger unit to the base unit price', () => {
  assert.equal(toBasePrice('1550', 'Box', 'Pcs', 'Box', 10), 155);
  assert.equal(toBasePrice('180', 'Gauge', 'Gira', 'Gauge', 16), 11.25);
  assert.equal(toBasePrice('165', 'Pcs', 'Pcs', 'Box', 10), 165);
});

test('converts opening and minimum stock entered in a larger unit to base quantity', () => {
  assert.equal(toBaseQuantity('2', 'Box', 'Pcs', 'Box', 10), 20);
  assert.equal(toBaseQuantity('1.5', 'Box', 'Pcs', 'Box', 10), 15);
  assert.equal(toBaseQuantity('7', 'Pcs', 'Pcs', 'Box', 10), 7);
});

test('opening stock joined unit switch preserves the base inventory quantity', () => {
  const base = switchQuantityUnit('2', 'Gauge', 'Gira', 'Gira', 'Gauge', 16);
  assert.equal(base, '32');
  assert.equal(switchQuantityUnit(base, 'Gira', 'Gauge', 'Gira', 'Gauge', 16), '2');
  assert.equal(toBaseQuantity(base, 'Gira', 'Gira', 'Gauge', 16), 32);
});
test('minimum stock quantity switch handles fractional large units without changing thresholds', () => {
  const base = switchQuantityUnit('0.5', 'Box', 'Pcs', 'Pcs', 'Box', 10);
  assert.equal(base, '5');
  assert.equal(switchQuantityUnit(base, 'Pcs', 'Box', 'Pcs', 'Box', 10), '0.5');
});
test('empty stock fields remain empty when switching display units', () => {
  assert.equal(switchQuantityUnit('', 'Gauge', 'Gira', 'Gira', 'Gauge', 16), '');
  assert.equal(switchQuantityUnit('8', 'Gira', 'Gira', 'Gira', 'Gauge', 16), '8');
});
