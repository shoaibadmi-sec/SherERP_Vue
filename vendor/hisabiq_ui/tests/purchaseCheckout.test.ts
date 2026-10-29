import test from 'node:test';
import assert from 'node:assert/strict';
import { calculatePurchaseCheckout, paymentRemainder } from '../src/utils/purchaseCheckout.ts';

test('purchase discounts match POS amount and percentage controls', () => {
  const gross = calculatePurchaseCheckout(2000, '250', 'amount', 'No rounding', []);
  assert.equal(gross.discountAmt, 250);
  assert.equal(gross.total, 1750);
  const percentage = calculatePurchaseCheckout(2000, '10', 'percent', 'No rounding', []);
  assert.equal(percentage.discountAmt, 200);
  assert.equal(percentage.total, 1800);
});
test('purchase discount clamps to bill and percent is capped at 100', () => {
  assert.equal(calculatePurchaseCheckout(2000, '150', 'percent', 'No rounding', []).total, 0);
  assert.equal(calculatePurchaseCheckout(2000, '3000', 'amount', 'No rounding', []).total, 0);
});
test('rounding matches POS sales rounding setting and is applied after discount', () => {
  const result = calculatePurchaseCheckout(5482.5, '100', 'amount', 'Nearest ৳5', []);
  assert.equal(result.net, 5382.5);
  assert.equal(result.total, 5385);
  assert.equal(result.rounding, 2.5);
});
test('split supplier payments and Remaining never create customer-style change', () => {
  const result = calculatePurchaseCheckout(2000, '100', 'amount', 'No rounding', [
    { id: 'one', amount: '500' }, { id: 'two', amount: '200' }
  ]);
  assert.equal(result.total, 1900);
  assert.equal(result.paidNum, 700);
  assert.equal(result.due, 1200);
  assert.equal(paymentRemainder(result.total, [{ id: 'one', amount: '500' }, { id: 'two', amount: '200' }], 'two'), 1400);
  assert.equal(result.excess, 0);
  assert.equal(calculatePurchaseCheckout(2000, '', 'amount', 'No rounding', [{ id: 'one', amount: '2500' }]).excess, 500);
});
