import type {
  Product, ProductKind, SerialTrackingMode, StockAllocationMethod, WarrantyDurationUnit, WarrantyType
} from './erp';

/** Bilingual copy pair. English is always the stored/primary value. */
export type Copy = { en: string; bn: string };

/** Ordered from the smallest unit outward; factor is relative to the preceding unit. */
export type UnitLevel = { id: string; unit: string; factor: string; price: string; purchasePrice?: string };

/** Everything the Add/Edit product form edits. Numbers stay strings while typing. */
export type ProductDraft = {
  kind: ProductKind;
  name: string;
  nameBn: string;
  brand: string;
  category: string;
  unit: string;
  buy: string;
  buyUnit: string;
  sell: string;
  sellUnit: string;
  openingQty: string;
  openingUnit: string;
  minQty: string;
  minUnit: string;
  multiUnit: boolean;
  unitLevels: UnitLevel[];
  basePrice?: string;
  basePurchasePrice?: string;
  stockViewUnit: string;
  warrantyEnabled: boolean;
  warrantyDuration: string;
  warrantyDurationUnit: WarrantyDurationUnit;
  warrantyType: WarrantyType;
  warrantyTerms: string;
  serialTracking: SerialTrackingMode;
  openingSerialText: string;
  expiryEnabled: boolean;
  expiryDateRequired: boolean;
  expiryWarningDays: string;
  allocationMethod: StockAllocationMethod;
  batchNumber: string;
  manufactureDate: string;
  expiryDate: string;
  barcode: string;
  photos: string[];
};

export type ErrorKey =
  | 'name' | 'category' | 'unit' | 'buy' | 'sell' | 'opening' | 'min' | 'unitChain' | 'basePrice' | 'basePurchasePrice'
  | `levelUnit-${string}` | `levelFactor-${string}` | `levelPrice-${string}` | `levelPurchase-${string}`
  | 'warrantyDuration' | 'openingSerials' | 'expiryDate';

export type FieldErrors = Partial<Record<ErrorKey, Copy>>;

export type OpeningMeta = { serials: string[]; batchNumber?: string; manufactureDate?: string; expiryDate?: string };

export type SaveResult = { product: Product; opening?: OpeningMeta };

export type ExistingProduct = Product;
