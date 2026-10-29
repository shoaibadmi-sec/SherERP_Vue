import { MotionTabList, MotionTabIndicator } from '../motion/MotionTabList';
import {matchesSearch as fuzzyMatch} from '../utils/fuzzySearch';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '../components/Dialog';
import {PurchaseSourceDialog} from '../components/purchases/PurchaseSourceDialog';
import {purchasePosition,sourceEditable,sourceReturnable} from '../utils/purchaseSource';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowDownToLine,
  FileText,
  MoreHorizontal,
  Paperclip,
  Plus,
  Search,
  Undo2
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/Button';
import { FormSelect } from '../components/FormSelect';
import { Input } from '../components/Input';
import { PageHeader } from '../components/PageHeader';
import {useUiCopy} from '../i18n/useUiCopy';
import {documentLabel} from '../i18n/documentCopy';
import {purchaseLabel,purchaseReturnMethod} from '../i18n/purchaseCopy';
import { StatusBadge } from '../components/StatusBadge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/Table';
import { BillDetailDialog, type BillDetail } from '../components/purchases/BillDetailDialog';
import { availablePurchases, availablePurchaseEvents } from '../data/erpDemoStore';
import type { Purchase } from '../types/erp';
import { taka } from '../utils/currency';
import { FloatingPanel } from '../components/layout/FloatingPanel';
import { printReport, downloadReport } from '../utils/reportOutput';
import { availableProducts } from '../data/erpDemoStore';

type Tab = 'purchases' | 'return' | 'return-history';

const sampleReturnHistory = [
  { id: 'PR-000028', date: '29 Sep 2026', purchase: 'PUR-000117', supplier: 'Bismillah Steel House', items: 'MS Angle 1.5" · 45 Kg', amount: 4410, method: 'Supplier credit' },
  { id: 'PR-000027', date: '24 Sep 2026', purchase: 'PUR-000115', supplier: 'Hossain Electric', items: 'Ceiling Fan Regulator · 2 Pcs', amount: 510, method: 'Cash refund' },
  { id: 'PR-000026', date: '18 Sep 2026', purchase: 'PUR-000114', supplier: 'Bismillah Steel House', items: 'GI Wire 14 SWG · 12 Kg', amount: 1512, method: 'Supplier credit' }
];

function PayStatus({ total, paid }: { total: number; paid: number }) {
  const {text}=useUiCopy();
  if (paid >= total) return <StatusBadge tone="success" dot>{text('Paid','পরিশোধ')}</StatusBadge>;
  if (paid > 0) return <StatusBadge tone="warning" dot>{text('Partial','আংশিক')}</StatusBadge>;
  return <StatusBadge tone="danger" dot>{text('Due','বাকি')}</StatusBadge>;
}

function ReceiptThumb({ src, onClick }: { src?: string; onClick: () => void }) {
  const {language}=useUiCopy();
  if (!src) return <span className="text-xs text-helper">—</span>;
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="group relative block size-8 overflow-hidden rounded-md border border-border"
      aria-label={purchaseLabel(language,'View receipt')}>
      <img src={src} alt="" className="h-full w-full object-cover" />
      <span className="absolute inset-0 flex items-center justify-center bg-inverse/40 opacity-0 transition-opacity group-hover:opacity-100">
        <Paperclip className="size-3 text-white" />
      </span>
    </button>
  );
}

