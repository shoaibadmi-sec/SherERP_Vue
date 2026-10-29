import {NumericInput} from '../NumericInput';
import {posMoney} from '../../utils/posCheckoutValidation';
import React from 'react';
import { AlertTriangle, ChevronDown, Plus, Trash2 } from 'lucide-react';
import { Button } from '../Button';
import { FormSelect } from '../FormSelect';
import { Input } from '../Input';
import { CustomerPicker } from './CustomerPicker';
import type {
  DiscountMode,
  PosCustomerDetails,
  PosPaymentMethod,
  PosPaymentRow
} from '../../hooks/usePosCart';
import {
  makePosPaymentRow,
  posPaymentAccountsByMethod
} from '../../hooks/usePosCart';
import type { Party } from '../../types/erp';
import { formatNumber, taka } from '../../utils/currency';
import { AmountInWordsDisplay } from '../AmountInWordsDisplay';
import { useUiCopy } from '../../i18n/useUiCopy';
import { InstallmentTermsPanel, type InstallmentTerms } from './InstallmentTermsPanel';

type Totals = {
  subtotal: number;
  discountAmt: number;
  total: number;
  rounding: number;
  roundingLabel?: string;
  paidNum: number;
  due: number;
  change: number;
  itemCount: number;
};

type CheckoutPanelProps = {
  invoice: string;
  totals: Totals;
  customer: Party | null;
  /** Net balance from the Customer ledger before this unsaved sale; positive = due, negative = advance. */
  previousCustomerBalance: number | null;
  onCustomer: (p: Party | null) => void;
  customerDetails: PosCustomerDetails;
  onCustomerDetails: (details: PosCustomerDetails) => void;
  discount: string;
  onDiscount: (v: string) => void;
  discountMode: DiscountMode;
  onDiscountMode: (m: DiscountMode) => void;
  payments: PosPaymentRow[];
  onPayments: React.Dispatch<React.SetStateAction<PosPaymentRow[]>>;
  onComplete: () => void;
  onClear: () => void;
  paidRef: React.RefObject<HTMLInputElement>;
  completeLabel?: string;
  completeRef?: React.RefObject<HTMLButtonElement>;
  validationError?: string;
  availableCredit?: number;
  installment?: InstallmentTerms;
  onQuickAddCustomer?:()=>void;
};

const methods: PosPaymentMethod[] = ['Cash', 'Bank', 'bKash', 'Nagad', 'Card', 'Customer Credit'];

