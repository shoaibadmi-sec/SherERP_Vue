import { duplicateSerials, normalizeSerials } from './productFeatures.ts';
import type { Product, UnitRelation } from '../types/erp.ts';
import { resolveUnitChain } from './unitChain.ts';
import type { ErrorKey, ExistingProduct, FieldErrors, ProductDraft, SaveResult } from '../types/productForm';

/** Visual top-to-bottom order; the first entry is where focus lands after a failed save. */
export const fieldOrder = (d: ProductDraft): ErrorKey[] => [
  'name', 'category', 'unit', 'buy', 'sell', 'opening', 'min', 'unitChain', 'basePrice', 'basePurchasePrice',
  ...d.unitLevels.flatMap((level): ErrorKey[] => [`levelUnit-${level.id}`, `levelFactor-${level.id}`, `levelPrice-${level.id}`, `levelPurchase-${level.id}`]),
  'warrantyDuration', 'openingSerials', 'expiryDate'
];

export type DraftDerived = {
  units: string[];
  factors: Record<string, number>;
  sellUnit: string; buyUnit: string; openingUnit: string; minUnit: string; viewUnit: string;
  sellBase: number; buyBase: number; margin: number | null; profit: number | null;
  openingBase: number; minBase: number; serials: string[]; duplicates: string[];
  requiredSerials: number; serialCompatible: boolean;
};

export function draftUnitRelations(d: ProductDraft): UnitRelation[] {
  return d.unitLevels.map((level, index) => ({
    leftUnit: level.unit, rightUnit: index ? d.unitLevels[index - 1].unit : d.unit, quantity: Number(level.factor)
  })).reverse();
}

export function factorsOf(d: ProductDraft): Record<string, number> {
  if (d.kind !== 'Stock' || !d.multiUnit) return { [d.unit]: 1 };
  let count = 0;
  const seen = new Set([d.unit.toLowerCase()]);
  for (const level of d.unitLevels) {
    if (!level.unit || seen.has(level.unit.toLowerCase()) || !Number.isFinite(Number(level.factor)) || Number(level.factor) <= 1) break;
    seen.add(level.unit.toLowerCase());
    count++;
  }
  if (!count) return { [d.unit]: 1 };
  try { return resolveUnitChain(draftUnitRelations({ ...d, unitLevels: d.unitLevels.slice(0, count) })).factors; }
  catch { return { [d.unit]: 1 }; }
}

const convertUnitValue = (amount: string, from: number, to: number, price = false) => {
  if (!amount.trim() || from === to) return amount;
  const value = price ? Number(amount) / from * to : Number(amount) * from / to;
  return Number.isFinite(value) ? String(value) : amount;
};
const serialUnitCompatible = (unit: string) => !/^(feet|foot|ft|inch|inches|meter|metre|m|cm|mm|kg|kilogram|gram|g|litre|liter|l|ml)$/i.test(unit.trim());
const validCustomPrice = (value: string) => /^(?:\d+(?:\.\d{1,4})?|\.\d{1,4})$/.test(value) && Number.isFinite(Number(value)) && Number(value) >= 0;

export const unitsOf = (d: ProductDraft) => { const f = factorsOf(d); return [d.unit, ...d.unitLevels.map((level) => level.unit)].filter((unit, index, all) => Boolean(f[unit]) && all.indexOf(unit) === index); };
export const pickUnit = (d: ProductDraft, unit: string) => unitsOf(d).includes(unit) ? unit : d.unit;

export function convertPrice(d: ProductDraft, amount: string, from: string, to: string) {
  const factors = factorsOf(d);
  return convertUnitValue(amount, factors[from] ?? 1, factors[to] ?? 1, true);
}
export function convertQty(d: ProductDraft, amount: string, from: string, to: string) {
  const factors = factorsOf(d);
  return convertUnitValue(amount, factors[from] ?? 1, factors[to] ?? 1);
}

