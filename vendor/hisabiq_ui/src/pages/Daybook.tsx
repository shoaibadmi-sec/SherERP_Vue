import { useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowDownToLine, ArrowUpRight, CalendarClock, Printer, WalletCards } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '../components/Button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../components/Dialog';
import {downloadReport,printReport} from '../utils/reportOutput';
import { PageHeader } from '../components/PageHeader';
import {useUiCopy} from '../i18n/useUiCopy';
import {documentLabel} from '../i18n/documentCopy';
import { StatusBadge } from '../components/StatusBadge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/Table';
import { Tooltip } from '../components/Tooltip';
import { DaybookActions } from '../components/daybook/DaybookActions';
import { DaybookFilters, type DaybookFilterState } from '../components/daybook/DaybookFilters';
import { TransactionDetailsDialog } from '../components/daybook/TransactionDetailsDialog';
import { useUserPreferences } from '../contexts/UserPreferencesContext';
import { daybookTransactions } from '../data/daybook';
import type { UnifiedTransaction } from '../types/transactions';
import { taka } from '../utils/currency';
import { cashflowSummary, filterDaybookTransactions } from '../utils/daybook';
import { dateForView } from '../utils/transactionDates';

function statusTone(status: UnifiedTransaction['status']) {
  if (status === 'Posted') return 'success' as const;
  if (status === 'Deleted') return 'danger' as const;
  if (status === 'Draft') return 'warning' as const;
  return 'neutral' as const;
}

const defaultFilters: DaybookFilterState = {
  search: '',
  from: '2026-10-07',
  to: '2026-10-07',
  type: 'All types',
  account: 'All accounts',
  user: 'All users',
  status: 'All status'
};

function filtersFromParams(params: URLSearchParams): DaybookFilterState {
  return {
    search: params.get('q') ?? defaultFilters.search,
    from: params.has('from') ? params.get('from') ?? '' : defaultFilters.from,
    to: params.has('to') ? params.get('to') ?? '' : defaultFilters.to,
    type: params.get('type') ?? defaultFilters.type,
    account: params.get('account') ?? defaultFilters.account,
    user: params.get('user') ?? defaultFilters.user,
    status: params.get('status') ?? defaultFilters.status
  };
}

function paramsFromFilters(current: URLSearchParams, filters: DaybookFilterState) {
  const next = new URLSearchParams(current);
  const values: Array<[string, string, string]> = [
    ['q', filters.search, defaultFilters.search],
    ['from', filters.from, defaultFilters.from],
    ['to', filters.to, defaultFilters.to],
    ['type', filters.type, defaultFilters.type],
    ['account', filters.account, defaultFilters.account],
    ['user', filters.user, defaultFilters.user],
    ['status', filters.status, defaultFilters.status]
  ];
  for (const [key, value, defaultValue] of values) {
    if (key === 'from' || key === 'to') {
      if (!value) next.set(key, '');
      else if (value === defaultValue) next.delete(key);
      else next.set(key, value);
    } else if (!value || value === defaultValue) next.delete(key);
    else next.set(key, value);
  }
  return next;
}

