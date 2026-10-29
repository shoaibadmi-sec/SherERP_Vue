import {businessToday} from '../utils/dateRange';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Keyboard } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { PageHeader } from '../components/PageHeader';
import { QuickAddSelect } from '../components/QuickAddSelect';
import { PhotoUploader } from '../components/products/PhotoUploader';
import { AddProductDialog, type ProductOpeningMeta } from '../components/products/AddProductDialog';
import { PurchaseCart } from '../components/purchases/PurchaseCart';
import { TransactionReviewDialog } from '../components/TransactionReviewDialog';
import { PurchasePaymentPanel, makePurchasePaymentRow, type PurchasePaymentRow } from '../components/purchases/PurchasePaymentPanel';
import { useTenantSettings } from '../settings/TenantSettingsProvider';
import { calculatePurchaseCheckout, type PurchaseDiscountMode } from '../utils/purchaseCheckout';
import { stockLots } from '../data/productInventory';
import { salesInvoices } from '../data/sales';
import { purchases as seedPurchases } from '../data/purchases';
import { availableParties, availableProducts, availableStockLots, availablePurchases, createPreviewParty, createPreviewProduct, createPreviewPurchase } from '../data/erpDemoStore';
import type { Party, PaymentSplit, Product, Purchase } from '../types/erp';
import { taka } from '../utils/currency';
import { duplicateSerials, normalizeSerials, requiredSerialCount } from '../utils/productFeatures';
import { amountOf, rounded, baseQty, baseCost, lineAmount, describeQty, lotBaseSellPrice, makePurchaseLine, switchPurchaseUnit, type PurchaseCartLine } from '../utils/purchaseCart';
import {purchaseSupplierGuard} from '../utils/purchaseSupplierGuard';

type Line = PurchaseCartLine;

