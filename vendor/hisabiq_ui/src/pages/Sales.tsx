import {useModuleColumns} from '../settings/useModuleColumns';
import {InvoicePresentationEditor} from '../settings/InvoicePresentationEditor';
import {useTenantSettings} from '../settings/TenantSettingsProvider';
import {canManage} from '../settings/model';
import {deleteSalesDraft,restoreSalesDraft} from '../data/salesPreviewStore';
import { SalesWideToolbar } from '../components/sales/SalesWideToolbar';
import { SalesMobileSummary, SalesMobileToolbar, SalesMobileMore, SalesMobileRecord, SalesMobileDisclosure } from '../components/sales/SalesMobileLayout';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { MotionTabList, MotionTabIndicator } from '../motion/MotionTabList';
import {matchesSearch as fuzzyMatch} from '../utils/fuzzySearch';
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowDownToLine,
  Banknote,
  BookOpen,
  Copy,
  Check,
  ChevronDown,
  CornerUpLeft,
  FileClock,
  FileText,
  MoreHorizontal,
  Pencil,
  Plus,
  Printer,
  Search,
  ShieldCheck,
  Trash2,
  UserRound
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/Button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/Dialog';
import { FormSelect } from '../components/FormSelect';
import { Input } from '../components/Input';
import { PageHeader } from '../components/PageHeader';
import { useUiCopy } from '../i18n/useUiCopy';
import {salesLabel,salesOptions} from '../i18n/salesCopy';
import type {UiLanguage} from '../i18n/uiCopy';
import { ReceiptPreview } from '../components/brand/ReceiptPreview';
import { FloatingPanel } from '../components/layout/FloatingPanel';
import { StatusBadge, type StatusTone } from '../components/StatusBadge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/Table';
import { customerCredits as seedCredits, salesReturns as seedReturns } from '../data/sales';
import { products } from '../data/products';
import {availableParties} from '../data/erpDemoStore';
import {getSalesPreviewSnapshot,subscribeSalesPreview,updateSalesPreview,saveSaleTemplate} from '../data/salesPreviewStore';
import {SaleTemplateDialog} from '../components/pos/SaleTemplateDialog';
import {planOrdinaryReturn,salesReturnCustomerId} from '../utils/salesReturn';
import {getProductImportPreviewSnapshot} from '../data/productImportPreviewStore';
import type { CustomerCredit, PaymentMethod, SalePayment, SalesInvoice, SalesInvoiceStatus, SalesReturn, SaleTemplate } from '../types/erp';
import { taka } from '../utils/currency';
import {positiveSalesAmount, salesPaymentRemainder, salesPaymentTotal} from '../utils/salesPaymentAmounts';
import { invoiceReceipt, invoiceQuantity, returnDocument } from '../utils/salesDocuments';
import {planBundleReturn,type BundleReturnSelection} from '../bundles/bundleReturn';
import { downloadReport, printReport } from '../utils/reportOutput';
const printInvoice = (invoice: SalesInvoice,language:UiLanguage='English + Bangla') => {
  const view = window.open('', '_blank');
  if (!view) { toast.error(salesLabel(language,'Allow the print popup and try again.')); return; }
  view.opener = null;
  void import('../components/brand/printReceipt').then(({printReceipt}) => printReceipt(invoiceReceipt(invoice,language), view))
    .catch(() => { view.close(); toast.error(salesLabel(language,'Could not open the print document. Try again.')); });
};
const printReturn = (item: SalesReturn,language:UiLanguage='English + Bangla') => { if (!printReport(returnDocument(item,language))) toast.error(salesLabel(language,'Allow the print popup and try again.')); };

type Tab = 'sales' | 'return' | 'returns' | 'credits' | 'drafts';

const paymentMethods: PaymentMethod[] = ['Cash', 'bKash', 'Nagad', 'Card', 'Bank'];

const statusTone: Record<SalesInvoiceStatus, StatusTone> = {
  Paid: 'success',
  Partial: 'warning',
  Due: 'danger',
  'Part returned': 'info',
  Returned: 'neutral'
};

type SalesColumn = 'invoice' | 'customer' | 'items' | 'total' | 'profit' | 'paid' | 'due' | 'payment' | 'status';

const salesColumns: Array<{ id: SalesColumn; label: string }> = [
  { id: 'invoice', label: 'Invoice' },
  { id: 'customer', label: 'Customer' },
  { id: 'items', label: 'Items' },
  { id: 'total', label: 'Total' },
  { id: 'profit', label: 'Profit' },
  { id: 'paid', label: 'Paid' },
  { id: 'due', label: 'Due' },
  { id: 'payment', label: 'Payment' },
  { id: 'status', label: 'Status' }
];

const defaultVisibleSalesColumns: Record<SalesColumn, boolean> = {
  invoice: true,
  customer: true,
  items: true,
  total: true,
  profit: true,
  paid: true,
  due: true,
  payment: true,
  status: true
};

const salesColumnStorageKey = 'hisabiq-sales-visible-columns';
const tabletSalesColumnStorageKey = 'hisabiq-sales-visible-columns-tablet';
const tabletVisibleSalesColumns = { ...defaultVisibleSalesColumns, items: false, payment: false };

const purchasePriceByProductId = new Map(products.map((product) => [product.id, product.purchasePrice]));

function isBundleReturnLine(line:SalesInvoice['lines'][number]) {
  return Boolean(line.bundleSnapshot)||getProductImportPreviewSnapshot().products.some(p=>p.id===line.productId&&p.kind==='Bundle');
}

function lineBaseQuantity(line: SalesInvoice['lines'][number]) {
  return line.returnableQuantity ?? (parseFloat(line.quantity) || 0);
}

function invoiceCostKnown(invoice: SalesInvoice) {
  return invoice.lines.every(line=>!line.bundleSnapshot||
    line.bundleSnapshot.components.every(child=>child.unitCost!==null&&
      child.unitCost!==undefined&&Number.isFinite(child.unitCost)&&child.unitCost>=0));
}
function invoiceCogs(invoice: SalesInvoice) {
  return invoice.lines.reduce((sum,line)=>{
    if(line.bundleSnapshot)return sum+line.bundleSnapshot.components.reduce(
      (cost,child)=>cost+child.totalBaseQty*(child.unitCost??0),0);
    const unitCost=line.unitCost??purchasePriceByProductId.get(line.productId)??0;
    return sum+lineBaseQuantity(line)*unitCost;
  },0);
}

function invoiceProfit(invoice: SalesInvoice) {
  return invoice.total-invoiceCogs(invoice);
}

