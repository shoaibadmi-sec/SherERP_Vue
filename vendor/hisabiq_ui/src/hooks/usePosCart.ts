import { useMemo, useState } from 'react';
import { products } from '../data/products';
import { productOffers } from '../data/productOffers';
import type { Party, PaymentMethod, Product, SaleStockSource, WarrantySnapshot } from '../types/erp';
import { activeOfferFor, effectivePriceForUnit } from '../utils/productFeatures';
import { useTenantSettings } from '../settings/TenantSettingsProvider';
import { roundInvoice } from '../settings/model';
import {saleLineTotal} from '../utils/posMultiUnit';
import type {FrozenUnitProfile} from '../utils/multiUnitTransactions';

import {unitsFor} from '../utils/units';
import { moveCartLine, reorderCartLines } from '../utils/reorderCartLines';
import { getBundleVersion } from '../data/productImportPreviewStore';
import {posMoney} from '../utils/posCheckoutValidation';

export type CartLine = {
  key: string;
  product: Product;
  qty: string;
  secondaryQty: string;
  unitQuantities?: Record<string,string>;
  historicalUnitSnapshot?: FrozenUnitProfile;
  unit: string;
  price: string;
  serials: string[];
  stockSource?: SaleStockSource;
  historicalWarranty?: WarrantySnapshot;
  historicalUnitCost?: number;
  /** Captured at add time; never silently replaced if the package recipe is edited. */
  bundleRevision?: number;
  /** Recipe identity changes even when an unsold revision is edited in place. */
  bundleRecipeSignature?:string;
  /** Later source decisions are per component, never on the parent. */
  bundleSources?: Record<string, SaleStockSource>;
  /** Serial selections are scoped to the actual component inside this cart line. */
  bundleSerials?: Record<string,string[]>;
};

export type DiscountMode = 'amount' | 'percent';
export type PosPaymentMethod = PaymentMethod;

export type PosPaymentRow = {
  id: string;
  method: PosPaymentMethod;
  account: string;
  amount: string;
};

export type PosCustomerDetails = {
  name: string;
  phone: string;
  guardianName: string;
  address: string;
};

export const posPaymentAccountsByMethod: Record<PosPaymentMethod, string[]> = {
  Cash: ['Cash counter'],
  Bank: ['Dutch-Bangla Bank · 4582'],
  Card: ['Dutch-Bangla Bank · 4582'],
  bKash: ['bKash Business · 01711•••412'],
  Nagad: ['Nagad Merchant · 01819•••771'],
  'Mobile Banking': [],
  'Customer Credit': ['Customer credit']
};

let seq = 0;
const nextKey = () => `line-${++seq}`;

export function makePosPaymentRow(seedIndex = 0, method: PosPaymentMethod = 'Cash'): PosPaymentRow {
  return {
    id: `pos-pay-${Date.now()}-${seedIndex}`,
    method,
    account: posPaymentAccountsByMethod[method][0]??'',
    amount: ''
  };
}

function line(product: Product, qty: number, unit?: string, secondaryQty = ''): CartLine {
  const candidate = unit ?? product.stockViewUnit ?? product.altUnit?.unit ?? product.unit;
  const u = unitsFor(product).includes(candidate) ? candidate : product.unit;
  return {
    key: nextKey(),
    product,
    qty: String(qty),
    secondaryQty,
    unitQuantities: product.unitRelations && product.unitRelations.length>1 ? (u===product.unit?{[u]:String(qty)}:{[u]:String(qty),[product.unit]:secondaryQty}) : undefined,
    unit: u,
    price: String(effectivePriceForUnit(product, activeOfferFor(product.id, productOffers), u)),
    serials: [],
    ...(product.kind==='Bundle' ? {bundleRevision:getBundleVersion(product.id)?.revision,
      bundleRecipeSignature:JSON.stringify(getBundleVersion(product.id)?.components??[])} : {})
  };
}

const byId = (id: string) => products.find((p) => p.id === id) as Product;

export const demoCart = (): CartLine[] => [
  line(byId('p1'), 4),
  line(byId('p2'), 2, 'Box', '5'),
  line(byId('p5'), 1, 'Gauge', '12')
];

const emptyCustomerDetails = (): PosCustomerDetails => ({
  name: '',
  phone: '',
  guardianName: '',
  address: ''
});