const uid = () => Math.random().toString(36).slice(2, 10);
const todayISO = businessToday;
type PurchaseEditorProps={initialPurchase?:Purchase;onSaveSource?:(purchase:Purchase)=>void;initialSupplierId?:string;lockedSupplierId?:string;embedded?:boolean;active?:boolean;onCompleted?:(purchase:Purchase)=>void;onCancel?:()=>void};
export function PurchaseEditor({initialPurchase,onSaveSource,initialSupplierId,lockedSupplierId,embedded=false,active=true,onCompleted,onCancel}:PurchaseEditorProps={}) {
  const navigate = useNavigate();
  const { state: settingsState } = useTenantSettings();
  const [products, setProducts] = useState(() => availableProducts().filter((product) => product.kind !== 'Service'));
  const [suppliers, setSuppliers] = useState(() => availableParties().filter((party) => party.roles.includes('Supplier') || party.roles.includes('Vendor')));
  const [supplierId, setSupplierId] = useState(initialPurchase?.supplierId??initialSupplierId??'');
  const [date, setDate] = useState(()=>initialPurchase?.businessDate??todayISO());
  const [backdateReason, setBackdateReason] = useState('');
  const [referenceNo, setReferenceNo] = useState(initialPurchase?.memoNo??'');
  const [notes, setNotes] = useState(initialPurchase?.notes??'');
  const [lines, setLines] = useState<Line[]>(()=>structuredClone(initialPurchase?.cartSnapshot??[]));
  const [payments, setPayments] = useState<PurchasePaymentRow[]>(()=>initialPurchase?.payments?.length?initialPurchase.payments.map(p=>({...p,method:p.method as PurchasePaymentRow["method"],account:p.account??"",amount:String(p.amount)})):[makePurchasePaymentRow()]);
  const [discount, setDiscount] = useState(String(initialPurchase?.discount??''));
  const [discountMode, setDiscountMode] = useState<PurchaseDiscountMode>('amount');
  const [photos, setPhotos] = useState<string[]>(()=>initialPurchase?.receipt?[initialPurchase.receipt]:[]);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [error, setError] = useState('');
  const [reviewPurchaseOpen, setReviewPurchaseOpen] = useState(false);
  const [lastAdded, setLastAdded] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const qtyRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const smallRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const costRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const lotPriceRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const paymentAmountRef = useRef<HTMLInputElement>(null);

  const supplier = suppliers.find((party) => party.id === supplierId);
  const purchaseRef = initialPurchase?.ref ?? 'PUR-' + String(119 + availablePurchases().length - seedPurchases.length).padStart(6, '0');
  const subtotal = useMemo(() => rounded(lines.reduce((sum, line) => sum + lineAmount(line), 0)), [lines]);
  const totals = calculatePurchaseCheckout(subtotal, discount, discountMode, initialPurchase?.roundingRule??settingsState.sections.sales.rounding, payments);
  const { total, due, excess } = totals;
  const paid = totals.paidNum;

  useEffect(() => {
    if (!lastAdded) return;
    qtyRefs.current[lastAdded]?.focus();
    qtyRefs.current[lastAdded]?.select();
  }, [lastAdded]);

  const addProduct = (product: Product) => {
    const added = makePurchaseLine(product);
    setLines((current) => [...current, added]);
    setLastAdded(added.id);
    setError('');
  };
  const updateLine = (id: string, patch: Partial<Line>) => setLines((current) => current.map((line) => line.id === id ? { ...line, ...patch } : line));
  const selectCostUnit = (line: Line, unit: string) => {
    setLines((current) => current.map((item) =>
      item.id === line.id ? switchPurchaseUnit(item, unit) : item));
  };

  const addSupplier = (name: string, phone: string, area: string) => {
    const party: Party = {
      id: 'qs-' + uid(), name, phone, area, roles: ['Supplier'],
      balance: 0, lastActivity: 'Just now', avatarColor: '#0D7C74'
    };
    createPreviewParty(party);
    setSuppliers((current) => [...current, party]);
    setSupplierId(party.id);
    setError('');
    toast.success('Supplier added and selected');
  };

  const addCreatedProduct = (product: Product, opening?: ProductOpeningMeta) => {
    createPreviewProduct(product, opening);
    if (product.kind !== 'Service') {
      setProducts((current) => [...current, product]);
      addProduct(product);
      toast.success('New product added to the purchase cart');
    } else {
      toast('Service created; only stock products can be purchased here');
    }
    setProductDialogOpen(false);
  };

  const validate = (): string | null => {
    if (!supplier) return 'Select or quick-add a supplier.';
    const wrongSupplier=purchaseSupplierGuard(supplier.id,lockedSupplierId);
    if(wrongSupplier)return wrongSupplier;
    if (!date) return 'Select a purchase date.';
    if (!initialPurchase && date < todayISO() && !backdateReason.trim()) return 'Add a reason for backdating this purchase.';
    if (lines.length === 0) return 'Add at least one product to the cart.';
    if (lines.some((line) => baseQty(line) <= 0)) return 'All purchase products need a quantity greater than zero.';
    if (lines.some((line) => !Number.isFinite(Number(line.cost)) || Number(line.cost) <= 0)) return 'Enter a valid purchase cost for every product.';
    if (lines.some((line) => !(lotBaseSellPrice(line) > 0))) return 'Enter a valid lot selling price for every product.';
    if (excess > 0) return 'Payments exceed the purchase total by ' + taka(excess) + '.';

    const existingSerials = [
      ...availableStockLots().filter(lot=>lot.reference!==initialPurchase?.ref).flatMap((lot) => lot.serials ?? []),
      ...salesInvoices.flatMap((invoice) => invoice.lines.flatMap((line) => line.serials ?? []))
    ];
    const seen: string[] = [];
    for (const line of lines) {
      const serials = normalizeSerials(line.serialText);
      const duplicate = duplicateSerials(serials, [...existingSerials, ...seen]);
      if (duplicate.length) return line.product.name + ': duplicate serial ' + duplicate[0] + '.';
      const required = requiredSerialCount(line.product, baseQty(line));
      if (required > 0 && !Number.isInteger(baseQty(line))) return line.product.name + ': serial-tracked stock requires a whole base-unit quantity.';
      if (required > 0 && serials.length !== required) return line.product.name + ': ' + required + ' unique serials required (' + serials.length + ' entered).';
      if (serials.length > baseQty(line)) return line.product.name + ': more serials than purchased units.';
      if (line.product.expiry?.enabled && line.product.expiry.dateRequired && !line.expiryDate) return line.product.name + ': expiry date is required.';
      if (line.manufactureDate && line.expiryDate && line.expiryDate <= line.manufactureDate) return line.product.name + ': expiry must be later than manufacture.';
      seen.push(...serials);
    }
    return null;
  };

  const save = () => {
    const message = validate();
    if (message) { setError(message); toast.error(message); return; }
    if (!supplier) return;
    const paymentSplits: PaymentSplit[] = payments.filter((row) => amountOf(row.amount) > 0).map((row) => ({
      id: row.id, method: row.method, account: row.account, amount: rounded(amountOf(row.amount))
    }));
    const purchase: Purchase = {
      ...initialPurchase,
      id: initialPurchase?.id??'pu-' + uid(),
      businessDate:date,roundingRule:initialPurchase?.roundingRule??settingsState.sections.sales.rounding,
      sourceRevision:initialPurchase?.sourceRevision??0,cartSnapshot:structuredClone(lines),
      ref: purchaseRef,
      date: new Date(date + 'T12:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      supplierId: supplier.id, supplier: supplier.name,
      items: lines.map((line) => line.product.name + ' · ' + describeQty(line)).join(', '),
      total, paid: rounded(paid), payments: paymentSplits,
      subtotal, discount: totals.discountAmt, rounding: totals.rounding,
      receipt: photos[0], memoNo: referenceNo.trim() || undefined,
      notes: notes.trim() || undefined,
      backdateReason: backdateReason.trim() || undefined,
      inventoryLines: lines.map((line) => ({
        productId: line.product.id, quantity: baseQty(line),
        unitCost: baseCost(line),
        lotSellingPrice: lotBaseSellPrice(line),
        serials: normalizeSerials(line.serialText).length ? normalizeSerials(line.serialText) : undefined,
        batchNumber: line.batchNumber.trim() || undefined,
        manufactureDate: line.manufactureDate || undefined,
        expiryDate: line.expiryDate || undefined
      }))
    };
    if(onSaveSource){onSaveSource(purchase);return;}
    try{createPreviewPurchase(purchase);}catch(e){setError(e instanceof Error?e.message:"Invalid purchase.");return;}
    toast.success(purchase.ref + ' saved', { description: due > 0 ? taka(due) + ' payable to ' + supplier.name : 'Fully paid' });
    if(onCompleted)onCompleted(purchase);
    else navigate('/app/purchases');
  };

  const requestReview=()=>{
    const message=validate();
    if(message){setError(message);toast.error(message);return;}
    setError('');setReviewPurchaseOpen(true);
  };

  // Shortcuts mirror the POS workflow; dialogs retain their own keyboard handling.
  useEffect(() => {
    const handlePurchaseShortcuts = (event: KeyboardEvent) => {
      if (!active || event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
      const dialogOpen = Array.from(document.querySelectorAll('[data-slot="dialog-content"]'))
        .some((node) => (node as HTMLElement).getClientRects().length > 0);
      if (dialogOpen) return;
      if (event.key === 'F2') {
        event.preventDefault();
        searchRef.current?.focus();
      } else if (event.key === 'F8') {
        event.preventDefault();
        paymentAmountRef.current?.focus();
        paymentAmountRef.current?.select();
      } else if (event.key === 'F9') {
        event.preventDefault();
        requestReview();
      }
    };
    window.addEventListener('keydown', handlePurchaseShortcuts);
    return () => window.removeEventListener('keydown', handlePurchaseShortcuts);
  });

  return (
    <div data-purchase-workspace className="purchase-workspace mx-auto max-w-[1440px] min-w-0 space-y-4 pb-8">
      {!embedded&&<PageHeader
        title="New purchase" titleBn="নতুন ক্রয়"
        description={purchaseRef + ' · Add products like a POS cart, then choose payment sources.'}
        actions={<>
          <div className="hidden items-center gap-2.5 rounded-lg border border-border bg-card px-3 py-1.5 text-[11px] text-ink-500 md:flex">
            <Keyboard className="size-3.5" aria-hidden="true" />
            {([['F2', 'Search'], ['Enter', 'Next'], ['F8', 'Paid'], ['F9', 'Complete']] as const).map(([key, label]) => (
              <span key={key} className="flex items-center gap-1"><kbd className="rounded border border-ink-200 bg-ink-50 px-1 text-[10px]">{key}</kbd> {label}</span>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/app/purchases')}><ArrowLeft className="size-4" /> Purchases</Button>
        </>}
      />}

      <div data-purchase-layout className="grid min-w-0 grid-cols-1 items-start gap-4">
        <div className="min-w-0 space-y-4">
          <PurchaseCart
            lines={lines}
            products={products}
            searchRef={searchRef}
            qtyRefs={qtyRefs}
            smallRefs={smallRefs}
            costRefs={costRefs}
            lotPriceRefs={lotPriceRefs}
            onAdd={addProduct}
            onCreate={() => setProductDialogOpen(true)}
            onUpdate={updateLine}
            onRemove={(id) => setLines((current) => current.filter((line) => line.id !== id))}
            onCostUnitChange={selectCostUnit}
          />
          <section className="rounded-xl border border-border bg-card p-4 shadow-card">
            <p className="mb-3 text-[13px] font-semibold text-ink">Supplier memo & notes <span className="font-bn text-[11px] font-normal text-ink-400">· রসিদের ছবি</span></p>
            <label className="mb-3 block text-[12px] font-medium text-ink">Notes
              <Input className="mt-1" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Delivery, discount or other details (optional)" />
            </label>
            <PhotoUploader photos={photos} onChange={setPhotos} max={2} label="Attach" hint="Supplier memo, delivery challan or payment receipt · images for the UI preview" />
          </section>
        </div>

        <aside data-purchase-checkout className="min-w-0 space-y-3">
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
      <section className="border-b border-border p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div><p className="text-[13px] font-semibold text-ink">Purchase details</p><p className="font-bn text-[11px] text-ink-400">সরবরাহকারী ও ক্রয়ের তথ্য</p></div>
          <span className="rounded-md bg-ink-50 px-2 py-1 text-xs font-medium text-ink-600">{purchaseRef}</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="block min-w-0 text-[12px] font-medium text-ink sm:col-span-2">
            Supplier <span className="font-bn font-normal text-ink-400">· সরবরাহকারী</span> <span className="text-danger">*</span>
            <div className="mt-1">
              {(lockedSupplierId||initialPurchase)?<div className="rounded-md border border-border bg-ink-50 px-3 py-2 text-sm text-ink">
                {supplier?.name??'Selected supplier'} <span className="text-xs text-ink-500">· Original supplier</span>
               </div>:<QuickAddSelect label="Supplier" value={supplier?.name ?? ''} options={['Select supplier', ...suppliers.map((party) => party.name)]}
                onChange={(value) => setSupplierId(suppliers.find((party) => party.name === value)?.id ?? '')}
                onCreate={addSupplier} showContact placeholder="Supplier or business name" />}
            </div>
          </div>
          <label className="block text-[12px] font-medium text-ink">Purchase date <span className="text-danger">*</span>
            <Input className="mt-1" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </label>
          <label className="block text-[12px] font-medium text-ink">Supplier memo no. <span className="font-normal text-ink-400">· optional</span>
            <Input className="mt-1" value={referenceNo} onChange={(event) => setReferenceNo(event.target.value)} placeholder="Supplier bill / challan" />
          </label>
          {date && date < todayISO() && (
            <label className="block text-[12px] font-medium text-ink sm:col-span-2">Backdate reason <span className="text-danger">*</span>
              <Input className="mt-1" value={backdateReason} onChange={(event) => setBackdateReason(event.target.value)} placeholder="Reason for entering an earlier purchase" />
            </label>
          )}
        </div>
      </section>

          <PurchasePaymentPanel
            totals={totals}
            itemCount={lines.length}
            discount={discount}
            discountMode={discountMode}
            onDiscount={setDiscount}
            onDiscountMode={setDiscountMode}
            payments={payments}
            onPayments={setPayments}
            paidRef={paymentAmountRef}
            actionLabel={initialPurchase?"Review correction":undefined}
            onComplete={requestReview}
          />
          </div>
          {error && <div role="alert" className="rounded-md border border-danger/20 bg-danger-bg p-3 text-[12px] text-danger">{error}</div>}
          <div className="flex gap-2">
            <Button className="flex-1" variant="outline" onClick={() => onCancel?onCancel():navigate('/app/purchases')}>Cancel</Button>
          </div>
          <p className="text-center text-[11px] text-ink-400">UI preview: entries and quick-add records remain in memory until refresh; backend posting is not connected.</p>
        </aside>
      </div>

      <TransactionReviewDialog open={reviewPurchaseOpen} onClose={() => setReviewPurchaseOpen(false)}
        onConfirm={() => {setReviewPurchaseOpen(false);save();}}
        title={initialPurchase ? 'Review purchase correction' : 'Review purchase'} amount={total}
        confirmLabel={initialPurchase ? 'Confirm correction preview' : 'Confirm purchase preview'}
        details={[
          {label:'Supplier',value:supplier?.name ?? 'Select supplier'},
          {label:'Products',value:String(lines.length)+' lines'},
          {label:'Paid',value:taka(paid)},
          {label:'Due',value:taka(due)}
        ]}/>
      <AddProductDialog open={productDialogOpen} onOpenChange={setProductDialogOpen} onSave={addCreatedProduct}
        existingSerials={[...stockLots.flatMap((lot) => lot.serials ?? []), ...salesInvoices.flatMap((invoice) => invoice.lines.flatMap((line) => line.serials ?? []))]} />
    </div>
  );
}
