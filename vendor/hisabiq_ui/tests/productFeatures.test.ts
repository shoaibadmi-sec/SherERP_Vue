import test from 'node:test';
import assert from 'node:assert/strict';
import type { Product, ProductOffer, StockLot } from '../src/types/erp.ts';
import {
  allocatableLots,
  availableSerials,
  duplicateSerials,
  effectiveOfferPrice,
  normalizeSerials,
  offerStatus,
  productStockBreakdown,
  requiredSerialCount,
  validateOffer,
  warrantySnapshot
} from '../src/utils/productFeatures.ts';

const stockProduct: Product = {
  id: 'p',
  name: 'LED Bulb',
  sku: 'LED-1',
  category: 'Electrical',
  unit: 'Pcs',
  stock: 4,
  minStock: 1,
  sellPrice: 100,
  purchasePrice: 70,
  serialTracking: 'Required',
  expiry: { enabled: true, dateRequired: true, warningDays: 30, allocationMethod: 'FEFO' },
  warranty: { enabled: true, duration: 1, durationUnit: 'Years', type: 'Manufacturer', terms: 'Carry invoice.' },
  active: true
};

test('normalizes pasted serials and finds duplicates case-insensitively', () => {
  assert.deepEqual(normalizeSerials('A1, A2\nA3;A4'), ['A1', 'A2', 'A3', 'A4']);
  assert.deepEqual(duplicateSerials(['A1', 'a1', 'B2'], ['b2']), ['a1', 'B2']);
});

test('required serial tracking uses base-unit item count only', () => {
  assert.equal(requiredSerialCount(stockProduct, 4), 4);
  assert.equal(requiredSerialCount({ ...stockProduct, serialTracking: 'Optional' }, 4), 0);
  assert.equal(requiredSerialCount({ ...stockProduct, kind: 'Service' }, 4), 0);
});

test('creates immutable warranty snapshot fields', () => {
  assert.deepEqual(warrantySnapshot(stockProduct), {
    duration: 1,
    durationUnit: 'Years',
    type: 'Manufacturer',
    terms: 'Carry invoice.'
  });
});

test('validates offer overlap and effective price', () => {
  const active: ProductOffer = {
    id: 'o1', productId: 'p', discountType: 'Percentage', value: 10, priceUnit: 'Pcs',
    startAt: '2026-10-01T00:00', endAt: '2026-10-31T23:59', enabled: true
  };
  const overlap: ProductOffer = { ...active, id: 'o2', startAt: '2026-10-15T00:00', endAt: '2026-11-01T00:00' };
  assert.match(validateOffer(stockProduct, overlap, [active]) ?? '', /overlaps/);
  assert.equal(effectiveOfferPrice(stockProduct, active), 90);
  assert.equal(offerStatus(active, new Date('2026-10-07T12:00:00')), 'Active');
});

test('expiry breakdown excludes expired stock and FEFO sorts earliest expiry first', () => {
  const lots: StockLot[] = [
    { id: 'l1', productId: 'p', label: 'Later', receivedAt: '2026-09-01', quantity: 2, available: 2, unitCost: 70, source: 'Purchase', expiryDate: '2026-12-01', serials: ['S3', 'S4'] },
    { id: 'l2', productId: 'p', label: 'Soon', receivedAt: '2026-09-02', quantity: 1, available: 1, unitCost: 70, source: 'Purchase', expiryDate: '2026-10-20', serials: ['S2'] },
    { id: 'l3', productId: 'p', label: 'Expired', receivedAt: '2026-08-01', quantity: 1, available: 1, unitCost: 70, source: 'Purchase', expiryDate: '2026-09-30', serials: ['S1'] }
  ];
  assert.deepEqual(productStockBreakdown(stockProduct, lots, new Date('2026-10-07T12:00:00')), {
    onHand: 4, sellable: 3, expiringSoon: 1, expired: 1
  });
  assert.deepEqual(allocatableLots(stockProduct, lots, new Date('2026-10-07T12:00:00')).map((lot) => lot.id), ['l2', 'l1']);
  assert.deepEqual(availableSerials(stockProduct, lots, new Date('2026-10-07T12:00:00')), ['S2', 'S3', 'S4']);
});


test('offers may be free but may not make the selected price unit negative', () => {
  const free: ProductOffer = {
    id: 'free',
    productId: 'p',
    discountType: 'Percentage',
    value: 100,
    priceUnit: 'Pcs',
    startAt: '2026-11-01T00:00',
    endAt: '2026-11-02T00:00',
    enabled: true
  };
  const negative: ProductOffer = {
    ...free,
    id: 'negative',
    discountType: 'Fixed',
    value: 101
  };
  assert.equal(validateOffer(stockProduct, free, []), null);
  assert.match(validateOffer(stockProduct, negative, []) ?? '', /negative/);
});
