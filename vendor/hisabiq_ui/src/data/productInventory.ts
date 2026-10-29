import { products } from './products.ts';
import type { StockLot, StockMovement } from '../types/erp';

function splitStock(stock: number): [number, number] {
  if (stock <= 0) return [0, 0];
  if (stock < 6) return [stock, 0];
  const first = Math.max(1, Math.floor(stock * 0.38));
  return [first, stock - first];
}

function lotExtras(productId: string, source: 'Opening' | 'Purchase'): Partial<StockLot> {
  if (productId === 'p7') {
    return source === 'Opening'
      ? { serials: ['GV34-1001', 'GV34-1002', 'GV34-1003', 'GV34-1004'] }
      : {};
  }

  if (productId === 'p2' && source === 'Purchase') {
    return { serials: ['LB12-3001', 'LB12-3002', 'LB12-3003', 'LB12-3004'] };
  }

  if (productId === 'p8') {
    return source === 'Opening'
      ? {
          batchNumber: 'CEM-0826-A',
          manufactureDate: '2026-08-05',
          expiryDate: '2026-10-03'
        }
      : {
          batchNumber: 'CEM-0926-B',
          manufactureDate: '2026-09-20',
          expiryDate: '2026-10-25'
        };
  }

  return {};
}

export const stockLots: StockLot[] = products.flatMap((product, index) => {
  if (product.kind === 'Service' || product.stock <= 0) return [];
  const [opening, purchase] = splitStock(product.stock);
  const rows: StockLot[] = [];

  if (opening > 0) {
    rows.push({
      id: `lot-${product.id}-opening`,
      productId: product.id,
      label: 'Opening Stock',
      receivedAt: '2026-09-01',
      quantity: opening,
      available: opening,
      unitCost: product.purchasePrice,
      source: 'Opening',
      ...lotExtras(product.id, 'Opening')
    });
  }

  if (purchase > 0) {
    rows.push({
      id: `lot-${product.id}-purchase`,
      productId: product.id,
      label: `Purchase #PUR-${String(1041 + index).padStart(4, '0')}`,
      receivedAt: index % 2 === 0 ? '2026-10-02' : '2026-10-04',
      quantity: purchase,
      available: purchase,
      unitCost: product.purchasePrice,
      source: 'Purchase',
      reference: `PUR-${String(1041 + index).padStart(4, '0')}`,
      ...lotExtras(product.id, 'Purchase')
    });
  }

  return rows;
});

export const stockMovements: StockMovement[] = products.flatMap((product, index) => {
  if (product.kind === 'Service') return [];
  const openingBalance = product.stock > 0 ? Math.max(1, Math.floor(product.stock * 0.38)) : 0;
  const purchaseQty = Math.max(0, product.stock - openingBalance);
  const rows: StockMovement[] = [];

  if (openingBalance > 0) {
    rows.push({
      id: `mov-${product.id}-opening`,
      productId: product.id,
      date: '2026-09-01',
      type: 'Opening',
      quantity: openingBalance,
      balance: openingBalance,
      reference: 'Opening Stock',
      note: 'Opening balance'
    });
  }

  if (purchaseQty > 0) {
    rows.push({
      id: `mov-${product.id}-purchase`,
      productId: product.id,
      date: index % 2 === 0 ? '2026-10-02' : '2026-10-04',
      type: 'Purchase',
      quantity: purchaseQty,
      balance: product.stock,
      reference: `PUR-${String(1041 + index).padStart(4, '0')}`,
      note: product.expiry?.enabled ? 'Supplier purchase received · lot expiry tracked' : 'Supplier purchase received'
    });
  }

  if (product.stock === 0) {
    rows.push({
      id: `mov-${product.id}-sale`,
      productId: product.id,
      date: '2026-10-05',
      type: 'Sale',
      quantity: -12,
      balance: 0,
      reference: `INV-${String(2190 + index)}`,
      note: 'Last available stock sold'
    });
  }

  return rows;
});
