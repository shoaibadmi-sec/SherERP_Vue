import type {PaymentMethod} from '../types/erp';
export type PurchasePaymentMethod = Exclude<PaymentMethod, 'Customer Credit'>;
export type PurchasePaymentRow = { id: string; method: PurchasePaymentMethod; account: string; amount: string };

export const purchasePaymentAccounts: Record<PurchasePaymentMethod, string[]> = {
  Cash: ['Cash counter'],
  Bank: ['Dutch-Bangla Bank · 4582'],
  Card: ['Dutch-Bangla Bank · 4582'],
  bKash: ['bKash Business · 01711•••412'],
  Nagad: ['Nagad Merchant · 01819•••771'],
  'Mobile Banking': []
};
export const methods: PurchasePaymentMethod[] = ['Cash', 'Bank', 'bKash', 'Nagad', 'Card'];

export function makePurchasePaymentRow(index = 0, method: PurchasePaymentMethod = 'Cash'): PurchasePaymentRow {
  return {
    id: 'purchase-pay-' + Date.now() + '-' + index + '-' + Math.random().toString(36).slice(2, 8),
    method, account: purchasePaymentAccounts[method][0]??'', amount: ''
  };
}