/** Preserve stock and prices when a level is removed, including a middle level. */
export function removeDraftLevel(d: ProductDraft, id: string): ProductDraft | null {
  const index = d.unitLevels.findIndex((level) => level.id === id);
  if (index < 0) return d;
  const removed = d.unitLevels[index];
  const factors = factorsOf(d);
  const selected = [d.sellUnit, d.buyUnit, d.openingUnit, d.minUnit];
  if (selected.includes(removed.unit) && !factors[removed.unit]) return null;
  const levels = d.unitLevels.filter((level) => level.id !== id).map((level) => ({ ...level }));
  if (levels[index]) {
    const bridge = Number(removed.factor) * Number(levels[index].factor);
    if (!Number.isFinite(bridge) || Number(removed.factor) <= 1 || Number(levels[index].factor) <= 1) return null;
    levels[index].factor = String(bridge);
  }
  return {
    ...d, unitLevels: levels,
    sell: d.sellUnit === removed.unit ? convertPrice(d, d.sell, removed.unit, d.unit) : d.sell,
    sellUnit: d.sellUnit === removed.unit ? d.unit : d.sellUnit,
    buy: d.buyUnit === removed.unit ? convertPrice(d, d.buy, removed.unit, d.unit) : d.buy,
    buyUnit: d.buyUnit === removed.unit ? d.unit : d.buyUnit,
    openingQty: d.openingUnit === removed.unit ? convertQty(d, d.openingQty, removed.unit, d.unit) : d.openingQty,
    openingUnit: d.openingUnit === removed.unit ? d.unit : d.openingUnit,
    minQty: d.minUnit === removed.unit ? convertQty(d, d.minQty, removed.unit, d.unit) : d.minQty,
    minUnit: d.minUnit === removed.unit ? d.unit : d.minUnit,
    stockViewUnit: d.stockViewUnit === removed.unit ? d.unit : d.stockViewUnit
  };
}

export const fmtQty = (n: number) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 4 }).format(n);

export function deriveDraft(d: ProductDraft, isEdit: boolean, existingSerials: string[]): DraftDerived {
  const isStock = d.kind === 'Stock';
  const factors = factorsOf(d);
  const units = [d.unit, ...d.unitLevels.map((level) => level.unit)].filter((unit, index, all) => Boolean(factors[unit]) && all.indexOf(unit) === index);
  const sellUnit = pickUnit(d, d.sellUnit);
  const buyUnit = pickUnit(d, d.buyUnit);
  const openingUnit = pickUnit(d, d.openingUnit);
  const minUnit = pickUnit(d, d.minUnit);
  const viewUnit = units.includes(d.stockViewUnit) ? d.stockViewUnit : d.unit;
  const sellBase = Number(d.sell) / factors[sellUnit];
  const buyBase = (Number(d.buy) || 0) / factors[buyUnit];
  const hasBoth = sellBase > 0 && buyBase > 0;
  const openingBase = isStock && !isEdit ? (Number(d.openingQty) || 0) * factors[openingUnit] : 0;
  const serials = normalizeSerials(d.openingSerialText);
  return {
    units, factors, sellUnit, buyUnit, openingUnit, minUnit, viewUnit, sellBase, buyBase,
    margin: hasBoth ? ((sellBase - buyBase) / sellBase) * 100 : null,
    profit: hasBoth ? sellBase - buyBase : null,
    openingBase,
    minBase: isStock ? (Number(d.minQty) || 0) * factors[minUnit] : 0,
    serialCompatible: serialUnitCompatible(d.unit),
    serials,
    duplicates: duplicateSerials(serials, existingSerials),
    requiredSerials: !isEdit && isStock && d.serialTracking === 'Required' ? Math.round(openingBase) : 0
  };
}

