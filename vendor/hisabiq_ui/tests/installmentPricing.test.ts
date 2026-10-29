import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  takaInputToPaisa, getInstallmentStartPrice,
  negotiateInstallmentTotal, allocateNegotiatedInvoiceLines
} from '../src/installments/pricing.ts';

test('convert taka text to integer paisa without allowing rounding or unsafe amounts', () => {
  assert.equal(takaInputToPaisa('1,00,000.01'), 10000001);
  assert.equal(takaInputToPaisa('0.25'), 25);
  assert.equal(takaInputToPaisa('30,000'), 3000000);
  for (const s of ['-1', '1.005', '', 'NaN', 'Infinity', '1abc', '1,23', '90071992547409.92']) {
    assert.throws(() => takaInputToPaisa(s), /amount|number|taka|decimal|valid|negative|range/i, s);
  }
});

test('no duration preset uses regular price, while matching preset is only a suggestion', () => {
  assert.equal(getInstallmentStartPrice(3000000), 3000000);
  assert.equal(getInstallmentStartPrice(3000000, 3300000), 3300000);
  assert.equal(getInstallmentStartPrice(0), 0);
  assert.throws(() => getInstallmentStartPrice(-10), /price/i);
});

test('direct total or fixed/percentage negotiation reaches same price without compounding', () => {
  assert.equal(negotiateInstallmentTotal(3000000, { mode: 'direct', value: '33000' }), 3300000);
  assert.equal(negotiateInstallmentTotal(3000000, { mode: 'amount', value: '3000' }), 3300000);
  assert.equal(negotiateInstallmentTotal(3000000, { mode: 'percent', value: '10' }), 3300000);
  assert.equal(negotiateInstallmentTotal(3000000, { mode: 'amount', value: '-1000' }), 2900000);
  assert.equal(negotiateInstallmentTotal(3000000, { mode: 'percent', value: '-10' }), 2700000);
  assert.throws(() => negotiateInstallmentTotal(3000000, { mode: 'percent', value: '-150' }), /negative|price/i);
  assert.throws(() => negotiateInstallmentTotal(3000000, { mode: 'percent', value: 'NaN' }), /percent|valid/i);
});

test('one product receives exact price with no allocation UI; zero lines remain zero', () => {
  assert.deepEqual(allocateNegotiatedInvoiceLines([{ key: 'fridge', amountPaisa: 3000000 }], 3300000), [
    { key: 'fridge', amountPaisa: 3300000 }
  ]);
  assert.deepEqual(allocateNegotiatedInvoiceLines([
    { key: 'gift', amountPaisa: 0 }, { key: 'fridge', amountPaisa: 3000000 }
  ], 3300000), [
    { key: 'gift', amountPaisa: 0 }, { key: 'fridge', amountPaisa: 3300000 }
  ]);
});

test('multiple product lines allocate proportionally, deterministically and without fractional paisa', () => {
  const rows = allocateNegotiatedInvoiceLines([
    {key:'fridge',amountPaisa:3400000}, {key:'tv',amountPaisa:2300000}
  ], 5500000);
  assert.deepEqual(rows, [{key:'fridge',amountPaisa:3280702},{key:'tv',amountPaisa:2219298}]);
  assert.equal(rows.reduce((total, row) => total+row.amountPaisa,0), 5500000);
  assert.deepEqual(allocateNegotiatedInvoiceLines([
    {key:'a',amountPaisa:100},{key:'b',amountPaisa:100},{key:'c',amountPaisa:100}
  ], 101), [{key:'a',amountPaisa:34},{key:'b',amountPaisa:34},{key:'c',amountPaisa:33}]);
});

test('reject impossible allocations and duplicate keys', () => {
  assert.throws(() => allocateNegotiatedInvoiceLines([{key:'free',amountPaisa:0}], 100),/allocate|positive|eligible/i);
  assert.throws(() => allocateNegotiatedInvoiceLines([{key:'a',amountPaisa:100},{key:'a',amountPaisa:100}], 300),/duplicate/i);
  assert.throws(() => allocateNegotiatedInvoiceLines([{key:'a',amountPaisa:-1}], 100),/amount/i);
});
