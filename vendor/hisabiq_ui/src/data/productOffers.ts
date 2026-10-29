import type { ProductOffer } from '../types/erp';

export const productOffers: ProductOffer[] = [
  {
    id: 'offer-p2-1',
    productId: 'p2',
    discountType: 'Percentage',
    value: 10,
    priceUnit: 'Pcs',
    startAt: '2026-10-01T09:00',
    endAt: '2026-10-15T23:59',
    enabled: true
  },
  {
    id: 'offer-p7-1',
    productId: 'p7',
    discountType: 'Fixed',
    value: 50,
    priceUnit: 'Pcs',
    startAt: '2026-10-10T00:00',
    endAt: '2026-10-20T23:59',
    enabled: true
  },
  {
    id: 'offer-p14-1',
    productId: 'p14',
    discountType: 'Fixed',
    value: 100,
    priceUnit: 'Service',
    startAt: '2026-09-01T00:00',
    endAt: '2026-09-30T23:59',
    enabled: true
  }
];
