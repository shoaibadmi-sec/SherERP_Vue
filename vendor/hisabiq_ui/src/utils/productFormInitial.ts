import type { Product } from '../types/erp.ts';
import type { ProductDraft } from '../types/productForm.ts';
import type { ProductSettings } from '../settings/model.ts';

const blankDraft: ProductDraft = {
  kind: 'Stock',
  name: '',
  nameBn: '',
  brand: 'Generic / No brand',
  category: 'Hardware',
  unit: 'Pcs',
  buy: '',
  buyUnit: 'Pcs',
  sell: '',
  sellUnit: 'Pcs',
  openingQty: '',
  openingUnit: 'Pcs',
  minQty: '',
  minUnit: 'Pcs',
  multiUnit: false,
  unitLevels: [],
  stockViewUnit: 'Pcs',
  warrantyEnabled: false,
  warrantyDuration: '12',
  warrantyDurationUnit: 'Months',
  warrantyType: 'Seller',
  warrantyTerms: '',
  serialTracking: 'Off',
  openingSerialText: '',
  expiryEnabled: false,
  expiryDateRequired: false,
  expiryWarningDays: '30',
  allocationMethod: 'FIFO',
  batchNumber: '',
  manufactureDate: '',
  expiryDate: '',
  barcode: '',
  photos: []
};


export function initialProductDraft(defaults: ProductSettings, product?: Product | null): ProductDraft {
  if (!product) return {
    ...blankDraft, unitLevels: [], photos: [], unit: defaults.defaultUnit,
    buyUnit: defaults.defaultUnit, sellUnit: defaults.defaultUnit, openingUnit: defaults.defaultUnit,
    minUnit: defaults.defaultUnit, stockViewUnit: defaults.defaultUnit,
    warrantyEnabled: defaults.warranty, warrantyDuration: String(defaults.warrantyMonths),
    serialTracking: defaults.serial, expiryEnabled: defaults.expiry,
    expiryWarningDays: String(defaults.expiryDays), allocationMethod: defaults.allocation
  };
  const relations = product.unitRelations ?? (product.altUnit ? [{ leftUnit: product.altUnit.unit, rightUnit: product.unit, quantity: product.altUnit.factor }] : []);
  return {
    ...blankDraft, kind: product.kind ?? 'Stock', name: product.name, nameBn: product.nameBn ?? '',
    brand: product.brand ?? blankDraft.brand, category: product.category, unit: product.unit,
    buy: String(product.purchasePrice), sell: String(product.sellPrice), buyUnit: product.unit, sellUnit: product.unit,
    openingQty: '', openingUnit: product.unit, minQty: String(product.minStock), minUnit: product.unit,
    multiUnit: Boolean(relations.length), unitLevels: [...relations].reverse().map((relation, index) => ({
      id: `saved-${index}`, unit: relation.leftUnit, factor: String(relation.quantity),
      price: String(product.unitSellPrices?.[relation.leftUnit] ?? (product.altUnit?.unit === relation.leftUnit ? product.altUnit.price ?? '' : '')),
      purchasePrice: String(product.unitPurchasePrices?.[relation.leftUnit] ?? '')
    })),
    basePrice: String(product.unitSellPrices?.[product.unit] ?? ''), basePurchasePrice: String(product.unitPurchasePrices?.[product.unit] ?? ''),
    stockViewUnit: product.stockViewUnit ?? product.unit,
    warrantyEnabled: Boolean(product.warranty?.enabled), warrantyDuration: String(product.warranty?.duration ?? 12),
    warrantyDurationUnit: product.warranty?.durationUnit ?? 'Months', warrantyType: product.warranty?.type ?? 'Seller', warrantyTerms: product.warranty?.terms ?? '',
    serialTracking: product.serialTracking ?? 'Off', expiryEnabled: Boolean(product.expiry?.enabled),
    expiryDateRequired: product.expiry?.dateRequired ?? false, expiryWarningDays: String(product.expiry?.warningDays ?? 30), allocationMethod: product.expiry?.allocationMethod ?? 'FIFO',
    barcode: product.sku, photos: product.images?.length ? [...product.images] : product.image ? [product.image] : []
  };
}
