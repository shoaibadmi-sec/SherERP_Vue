import test from 'node:test';
import assert from 'node:assert/strict';
import {
  compoundBaseQuantity,
  compoundLineTotal,
  formatCompoundQuantity,
  normalizeCompoundQuantity,
  parseCompoundQuantity
} from '../src/utils/posQuantity.ts';

test('converts compound quantity to base units', () => {
  assert.equal(compoundBaseQuantity('2', '5', 10), 25);
  assert.equal(compoundBaseQuantity('1', '12', 16), 28);
});

test('calculates line total from the selected larger-unit price', () => {
  assert.equal(compoundLineTotal('2', '5', 10, '1550'), 3875);
  assert.equal(compoundLineTotal('1', '12', 16, '180'), 315);
});

test('formats a human-readable compound quantity', () => {
  assert.equal(formatCompoundQuantity('2', 'Box', '5', 'Pcs'), '2 Box 5 Pcs');
  assert.equal(formatCompoundQuantity('1', 'Gauge', '12', 'Gira'), '1 Gauge 12 Gira');
  assert.equal(formatCompoundQuantity('3', 'Pcs', '', 'Pcs'), '3 Pcs');
});

test('normalizes an overflowing smaller-unit quantity', () => {
  assert.deepEqual(normalizeCompoundQuantity('1', '15', 10), {
    primaryQty: '2',
    secondaryQty: '5'
  });
});

test('parses compound historical sale quantities', () => {
  assert.deepEqual(parseCompoundQuantity('3 Box 6 Pcs', 'Box', 'Pcs'), {
    primaryQty: '3', secondaryQty: '6', usesAlternate: true
  });
  assert.deepEqual(parseCompoundQuantity('1 Box', 'Box', 'Pcs'), {
    primaryQty: '1', secondaryQty: '', usesAlternate: true
  });
  assert.deepEqual(parseCompoundQuantity('12', 'Box', 'Pcs'), {
    primaryQty: '12', secondaryQty: '', usesAlternate: false
  });
});
