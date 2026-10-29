import test from 'node:test';
import assert from 'node:assert/strict';
import type { Product, BundleDraft, BundleComponent } from '../src/types/erp.ts';
import { makeBundleComponent, validateBundleDraft } from '../src/bundles/bundleValidation.ts';

const item = (id: string, props: Partial<Product> = {}): Product => ({
  id, name: 'Product ' + id, sku: 'SKU-' + id, category: 'Hardware', unit: 'Pcs',
  stock: 100, minStock: 5, sellPrice: 100, purchasePrice: 50, active: true,
  ...props
});
const pipe = item('pipe', { altUnit: { unit: 'Box', factor: 10 } });
const wire = item('wire', { unit: 'Gira', altUnit: { unit: 'Gauge', factor: 16 } });
const pump = item('pump');
const packageProduct = item('bundle', {
  kind: 'Bundle', name: 'Water pump package', unit: 'Set', stock: 0, minStock: 0,
  purchasePrice: 0, altUnit: undefined, sellPrice: 850
});
const one = makeBundleComponent(pipe, 'Box', '2', '5', 0);
const two = makeBundleComponent(wire, 'Gauge', '1', '12', 1);
const draft = (
  components: BundleComponent[] = [one, two], product = packageProduct
): BundleDraft => ({ product: product as BundleDraft['product'], components });

test('compound package quantity is exact in the original component base unit', () => {
  assert.equal(one.baseQty, 25);
  assert.equal(one.unitFactorAtSave, 10);
  assert.equal(two.baseQty, 28);
  assert.equal(two.unitFactorAtSave, 16);
  assert.deepEqual(validateBundleDraft(draft(), [pipe, wire]), []);
});

test('a bundle requires at least two distinct active Stock components', () => {
  assert.match(validateBundleDraft(draft([one]), [pipe, wire]).join(' '), /at least two/i);
  assert.match(validateBundleDraft(draft([one, { ...one, sortOrder: 1 }]), [pipe, wire]).join(' '), /duplicate/i);
  assert.match(validateBundleDraft(draft(), [pipe, { ...wire, active: false }]).join(' '), /inactive/i);
  assert.match(validateBundleDraft(draft(), [pipe]).join(' '), /not found/i);
  assert.match(
    validateBundleDraft(draft([one, makeBundleComponent(item('svc', { kind: 'Service' }), 'Pcs', '1', '', 1)]),
      [pipe, item('svc', { kind: 'Service' })]).join(' '), /stock product/i
  );
  assert.match(
    validateBundleDraft(draft([one, makeBundleComponent(packageProduct, 'Set', '1', '', 1)]),
      [pipe, packageProduct]).join(' '), /stock product/i
  );
});

test('strict quantities reject invalid notation, decimals beyond precision, and wrong units', () => {
  for (const raw of ['', '0', '-1', 'NaN', 'Infinity', '1e3', '1.00001', '1,000']) {
    assert.throws(() => makeBundleComponent(pump, 'Pcs', raw, '', 0), undefined, raw);
  }
  assert.throws(() => makeBundleComponent(pipe, 'Crate', '1', '', 0), /unit/i);
  assert.throws(() => makeBundleComponent(pipe, 'Box', '2', '12', 0), /secondary/i);
  assert.throws(() => makeBundleComponent(pump, 'Pcs', '1', '2', 0), /secondary/i);
  assert.equal(makeBundleComponent(pump, 'Pcs', '0.125', '', 0).baseQty, 0.125);
  assert.equal(makeBundleComponent(pipe, 'Box', '0', '5', 0).baseQty, 5);
});

test('serial-required component uses whole base-unit counts and rejects corrupted saved quantity', () => {
  const serial = item('serial', { serialTracking: 'Required' });
  assert.throws(() => makeBundleComponent(serial, 'Pcs', '1.5', '', 1), /whole/i);
  const valid = makeBundleComponent(serial, 'Pcs', '2', '', 1);
  assert.deepEqual(validateBundleDraft(draft([one, valid]), [pipe, serial]), []);
  assert.match(validateBundleDraft(draft([one, { ...valid, baseQty: 222 }]), [pipe, serial]).join(' '), /does not match/i);
});

test('changing an alternate-unit factor requires fresh recipe validation, never silently changes old quantity', () => {
  assert.equal(one.unitFactorAtSave, 10);
  assert.equal(one.baseQty, 25);
  assert.match(validateBundleDraft(draft(), [{ ...pipe, altUnit: { unit: 'Box', factor: 12 } }, wire]).join(' '), /conversion changed/i);
});

test('bundle parent keeps an independent price with no physical stock or alternate unit', () => {
  assert.deepEqual(validateBundleDraft(draft(), [pipe, wire]), []);
  assert.match(validateBundleDraft(draft(undefined, { ...packageProduct, stock: 3 }), [pipe, wire]).join(' '), /no direct stock/i);
  assert.match(validateBundleDraft(draft(undefined, { ...packageProduct, sellPrice: 0 }), [pipe, wire]).join(' '), /selling price/i);
  assert.match(validateBundleDraft(draft(undefined, { ...packageProduct, unit: 'Pcs' }), [pipe, wire]).join(' '), /Set unit/i);
});
