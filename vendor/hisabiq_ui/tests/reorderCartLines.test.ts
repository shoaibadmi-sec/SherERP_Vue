import test from 'node:test';
import assert from 'node:assert/strict';
import { reorderCartLines, moveCartLine } from '../src/utils/reorderCartLines.ts';

const initial = [
  { key: 'pipe', qty: '4', serials: ['P100'], price: '420' },
  { key: 'bulb', qty: '2', serials: ['B200'], price: '1395' },
  { key: 'mesh', qty: '1', serials: ['M300'], price: '180' }
];
test('POS reorder changes actual cart array in invoice/print order', () => {
  const next = reorderCartLines(initial, ['mesh', 'pipe', 'bulb']);
  assert.deepEqual(next.map((item) => item.key), ['mesh', 'pipe', 'bulb']);
  assert.equal(next[0], initial[2], 'full line metadata preserved by identity');
  assert.deepEqual(next[0].serials, ['M300']);
  assert.equal(next.reduce((sum, line) => sum + Number(line.qty) * Number(line.price), 0),
    initial.reduce((sum, line) => sum + Number(line.qty) * Number(line.price), 0));
  assert.deepEqual(initial.map((item) => item.key), ['pipe', 'bulb', 'mesh'], 'original cart not mutated');
});
test('keyboard arrows move only the selected cart item', () => {
  assert.deepEqual(moveCartLine(initial, 'mesh', -1).map((item) => item.key), ['pipe', 'mesh', 'bulb']);
  assert.deepEqual(moveCartLine(initial, 'bulb', -1).map((item) => item.key), ['bulb', 'pipe', 'mesh']);
  assert.deepEqual(moveCartLine(initial, 'pipe', 1).map((item) => item.key), ['bulb', 'pipe', 'mesh']);
  assert.equal(moveCartLine(initial, 'pipe', -1), initial, 'invalid boundary movement is a no-op');
  assert.equal(moveCartLine(initial, 'unknown', 1), initial);
});
test('invalid drag order cannot silently discard or duplicate invoice rows', () => {
  for (const order of [['pipe', 'bulb'], ['pipe', 'pipe', 'mesh'], ['pipe', 'bulb', 'other']]) {
    assert.equal(reorderCartLines(initial, order), initial);
  }
  assert.equal(reorderCartLines(initial, ['pipe', 'bulb', 'mesh']), initial);
});
