import test from 'node:test';
import assert from 'node:assert/strict';
import {positiveSalesAmount, salesPaymentRemainder, salesPaymentTotal} from '../src/utils/salesPaymentAmounts.ts';

test('Sales must reject malformed complete money strings, not parse prefixes', () => {
  for (const bad of ['1..2', '100..50', '12.345', '-1', 'Infinity', '1e3', '9'.repeat(400)]) {
    assert.ok(Number.isNaN(positiveSalesAmount(bad)), bad);
    assert.ok(Number.isNaN(salesPaymentTotal([{amount:bad}])), bad);
  }
});
test('valid split amounts use integer paisa and preserve exact totals', () => {
  assert.equal(salesPaymentTotal([{amount:'1000'}, {amount:'4870.50'}]), 5870.5);
  assert.equal(salesPaymentTotal([{amount:'0.10'}, {amount:'0.20'}]), 0.3);
  assert.equal(salesPaymentTotal([{amount:''}, {amount:'15'}]), 15);
  assert.ok(Number.isNaN(salesPaymentTotal([])));
  assert.equal(positiveSalesAmount('0.01'), 0.01);
  assert.ok(Number.isNaN(positiveSalesAmount('0')));
  assert.ok(Number.isNaN(positiveSalesAmount('')));
});

test('Remaining fills only its own split and respects exact paisa', () => {
  const rows = [{id:'first',amount:'100.25'},{id:'second',amount:''},{id:'third',amount:'0.20'}];
  assert.equal(salesPaymentRemainder(200.5, rows, 'second'), 100.05);
  assert.equal(salesPaymentRemainder(200.5, rows, 'first'), 200.3);
  assert.equal(salesPaymentRemainder(100, [{id:'a', amount:''},{id:'b', amount:'200'}], 'a'), 0);
  assert.equal(salesPaymentRemainder(0.3, [{id:'a',amount:'0.10'}, {id:'b',amount:''}], 'b'), 0.2);
  assert.ok(Number.isNaN(salesPaymentRemainder(10, [{id:'a',amount:'1..2'}, {id:'b',amount:''}], 'b')));
  assert.ok(Number.isNaN(salesPaymentRemainder(10, [{id:'a',amount:''}], 'missing')));
  assert.ok(Number.isNaN(salesPaymentRemainder(-1, [{id:'a',amount:''}], 'a')));
});
