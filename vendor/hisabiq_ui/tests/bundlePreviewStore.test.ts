import test from 'node:test';
import assert from 'node:assert/strict';
import type { BundleDraft, Product } from '../src/types/erp.ts';
import { makeBundleComponent } from '../src/bundles/bundleValidation.ts';
import { planProductImport } from '../src/import/productImport.ts';
import {
  getProductImportPreviewSnapshot,
  getBundleVersion,
  upsertBundlePreview,
  upsertProductPreview,
  commitProductImportPreview,
  subscribeProductImportPreview,
  updateProductInventoryPreview
} from '../src/data/productImportPreviewStore.ts';

const first = getProductImportPreviewSnapshot().products.find(p => p.id === 'p2')!;
const second = getProductImportPreviewSnapshot().products.find(p => p.id === 'p5')!;
const runId = 'BUNDLE-' + Date.now().toString(36);
const bundleProduct: BundleDraft['product'] = {
  id: runId, kind: 'Bundle', name: 'Water pump set', sku: runId,
  category: 'Plumbing', unit: 'Set', stock: 0, minStock: 0,
  sellPrice: 2000, purchasePrice: 0, active: true
};
const makeDraft = (quantity = '1', price = 2000): BundleDraft => ({
  product: { ...bundleProduct, sellPrice: price },
  components: [
    makeBundleComponent(first, first.altUnit!.unit, quantity, '2', 0),
    makeBundleComponent(second, second.altUnit!.unit, '1', '4', 1)
  ]
});

test('saving a bundle publishes product and immutable revision in a single change with no inventory', () => {
  const before = getProductImportPreviewSnapshot();
  let notifications = 0;
  const stop = subscribeProductImportPreview(() => { notifications++; });
  const draft = makeDraft();
  const version = upsertBundlePreview(draft, null);
  const after = getProductImportPreviewSnapshot();
  assert.equal(version.revision, 1);
  assert.equal(version.bundleProductId, runId);
  assert.equal(after.revision, before.revision + 1);
  assert.equal(notifications, 1);
  assert.equal(after.products.find(p => p.id === runId)?.kind, 'Bundle');
  assert.equal(after.products.find(p => p.id === runId)?.stock, 0);
  assert.equal(after.lots, before.lots);
  assert.equal(after.movements, before.movements);
  assert.equal(after.bundleVersions.length, before.bundleVersions.length + 1);
  assert.deepEqual(getBundleVersion(runId), version);
  assert.deepEqual(getBundleVersion(runId, 1), version);
  assert.ok(Object.isFrozen(version));
  assert.ok(Object.isFrozen(version.components));
  assert.ok(Object.isFrozen(version.components[0]));
  (draft.components[0] as {baseQty:number}).baseQty = 9999;
  assert.equal(getBundleVersion(runId, 1)?.components[0].baseQty, 12);
  stop();
});

test('editing an unsold recipe replaces revision 1 without creating historical versions', () => {
  const v1 = getBundleVersion(runId, 1)!;
  const updated = makeDraft('2', 2200);
  const v2 = upsertBundlePreview(updated, 1);
  assert.equal(v2.revision, 1);
  assert.equal(v2.components[0].baseQty, 22);
  assert.equal(v1.components[0].baseQty, 12);
  assert.equal(v1.components[0].unitFactorAtSave, 10);
  assert.equal(getBundleVersion(runId, 1)?.components[0].baseQty, 22);
  assert.equal(getBundleVersion(runId, 2), undefined);
  assert.equal(getBundleVersion(runId)?.revision, 1);
  assert.equal(getProductImportPreviewSnapshot().products.find(p => p.id === runId)?.sellPrice, 2200);
});

test('stale edit, duplicate SKU, kind conversion, and invalid draft are all-or-nothing', () => {
  const before = getProductImportPreviewSnapshot();
  assert.throws(() => upsertBundlePreview(makeDraft('3'), 2), /revision|changed/i);
  assert.throws(() => upsertBundlePreview({
    ...makeDraft(), product: { ...bundleProduct, id: runId + '-dup', sku: ' ' + first.sku.toLowerCase() + ' ' }
  }, null), /SKU|duplicate/i);
  assert.throws(() => upsertBundlePreview({
    ...makeDraft(), product: { ...bundleProduct, id: first.id, sku: first.sku }
  }, null), /exists|stock|kind/i);
  assert.throws(() => upsertBundlePreview({
    ...makeDraft(), components: [makeBundleComponent(first, 'Pcs', '1', '', 0)]
  }, 1), /at least two/i);
  assert.equal(getProductImportPreviewSnapshot(), before);
});

test('unrelated imports and stock corrections preserve historical bundle revisions', () => {
  const before = getProductImportPreviewSnapshot();
  const normal: Product = { ...second, name: second.name + ' updated' };
  upsertProductPreview(normal);
  const newState = getProductImportPreviewSnapshot();
  assert.equal(newState.bundleVersions, before.bundleVersions);
  assert.equal(getBundleVersion(runId, 1)?.components[0].baseQty, 22);
  updateProductInventoryPreview(normal, newState.lots, newState.movements);
  assert.equal(getBundleVersion(runId, 2), undefined);
  const snap = getProductImportPreviewSnapshot();
  const sku = runId + '-IMPORTED';
  const rows = [{
    sourceSheet: 'CSV', sourceRow: 2, original: {},
    mapped: { name: 'Imported tube', sku, baseUnit: 'Pcs', sellingPrice: 100, purchasePrice: 50, openingStock: 1, openingDate: '2026-10-01' },
    issues: [], decision: 'create' as const
  }];
  const plan = planProductImport(rows, snap.products, snap.lots, {sessionId: runId+'-import', today:'2026-10-17', baseRevision:snap.revision});
  commitProductImportPreview(plan);
  assert.equal(getBundleVersion(runId, 1)?.components[0].baseQty, 22);
  assert.equal(getBundleVersion(runId, 2), undefined);
  assert.equal(getProductImportPreviewSnapshot().bundleVersions.length, snap.bundleVersions.length);
});

test('generic product upsert and inventory correction cannot overwrite bundle revisions or fake direct stock', () => {
  const before = getProductImportPreviewSnapshot();
  const saved = before.products.find(p => p.id === runId)!;
  assert.throws(() => upsertProductPreview({ ...saved, kind: 'Stock' }), /bundle/i);
  assert.throws(() => updateProductInventoryPreview({ ...saved, stock: 77 }, before.lots, before.movements), /bundle/i);
  assert.equal(getProductImportPreviewSnapshot(), before);
});
