import type { Product } from '../types/erp';
import { productUnits, productUnitFactor, resolveUnitChain } from './unitChain.ts';

/** "34 Box 2 Pcs" for multi-unit products, "86 Pcs" otherwise */
export function formatStock(product: Product): string {
  const { stock, unit, altUnit } = product;
  const sign = stock < 0 ? '-' : '';
  const absolute = Math.abs(stock);
  if (product.unitRelations?.length) {
    const {units, factors} = resolveUnitChain(product.unitRelations);
    const preferred = units.indexOf(product.stockViewUnit ?? units[0]);
    const startingIndex = preferred >= 0 ? preferred : 0;
    let remainder = absolute;
    const parts: string[] = [];
    for (const name of units.slice(startingIndex)) {
      const factor = factors[name];
      const amount = factor === 1 ? Number(remainder.toPrecision(12)) :
        Math.floor((remainder + 1e-9) / factor);
      if (amount > 0 || (!parts.length && factor === 1))
        parts.push(amount.toLocaleString('en-IN') + ' ' + name);
      remainder = Number((remainder - amount * factor).toPrecision(12));
    }
    return sign + (parts.join(' ') || '0 ' + unit);
  }
  if (!altUnit || product.stockViewUnit === unit) return `${sign}${absolute.toLocaleString('en-IN')} ${unit}`;
  const big = Math.floor(absolute / altUnit.factor);
  const rest = absolute % altUnit.factor;
  if (big === 0) return `${sign}${rest} ${unit}`;
  return rest === 0
    ? `${sign}${big} ${altUnit.unit}`
    : `${sign}${big} ${altUnit.unit} ${rest} ${unit}`;
}

export function unitsFor(product: Product): string[] {
  const viewOrder = productUnits(product);
  return product.unitRelations?.length ? viewOrder : product.altUnit ? [product.unit, product.altUnit.unit] : [product.unit];
}

export function priceFor(product: Product, unit: string): number {
  if (product.unitSellPrices?.[unit] !== undefined) return product.unitSellPrices[unit];
  if (product.altUnit && unit === product.altUnit.unit && product.altUnit.price !== undefined)
    return product.altUnit.price;
  return product.sellPrice * productUnitFactor(product, unit);
}

export type StockStatus = 'in' | 'low' | 'out' | 'inactive' | 'service';

export function stockStatus(product: Product): StockStatus {
  if (!product.active) return 'inactive';
  if (product.kind === 'Service') return 'service';
  if (product.stock <= 0) return 'out';
  if (product.stock <= product.minStock) return 'low';
  return 'in';
}