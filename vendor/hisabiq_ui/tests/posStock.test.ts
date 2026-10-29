import test from 'node:test';
import assert from 'node:assert/strict';
import type { Product, StockLot } from '../src/types/erp.ts';
import { blendedVendorUnitCost, quantityFromBaseStock, saleAvailableStock, saleStockShortage } from '../src/utils/posStock.ts';

const product: Product = {
  id: 'p-test', name: 'Test', sku: 'TEST', category: 'Hardware', unit: 'Pcs',
  altUnit: { unit: 'Box', factor: 10 }, stock: 25, minStock: 5,
  sellPrice: 100, purchasePrice: 60, active: true
};

test('uses normal product stock for ordinary shortage checks', () => {
  assert.equal(saleAvailableStock(product, []), 25);
  assert.equal(saleStockShortage(product, [], 28), 3);
});

test('uses sellable lots for expiry-tracked stock', () => {
  const expiryProduct: Product = { ...product, expiry: { enabled: true, dateRequired: false, warningDays: 30, allocationMethod: 'FEFO' } };
  const lots: StockLot[] = [
    { id: 'good', productId: product.id, label: 'Good', receivedAt: '2026-09-01', quantity: 10, available: 10, unitCost: 50, source: 'Purchase', expiryDate: '2027-12-31' },
    { id: 'expired', productId: product.id, label: 'Expired', receivedAt: '2025-01-01', quantity: 20, available: 20, unitCost: 45, source: 'Purchase', expiryDate: '2026-01-01' }
  ];
  assert.equal(saleAvailableStock(expiryProduct, lots, new Date('2026-10-07')), 10);
  assert.equal(saleStockShortage(expiryProduct, lots, 16, new Date('2026-10-07')), 6);
});

test('converts clamped stock back into the existing compound cart fields', () => {
  assert.deepEqual(quantityFromBaseStock(25, 10, true), { qty: '2', secondaryQty: '5' });
  assert.deepEqual(quantityFromBaseStock(7, 10, false), { qty: '7', secondaryQty: '' });
});

test('blends own-stock and vendor cost', () => {
  assert.equal(blendedVendorUnitCost(10, 6, 50, 80), 62);
});