export function Daybook() {
  const {text,language,showHelper}=useUiCopy();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { entryDateView, setEntryDateView } = useUserPreferences();
  const [transactions] = useState<UnifiedTransaction[]>(daybookTransactions);
  const [detail, setDetail] = useState<UnifiedTransaction | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UnifiedTransaction | null>(null);
  const [filters, setFilters] = useState<DaybookFilterState>(() => filtersFromParams(searchParams));
  const updateFilters = (next: DaybookFilterState) => {
    setFilters(next);
    setSearchParams(paramsFromFilters(searchParams, next), { replace: true });
  };

  const filtered = useMemo(() => filterDaybookTransactions(transactions, {
    ...filters,
    dateView: entryDateView
  }), [entryDateView, filters, transactions]);

  const summary = useMemo(() => cashflowSummary(filtered), [filtered]);

  const goToSource = (transaction: UnifiedTransaction, edit = false) => {
    if (edit) {
      navigate(`/app/audit-ledger?editRef=${encodeURIComponent(transaction.reference)}`);
      return;
    }
    navigate(transaction.sourceRoute || '/app/daybook');
  };

  const reportHeaders=['Date','Type','Reference','Party','Details','Account','Money in','Money out','Posted by','Status'];
  const printHeaders=reportHeaders.map(h=>documentLabel(language,h));
  const reportRow=(transaction:UnifiedTransaction)=>[dateForView(transaction,entryDateView),transaction.type,transaction.reference,transaction.party??'',transaction.details??'',transaction.accounts.join(' + '),transaction.moneyIn,transaction.moneyOut,transaction.postedBy,transaction.status];
  const print=(rows:UnifiedTransaction[],title='Day Book')=>{
    if(!printReport({title:documentLabel(language,title),language,subtitle:`${filters.from||documentLabel(language,'All dates')} — ${filters.to||documentLabel(language,'All dates')} · ${documentLabel(language,entryDateView==='created'?'Created date':'Transaction date')}`,headers:printHeaders,rows:rows.map(reportRow)}))toast.error('Allow the print preview window, then try again.');
  };
  const printTransaction=(transaction:UnifiedTransaction)=>print([transaction],transaction.reference);

  const duplicateTransaction = (transaction: UnifiedTransaction) => {
    if (transaction.source === 'sale') {
      navigate(`/app/pos?mode=duplicate&invoice=${encodeURIComponent(transaction.reference)}`);
    }
  };

  const exportDaybook=()=>downloadReport('hisabiq-daybook.csv',reportHeaders,filtered.map(reportRow));

  return (
    <div className="mx-auto max-w-[1440px] space-y-4">
      <PageHeader
        title="Daybook"
        titleBn="দৈনিক লেনদেন"
        description="Money in and money out · টাকা আসা–যাওয়া. UI preview; review changes at the source."
        descriptionBn="টাকা আসা-যাওয়ার হিসাব। শুধু প্রিভিউ; সংশোধনের জন্য মূল লেনদেনে যান।"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
            <button
              onClick={() => setEntryDateView('transaction')}
              className={`rounded-md px-2.5 py-1.5 text-xs font-medium ${entryDateView === 'transaction' ? 'bg-inverse text-white' : 'text-ink-500 hover:bg-ink-50'}`}>
              {text('Transaction Date','লেনদেনের তারিখ')}
            </button>
            <button
              onClick={() => setEntryDateView('created')}
              className={`rounded-md px-2.5 py-1.5 text-xs font-medium ${entryDateView === 'created' ? 'bg-inverse text-white' : 'text-ink-500 hover:bg-ink-50'}`}>
              {text('Created Date','লেখার তারিখ')}
            </button>
            </div>
            <Button variant="outline" size="sm" onClick={exportDaybook}><ArrowDownToLine className="size-4" /> {text('Export','ডাউনলোড')}</Button>
            <Button variant="outline" size="sm" onClick={() => print(filtered)}><Printer className="size-4" /> {text('Print','প্রিন্ট')}</Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-card">
          <div className="flex items-center justify-between"><p className="text-[12.5px] text-ink-500">{text('Money In','টাকা এসেছে')} {showHelper&&<span className="font-bn text-[11px]">· টাকা এসেছে</span>}</p><ArrowDownLeft className="size-4 text-success" /></div>
          <p className="mt-0.5 text-lg font-semibold text-success">{taka(summary.moneyIn)}</p>
          <p className="text-[10.5px] text-ink-400">{text('Actual money received in this view','এই সময়ের পাওয়া টাকা')}</p>
        </div>
        <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-card">
          <div className="flex items-center justify-between"><p className="text-[12.5px] text-ink-500">{text('Money Out','টাকা গেছে')} {showHelper&&<span className="font-bn text-[11px]">· টাকা গেছে</span>}</p><ArrowUpRight className="size-4 text-danger" /></div>
          <p className="mt-0.5 text-lg font-semibold text-ink">{taka(summary.moneyOut)}</p>
          <p className="text-[10.5px] text-ink-400">{text('Actual money paid in this view','এই সময়ের দেওয়া টাকা')}</p>
        </div>
        <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-card">
          <div className="flex items-center justify-between"><p className="text-[12.5px] text-ink-500">{text('Net movement','মোট টাকা আসা-যাওয়া')}</p><WalletCards className="size-4 text-helper" /></div>
          <p className={`mt-0.5 text-lg font-semibold ${summary.net < 0 ? 'text-danger' : 'text-ink'}`}>{summary.net < 0 ? '−' : ''}{taka(Math.abs(summary.net))}</p>
          <p className="text-[10.5px] text-ink-400">{text('Internal transfers excluded','নিজের হিসাবের মধ্যে টাকা সরানো বাদ')}</p>
        </div>
        <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-card">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-1 text-[12.5px] text-ink-500">{text('Entries','লেনদেন')} <Tooltip content="এই তারিখ বা তারিখের মধ্যে পাওয়া মোট ব্যবসার লেনদেন।" /></p>
            <CalendarClock className="size-4 text-helper" />
          </div>
          <p className="mt-0.5 text-lg font-semibold text-ink">{filtered.length}</p>
          <p className="font-bn text-[10.5px] text-ink-400">নির্বাচিত সময়ের লেনদেন</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
        <DaybookFilters value={filters} onChange={updateFilters} transactions={transactions} dateView={entryDateView} />

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-9 pl-4 text-xs">{text('Date','তারিখ')}</TableHead>
                <TableHead className="h-9 text-xs">{text('Type','ধরন')}</TableHead>
                <TableHead className="h-9 text-xs">{text('No. / Reference','নম্বর / রেফারেন্স')}</TableHead>
                <TableHead className="h-9 text-xs">{text('Party','পক্ষ')}</TableHead>
                <TableHead className="h-9 text-xs">{text('Details','বিবরণ')}</TableHead>
                <TableHead className="h-9 text-xs">{text('Account','হিসাব')}</TableHead>
                <TableHead className="h-9 text-right text-xs">{text('Money In','টাকা এসেছে')}</TableHead>
                <TableHead className="h-9 text-right text-xs">{text('Money Out','টাকা গেছে')}</TableHead>
                <TableHead className="h-9 text-xs">{text('Posted by','যিনি লিখেছেন')}</TableHead>
                <TableHead className="h-9 text-xs">{text('Status','অবস্থা')}</TableHead>
                <TableHead className="h-9 pr-4 text-right text-xs">{text('Action','কাজ')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((transaction) => (
                <TableRow key={transaction.id} className="text-[13px]">
                  <TableCell className="py-2 pl-4">
                    <p className="font-medium text-ink">{dateForView(transaction, entryDateView)}</p>
                    {entryDateView === 'transaction' && transaction.createdAt.slice(0, 10) !== transaction.transactionDate && (
                      <p data-table-helper="" className="text-[10.5px] text-ink-400">Entered {transaction.createdAt.slice(0, 10)}</p>
                    )}
                  </TableCell>
                  <TableCell className="py-2"><span className="font-medium text-ink">{text(transaction.type,transaction.type==='Sale'?'বিক্রি':transaction.type==='Purchase'?'ক্রয়':transaction.type==='Expense'?'খরচ':transaction.type==='Receipt'?'টাকা পাওয়া':transaction.type==='Payment'?'টাকা দেওয়া':transaction.type)}</span>{!transaction.countsTowardCashflow && <span data-table-helper="" className="block font-bn text-[10.5px] text-ink-400">নিজের অ্যাকাউন্টে টাকা সরানো</span>}</TableCell>
                  <TableCell className="py-2 font-medium text-teal-700">{transaction.reference}</TableCell>
                  <TableCell className="py-2 text-ink-600">{transaction.party || '—'}</TableCell>
                  <TableCell className="max-w-[230px] py-2"><p className="truncate text-ink-500">{transaction.details || (transaction.due ? `${taka(transaction.due)} ${text('due','বাকি')}` : '—')}</p>{!!transaction.due && <p data-table-helper="" className="font-bn text-[10.5px] text-warning">বাকি আছে {taka(transaction.due)}</p>}</TableCell>
                  <TableCell className="max-w-[210px] py-2"><p className="truncate text-ink-500">{transaction.accounts.length > 1 ? transaction.accounts.join(' + ') : transaction.accounts[0] || '—'}</p></TableCell>
                  <TableCell className="py-2 text-right font-medium text-success">{transaction.moneyIn ? taka(transaction.moneyIn) : '—'}</TableCell>
                  <TableCell className="py-2 text-right font-medium text-ink">{transaction.moneyOut ? taka(transaction.moneyOut) : '—'}</TableCell>
                  <TableCell className="py-2"><p className="font-medium text-ink">{transaction.postedBy}</p><p data-table-helper="" className="text-[10.5px] text-ink-400">{transaction.createdAt.slice(11, 16)}</p></TableCell>
                  <TableCell className="py-2"><StatusBadge tone={statusTone(transaction.status)} dot>{text(transaction.status,transaction.status==='Posted'?'লেখা হয়েছে':transaction.status==='Draft'?'খসড়া':transaction.status==='Deleted'?'মুছে ফেলা':'উল্টো হিসাব')}</StatusBadge></TableCell>
                  <TableCell className="py-2 pr-4 text-right">
                    <DaybookActions
                      transaction={transaction}
                      onOpen={setDetail}
                      onEdit={(item) => goToSource(item, true)}
                      onDelete={setDeleteTarget}
                      onGoToSource={(item) => goToSource(item)}
                      onPrint={printTransaction}
                      onDuplicate={duplicateTransaction}
                    />
                  </TableCell>
                </TableRow>
              ))}
              {!filtered.length && (
                <TableRow>
                  <TableCell colSpan={11} className="py-14 text-center">
                    <p className="text-sm font-medium text-ink">{text('No transactions found','কোনো লেনদেন নেই')}</p>
                    <p data-table-helper="" className="mt-1 font-bn text-xs text-ink-400">এই তারিখ বা ফিল্টারে কোনো লেনদেন নেই</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <TransactionDetailsDialog
        transaction={detail}
        onClose={() => setDetail(null)}
        onEdit={(item) => goToSource(item, true)}
        onDelete={(item) => { setDetail(null); setDeleteTarget(item); }}
        onGoToSource={(item) => goToSource(item)}
        onPrint={printTransaction}
        onDuplicate={duplicateTransaction}
      />

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{text('Review source reversal · লেনদেন যাচাই','মূল লেনদেন যাচাই করুন')}</DialogTitle>
          </DialogHeader>
          <div className="rounded-lg border border-danger/20 bg-danger/5 px-3 py-2.5">
            <p className="text-[13px] font-medium text-danger">{deleteTarget?.type} · {deleteTarget?.reference}</p>
            <p className="mt-1 font-bn text-[11px] text-ink-500">দৈনিক খাতা থেকে আলাদা করে লেনদেন মুছবেন না। মূল লেনদেন ও তার প্রভাব যাচাই করুন।</p>
          </div>
          <p className="text-sm text-ink-600">{text('Day Book is a transaction view. Open the source audit to review its full money, due and stock impact. This preview cannot reverse a source by deleting a display row.','দৈনিক খাতা শুধু লেনদেন দেখায়। টাকা, বাকি ও স্টকের প্রভাব দেখতে মূল অডিট খুলুন। এখান থেকে লাইন মুছলে আসল লেনদেন বাতিল হবে না।')}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>{text('Cancel','বাতিল')}</Button>
            <Button onClick={()=>{if(deleteTarget){navigate(`/app/audit-ledger?openRef=${encodeURIComponent(deleteTarget.reference)}`);setDeleteTarget(null);}}}>{text('Review source audit','মূল অডিট দেখুন')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