export function validateDraft(d: ProductDraft, isEdit: boolean, x: DraftDerived): FieldErrors {
  const e: FieldErrors = {};
  const isStock = d.kind === 'Stock';
  if (!d.name.trim()) {
    e.name = isStock
      ? { en: 'Enter the product name in English.', bn: 'ইংরেজিতে পণ্যের নাম লিখুন।' }
      : { en: 'Enter the service name in English.', bn: 'ইংরেজিতে সেবার নাম লিখুন।' };
  }
  if (!d.category.trim()) e.category = { en: 'Choose a category.', bn: 'একটি ক্যাটাগরি বাছুন।' };
  if (isStock && !d.unit.trim()) e.unit = { en: 'Choose a unit.', bn: 'একটি একক বাছুন।' };
  if (!(x.sellBase > 0) || !Number.isFinite(x.sellBase)) e.sell = { en: 'Enter a selling price.', bn: 'বিক্রয় মূল্য লিখুন।' };

  if (d.buy.trim() && (!Number.isFinite(Number(d.buy)) || !Number.isFinite(x.buyBase) || x.buyBase < 0)) e.buy = { en: 'Enter a valid cost.', bn: 'সঠিক কেনা দাম লিখুন।' };
  if (!isEdit && isStock && (!Number.isFinite(Number(d.openingQty)) || !Number.isFinite(x.openingBase) || x.openingBase < 0)) e.opening = { en: 'Enter a valid opening quantity.', bn: 'সঠিক শুরুর স্টক লিখুন।' };
  if (isStock && (!Number.isFinite(Number(d.minQty)) || !Number.isFinite(x.minBase) || x.minBase < 0)) e.min = { en: 'Enter a valid minimum quantity.', bn: 'সঠিক সর্বনিম্ন স্টক লিখুন।' };
  if (isStock && d.multiUnit) {
    if (!d.unitLevels.length) e.unitChain = { en: 'Add a larger unit, or turn multiple units off.', bn: 'বড় একক যোগ করুন, অথবা একাধিক একক বন্ধ করুন।' };
    const used = new Set([d.unit.trim().toLowerCase()]);
    let cumulative = 1;
    d.unitLevels.forEach((level, index) => {
      const unit = level.unit.trim().toLowerCase();
      const smaller = index ? d.unitLevels[index - 1].unit : d.unit;
      if (!unit || used.has(unit)) e[`levelUnit-${level.id}`] = { en: 'Choose a different unit for each level.', bn: 'প্রতি ধাপে আলাদা একক বাছুন।' };
      used.add(unit);
      const factor = Number(level.factor);
      cumulative *= factor;
      if (!Number.isFinite(factor) || factor <= 1 || !Number.isFinite(cumulative)) e[`levelFactor-${level.id}`] = {
        en: `Enter how many ${smaller || 'smaller units'} are in 1 ${level.unit || 'larger unit'} (more than 1).`,
        bn: `১ ${level.unit || 'বড় একক'}-এ কত ${smaller || 'ছোট একক'} আছে লিখুন (১-এর বেশি)।`
      };
      if (level.price.trim() && !validCustomPrice(level.price)) e[`levelPrice-${level.id}`] = { en: 'Enter a valid custom price, or leave it empty for automatic pricing.', bn: 'সঠিক আলাদা দাম লিখুন, অথবা স্বয়ংক্রিয় দামের জন্য খালি রাখুন।' };
      if (level.purchasePrice?.trim() && !validCustomPrice(level.purchasePrice)) e[`levelPurchase-${level.id}`] = { en: 'Enter a valid nonnegative cost, up to four decimal places.', bn: 'শূন্য বা তার বেশি সঠিক দাম লিখুন, দশমিকের পরে সর্বোচ্চ চার ঘর।' };
    });
    if (d.basePrice?.trim() && !validCustomPrice(d.basePrice)) e.basePrice = { en: 'Enter a valid custom selling price.', bn: 'সঠিক আলাদা বিক্রয় মূল্য লিখুন।' };
    if (d.basePurchasePrice?.trim() && !validCustomPrice(d.basePurchasePrice)) e.basePurchasePrice = { en: 'Enter a valid custom purchase price.', bn: 'সঠিক আলাদা কেনা দাম লিখুন।' };
  }
  if (isStock && d.serialTracking !== 'Off' && !x.serialCompatible) e.openingSerials = {
    en: 'Serial numbers need a countable smallest unit. Turn serials off for this measurement unit.',
    bn: 'সিরিয়ালের জন্য সবচেয়ে ছোট এককটি গণনাযোগ্য হতে হবে। এই মাপের এককে সিরিয়াল বন্ধ রাখুন।'
  };

  if (d.warrantyEnabled && !(parseFloat(d.warrantyDuration) > 0)) {
    e.warrantyDuration = { en: 'Enter how long the warranty lasts.', bn: 'ওয়ারেন্টি কতদিন থাকবে লিখুন।' };
  }

  if (!isEdit && isStock && x.serialCompatible && d.serialTracking !== 'Off' && x.openingBase > 0) {
    if (x.duplicates.length) {
      e.openingSerials = {
        en: `Serial ${x.duplicates[0]} is entered twice or already exists.`,
        bn: `সিরিয়াল ${x.duplicates[0]} দুইবার লেখা হয়েছে বা আগে থেকেই আছে।`
      };
    } else if (d.serialTracking === 'Required' && !Number.isInteger(x.openingBase)) {
      e.openingSerials = {
        en: `Required serials need a whole number of ${d.unit} in opening stock.`,
        bn: `সিরিয়াল আবশ্যক হলে শুরুর স্টক পূর্ণ সংখ্যায় (${d.unit}) দিন।`
      };
    } else if (d.serialTracking === 'Required' && x.serials.length !== x.requiredSerials) {
      e.openingSerials = {
        en: `Enter ${x.requiredSerials} serials, one for each ${d.unit}. ${x.serials.length} entered.`,
        bn: `প্রতিটি ${d.unit}-এর জন্য একটি করে ${x.requiredSerials}টি সিরিয়াল দিন। দেওয়া হয়েছে ${x.serials.length}টি।`
      };
    } else if (d.serialTracking === 'Optional' && x.serials.length > x.openingBase) {
      e.openingSerials = {
        en: `${x.serials.length} serials entered, but opening stock is only ${fmtQty(x.openingBase)} ${d.unit}.`,
        bn: `${x.serials.length}টি সিরিয়াল দেওয়া হয়েছে, কিন্তু শুরুর স্টক মাত্র ${fmtQty(x.openingBase)} ${d.unit}।`
      };
    }
  }

  if (!isEdit && isStock && d.expiryEnabled && x.openingBase > 0) {
    if (d.expiryDateRequired && !d.expiryDate) {
      e.expiryDate = { en: 'Enter the expiry date for opening stock.', bn: 'শুরুর স্টকের মেয়াদ শেষের তারিখ দিন।' };
    } else if (d.manufactureDate && d.expiryDate && d.expiryDate <= d.manufactureDate) {
      e.expiryDate = { en: 'Expiry date must be after the manufacture date.', bn: 'মেয়াদ শেষের তারিখ উৎপাদনের তারিখের পরে হতে হবে।' };
    }
  }
  return e;
}