function Row({ label, value, muted = false }: { label: React.ReactNode; value: React.ReactNode; muted?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-3 text-sm ${muted ? 'text-ink-500' : 'text-ink-700'}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

export function CheckoutPanel(props: CheckoutPanelProps) {
  const { totals, customer, customerDetails, discountMode, payments } = props;
  const { language, text, word, showHelper } = useUiCopy();
  const hasCreditCustomer = Boolean(customer || (customerDetails.name.trim() && customerDetails.phone.trim()));
  const dueWithoutCustomer = totals.due > 0 && !hasCreditCustomer && totals.total > 0;
  const quick = [500, 1000, 2000, 5000].filter((n) => n >= totals.total * 0.2);
  const [customerDetailsOpen,setCustomerDetailsOpen] = React.useState(false);
  const customerDetailsId=React.useId();

  const updatePayment = (id: string, patch: Partial<PosPaymentRow>) => {
    props.onPayments((rows) => rows.map((row) => row.id === id ? { ...row, ...patch } : row));
  };

  const changeMethod = (id: string, method: PosPaymentMethod) => {
    props.onPayments((rows) => rows.map((row) => row.id === id ? {
      ...row,
      method,
      account: posPaymentAccountsByMethod[method][0]
    } : row));
  };

  const setSinglePayment = (amount: number, method: PosPaymentMethod = payments[0]?.method ?? 'Cash') => {
    props.onPayments([{
      ...makePosPaymentRow(0, method),
      account: payments[0]?.method === method ? payments[0].account : posPaymentAccountsByMethod[method][0],
      amount: String(amount)
    }]);
  };

  const fillRemaining = (rowId: string) => {
    const otherPaid = payments
      .filter((payment) => payment.id !== rowId)
      .reduce((sum, payment) => sum + (posMoney(payment.amount) || 0), 0);
    updatePayment(rowId, { amount: String(Math.max(totals.total - otherPaid, 0)) });
  };

  const updateDetails = (patch: Partial<PosCustomerDetails>) => {
    props.onCustomerDetails({ ...customerDetails, ...patch });
  };

  return (
    <aside data-pos-checkout aria-label={text('Sale checkout','বিক্রির টাকা নিন')} className="flex min-w-0 flex-col rounded-xl border border-border bg-card shadow-card">
      <div className="space-y-3 border-b border-border p-3.5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-ink">{props.invoice}</p>
            <p className="text-[11px] text-ink-500">06 Oct 2026 · Counter 1</p>
          </div>
          <button onClick={props.onClear} className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-ink-500 hover:bg-danger-bg hover:text-danger">
            <Trash2 className="size-3.5" /> {word("clear")}
          </button>
        </div>

        <div className="flex min-w-0 items-center gap-2">
          <div className="min-w-0 flex-1">
            <CustomerPicker value={customer} onChange={props.onCustomer} previousBalance={props.previousCustomerBalance} />
          </div>
          {props.onQuickAddCustomer && (
            <Button type="button" size="sm" variant="outline" onClick={props.onQuickAddCustomer}
              className="size-10 shrink-0 px-0 text-teal-700"
              aria-label={text('Quick add customer', 'নতুন ক্রেতা যোগ করুন')}
              title={text('Quick add customer', 'নতুন ক্রেতা যোগ করুন')}>
              <Plus className="size-4" />
            </Button>
          )}
        </div>

        {props.installment && <div role="group" aria-label={text('Sale type','বিক্রির ধরন')}
          className="grid grid-cols-2 gap-1 rounded-lg bg-ink-50 p-1 dark:bg-ink-100/10">
          {(['Regular','Installment'] as const).map(mode=>{
            const active=props.installment?.mode===mode;
            return <Button
              key={mode} type="button" variant={active?'default':'outline'}
              aria-pressed={active}
              onClick={()=>props.installment?.onModeChange(mode)}
              className={'h-9 w-full min-w-0 rounded-md px-1 text-[12px] font-semibold '+
                (active?'':'border-primary/15 bg-primary/10 text-teal-700 hover:bg-primary/15')}>
              {mode==='Regular'?text('Regular sale','সাধারণ বিক্রি'):text('Installment sale','কিস্তিতে বিক্রি')}
            </Button>;
          })}
        </div>}

        <section className="rounded-lg border border-border bg-ink-50/50 dark:bg-ink-100/5">
          <button type="button" data-testid="pos-invoice-details-toggle"
            aria-expanded={customerDetailsOpen} aria-controls={customerDetailsId}
            onClick={()=>setCustomerDetailsOpen(open=>!open)}
            className="flex w-full items-center justify-between gap-2 rounded-lg p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-500">
            <span className="min-w-0 flex-1">
              <span className="block text-[12px] font-semibold text-ink">
                {word("invoiceCustomer")}
                {showHelper && <span className="font-bn font-normal text-ink-500"> · ক্রেতার তথ্য</span>}
              </span>
              {!customerDetailsOpen && <span className="mt-0.5 block truncate text-[11px] text-ink-500">
                {customerDetails.name.trim() || customerDetails.phone.trim()
                  ? [customerDetails.name.trim(),customerDetails.phone.trim()].filter(Boolean).join(' · ')
                  : text('Name · Phone · Guardian · Address','নাম · ফোন · অভিভাবক · ঠিকানা')}
              </span>}
            </span>
            <ChevronDown aria-hidden="true" className={'size-4 shrink-0 text-ink-500 transition-transform duration-200 '+
              (customerDetailsOpen?'rotate-180':'')}/>
          </button>
          <div id={customerDetailsId} hidden={!customerDetailsOpen} className="border-t border-border px-3 pb-3 pt-2.5">
            <div data-pos-customer-fields className="grid gap-2 sm:grid-cols-2">
              <Input
                value={customerDetails.name}
                onChange={(event) => updateDetails({ name: event.target.value })}
                placeholder={word("customerName")}
                aria-label={word("customerName")}
                className="h-9"
              />
              <Input
                value={customerDetails.phone}
                onChange={(event) => updateDetails({ phone: event.target.value })}
                placeholder={word("phone")}
                aria-label={word("customerPhone")}
                className="h-9"
              />
              <Input
                value={customerDetails.guardianName}
                onChange={(event) => updateDetails({ guardianName: event.target.value })}
                placeholder={word("guardianName")}
                aria-label={word("guardianName")}
                className="h-9"
              />
              <Input
                value={customerDetails.address}
                onChange={(event) => updateDetails({ address: event.target.value })}
                placeholder={word("address")}
                aria-label={word("customerAddress")}
                className="h-9"
              />
            </div>
            <p className="mt-2 text-[10.5px] text-ink-500">{word("customerOptional")}</p>
          </div>
        </section>
      </div>

      <div className="space-y-2 p-3.5">
        <Row label={text(`Subtotal · ${totals.itemCount} items`, `পণ্যের মোট · ${totals.itemCount}টি`)} value={taka(totals.subtotal, totals.subtotal % 1 ? 2 : 0)} />
        <div className="flex items-center justify-between gap-3 text-sm text-ink-700">
          <span>{word("discount")}</span>
          <div className="flex items-center gap-1">
            <div className="flex h-9 rounded-md bg-ink-50 p-0.5" role="radiogroup" aria-label={word("discount")}>
              {(['amount', 'percent'] as DiscountMode[]).map((mode) => (
                <button
                  key={mode}
                  role="radio"
                  aria-checked={discountMode === mode}
                  onClick={() => props.onDiscountMode(mode)}
                  className={`w-7 rounded text-xs font-medium ${discountMode === mode ? 'bg-card text-ink shadow-card' : 'text-ink-500'}`}>
                  {mode === 'amount' ? '৳' : '%'}
                </button>
              ))}
            </div>
            <NumericInput
              aria-label={word("discount")}
              value={props.discount}
              onChange={(event) => props.onDiscount(event.target.value)}
              placeholder="0"
              inputMode="decimal"
              className="h-9 w-24 rounded-md border border-border px-2 text-right text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>
        </div>
        {totals.discountAmt > 0 && <Row muted label={word("discountApplied")} value={`−${taka(totals.discountAmt, totals.discountAmt % 1 ? 2 : 0)}`} />}
        <Row muted label={language === "Bangla" ? (totals.roundingLabel ? "রাউন্ডিং" : word("rounding")) : (totals.roundingLabel || word("rounding"))} value={`${totals.rounding >= 0 ? '+' : '−'}৳${formatNumber(Math.abs(totals.rounding), totals.rounding % 1 ? 2 : 0)}`} />
      </div>

      <div data-pos-payable className="mx-3.5 rounded-xl border border-teal-200/80 bg-teal-50/50 px-3.5 py-3 text-ink">
        <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
          <span className="text-[13px] text-ink-600">
            {word("totalPayable")} {showHelper && <span className="font-bn">· মোট</span>}
          </span>
          <p className="ml-auto text-right text-[29px] font-semibold leading-tight tracking-tight sm:text-[30px]">{taka(totals.total)}</p>
        </div>
        <AmountInWordsDisplay amount={totals.total} variant="compact" />
      </div>

      {props.installment?.mode==='Installment' && <div className="px-4 pt-4">
        <InstallmentTermsPanel terms={props.installment}
          invoiceTotalPaisa={Math.round(totals.total*100)}
          paidPaisa={Math.round(totals.paidNum*100)}/>
      </div>}
      <div className="space-y-3 p-3.5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-medium text-ink">{word("payments")} {showHelper && <span className="font-bn text-xs font-normal text-ink-500">· পেমেন্ট</span>}</p>
            <p className="text-[10.5px] text-ink-400">{word("paymentHint")}</p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => props.onPayments((rows) => [...rows, makePosPaymentRow(rows.length)])}>
            <Plus className="size-3.5" /> {word("add")}
          </Button>
        </div>

        <div className="space-y-2">
          {payments.map((payment, index) => (
            <div key={payment.id} className="rounded-lg border border-border bg-ink-50/40 p-2">
              <div className="grid grid-cols-[92px_minmax(0,1fr)_28px] gap-1.5">
                <FormSelect
                  aria-label={text(`Payment method ${index+1}`,`পেমেন্টের মাধ্যম ${index+1}`)}
                  value={payment.method}
                  onChange={(event) => changeMethod(payment.id, event.target.value as PosPaymentMethod)}
                  options={methods.map(method => ({ value: method, label: text(method, method === "Cash" ? "ক্যাশ" : method === "Bank" ? "ব্যাংক" : method === "Card" ? "কার্ড" : method === "Customer Credit" ? "ক্রেতার অগ্রিম জমা" : method) }))}
                />
                <FormSelect
                  aria-label={text(`Payment account ${index+1}`,`পেমেন্টের হিসাব ${index+1}`)}
                  value={payment.account}
                  onChange={(event) => updatePayment(payment.id, { account: event.target.value })}
                  options={posPaymentAccountsByMethod[payment.method]}
                />
                <button
                  type="button"
                  disabled={payments.length === 1}
                  onClick={() => props.onPayments((rows) => rows.filter((row) => row.id !== payment.id))}
                  className="flex size-9 items-center justify-center rounded-md text-helper hover:bg-danger-bg hover:text-danger disabled:opacity-30"
                  aria-label={text(`Remove payment ${index + 1}`, `পেমেন্ট ${index + 1} সরান`)}>
                  <Trash2 className="size-3.5" />
                </button>
              </div>
              <div className="mt-1.5 flex items-center gap-1.5">
                <div className="relative min-w-0 flex-1">
                  <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-ink-400">৳</span>
                  <Input
                    ref={index === 0 ? props.paidRef : undefined}
                    value={payment.amount}
                    onChange={(event) => updatePayment(payment.id, { amount: event.target.value })}
                    onKeyDown={(event) => {if(event.key === 'Enter'&&!props.validationError&&!dueWithoutCustomer&&totals.total>0)props.onComplete();}}
                    inputMode="decimal"
                    placeholder="0"
                    className="h-9 pl-7 text-right font-medium"
                    aria-label={text(`Payment amount ${index + 1}`, `পেমেন্টের পরিমাণ ${index + 1}`)}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => fillRemaining(payment.id)}
                  className="h-9 rounded-md border border-border bg-card px-2 text-[10.5px] font-medium text-teal-700 hover:bg-teal-50">
                  {word("remaining")}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {props.installment?.mode!=='Installment' && <button onClick={() => setSinglePayment(totals.total)} className="h-9 rounded-md border border-teal-200 bg-teal-50 px-2.5 text-xs font-medium text-teal-800 hover:bg-teal-100">
            {word("exact")}
          </button>}
          {quick.map((amount) => (
            <button key={amount} onClick={() => setSinglePayment(amount, 'Cash')} className="h-9 rounded-md border border-border px-2.5 text-xs font-medium text-ink-700 hover:bg-ink-50">
              ৳{formatNumber(amount)}
            </button>
          ))}
        </div>

        <div className="space-y-1.5 rounded-lg bg-ink-50 p-3">
          <Row label={word("paid")} value={<span className="font-medium">{taka(totals.paidNum)}</span>} />
          <Row label={word("changeToReturn")} value={<span className={totals.change > 0 ? 'font-semibold text-success' : ''}>{taka(totals.change)}</span>} />
          <Row label={<span>{word("due")} {showHelper && <span className="font-bn text-xs text-ink-500">বাকি</span>}</span>} value={<span className={totals.due > 0 ? 'font-semibold text-danger' : ''}>{taka(totals.due)}</span>} />
        </div>
        {payments.some(row=>row.method==='Customer Credit')&&<p className="text-xs text-ink-500">
          {text('Verified customer credit available','ক্রেতার যাচাই করা অগ্রিম জমা')}: {taka(props.availableCredit??0)}.
          {' '}{text('Preview only; this does not spend the credit.','শুধু প্রিভিউ; এতে জমা টাকা খরচ হবে না।')}
        </p>}
        {props.validationError&&<p role="alert" className="rounded-lg bg-danger-bg p-2.5 text-xs text-danger">{props.validationError}</p>}

        {dueWithoutCustomer && (
          <div className="flex items-start gap-2 rounded-lg bg-warning-bg p-2.5 text-xs text-warning" role="status">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
            <div className="min-w-0">
              <p>{text("Enter customer name + phone, or select an existing customer, to record", "বাকি রাখতে ক্রেতার নাম ও ফোন দিন অথবা আগের ক্রেতা বাছুন। বাকি টাকা:")} {taka(totals.due)} {language !== "Bangla" && "as due."}</p>
              {!customerDetailsOpen && <button type="button" onClick={()=>setCustomerDetailsOpen(true)}
                className="mt-1.5 rounded-sm font-semibold underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning">
                {text('Enter customer details','ক্রেতার তথ্য দিন')}
              </button>}
            </div>
          </div>
        )}

        <Button
          data-erp-workflow-action="complete"
          ref={props.completeRef}
          onClick={props.onComplete}
          disabled={totals.total === 0 || dueWithoutCustomer || Boolean(props.validationError) || (props.installment?.mode==='Installment' && !customer)}
          className="h-12 w-full text-[15px] font-semibold disabled:bg-ink-100 disabled:text-ink-600 disabled:opacity-100">
          {props.completeLabel ?? word('completeSale')} · {taka(totals.total)}
          <kbd className="ml-1 rounded border border-primary-foreground/40 px-1.5 text-[10px] font-medium">F9</kbd>
        </Button>
      </div>
    </aside>
  );
}

