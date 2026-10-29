import type { BundleComponent, BundleDraft, Product } from '../types/erp.ts';
import {productUnitFactor} from '../utils/unitChain.ts';

/** Integer-scaled stock quantities prevent accumulated float errors at 4dp precision. */
const SCALE = 10000n;
const MAX_SCALED = BigInt(Number.MAX_SAFE_INTEGER);

function decimalToScaled(raw: string, field: string): bigint {
  const value = raw.trim();
  if (!/^(?:\d+)(?:\.\d{1,4})?$/.test(value)) {
    throw new Error(field + ': enter a valid nonnegative quantity (up to 4 decimal places).');
  }
  const [whole, decimal = ''] = value.split('.');
  const scaled = BigInt(whole) * SCALE + BigInt(decimal.padEnd(4, '0'));
  if (scaled > MAX_SCALED) throw new Error(field + ': quantity is too large.');
  return scaled;
}

function calculateQuantity(
  product: Product, selectedUnit: string, primaryQty: string, secondaryQty: string
): { quantityScaled: bigint; factor: number } {
  const factor = productUnitFactor(product, selectedUnit);
  const isBase = factor === 1;
  const isAlternate = factor > 1;
  if (!isBase && !isAlternate) throw new Error("Unit '" + selectedUnit + "' is not valid for " + product.name + '.');
  const primary = decimalToScaled(primaryQty, 'Primary quantity');
  const secondary = secondaryQty.trim() ? decimalToScaled(secondaryQty, 'Secondary quantity') : 0n;
  if (isBase && secondary > 0n) throw new Error('Secondary quantity is only allowed with a larger unit.');

  let base = primary;
  if (isAlternate) {
    if (!Number.isFinite(factor) || factor <= 1) throw new Error('Invalid unit conversion factor.');
    const scaledFactor = decimalToScaled(String(factor), 'Unit conversion factor');
    if (secondary >= scaledFactor) throw new Error('Secondary quantity must be smaller than one large unit.');
    const converted = primary * scaledFactor;
    if (converted % SCALE !== 0n) throw new Error('Converted quantity exceeds supported 4-decimal precision.');
    base = converted / SCALE + secondary;
  }
  if (base <= 0n) throw new Error('Component quantity must be greater than zero.');
  if (base > MAX_SCALED) throw new Error('Component quantity is too large.');
  if (product.serialTracking === 'Required' && base % SCALE !== 0n) {
    throw new Error('Serial-tracked stock requires a whole base-unit quantity.');
  }
  return { quantityScaled: base, factor };
}

export function makeBundleComponent(
  product: Product, selectedUnit: string, primaryQty: string, secondaryQty: string, sortOrder: number
): BundleComponent {
  const result = calculateQuantity(product, selectedUnit, primaryQty, secondaryQty);
  if (!Number.isInteger(sortOrder) || sortOrder < 0) throw new Error('Invalid component order.');
  return {
    productId: product.id,
    primaryQty: primaryQty.trim(),
    secondaryQty: secondaryQty.trim(),
    selectedUnit,
    baseQty: Number(result.quantityScaled) / Number(SCALE),
    unitFactorAtSave: result.factor,
    sortOrder
  };
}

export function validateBundleDraft(draft: BundleDraft, catalog: readonly Product[]): string[] {
  const errors: string[] = [];
  const product = draft.product;
  if (product.kind !== 'Bundle') errors.push('Product type must be Bundle.');
  if (product.unit !== 'Set') errors.push('Bundle must have Set unit.');
  if (!product.name.trim()) errors.push('Bundle name is required.');
  if (!product.sku.trim()) errors.push('Bundle SKU is required.');
  if (!Number.isFinite(product.sellPrice) || product.sellPrice <= 0) errors.push('Enter a valid selling price.');
  if (product.stock !== 0 || product.minStock !== 0 || product.purchasePrice !== 0 || product.altUnit) {
    errors.push('A virtual bundle has no direct stock, minimum stock, purchase cost or alternate unit.');
  }
  if (draft.components.length < 2) errors.push('Add at least two distinct stock products to the bundle.');
  const seen = new Set<string>();
  for (const component of draft.components) {
    if (seen.has(component.productId)) errors.push('Duplicate component: ' + component.productId + '.');
    seen.add(component.productId);
    const found = catalog.find(item => item.id === component.productId);
    if (!found) {
      errors.push('Component ' + component.productId + ' not found.');
      continue;
    }
    if (found.kind === 'Service' || found.kind === 'Bundle') errors.push(found.name + ' must be a stock product.');
    if (!found.active) errors.push(found.name + ' is inactive.');
    if (!Number.isInteger(component.sortOrder) || component.sortOrder < 0) errors.push(found.name + ' has an invalid display order.');
    try {
      const normalized = makeBundleComponent(found, component.selectedUnit, component.primaryQty, component.secondaryQty, component.sortOrder);
      if (normalized.unitFactorAtSave !== component.unitFactorAtSave) {
        errors.push(found.name + ' unit conversion changed; review this bundle component.');
      }
      if (!Number.isFinite(component.baseQty) || Math.abs(normalized.baseQty - component.baseQty) > 0.00000001) {
        errors.push(found.name + ' saved base quantity does not match its entered quantity.');
      }
    } catch (error) {
      errors.push(found.name + ': ' + (error instanceof Error ? error.message : 'Invalid quantity.'));
    }
  }
  return errors;
}
