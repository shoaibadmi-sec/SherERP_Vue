import type { Product, UnitRelation } from '../types/erp';

/** Natural largest-to-smallest relations. Only the smallest unit holds stock. */
export function resolveUnitChain(relations: readonly UnitRelation[]) {
  if (!relations.length) throw new Error('Add at least one unit relationship.');
  const used = new Set<string>();
  const units: string[] = [];
  for (let i = 0; i < relations.length; i++) {
    const row = relations[i];
    const left = row.leftUnit.trim();
    const right = row.rightUnit.trim();
    const ratio = Number(row.quantity);
    if (!left || !right) throw new Error('Choose both units in every row.');
    if (!Number.isFinite(ratio) || ratio <= 1) throw new Error('Each larger unit must contain more than one smaller unit.');
    if (left.toLowerCase() === right.toLowerCase()) throw new Error('A unit cannot convert to itself.');
    if (i > 0 && left.toLowerCase() !== relations[i - 1].rightUnit.trim().toLowerCase())
      throw new Error('Unit rows must connect from largest to smallest.');
    if (i === 0) { units.push(left); used.add(left.toLowerCase()); }
    if (used.has(right.toLowerCase())) throw new Error('Units cannot repeat or form a circle.');
    used.add(right.toLowerCase());
    units.push(right);
  }
  const factors: Record<string, number> = {};
  factors[units[units.length - 1]] = 1;
  for (let i = relations.length - 1; i >= 0; i--) {
    const row = relations[i];
    const factor = row.quantity * factors[row.rightUnit.trim()];
    if (!Number.isFinite(factor) || factor <= 0) throw new Error('The unit conversion is too large.');
    factors[row.leftUnit] = factor;
  }
  return { units, stockUnit: units[units.length - 1], factors };
}

export function productUnits(product: Pick<Product, 'unit' | 'altUnit' | 'unitRelations'>): string[] {
  return product.unitRelations?.length
    ? resolveUnitChain(product.unitRelations).units
    : product.altUnit ? [product.altUnit.unit, product.unit] : [product.unit];
}

export function productUnitFactor(product: Pick<Product, 'unit' | 'altUnit' | 'unitRelations'>, selectedUnit: string): number {
  if (selectedUnit === product.unit) return 1;
  if (product.unitRelations?.length) return resolveUnitChain(product.unitRelations).factors[selectedUnit] ?? 0;
  return product.altUnit?.unit === selectedUnit ? product.altUnit.factor : 0;
}

export function quantityToStockUnit(quantity: number, unit: string, product: Pick<Product,'unit'|'altUnit'|'unitRelations'>): number {
  const factor = productUnitFactor(product, unit);
  if (!Number.isFinite(quantity) || !Number.isFinite(factor) || factor <= 0) throw new Error('Unknown unit or invalid quantity.');
  return quantity * factor;
}
