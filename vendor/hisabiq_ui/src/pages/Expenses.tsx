import { MotionTabList, MotionTabIndicator } from '../motion/MotionTabList';
import {matchesSearch as fuzzyMatch} from '../utils/fuzzySearch';
import { useMemo, useState, useSyncExternalStore } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDownToLine,
  BarChart3,
  MoreHorizontal,
  Paperclip,
  Plus,
  Printer,
  Search,
  Settings2
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/Button';
import { FormSelect } from '../components/FormSelect';
import { AppDateRangePicker } from '../components/AppDateRangePicker';
import { expenseDateIso, formatRange, type IsoRange } from '../utils/dateRange';
import { Input } from '../components/Input';
import { PageHeader } from '../components/PageHeader';
import {useUiCopy} from '../i18n/useUiCopy';
import {documentLabel,documentMethod} from '../i18n/documentCopy';
import { StatusBadge } from '../components/StatusBadge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/Table';
import { BillDialog } from '../components/purchases/BillDialog';
import { BillDetailDialog, type BillDetail } from '../components/purchases/BillDetailDialog';
import { expensePaymentMethods, getExpensePreviewSnapshot, subscribeExpensePreview, savePreviewExpense, cancelPreviewExpense, attachPreviewExpenseReceipt } from '../data/expensePreviewStore';
import { getPartyPreviewSnapshot, subscribePartyPreview, dispatchPartyPreview } from '../data/partyPreviewStore';
import { PartyEditorDialog } from '../components/parties/PartyEditorDialog';
import { FloatingPanel } from '../components/layout/FloatingPanel';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/Dialog';
import { printReport, downloadReport } from '../utils/reportOutput';
import { availableParties, expenseCategoryRecords, createPreviewExpenseCategory, renamePreviewExpenseCategory, setPreviewExpenseCategoryActive } from '../data/erpDemoStore';
import type { Expense, Party } from '../types/erp';
import { taka } from '../utils/currency';

type Tab = 'expenses' | 'categories' | 'payees' | 'reports';

const reportPaymentMethods = expensePaymentMethods;

function paymentsFor(expense: Expense) {
  if (expense.payments?.length) return expense.payments;
  if (expense.paid <= 0) return [];
  return [{ id: `legacy-${expense.id}`, method: expense.method, amount: expense.paid }];
}

function paymentLabel(expense: Expense) {
  const payments = paymentsFor(expense);
  if (payments.length > 1) return 'Multiple';
  return payments[0]?.method ?? expense.method;
}

const payeesForPreview = () => availableParties()
  .filter((party) => party.roles.some((role) => role === 'Payee' || role === 'Vendor'))
  .map((party) => ({
    id: party.id,
    name: party.name,
    phone: party.phone,
    active: party.status !== 'Inactive',
    lastUsed: party.lastActivity
  }));

function ReceiptThumb({ src, onClick }: { src?: string; onClick: () => void }) {
  const {text}=useUiCopy();
  if (!src) return <span className="text-xs text-helper">—</span>;
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="group relative block size-8 overflow-hidden rounded-md border border-border"
      aria-label={text("View receipt","রসিদ দেখুন")}>
      <img src={src} alt="" className="h-full w-full object-cover" />
      <span className="absolute inset-0 flex items-center justify-center bg-inverse/40 opacity-0 transition-opacity group-hover:opacity-100">
        <Paperclip className="size-3 text-white" />
      </span>
    </button>
  );
}