export function errorSection(key: ErrorKey): 'main' | 'advanced' | 'other' {
  if (key === 'unitChain' || key === 'basePrice' || key === 'basePurchasePrice' || key.startsWith('level')) return 'advanced';
  if (key === 'warrantyDuration' || key === 'openingSerials' || key === 'expiryDate') return 'other';
  return 'main';
}

/** Builds the prototype product, retaining every adjacent unit relationship; nothing is posted. */
export function buildProduct(d: ProductDraft, x: DraftDerived, isEdit: boolean, existing?: ExistingProduct): SaveResult {
  const isStock = d.kind === 'Stock';
  const relations = isStock && d.multiUnit ? draftUnitRelations(d) : undefined;
  if (isEdit && existing) {
    const saved = existing.unitRelations ?? (existing.altUnit ? [{ leftUnit: existing.altUnit.unit, rightUnit: existing.unit, quantity: existing.altUnit.factor }] : []);
    if (d.kind !== (existing.kind ?? 'Stock') || d.unit !== existing.unit || JSON.stringify(relations ?? []) !== JSON.stringify(saved))
      throw new Error('Changing saved unit relationships requires a reviewed stock and invoice migration.');
  }
  const customPrices = (purchase: boolean) => Object.fromEntries([
    [d.unit, purchase ? d.basePurchasePrice ?? '' : d.basePrice ?? ''],
    ...d.unitLevels.map((level) => [level.unit, purchase ? level.purchasePrice ?? '' : level.price])
  ].filter(([, value]) => value.trim()).map(([unit, value]) => [unit, Number(value)]));
  const largest = d.unitLevels[d.unitLevels.length - 1];
  const product: Product = {
    id: existing?.id ?? `p${Date.now()}`,
    kind: d.kind,
    name: d.name.trim(),
    nameBn: d.nameBn.trim() || undefined,
    sku: d.barcode.trim() || `${d.category.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 8999)}`,
    category: d.category,
    brand: isStock ? d.brand : undefined,
    image: d.photos[0],
    images: d.photos.length ? [...d.photos] : undefined,
    unit: d.unit,
    unitRelations: relations,
    unitSellPrices: isStock && d.multiUnit ? customPrices(false) : undefined,
    unitPurchasePrices: isStock && d.multiUnit ? customPrices(true) : undefined,
    altUnit: relations?.length && largest ? { unit: largest.unit, factor: x.factors[largest.unit], price: largest.price.trim() ? Number(largest.price) : undefined } : undefined,
    stock: isEdit ? existing?.stock ?? 0 : x.openingBase,
    stockViewUnit: isStock ? x.viewUnit : undefined,
    minStock: x.minBase,
    sellPrice: x.sellBase,
    purchasePrice: x.buyBase,
    warranty: {
      enabled: d.warrantyEnabled,
      duration: d.warrantyEnabled ? parseFloat(d.warrantyDuration) : undefined,
      durationUnit: d.warrantyEnabled ? d.warrantyDurationUnit : undefined,
      type: d.warrantyEnabled ? d.warrantyType : undefined,
      terms: d.warrantyEnabled ? d.warrantyTerms.trim() || undefined : undefined
    },
    serialTracking: isStock ? d.serialTracking : 'Off',
    expiry: isStock ? {
      enabled: d.expiryEnabled,
      dateRequired: d.expiryEnabled && d.expiryDateRequired,
      warningDays: d.expiryEnabled ? Math.max(0, parseInt(d.expiryWarningDays) || 0) : 0,
      allocationMethod: d.expiryEnabled ? d.allocationMethod : 'FIFO'
    } : undefined,
    active: existing?.active ?? true
  };
  const opening = !isEdit && isStock && x.openingBase > 0 ? {
    serials: d.serialTracking === 'Off' ? [] : x.serials,
    batchNumber: d.expiryEnabled ? d.batchNumber.trim() || undefined : undefined,
    manufactureDate: d.expiryEnabled ? d.manufactureDate || undefined : undefined,
    expiryDate: d.expiryEnabled ? d.expiryDate || undefined : undefined
  } : undefined;
  return { product, opening };
}
