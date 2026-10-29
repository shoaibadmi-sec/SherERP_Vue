import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {useUiCopy} from '../../i18n/useUiCopy';
import { Plus, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../Dialog';
import { Button } from '../Button';
import { Input } from '../Input';
import { FormSelect } from '../FormSelect';
import { QuickAddSelect } from '../QuickAddSelect';
import { PhotoUploader } from '../products/PhotoUploader';
import { parties } from '../../data/parties';
import { availableParties, availableExpenseCategories, createPreviewParty, createPreviewExpenseCategory } from '../../data/erpDemoStore';
import { products } from '../../data/products';
import { stockLots } from '../../data/productInventory';
import { salesInvoices } from '../../data/sales';
import { expenseCategories } from '../../data/purchases';
import type { Expense, Party, PaymentMethod, PaymentSplit, Product, Purchase } from '../../types/erp';
import { AppDatePicker } from '../AppDateRangePicker';
import { businessToday, expenseDateIso } from '../../utils/dateRange';
import { validateBusinessDate, toPaisa } from '../../utils/partyPayment';
import { taka } from '../../utils/currency';
import { AmountInWordsDisplay } from '../AmountInWordsDisplay';
import { duplicateSerials, normalizeSerials, requiredSerialCount } from '../../utils/productFeatures';

type BillDialogProps = {
  mode: 'purchase' | 'expense';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nextRef: string;
  onSavePurchase: (p: Purchase) => void;
  onSaveExpense: (e: Expense) => void;
  expense?: Expense | null;
  onSaveCorrection?: (e: Expense, reason: string) => void;
};

type PurchaseLine = {
  id: string;
  productId: string;
  bigQty: string;
  smallQty: string;
  unitCost: string;
  serialText: string;
  batchNumber: string;
  manufactureDate: string;
  expiryDate: string;
};

type StandardPaymentMethod = Exclude<PaymentMethod, 'Customer Credit'>;

type PaymentRow = {
  id: string;
  method: StandardPaymentMethod;
  account: string;
  accountId?:string;
  amount: string;
};

const suppliers = parties.filter((p) => p.roles.some((r) => r === 'Supplier' || r === 'Vendor'));
const payees = parties.filter((p) => p.roles.some((r) => r === 'Payee' || r === 'Vendor'));
const methods: StandardPaymentMethod[] = ['Cash', 'bKash', 'Nagad', 'Bank', 'Card'];
const accountsByMethod: Record<StandardPaymentMethod, string[]> = {
  Cash: ['Cash counter'],
  Bank: ['Dutch-Bangla Bank · 4582'],
  Card: ['Dutch-Bangla Bank · 4582'],
  bKash: ['bKash Business · 01711•••412'],
  Nagad: ['Nagad Merchant · 01819•••771'],
  'Mobile Banking': []
};
const stockProducts = products.filter((product) => product.kind !== 'Service');

function productFor(line: PurchaseLine): Product {
  return stockProducts.find((product) => product.id === line.productId) ?? stockProducts[0];
}

function lineBaseQty(line: PurchaseLine): number {
  const product = productFor(line);
  const big = parseFloat(line.bigQty) || 0;
  const small = parseFloat(line.smallQty) || 0;
  return product.altUnit ? big * product.altUnit.factor + small : small;
}

function lineTotal(line: PurchaseLine): number {
  return lineBaseQty(line) * (parseFloat(line.unitCost) || 0);
}

function quantityLabel(line: PurchaseLine): string {
  const product = productFor(line);
  const big = parseFloat(line.bigQty) || 0;
  const small = parseFloat(line.smallQty) || 0;
  if (!product.altUnit) return `${small || 0} ${product.unit}`;
  const parts: string[] = [];
  if (big) parts.push(`${big} ${product.altUnit.unit}`);
  if (small) parts.push(`${small} ${product.unit}`);
  return parts.length ? parts.join(' ') : `0 ${product.unit}`;
}

function newPaymentRow(seedIndex = 0, method: StandardPaymentMethod = 'Cash'): PaymentRow {
  return {
    id: `payment-${Date.now()}-${seedIndex}`,
    method,
    account: accountsByMethod[method][0]??'',
    amount: ''
  };
}

function newLine(seedIndex = 1): PurchaseLine {
  const product = stockProducts[seedIndex % stockProducts.length];
  return {
    id: `line-${Date.now()}-${seedIndex}`,
    productId: product.id,
    bigQty: product.altUnit ? '1' : '',
    smallQty: product.altUnit ? '0' : '1',
    unitCost: String(product.purchasePrice),
    serialText: '',
    batchNumber: '',
    manufactureDate: '',
    expiryDate: ''
  };
}

export function BillDialog({ mode, open, onOpenChange, nextRef, onSavePurchase, onSaveExpense, expense, onSaveCorrection }: BillDialogProps) {
  const {text,word,showHelper}=useUiCopy();
  const today = businessToday();
  const [party, setParty] = useState(mode === 'purchase' ? suppliers[0].name : payees[0].name);
  const [partyOptions, setPartyOptions] = useState<Party[]>(() => availableParties().filter((item) => item.roles.some((role) => mode === 'purchase' ? role === 'Supplier' || role === 'Vendor' : role === 'Payee' || role === 'Vendor')));
  const [categoryOptions, setCategoryOptions] = useState(availableExpenseCategories);
  const [category, setCategory] = useState(expenseCategories[2]);
  const [date, setDate] = useState(today);
  const [backdateReason, setBackdateReason] = useState('');
  const [description, setDescription] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentRows, setPaymentRows] = useState<PaymentRow[]>([newPaymentRow()]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [lines, setLines] = useState<PurchaseLine[]>([newLine()]);
  const [error, setError] = useState('');
  const [correctionReason, setCorrectionReason] = useState('');
  const [review, setReview] = useState(false);
  useEffect(() => { setReview(false); }, [amount, paymentRows, party, category, date, description, notes, photos, correctionReason]);
  // Initialize source values before the correction dialog becomes visible.
  useLayoutEffect(() => {
    if (!open) return;
    const options = availableParties().filter(item => item.status !== 'Inactive' && item.roles.some(role => mode === 'purchase' ? role === 'Supplier' || role === 'Vendor' : role === 'Payee' || role === 'Vendor'));
    const categories = availableExpenseCategories();
    setPartyOptions(options); setCategoryOptions(categories); setError(''); setCorrectionReason('');
    setDate(expense ? expenseDateIso(expense.date) : businessToday()); setBackdateReason('');
    setParty(expense?.payee ?? options[0]?.name ?? '');
    setCategory(expense?.category ?? categories[0] ?? '');
    setDescription(expense?.note ?? ''); setReferenceNo(''); setNotes('');
    setAmount(expense ? String(expense.amount) : ''); setPhotos(expense?.receipt ? [expense.receipt] : []);
    const payments = expense?.payments?.length ? expense.payments : expense && expense.paid > 0 ? [{ id: 'legacy-' + expense.id, method: expense.method, amount: expense.paid, account: '' }] : [];
    setPaymentRows(payments.length ? payments.map(row => ({ id: row.id, method: row.method as StandardPaymentMethod, amount: String(row.amount), account: row.account ?? '', accountId:'accountId' in row?row.accountId:undefined })) : [newPaymentRow()]);
  }, [open, expense, mode]);

  const isBackdated = date < today && !expense;
  const list = partyOptions;
  const purchaseTotal = useMemo(() => lines.reduce((sum, line) => sum + lineTotal(line), 0), [lines]);
  const totalNum = mode === 'purchase' ? purchaseTotal : parseFloat(amount) || 0;
  const paymentTotal = paymentRows.reduce((sum, row) => sum + Math.round((Number(row.amount) || 0) * 100), 0) / 100;
  const paidNum = Math.min(paymentTotal, totalNum);
  const due = Math.max(totalNum - paidNum, 0);
  const overpaid = Math.max(paymentTotal - totalNum, 0);

  const updatePayment = (id: string, patch: Partial<PaymentRow>) => {
    setPaymentRows((rows) => rows.map((row) => row.id === id ? { ...row, ...patch } : row));
  };
  const originalPayment=(row:PaymentRow)=>expense?.payments?.find(saved=>saved.id===row.id&&saved.method===row.method);
  const paymentAccountOptions=(row:PaymentRow)=>{
    const saved=originalPayment(row);
    return [...new Set([...accountsByMethod[row.method],...(saved?.account?[saved.account]:[])])];
  };

  const changePaymentMethod = (id: string, method: StandardPaymentMethod) => {
    setPaymentRows((rows) => rows.map((row) => row.id === id ? {
      ...row,
      method,
      account: accountsByMethod[method][0]??'',accountId:undefined
    } : row));
  };

  const paymentSplits: PaymentSplit[] = paymentRows
    .filter((row) => (parseFloat(row.amount) || 0) > 0)
    .map((row) => ({
      id: row.id,
      method: row.method,
      amount: parseFloat(row.amount),
      ...(row.accountId?{accountId:row.accountId}:{}),
      ...(row.account ? { account: row.account } : {})
    }));

  const updateLine = (id: string, patch: Partial<PurchaseLine>) => {
    setLines((current) => current.map((line) => line.id === id ? { ...line, ...patch } : line));
  };

  const changeLineProduct = (id: string, name: string) => {
    const product = stockProducts.find((item) => item.name === name) ?? stockProducts[0];
    setLines((current) =>
      current.map((line) =>
        line.id === id
          ? {
              ...line,
              productId: product.id,
              bigQty: product.altUnit ? '1' : '',
              smallQty: product.altUnit ? '0' : '1',
              unitCost: String(product.purchasePrice),
              serialText: '',
              batchNumber: '',
              manufactureDate: '',
              expiryDate: ''
            }
          : line
      )
    );
  };

  const reset = () => {
    setDate(today);
    setBackdateReason('');
    setDescription('');
    setReferenceNo('');
    setNotes('');
    setAmount('');
    setPaymentRows([newPaymentRow()]);
    setPhotos([]);
    setLines([newLine()]);
    setError('');
  };

  const save = () => {
    try {
      validateBusinessDate(date);
      if (mode === 'expense') toPaisa(Number(amount), 'Expense amount');
      toPaisa(totalNum, 'Amount');
      for (const row of paymentRows) {
        if (!row.amount.trim()) continue;
        toPaisa(Number(row.amount), 'Payment');
        if (Number(row.amount) > 0 && !paymentAccountOptions(row).includes(row.account)) throw new Error(text('Choose a valid payment account.','সঠিক পেমেন্টের হিসাব বাছুন।'));
      }
      if (!party.trim() || !category.trim()) throw new Error(text('Choose a payee and category.','প্রাপক ও খরচের ধরন বাছুন।'));
      if (expense && !correctionReason.trim()) throw new Error(text('Enter a reason for the correction.','সংশোধনের কারণ লিখুন।'));
    } catch (e) { setError(e instanceof Error ? e.message : text('Review the entered amounts.','টাকার পরিমাণগুলো আবার দেখুন।')); return; }
    if (!totalNum) {
      setError(mode === 'purchase' ? text('Add at least one purchase item with quantity and cost.','অন্তত একটি পণ্যের পরিমাণ ও কেনা দাম দিন।') : text('Enter the expense amount.','খরচের টাকা লিখুন।'));
      return;
    }
    if (isBackdated && !backdateReason.trim()) {
      setError(text('Enter a reason for the backdated transaction.','আগের তারিখে লেখার কারণ দিন।'));
      return;
    }
    if (paymentTotal > totalNum) {
      setError(text(`Payments exceed the transaction total by ${taka(paymentTotal - totalNum)}.`,`মোট টাকার চেয়ে ${taka(paymentTotal - totalNum)} বেশি পরিশোধ হয়েছে।`));
      return;
    }

    if (mode === 'expense' && !review) {setError('');setReview(true);return;}
    const selectedParty = list.find((item) => item.name === party);
    if (!selectedParty && !expense) { setError(text('Choose an active payee or supplier.','চালু প্রাপক বা সরবরাহকারী বাছুন।')); return; }
    if (mode === 'purchase') {
      const existingSerials = [
        ...stockLots.flatMap((lot) => lot.serials ?? []),
        ...salesInvoices.flatMap((invoice) => invoice.lines.flatMap((line) => line.serials ?? []))
      ];
      const enteredAcrossLines: string[] = [];
      for (const line of lines.filter((item) => lineBaseQty(item) > 0)) {
        const product = productFor(line);
        const serials = normalizeSerials(line.serialText);
        const duplicate = duplicateSerials(serials, [...existingSerials, ...enteredAcrossLines]);
        if (duplicate.length) {
          setError(`${product.name}: duplicate serial ${duplicate[0]}.`);
          return;
        }
        const required = requiredSerialCount(product, lineBaseQty(line));
        if (required > 0 && !Number.isInteger(lineBaseQty(line))) {
          setError(`${product.name}: Required serial tracking needs a whole base-unit quantity.`);
          return;
        }
        if (required > 0 && serials.length !== required) {
          setError(`${product.name}: ${required} unique serials required, ${serials.length} entered.`);
          return;
        }
        if (product.expiry?.enabled && product.expiry.dateRequired && !line.expiryDate) {
          setError(`${product.name}: expiry date is required.`);
          return;
        }
        if (line.manufactureDate && line.expiryDate && line.expiryDate <= line.manufactureDate) {
          setError(`${product.name}: expiry date must be after manufacture date.`);
          return;
        }
        enteredAcrossLines.push(...serials);
      }
      const items = lines
        .filter((line) => lineBaseQty(line) > 0)
        .map((line) => `${productFor(line).name} · ${quantityLabel(line)}`)
        .join(', ');

      onSavePurchase({
        id: `pu${Date.now()}`,
        ref: nextRef,
        date: new Date(date + 'T12:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        supplierId: selectedParty?.id ?? '',
        supplier: party,
        items: items || 'Items not itemised',
        total: totalNum,
        paid: paidNum,
        payments: paymentSplits,
        receipt: photos[0],
        inventoryLines: lines
          .filter((line) => lineBaseQty(line) > 0)
          .map((line) => ({
            productId: line.productId,
            quantity: lineBaseQty(line),
            serials: normalizeSerials(line.serialText).length ? normalizeSerials(line.serialText) : undefined,
            batchNumber: line.batchNumber.trim() || undefined,
            manufactureDate: line.manufactureDate || undefined,
            expiryDate: line.expiryDate || undefined
          }))
      });
    } else {
      const combinedNote = [description, referenceNo ? `Ref: ${referenceNo}` : '', notes].filter(Boolean).join(' · ');
      const saved: Expense = {
        ...expense,
        id: expense?.id ?? `e${Date.now()}`,
        ref: expense?.ref ?? nextRef,
        date: new Date(date + 'T12:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        category,
        payee: party,
        payeeId: selectedParty?.id ?? (expense?.payee === party ? expense.payeeId : undefined),
        note: combinedNote || 'Expense',
        amount: totalNum,
        paid: paidNum,
        method: paymentSplits[0]?.method ?? 'Cash',
        payments: paymentSplits,
        receipt: photos[0],
        backdateReason: expense?.backdateReason ?? (isBackdated ? backdateReason.trim() : undefined)
      };
      try {
        if (expense && onSaveCorrection) {
          if (!review) { setReview(true); setError(''); return; }
          onSaveCorrection(saved, correctionReason);
        } else onSaveExpense(saved);
      } catch (e) { setError(e instanceof Error ? e.message : text('Could not save the expense.','খরচ সংরক্ষণ করা যায়নি।')); return; }
    }

    reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent role="dialog" aria-label={mode === 'purchase' ? text('New purchase','নতুন ক্রয়') : expense ? text('Correct expense','খরচ সংশোধন') : text('Add expense','খরচ যোগ করুন')} className={mode === 'purchase' ? 'max-h-[92vh] overflow-y-auto sm:max-w-4xl scrollbar-thin' : 'max-h-[92vh] overflow-y-auto sm:max-w-2xl scrollbar-thin'}>
        <DialogHeader>
          <DialogTitle>
            {mode === 'purchase' ? text('New purchase','নতুন ক্রয়') : expense ? text('Correct expense','খরচ সংশোধন') : text('Add expense','খরচ যোগ করুন')}{' '}
            {showHelper&&<span className="font-bn text-sm font-normal text-ink-500">{mode === 'purchase' ? 'ক্রয়' : 'খরচ'}</span>}
          </DialogTitle>
          <DialogDescription>
            {expense?.ref ?? nextRef} · {text('UI preview. Cash and ledger posting require backend integration.','শুধু প্রিভিউ। ক্যাশ ও খাতায় আসল লেনদেনের জন্য সার্ভার সংযোগ দরকার।')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="block text-[13px] font-medium text-ink">
            {mode === 'purchase' ? text('Supplier','সরবরাহকারী') : text('Payee','টাকা প্রাপক')}
            <div className="mt-1.5">
              <QuickAddSelect label={mode === 'purchase' ? text('Supplier','সরবরাহকারী') : text('Payee','টাকা প্রাপক')} value={party} options={list.map((item) => item.name)} onChange={setParty} showContact
                onCreate={(name, phone, area) => {
                  const newParty: Party = { id: 'quick-' + Date.now(), name, phone, area, roles: [mode === 'purchase' ? 'Supplier' : 'Payee'], balance: 0, lastActivity: 'Just now', avatarColor: '#0D7C74' };
                  createPreviewParty(newParty);
                  setPartyOptions((items) => [...items, newParty]);
                  setParty(name);
                }} />
            </div>
          </div>

          <label className="block text-[13px] font-medium text-ink">
            {mode === 'purchase' ? text('Purchase date','কেনার তারিখ') : text('Expense date','খরচের তারিখ')}
            <AppDatePicker className="mt-1.5" label={mode === 'purchase' ? text('Purchase date','কেনার তারিখ') : text('Expense date','খরচের তারিখ')} value={date} onChange={setDate} />
          </label>

          {isBackdated && (
            <label className="block text-[13px] font-medium text-ink sm:col-span-2">
              {text('Reason for backdating','আগের তারিখে লেখার কারণ')} <span className="text-danger">*</span>
              <Input
                className="mt-1.5"
                value={backdateReason}
                onChange={(event) => setBackdateReason(event.target.value)}
                placeholder={text("Why is this transaction being entered with an earlier date?","আগের তারিখ দেওয়ার কারণ লিখুন")}
              />
            </label>
          )}
        </div>

        {mode === 'purchase' ? (
          <div className="overflow-hidden rounded-xl border border-border">
            <div className="flex items-center justify-between border-b border-border bg-ink-50/60 px-3 py-2">
              <div>
                <p className="text-[13px] font-medium text-ink">{word('products')}</p>
                <p className="text-[11px] text-ink-500">{text('Purchase in large + small units where a conversion exists.','বড় ও ছোট একক থাকলে দুটোতেই পণ্য কিনতে পারবেন।')}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setLines((current) => [...current, newLine(current.length + 1)])}>
                <Plus className="size-4" /> {text('Add product','পণ্য যোগ করুন')}
              </Button>
            </div>

            <div className="divide-y divide-border">
              {lines.map((line, index) => {
                const product = productFor(line);
                const total = lineTotal(line);
                return (
                  <div key={line.id} className="grid gap-2 p-3 lg:grid-cols-[1.7fr_1.25fr_120px_120px_32px] lg:items-end">
                    <label className="text-[12px] font-medium text-ink">
                      {index + 1}. Product
                      <FormSelect
                        className="mt-1"
                        value={product.name}
                        onChange={(event) => changeLineProduct(line.id, event.target.value)}
                        options={stockProducts.filter((item) => item.active).map((item) => item.name)}
                      />
                    </label>

                    <div>
                      <p className="text-[12px] font-medium text-ink">Quantity</p>
                      <div className="mt-1 flex gap-1.5">
                        {product.altUnit && (
                          <div className="relative min-w-0 flex-1">
                            <Input
                              value={line.bigQty}
                              onChange={(event) => updateLine(line.id, { bigQty: event.target.value.replace(/[^\d.]/g, '') })}
                              inputMode="decimal"
                              className="pr-14 text-right"
                            />
                            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-ink-400">{product.altUnit.unit}</span>
                          </div>
                        )}
                        <div className="relative min-w-0 flex-1">
                          <Input
                            value={line.smallQty}
                            onChange={(event) => updateLine(line.id, { smallQty: event.target.value.replace(/[^\d.]/g, '') })}
                            inputMode="decimal"
                            className="pr-12 text-right"
                          />
                          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-ink-400">{product.unit}</span>
                        </div>
                      </div>
                    </div>

                    <label className="text-[12px] font-medium text-ink">
                      Unit cost
                      <div className="relative mt-1">
                        <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-ink-400">৳</span>
                        <Input
                          value={line.unitCost}
                          onChange={(event) => updateLine(line.id, { unitCost: event.target.value.replace(/[^\d.]/g, '') })}
                          inputMode="decimal"
                          className="pl-6 text-right"
                        />
                      </div>
                    </label>

                    <div className="text-right">
                      <p className="text-[12px] font-medium text-ink">Line total</p>
                      <p className="mt-2 h-9 py-2 text-[13px] font-semibold text-ink">{taka(total)}</p>
                    </div>

                    <button
                      type="button"
                      disabled={lines.length === 1}
                      className="mb-0.5 flex size-8 items-center justify-center rounded-md text-ink-400 hover:bg-danger-bg hover:text-danger disabled:cursor-not-allowed disabled:opacity-30"
                      onClick={() => setLines((current) => current.filter((item) => item.id !== line.id))}>
                      <Trash2 className="size-4" />
                      <span className="sr-only">Remove line</span>
                    </button>

                    {((product.serialTracking ?? 'Off') !== 'Off' || product.expiry?.enabled) && (
                      <div className="rounded-lg border border-border bg-ink-50/40 p-2.5 lg:col-span-5">
                        <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-ink-400">Tracking details <span className="font-bn normal-case tracking-normal">· সিরিয়াল / মেয়াদ</span></p>
                        <div className="grid gap-2 md:grid-cols-2">
                          {(product.serialTracking ?? 'Off') !== 'Off' && (
                            <label className="text-[12px] font-medium text-ink">
                              Serials
                              <textarea
                                value={line.serialText}
                                onChange={(event) => updateLine(line.id, { serialText: event.target.value })}
                                placeholder="Scan, type or paste serials"
                                className="mt-1 min-h-20 w-full rounded-md border border-input bg-card px-2.5 py-2 text-xs focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                              />
                              <span className="mt-1 block text-[11px] font-normal text-ink-400">
                                {normalizeSerials(line.serialText).length} entered{product.serialTracking === 'Required' ? ` · ${requiredSerialCount(product, lineBaseQty(line))} required` : ' · optional'}
                              </span>
                            </label>
                          )}
                          {product.expiry?.enabled && (
                            <div className="grid grid-cols-2 gap-2">
                              <label className="text-[12px] font-medium text-ink">Batch<Input className="mt-1" value={line.batchNumber} onChange={(event) => updateLine(line.id, { batchNumber: event.target.value })} /></label>
                              <label className="text-[12px] font-medium text-ink">Manufacture<Input className="mt-1" type="date" value={line.manufactureDate} onChange={(event) => updateLine(line.id, { manufactureDate: event.target.value })} /></label>
                              <label className="col-span-2 text-[12px] font-medium text-ink">Expiry {product.expiry.dateRequired && <span className="text-danger">*</span>}<Input className="mt-1" type="date" value={line.expiryDate} onChange={(event) => updateLine(line.id, { expiryDate: event.target.value })} /></label>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between border-t border-border bg-ink-50/60 px-3 py-2">
              <span className="text-xs text-ink-500">{text(String(lines.length)+' product line'+(lines.length===1?'':'s'),String(lines.length)+'টি পণ্য')}</span>
              <span className="text-sm font-semibold text-ink">{text('Purchase total','ক্রয়ের মোট')} · {taka(purchaseTotal)}</span>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="block text-[13px] font-medium text-ink">
              {text('Expense category','খরচের ধরন')}
              <div className="mt-1.5">
                <QuickAddSelect label={text("Expense category","খরচের ধরন")} value={category} options={categoryOptions} onChange={setCategory}
                  onCreate={(name) => {
                    createPreviewExpenseCategory(name);
                    setCategoryOptions((items) => [...items, name]);
                    setCategory(name);
                  }} />
              </div>
            </div>

            <label className="block text-[13px] font-medium text-ink">
              {text('Amount','টাকার পরিমাণ')}
              <div className="relative mt-1.5">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-400">৳</span>
                <Input
                  aria-label={text("Expense amount","খরচের টাকা")}
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  className="pl-7 text-right"
                  inputMode="decimal"
                  placeholder="0"
                />
              </div>
            </label>

            <label className="block text-[13px] font-medium text-ink sm:col-span-2">
              {text('Description / remarks','খরচের বিবরণ / মন্তব্য')}
              <Input
                className="mt-1.5"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder={text("e.g. Pickup — Bangshal to shop (3 trips)","যেমন: বঙ্গশাল থেকে দোকানে পণ্য আনা, ৩ বার")}
              />
            </label>

            <label className="block text-[13px] font-medium text-ink">
              {text('Reference no.','রেফারেন্স নম্বর')}
              <Input className="mt-1.5" value={referenceNo} onChange={(event) => setReferenceNo(event.target.value)} placeholder={text("Optional bill, voucher or memo no.","বিল বা ভাউচার নম্বর (ঐচ্ছিক)")} />
            </label>

            <label className="block text-[13px] font-medium text-ink">
              {text('Notes','মন্তব্য')}
              <Input className="mt-1.5" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder={text("Optional internal note","মন্তব্য (ঐচ্ছিক)")} />
            </label>
          </div>
        )}

        <section className="overflow-hidden rounded-xl border border-border">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-ink-50/60 px-3 py-2">
            <div>
              <p className="text-[13px] font-medium text-ink">
                {word('payments')} {showHelper&&<span className="font-bn text-[11px] font-normal text-ink-400">· পেমেন্ট</span>}
              </p>
              <p className="text-[11px] text-ink-500">{text('Use one or multiple payment sources for this transaction.','এক বা একাধিক মাধ্যম থেকে টাকা দিতে পারবেন।')}</p>
            </div>
            <div className="flex gap-2">
              {totalNum > 0 && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setPaymentRows([{
                    ...newPaymentRow(0, paymentRows[0]?.method ?? 'Cash'),
                    account: paymentRows[0]?.account ?? accountsByMethod[paymentRows[0]?.method ?? 'Cash'][0],
                    amount: String(totalNum)
                  }])}>
                  {text('Pay full','পুরো টাকা দিন')}
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setPaymentRows((rows) => [...rows, newPaymentRow(rows.length)])}>
                <Plus className="size-4" /> {text('Add source','আরও মাধ্যম')}
              </Button>
            </div>
          </div>

          <div className="divide-y divide-border">
            {paymentRows.map((row, index) => (
              <div key={row.id} className="grid gap-2 p-3 sm:grid-cols-[140px_minmax(0,1fr)_140px_32px] sm:items-end">
                <label className="text-[12px] font-medium text-ink">
                  {index + 1}. {text('Method','মাধ্যম')}
                  <FormSelect
                    className="mt-1"
                    value={row.method}
                    onChange={(event) => changePaymentMethod(row.id, event.target.value as StandardPaymentMethod)}
                    options={[...methods,...(expense?.payments?.some(p=>p.method==='Mobile Banking')?['Mobile Banking' as const]:[])].map(method=>({value:method,label:text(method,method==='Cash'?'ক্যাশ':method==='Bank'?'ব্যাংক':method==='Card'?'কার্ড':method==='Mobile Banking'?'মোবাইল ব্যাংকিং':method)}))}
                  />
                </label>

                <label className="text-[12px] font-medium text-ink">
                  {text('Account','হিসাব')}
                  <FormSelect
                    className="mt-1"
                    value={row.account}
                    onChange={(event) => updatePayment(row.id, { account: event.target.value,accountId:originalPayment(row)?.account===event.target.value?originalPayment(row)?.accountId:undefined })}
                    options={paymentAccountOptions(row)}
                  />
                </label>

                <label className="text-[12px] font-medium text-ink">
                  {text('Amount','টাকা')}
                  <div className="relative mt-1">
                    <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-ink-400">৳</span>
                    <Input
                      aria-label={text(`Payment amount ${index + 1}`,`পেমেন্টের টাকা ${index + 1}`)}
                      value={row.amount}
                      onChange={(event) => updatePayment(row.id, { amount: event.target.value })}
                      inputMode="decimal"
                      className="pl-6 text-right"
                      placeholder="0"
                    />
                  </div>
                </label>

                <button
                  type="button"
                  disabled={paymentRows.length === 1}
                  onClick={() => setPaymentRows((rows) => rows.filter((item) => item.id !== row.id))}
                  className="mb-0.5 flex size-8 items-center justify-center rounded-md text-ink-400 hover:bg-danger-bg hover:text-danger disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label={text(`Remove payment source ${index + 1}`,`পেমেন্টের মাধ্যম ${index + 1} সরান`)}>
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-px border-t border-border bg-ink-100 text-center text-[12px]">
            <div className="bg-ink-50 px-3 py-2">
              <p className="text-ink-400">{word('total')}</p>
              <p className="mt-0.5 font-semibold text-ink">{taka(totalNum)}</p>
            </div>
            <div className="bg-ink-50 px-3 py-2">
              <p className="text-ink-400">{text('Paid','পরিশোধ')}</p>
              <p className="mt-0.5 font-semibold text-ink">{taka(paymentTotal)}</p>
            </div>
            <div className="bg-ink-50 px-3 py-2">
              <p className="text-ink-400">{overpaid > 0 ? text('Over','বেশি') : text('Due','বাকি')}</p>
              <p className={`mt-0.5 font-semibold ${overpaid > 0 || due > 0 ? 'text-danger' : 'text-success'}`}>
                {taka(overpaid > 0 ? overpaid : due)}
              </p>
            </div>
          </div>
          <AmountInWordsDisplay amount={totalNum} />
        </section>

        {mode === 'purchase' && (
          <label className="block text-[13px] font-medium text-ink">
            Notes
            <Input className="mt-1.5" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder={text("Supplier memo note, delivery note or internal remark","সরবরাহকারীর বিল বা ডেলিভারির মন্তব্য")} />
          </label>
        )}

        {totalNum > 0 && due > 0 && (
          <div className="flex items-center justify-between rounded-lg bg-warning-bg px-3 py-2 text-sm">
            <span className="text-warning">{mode === 'purchase' ? text(`Due to ${party}`,`${party}-কে দেনা`) : text('Unpaid expense amount','খরচের বাকি টাকা')}</span>
            <span className="font-semibold text-warning">{taka(due)}</span>
          </div>
        )}

        <div>
          <p className="mb-1.5 text-[13px] font-medium text-ink">
            {mode === 'purchase' ? text('Supplier memo / receipt','সরবরাহকারীর বিল / রসিদ') : text('Expense receipt','খরচের রসিদ')}{' '}
            {showHelper&&<span className="font-normal text-ink-400">· রসিদের ছবি</span>}
          </p>
          <PhotoUploader
            photos={photos}
            onChange={setPhotos}
            max={2}
            label={text("Attach","ছবি যোগ করুন")}
            hint={mode === 'purchase' ? text('Supplier memo, cash receipt or delivery challan.','সরবরাহকারীর বিল, ক্যাশ রসিদ বা চালান।') : text('Bill, voucher or payment receipt.','বিল, ভাউচার বা টাকার রসিদ।')}
          />
        </div>

        {expense && <label className="block space-y-1 text-xs font-medium text-ink">{text('Reason for correction · কেন পরিবর্তন','কেন সংশোধন করছেন')}
          <Input aria-label={text("Expense correction reason","খরচ সংশোধনের কারণ")} value={correctionReason} onChange={event => setCorrectionReason(event.target.value)} />
        </label>}
        {error && <p className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger" role="alert">{error}</p>}
        {mode === 'expense' && review && <section aria-label={text("Expense correction impact","খরচ সংশোধনের হিসাব")} className="space-y-2 rounded-lg border border-border bg-ink-50 p-3 text-xs">
          <p className="font-semibold text-ink">{text('Review expense before recording · নিশ্চিত করুন','খরচ লেখার আগে যাচাই করুন')}</p>
          <p className="text-lg font-semibold">{taka(totalNum)}</p><AmountInWordsDisplay amount={totalNum} />
          <p>{text('Paid','পরিশোধ')} {taka(paymentTotal)} · {text('Due','বাকি')} {taka(due)}</p>
          <p>{expense ? expense.payee + ' → ' : ''}{party} · {category}</p>
          {expense && <p>{text('Previous amount','আগের টাকা')} {taka(expense.amount)} · {text('Reason','কারণ')}: {correctionReason}</p>}
          <p className="text-ink-500">{text('Preview only. No bank or backend ledger is posted.','শুধু প্রিভিউ। আসল ব্যাংক বা সার্ভারের খাতায় কোনো লেখা হবে না।')}</p>
        </section>}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{text('Cancel','বাতিল')}</Button>
          <Button onClick={save}>{mode==='purchase'?text('Complete purchase','ক্রয় সম্পন্ন করুন'):expense?review?text('Confirm preview correction','প্রিভিউ সংশোধন নিশ্চিত করুন'):text('Review changes','সংশোধন যাচাই করুন'):review?text('Confirm expense preview','খরচের প্রিভিউ নিশ্চিত করুন'):text('Review expense','খরচ যাচাই করুন')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

