import {NumericInput} from '../NumericInput';
import React from 'react';
import { AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { Button } from '../Button';
import { FormSelect } from '../FormSelect';
import { Input } from '../Input';
import type { PurchaseDiscountMode } from '../../utils/purchaseCheckout';
import { paymentRemainder } from '../../utils/purchaseCheckout';
import { formatNumber, taka } from '../../utils/currency';
import { AmountInWordsDisplay } from '../AmountInWordsDisplay';
import {useUiCopy} from '../../i18n/useUiCopy';

import {makePurchasePaymentRow,purchasePaymentAccounts,methods,type PurchasePaymentMethod,type PurchasePaymentRow} from '../../utils/purchasePaymentMethods';
export {makePurchasePaymentRow,purchasePaymentAccounts} from '../../utils/purchasePaymentMethods';
export type {PurchasePaymentMethod,PurchasePaymentRow} from '../../utils/purchasePaymentMethods';

type Totals = {
  subtotal: number; discountAmt: number; net: number; total: number;
  rounding: number; roundingLabel: string; paidNum: number; due: number; excess: number;
};
type Props = {
  actionLabel?: string;
  hideDiscount?: boolean;
  totals: Totals;
  itemCount: number;
  discount: string;
  discountMode: PurchaseDiscountMode;
  onDiscount: (value: string) => void;
  onDiscountMode: (mode: PurchaseDiscountMode) => void;
  payments: PurchasePaymentRow[];
  onPayments: React.Dispatch<React.SetStateAction<PurchasePaymentRow[]>>;
  paidRef: React.RefObject<HTMLInputElement>;
  onComplete: () => void;
};

function Row({ label, value, muted = false }: { label: React.ReactNode; value: React.ReactNode; muted?: boolean }) {
  return (
    <div className={'flex items-center justify-between gap-3 text-sm ' + (muted ? 'text-ink-500' : 'text-ink-700')}>
      <span>{label}</span><span>{value}</span>
    </div>
  );
}

/** Same checkout controls as POS, with supplier-payable semantics. */
export function PurchasePaymentPanel(props: Props) {
  const { totals, payments, discountMode } = props;
  const {text,word,showHelper}=useUiCopy();
  const quick = [500, 1000, 2000, 5000].filter((amount) => amount >= totals.total * 0.2);
  const updatePayment = (id: string, patch: Partial<PurchasePaymentRow>) => {
    props.onPayments((rows) => rows.map((row) => row.id === id ? { ...row, ...patch } : row));
  };
  const changeMethod = (id: string, method: PurchasePaymentMethod) => {
    props.onPayments((rows) => rows.map((row) => row.id === id ? {
      ...row, method, account: purchasePaymentAccounts[method][0]
    } : row));
  };
  const setSinglePayment = (amount: number, method: PurchasePaymentMethod = payments[0]?.method ?? 'Cash') => {
    props.onPayments([{
      ...makePurchasePaymentRow(0, method),
      account: payments[0]?.method === method ? payments[0].account : purchasePaymentAccounts[method][0],
      amount: String(amount)
    }]);
  };

  return (
    <section data-testid="purchase-payment-panel" className="bg-card">
      <div className="space-y-2 p-4">
        <Row label={text('Subtotal · ' + props.itemCount + ' products','পণ্যের মোট · ' + props.itemCount + 'টি')} value={taka(totals.subtotal, totals.subtotal % 1 ? 2 : 0)} />
        {!props.hideDiscount && <div className="flex items-center justify-between gap-3 text-sm text-ink-700">
          <span>{word('discount')} {showHelper&&<span className="font-bn text-xs text-ink-500">· ছাড়</span>}</span>
          <div className="flex items-center gap-1">
            <div className="flex h-8 rounded-md bg-ink-50 p-0.5" role="radiogroup" aria-label={text("Discount type","ছাড়ের ধরন")}>
              {(['amount', 'percent'] as PurchaseDiscountMode[]).map((mode) => (
                <button key={mode} type="button" role="radio" aria-label={mode === 'amount' ? '৳' : '%'}
                  aria-checked={discountMode === mode} onClick={() => props.onDiscountMode(mode)}
                  className={'w-7 rounded text-xs font-medium ' +
                    (discountMode === mode ? 'bg-card text-ink shadow-card' : 'text-ink-500')}>
                  {mode === 'amount' ? '৳' : '%'}
                </button>
              ))}
            </div>
            <NumericInput aria-label={word("discount")} value={props.discount}
              onChange={(event) => props.onDiscount(event.target.value.replace(/[^\d.]/g, ''))}
              placeholder="0" inputMode="decimal"
              className="h-8 w-24 rounded-md border border-border bg-card px-2 text-right text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20" />
          </div>
        </div>
        }
        {totals.discountAmt > 0 &&
          <Row muted label={word("discountApplied")} value={'−' + taka(totals.discountAmt, totals.discountAmt % 1 ? 2 : 0)} />}
        <Row muted label={text(totals.roundingLabel,"রাউন্ডিং")}
          value={(totals.rounding >= 0 ? '+' : '−') + '৳' + formatNumber(Math.abs(totals.rounding), totals.rounding % 1 ? 2 : 0)} />
      </div>

      <div className="mx-4 rounded-xl bg-inverse px-4 py-3.5 text-white">
        <p className="text-sm text-[#B7C2CF]">{word('totalPayable')} {showHelper&&<span className="font-bn">· মোট</span>}</p>
        <p data-testid="purchase-net-total" className="mt-0.5 text-right text-[34px] font-semibold leading-tight tracking-tight">
          {taka(totals.total)}
        </p>
        <AmountInWordsDisplay amount={totals.total} variant="inverse" />
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-medium text-ink">{word("payments")} {showHelper&&<span className="font-bn text-xs font-normal text-ink-500">· পেমেন্ট</span>}</p>
            <p className="text-[10.5px] text-ink-400">{word("paymentHint")}</p>
          </div>
          <Button type="button" size="sm" variant="outline"
            onClick={() => props.onPayments((rows) => [...rows, makePurchasePaymentRow(rows.length)])}>
            <Plus className="size-3.5" /> {word("add")}
          </Button>
        </div>

        <div className="space-y-2">
          {payments.map((payment, index) => (
            <div key={payment.id} className="rounded-lg border border-border bg-ink-50/40 p-2">
              <div className="grid grid-cols-[92px_minmax(0,1fr)_28px] gap-1.5">
                <FormSelect aria-label={text('Payment method ' + (index + 1),'পেমেন্টের মাধ্যম ' + (index + 1))} value={payment.method} options={methods.map(method=>({value:method,label:text(method,method==="Cash"?"ক্যাশ":method==="Bank"?"ব্যাংক":method==="Card"?"কার্ড":method)}))}
                  onChange={(event) => changeMethod(payment.id, event.target.value as PurchasePaymentMethod)} />
                <FormSelect aria-label={text('Payment account ' + (index + 1),'পেমেন্টের হিসাব ' + (index + 1))} value={payment.account} options={purchasePaymentAccounts[payment.method]}
                  onChange={(event) => updatePayment(payment.id, { account: event.target.value })} />
                <button type="button" disabled={payments.length === 1}
                  onClick={() => props.onPayments((rows) => rows.filter((row) => row.id !== payment.id))}
                  className="flex size-9 items-center justify-center rounded-md text-helper hover:bg-danger-bg hover:text-danger disabled:opacity-30"
                  aria-label={text('Remove payment ' + (index + 1),'পেমেন্ট সরান ' + (index + 1))}>
                  <Trash2 className="size-3.5" />
                </button>
              </div>
              <div className="mt-1.5 flex items-center gap-1.5">
                <div className="relative min-w-0 flex-1">
                  <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-ink-400">৳</span>
                  <Input ref={index === 0 ? props.paidRef : undefined}
                    aria-label={text('Paid amount ' + (index + 1),'পরিশোধের টাকা ' + (index + 1))}
                    value={payment.amount}
                    onChange={(event) => updatePayment(payment.id, { amount: event.target.value.replace(/[^\d.]/g, '') })}
                    onKeyDown={(event) => event.key === 'Enter' && props.onComplete()}
                    inputMode="decimal" placeholder="0" className="h-9 pl-7 text-right font-medium" />
                </div>
                <button type="button" aria-label={text('Fill remaining payment ' + (index + 1),'বাকি টাকা পূরণ ' + (index + 1))} onClick={() => updatePayment(payment.id,
                  { amount: String(paymentRemainder(totals.total, payments, payment.id)) })}
                  className="h-9 rounded-md border border-border bg-card px-2 text-[10.5px] font-medium text-teal-700 hover:bg-teal-50">
                  {word('remaining')}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button type="button" onClick={() => setSinglePayment(totals.total)}
            className="h-8 rounded-md border border-teal-200 bg-teal-50 px-2.5 text-xs font-medium text-teal-800 hover:bg-teal-100">
            {word('exact')}
          </button>
          {quick.map((amount) => (
            <button key={amount} type="button" onClick={() => setSinglePayment(amount, 'Cash')}
              className="h-8 rounded-md border border-border px-2.5 text-xs font-medium text-ink-700 hover:bg-ink-50">
              ৳{formatNumber(amount)}
            </button>
          ))}
        </div>

        <div className="space-y-1.5 rounded-lg bg-ink-50 p-3">
          <Row label={text("Paid","পরিশোধ")} value={<span className="font-medium">{taka(totals.paidNum)}</span>} />
          <Row label={<span>{text("Supplier due","সরবরাহকারীকে দেনা")} {showHelper&&<span className="font-bn text-xs text-ink-500">বাকি</span>}</span>}
            value={<span className={totals.due > 0 ? 'font-semibold text-danger' : ''}>{taka(totals.due)}</span>} />
          {totals.excess > 0 &&
            <Row label={text("Overpayment","বেশি দেওয়া টাকা")} value={<span className="font-semibold text-danger">{taka(totals.excess)}</span>} />}
        </div>
        {totals.excess > 0 &&
          <p role="alert" className="flex items-start gap-2 rounded-lg bg-warning-bg p-2.5 text-xs text-warning">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
            {text("Purchase payments exceed the supplier bill. Reduce the amount before completing.","সরবরাহকারীর বিলের চেয়ে বেশি টাকা দেওয়া হয়েছে। সম্পন্ন করার আগে টাকা কমান।")}
          </p>}
        <Button type="button" data-erp-workflow-action="complete" onClick={props.onComplete}
          disabled={totals.total <= 0 || totals.excess > 0}
          className="h-12 w-full text-[15px] font-semibold">
          {props.actionLabel ? text(props.actionLabel,props.actionLabel==="Review payment"?"পেমেন্ট যাচাই করুন":props.actionLabel==="Complete purchase"?"ক্রয় সম্পন্ন করুন":props.actionLabel) : text("Complete purchase","ক্রয় সম্পন্ন করুন")} · {taka(totals.total)}
          <kbd className="ml-1 rounded border border-primary-foreground/40 px-1.5 text-[10px] font-medium">F9</kbd>
        </Button>
      </div>
    </section>
  );
}
