import type {
  Product,
  ProductOffer,
  ProductOfferStatus,
  StockLot,
  WarrantySnapshot
} from '../types/erp';
import {productUnitFactor} from './unitChain.ts';
import {priceFor} from './units.ts';

export function normalizeSerials(input: string): string[] {
  return input
    .split(/[\n,;\t]+/)
    .map((serial) => serial.trim())
    .filter(Boolean);
}

export function duplicateSerials(serials: string[], existing: string[] = []): string[] {
  const seen = new Set(existing.map((serial) => serial.toLowerCase()));
  const duplicates = new Set<string>();

  for (const serial of serials) {
    const key = serial.toLowerCase();
    if (seen.has(key)) duplicates.add(serial);
    seen.add(key);
  }

  return [...duplicates];
}

export function requiredSerialCount(product: Product, baseQuantity: number): number {
  if (product.kind === 'Service' || product.serialTracking !== 'Required') return 0;
  return Math.max(0, Math.ceil(baseQuantity));
}

export function warrantySnapshot(product: Product): WarrantySnapshot | undefined {
  const warranty = product.warranty;
  if (!warranty?.enabled || !warranty.duration || !warranty.durationUnit || !warranty.type) return undefined;
  return {
    duration: warranty.duration,
    durationUnit: warranty.durationUnit,
    type: warranty.type,
    terms: warranty.terms?.trim() || undefined
  };
}

export function offerStatus(offer: ProductOffer, now = new Date()): ProductOfferStatus {
  if (!offer.enabled) return 'Disabled';
  const start = new Date(offer.startAt);
  const end = new Date(offer.endAt);
  if (now < start) return 'Scheduled';
  if (now > end) return 'Expired';
  return 'Active';
}

export function offerDiscountInBaseUnit(product: Product, offer: ProductOffer): number {
  if (offer.discountType === 'Percentage') return product.sellPrice * offer.value / 100;
  const factor = productUnitFactor(product, offer.priceUnit);
  return offer.value / (factor || 1);
}

export function effectiveOfferPrice(product: Product, offer: ProductOffer): number {
  return Math.max(0, product.sellPrice - offerDiscountInBaseUnit(product, offer));
}

export function validateOffer(product: Product, offer: ProductOffer, others: ProductOffer[]): string | null {
  if (offer.value <= 0) return 'Discount must be greater than zero.';
  const startDate = new Date(offer.startAt);
  const endDate = new Date(offer.endAt);
  if (!offer.startAt || !offer.endAt || Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return 'Enter valid start and end date/time.';
  if (endDate <= startDate) return 'End date and time must be after the start.';
  if (offer.discountType === 'Percentage' && offer.value > 100) return 'Percentage discount cannot exceed 100%.';
  const normalInOfferUnit = priceFor(product, offer.priceUnit);
  const rawEffective = offer.discountType === 'Percentage'
    ? normalInOfferUnit * (1 - offer.value / 100)
    : normalInOfferUnit - offer.value;
  if (rawEffective < 0) return 'Discount cannot make the effective price negative.';

  if (offer.enabled) {
    const start = new Date(offer.startAt).getTime();
    const end = new Date(offer.endAt).getTime();
    const overlap = others.some((candidate) => {
      if (!candidate.enabled || candidate.id === offer.id || candidate.productId !== offer.productId) return false;
      const candidateStart = new Date(candidate.startAt).getTime();
      const candidateEnd = new Date(candidate.endAt).getTime();
      return start < candidateEnd && end > candidateStart;
    });
    if (overlap) return 'This enabled offer overlaps another enabled offer.';
  }

  return null;
}

export function lotExpiryState(
  lot: StockLot,
  warningDays: number,
  now = new Date()
): 'No expiry' | 'Sellable' | 'Expiring soon' | 'Expired' {
  if (!lot.expiryDate) return 'No expiry';
  const end = new Date(`${lot.expiryDate}T23:59:59`);
  if (end.getTime() < now.getTime()) return 'Expired';
  const warningEdge = new Date(now);
  warningEdge.setDate(warningEdge.getDate() + Math.max(0, warningDays));
  return end.getTime() <= warningEdge.getTime() ? 'Expiring soon' : 'Sellable';
}

export function productStockBreakdown(product: Product, lots: StockLot[], now = new Date()) {
  if (product.kind === 'Service') {
    return { onHand: 0, sellable: 0, expiringSoon: 0, expired: 0 };
  }
  const productLots = lots.filter((lot) => lot.productId === product.id);
  const warningDays = product.expiry?.warningDays ?? 0;
  let sellable = 0;
  let expiringSoon = 0;
  let expired = 0;

  for (const lot of productLots) {
    const state = lotExpiryState(lot, warningDays, now);
    if (state === 'Expired') expired += lot.available;
    else {
      sellable += lot.available;
      if (state === 'Expiring soon') expiringSoon += lot.available;
    }
  }

  return {
    onHand: productLots.reduce((sum, lot) => sum + lot.available, 0),
    sellable,
    expiringSoon,
    expired
  };
}

export function allocatableLots(product: Product, lots: StockLot[], now = new Date()): StockLot[] {
  const warningDays = product.expiry?.warningDays ?? 0;
  const available = lots.filter(
    (lot) => lot.productId === product.id && lot.available > 0 && lotExpiryState(lot, warningDays, now) !== 'Expired'
  );
  if (product.expiry?.allocationMethod === 'FEFO') {
    return available.slice().sort((a, b) => {
      if (!a.expiryDate && !b.expiryDate) return a.receivedAt.localeCompare(b.receivedAt);
      if (!a.expiryDate) return 1;
      if (!b.expiryDate) return -1;
      return a.expiryDate.localeCompare(b.expiryDate) || a.receivedAt.localeCompare(b.receivedAt);
    });
  }
  return available.slice().sort((a, b) => a.receivedAt.localeCompare(b.receivedAt));
}

export function availableSerials(product: Product, lots: StockLot[], now = new Date()): string[] {
  return allocatableLots(product, lots, now).flatMap((lot) => lot.serials ?? []);
}


export function effectivePriceForUnit(product: Product, offer: ProductOffer | undefined, unit: string): number {
  const normal = priceFor(product, unit);
  if (!offer || offerStatus(offer) !== 'Active') return normal;
  if (offer.discountType === 'Percentage')
    return Math.max(0, normal * (1 - offer.value / 100));
  const offerFactor = productUnitFactor(product, offer.priceUnit) || 1;
  const targetFactor = productUnitFactor(product, unit) || 1;
  const discount = offer.value * targetFactor / offerFactor;
  return Math.max(0, normal - discount);
}

export function activeOfferFor(productId: string, offers: ProductOffer[], now = new Date()): ProductOffer | undefined {
  return offers.find((offer) => offer.productId === productId && offerStatus(offer, now) === 'Active');
}

export function allocateLotQuantity(product: Product, lots: StockLot[], quantity: number, now = new Date()) {
  let remaining = Math.max(0, quantity);
  const allocations: Array<{ lotId: string; quantity: number }> = [];
  for (const lot of allocatableLots(product, lots, now)) {
    if (remaining <= 0) break;
    const take = Math.min(remaining, lot.available);
    if (take > 0) allocations.push({ lotId: lot.id, quantity: take });
    remaining -= take;
  }
  return { allocations, unallocated: remaining };
}