export function usePosCart(initialLines:()=>CartLine[]=demoCart) {
  const { state } = useTenantSettings();
  const settings = state.sections.sales;
  const [lines, setLines] = useState<CartLine[]>(initialLines);
  const [lastAdded, setLastAdded] = useState<string | null>(null);
  const [discountMode, setDiscountMode] = useState<DiscountMode>('amount');
  const [discount, setDiscount] = useState('');
  const [payments, setPayments] = useState<PosPaymentRow[]>(() => [makePosPaymentRow(0, settings.defaultPayment)]);
  const [customer, setCustomerState] = useState<Party | null>(null);
  const [customerDetails, setCustomerDetails] = useState<PosCustomerDetails>(emptyCustomerDetails);

  const setCustomer = (party: Party | null) => {
    setCustomerState(party);
    if (party) {
      setCustomerDetails({
        name: party.name,
        phone: party.phone,
        guardianName: '',
        address: party.area
      });
    } else {
      setCustomerDetails(emptyCustomerDetails());
    }
  };

  const addProduct = (product: Product) => {
    const candidate = product.stockViewUnit ?? product.altUnit?.unit ?? product.unit;
    const preferredUnit = unitsFor(product).includes(candidate) ? candidate : product.unit;
    const currentRevision=product.kind==='Bundle'?getBundleVersion(product.id)?.revision:undefined;
    const signature=product.kind==='Bundle'?JSON.stringify(getBundleVersion(product.id)?.components??[]):undefined;
    const existing = lines.find((l) => l.product.id === product.id && l.unit === preferredUnit &&
      (product.kind!=='Bundle'||(l.bundleRevision===currentRevision&&l.bundleRecipeSignature===signature)));
    if (existing) {
      setLines((ls) =>
        ls.map((l) => l.key === existing.key ? { ...l, qty: String((parseFloat(l.qty) || 0) + 1),
          unitQuantities:l.unitQuantities?{...l.unitQuantities,[l.unit]:String((Number(l.unitQuantities[l.unit])||0)+1)}:undefined,
          stockSource: undefined,
          ...(l.product.kind==='Bundle'?{bundleSources:undefined,bundleSerials:undefined}:{}) } : l)
      );
      setLastAdded(existing.key);
      return;
    }
    const l = line(product, 1);
    setLines((ls) => [...ls, l]);
    setLastAdded(l.key);
  };

  const updateLine = (key: string, patch: Partial<Pick<CartLine, 'qty' | 'secondaryQty' | 'unitQuantities' | 'unit' | 'price' | 'serials' | 'stockSource' | 'bundleSources' | 'bundleSerials'>>) => {
    setLines((ls) =>
      ls.map((l) => {
        if (l.key !== key) return l;
        const quantityChanged = patch.qty !== undefined || patch.secondaryQty !== undefined || patch.unit !== undefined || patch.unitQuantities !== undefined;
        const next = { ...l, ...patch };
        if (quantityChanged && patch.stockSource === undefined) next.stockSource = undefined;
        if (quantityChanged && l.product.kind==='Bundle') {
          next.bundleSources=undefined;
          next.bundleSerials=undefined;
        }
        if (patch.unit && patch.unit !== l.unit) {
          next.price = String(effectivePriceForUnit(l.product, activeOfferFor(l.product.id, productOffers), patch.unit));
          if (!next.unitQuantities) next.secondaryQty = '';
        }
        return next;
      })
    );
  };

  const removeLine = (key: string) => setLines((ls) => ls.filter((l) => l.key !== key));

  const reorderLines = (keys: string[]) => setLines((current) => reorderCartLines(current, keys));
  const moveLine = (key: string, delta: number) => setLines((current) => moveCartLine(current, key, delta));

  const reset = () => {
    setLines([]);
    setDiscount('');
    setPayments([makePosPaymentRow(0, settings.defaultPayment)]);
    setCustomerState(null);
    setCustomerDetails(emptyCustomerDetails());
  };

  const totals = useMemo(() => {
    const subtotal = lines.reduce((sum, line) => {
      return sum + saleLineTotal(line);
    }, 0);
    const d = posMoney(discount) || 0;
    const discountAmt = Math.min(subtotal, discountMode === 'percent' ? subtotal * d / 100 : d);
    const net = subtotal - discountAmt;
    const total = net > 0 ? roundInvoice(net, settings.rounding) : 0;
    const rounding = total - net;
    const paidNum = payments.reduce((sum, payment) => sum + (posMoney(payment.amount) || 0), 0);
    const due = Math.max(0, total - paidNum);
    const change = Math.max(0, paidNum - total);
    const itemCount = lines.length;
    return { subtotal, discountAmt, net, total, rounding, roundingLabel: settings.rounding === 'No rounding' ? 'Rounding (off)' : settings.rounding === 'Nearest ৳1' ? 'Rounding (to ৳1)' : 'Rounding (to ৳5)', paidNum, due, change, itemCount };
  }, [lines, discount, discountMode, payments, settings.rounding]);

  return {
    lines,
    setLines,
    lastAdded,
    addProduct,
    updateLine,
    removeLine,
    reorderLines,
    moveLine,
    reset,
    discount,
    setDiscount,
    discountMode,
    setDiscountMode,
    payments,
    setPayments,
    customer,
    setCustomer,
    customerDetails,
    setCustomerDetails,
    totals
  };
}