function SalesColumnPicker({
  visible,
  onToggle,
  inline = false
}: {
  visible: Record<SalesColumn, boolean>;
  onToggle: (column: SalesColumn) => void;
  inline?: boolean;
}) {
  const {language}=useUiCopy();
  const sl=(english:string)=>salesLabel(language,english);
  const [expanded,setExpanded] = useState(false);
  return inline ? <div><Button variant="outline" size="sm" aria-expanded={expanded} className="w-full justify-between" onClick={()=>setExpanded(value=>!value)}>{sl('Columns')}<ChevronDown className="size-3.5"/></Button>{expanded && <div className="py-1">{salesColumns.map(column=><button key={column.id} type="button" role="menuitemcheckbox" disabled={["invoice","customer","total","paid","due"].includes(column.id)} aria-checked={visible[column.id]} onClick={()=>onToggle(column.id)} className="flex h-9 w-full items-center justify-between gap-4 px-3 py-1 text-left text-[13px] text-ink-700 hover:bg-ink-50"><span>{sl(column.label)}</span>{visible[column.id]&&<Check className="size-4 text-ink"/>}</button>)}</div>}</div> : (
    <FloatingPanel
      label={sl("Choose sales invoice columns")}
      width={210}
      trigger={({ toggle, open }) => (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={toggle}
          aria-expanded={open}
          className="h-9 min-h-9 gap-2 px-2.5">
          {sl('Columns')}
          <ChevronDown className={`size-3.5 text-ink-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </Button>
      )}>
      {() => (
        <div className="py-1">
          {salesColumns.map((column) => (
            <button
              key={column.id}
              type="button"
              disabled={["invoice","customer","total","paid","due"].includes(column.id)}
              role="menuitemcheckbox"
              aria-checked={visible[column.id]}
              onClick={() => onToggle(column.id)}
              className="flex w-full items-center justify-between gap-4 px-3 py-2 text-left text-[13px] text-ink-700 hover:bg-ink-50">
              <span>{sl(column.label)}</span>
              {visible[column.id] && <Check className="size-4 text-ink" />}
            </button>
          ))}
        </div>
      )}
    </FloatingPanel>
  );
}

function PaymentStatus({ invoice }: { invoice: SalesInvoice }) {
  const {text}=useUiCopy();
  const bn:Record<SalesInvoiceStatus,string>={Paid:'পরিশোধ',Partial:'আংশিক',Due:'বাকি',Returned:'ফেরত','Part returned':'আংশিক ফেরত'};
  return <StatusBadge tone={statusTone[invoice.status]} dot>{text(invoice.status,bn[invoice.status]??invoice.status)}</StatusBadge>;
}

const invoiceQty = invoiceQuantity;

function InvoiceActions({
  invoice,
  onView,
  onPayment,
  onReturn
}: {
  invoice: SalesInvoice;
  onView: () => void;
  onPayment: () => void;
  onReturn: () => void;
}) {
  const navigate = useNavigate();
  const {language}=useUiCopy();
  const sl=(english:string)=>salesLabel(language,english);
  const itemClass = 'flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-ink-700 hover:bg-ink-50';

  return (
    <FloatingPanel
      label={`${sl('Actions for')} ${invoice.invoice}`}
      width={210}
      trigger={({ toggle, open }) => (
        <button
          onClick={(event) => {
            event.stopPropagation();
            toggle();
          }}
          aria-expanded={open}
          aria-label={`${sl('Actions for')} ${invoice.invoice}`}
          className="rounded-md p-1.5 text-ink-400 hover:bg-ink-50 hover:text-ink">
          <MoreHorizontal className="size-4" />
        </button>
      )}>
      {(close) => (
        <div className="py-1" onClick={(event) => event.stopPropagation()}>
          <button className={itemClass} onClick={() => { close(); onView(); }}>
            <FileText className="size-4 text-ink-400" /> {sl('View invoice')}
          </button>
          <button className={itemClass} onClick={() => { close(); navigate(`/app/pos?mode=edit&invoice=${invoice.invoice}`); }}>
            <Pencil className="size-4 text-ink-400" /> {sl('Edit sale')}
          </button>
          <button className={itemClass} onClick={() => { close(); navigate(`/app/pos?mode=duplicate&invoice=${invoice.invoice}`); }}>
            <Copy className="size-4 text-ink-400" /> {sl('Duplicate')}
          </button>
          {invoice.due > 0 && (
            <button className={itemClass} onClick={() => { close(); onPayment(); }}>
              <Banknote className="size-4 text-ink-400" /> {sl('Take payment')}
            </button>
          )}
          <button className={itemClass} onClick={() => { close(); onReturn(); }}>
            <CornerUpLeft className="size-4 text-ink-400" /> {sl('Return items')}
          </button>
          <button className={itemClass} onClick={() => { close(); navigate(`/app/warranty?invoice=${invoice.invoice}`); }}>
            <ShieldCheck className="size-4 text-ink-400" /> {sl('Receive warranty')}
          </button>
          {invoice.partyId && (
            <button className={itemClass} onClick={() => { close(); navigate(`/app/parties?id=${invoice.partyId}`); }}>
              <UserRound className="size-4 text-ink-400" /> {sl('Customer ledger')}
            </button>
          )}
          <button className={itemClass} onClick={() => { close(); printInvoice(invoice,language); }}>
            <Printer className="size-4 text-ink-400" /> {sl('Print')}
          </button>
        </div>
      )}
    </FloatingPanel>
  );
}

function InvoiceDialog({
  invoice,
  onClose,
  onPayment,
  onReturn,
  onPresentation
}: {
  onPresentation:(invoice:SalesInvoice)=>void;
  invoice: SalesInvoice | null;
  onClose: () => void;
  onPayment: (invoice: SalesInvoice) => void;
  onReturn: (invoice: SalesInvoice) => void;
}) {
  const {text,word,language}=useUiCopy();
  const navigate = useNavigate();
  return (
    <Dialog open={!!invoice} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sales-mobile-dialog max-h-[92vh] overflow-y-auto sm:max-w-4xl scrollbar-thin">
        {invoice && (
          <>
            <DialogHeader>
              <DialogTitle className="flex flex-wrap items-center gap-2">
                {invoice.invoice}
                <PaymentStatus invoice={invoice} />
              </DialogTitle>
              <DialogDescription>
                {invoice.date}, {invoice.time} · {invoice.party} · {invoice.salesperson}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="space-y-3">
                <div className="rounded-xl border border-border">
                  <div className="grid grid-cols-2 gap-3 border-b border-border p-3 text-[12.5px] sm:grid-cols-4">
                    <div><p className="text-ink-400">{text('Customer','ক্রেতা')}</p><p className="font-medium text-ink">{invoice.party}</p></div>
                    <div><p className="text-ink-400">{word('phone')}</p><p className="font-medium text-ink">{invoice.phone ?? '—'}</p></div>
                    <div><p className="text-ink-400">{text('Guardian','অভিভাবক')}</p><p className="font-medium text-ink">{invoice.guardianName ?? '—'}</p></div>
                    <div><p className="text-ink-400">{word('address')}</p><p className="font-medium text-ink">{invoice.address ?? '—'}</p></div>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="h-9 pl-3 text-xs">{text('Item','পণ্য')}</TableHead>
                        <TableHead className="h-9 text-xs">{word('qty')}</TableHead>
                        <TableHead className="h-9 text-right text-xs">{word('price')}</TableHead>
                        <TableHead className="h-9 pr-3 text-right text-xs">{text('Amount','টাকা')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoice.lines.map((line) => (
                        <TableRow key={line.id} className="text-[12.5px]">
                          <TableCell className="py-2 pl-3">
                            <p className="font-medium text-ink">{line.name}</p>
                            {line.serials?.length ? <p data-table-helper="" className="mt-0.5 text-[11px] text-ink-400">{text('Serial','সিরিয়াল')}: {line.serials.join(', ')}</p> : null}
                            {line.warranty ? <p data-table-helper="" className="mt-0.5 text-[11px] text-ink-400">{text('Warranty','ওয়ারেন্টি')}: {line.warranty.duration} {line.warranty.durationUnit} · {line.warranty.type}{line.warranty.terms ? ` · ${line.warranty.terms}` : ''}</p> : null}
                          </TableCell>
                          <TableCell className="py-2">{invoiceQty(line)}</TableCell>
                          <TableCell className="py-2 text-right">{taka(line.price, line.price % 1 ? 2 : 0)}/{line.unit}</TableCell>
                          <TableCell className="py-2 pr-3 text-right font-medium">{taka(line.total)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="grid gap-1 border-t border-border p-3 text-[12.5px] sm:ml-auto sm:w-72">
                    <div className="flex justify-between"><span className="text-ink-500">{text('Subtotal','পণ্যের মোট')}</span><span>{taka(invoice.subtotal)}</span></div>
                    {invoice.discount > 0 && <div className="flex justify-between"><span className="text-ink-500">{word('discount')}</span><span>−{taka(invoice.discount)}</span></div>}
                    <div className="flex justify-between"><span className="text-ink-500">{text('Rounding','রাউন্ডিং')}</span><span>{invoice.rounding >= 0 ? '+' : '−'}{taka(Math.abs(invoice.rounding))}</span></div>
                    <div className="flex justify-between border-t border-border pt-1.5 text-sm font-semibold"><span>{word('total')}</span><span>{taka(invoice.total)}</span></div>
                    <div className="flex justify-between"><span className="text-ink-500">{text('Gross profit','বিক্রির মোট লাভ')}</span>{invoiceCostKnown(invoice)?<span className={invoiceProfit(invoice)<0?'font-medium text-danger':'font-medium text-success'}>
                      {invoiceProfit(invoice)<0?'−':''}{taka(Math.abs(invoiceProfit(invoice)),Math.abs(invoiceProfit(invoice))%1?2:0)}
                    </span>:<span className="font-medium text-warning">{text('Cost pending','কেনা দাম বাকি')}</span>}</div>
                    <div className="flex justify-between"><span className="text-ink-500">{word('paid')}</span><span>{taka(invoice.paid)}</span></div>
                    <div className="flex justify-between font-medium"><span className="text-ink-500">{word('due')}</span><span className={invoice.due > 0 ? 'text-danger' : 'text-success'}>{invoice.due > 0 ? taka(invoice.due) : '৳0'}</span></div>
                  </div>
                </div>

                <div className="rounded-xl border border-border p-3">
                  <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-400">{word('payments')}</p>
                  {invoice.payments.length ? (
                    <div className="mt-2 divide-y divide-border">
                      {invoice.payments.map((payment) => (
                        <div key={payment.id} className="flex items-center justify-between gap-3 py-2 text-[12.5px]">
                          <div>
                            <p className="font-medium text-ink">{payment.method}</p>
                            <p className="text-[11px] text-ink-400">{payment.account ?? text('Default account','ডিফল্ট হিসাব')}</p>
                          </div>
                          <span className="font-medium">{taka(payment.amount)}</span>
                        </div>
                      ))}
                    </div>
                  ) : <p className="mt-2 text-sm text-ink-500">{text('No payment received yet.','এখনো টাকা জমা হয়নি।')}</p>}
                </div>
              </div>

              <div className="rounded-xl bg-ink-50 py-4">
                <ReceiptPreview {...invoiceReceipt(invoice,language)} />
              </div>
            </div>

            <InvoicePresentationEditor key={invoice.id} invoice={invoice} onSaved={onPresentation}/>
            {invoice.note && <p className="rounded-lg bg-warning-bg px-3 py-2 text-[12.5px] text-warning">{invoice.note}</p>}

            <DialogFooter className="flex-wrap">
              {invoice.partyId && (
                <Button variant="outline" onClick={() => navigate(`/app/parties?id=${invoice.partyId}`)}>
                  <BookOpen className="size-4" /> {text('Ledger','খাতা')}
                </Button>
              )}
              <Button variant="outline" onClick={() => printInvoice(invoice,language)}>
                <Printer className="size-4" /> {text('Print','প্রিন্ট')}
              </Button>
              <Button variant="outline" onClick={() => navigate(`/app/pos?mode=duplicate&invoice=${invoice.invoice}`)}>
                <Copy className="size-4" /> {text('Duplicate','নকল বিল')}
              </Button>
              <Button variant="outline" onClick={() => navigate(`/app/pos?mode=edit&invoice=${invoice.invoice}`)}>
                <Pencil className="size-4" /> {text('Edit','সংশোধন')}
              </Button>
              <Button variant="outline" onClick={() => onReturn(invoice)}>
                <CornerUpLeft className="size-4" /> {text('Return','ফেরত')}
              </Button>
              <Button variant="outline" onClick={() => navigate(`/app/warranty?invoice=${invoice.invoice}`)}>
                <ShieldCheck className="size-4" /> {text('Warranty','ওয়ারেন্টি')}
              </Button>
              {invoice.due > 0 && <Button onClick={() => onPayment(invoice)}><Banknote className="size-4" /> {text('Take payment','টাকা নিন')}</Button>}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

type PaymentDraft = { id: string; method: PaymentMethod; amount: string; account: string };

function PaymentDialog({
  invoice,
  onClose,
  onSave
}: {
  invoice: SalesInvoice | null;
  onClose: () => void;
  onSave: (invoice: SalesInvoice, rows: PaymentDraft[]) => boolean;
}) {
  const {text,showHelper}=useUiCopy();
  const [rows, setRows] = useState<PaymentDraft[]>([{ id: 'p1', method: 'Cash', amount: '', account: '' }]);
  const nextRowId = useRef(2);

  const total = salesPaymentTotal(rows);

  const close = () => {
    setRows([{ id: 'p1', method: 'Cash', amount: '', account: '' }]);
    onClose();
  };

  return (
    <Dialog open={!!invoice} onOpenChange={(open) => !open && close()}>
      <DialogContent className="sales-mobile-dialog sm:max-w-xl">
        {invoice && (
          <>
            <DialogHeader>
              <DialogTitle>{text('Take payment','টাকা নিন')} {showHelper&&<span className="font-bn text-sm font-normal text-ink-500">পেমেন্ট নিন</span>}</DialogTitle>
              <DialogDescription>{invoice.invoice} · {invoice.party} · {text('due','বাকি')} {taka(invoice.due)}</DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              {rows.map((row, index) => (
                <div key={row.id} className="min-w-0 rounded-lg border border-border bg-ink-50/40 p-2">
                  <div className="grid min-w-0 grid-cols-[92px_minmax(0,1fr)_36px] gap-1.5">
                    <FormSelect
                      aria-label={text(`Payment method ${index + 1}`, `পেমেন্টের মাধ্যম ${index + 1}`)}
                      value={row.method}
                      onChange={(event) => setRows(items => items.map(item => item.id === row.id ? { ...item, method: event.target.value as PaymentMethod } : item))}
                      options={paymentMethods.map(method => ({value:method,label:text(method,method==='Cash'?'ক্যাশ':method==='Bank'?'ব্যাংক':method==='Card'?'কার্ড':method)}))}
                    />
                    <Input
                      aria-label={text(`Payment account ${index + 1}`, `পেমেন্টের হিসাব ${index + 1}`)}
                      className="h-9 min-w-0 text-[13px]"
                      value={row.account}
                      onChange={(event) => setRows(items => items.map(item => item.id === row.id ? { ...item, account: event.target.value } : item))}
                      placeholder={row.method === 'Cash' ? text('Cash counter','ক্যাশ কাউন্টার') : text('Account / wallet','হিসাব / ওয়ালেট')}
                    />
                    <button
                      type="button"
                      disabled={rows.length === 1}
                      onClick={() => setRows(items => items.filter(item => item.id !== row.id))}
                      className="flex size-9 items-center justify-center rounded-md text-helper hover:bg-danger-bg hover:text-danger disabled:opacity-30"
                      aria-label={text(`Remove payment ${index + 1}`, `পেমেন্ট ${index + 1} সরান`)}>
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                  <div className="mt-1.5 flex min-w-0 items-center gap-1.5">
                    <div className="relative min-w-0 flex-1">
                      <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-ink-400">৳</span>
                      <Input
                        aria-label={text(`Payment amount ${index + 1}`, `পেমেন্টের পরিমাণ ${index + 1}`)}
                        className="h-9 min-w-0 pl-7 text-right font-medium"
                        value={row.amount}
                        inputMode="decimal"
                        onChange={(event) => setRows(items => items.map(item => item.id === row.id ? { ...item, amount: event.target.value.replace(/[^\d.]/g, '') } : item))}
                        placeholder="0"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={!Number.isFinite(salesPaymentRemainder(invoice.due, rows, row.id))}
                      onClick={() => {
                        const remaining = salesPaymentRemainder(invoice.due, rows, row.id);
                        if (Number.isFinite(remaining)) setRows(items => items.map(item => item.id === row.id ? { ...item, amount: String(remaining) } : item));
                      }}
                      className="h-9 shrink-0 rounded-md border border-border bg-card px-2 text-[10.5px] font-medium text-teal-700 hover:bg-teal-50 disabled:opacity-40">
                      {text('Remaining','বাকি')}
                    </button>
                  </div>
                </div>
              ))}


              <button
                type="button"
                onClick={() => setRows(items => [...items, { id: `p${nextRowId.current++}`, method: 'Cash', amount: '', account: '' }])}
                className="flex items-center gap-1.5 text-[12.5px] font-medium text-teal-700 hover:underline">
                <Plus className="size-3.5" /> {text('Add another payment source','আরও পেমেন্ট মাধ্যম')}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 rounded-xl bg-ink-50 p-3 text-center text-[12px]">
              <div><p className="text-ink-400">{text('Invoice due','বিলের বাকি')}</p><p className="mt-0.5 font-semibold text-ink">{taka(invoice.due)}</p></div>
              <div><p className="text-ink-400">{text('This payment','এবার জমা')}</p><p className="mt-0.5 font-semibold text-ink">{taka(Number.isFinite(total) ? total : 0)}</p></div>
              <div><p className="text-ink-400">{text('Remaining','অবশিষ্ট')}</p><p className={`mt-0.5 font-semibold ${invoice.due - total > 0 ? 'text-danger' : 'text-success'}`}>{Number.isFinite(total) ? taka(Math.max(invoice.due - total, 0)) : '—'}</p></div>
            </div>

            {!Number.isFinite(total) && <p role="alert" className="text-sm text-danger">{text('Enter a valid amount (up to two decimal places).','সঠিক টাকার পরিমাণ লিখুন (দশমিকের পর সর্বোচ্চ দুই ঘর)।')}</p>}
            <DialogFooter>
              <Button variant="outline" onClick={close}>{text('Cancel','বাতিল')}</Button>
              <Button
                disabled={!Number.isFinite(total) || total <= 0 || Math.round(total * 100) > Math.round(invoice.due * 100)}
                onClick={() => { if (onSave(invoice, rows)) close(); }}>
                {text('Save payment','পেমেন্ট লিখুন')}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}


type CustomerPaymentDraft = {
  customer: string;
  amount: string;
  method: PaymentMethod;
  account: string;
  allocation: 'Settle oldest due' | 'Keep as customer credit';
};

function CustomerPaymentDialog({
  open,
  customers,
  onClose,
  onSave
}: {
  open: boolean;
  customers: string[];
  onClose: () => void;
  onSave: (draft: CustomerPaymentDraft) => boolean;
}) {
  const {text,showHelper}=useUiCopy();
  const [customer, setCustomer] = useState(customers[0] ?? '');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('Cash');
  const [account, setAccount] = useState('');
  const [allocation, setAllocation] = useState<CustomerPaymentDraft['allocation']>('Settle oldest due');
  const amountNumber = positiveSalesAmount(amount);

  const close = () => {
    setAmount('');
    setAccount('');
    setAllocation('Settle oldest due');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && close()}>
      <DialogContent className="sales-mobile-dialog sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{text('Customer payment','ক্রেতার টাকা জমা')} {showHelper&&<span className="font-bn text-sm font-normal text-ink-500">কাস্টমার পেমেন্ট</span>}</DialogTitle>
          <DialogDescription>{text('Receive money against customer dues or keep it as reusable customer credit.','ক্রেতার বাকি মেটাতে টাকা নিন অথবা অগ্রিম জমা রাখুন।')}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-[12px] font-medium text-ink sm:col-span-2">
            {text('Customer','ক্রেতা')}
            <FormSelect className="mt-1" value={customer} onChange={(event) => setCustomer(event.target.value)} options={customers} />
          </label>
          <label className="text-[12px] font-medium text-ink">
            {text('Method','মাধ্যম')}
            <FormSelect className="mt-1" value={method} onChange={(event) => setMethod(event.target.value as PaymentMethod)} options={paymentMethods.map(method=>({value:method,label:text(method,method==='Cash'?'ক্যাশ':method==='Bank'?'ব্যাংক':method==='Card'?'কার্ড':method)}))} />
          </label>
          <label className="text-[12px] font-medium text-ink">
            {text('Account','হিসাব')}
            <Input className="mt-1" value={account} onChange={(event) => setAccount(event.target.value)} placeholder={method === 'Cash' ? text('Cash counter','ক্যাশ কাউন্টার') : text('Account / wallet','হিসাব / ওয়ালেট')} />
          </label>
          <label className="text-[12px] font-medium text-ink">
            {text('Amount','টাকা')}
            <Input className="mt-1 text-right" value={amount} inputMode="decimal" onChange={(event) => setAmount(event.target.value.replace(/[^\d.]/g, ''))} placeholder="0" />
          </label>
          <label className="text-[12px] font-medium text-ink">
            {text('Allocation','কোন বাকি মেটাবেন')}
            <FormSelect className="mt-1" value={allocation} onChange={(event) => setAllocation(event.target.value as CustomerPaymentDraft['allocation'])} options={[{value:'Settle oldest due',label:text('Settle oldest due','আগের বাকি আগে মেটান')},{value:'Keep as customer credit',label:text('Keep as customer credit','ক্রেতার অগ্রিম জমা রাখুন')}]} />
          </label>
        </div>
        <div className="rounded-lg bg-ink-50 p-3 text-[12px] text-ink-600">
          {allocation === 'Settle oldest due'
            ? text('HisabIQ applies this payment to the customer’s oldest due invoices first. Any remainder becomes customer credit.','আগের বাকি বিল আগে মেটানো হবে। বেশি টাকা থাকলে অগ্রিম জমা থাকবে।')
            : text('The full amount stays as customer credit and can be applied to an invoice or refunded later.','পুরো টাকা অগ্রিম জমা থাকবে। পরে বিল মেটাতে বা ফেরত দিতে পারবেন।')}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={close}>{text('Cancel','বাতিল')}</Button>
          <Button disabled={!customer || !Number.isFinite(amountNumber) || amountNumber <= 0} onClick={() => {
            if (onSave({ customer, amount, method, account, allocation })) close();
          }}>{text('Save payment','পেমেন্ট লিখুন')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreditActionDialog({
  action,
  invoices,
  onClose,
  onApply,
  onRefund
}: {
  action: { credit: CustomerCredit; mode: 'apply' | 'refund' } | null;
  invoices: SalesInvoice[];
  onClose: () => void;
  onApply: (credit: CustomerCredit, invoiceId: string, amount: number) => void;
  onRefund: (credit: CustomerCredit, amount: number, method: PaymentMethod, account: string) => void;
}) {
  const credit = action?.credit ?? null;
  const dueInvoices = credit ? invoices.filter((invoice) => invoice.party === credit.customer && invoice.due > 0) : [];
  const [invoiceId, setInvoiceId] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('Cash');
  const {text}=useUiCopy();
  const [account, setAccount] = useState('');
  const selectedInvoice = dueInvoices.find((invoice) => invoice.invoice === invoiceId) ?? dueInvoices[0] ?? null;
  const maxAmount = credit ? Math.min(credit.balance, action?.mode === 'apply' ? selectedInvoice?.due ?? 0 : credit.balance) : 0;
  const amountNumber = positiveSalesAmount(amount);

  const close = () => {
    setInvoiceId('');
    setAmount('');
    setMethod('Cash');
    setAccount('');
    onClose();
  };

  return (
    <Dialog open={!!action} onOpenChange={(nextOpen) => !nextOpen && close()}>
      <DialogContent className="sales-mobile-dialog sm:max-w-lg">
        {credit && action && (
          <>
            <DialogHeader>
              <DialogTitle>{action.mode === 'apply' ? text('Apply customer credit','ক্রেতার অগ্রিম দিয়ে বাকি মেটান') : text('Refund customer credit','ক্রেতার অগ্রিম ফেরত দিন')}</DialogTitle>
              <DialogDescription>{credit.customer} · {text('available','জমা আছে')} {taka(credit.balance)}</DialogDescription>
            </DialogHeader>
            {action.mode === 'apply' ? (
              <div className="space-y-3">
                <label className="text-[12px] font-medium text-ink">
                  {text('Due invoice','বাকি বিল')}
                  <FormSelect
                    className="mt-1"
                    value={selectedInvoice?.invoice ?? ''}
                    onChange={(event) => { setInvoiceId(event.target.value); setAmount(''); }}
                    options={dueInvoices.map((invoice) => invoice.invoice)}
                  />
                </label>
                {selectedInvoice && (
                  <div className="rounded-lg bg-ink-50 p-3 text-[12px]">
                    <div className="flex justify-between"><span className="text-ink-500">{text('Invoice','বিল')}</span><span className="font-medium">{selectedInvoice.invoice}</span></div>
                    <div className="mt-1 flex justify-between"><span className="text-ink-500">{text('Due','বাকি')}</span><span className="font-medium text-danger">{taka(selectedInvoice.due)}</span></div>
                  </div>
                )}
                <label className="text-[12px] font-medium text-ink">
                  {text('Amount','টাকা')}
                  <Input className="mt-1 text-right" value={amount} inputMode="decimal" onChange={(event) => setAmount(event.target.value.replace(/[^\d.]/g, ''))} placeholder={maxAmount ? String(maxAmount) : '0'} />
                </label>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-[12px] font-medium text-ink sm:col-span-2">
                  {text('Refund amount','ফেরত দেওয়ার টাকা')}
                  <Input className="mt-1 text-right" value={amount} inputMode="decimal" onChange={(event) => setAmount(event.target.value.replace(/[^\d.]/g, ''))} placeholder={String(credit.balance)} />
                </label>
                <label className="text-[12px] font-medium text-ink">
                  {text('Method','মাধ্যম')}
                  <FormSelect className="mt-1" value={method} onChange={(event) => setMethod(event.target.value as PaymentMethod)} options={paymentMethods.map(method=>({value:method,label:text(method,method==='Cash'?'ক্যাশ':method==='Bank'?'ব্যাংক':method==='Card'?'কার্ড':method)}))} />
                </label>
                <label className="text-[12px] font-medium text-ink">
                  {text('Account','হিসাব')}
                  <Input className="mt-1" value={account} onChange={(event) => setAccount(event.target.value)} placeholder={method === 'Cash' ? text('Cash counter','ক্যাশ কাউন্টার') : text('Account / wallet','হিসাব / ওয়ালেট')} />
                </label>
              </div>
            )}
            {!selectedInvoice && action.mode === 'apply' && <p className="rounded-lg bg-warning-bg p-3 text-xs text-warning">{text('This customer has no due invoice to settle.','এই ক্রেতার কোনো বাকি বিল নেই।')}</p>}
            <DialogFooter>
              <Button variant="outline" onClick={close}>{text('Cancel','বাতিল')}</Button>
              <Button
                disabled={!Number.isFinite(amountNumber) || amountNumber <= 0 || Math.round(amountNumber * 100) > Math.round(maxAmount * 100) || (action.mode === 'apply' && !selectedInvoice)}
                onClick={() => {
                  if (!Number.isFinite(amountNumber) || amountNumber <= 0 || Math.round(amountNumber * 100) > Math.round(maxAmount * 100)) return;
                  if (action.mode === 'apply' && selectedInvoice) onApply(credit, selectedInvoice.id, amountNumber);
                  if (action.mode === 'refund') onRefund(credit, amountNumber, method, account);
                  close();
                }}>
                {action.mode === 'apply' ? text('Apply credit','জমা দিয়ে বাকি মেটান') : text('Refund credit','জমা ফেরত দিন')}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function Sales() {
  const settings=useTenantSettings();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1279px)');
  const {text,language,showHelper}=useUiCopy();
  const sl=(english:string)=>salesLabel(language,english);
  const navigate = useNavigate();
  const [searchParams,setSearchParams] = useSearchParams();
  const routeTab=searchParams.get('tab');
  const allowedTabs:Tab[]=['sales','return','returns','credits','drafts'];
  const [tab,setTab]=useState<Tab>(()=>allowedTabs.includes(routeTab as Tab)?routeTab as Tab:'sales');
  useEffect(()=>{if(routeTab&&allowedTabs.includes(routeTab as Tab))setTab(routeTab as Tab);else if(!routeTab)setTab('sales');},[routeTab]);
  const chooseTab=(id:Tab)=>{setTab(id);setSearchParams(current=>{
   const next=new URLSearchParams(current);if(id==='sales')next.delete('tab');else next.set('tab',id);return next;
  },{replace:true});};
  const {invoices,returns,credits,templates,drafts}=useSyncExternalStore(subscribeSalesPreview,getSalesPreviewSnapshot,getSalesPreviewSnapshot);
  const setInvoices=(update:(items:SalesInvoice[])=>SalesInvoice[])=>updateSalesPreview('invoices',update);
  const setReturns=(update:(items:SalesReturn[])=>SalesReturn[])=>updateSalesPreview('returns',update);
  const setCredits=(update:(items:CustomerCredit[])=>CustomerCredit[])=>updateSalesPreview('credits',update);
  const setTemplates=(update:(items:SaleTemplate[])=>SaleTemplate[])=>updateSalesPreview('templates',update);
  const [templateEditor,setTemplateEditor]=useState<{template:SaleTemplate|null}|null>(null);
  const [returnDetail, setReturnDetail] = useState<SalesReturn | null>(null);

  const routeQuery=searchParams.get('q') ?? '';
  const [query, setQuery] = useState(routeQuery);
  useEffect(()=>setQuery(routeQuery),[routeQuery]);
  const [customerFilter, setCustomerFilter] = useState('All customers');
  const [status, setStatus] = useState('All status');
  const [method, setMethod] = useState('All payments');
  const {columns:wideSalesColumns,setColumns:setWideSalesColumns}=useModuleColumns("sales",salesColumnStorageKey,defaultVisibleSalesColumns);
  const {columns:tabletSalesColumns,setColumns:setTabletSalesColumns}=useModuleColumns("sales",tabletSalesColumnStorageKey,tabletVisibleSalesColumns);
  const visibleSalesColumns = isTablet ? tabletSalesColumns : wideSalesColumns;
  const [detail, setDetail] = useState<SalesInvoice | null>(null);
  const [paymentTarget, setPaymentTarget] = useState<SalesInvoice | null>(null);
  const [customerPaymentOpen, setCustomerPaymentOpen] = useState(false);
  const [creditAction, setCreditAction] = useState<{ credit: CustomerCredit; mode: 'apply' | 'refund' } | null>(null);
  const [returnCustomer, setReturnCustomer] = useState('Rahman Hardware');
  const [returnInvoiceIds, setReturnInvoiceIds] = useState<string[]>([]);
  const [returnQty, setReturnQty] = useState<Record<string, string>>({});
  const [returnReason, setReturnReason] = useState<Record<string, string>>({});
  const [returnSerials, setReturnSerials] = useState<Record<string, string>>({});
  const [bundleReturnChoices,setBundleReturnChoices]=useState<Record<string,Record<string,BundleReturnSelection>>>({});
  const [bundleReturnPreviewOpen,setBundleReturnPreviewOpen]=useState(false);
  const [returnSettlement, setReturnSettlement] = useState<SalesReturn['settlement']>('Adjust due');
  const [returnRefundMethod, setReturnRefundMethod] = useState<Exclude<PaymentMethod, 'Customer Credit'>>('Cash');
  const [returnRefundAccount, setReturnRefundAccount] = useState('');

  const toggleSalesColumn = (column:SalesColumn)=>{const setColumns=isTablet?setTabletSalesColumns:setWideSalesColumns;setColumns(current=>({...current,[column]:!current[column]}));};

  const customerNames = useMemo(
    () => Array.from(new Set(invoices.map((invoice) => invoice.party))),
    [invoices]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return invoices.filter((invoice) => {
      if (customerFilter !== 'All customers' && invoice.party !== customerFilter) return false;
      if (status !== 'All status' && invoice.status !== status) return false;
      if (method !== 'All payments' && !invoice.payments.some((payment) => payment.method === method) && invoice.method !== method) return false;
      if (!q) return true;
      return fuzzyMatch(q,[
        invoice.invoice,
        invoice.party,
        invoice.phone ?? '',
        invoice.address ?? '',
        ...invoice.lines.map((line) => line.name)
      ]);
    });
  }, [customerFilter, invoices, method, query, status]);

  const salesTotal = invoices.reduce((sum, invoice) => sum + invoice.total, 0);
  const receivedTotal = invoices.reduce((sum, invoice) => sum + invoice.paid, 0);
  const dueTotal = invoices.reduce((sum, invoice) => sum + invoice.due, 0);
  const returnTotal = returns.reduce((sum, item) => sum + item.amount, 0);
  const creditTotal = credits.reduce((sum, item) => sum + item.balance, 0);

  const summary = [
    { label: text('Sales · Oct','অক্টোবরে বিক্রি'), value: taka(salesTotal), sub: text(`${invoices.length} invoices`,`${invoices.length}টি বিল`) },
    { label: text('Received · Oct','অক্টোবরে জমা'), value: taka(receivedTotal), sub: text('Cash, bank & mobile','ক্যাশ, ব্যাংক ও মোবাইল') },
    { label: text('Outstanding due','ক্রেতার কাছে পাওনা'), value: taka(dueTotal), sub: text('Customer receivable · বাকি','ক্রেতাদের বাকি'), tone: 'text-danger' },
    { label: text('Sales returns','বিক্রি ফেরত'), value: taka(returnTotal), sub: text(`${returns.length} return memos · credit ${taka(creditTotal)}`,`${returns.length}টি ফেরত · জমা ${taka(creditTotal)}`), tone: 'text-warning' }
  ];

  const customerInvoices = invoices.filter((invoice) => invoice.party === returnCustomer);
  const selectedReturnDue = customerInvoices.filter((invoice) => returnInvoiceIds.includes(invoice.id)).reduce((sum, invoice) => sum + invoice.due, 0);
  const selectedReturnInvoices = invoices.filter((invoice) => returnInvoiceIds.includes(invoice.id));
  const selectedReturnLines = selectedReturnInvoices.flatMap((invoice) => invoice.lines.map((line) => ({ invoice, line })));
  const ordinaryReturnPlans=selectedReturnLines.filter(({line})=>!isBundleReturnLine(line)).map(({invoice,line})=>
    planOrdinaryReturn(invoice,line,returnQty[line.id]??'',(returnSerials[line.id]??'').split(',').map(value=>value.trim()).filter(Boolean),returns));
  const returnLimit=(line:SalesInvoice['lines'][number])=>isBundleReturnLine(line)
    ?line.returnableQuantity??0:ordinaryReturnPlans.find(plan=>plan.lineId===line.id)?.remaining??0;
  const selectedBundlePlans=selectedReturnLines.filter(({line})=>isBundleReturnLine(line)&&Number(returnQty[line.id]??'')>0)
    .map(({invoice,line})=>planBundleReturn({
      invoice,line,sets:Number(returnQty[line.id]),choices:bundleReturnChoices[line.id]??{},
      priorReturns:returns.flatMap(r=>r.bundleReturns??[])
    }));
  const includesBundleReturn=selectedBundlePlans.length>0;
  const returnAmount = selectedReturnLines.reduce((sum,{line})=>{
    if(isBundleReturnLine(line))return sum+(selectedBundlePlans.find(p=>p.lineId===line.id)?.refundEstimate??0);
    return Math.round((sum+(ordinaryReturnPlans.find(plan=>plan.lineId===line.id)?.amount??0))*100)/100;
  },0);
  const returnIssues=ordinaryReturnPlans.flatMap(plan=>plan.quantity!==0||returnQty[plan.lineId]?plan.issues:[]);

  const openReturn = (invoice: SalesInvoice) => {
    setReturnCustomer(invoice.party);
    setReturnInvoiceIds([invoice.id]);
    setReturnQty({});
    setReturnReason({});
    setReturnSerials({});
    setBundleReturnChoices({});
    setDetail(null);
    setTab('return');
  };

  const savePayment = (invoice: SalesInvoice, rows: PaymentDraft[]) => {
    const amount = salesPaymentTotal(rows);
    const currentInvoice = getSalesPreviewSnapshot().invoices.find(item => item.id === invoice.id);
    if (!currentInvoice || !Number.isFinite(amount) || amount <= 0 || Math.round(amount * 100) > Math.round(currentInvoice.due * 100)) {
      toast.error(sl('Enter a valid payment within the remaining due'));
      return false;
    }
    const payments: SalePayment[] = rows
      .filter((row) => positiveSalesAmount(row.amount) > 0)
      .map((row, index) => ({
        id: `${invoice.id}-new-${Date.now()}-${index}`,
        method: row.method,
        amount: positiveSalesAmount(row.amount),
        ...(row.account.trim() ? { account: row.account.trim() } : {})
      }));
    setInvoices((items) => items.map((item) => {
      if (item.id !== invoice.id) return item;
      const paid = Math.min(item.total, item.paid + amount);
      const due = Math.max(item.total - paid, 0);
      return {
        ...item,
        paid,
        due,
        method: payments[0]?.method ?? item.method,
        status: due === 0 ? 'Paid' : paid > 0 ? 'Partial' : 'Due',
        payments: [...item.payments, ...payments]
      };
    }));
    toast.success(sl('Payment saved'), { description: `${invoice.invoice} · ${taka(amount)}` });
    return true;
  };

  const receiveCustomerPayment = (draft: CustomerPaymentDraft) => {
    const amount = positiveSalesAmount(draft.amount);
    if (!draft.customer || !Number.isFinite(amount) || amount <= 0) {
      toast.error(sl('Enter a valid payment amount'));
      return false;
    }

    const allocations = new Map<string, number>();
    let remainder = amount;
    if (draft.allocation === 'Settle oldest due') {
      for (const invoice of invoices.filter((item) => item.party === draft.customer && item.due > 0)) {
        if (remainder <= 0) break;
        const applied = Math.min(invoice.due, remainder);
        allocations.set(invoice.id, applied);
        remainder -= applied;
      }

      setInvoices((items) => items.map((invoice) => {
        const applied = allocations.get(invoice.id) ?? 0;
        if (!applied) return invoice;
        const paid = invoice.paid + applied;
        const due = Math.max(invoice.total - paid, 0);
        return {
          ...invoice,
          paid,
          due,
          method: draft.method,
          status: due === 0 ? 'Paid' : 'Partial',
          payments: [...invoice.payments, {
            id: `${invoice.id}-customer-${Date.now()}`,
            method: draft.method,
            amount: applied,
            ...(draft.account.trim() ? { account: draft.account.trim() } : {})
          }]
        };
      }));
    } else {
      remainder = amount;
    }

    if (remainder > 0) {
      setCredits((items) => {
        const existing = items.find((credit) => credit.customer === draft.customer);
        if (existing) return items.map((credit) => credit.id === existing.id ? {
          ...credit,
          balance: credit.balance + remainder,
          source: draft.allocation === 'Keep as customer credit' ? 'Customer payment' : 'Payment remainder',
          updatedAt: '01 Oct 2026'
        } : credit);
        return [{
          id: `CR-${String(32 + items.length - seedCredits.length).padStart(6, '0')}`,
          customer: draft.customer,
          balance: remainder,
          source: draft.allocation === 'Keep as customer credit' ? 'Customer payment' : 'Payment remainder',
          updatedAt: '01 Oct 2026'
        }, ...items];
      });
    }

    toast.success(sl('Customer payment saved'), {
      description: remainder > 0 ? `${taka(amount - remainder)} settled · ${taka(remainder)} credit` : `${taka(amount)} settled against due invoices`
    });
    return true;
  };

  const applyCustomerCredit = (credit: CustomerCredit, invoiceId: string, amount: number) => {
    setInvoices((items) => items.map((invoice) => {
      if (invoice.id !== invoiceId) return invoice;
      const paid = Math.min(invoice.total, invoice.paid + amount);
      const due = Math.max(invoice.total - paid, 0);
      return {
        ...invoice,
        paid,
        due,
        method: 'Customer Credit',
        status: due === 0 ? 'Paid' : 'Partial',
        payments: [...invoice.payments, { id: `${invoice.id}-credit-${Date.now()}`, method: 'Customer Credit', amount, account: 'Customer credit' }]
      };
    }));
    setCredits((items) => items.map((item) => item.id === credit.id ? { ...item, balance: Math.max(item.balance - amount, 0), source: `Applied to invoice`, updatedAt: '01 Oct 2026' } : item));
    toast.success(sl('Customer credit applied'), { description: `${credit.customer} · ${taka(amount)}` });
  };

  const refundCustomerCredit = (credit: CustomerCredit, amount: number, method: PaymentMethod, account: string) => {
    setCredits((items) => items.map((item) => item.id === credit.id ? { ...item, balance: Math.max(item.balance - amount, 0), source: `Refunded by ${method}`, updatedAt: '01 Oct 2026' } : item));
    toast.success(sl('Customer credit refunded'), { description: `${credit.customer} · ${taka(amount)}${account.trim() ? ` · ${account.trim()}` : ''}` });
  };

  const completeReturn = () => {
    if (!returnInvoiceIds.length) {
      toast.error(sl('Select invoice items and enter return quantity'));
      return;
    }
    if(includesBundleReturn){
      // Historical component stock/serial, refund and ledger reversal require authenticated
      // backend posting. A preview must never enter the ordinary local-state return mutator.
      setBundleReturnPreviewOpen(true);
      return;
    }
    if (returnIssues.length || getSalesPreviewSnapshot().returns!==returns) {
      toast.error(sl('Check return quantities and serial numbers'), { description: text('Review remaining quantities and original serials. Historical refund allocation must be available.','অবশিষ্ট পরিমাণ ও আগের সিরিয়াল যাচাই করুন। আগের ফেরত মূল্যের তথ্য থাকতে হবে।') });
      return;
    }
    if(returnAmount<=0||!Number.isFinite(returnAmount)){toast.error(sl('Select invoice items and enter return quantity'));return;}
    const selected = selectedReturnInvoices;
    const customerId=selected.find(invoice=>invoice.partyId)?.partyId;
    const newReturn: SalesReturn = {
      id: `RTN-${String(15 + returns.length - seedReturns.length).padStart(6, '0')}`,
      date: '01 Oct 2026',
      customer: returnCustomer,
      ...(customerId?{customerId}:{}),
      lineReturns:ordinaryReturnPlans.filter(plan=>plan.quantity>0).map(({invoiceId,lineId,quantity,amount,serials})=>({invoiceId,lineId,quantity,amount,serials})),
      invoices: selected.map((invoice) => invoice.invoice),
      items: selectedReturnLines
        .filter(({ line }) => (parseFloat(returnQty[line.id] ?? '') || 0) > 0)
        .map(({ line }) => {
          const reason = returnReason[line.id] ?? 'Customer return';
          const serial = (returnSerials[line.id] ?? '').trim();
          return `${line.name} · ${returnQty[line.id]} ${line.unit} · ${reason}${serial ? ` · SN ${serial}` : ''}`;
        })
        .join(', '),
      amount: returnAmount,
      settlement: returnSettlement,
      ...(returnSettlement === 'Cash refund' ? {
        refundMethod: returnRefundMethod,
        ...(returnRefundAccount.trim() ? { refundAccount: returnRefundAccount.trim() } : {})
      } : {})
    };
    setReturns((items) => [newReturn, ...items]);

    const dueAdjustments = new Map<string, number>();
    let remainingAdjustment = returnSettlement === 'Adjust due' ? returnAmount : 0;
    if (returnSettlement === 'Adjust due') {
      for (const invoice of selectedReturnInvoices) {
        if (remainingAdjustment <= 0) break;
        const applied = Math.min(invoice.due, remainingAdjustment);
        if (applied > 0) dueAdjustments.set(invoice.id, applied);
        remainingAdjustment -= applied;
      }
    }

    const creditFromReturn = returnSettlement === 'Customer credit'
      ? returnAmount
      : returnSettlement === 'Adjust due'
        ? Math.max(returnAmount - selectedReturnDue, 0)
        : 0;

    if (creditFromReturn > 0) {
      setCredits((items) => {
        const existing = items.find((credit) => credit.customer === returnCustomer);
        if (existing) return items.map((credit) => credit.id === existing.id ? { ...credit, balance: credit.balance + creditFromReturn, source: newReturn.id, updatedAt: newReturn.date } : credit);
        return [{ id: `CR-${String(32 + items.length - seedCredits.length).padStart(6, '0')}`, ...(customerId?{customerId}:{}), customer: returnCustomer, balance: creditFromReturn, source: newReturn.id, updatedAt: newReturn.date }, ...items];
      });
    }

    setInvoices((items) => items.map((invoice) => {
      if (!returnInvoiceIds.includes(invoice.id)) return invoice;
      const fullReturn = invoice.lines.every(line=>!isBundleReturnLine(line)&&
        (ordinaryReturnPlans.find(plan=>plan.lineId===line.id)?.remaining??0)-(Number(returnQty[line.id]??0))<=0);
      const applied = dueAdjustments.get(invoice.id) ?? 0;
      const due = Math.max(invoice.due - applied, 0);
      const total = applied > 0 ? Math.max(invoice.total - applied, invoice.paid) : invoice.total;
      return { ...invoice, total, due, status: fullReturn ? 'Returned' : 'Part returned' };
    }));
    setReturnInvoiceIds([]);
    setReturnQty({});
    setReturnReason({});
    setReturnSerials({});
    setReturnRefundMethod('Cash');
    setReturnRefundAccount('');
    setTab('returns');
    toast.success(text('Return saved in this preview session','এই প্রিভিউ সেশনে ফেরত রাখা হয়েছে'), { description: `${taka(returnAmount)} · ${returnSettlement}` });
  };

  const renderReturnActions = (item: SalesReturn) => (
<FloatingPanel
                      label={`${sl('Actions for')} ${item.id}`}
                      width={210}
                      trigger={({ toggle, open }) => (
                        <button onClick={toggle} aria-expanded={open} className="rounded-md p-1.5 text-ink-400 hover:bg-ink-50 hover:text-ink" aria-label={`${sl('Actions for')} ${item.id}`}>
                          <MoreHorizontal className="size-4" />
                        </button>
                      )}>
                      {(close) => (
                        <div className="py-1">
                          <button onClick={() => { close(); setReturnDetail(item); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-ink-700 hover:bg-ink-50">
                            <FileText className="size-4 text-ink-400" /> {sl('View return')}
                          </button>
                          <button onClick={() => { close(); printReturn(item,language); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-ink-700 hover:bg-ink-50">
                            <Printer className="size-4 text-ink-400" /> {sl('Print')}
                          </button>
                          <button disabled={!salesReturnCustomerId(item,invoices,availableParties())} title={!salesReturnCustomerId(item,invoices,availableParties())?text('No linked customer account','ক্রেতার কোনো যুক্ত হিসাব নেই'):undefined} onClick={() => { close(); const id=salesReturnCustomerId(item,invoices,availableParties()); if(id)navigate(`/app/parties?id=${encodeURIComponent(id)}&role=Customer`); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-ink-700 hover:bg-ink-50">
                            <BookOpen className="size-4 text-ink-400" /> {sl('Customer ledger')}
                          </button>
                          <button onClick={() => {
                            close();
                            setReturnCustomer(item.customer);
                            setReturnInvoiceIds([]);
                            setReturnQty({});
                            setReturnReason({});
                            setReturnSerials({});
                            setTab('return');
                          }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-ink-700 hover:bg-ink-50">
                            <CornerUpLeft className="size-4 text-ink-400" /> {sl('Start another return')}
                          </button>
                        </div>
                      )}
                    </FloatingPanel>
  );

  const renderCreditActions = (credit: CustomerCredit) => (
<FloatingPanel
                        label={`${sl('Credit actions for')} ${credit.customer}`}
                        width={220}
                        trigger={({ toggle, open }) => (
                          <button
                            onClick={toggle}
                            aria-expanded={open}
                            aria-label={`${sl('Actions for')} ${credit.customer} ${sl('Customer credit')}`}
                            className="rounded-md p-1.5 text-ink-400 hover:bg-ink-50 hover:text-ink">
                            <MoreHorizontal className="size-4" />
                          </button>
                        )}>
                        {(close) => (
                          <div className="py-1">
                            <button
                              disabled={credit.balance <= 0}
                              onClick={() => { close(); setCreditAction({ credit, mode: 'apply' }); }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-ink-700 hover:bg-ink-50 disabled:cursor-not-allowed disabled:text-helper">
                              <FileText className="size-4 text-ink-400" /> {sl('Apply to invoice')}
                            </button>
                            <button
                              disabled={credit.balance <= 0}
                              onClick={() => { close(); setCreditAction({ credit, mode: 'refund' }); }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-ink-700 hover:bg-ink-50 disabled:cursor-not-allowed disabled:text-helper">
                              <Banknote className="size-4 text-ink-400" /> {sl('Refund credit')}
                            </button>
                            <button
                              onClick={() => { close(); navigate(credit.customerId ? `/app/parties?id=${credit.customerId}` : '/app/parties'); }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-ink-700 hover:bg-ink-50">
                              <BookOpen className="size-4 text-ink-400" /> {sl('Customer ledger')}
                            </button>
                          </div>
                        )}
                      </FloatingPanel>
  );

  const invoiceSearch = (<div className="relative min-w-0 flex-1 lg:max-w-lg">
                <Search className="pointer-events-none absolute z-10 left-2.5 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="pl-8"
                  placeholder={text("Search invoice, customer, phone or product","বিল, ক্রেতা, ফোন বা পণ্য খুঁজুন")}
                  aria-label={sl("Search sales")}
                />
              </div>);
  const invoiceFilters = (<><FormSelect
                className="w-full lg:w-44"
                value={customerFilter}
                onChange={(event) => setCustomerFilter(event.target.value)}
                options={[{value:'All customers',label:text('All customers','সব ক্রেতা')},...customerNames]}
              />
              <FormSelect
                className="w-full lg:w-36"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                options={['All status', 'Paid', 'Partial', 'Due', 'Part returned', 'Returned'].map(v=>({value:v,label:text(v,v==='All status'?'সব অবস্থা':v==='Paid'?'পরিশোধ':v==='Partial'?'আংশিক':v==='Due'?'বাকি':v==='Part returned'?'আংশিক ফেরত':'ফেরত')}))}
              />
              <FormSelect
                className="w-full lg:w-40"
                value={method}
                onChange={(event) => setMethod(event.target.value)}
                options={[{value:'All payments',label:text('All payments','সব মাধ্যম')},...paymentMethods.map(m=>({value:m,label:text(m,m==='Cash'?'ক্যাশ':m==='Bank'?'ব্যাংক':m==='Card'?'কার্ড':m)}))]}
              /></>);
  const exportSales = () => downloadReport('hisabiq-sales.csv', ['Invoice','Date','Customer','Phone','Items','Total','Paid','Due','Payment','Status'], filtered.map(invoice => [invoice.invoice,invoice.date,invoice.party,invoice.phone ?? '',invoice.lines.map(line => line.name+' · '+invoiceQty(line)).join('; '),invoice.total,invoice.paid,invoice.due,invoice.payments.map(p => p.method).join(' + ') || invoice.method,invoice.status]));

  const tabs: Array<[Tab, string, string]> = [
    ['sales', text('Sales','বিক্রির তালিকা'), text('Invoice list & management','বিলের তালিকা ও হিসাব')],
    ['return', text('Sales return','বিক্রি ফেরত'), text('Batch return across customer invoices','একসঙ্গে একাধিক বিলের পণ্য ফেরত')],
    ['returns', text('Return history','ফেরতের ইতিহাস'), text('Completed sales returns','আগের ফেরতগুলো')],
    ['credits', text('Customer credit','ক্রেতার অগ্রিম'), text('Payments, settlements and refunds','জমা, হিসাব মেলানো ও ফেরত')],
    ['drafts', text('Drafts & templates','খসড়া ও নমুনা'), text('Continue or reuse sales','আগের খসড়া থেকে বিক্রি করুন')]
  ];

  return (
    <div className="sales-mobile-page mx-auto max-w-[1440px] space-y-4">
      <div className="sales-mobile-header"><PageHeader
        title="Sales"
        titleBn="বিক্রয়"
        description="Manage invoices, collect due payments, handle returns, drafts and reusable sale templates."
        descriptionBn="বিক্রির বিল, বাকি টাকা ও ফেরত পণ্য দেখুন।"
        actions={
          <>
            {isMobile ? <SalesMobileMore outlined label={text('Sales actions','বিক্রির অন্যান্য কাজ')}>{close => <Button variant="outline" size="sm" onClick={() => { close(); navigate('/app/parties'); }}><BookOpen className="size-4" />{text('Customer ledger','ক্রেতার খাতা')}</Button>}</SalesMobileMore> : (<Button variant="outline" size="sm" onClick={() => navigate('/app/parties')}>
              <BookOpen className="size-4" /> {text('Customer ledger','ক্রেতার খাতা')}
            </Button>)}
            <Button size="sm" data-sales-header-new="" onClick={() => navigate('/app/pos')}>
              <Plus className="size-4" /> {text('New sale','নতুন বিক্রি')}
            </Button>
          </>
        }
      /></div>

      {isMobile ? <SalesMobileSummary items={summary.map(item => ({ label: item.label, value: item.value, helper: item.sub, tone: item.tone }))} /> : (<div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {summary.map((item) => (
          <div key={item.label} className="rounded-xl border border-border bg-card px-4 py-3 shadow-card">
            <p className="text-[12.5px] text-ink-500">{item.label}</p>
            <p className={`mt-0.5 text-lg font-semibold ${item.tone ?? 'text-ink'}`}>{item.value}</p>
            <p className="font-bn text-[11px] text-ink-400">{item.sub}</p>
          </div>
        ))}
      </div>)}

      <div className="rounded-xl border border-border bg-card shadow-card">
        <MotionTabList className="flex flex-nowrap gap-1 overflow-x-auto border-b border-border px-3 scrollbar-thin" role="tablist">
          {tabs.map(([id, label, helper]) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              onClick={() => chooseTab(id)}
              title={helper}
              className={`flex shrink-0 items-center gap-1.5 px-2.5 py-2.5 text-[13px] font-medium ${tab === id ? 'text-ink' : 'text-ink-500 hover:text-ink'}`}>
              {label}
              {id === 'sales' && <span className="rounded bg-ink-50 px-1.5 text-[10.5px] text-ink-500">{invoices.length}</span>}
              {id === 'returns' && <span className="rounded bg-ink-50 px-1.5 text-[10.5px] text-ink-500">{returns.length}</span>}
              {id === 'credits' && <span className="rounded bg-ink-50 px-1.5 text-[10.5px] text-ink-500">{credits.filter((credit) => credit.balance > 0).length}</span>}
              {id === 'drafts' && <span className="rounded bg-ink-50 px-1.5 text-[10.5px] text-ink-500">{drafts.length + templates.length}</span>}
            <MotionTabIndicator active={tab === id} /></button>
          ))}
        </MotionTabList>

        {tab === 'sales' && (
          <>
            {isMobile ? <SalesMobileToolbar search={invoiceSearch} filters={invoiceFilters}
              activeCount={Number(customerFilter !== 'All customers') + Number(status !== 'All status') + Number(method !== 'All payments')}
              onClear={() => { setQuery(''); setCustomerFilter('All customers'); setStatus('All status'); setMethod('All payments'); }}
              result={text(`Showing ${filtered.length} of ${invoices.length} invoices`, `মোট ${invoices.length}টি বিলের মধ্যে ${filtered.length}টি দেখাচ্ছে`)}
              actions={close => <><SalesColumnPicker inline visible={visibleSalesColumns} onToggle={toggleSalesColumn} /><Button variant="outline" size="sm" onClick={() => { close(); exportSales(); }}><ArrowDownToLine className="size-4" />{text('Export','ডাউনলোড')}</Button></>} /> : (<SalesWideToolbar search={invoiceSearch} filters={invoiceFilters}
              activeCount={Number(customerFilter !== 'All customers') + Number(status !== 'All status') + Number(method !== 'All payments')}
              actions={<>
              <SalesColumnPicker visible={visibleSalesColumns} onToggle={toggleSalesColumn} />
              <Button variant="outline" size="sm" onClick={() => downloadReport('hisabiq-sales.csv', ['Invoice','Date','Customer','Phone','Items','Total','Paid','Due','Payment','Status'], filtered.map(invoice => [invoice.invoice,invoice.date,invoice.party,invoice.phone ?? '',invoice.lines.map(line => line.name+' · '+invoiceQty(line)).join('; '),invoice.total,invoice.paid,invoice.due,invoice.payments.map(p => p.method).join(' + ') || invoice.method,invoice.status]))}>
                <ArrowDownToLine className="size-4" /> {text('Export','ডাউনলোড')}
              </Button></>} />)}

            {isMobile ? <div aria-label={text('Sales invoices','বিক্রির বিল')} className="sales-mobile-record-list">
              {filtered.map(invoice => <SalesMobileRecord key={invoice.id} actionsInFooter reference={visibleSalesColumns.invoice ? invoice.invoice : ''} name={visibleSalesColumns.customer ? invoice.party : ''} date={visibleSalesColumns.invoice ? invoice.date : undefined}
                status={visibleSalesColumns.status && <PaymentStatus invoice={invoice} />} onOpen={() => setDetail(invoice)}
                onNameOpen={invoice.partyId && visibleSalesColumns.customer ? () => navigate(`/app/parties?id=${invoice.partyId}`) : undefined}
                amount={visibleSalesColumns.total && <>{text('Total','মোট')} <strong className="text-ink">{taka(invoice.total)}</strong></>}
                balance={visibleSalesColumns.due && <>{text('Due','বাকি')} <strong className={invoice.due > 0 ? 'text-danger' : 'text-ink-500'}>{taka(invoice.due)}</strong></>}
                details={<>
                  {visibleSalesColumns.customer && <p>{sl('Customer')}: {invoice.party} · {invoice.phone ?? text('No phone','ফোন নেই')}</p>}
                  {visibleSalesColumns.items && <p>{sl('Items')}: {invoice.lines.map(line => line.name).join(', ')} · {invoice.items}</p>}
                  {visibleSalesColumns.profit && <p>{text('Profit','লাভ')}: {!invoiceCostKnown(invoice) ? text('Cost pending','কেনা দাম বাকি') : <>{invoiceProfit(invoice)<0?'−':''}{taka(Math.abs(invoiceProfit(invoice)),Math.abs(invoiceProfit(invoice))%1?2:0)}</>}</p>}
                  {visibleSalesColumns.paid && <p>{text('Paid','জমা')}: {taka(invoice.paid)}</p>}
                  {visibleSalesColumns.payment && <p>{text('Payment','মাধ্যম')}: {invoice.payments.length > 1 ? text('Multiple','একাধিক মাধ্যম') : text(invoice.method,invoice.method==='Cash'?'ক্যাশ':invoice.method==='Bank'?'ব্যাংক':invoice.method)}</p>}
                  {visibleSalesColumns.invoice && <p>{text('Date','তারিখ')}: {invoice.date} · {invoice.time}</p>}
                </>}
                actions={<InvoiceActions invoice={invoice} onView={() => setDetail(invoice)} onPayment={() => setPaymentTarget(invoice)} onReturn={() => openReturn(invoice)} />} />)}
            </div> : (<Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  {visibleSalesColumns.invoice && <TableHead className="h-9 pl-4 text-xs">{text('Invoice','বিল')}</TableHead>}
                  {visibleSalesColumns.customer && <TableHead className="h-9 text-xs">{sl('Customer')}</TableHead>}
                  {visibleSalesColumns.items && <TableHead className="h-9 text-xs">{sl('Items')}</TableHead>}
                  {visibleSalesColumns.total && <TableHead className="h-9 text-right text-xs">{text('Total','মোট')}</TableHead>}
                  {visibleSalesColumns.profit && <TableHead className="h-9 text-right text-xs" title={sl("Invoice total minus cost of goods sold")}>{text('Profit','লাভ')}</TableHead>}
                  {visibleSalesColumns.paid && <TableHead className="h-9 text-right text-xs">{text('Paid','জমা')}</TableHead>}
                  {visibleSalesColumns.due && <TableHead className="h-9 text-right text-xs">{text('Due','বাকি')}</TableHead>}
                  {visibleSalesColumns.payment && <TableHead className="h-9 text-xs">{text('Payment','মাধ্যম')}</TableHead>}
                  {visibleSalesColumns.status && <TableHead className="h-9 text-xs">{sl('Status')}</TableHead>}
                  <TableHead className="h-9 pr-4 text-right text-xs">{sl('Action')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((invoice) => (
                  <TableRow key={invoice.id} className="cursor-pointer text-[13px]" onClick={() => setDetail(invoice)}>
                    {visibleSalesColumns.invoice && <TableCell className="py-2 pl-4">
                      <span className="font-medium text-ink">{invoice.invoice}</span>
                      <span data-table-helper="" className="block text-[11px] text-ink-400">{invoice.date} · {invoice.time}</span>
                    </TableCell>}
                    {visibleSalesColumns.customer && <TableCell className="py-2">
                      {invoice.partyId ? (
                        <button
                          type="button"
                          data-compact-control
                          onClick={(event) => { event.stopPropagation(); navigate(`/app/parties?id=${invoice.partyId}`); }}
                          className="inline p-0 align-baseline font-medium leading-5 text-teal-700 hover:underline">
                          {invoice.party}
                        </button>
                      ) : <p className="font-medium text-ink">{invoice.party}</p>}
                      <p data-table-helper="" className="text-[11px] text-ink-400">{invoice.phone ?? text('No phone','ফোন নেই')}</p>
                    </TableCell>}
                    {visibleSalesColumns.items && <TableCell className="max-w-[270px] py-2 text-ink-600">
                      <span className="block truncate">{invoice.lines.map((line) => line.name).join(', ')}</span>
                      <span data-table-helper="" className="text-[11px] text-ink-400">{text(`${invoice.items} line${invoice.items === 1 ? '' : 's'}`,`${invoice.items}টি পণ্য`)}</span>
                    </TableCell>}
                    {visibleSalesColumns.total && <TableCell className="py-2 text-right font-medium">{taka(invoice.total)}</TableCell>}
                    {visibleSalesColumns.profit && <TableCell className={`py-2 text-right font-medium ${!invoiceCostKnown(invoice)?'text-warning':invoiceProfit(invoice)<0?'text-danger':'text-success'}`}>
                      {!invoiceCostKnown(invoice)?text('Cost pending','কেনা দাম বাকি'):
                        <>{invoiceProfit(invoice)<0?'−':''}{taka(Math.abs(invoiceProfit(invoice)),Math.abs(invoiceProfit(invoice))%1?2:0)}</>}
                    </TableCell>}
                    {visibleSalesColumns.paid && <TableCell className="py-2 text-right text-ink-600">{taka(invoice.paid)}</TableCell>}
                    {visibleSalesColumns.due && <TableCell className={`py-2 text-right ${invoice.due > 0 ? 'font-medium text-danger' : 'text-helper'}`}>{invoice.due > 0 ? taka(invoice.due) : '—'}</TableCell>}
                    {visibleSalesColumns.payment && <TableCell className="py-2 text-ink-600">{invoice.payments.length > 1 ? text('Multiple','একাধিক মাধ্যম') : text(invoice.method,invoice.method==='Cash'?'ক্যাশ':invoice.method==='Bank'?'ব্যাংক':invoice.method)}</TableCell>}
                    {visibleSalesColumns.status && <TableCell className="py-2"><PaymentStatus invoice={invoice} /></TableCell>}
                    <TableCell className="py-2 pr-4 text-right">
                      <InvoiceActions
                        invoice={invoice}
                        onView={() => setDetail(invoice)}
                        onPayment={() => setPaymentTarget(invoice)}
                        onReturn={() => openReturn(invoice)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>)}

            {filtered.length === 0 && (
              <div className="px-4 py-10 text-center">
                <p className="font-medium text-ink">{text('No sales match','কোনো বিক্রি মেলেনি')}</p>
                <p className="mt-1 text-sm text-ink-500">{text('Try another invoice, customer, phone or filter.','অন্য বিল, নাম, ফোন বা ফিল্টার দিয়ে খুঁজুন।')}</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => { setQuery(''); setCustomerFilter('All customers'); setStatus('All status'); setMethod('All payments'); }}>{text('Clear filters','ফিল্টার মুছুন')}</Button>
              </div>
            )}

            <div className="sales-mobile-invoice-footer flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-2.5 text-xs text-ink-500">
              <span>{text(`Showing ${filtered.length} of ${invoices.length} invoices`,`মোট ${invoices.length}টি বিলের মধ্যে ${filtered.length}টি দেখাচ্ছে`)}</span>
              <span>{text('Click a row to view invoice details','বিস্তারিত দেখতে বিলের লাইনে চাপুন')}</span>
            </div>
          </>
        )}

        {tab === 'return' && (
          <div className="sales-mobile-return-workspace grid min-w-0 grid-cols-1 gap-4 p-4 xl:grid-cols-[340px_minmax(0,1fr)]">
            <SalesMobileDisclosure title={`${returnCustomer} · ${text('Selected invoices','বাছাই করা বিল')}: ${returnInvoiceIds.length}`}><div className="min-w-0 space-y-3">
              <div className="rounded-xl border border-border bg-ink-50/50 p-4">
                <div className="mb-3 flex items-start gap-2">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                    <UserRound className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink">{text('Choose customer','ক্রেতা বাছুন')}</p>
                    <p className="text-xs text-ink-500">{text('Select a customer to load invoices that can be returned together.','ক্রেতা বাছলে ফেরতযোগ্য বিলগুলো দেখা যাবে।')}</p>
                  </div>
                </div>
                <FormSelect
                  className="mt-3"
                  value={returnCustomer}
                  onChange={(event) => {
                    setReturnCustomer(event.target.value);
                    setReturnInvoiceIds([]);
                    setReturnQty({});
                    setReturnReason({});
                    setReturnSerials({});
                  }}
                  options={customerNames}
                />
              </div>

              <div className="rounded-xl border border-border bg-card">
                <div className="border-b border-border p-3">
                  <p className="text-[13px] font-medium text-ink">{sl('Select invoices')} {showHelper&&<span className="font-bn text-[11px] font-normal text-ink-400">· ইনভয়েস বাছুন</span>}</p>
                  <p className="mt-0.5 text-[11px] text-ink-500">{sl("Choose one or more invoices for a batch return.")}</p>
                </div>
                <div className="divide-y divide-border">
                  {customerInvoices.map((invoice) => (
                    <label key={invoice.id} className="flex cursor-pointer items-center gap-3 p-3 hover:bg-ink-50">
                      <input
                        type="checkbox"
                        checked={returnInvoiceIds.includes(invoice.id)}
                        onChange={(event) => {
                          setReturnInvoiceIds((ids) => event.target.checked ? [...ids, invoice.id] : ids.filter((id) => id !== invoice.id));
                          setReturnQty({});
                          setReturnReason({});
                          setReturnSerials({});
                        }}
                        className="size-4 rounded border-ink-300 text-teal-600 focus:ring-teal-500"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] font-medium text-ink">{invoice.invoice}</span>
                        <span className="block text-[11px] text-ink-400">{invoice.date} · {invoice.items} lines · {taka(invoice.total)}</span>
                      </span>
                      <PaymentStatus invoice={invoice} />
                    </label>
                  ))}
                </div>
              </div>
            </div></SalesMobileDisclosure>

            <div className="sales-mobile-return-lines min-w-0 rounded-xl border border-border bg-card">
              <div className="border-b border-border p-3">
                <p className="text-[13px] font-medium text-ink">{sl('Return items')} {showHelper&&<span className="font-bn text-[11px] font-normal text-ink-400">· ফেরত পণ্য</span>}</p>
                <p className="mt-0.5 text-[11px] text-ink-500">{sl("Enter quantity against any item from the selected invoices.")}</p>
              </div>

              {selectedReturnLines.length ? (
                <>
                  <Table className="sales-mobile-return-table">
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="h-9 pl-3 text-xs">{sl('Invoice / item')}</TableHead>
                        <TableHead className="h-9 text-xs">{sl('Sold')}</TableHead>
                        <TableHead className="h-9 w-36 text-xs">{sl('Return qty')}</TableHead>
                        <TableHead className="h-9 pr-3 text-right text-xs">{sl('Refund')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedReturnLines.map(({ invoice, line }) => {
                        const qty = parseFloat(returnQty[line.id] ?? '') || 0;
                        return (
                          <TableRow key={line.id} className="text-[12.5px]">
                            <TableCell className="py-2 pl-3">
                              <p className="font-medium text-ink">{line.name}</p>
                              <p data-table-helper="" className="text-[11px] text-ink-400">{invoice.invoice}</p>
                              {isBundleReturnLine(line)&&!line.bundleSnapshot&&<p data-table-helper="" role="alert" className="mt-1 text-[10.5px] text-danger">{text('Original package snapshot missing — cannot post return','আগের প্যাকেজের তথ্য নেই — ফেরত জমা হবে না')}</p>}
                              {line.bundleSnapshot&&<p data-table-helper="" className="mt-1 text-[10.5px] font-medium text-teal-700">{text('Whole package only · historical recipe v','শুধু সম্পূর্ণ প্যাকেজ · আগের সংস্করণ ')}{line.bundleSnapshot.bundleRevision}</p>}
                              {qty > 0 && (
                                <div className="mt-2 max-w-[260px] space-y-1.5">
                                  <FormSelect
                                    aria-label={`${text('Return reason','ফেরতের কারণ')} · ${line.name}`}
                                    value={returnReason[line.id] ?? 'Customer return'}
                                    onChange={(event) => setReturnReason((value) => ({ ...value, [line.id]: event.target.value }))}
                                    options={salesOptions(language,['Customer return', 'Damaged', 'Wrong item', 'Warranty claim'])}
                                  />
                                  {line.bundleSnapshot&&<div className="space-y-2 rounded-lg border border-border p-2" data-testid="bundle-return-components">
                                    <p data-table-helper="" className="text-[11px] font-semibold">{text('Original included products · choose condition','আগের প্যাকেজের পণ্য · অবস্থা বাছুন')}</p>
                                    {line.bundleSnapshot.components.map(part=>{
                                      const saved=bundleReturnChoices[line.id]?.[part.productId];
                                      return <div key={part.productId} className="space-y-1 rounded-md bg-ink-50 p-2">
                                        <p data-table-helper="" className="text-[11px] font-medium">{part.name} · {Number((part.baseQtyPerSet*qty).toFixed(6))} {part.unit}</p>
                                        <label className="block text-[10px] text-ink-500"><span data-table-helper="">{text('Condition / stock treatment','অবস্থা / স্টক')}</span>
                                          <FormSelect aria-label={`Disposition for ${part.name}`} className="mt-1" value={saved?.disposition??''}
                                            onChange={event=>setBundleReturnChoices(current=>({
                                              ...current,[line.id]:{...current[line.id],[part.productId]:{
                                                disposition:event.target.value as BundleReturnSelection['disposition'],
                                                serials:current[line.id]?.[part.productId]?.serials??[]
                                              }}
                                            }))}
                                            options={[{value:'',label:text('Choose treatment','বাছুন')},
                                              {value:'Restock',label:text('Restock — inspection required','স্টকে ফেরত — যাচাই করতে হবে')},
                                              {value:'Do not restock',label:text('Do not restock — damaged/consumed','স্টকে নয় — নষ্ট/ব্যবহৃত')}]}/>
                                        </label>
                                        {Boolean(part.serials?.length)&&<>
                                          <label className="block text-[10px] text-ink-500"><span data-table-helper="">{text('Returned component serials, comma-separated','ফেরত সিরিয়াল, কমা দিয়ে লিখুন')}</span>
                                            <Input aria-label={`Returned serials for ${part.name}`} className="mt-1 h-9" value={(saved?.serials??[]).join(', ')}
                                              onChange={event=>setBundleReturnChoices(current=>({
                                                ...current,[line.id]:{...current[line.id],[part.productId]:{
                                                  disposition:current[line.id]?.[part.productId]?.disposition??'Do not restock',
                                                  serials:event.target.value.split(',').map(v=>v.trim()).filter(Boolean)
                                                }}
                                              }))}/>
                                          </label>
                                          <p data-table-helper="" className="text-[10px] text-ink-400">{text('Original serials','আগের সিরিয়াল')}: {part.serials?.join(', ')}</p>
                                        </>}
                                        {part.lotAllocations?.length?<p data-table-helper="" className="text-[10px] text-ink-400">{text('Original lots','আগের লট')}: {part.lotAllocations.map(l=>l.lotId).join(', ')}</p>:
                                          <p data-table-helper="" className="text-[10px] text-warning">{text('No original owned-lot evidence; do not restock','আগের লট নেই; স্টকে ফেরত নয়')}</p>}
                                      </div>;
                                    })}
                                  </div>}
                                  {line.serials?.length ? (
                                    <>
                                      <Input
                                        value={returnSerials[line.id] ?? ''}
                                        onChange={(event) => setReturnSerials((value) => ({ ...value, [line.id]: event.target.value }))}
                                        placeholder={sl("Returned serial, comma separated")}
                                        className="h-9"
                                      />
                                      <p data-table-helper="" className="text-[10.5px] text-ink-400">{sl('Sold serials:')} {line.serials.join(', ')}</p>
                                    </>
                                  ) : null}
                                  {(returnReason[line.id] ?? 'Customer return') === 'Warranty claim' && (
                                    <p data-table-helper="" className="text-[10.5px] text-teal-700">{sl("This return will be available for warranty intake.")}</p>
                                  )}
                                </div>
                              )}
                            </TableCell>
                            <TableCell data-mobile-label={sl('Sold')} className="py-2">{invoiceQty(line)}</TableCell>
                            <TableCell data-mobile-label={sl('Return qty')} className="py-2">
                              <div className="flex items-center gap-2">
                                <Input
                                  value={returnQty[line.id] ?? ''}
                                  onChange={(event) => {setReturnQty(value=>({...value,[line.id]:event.target.value}));
                                    if(isBundleReturnLine(line))setBundleReturnChoices(value=>({...value,[line.id]:{}}));}}
                                  inputMode={isBundleReturnLine(line)?'numeric':'decimal'}
                                  aria-label={isBundleReturnLine(line)?`Whole Sets to return for ${line.name}`:`${sl('Return qty')} · ${line.name}`}
                                  aria-invalid={!isBundleReturnLine(line)&&Boolean(returnQty[line.id])&&Boolean(ordinaryReturnPlans.find(plan=>plan.lineId===line.id)?.issues.length)}
                                  className="h-9 text-right"
                                  placeholder="0"
                                />
                                <span data-table-helper="" className="w-10 text-[11px] text-ink-400">{line.unit}</span>
                              </div>
                              <p data-table-helper="" className={`mt-1 text-[10.5px] ${qty > returnLimit(line) ? 'font-medium text-danger' : 'text-ink-400'}`}>
                                {sl('max')} {returnLimit(line)} {line.unit}
                              </p>
                            </TableCell>
                            <TableCell data-mobile-label={sl('Refund')} className="py-2 pr-3">
                              <div className="ml-auto w-28">
                                <Input
                                  value={isBundleReturnLine(line)?String(line.price):ordinaryReturnPlans.find(plan=>plan.lineId===line.id)?.unitPrice===null?text('Source allocation needed','আগের মূল্য প্রয়োজন'):String(Number((ordinaryReturnPlans.find(plan=>plan.lineId===line.id)?.unitPrice??0).toFixed(6)))}
                                  disabled
                                  inputMode="decimal"
                                  className="h-9 text-right"
                                  aria-label={`${sl('Return price for')} ${line.name}`}
                                />
                                <p data-table-helper="" className="mt-1 text-right text-[10.5px] text-ink-400">
                                  {isBundleReturnLine(line)?
                                    (qty>0?text('Historical net refund — see preview','আগের বিক্রির মূল্য — প্রিভিউ দেখুন'):'Set'):
                                    (qty > 0 ? taka(ordinaryReturnPlans.find(plan=>plan.lineId===line.id)?.amount??0) : `/${line.unit}`)}
                                </p>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>

                  <div className="grid gap-3 border-t border-border bg-ink-50/40 p-3 sm:grid-cols-[minmax(0,1fr)_180px_160px] sm:items-end">
                    <label className="text-[12px] font-medium text-ink">
                      {sl('Settlement')}
                      <FormSelect
                        className="mt-1"
                        aria-label={sl('Settlement')}
                        value={returnSettlement}
                        disabled={includesBundleReturn}
                        onChange={(event) => setReturnSettlement(event.target.value as SalesReturn['settlement'])}
                        options={salesOptions(language,['Adjust due', 'Customer credit', 'Cash refund'])}
                      />
                      <span className="mt-1 block text-[10.5px] font-normal text-ink-400">
                        {returnSettlement === 'Adjust due'
                          ? `${sl('Selected invoice due')} ${taka(selectedReturnDue)}. ${sl('Any extra return value becomes customer credit.')}`
                          : returnSettlement === 'Customer credit'
                            ? sl('Keep the full return value on the customer account.')
                            : sl('Refund the return value from cash or another payment account.')}
                      </span>
                    </label>
                    <div className="rounded-lg bg-ink-50 px-3 py-2">
                      <p className="text-[11px] text-ink-400">{sl('Return amount')}</p>
                      <p className="text-base font-semibold text-ink">{includesBundleReturn&&selectedBundlePlans.some(p=>p.refundEstimate===null)?text('Pending historical price','আগের মূল্য যাচাই বাকি'):taka(returnAmount)}</p>
                    </div>
                    <Button data-erp-workflow-action="complete" className="h-12 px-4 text-[15px] font-semibold" disabled={!includesBundleReturn&&returnIssues.length>0} onClick={completeReturn}><CornerUpLeft className="size-4" /> {includesBundleReturn?
                      text('Preview return only','শুধু ফেরত প্রিভিউ'):sl('Complete return')}</Button>
                    {!includesBundleReturn&&returnIssues.length>0&&<p role="alert" className="text-xs text-danger sm:col-span-3">{text('Check the remaining return quantity and original serials. A historical net refund allocation is required.','অবশিষ্ট ফেরত পরিমাণ ও আগের সিরিয়াল যাচাই করুন। আগের ফেরত মূল্যের তথ্য প্রয়োজন।')}</p>}
                    {!includesBundleReturn&&<p role="note" className="text-xs text-ink-500 sm:col-span-3">{text('Historical net price only. This session preview does not post refunds, stock or ledger entries.','শুধু আগের বিক্রির মূল্য। এই সেশনের প্রিভিউতে টাকা ফেরত, স্টক বা খাতায় জমা হবে না।')}</p>}
                    {includesBundleReturn&&<p role="note" className="text-xs text-warning sm:col-span-3">
                      {text('Bundle returns are preview only: no refund, invoice status, credit or stock is changed. Mixed ordinary items are also not submitted.',
                        'প্যাকেজ ফেরত শুধু প্রিভিউ: টাকা, বিল, জমা বা স্টক বদলাবে না। সঙ্গে থাকা অন্য পণ্যও জমা হবে না।')}
                    </p>}
                    {returnSettlement === 'Cash refund' && !includesBundleReturn && (
                      <div className="grid gap-3 sm:col-span-3 sm:grid-cols-2">
                        <label className="text-[12px] font-medium text-ink">
                          {sl('Refund method')}
                          <FormSelect
                            className="mt-1"
                            value={returnRefundMethod}
                            onChange={(event) => setReturnRefundMethod(event.target.value as Exclude<PaymentMethod, 'Customer Credit'>)}
                            options={paymentMethods}
                          />
                        </label>
                        <label className="text-[12px] font-medium text-ink">
                          {sl('Refund account')}
                          <Input
                            className="mt-1"
                            value={returnRefundAccount}
                            onChange={(event) => setReturnRefundAccount(event.target.value)}
                            placeholder={sl(returnRefundMethod === 'Cash' ? 'Cash counter' : 'Bank / wallet account')}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="px-4 py-16 text-center">
                  <CornerUpLeft className="mx-auto size-7 text-helper" />
                  <p className="mt-2 font-medium text-ink">{sl("Select one or more invoices")}</p>
                  <p className="mt-1 text-sm text-ink-500">{sl("Their items will appear here for a batch return.")}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <Dialog open={bundleReturnPreviewOpen} onOpenChange={open=>!open&&setBundleReturnPreviewOpen(false)}>
          <DialogContent role="dialog" aria-label="Bundle return preview" className="sales-mobile-dialog max-h-[92vh] w-[calc(100vw-1rem)] overflow-y-auto sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>{text('Whole-Set return preview','সম্পূর্ণ সেট ফেরত প্রিভিউ')}</DialogTitle>
              <DialogDescription>{text('Historical quantities and original lot/serial evidence only. No stock, refund, credit, invoice or ledger posting.',
                'শুধু আগের পরিমাণ ও লট/সিরিয়াল দেখা যাবে। স্টক বা টাকা বদলাবে না।')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              {selectedBundlePlans.map(plan=><section key={plan.lineId} data-testid="bundle-return-preview-plan" className="rounded-lg border border-border p-3 text-sm">
                <p className="font-semibold">{selectedReturnLines.find(x=>x.line.id===plan.lineId)?.line.name} · {plan.sets} Set · v{plan.bundleRevision}</p>
                <p className="text-xs text-ink-500">{text('Remaining before preview','এখনও ফেরতযোগ্য')}: {plan.remainingSets} Set</p>
                <p className="font-medium">{text('Historical refund estimate','আগের বিক্রির ফেরত মূল্য')}: {plan.refundEstimate===null?
                  text('Pending source allocation','আগের মূল্য যাচাই বাকি'):taka(plan.refundEstimate)}</p>
                {plan.components.map(child=><div key={child.productId} className="mt-2 rounded-md bg-ink-50 p-2 text-xs">
                  <p>{child.name} · {child.returnedBaseQty} {child.unit} · {child.disposition}</p>
                  {child.returnedSerials.length>0&&<p>Serials: {child.returnedSerials.join(', ')}</p>}
                  {child.eligibleLotCandidates.map(lot=><p key={lot.lotId}>{text('Possible original lot','আগের সম্ভাব্য লট')}: {lot.lotId} · {lot.quantity} {child.unit}</p>)}
                  {child.needsConditionInspection&&<p className="text-warning">{text('Inspection, expiry and ownership validation required before any restock','স্টকে ফেরতের আগে অবস্থা, মেয়াদ ও মালিকানা যাচাই করতে হবে')}</p>}
                </div>)}
                {plan.issues.map((issue,index)=><p key={index} role="alert" className="mt-1 text-xs text-danger">{issue}</p>)}
              </section>)}
              {selectedReturnLines.some(x=>!isBundleReturnLine(x.line)&&Number(returnQty[x.line.id]??0)>0)&&
                <p role="note" className="text-xs text-warning">{text('Ordinary lines in this batch have not been returned.','এই ব্যাচের অন্য সাধারণ পণ্য ফেরত হয়নি।')}</p>}
            </div>
            <DialogFooter><Button onClick={()=>setBundleReturnPreviewOpen(false)}>{text('Close preview','প্রিভিউ বন্ধ করুন')}</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        {tab === 'returns' && (
          isMobile ? <div aria-label={sl('Return history')}>{returns.map(item => <SalesMobileRecord key={item.id} reference={item.id} name={item.customer} date={item.date}
            status={<StatusBadge tone={item.settlement === 'Cash refund' ? 'warning' : 'info'}>{sl(item.settlement)}</StatusBadge>}
            meta={<>{item.invoices.join(', ')} · {item.items}{item.refundMethod && <> · {item.refundMethod} {item.refundAccount}</>}</>}
            amount={<>{sl('Amount')} <strong className="text-ink">{taka(item.amount)}</strong></>} onOpen={() => setReturnDetail(item)} actions={renderReturnActions(item)} />)}</div> : (<Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-9 pl-4 text-xs">{sl('Return')}</TableHead>
                <TableHead className="h-9 text-xs">{sl('Customer')}</TableHead>
                <TableHead className="h-9 text-xs">{sl('Invoices')}</TableHead>
                <TableHead className="h-9 text-xs">{sl('Items')}</TableHead>
                <TableHead className="h-9 text-right text-xs">{sl('Amount')}</TableHead>
                <TableHead className="h-9 text-xs">{sl('Settlement')}</TableHead>
                <TableHead className="h-9 pr-4 text-right text-xs">{sl('Action')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {returns.map((item) => (
                <TableRow key={item.id} className="text-[13px]">
                  <TableCell className="py-2 pl-4">
                    <p className="font-medium text-ink">{item.id}</p>
                    <p data-table-helper="" className="text-[11px] text-ink-400">{item.date}</p>
                  </TableCell>
                  <TableCell className="py-2 font-medium">{item.customer}</TableCell>
                  <TableCell className="py-2 text-ink-600">{item.invoices.join(', ')}</TableCell>
                  <TableCell className="max-w-[300px] truncate py-2 text-ink-600">{item.items}</TableCell>
                  <TableCell className="py-2 text-right font-medium">{taka(item.amount)}</TableCell>
                  <TableCell className="py-2">
                    <StatusBadge tone={item.settlement === 'Cash refund' ? 'warning' : 'info'}>{sl(item.settlement)}</StatusBadge>
                    {item.refundMethod && <p data-table-helper="" className="mt-1 text-[10.5px] text-ink-400">{item.refundMethod}{item.refundAccount ? ` · ${item.refundAccount}` : ''}</p>}
                  </TableCell>
                  <TableCell className="py-2 pr-4 text-right">
                    {renderReturnActions(item)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>)
        )}


        {tab === 'credits' && (
          <div>
            <div className="flex flex-col gap-2 border-b border-border p-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[13px] font-medium text-ink">{sl('Customer payments & credit')} {showHelper&&<span className="font-bn text-[11px] font-normal text-ink-400">· কাস্টমার জমা</span>}</p>
                <p className="mt-0.5 text-[11px] text-ink-500">{sl("Receive customer payments, settle invoice dues, keep advance credit, or refund unused credit.")}</p>
              </div>
              <Button size="sm" data-sales-credit-receive="" onClick={() => setCustomerPaymentOpen(true)}>
                <Plus className="size-4" /> {sl("Receive customer payment")}
              </Button>
            </div>

            {isMobile ? <div aria-label={sl('Customer credit')}>{credits.map(credit => <SalesMobileRecord key={credit.id} reference={credit.id} name={credit.customer} date={credit.updatedAt}
              meta={credit.source} status={<StatusBadge tone={credit.balance > 0 ? 'teal' : 'neutral'}>{sl(credit.balance > 0 ? 'Available' : 'Settled')}</StatusBadge>}
              amount={<>{sl('Credit balance')} <strong className="text-teal-700">{taka(credit.balance)}</strong></>} actions={renderCreditActions(credit)} />)}</div> : (<Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-9 pl-4 text-xs">{sl('Customer')}</TableHead>
                  <TableHead className="h-9 text-xs">{sl('Source')}</TableHead>
                  <TableHead className="h-9 text-xs">{sl('Updated')}</TableHead>
                  <TableHead className="h-9 text-right text-xs">{sl('Credit balance')}</TableHead>
                  <TableHead className="h-9 text-xs">{sl('Status')}</TableHead>
                  <TableHead className="h-9 pr-4 text-right text-xs">{sl('Action')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {credits.map((credit) => (
                  <TableRow key={credit.id} className="text-[13px]">
                    <TableCell className="py-2 pl-4">
                      <p className="font-medium text-ink">{credit.customer}</p>
                      <p data-table-helper="" className="text-[11px] text-ink-400">{credit.id}</p>
                    </TableCell>
                    <TableCell className="py-2 text-ink-600">{credit.source}</TableCell>
                    <TableCell className="py-2 text-ink-500">{credit.updatedAt}</TableCell>
                    <TableCell className="py-2 text-right font-medium">{taka(credit.balance)}</TableCell>
                    <TableCell className="py-2">
                      <StatusBadge tone={credit.balance > 0 ? 'teal' : 'neutral'} dot={credit.balance > 0}>
                        {sl(credit.balance > 0 ? 'Available' : 'Settled')}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="py-2 pr-4 text-right">
                      {renderCreditActions(credit)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>)}

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-2.5 text-xs text-ink-500">
              <span>{sl("Total customer credit")} {taka(creditTotal)}</span>
              <span>{sl("Credit can settle invoice due or be refunded from a selected account")}</span>
            </div>
          </div>
        )}

        {tab === 'drafts' && (
          <div className="sales-mobile-drafts grid gap-4 p-4 xl:grid-cols-2">
            <section className="overflow-hidden rounded-xl border border-border">
              <div className="flex items-center justify-between border-b border-border p-3">
                <div>
                  <p className="flex items-center gap-2 text-sm font-semibold text-ink"><FileClock className="size-4 text-teal-700" /> {sl('Draft sales')} {showHelper&&<span className="font-bn text-[11px] font-normal text-ink-400">· খসড়া</span>}</p>
                  <p className="mt-0.5 text-[11px] text-ink-500">{sl('Continue, edit, duplicate or archive a held sale.')}</p>
                </div>
                <StatusBadge tone="teal">{drafts.length}</StatusBadge>
              </div>
              <div className="divide-y divide-border">
                {drafts.map((draft) => (
                  <div key={draft.id} className="p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[13px] font-medium text-ink">{draft.label} · {draft.customer ?? text('Walk-in customer','সাধারণ ক্রেতা')}</p>
                        <p className="mt-0.5 text-[11px] text-ink-400">{draft.items} {sl('items')} · {draft.savedAt}</p>
                      </div>
                      <span className="text-[13px] font-semibold">{taka(draft.total)}</span>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <Button size="sm" onClick={() => { toast(`${draft.label} ${sl('continued in POS')}`); navigate(`/app/pos?mode=continue-draft&draft=${draft.id}`); }}>{sl('Continue')}</Button>
                      <FloatingPanel
                        label={`Actions for ${draft.label}`}
                        width={190}
                        trigger={({ toggle, open }) => (
                          <Button size="sm" variant="outline" onClick={toggle} aria-expanded={open}><MoreHorizontal className="size-4" /> {sl('Actions')}</Button>
                        )}>
                        {(close) => (
                          <div className="py-1">
                            <button onClick={() => { close(); toast(`${draft.label} ${sl('opened for editing')}`); navigate(`/app/pos?mode=edit-draft&draft=${draft.id}`); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-ink-700 hover:bg-ink-50">
                              <Pencil className="size-4 text-ink-400" /> {sl('Edit')}
                            </button>
                            <button onClick={() => { close(); toast(`${draft.label} ${sl('duplicated')}`); navigate(`/app/pos?mode=duplicate-draft&draft=${draft.id}`); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-ink-700 hover:bg-ink-50">
                              <Copy className="size-4 text-ink-400" /> {sl('Duplicate')}
                            </button>
                            <button onClick={() => {
                              close();
                              const ctx={tenantId:settings.state.tenantId,actorId:settings.actorId,allowed:canManage(settings.state,settings.actorId,'sales')};
                              try{deleteSalesDraft(draft.id,ctx,new Date().toISOString());toast('Draft moved to Recycle Bin',{action:{label:'Undo',onClick:()=>{try{restoreSalesDraft(draft.id,ctx,new Date().toISOString());}catch(error){toast.error(error instanceof Error?error.message:'Could not restore.');}}}});}catch(error){toast.error(error instanceof Error?error.message:'Could not archive draft.');}
                            }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-danger hover:bg-danger-bg">
                              <Trash2 className="size-4" /> {sl('Archive')}
                            </button>
                          </div>
                        )}
                      </FloatingPanel>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="overflow-hidden rounded-xl border border-border">
              <div className="flex items-center justify-between border-b border-border p-3">
                <div>
                  <p className="flex items-center gap-2 text-sm font-semibold text-ink"><FileText className="size-4 text-teal-700" /> {sl('Sale templates')} {showHelper&&<span className="font-bn text-[11px] font-normal text-ink-400">· টেমপ্লেট</span>}</p>
                  <p className="mt-0.5 text-[11px] text-ink-500">{sl('Reuse common carts without recreating every line.')}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => setTemplateEditor({template:null})}><Plus className="size-3.5" /> {sl('Template')}</Button>
              </div>
              <div className="divide-y divide-border">
                {templates.map((template) => (
                  <div key={template.id} className="p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[13px] font-medium text-ink">{template.name}</p>
                        <p className="mt-0.5 text-[11px] text-ink-400">{template.customer ?? sl('Any customer')} · {template.items} {sl('items')} · {sl('last used')} {template.lastUsed==='Not used yet'?sl('Not used yet'):template.lastUsed}</p>
                      </div>
                      <span className="text-[13px] font-semibold">{taka(template.total)}</span>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <Button size="sm" onClick={() => { toast(`${template.name} ${sl('loaded into POS')}`); navigate(`/app/pos?mode=template&template=${template.id}`); }}>{sl('Use template')}</Button>
                      <FloatingPanel
                        label={`Actions for ${template.name}`}
                        width={190}
                        trigger={({ toggle, open }) => (
                          <Button size="sm" variant="outline" onClick={toggle} aria-expanded={open}><MoreHorizontal className="size-4" /> {sl('Actions')}</Button>
                        )}>
                        {(close) => (
                          <div className="py-1">
                            <button onClick={() => { close(); setTemplateEditor({template}); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-ink-700 hover:bg-ink-50">
                              <Pencil className="size-4 text-ink-400" /> {sl('Edit template')}
                            </button>
                            <button onClick={() => {
                              close();
                              try {
                                saveSaleTemplate({...template,name:`${template.name} copy`});
                                toast.success(`${template.name} ${sl('duplicated')}`);
                              } catch {
                                toast.error(text('Could not duplicate this template. Open Edit template to check its products.','এই নমুনা নকল করা যায়নি। পণ্য যাচাই করতে নমুনা বদলান।'));
                              }
                            }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-ink-700 hover:bg-ink-50">
                              <Copy className="size-4 text-ink-400" /> {sl('Duplicate')}
                            </button>
                            <button onClick={() => {
                              close();
                              setTemplates((items) => items.filter((item) => item.id !== template.id));
                              toast.error(`${template.name} ${sl('deleted')}`);
                            }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-danger hover:bg-danger-bg">
                              <Trash2 className="size-4" /> {sl('Delete')}
                            </button>
                          </div>
                        )}
                      </FloatingPanel>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>

      <InvoiceDialog
        onPresentation={setDetail}
        invoice={detail}
        onClose={() => setDetail(null)}
        onPayment={(invoice) => { setDetail(null); setPaymentTarget(invoice); }}
        onReturn={openReturn}
      />

      <PaymentDialog
        invoice={paymentTarget}
        onClose={() => setPaymentTarget(null)}
        onSave={savePayment}
      />

      {templateEditor&&<SaleTemplateDialog template={templateEditor.template} onClose={()=>setTemplateEditor(null)}/> }
      <CustomerPaymentDialog
        open={customerPaymentOpen}
        customers={customerNames.filter((customer) => customer !== 'Walk-in customer')}
        onClose={() => setCustomerPaymentOpen(false)}
        onSave={receiveCustomerPayment}
      />

      <CreditActionDialog
        action={creditAction}
        invoices={invoices}
        onClose={() => setCreditAction(null)}
        onApply={applyCustomerCredit}
        onRefund={refundCustomerCredit}
      />
      <Dialog open={!!returnDetail} onOpenChange={open => !open && setReturnDetail(null)}>
        <DialogContent role="dialog" aria-label={sl('Sales return details')} className="sales-mobile-dialog max-h-[92dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader><DialogTitle>{returnDetail?.id}</DialogTitle><DialogDescription>{sl('Return source preview · no new refund or stock movement.')}</DialogDescription></DialogHeader>
          {returnDetail && <dl className="space-y-2 text-sm">{returnDocument(returnDetail,language).rows.map(([label,value]) => <div key={String(label)} className="flex flex-wrap justify-between gap-2"><dt className="text-ink-500">{label}</dt><dd className="max-w-full break-words text-ink">{value}</dd></div>)}</dl>}
          <DialogFooter><Button variant="outline" onClick={() => setReturnDetail(null)}>{sl('Close')}</Button><Button onClick={() => returnDetail && printReturn(returnDetail,language)}>{sl('Print return')}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