export function Purchases() {
  const {text,language}=useUiCopy();
  const pl=(s:string)=>purchaseLabel(language,s);
  const navigate = useNavigate();
  const [searchParams,setSearchParams]=useSearchParams();
  const routeTab=searchParams.get('tab');
  const [tab,setTab]=useState<Tab>(()=>routeTab==='return'||routeTab==='return-history'?routeTab:'purchases');
  useEffect(()=>{setTab(routeTab==='return'||routeTab==='return-history'?routeTab:'purchases');},[routeTab]);
  const chooseTab=(value:Tab)=>{setTab(value);setSearchParams(current=>{
   const next=new URLSearchParams(current);if(value==='purchases')next.delete('tab');else next.set('tab',value);return next;
  },{replace:true});};
  const [purchases,setPurchases] = useState<Purchase[]>(availablePurchases);
  const [sourceAction,setSourceAction]=useState<{purchase:Purchase;mode:'correction'|'payment'|'return'}|null>(null);
  const [events,setEvents]=useState(availablePurchaseEvents);
  const returnHistory=[...events.filter(e=>e.kind==='return').map(e=>({id:e.id,date:e.date,purchase:e.before.ref,supplier:e.before.supplier,items:(e.lines??[]).map(l=>(e.before.cartSnapshot?.[l.index].product.name??'Product')+' · '+l.quantity+' base units').join(', '),amount:e.amount,method:e.settlement==='cash'?'Refund '+taka(e.refund):'Supplier credit'})),...sampleReturnHistory];
  const [historySource,setHistorySource]=useState<Purchase|null>(null);
  const position=(p:Purchase)=>purchasePosition(p,events);
  const updated=(p:Purchase)=>{setPurchases(availablePurchases());setEvents(availablePurchaseEvents());setReturnPurchase(p);setSourceAction(null);toast.success(text('Purchase preview saved','ক্রয়ের প্রিভিউ সংরক্ষিত'),{description:text('Source history retained; backend posting is not connected.','আগের হিসাবের ইতিহাস আছে। আসল সার্ভারের খাতায় লেখা হয়নি।')});};
  const [detail, setDetail] = useState<BillDetail | null>(null);
  const routeQuery=searchParams.get('q') ?? '';
  const [query, setQuery] = useState(routeQuery);
  useEffect(()=>setQuery(routeQuery),[routeQuery]);
  const [returnQuery, setReturnQuery] = useState('');
  const [returnPurchase, setReturnPurchase] = useState<Purchase | null>(null);
  const [supplierFilter, setSupplierFilter] = useState('All suppliers');
  const [statusFilter, setStatusFilter] = useState('All status');
  const [returnError, setReturnError] = useState('');
  const openBill = (p: Purchase) => setDetail({ref: p.ref, date: p.date, party: p.supplier, partyId: p.supplierId, description: p.items, total: position(p).total, paid: position(p).paid, payments: p.payments, receipt: p.receipt});
  const resetFilters = () => { setQuery(''); setSupplierFilter('All suppliers'); setStatusFilter('All status'); };
  const printPurchase = (p: Purchase) => { const label=(s:string)=>documentLabel(language,s); if (!printReport({title:p.ref,language,subtitle:label('Purchase bill preview'),headers:[label('Field'),label('Value')],rows:[[label('Date'),p.date],[label('Supplier'),p.supplier],[label('Items'),p.items],[label('Total'),p.total],[label('Paid'),p.paid],[text('Due','দেনা'),p.total-p.paid]]})) toast.error(text('Allow the print popup and try again.','প্রিন্টের উইন্ডো খুলতে দিন, তারপর আবার চেষ্টা করুন।')); };
  const reviewReturn = (p: Purchase) => { setReturnPurchase(p); setReturnQuery(p.ref); setReturnError(''); chooseTab('return'); };

  const filteredPurchases = useMemo(() => purchases.filter(p => {
    const q = query.trim().toLocaleLowerCase();
    const status = position(p).paid >= position(p).total ? 'Paid' : position(p).paid > 0 ? 'Partial' : 'Due';
    return (supplierFilter === 'All suppliers' || p.supplier === supplierFilter)
      && (statusFilter === 'All status' || status === statusFilter)
      && fuzzyMatch(q,[p.ref,p.supplier,p.items,p.date]);
  }), [purchases,events,query,supplierFilter,statusFilter]);

  const purchaseTotal = purchases.reduce((sum, p) => sum + position(p).total, 0);
  const paidTotal = purchases.reduce((sum, p) => sum + position(p).paid, 0);
  const supplierDue = purchaseTotal - paidTotal;
  const returnsTotal = returnHistory.reduce((sum, item) => sum + item.amount, 0);

  const summary = [
    { label: text('Purchase total','ক্রয়ের মোট'), value: taka(purchaseTotal), sub: text(`${purchases.length} purchase invoices`,`${purchases.length}টি ক্রয় বিল`) },
    { label: text('Due to suppliers','সরবরাহকারীকে দেনা'), value: taka(supplierDue), sub: text('Supplier payable · দেনা','সরবরাহকারীর পাওনা'), tone: 'text-danger' },
    { label: text('Paid total','মোট পরিশোধ'), value: taka(paidTotal), sub: text('Cash, bank & mobile','ক্যাশ, ব্যাংক ও মোবাইল') },
    { label: text('Preview returns','প্রিভিউ ফেরত'), value: taka(returnsTotal), sub: text(`${returnHistory.length} preview / sample memos`,`${returnHistory.length}টি নমুনা/প্রিভিউ ফেরত`), tone: 'text-warning' }
  ];

  const selectReturnPurchase = () => {
    const q = returnQuery.trim().toLocaleLowerCase();
    setReturnPurchase(null);
    if (!q) { setReturnError('Enter the purchase reference or supplier name.'); return; }
    const exact = purchases.find(p => p.ref.toLocaleLowerCase() === q);
    const matches = exact ? [exact] : purchases.filter(p => fuzzyMatch(q,[p.ref,p.supplier]));
    if (!matches.length) { setReturnError('No purchase found. Check the reference.'); return; }
    if (matches.length > 1) { setReturnError('Several purchases match. Enter the exact purchase reference.'); return; }
    setReturnError(''); setReturnPurchase(matches[0]);
  };

  const tabs: Array<[Tab, string, string]> = [
    ['purchases', pl('Purchases'), pl('Purchase list & management')],
    ['return', text('Purchase return','ক্রয় ফেরত'), text('Review original purchase and return data','কেনা পণ্য ফেরতের হিসাব')],
    ['return-history', text('Return history','ফেরতের ইতিহাস'), text('Sample return history','ফেরতের নমুনা ও ইতিহাস')]
  ];

  return (
    <div className="mx-auto max-w-[1440px] space-y-4">
      <PageHeader
        title="Purchases"
        titleBn="ক্রয়"
        description="Purchase stock, manage supplier bills, update purchases and handle purchase returns."
        descriptionBn="পণ্য কেনা, সরবরাহকারীর বিল ও ফেরত দেখুন।"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => navigate('/app/parties')}>
              <FileText className="size-4" /> {text('Supplier ledger','সরবরাহকারীর খাতা')}
            </Button>
            <Button size="sm" onClick={() => navigate('/app/purchases/new')}>
              <Plus className="size-4" /> {text('New purchase','নতুন ক্রয়')}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {summary.map((item) => (
          <div key={item.label} className="rounded-xl border border-border bg-card px-4 py-3 shadow-card">
            <p className="text-[12.5px] text-ink-500">{item.label}</p>
            <p className={`mt-0.5 text-lg font-semibold ${item.tone ?? 'text-ink'}`}>{item.value}</p>
            <p className="font-bn text-[11px] text-ink-400">{item.sub}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card shadow-card">
        <MotionTabList className="flex flex-wrap gap-1 border-b border-border px-3" role="tablist">
          {tabs.map(([id, label, helper]) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              onClick={() => chooseTab(id)}
              title={helper}
              className={`flex items-center gap-1.5 px-2.5 py-2.5 text-[13px] font-medium ${
                tab === id ? 'text-ink' : 'text-ink-500 hover:text-ink'
              }`}>
              {label}
              {id === 'purchases' && (
                <span className="rounded bg-ink-50 px-1.5 text-[10.5px] text-ink-500">{purchases.length}</span>
              )}
              {id === 'return-history' && (
                <span className="rounded bg-ink-50 px-1.5 text-[10.5px] text-ink-500">{returnHistory.length}</span>
              )}
            <MotionTabIndicator active={tab === id} /></button>
          ))}
        </MotionTabList>

        {tab === 'purchases' && (
          <>
            <div className="flex flex-col gap-2 border-b border-border p-3 lg:flex-row lg:items-center">
              <div className="relative min-w-0 flex-1 sm:max-w-md">
                <Search className="pointer-events-none absolute z-10 left-2.5 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
                <Input
                  aria-label={pl('Search purchases')}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-8"
                  placeholder={text("Search purchase ID, supplier or product","ক্রয় নম্বর, সরবরাহকারী বা পণ্য খুঁজুন")}
                />
              </div>
              <FormSelect aria-label={pl('Purchase supplier filter')} className="w-full sm:w-40" value={supplierFilter} onChange={e => setSupplierFilter(e.target.value)} options={[{value:'All suppliers',label:text('All suppliers','সব সরবরাহকারী')},...Array.from(new Set(purchases.map(p => p.supplier)))]} />
              <FormSelect aria-label={pl('Purchase status filter')} className="w-full sm:w-36" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} options={['All status', 'Paid', 'Partial', 'Due'].map(v=>({value:v,label:text(v,v==='All status'?'সব অবস্থা':v==='Paid'?'পরিশোধ':v==='Partial'?'আংশিক':'বাকি')}))} />
              <Button variant="outline" size="sm" onClick={resetFilters}>
                {pl("Reset filters")}
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-9 pl-4 text-xs" >{text('Purchase','ক্রয়')}</TableHead>
                  <TableHead className="h-9 text-xs" >{text('Supplier','সরবরাহকারী')}</TableHead>
                  <TableHead className="h-9 text-xs">{text('Items','পণ্য')}</TableHead>
                  <TableHead className="h-9 text-xs">{text('Memo','রসিদ')}</TableHead>
                  <TableHead className="h-9 text-right text-xs">{text('Total','মোট')}</TableHead>
                  <TableHead className="h-9 text-right text-xs">{text('Paid','পরিশোধ')}</TableHead>
                  <TableHead className="h-9 text-right text-xs">{text('Due','দেনা')}</TableHead>
                  <TableHead className="h-9 text-xs">{text('Status','অবস্থা')}</TableHead>
                  <TableHead className="h-9 pr-4 text-right text-xs">{text('Action','কাজ')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPurchases.map((p) => {
                  const open = () => openBill(p);
                  return (
                    <TableRow key={p.id} className="cursor-pointer text-[13px]" onClick={open}>
                      <TableCell className="py-2 pl-4">
                        <span className="font-medium text-ink">{p.ref}</span>
                        <span data-table-helper="" className="block text-[11px] text-ink-400">{p.date}</span>
                      </TableCell>
                      <TableCell className="py-2">
                        <Link
                          to={`/app/parties?id=${p.supplierId}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-medium text-teal-700 hover:underline">
                          {p.supplier}
                        </Link>
                      </TableCell>
                      <TableCell className="max-w-[260px] truncate py-2 text-ink-600">{p.items}</TableCell>
                      <TableCell className="py-2"><ReceiptThumb src={p.receipt} onClick={open} /></TableCell>
                      <TableCell className="py-2 text-right font-medium">{taka(position(p).total)}</TableCell>
                      <TableCell className="py-2 text-right text-ink-600">{taka(position(p).paid)}</TableCell>
                      <TableCell className={`py-2 text-right ${position(p).due > 0 ? 'font-medium text-danger' : 'text-ink-400'}`}>
                        {position(p).due > 0 ? taka(position(p).due) : '—'}
                      </TableCell>
                      <TableCell className="py-2"><PayStatus total={position(p).total} paid={position(p).paid} /></TableCell>
                      <TableCell className="py-2 pr-4 text-right">
                        <div onClick={e => e.stopPropagation()}>
                          <FloatingPanel label={`${pl("Actions for")} ${p.ref}`} width={190} trigger={({toggle}) => <button onClick={toggle} className="rounded-md p-1.5 text-ink-500 hover:bg-ink-50" aria-label={`${pl("Actions for")} ${p.ref}`}><MoreHorizontal className="size-4" /></button>}>
                            {close => <div className="p-1 text-left text-xs">
                              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => {close();openBill(p);}}>{text('View bill','বিল দেখুন')}</Button>
                              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => {close();printPurchase(p);}}>{text('Print bill','বিল প্রিন্ট')}</Button>
                              <Button variant="ghost" size="sm" className="w-full justify-start" disabled={!sourceEditable(p)||events.some(e=>e.purchaseId===p.id&&e.kind!=='correction')} title={pl('Complete original snapshots and no later allocations required')} onClick={()=>{close();setSourceAction({purchase:p,mode:'correction'});}}>{text('Correct purchase','ক্রয় সংশোধন')}</Button>
                              <Button variant="ghost" size="sm" className="w-full justify-start" disabled={!sourceEditable(p)||position(p).due<=0} title={pl('Payment needs a complete source bill with supplier due')} onClick={()=>{close();setSourceAction({purchase:p,mode:'payment'});}}>{text('Pay due','বাকি দিন')}</Button>
                              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => {close();reviewReturn(p);}}>{text('Review return','ফেরত যাচাই')}</Button>
                              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={()=>{close();setHistorySource(p);}}>{text('Source history','পরিবর্তনের ইতিহাস')}</Button>
                            </div>}
                          </FloatingPanel>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!filteredPurchases.length && <TableRow><TableCell colSpan={9} className="py-8 text-center text-sm text-ink-500">{text('No purchases match these filters.','কোনো ক্রয় মেলেনি।')} <button onClick={resetFilters} className="text-teal-700 underline">{text('Reset filters','ফিল্টার মুছুন')}</button></TableCell></TableRow>}
              </TableBody>
            </Table>
          </>
        )}

        {tab === 'return' && (
          <div className="p-4">
            <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
              <div className="rounded-xl border border-border bg-ink-50/50 p-4">
                <div className="mb-3 flex items-start gap-2">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                    <Search className="size-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-ink">{text('Find original purchase','আগের ক্রয় খুঁজুন')}</h3>
                    <p className="text-xs text-ink-500">{text('Search by Purchase ID or supplier name.','ক্রয় নম্বর বা সরবরাহকারীর নাম দিয়ে খুঁজুন।')}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Input
                    value={returnQuery}
                    onChange={(e) => setReturnQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && selectReturnPurchase()}
                    aria-label={text("Find purchase reference","ক্রয় নম্বর খুঁজুন")}
                    placeholder={pl('PUR-000117 or supplier name')}
                  />
                  <Button className="w-full" onClick={selectReturnPurchase}>
                    <Search className="size-4" /> {pl('Find purchase')}
                  </Button>
                  {returnError && <p role="alert" className="text-xs text-danger">{pl(returnError)}</p>}
                </div>
                <div className="mt-4 border-t border-border pt-3 text-xs text-ink-500">
                  {text('Returns need original item prices, historical units and remaining returnable quantities. No refund or stock movement is posted in this source review.','পণ্য ফেরতের জন্য আগের কেনা দাম, একক ও কতটা ফেরত দেওয়া যাবে তা দেখুন। এই প্রিভিউতে আসল টাকা বা স্টক বদলাবে না।')}
                </div>
              </div>

              <div role="region" aria-label={pl('Purchase return source')} className="min-w-0 rounded-xl border border-border bg-card">
                {!returnPurchase ? (
                  <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
                    <Undo2 className="mb-3 size-8 text-helper" />
                    <p className="text-sm font-medium text-ink">{text('No purchase selected','কোনো ক্রয় বাছা হয়নি')}</p>
                    <p className="mt-1 max-w-md text-xs text-ink-500">
                      {pl('Enter a purchase reference to review its source. Never calculate a refund from a bill summary.')}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col gap-2 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-ink">{returnPurchase.ref}</p>
                        <p className="text-xs text-ink-500">{returnPurchase.supplier} · {returnPurchase.date}</p>
                      </div>
                      <StatusBadge tone="teal">{pl('Source review')}</StatusBadge>
                    </div>
                    <div className="space-y-3 p-4">
                      <p className="text-sm text-ink">{returnPurchase.items}</p>
                      <dl className="grid grid-cols-3 gap-2 rounded-lg bg-ink-50 p-3 text-xs">
                        <div><dt className="text-ink-500">{pl('Bill total')}</dt><dd className="font-semibold">{taka(returnPurchase.total)}</dd></div>
                        <div><dt className="text-ink-500">{pl('Paid')}</dt><dd>{taka(returnPurchase.paid)}</dd></div>
                        <div><dt className="text-ink-500">{pl('Due')}</dt><dd>{taka(returnPurchase.total-returnPurchase.paid)}</dd></div>
                      </dl>
                      {!!returnPurchase.inventoryLines?.length && <section aria-label={pl('Purchase source item snapshots')} className="space-y-2 rounded-lg border border-border p-3 text-xs">
                        <h4 className="font-semibold text-ink">{pl('Original item snapshots')}</h4>
                        {returnPurchase.inventoryLines.map((line,i) => <div key={i} className="flex flex-wrap justify-between gap-2 border-t border-border pt-2">
                          <span>{availableProducts().find(p => p.id === line.productId)?.name ?? line.productId}</span>
                          <span>{line.quantity} {pl('base units')} · {pl('Cost')} {line.unitCost === undefined ? pl('not available') : taka(line.unitCost)} {pl('per base unit')}</span>
                        </div>)}
                      </section>}
                      {sourceReturnable(returnPurchase)?<Button onClick={()=>setSourceAction({purchase:returnPurchase,mode:'return'})}>{pl('Choose return quantities')}</Button>:                      <div role="status" className="rounded-lg border border-border bg-warning-bg p-3 text-xs text-ink-700">
                        <p className="font-semibold">{pl('Return quantities unavailable · ফেরতযোগ্য পরিমাণ নেই')}</p>
                        <p className="mt-1">{pl('Check the original bill and previous returns first. Summary-only bills and tracked-stock returns need verified original units, serials/batches and allocation data from integration.')}</p>
                        <p className="mt-1">{pl('No return, refund or supplier credit has been recorded.')}</p>
                      </div>}
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button variant="outline" onClick={() => setReturnPurchase(null)}>{pl('Choose another purchase')}</Button>
                        <Button onClick={() => openBill(returnPurchase)}>{pl('View original bill')}</Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === 'return-history' && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-3">
              <div>
                <p className="text-[13px] font-medium text-ink">{pl('Purchase return history')}</p>
                <p className="text-[11px] text-ink-500">{pl('Preview and sample history · refunds and source purchases. Not live accounting records.')}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => downloadReport('hisabiq-purchase-return-preview.csv', ['Reference','Date','Purchase','Supplier','Items','Amount','Method'], returnHistory.map(item => [item.id,item.date,item.purchase,item.supplier,item.items,item.amount,item.method]))}>
                <ArrowDownToLine className="size-4" /> {pl('Export')}
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-9 pl-4 text-xs">{pl('Return')}</TableHead>
                  <TableHead className="h-9 text-xs" >{text('Purchase','ক্রয়')}</TableHead>
                  <TableHead className="h-9 text-xs" >{text('Supplier','সরবরাহকারী')}</TableHead>
                  <TableHead className="h-9 text-xs">{pl('Returned items')}</TableHead>
                  <TableHead className="h-9 text-xs">{pl('Refund method')}</TableHead>
                  <TableHead className="h-9 pr-4 text-right text-xs">{pl('Amount')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {returnHistory.map((item) => (
                  <TableRow key={item.id} className="text-[13px]">
                    <TableCell className="py-2 pl-4">
                      <span className="font-medium text-ink">{item.id}</span>
                      <span data-table-helper="" className="block text-[11px] text-ink-400">{item.date}</span>
                    </TableCell>
                    <TableCell className="py-2 text-teal-700">{item.purchase}</TableCell>
                    <TableCell className="py-2">{item.supplier}</TableCell>
                    <TableCell className="max-w-[280px] truncate py-2 text-ink-600">{item.items}</TableCell>
                    <TableCell className="py-2">
                      <StatusBadge tone={item.method === 'Cash refund' ? 'success' : 'neutral'}>{purchaseReturnMethod(language,item.method)}</StatusBadge>
                    </TableCell>
                    <TableCell className="py-2 pr-4 text-right font-medium">{taka(item.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </div>

      {sourceAction&&<PurchaseSourceDialog key={sourceAction.purchase.id+'-'+sourceAction.purchase.sourceRevision+'-'+sourceAction.mode} purchase={sourceAction.purchase} mode={sourceAction.mode} onClose={()=>setSourceAction(null)} onSaved={updated}/>}
      {historySource&&<Dialog open onOpenChange={value=>!value&&setHistorySource(null)}><DialogContent role="dialog" aria-modal="true" aria-label={pl('Purchase source history')} className="space-y-2 rounded-xl border border-border bg-card p-4 text-sm text-ink">
        <DialogHeader><DialogTitle>{pl('Source history')} · {historySource.ref}</DialogTitle><DialogDescription>{pl('UI preview source changes; backend posting is not connected.')}</DialogDescription></DialogHeader>
        <p>{pl('Supplier credit')} {taka(position(historySource).credit)} · {pl('Returns')} {taka(position(historySource).returned)}</p>
        {events.filter(e=>e.purchaseId===historySource.id).map(e=><p key={e.id}>{e.date} · {pl(e.kind)} · {e.reason} · {taka(e.amount)} {e.kind==='return'?' · '+pl(e.settlement??''):''}</p>)}
        {!events.some(e=>e.purchaseId===historySource.id)&&<p>{pl('No changes recorded in this preview.')}</p>}
        <Button onClick={()=>setHistorySource(null)}>{pl('Close history')}</Button>
      </DialogContent></Dialog>}
      <BillDetailDialog bill={detail} onClose={() => setDetail(null)} />
    </div>
  );
}