export function Expenses() {
  const {text,language,showHelper}=useUiCopy();
  const [tab, setTab] = useState<Tab>('expenses');
  const { expenses, audit } = useSyncExternalStore(subscribeExpensePreview, getExpensePreviewSnapshot);
  useSyncExternalStore(subscribePartyPreview, getPartyPreviewSnapshot);
  const payees = payeesForPreview();
  const [, refreshCategories] = useState(0);
  const categories = expenseCategoryRecords();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = expenses.find(item => item.id === selectedId);
  const detail: BillDetail | null = selected ? { ref: selected.ref, date: selected.date, party: selected.payee, partyId: selected.payeeId, category: selected.category, description: selected.note, total: selected.amount, paid: selected.paid, payments: selected.payments, receipt: selected.receipt, cancelled: selected.recordStatus === 'Deleted' } : null;
  const [editing, setEditing] = useState<Expense | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('All categories');
  const [payeeFilter, setPayeeFilter] = useState('All payees');
  const [methodFilter, setMethodFilter] = useState('All payment methods');
  const [statusFilter, setStatusFilter] = useState('Active');
  const [categoryEditor, setCategoryEditor] = useState<{ previous?: string; name: string } | null>(null);
  const [payeeEditor, setPayeeEditor] = useState<{ party?: Party } | null>(null);
  const [cancelling, setCancelling] = useState<Expense | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [actionError, setActionError] = useState('');
  const activeExpenses = expenses.filter(item => item.recordStatus !== 'Deleted');
  const resetFilters = () => { setQuery(''); setCategoryFilter('All categories'); setPayeeFilter('All payees'); setMethodFilter('All payment methods'); setStatusFilter('Active'); };
  const reportFor = (items: Expense[], title = 'Expense list') => ({ title, subtitle: 'Expense source preview', headers: ['Reference', 'Date', 'Category', 'Payee', 'Details', 'Amount', 'Paid', 'Due', 'Status'], rows: items.map(e => [e.ref, e.date, e.category, e.payee, e.note, e.amount, e.paid, e.amount - e.paid, e.recordStatus === 'Deleted' ? 'Cancelled' : 'Active']) });
  const printExpenses = (items: Expense[], title?: string) => { const report=reportFor(items,title); if (!printReport({...report,language,subtitle:documentLabel(language,report.subtitle),headers:report.headers.map(h=>documentLabel(language,h)),rows:report.rows.map(row=>row.map((value,index)=>index===8?documentLabel(language,String(value)):value))})) toast.error(text('Allow the print popup and try again.','প্রিন্টের উইন্ডো খুলতে দিন, তারপর আবার চেষ্টা করুন।')); };
  const exportExpenses = (items: Expense[], filename: string) => { const report = reportFor(items); downloadReport(filename, report.headers, report.rows); };
  const openCorrection = (expense: Expense) => { setSelectedId(null); setEditing(expense); setDialogOpen(true); };
  const [query, setQuery] = useState('');
  // Keep the initial demonstration report on September's seeded expense entries.
  const [reportRange, setReportRange] = useState<IsoRange>({ from: '2026-09-01', to: '2026-09-30' });
  const reportExpenses = useMemo(() => expenses.filter((expense) => {
    if (expense.recordStatus === 'Deleted') return false;
    const day = expenseDateIso(expense.date);
    return !!day && (!reportRange.from || day >= reportRange.from) && (!reportRange.to || day <= reportRange.to);
  }), [expenses, reportRange.from, reportRange.to]);
  const reportPeriod = reportRange.from === '2026-09-01' && reportRange.to === '2026-09-30'
    ? text('Sep 2026','সেপ্টেম্বর ২০২৬') : formatRange(reportRange);


  const filteredExpenses = useMemo(() => expenses.filter(expense => {
    const q = query.trim().toLocaleLowerCase();
    const active = expense.recordStatus !== 'Deleted';
    return (statusFilter === 'All status' || active === (statusFilter === 'Active'))
      && (categoryFilter === 'All categories' || expense.category === categoryFilter)
      && (payeeFilter === 'All payees' || expense.payee === payeeFilter)
      && (methodFilter === 'All payment methods' || paymentsFor(expense).some(payment => payment.method === methodFilter))
      && fuzzyMatch(q,[expense.ref,expense.category,expense.payee,expense.note,paymentLabel(expense),expense.date]);
  }), [expenses, query, categoryFilter, payeeFilter, methodFilter, statusFilter]);
  const total = activeExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const cash = activeExpenses.reduce((sum, expense) => sum + paymentsFor(expense).filter(p => p.method === 'Cash').reduce((paid, p) => paid + p.amount, 0), 0);
  const bankAndMfs = activeExpenses.reduce((sum, expense) => sum + paymentsFor(expense).filter(p => p.method !== 'Cash').reduce((paid, p) => paid + p.amount, 0), 0);
  const categoryCount = new Set(activeExpenses.map(expense => expense.category)).size;

  const tabs: Array<[Tab, string, string]> = [
    ['expenses', text('Expense list','খরচের তালিকা'), text('History, filters, edit and cancel','খরচের ইতিহাস, খোঁজ ও সংশোধন')],
    ['categories', text('Categories','খরচের ধরন'), text('Expense category settings','খরচের ধরন পরিচালনা')],
    ['payees', text('Payees','টাকা প্রাপক'), text('People and businesses paid','যাদের টাকা দেওয়া হয়')],
    ['reports', text('Reports','রিপোর্ট'), text('Category, payee and payment method analysis','খরচের ধরন ও টাকা দেওয়ার মাধ্যম')]
  ];

  const summary = [
    { label: text('Active expenses','চালু খরচ'), value: taka(total), sub: `${activeExpenses.length} ${text('active entries','টি চালু খরচ')}` },
    { label: text('Cash expenses','নগদ খরচ'), value: taka(cash), sub: text('Paid from cash','নগদে দেওয়া হয়েছে') },
    { label: text('Bank & mobile','ব্যাংক ও মোবাইল'), value: taka(bankAndMfs), sub: text('Bank, bKash, Nagad & card','ব্যাংক, বিকাশ, নগদ ও কার্ড') },
    { label: text('Categories used','খরচের ধরন'), value: String(categoryCount), sub: text('Used in active entries','চালু খরচে ব্যবহার হয়েছে') }
  ];

  return (
    <div className="mx-auto max-w-[1440px] space-y-4">
      <PageHeader
        title="Expenses"
        titleBn="খরচ"
        description="Record operating expenses, manage categories and payees, and review expense reports."
        descriptionBn="খরচ লিখুন, প্রাপক ও খরচের ধরন দেখুন।"
        actions={
          <Button size="sm" onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <Plus className="size-4" /> {text('Add expense','খরচ যোগ করুন')}
          </Button>
        }
      />

      <p className="text-xs text-ink-500">{text('UI preview · changes stay in this browser session. Cash and ledger posting require backend integration.','শুধু প্রিভিউ। এই ব্রাউজারেই পরিবর্তন থাকবে; আসল ক্যাশ ও খাতায় লেনদেনের জন্য সার্ভার সংযোগ দরকার।')}</p>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {summary.map((item) => (
          <div key={item.label} className="rounded-xl border border-border bg-card px-4 py-3 shadow-card">
            <p className="text-[12.5px] text-ink-500">{item.label}</p>
            <p className="mt-0.5 text-lg font-semibold text-ink">{item.value}</p>
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
              onClick={() => setTab(id)}
              title={helper}
              className={`flex items-center gap-1.5 px-2.5 py-2.5 text-[13px] font-medium ${
                tab === id ? 'text-ink' : 'text-ink-500 hover:text-ink'
              }`}>
              {label}
              {id === 'expenses' && (
                <span className="rounded bg-ink-50 px-1.5 text-[10.5px] text-ink-500">{expenses.length}</span>
              )}
            <MotionTabIndicator active={tab === id} /></button>
          ))}
        </MotionTabList>

        {tab === 'expenses' && (
          <>
            <div className="flex flex-col gap-2 border-b border-border p-3 lg:flex-row lg:items-center">
              <div className="relative min-w-0 flex-1 lg:max-w-md">
                <Search className="pointer-events-none absolute z-10 left-2.5 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-8"
                  placeholder={text("Search expense, payee, category or reference","খরচ, প্রাপক, ধরন বা রেফারেন্স খুঁজুন")}
                />
              </div>
              <FormSelect aria-label={text("Expense category filter","খরচের ধরন বাছুন")} className="w-full lg:w-40" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} options={[{value:'All categories',label:text('All categories','সব ধরন')},...new Set([...categories.map(c => c.name), ...expenses.map(e => e.category)])]} />
              <FormSelect aria-label={text("Expense payee filter","টাকা প্রাপক বাছুন")} className="w-full lg:w-40" value={payeeFilter} onChange={e => setPayeeFilter(e.target.value)} options={[{value:'All payees',label:text('All payees','সব প্রাপক')},...new Set([...payees.map(p => p.name), ...expenses.map(e => e.payee)])]} />
              <FormSelect aria-label={text("Expense payment filter","খরচের মাধ্যম বাছুন")} className="w-full lg:w-40" value={methodFilter} onChange={e => setMethodFilter(e.target.value)} options={['All payment methods', ...expensePaymentMethods].map(v=>({value:v,label:text(v,v==='All payment methods'?'সব মাধ্যম':v==='Cash'?'ক্যাশ':v==='Bank'?'ব্যাংক':v==='Card'?'কার্ড':v==='Mobile Banking'?'মোবাইল ব্যাংকিং':v)}))} />
              <FormSelect aria-label={text("Expense status filter","খরচের অবস্থা বাছুন")} className="w-full lg:w-32" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} options={['All status', 'Active', 'Cancelled'].map(v=>({value:v,label:text(v,v==='All status'?'সব অবস্থা':v==='Active'?'চালু':'বাতিল')}))} />
              <Button variant="ghost" size="sm" onClick={resetFilters}>{text('Reset','রিসেট')}</Button>
              <Button variant="outline" size="sm" onClick={() => exportExpenses(filteredExpenses, 'hisabiq-expenses.csv')}>
                <ArrowDownToLine className="size-4" /> {text('Export','ডাউনলোড')}
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-9 pl-4 text-xs">{text('Expense','খরচ')}</TableHead>
                  <TableHead className="h-9 text-xs" >{text('Category','ধরন')}</TableHead>
                  <TableHead className="h-9 text-xs" >{text('Payee','প্রাপক')}</TableHead>
                  <TableHead className="h-9 text-xs">{text('Receipt','রসিদ')}</TableHead>
                  <TableHead className="h-9 text-xs">{text('Method','মাধ্যম')}</TableHead>
                  <TableHead className="h-9 text-xs">{text('Reference','রেফারেন্স')}</TableHead>
                  <TableHead className="h-9 text-right text-xs">{text('Amount','টাকা')}</TableHead>
                  <TableHead className="h-9 text-xs" >{text('Status','অবস্থা')}</TableHead>
                  <TableHead className="h-9 pr-4 text-right text-xs" >{text('Action','কাজ')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.map((expense) => {
                  const open = () => setSelectedId(expense.id);
                  return (
                    <TableRow key={expense.id} className="cursor-pointer text-[13px]" onClick={open}>
                      <TableCell className="py-2 pl-4">
                        <span className="font-medium text-ink">{expense.ref}</span>
                        <span data-table-helper="" className="block text-[11px] text-ink-400">{expense.date}</span>
                      </TableCell>
                      <TableCell className="py-2"><StatusBadge tone="neutral">{expense.category}</StatusBadge></TableCell>
                      <TableCell className="py-2">
                        {expense.payeeId ? (
                          <Link
                            to={`/app/parties?id=${expense.payeeId}`}
                            onClick={(event) => event.stopPropagation()}
                            className="font-medium text-teal-700 hover:underline">
                            {expense.payee}
                          </Link>
                        ) : (
                          <span className="text-ink-700">{expense.payee}</span>
                        )}
                        <span data-table-helper="" className="block max-w-[220px] truncate text-[11px] text-ink-400">{expense.note}</span>
                      </TableCell>
                      <TableCell className="py-2"><ReceiptThumb src={expense.receipt} onClick={open} /></TableCell>
                      <TableCell className="py-2 text-ink-600">
                        {paymentLabel(expense) === 'Multiple' ? text('Multiple','একাধিক') : documentMethod(language,paymentLabel(expense))}
                        {expense.payments && expense.payments.length > 1 && (
                          <span data-table-helper="" className="block text-[10.5px] text-ink-400">
                            {expense.payments.map((payment) => payment.method).join(' + ')}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="py-2 text-ink-500">—</TableCell>
                      <TableCell className="py-2 text-right font-medium">{taka(expense.amount)}</TableCell>
                      <TableCell className="py-2"><StatusBadge tone={expense.recordStatus === 'Deleted' ? 'neutral' : 'success'} dot>{expense.recordStatus === 'Deleted' ? text('Cancelled','বাতিল') : text('Active','চালু')}</StatusBadge></TableCell>
                      <TableCell className="py-2 pr-4 text-right">
                        <div onClick={event => event.stopPropagation()}>
                          <FloatingPanel label={`${text('Actions for','কাজের তালিকা:')} ${expense.ref}`} width={190} trigger={({toggle}) => <button onClick={toggle} className="rounded-md p-1.5 text-ink-500 hover:bg-ink-50" aria-label={`${text('Actions for','কাজের তালিকা:')} ${expense.ref}`}><MoreHorizontal className="size-4" /></button>}>
                            {close => <div className="p-1 text-left text-xs">
                              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => { close(); open(); }}>{text('View','দেখুন')}</Button>
                              <Button variant="ghost" size="sm" className="w-full justify-start" disabled={expense.recordStatus === 'Deleted'} onClick={() => { close(); openCorrection(expense); }}>{text('Correct','সংশোধন')}</Button>
                              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => { close(); printExpenses([expense], expense.ref); }}>{text('Print','প্রিন্ট')}</Button>
                              <Button variant="ghost" size="sm" className="w-full justify-start text-danger" disabled={expense.recordStatus === 'Deleted'} onClick={() => { close(); setCancelling(expense); setCancelReason(''); setActionError(''); }}>{text('Cancel expense','খরচ বাতিল')}</Button>
                            </div>}
                          </FloatingPanel>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!filteredExpenses.length && <TableRow><TableCell colSpan={9} className="py-8 text-center text-sm text-ink-500">{text('No expenses match these filters.','কোনো খরচ মেলেনি।')} <button className="text-teal-700 underline" onClick={resetFilters}>{text('Reset filters','ফিল্টার মুছুন')}</button></TableCell></TableRow>}
              </TableBody>
            </Table>
          </>
        )}

        {tab === 'categories' && (
          <div>
            <div className="flex items-center justify-between gap-3 border-b border-border p-3">
              <div>
                <p className="text-[13px] font-medium text-ink">{text("Expense categories","খরচের ধরনসমূহ")}</p>
                <p className="text-[11px] text-ink-500">{text("Manage categories for new entries. Renaming keeps historical expense labels.","নতুন খরচের ধরন যোগ বা বদলান। আগের খরচের তথ্য বদলাবে না।")}</p>
              </div>
              <Button size="sm" onClick={() => { setCategoryEditor({name: ''}); setActionError(''); }}>
                <Plus className="size-4" /> {text("Add category","ধরন যোগ করুন")}
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-9 pl-4 text-xs" >{text('Category','ধরন')}</TableHead>
                  <TableHead className="h-9 text-xs">{text('Description','বিবরণ')}</TableHead>
                  <TableHead className="h-9 text-right text-xs">{text('Active total','চালু খরচের মোট')}</TableHead>
                  <TableHead className="h-9 text-xs" >{text('Status','অবস্থা')}</TableHead>
                  <TableHead className="h-9 pr-4 text-right text-xs" >{text('Action','কাজ')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map(({name: category, active}) => {
                  const amount = activeExpenses.filter((expense) => expense.category === category).reduce((sum, expense) => sum + expense.amount, 0);
                  return (
                    <TableRow key={category} className="text-[13px]">
                      <TableCell className="py-2 pl-4 font-medium text-ink">{category}</TableCell>
                      <TableCell className="py-2 text-ink-500">{text("Operating expense category","দোকানের খরচের ধরন")}</TableCell>
                      <TableCell className="py-2 text-right">{amount ? taka(amount) : '—'}</TableCell>
                      <TableCell className="py-2"><StatusBadge tone={active ? 'success' : 'neutral'} dot>{text(active ? 'Active' : 'Inactive',active ? 'চালু' : 'বন্ধ')}</StatusBadge></TableCell>
                      <TableCell className="py-2 pr-4 text-right">
                        <div className="flex flex-wrap justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => { setCategoryEditor({previous: category, name: category}); setActionError(''); }}>{text("Edit","সম্পাদনা")}</Button>
                          <Button variant="ghost" size="sm" onClick={() => { setPreviewExpenseCategoryActive(category, !active); refreshCategories(n => n + 1); }}>{text(active ? 'Deactivate' : 'Activate',active ? 'বন্ধ করুন' : 'চালু করুন')}</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {tab === 'payees' && (
          <div>
            <div className="flex items-center justify-between gap-3 border-b border-border p-3">
              <div>
                <p className="text-[13px] font-medium text-ink">{text("Expense payees","টাকা প্রাপকদের তালিকা")}</p>
                <p className="text-[11px] text-ink-500">{text("Reusable payees. Payees with linked transactions cannot be deactivated.","প্রাপকের নাম আবার ব্যবহার করা যাবে। আগের লেনদেন থাকলে বন্ধ করা যাবে না।")}</p>
              </div>
              <Button size="sm" onClick={() => setPayeeEditor({})}>
                <Plus className="size-4" /> {text("Add payee","প্রাপক যোগ করুন")}
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-9 pl-4 text-xs" >{text('Payee','প্রাপক')}</TableHead>
                  <TableHead className="h-9 text-xs">{text('Phone','ফোন')}</TableHead>
                  <TableHead className="h-9 text-xs">{text('Last used','শেষ ব্যবহার')}</TableHead>
                  <TableHead className="h-9 text-right text-xs">{text('Total paid','মোট দেওয়া')}</TableHead>
                  <TableHead className="h-9 text-xs" >{text('Status','অবস্থা')}</TableHead>
                  <TableHead className="h-9 pr-4 text-right text-xs" >{text('Action','কাজ')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payees.map((payee) => {
                  const paid = activeExpenses.filter((expense) => expense.payeeId === payee.id).reduce((sum, expense) => sum + expense.paid, 0);
                  return (
                    <TableRow key={payee.id} className="text-[13px]">
                      <TableCell className="py-2 pl-4">
                        <Link to={`/app/parties?id=${payee.id}`} className="font-medium text-teal-700 hover:underline">{payee.name}</Link>
                      </TableCell>
                      <TableCell className="py-2 text-ink-600">{payee.phone || '—'}</TableCell>
                      <TableCell className="py-2 text-ink-500">{payee.lastUsed}</TableCell>
                      <TableCell className="py-2 text-right">{paid ? taka(paid) : '—'}</TableCell>
                      <TableCell className="py-2"><StatusBadge tone={payee.active ? 'success' : 'neutral'} dot>{text(payee.active ? 'Active' : 'Inactive',payee.active ? 'চালু' : 'বন্ধ')}</StatusBadge></TableCell>
                      <TableCell className="py-2 pr-4 text-right">
                        <div className="flex flex-wrap justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => setPayeeEditor({party: availableParties().find(p => p.id === payee.id)})}>{text("Edit","সম্পাদনা")}</Button>
                          <Button variant="ghost" size="sm" disabled={!payee.active || expenses.some(e => e.payeeId === payee.id) || getPartyPreviewSnapshot().sources.some(s => s.partyId === payee.id && s.status === 'Active' && s.kind !== 'note')} title={text("Linked transaction history is retained; linked payees cannot be deactivated.","আগের লেনদেন থাকবে। লেনদেন থাকা প্রাপককে বন্ধ করা যাবে না।")} onClick={() => { try { dispatchPartyPreview({type: 'deactivate-party', id: payee.id}); } catch(e) { toast.error(e instanceof Error ? e.message : text('Could not deactivate payee.','প্রাপক বন্ধ করা যায়নি।')); } }}>{text("Deactivate","বন্ধ করুন")}</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {tab === 'reports' && (
          <div className="p-4">
            <div className="mb-4 flex flex-col gap-2 rounded-xl border border-border bg-ink-50/50 p-3 sm:flex-row sm:items-end">
              <div className="w-full sm:w-auto">
                <p className="mb-1 text-[12px] font-medium text-ink">{text("Date range","সময়কাল")} {showHelper&&<span className="font-bn text-ink-400">· সময়কাল</span>}</p>
                <AppDateRangePicker label={text("Expense report date range","খরচের রিপোর্টের তারিখ")} className="w-full sm:w-[280px]"
                  value={reportRange} onChange={setReportRange} />
              </div>

              <div className="flex-1" />
              <Button variant="outline" size="sm" onClick={() => printExpenses(reportExpenses, text('Expense report · ','খরচের রিপোর্ট · ') + reportPeriod)}>
                <Printer className="size-4" /> {text("Print","প্রিন্ট")}
              </Button>
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
              {[
                {
                  title: text('By category','খরচের ধরন অনুযায়ী'),
                  icon: Settings2,
                  rows: Array.from(new Set(reportExpenses.map(e => e.category))).map((category) => ({
                    label: category,
                    value: reportExpenses.filter((expense) => expense.category === category).reduce((sum, expense) => sum + expense.amount, 0)
                  })).filter((row) => row.value > 0)
                },
                {
                  title: text('By payee','প্রাপক অনুযায়ী'),
                  icon: Search,
                  rows: Array.from(new Set(reportExpenses.map((expense) => expense.payee))).map((payee) => ({
                    label: payee,
                    value: reportExpenses.filter((expense) => expense.payee === payee).reduce((sum, expense) => sum + expense.amount, 0)
                  })).sort((a, b) => b.value - a.value).slice(0, 6)
                },
                {
                  title: text('By payment method','পেমেন্টের মাধ্যম অনুযায়ী'),
                  icon: BarChart3,
                  rows: reportPaymentMethods.map((method) => ({
                    label: documentMethod(language,method),
                    value: reportExpenses.reduce((sum, expense) =>
                      sum + paymentsFor(expense)
                        .filter((payment) => payment.method === method)
                        .reduce((paymentSum, payment) => paymentSum + payment.amount, 0), 0)
                  })).filter((row) => row.value > 0).sort((a, b) => b.value - a.value)
                }
              ].map((group) => {
                const max = Math.max(...group.rows.map((row) => row.value), 1);
                const Icon = group.icon;
                return (
                  <div key={group.title} className="rounded-xl border border-border bg-card p-4">
                    <div className="mb-4 flex items-center gap-2">
                      <span className="flex size-8 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                        <Icon className="size-4" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-ink">{group.title}</p>
                        <p className="text-[11px] text-ink-500">{reportPeriod}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {!group.rows.length && <p className="text-xs text-ink-500">{text("No expenses in this date range.","এই সময়ে কোনো খরচ নেই।")}</p>}
                      {group.rows.map((row) => (
                        <div key={row.label}>
                          <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                            <span className="truncate text-ink-600">{documentMethod(language,row.label)}</span>
                            <span className="font-medium text-ink">{taka(row.value)}</span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-ink-50">
                            <div className="h-full rounded-full bg-teal-500" style={{ width: `${Math.max((row.value / max) * 100, 4)}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <BillDialog mode="expense" open={dialogOpen} expense={editing}
        onOpenChange={open => { setDialogOpen(open); if (!open) setEditing(null); }}
        nextRef={`EXP-${String(Math.max(61, ...expenses.map(e => Number(e.ref.replace('EXP-', '')) || 0)) + 1).padStart(6, '0')}`}
        onSavePurchase={() => undefined}
        onSaveExpense={expense => { savePreviewExpense(expense); setDialogOpen(false); setEditing(null); setTab('expenses'); resetFilters(); toast.success(`${expense.ref} ${text('saved in preview','প্রিভিউতে রাখা হয়েছে')}`); }}
        onSaveCorrection={(expense, reason) => { savePreviewExpense(expense, reason); setDialogOpen(false); setEditing(null); setSelectedId(expense.id); toast.success(text('Expense preview corrected','প্রিভিউ খরচ সংশোধন হয়েছে')); }} />
      <BillDetailDialog bill={detail} onClose={() => setSelectedId(null)}
        onEdit={selected && selected.recordStatus !== 'Deleted' ? () => openCorrection(selected) : undefined}
        onPay={selected && selected.recordStatus !== 'Deleted' ? () => openCorrection(selected) : undefined}
        onReceiptChange={selected && selected.recordStatus !== 'Deleted' ? receipt => attachPreviewExpenseReceipt(selected.id, receipt) : undefined}
        history={audit.filter(e => e.expenseId === selectedId).map(e => `${e.action} · ${e.reason || text('New expense','নতুন খরচ')} · ${new Date(e.at).toLocaleString('en-GB', {timeZone: 'Asia/Dhaka'})}`)} />
      <Dialog open={!!categoryEditor} onOpenChange={open => !open && setCategoryEditor(null)}>
        <DialogContent role="dialog" aria-label={text("Expense category editor","খরচের ধরন বদলান")} className="max-h-[92dvh] overflow-y-auto sm:max-w-md">
          <DialogHeader><DialogTitle>{categoryEditor?.previous ? text('Edit category','ধরন বদলান') : text('Add category','ধরন যোগ করুন')}</DialogTitle><DialogDescription>{text('Choose a short name · খরচের ধরন','সহজ ছোট নাম দিন।')}</DialogDescription></DialogHeader>
          <form onSubmit={event => { event.preventDefault(); if (!categoryEditor) return; try { if (categoryEditor.previous) renamePreviewExpenseCategory(categoryEditor.previous, categoryEditor.name); else createPreviewExpenseCategory(categoryEditor.name); refreshCategories(n => n + 1); setCategoryEditor(null); } catch(e) { setActionError(e instanceof Error ? e.message : text('Could not save category.','খরচের ধরন রাখা যায়নি।')); } }} className="space-y-3">
            <label className="block space-y-1 text-xs font-medium text-ink">{text('Category name','ধরনের নাম')}<Input autoFocus aria-label={text("Category name","খরচের ধরনের নাম")} value={categoryEditor?.name ?? ''} onChange={event => setCategoryEditor(current => current ? {...current, name: event.target.value} : null)} /></label>
            {actionError && <p role="alert" className="text-xs text-danger">{actionError}</p>}
            <DialogFooter><Button type="button" variant="outline" onClick={() => setCategoryEditor(null)}>{text('Cancel','বাতিল')}</Button><Button type="submit">{text('Save category','ধরন সংরক্ষণ')}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <PartyEditorDialog open={!!payeeEditor} party={payeeEditor?.party} defaultRole="Payee" onClose={() => setPayeeEditor(null)} onSave={(party, openings) => {
        if (!party.roles.includes('Payee') && !party.roles.includes('Vendor')) throw new Error(text('Keep the Payee or Vendor relationship for expense entries.','খরচের জন্য প্রাপক বা ভেন্ডর পরিচয় রাখুন।'));
        if (payeeEditor?.party) dispatchPartyPreview({type: 'update-party', id: payeeEditor.party.id, patch: party, openings}); else dispatchPartyPreview({type: 'create-party', party, openings});
      }} />
      <Dialog open={!!cancelling} onOpenChange={open => !open && setCancelling(null)}>
        <DialogContent role="dialog" aria-label={text("Cancel expense preview","খরচের প্রিভিউ বাতিল")} className="max-h-[92dvh] overflow-y-auto sm:max-w-md">
          <DialogHeader><DialogTitle>{text('Cancel','বাতিল করবেন')} {cancelling?.ref}?</DialogTitle><DialogDescription>{text('The original preview record stays in history. This does not refund money or reverse backend ledger entries.','আগের প্রিভিউ রেকর্ড ইতিহাসে থাকবে। এতে টাকা ফেরত বা আসল খাতায় উল্টো লেনদেন হবে না।')}</DialogDescription></DialogHeader>
          <p className="text-sm">{cancelling?.payee} · {taka(cancelling?.amount ?? 0)}</p>
          <label className="space-y-1 text-xs font-medium text-ink">{text('Reason · কেন বাতিল','বাতিলের কারণ')}<Input aria-label={text("Expense cancellation reason","খরচ বাতিলের কারণ")} value={cancelReason} onChange={e => setCancelReason(e.target.value)} /></label>
          {actionError && <p role="alert" className="text-xs text-danger">{actionError}</p>}
          <DialogFooter><Button variant="outline" onClick={() => setCancelling(null)}>{text('Keep expense','খরচ রাখুন')}</Button><Button onClick={() => { if (!cancelling) return; try { cancelPreviewExpense(cancelling.id, cancelReason); setCancelling(null); toast.success(text('Expense cancelled in preview','প্রিভিউ খরচ বাতিল হয়েছে')); } catch(e) { setActionError(e instanceof Error ? e.message : text('Cannot cancel expense.','খরচ বাতিল করা যায়নি।')); } }}>{text('Confirm cancellation','বাতিল নিশ্চিত করুন')}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
