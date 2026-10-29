import { MotionTabList, MotionTabIndicator } from '../motion/MotionTabList';
import {matchesSearch as fuzzyMatch} from '../utils/fuzzySearch';
import {useSearchParams} from 'react-router-dom';
import {AppDatePicker} from '../components/AppDateRangePicker';
import {expenseDateIso,formatDay} from '../utils/dateRange';
import {reconciliationMatchError,canCompleteReconciliation,reconciliationCsv} from '../utils/reconciliation';
import { AppSelect } from '../components/AppSelect';
import { useMemo, useState } from 'react';
import {
  ArrowDownToLine,
  CheckCircle2,
  FileText,
  FileUp,
  Landmark,
  Link2,
  MoreHorizontal,
  Plus,
  Search,
  Undo2,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/Button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/Dialog';
import { FormSelect } from '../components/FormSelect';
import { Input } from '../components/Input';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge, type StatusTone } from '../components/StatusBadge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/Table';
import { parties } from '../data/parties';
import {
  erpReconciliationTransactions as seedErp,
  reconciliationAccounts,
  reconciliationHistory,
  statementTransactions as seedStatement
} from '../data/reconciliation';
import type {
  ErpReconciliationTransaction,
  ReconciliationStatus,
  StatementTransaction
} from '../types/erp';
import { taka } from '../utils/currency';
import {useUiCopy} from '../i18n/useUiCopy';
import {financeLabel} from '../i18n/financeCopy';

type Tab = 'reconcile' | 'history';

const statusTone: Record<ReconciliationStatus, StatusTone> = {
  Matched: 'success',
  Review: 'warning',
  Unmatched: 'danger',
  Ignored: 'neutral'
};

function ReconciliationBadge({ status }: { status: ReconciliationStatus }) {
  const {language}=useUiCopy();
  return <StatusBadge tone={statusTone[status]} dot>{financeLabel(language,status)}</StatusBadge>;
}

function UploadStatementDialog({open,onOpenChange}:{open:boolean;onOpenChange:(open:boolean)=>void}) {
 const {text}=useUiCopy();
 return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent role="dialog" aria-modal="true" className="sm:max-w-lg">
  <DialogHeader><DialogTitle>{text('Bank statement import','ব্যাংকের স্টেটমেন্ট আমদানি')}</DialogTitle>
   <DialogDescription>{text('PDF reading is not connected yet. The transactions on this screen are sample data; choosing a file would not import its contents.','পিডিএফ পড়ার সুবিধা এখনো চালু হয়নি। এখানে নমুনা লেনদেন আছে; ফাইল বাছলেও তার তথ্য আমদানি হবে না।')}</DialogDescription></DialogHeader>
  <p className="text-sm text-ink-600 font-bn">এখন নমুনা তথ্য দিয়ে হিসাব মিলানো দেখুন। আসল ব্যাংক স্টেটমেন্ট আমদানি এখনো চালু হয়নি।</p>
  <DialogFooter><Button onClick={()=>onOpenChange(false)}>{text('Back to sample transactions','নমুনা লেনদেনে ফিরুন')}</Button></DialogFooter>
 </DialogContent></Dialog>;
}

function ErpEditor({
  transaction,
  statement,
  onSave,
  onMatch,
  matchError
}: {
  transaction: ErpReconciliationTransaction;
  statement: StatementTransaction;
  onSave: (transaction: ErpReconciliationTransaction) => void;
  onMatch: () => void;
  matchError: string|null;
}) {
  const {text}=useUiCopy();
  const [date, setDate] = useState(expenseDateIso(transaction.date));
  const [party, setParty] = useState(transaction.party);
  const [amount, setAmount] = useState(String(transaction.amount));
  const [reference, setReference] = useState(transaction.reference);

  const [reason,setReason]=useState('');
  const amountNumber = Number(amount);
  const valid=Boolean(date&&amount.trim()&&Number.isFinite(amountNumber)&&amountNumber>0&&reason.trim());
  const dirty=date!==expenseDateIso(transaction.date)||party!==transaction.party||amountNumber!==transaction.amount||reference!==transaction.reference;
  const amountDiff = statement.amount - amountNumber;

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border bg-card p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-ink-400">{text('Selected ERP transaction','বাছা ERP লেনদেন')}</p>
            <p className="mt-1 text-sm font-semibold text-ink">{transaction.type}</p>
          </div>
          <StatusBadge tone={amountDiff === 0 ? 'success' : 'warning'}>
            {amountDiff === 0 ? text('Amount matches','টাকা মিলেছে') : `${text('Difference','পার্থক্য')} ${taka(Math.abs(amountDiff))}`}
          </StatusBadge>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-[12px] font-medium text-ink">
            {text('Date','তারিখ')}
            <AppDatePicker className="mt-1" label={text("Transaction date","লেনদেনের তারিখ")} value={date} onChange={setDate} />
          </label>
          <label className="text-[12px] font-medium text-ink">
            {text('Party','পক্ষ')}
            <FormSelect
              className="mt-1"
              value={party}
              onChange={(event) => setParty(event.target.value)}
              options={Array.from(new Set([transaction.party, ...parties.map((item) => item.name), 'Unassigned']))}
            />
          </label>
          <label className="text-[12px] font-medium text-ink">
            {text('Amount','টাকা')}
            <Input
              className="mt-1 text-right"
              value={amount}
              inputMode="decimal"
              onChange={(event) => setAmount(event.target.value.replace(/[^\d.]/g, ''))}
            />
          </label>
          <label className="text-[12px] font-medium text-ink">
            {text('Reference','রেফারেন্স')}
            <Input className="mt-1" value={reference} onChange={(event) => setReference(event.target.value)} />
          </label>
        </div>

        <label className="mt-3 block text-xs text-ink-600" >{text('Why change this? · কারণ','কেন সংশোধন করছেন?')}<Input className="mt-1" value={reason} onChange={event=>setReason(event.target.value)} placeholder={text("Required for a preview correction","সংশোধনের কারণ লিখুন")} /></label>
        {(matchError||dirty)&&<p role="status" className="mt-2 text-xs text-warning">{dirty?text('Save the correction before matching.','মেলানোর আগে সংশোধন সংরক্ষণ করুন।'):matchError}</p>}
        <div className="mt-3 flex flex-wrap justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!valid||!dirty}
            onClick={() => {
              if(!valid)return;
              onSave({ ...transaction, date:formatDay(date), party, partyId:parties.find(item=>item.name===party)?.id, amount: amountNumber, reference });
              setReason('');
              toast.success(text('Sample transaction updated','নমুনা লেনদেন সংশোধিত হয়েছে'), {description:reason});
            }}>
            Save preview correction
          </Button>
          <Button size="sm" disabled={Boolean(matchError)||dirty} onClick={onMatch}>
            <Link2 className="size-4" /> {text('Match transaction','লেনদেন মিলান')}
          </Button>
        </div>
      </div>

      <div className="rounded-xl bg-ink-50 p-3 text-[12px]">
        <div className="flex justify-between gap-3"><span className="text-ink-500">{text('Bank description','ব্যাংকের বিবরণ')}</span><span className="max-w-[65%] text-right font-medium text-ink">{statement.description}</span></div>
        <div className="mt-1 flex justify-between gap-3"><span className="text-ink-500">{text('Bank reference','ব্যাংক রেফারেন্স')}</span><span className="font-medium text-ink">{statement.reference ?? '—'}</span></div>
        <div className="mt-1 flex justify-between gap-3"><span className="text-ink-500">{text('Bank amount','ব্যাংকের টাকা')}</span><span className="font-semibold text-ink">{taka(statement.amount)}</span></div>
      </div>
    </div>
  );
}

export function Reconciliation() {
  const {text,language}=useUiCopy();
  const [tab, setTab] = useState<Tab>('reconcile');
  const [params]=useSearchParams();
  const [accountId, setAccountId] = useState(()=>reconciliationAccounts.find(item=>item.id===params.get('accountId')||item.name===params.get('account'))?.id??reconciliationAccounts[0].id);
  const [history,setHistory]=useState(reconciliationHistory);
  const [historyItem,setHistoryItem]=useState<(typeof reconciliationHistory)[number]|null>(null);
  const [completed,setCompleted]=useState<Record<string,boolean>>({});
  const [showRows,setShowRows]=useState(false);
  const [statement, setStatement] = useState<StatementTransaction[]>(seedStatement);
  const [erp, setErp] = useState<ErpReconciliationTransaction[]>(seedErp);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All status');
  const [selectedStatementId, setSelectedStatementId] = useState(
    seedStatement.find((item) => item.accountId === reconciliationAccounts[0].id)?.id ?? ''
  );
  const [selectedErpId, setSelectedErpId] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [statementFile] = useState<Record<string, string>>({
    'acc-bank-dbbl': 'DBBL-Sep-2026.pdf',
    'acc-bkash': 'bKash-Sep-2026.pdf'
  });

  const account = reconciliationAccounts.find((item) => item.id === accountId) ?? reconciliationAccounts[0];
  const accountStatement = statement.filter((item) => item.accountId === accountId);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return accountStatement.filter((item) => {
      if (statusFilter !== 'All status' && item.status !== statusFilter) return false;
      if (!q) return true;
      return fuzzyMatch(q,[item.date,item.description,item.reference,item.amount]);
    });
  }, [accountStatement, query, statusFilter]);

  const selectedStatement = filtered.find((item) => item.id === selectedStatementId) ?? filtered[0] ?? null;
  const accountErp = erp.filter((item) => item.accountId === accountId);

  const candidateIds = selectedStatement
    ? Array.from(new Set([
        selectedStatement.matchedErpId,
        selectedStatement.suggestedErpId,
        ...accountErp
          .filter((item) => item.direction === selectedStatement.direction)
          .sort((a, b) => Math.abs(a.amount - selectedStatement.amount) - Math.abs(b.amount - selectedStatement.amount))
          .slice(0, 4)
          .map((item) => item.id)
      ].filter(Boolean) as string[]))
    : [];

  const candidates = candidateIds
    .map((id) => accountErp.find((item) => item.id === id))
    .filter((item): item is ErpReconciliationTransaction => Boolean(item))
    .filter(item=>!statement.some(row=>row.id!==selectedStatement?.id&&row.status==='Matched'&&row.matchedErpId===item.id));

  const activeErpId = selectedErpId && candidates.some((item) => item.id === selectedErpId)
    ? selectedErpId
    : selectedStatement?.matchedErpId ?? selectedStatement?.suggestedErpId ?? candidates[0]?.id ?? '';
  const selectedErp = candidates.find((item) => item.id === activeErpId) ?? null;

  const matchedCount = accountStatement.filter((item) => item.status === 'Matched').length;
  const reviewCount = accountStatement.filter((item) => item.status === 'Review').length;
  const unmatchedCount = accountStatement.filter((item) => item.status === 'Unmatched').length;

  const initialDifference = seedStatement
    .filter((item) => item.accountId === accountId && (item.status === 'Review' || item.status === 'Unmatched'))
    .reduce((sum, item) => {
      const sign = item.direction === 'in' ? 1 : -1;
      if (item.status === 'Unmatched' || !item.suggestedErpId) return sum + sign * item.amount;
      const candidate = seedErp.find((entry) => entry.id === item.suggestedErpId);
      if (!candidate) return sum + sign * item.amount;
      return sum + sign * (item.amount - candidate.amount);
    }, 0);

  const erpAdjustment = erp
    .filter((item) => item.accountId === accountId)
    .reduce((sum, item) => {
      const seed = seedErp.find((entry) => entry.id === item.id);
      const sign = item.direction === 'in' ? 1 : -1;
      return sum + sign * (item.amount - (seed?.amount ?? 0));
    }, 0);

  const statementClosing = account.balance + initialDifference;
  const erpClosing = account.balance + erpAdjustment;
  const difference = statementClosing - erpClosing;
  const canFinish = !completed[accountId]&&canCompleteReconciliation(accountStatement,accountErp,difference);

  const summary = [
    { label: text('Statement closing','স্টেটমেন্টের শেষ জের'), value: taka(statementClosing), sub: statementFile[accountId] ?? text('No statement uploaded','কোনো স্টেটমেন্ট নেই') },
    { label: text('ERP balance','ERP-র জের'), value: taka(erpClosing), sub: account.detail ?? account.type },
    { label: text('Matched','মিলেছে'), value: `${matchedCount}/${accountStatement.length}`, sub: `${reviewCount} ${text('review','যাচাই বাকি')} · ${unmatchedCount} ${text('unmatched','মেলেনি')}`, tone: 'text-success' },
    { label: text('Difference','পার্থক্য'), value: taka(Math.abs(difference)), sub: completed[accountId]?text('Preview saved','নমুনা সংরক্ষিত'):difference===0?text('Balances agree; review all rows','টাকা মিলেছে; সব লাইন যাচাই করুন'):text('Needs review','যাচাই দরকার'), tone: difference === 0 ? 'text-success' : 'text-danger' }
  ];

  const selectStatement = (item: StatementTransaction) => {
    setSelectedStatementId(item.id);
    setShowRows(false);
    setSelectedErpId(item.matchedErpId ?? item.suggestedErpId ?? '');
  };

  const updateSelectedStatus = (status: ReconciliationStatus, matchedErpId?: string) => {
    if (!selectedStatement) return;
    setCompleted(current=>({...current,[accountId]:false}));
    setStatement((items) => items.map((item) => item.id === selectedStatement.id ? {
      ...item,
      status,
      ...(matchedErpId ? { matchedErpId } : { matchedErpId: undefined })
    } : item));
  };

  const matchSelected = (erpId: string) => {
    const entry=erp.find(item=>item.id===erpId);
    if(!selectedStatement||!entry)return;
    const error=reconciliationMatchError(selectedStatement,entry,statement);
    if(error){toast.error(error);return;}
    updateSelectedStatus('Matched', erpId);
    toast.success(text('Matched in preview','নমুনার হিসাব মিলেছে'));
  };

  const createFromStatement = () => {
    if (!selectedStatement) return;
    const next: ErpReconciliationTransaction = {
      id: `erp-new-${Date.now()}`,
      accountId,
      date: selectedStatement.date,
      type: selectedStatement.description.toLowerCase().includes('charge') ? 'Expense' : 'Other',
      party: 'Unassigned',
      reference: selectedStatement.reference ?? `Imported ${selectedStatement.id}`,
      amount: selectedStatement.amount,
      direction: selectedStatement.direction
    };
    setErp((items) => [next, ...items]);
    setSelectedErpId(next.id);
    updateSelectedStatus('Matched', next.id);
    toast.success(text('Sample transaction created and matched','নমুনা লেনদেন তৈরি ও মিলানো হয়েছে'));
  };

  const switchAccount = (nextId: string) => {
    setAccountId(nextId);
    setShowRows(false);
    const first = statement.find((item) => item.accountId === nextId);
    setSelectedStatementId(first?.id ?? '');
    setSelectedErpId('');
    setQuery('');
    setStatusFilter('All status');
  };

  return (
    <div className="mx-auto max-w-[1440px] space-y-4">
      <PageHeader
        title="Account reconciliation"
        titleBn="হিসাব মিলানো"
        description="Match money in and money out · টাকা আসা–যাওয়া মিলান. Sample data only; changes last until this page reloads."
        descriptionBn="ব্যাংকের টাকা আসা-যাওয়া ERP-র সঙ্গে মিলান। শুধু নমুনা; পাতা রিলোড করলে সংশোধন থাকবে না।"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => {
              const url=URL.createObjectURL(new Blob([reconciliationCsv(filtered)],{type:'text/csv;charset=utf-8'}));
              const link=document.createElement('a');link.href=url;link.download='reconciliation-'+accountId+'.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
            }}>
              <ArrowDownToLine className="size-4" /> {text('Export','ডাউনলোড')}
            </Button>
            <Button size="sm" onClick={() => setUploadOpen(true)}>
              <FileUp className="size-4" /> {text('Statement import','স্টেটমেন্ট আমদানি')}
            </Button>
          </>
        }
      />

      <div className="rounded-xl border border-border bg-card p-3 shadow-card">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex size-9 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
            <Landmark className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium uppercase tracking-wide text-ink-400">{text('Account','হিসাব')}</p>
            <AppSelect label={text("Reconciliation account","মেলানোর হিসাব")} className="mt-1 max-w-sm"
              value={accountId} onChange={switchAccount}
              options={reconciliationAccounts.map((item) => ({ value: item.id, label: item.name }))} />
            <p className="mt-1 text-[11px] text-ink-500">{account.detail ?? account.type}</p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-[11px] text-ink-400">{text('Statement','স্টেটমেন্ট')}</p>
            <p className="text-[12.5px] font-medium text-ink">{statementFile[accountId] ?? text('No file uploaded','কোনো ফাইল নেই')}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {summary.map((item) => (
          <div key={item.label} className="rounded-xl border border-border bg-card px-4 py-3 shadow-card">
            <p className="text-[12.5px] text-ink-500">{item.label}</p>
            <p className={`mt-0.5 text-lg font-semibold ${item.tone ?? 'text-ink'}`}>{item.value}</p>
            <p className="text-[11px] text-ink-400">{item.sub}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card shadow-card">
        <MotionTabList className="flex flex-nowrap gap-1 overflow-x-auto border-b border-border px-3 scrollbar-thin" role="tablist">
          {([
            ['reconcile', text('Reconcile','মিলিয়ে দেখুন'), text('Statement vs ERP','স্টেটমেন্ট ও ERP')],
            ['history', text('History','ইতিহাস'), text('Previous reconciliations','আগের মিলানো হিসাব')]
          ] as Array<[Tab, string, string]>).map(([id, label, helper]) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              title={helper}
              className={`flex shrink-0 items-center gap-1.5 px-2.5 py-2.5 text-[13px] font-medium ${tab === id ? 'text-ink' : 'text-ink-500 hover:text-ink'}`}>
              {label}
            <MotionTabIndicator active={tab === id} /></button>
          ))}
        </MotionTabList>

        {tab === 'reconcile' && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-ink-50/40 px-3 py-2">
              <p className="text-[11.5px] text-ink-500">
                {matchedCount} {text('matched','মিলেছে')} · {reviewCount} {text('review','যাচাই বাকি')} · {unmatchedCount} {text('unmatched','মেলেনি')}
              </p>
              <Button
                size="sm"
                disabled={!canFinish} title={canFinish?'Save this sample review':'Match every statement row and resolve the balance difference first'}
                onClick={() => {
                  if(!canFinish)return;
                  setHistory(items=>[{id:'PREVIEW-'+Date.now(),accountId,accountName:account.name,period:'Sample statement review',statementFile:statementFile[accountId]??'Sample',statementClosing,erpClosing,matched:matchedCount,review:0,status:'Completed'},...items]);
                  setCompleted(current=>({...current,[accountId]:true}));setTab('history');toast.success(text('Review saved in this preview','নমুনা যাচাই সংরক্ষিত হয়েছে'));
                }}>
                <CheckCircle2 className="size-4" /> {completed[accountId]?text('Preview saved','নমুনা সংরক্ষিত'):text('Save reviewed preview','নমুনা যাচাই সংরক্ষণ')}
              </Button>
            </div>
            <div className="p-3 lg:hidden"><Button variant="outline" className="h-9 w-full" aria-expanded={showRows} onClick={()=>setShowRows(!showRows)}>{showRows?text('Back to selected transaction','বাছা লেনদেনে ফিরুন'):text('Choose statement transaction · লেনদেন বাছুন','স্টেটমেন্টের লেনদেন বাছুন')}</Button></div>
            <div className="grid lg:min-h-[620px] lg:grid-cols-2">
            <section className={(showRows?'block':'hidden')+' min-w-0 border-b border-border lg:block lg:border-b-0 lg:border-r'}>
              <div className="flex flex-col gap-2 border-b border-border p-3 sm:flex-row sm:items-center">
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute z-10 left-2.5 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
                  <Input value={query} onChange={(event) => setQuery(event.target.value)} className="pl-8" aria-label={text("Search statement transactions","স্টেটমেন্টের লেনদেন খুঁজুন")} placeholder={text("Search statement transaction","স্টেটমেন্টে খুঁজুন")} />
                </div>
                <FormSelect
                  className="w-full sm:w-36"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  options={['All status', 'Matched', 'Review', 'Unmatched', 'Ignored'].map(value=>({value,label:financeLabel(language,value)}))}
                />
              </div>

              <div className="max-h-[560px] overflow-auto scrollbar-thin">
                {filtered.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => selectStatement(item)}
                    className={`flex w-full items-start gap-3 border-b border-border px-3 py-3 text-left transition-colors ${selectedStatement?.id === item.id ? 'bg-teal-50/60' : 'hover:bg-ink-50'}`}>
                    <span className={`mt-1.5 size-2 shrink-0 rounded-full ${item.direction === 'in' ? 'bg-success' : 'bg-danger'}`} />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-[12.5px] font-medium text-ink">{item.date}</span>
                        <ReconciliationBadge status={item.status} />
                        {item.confidence && item.status !== 'Matched' ? <span className="text-[10.5px] text-ink-400">{item.confidence}% {text('suggestion','সম্ভাব্য মিল')}</span> : null}
                      </span>
                      <span className="mt-0.5 block truncate text-[12.5px] text-ink-700">{item.description}</span>
                      <span className="mt-0.5 block text-[10.5px] text-ink-400">{item.reference ?? text('No reference','নম্বর নেই')}</span>
                    </span>
                    <span className={`shrink-0 text-[13px] font-semibold ${item.direction === 'in' ? 'text-success' : 'text-ink'}`}>
                      {item.direction === 'in' ? '+' : '−'}{taka(item.amount)}
                    </span>
                  </button>
                ))}

                {filtered.length === 0 && (
                  <div className="px-4 py-12 text-center">
                    <FileText className="mx-auto size-7 text-helper" />
                    <p className="mt-2 text-sm font-medium text-ink">{text('No statement rows match','স্টেটমেন্টে কিছু মেলেনি')}</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => { setQuery(''); setStatusFilter('All status'); }}>{text('Clear filters','ফিল্টার মুছুন')}</Button>
                  </div>
                )}
              </div>
            </section>

            <section className={(showRows?'hidden':'block')+' min-w-0 bg-ink-50/30 lg:block'}>
              {!selectedStatement ? (
                <div className="flex h-full min-h-96 flex-col items-center justify-center p-6 text-center">
                  <Link2 className="size-8 text-helper" />
                  <p className="mt-2 font-medium text-ink">{text('Select a statement transaction','স্টেটমেন্ট থেকে লেনদেন বাছুন')}</p>
                  <p className="mt-1 text-sm text-ink-500">{text('HisabIQ will show likely ERP matches on this side.','এখানে সম্ভাব্য ERP লেনদেন দেখাবে।')}</p>
                </div>
              ) : (
                <div className="space-y-3 p-3">
                  <div className="rounded-xl border border-border bg-card p-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-wide text-ink-400">{text('Statement transaction','স্টেটমেন্টের লেনদেন')}</p>
                        <p className="mt-1 text-sm font-semibold text-ink">{selectedStatement.description}</p>
                        <p className="mt-0.5 text-[11px] text-ink-500">{selectedStatement.date} · {selectedStatement.reference ?? 'No reference'}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-semibold ${selectedStatement.direction === 'in' ? 'text-success' : 'text-ink'}`}>
                          {selectedStatement.direction === 'in' ? '+' : '−'}{taka(selectedStatement.amount)}
                        </p>
                        <ReconciliationBadge status={selectedStatement.status} />
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedStatement.status === 'Matched' ? (
                        <Button variant="outline" size="sm" onClick={() => { updateSelectedStatus('Review'); toast(text('Match removed','মিল সরানো হয়েছে')); }}>
                          <Undo2 className="size-4" /> {text('Unmatch','মিল সরান')}
                        </Button>
                      ) : (
                        <>
                          <Button variant="outline" size="sm" onClick={createFromStatement}>
                            <Plus className="size-4" /> {text('Create sample transaction','নমুনা লেনদেন তৈরি')}
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => { updateSelectedStatus('Ignored'); toast(text('Statement row ignored','স্টেটমেন্টের লাইন বাদ দেওয়া হয়েছে')); }}>
                            <X className="size-4" /> {text('Ignore','বাদ দিন')}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {candidates.length > 0 && (
                    <div className="rounded-xl border border-border bg-card">
                      <div className="border-b border-border p-3">
                        <p className="text-[13px] font-medium text-ink">{text('ERP matches','ERP-র সম্ভাব্য মিল')}</p>
                        <p className="mt-0.5 text-[11px] text-ink-500">{text('Compare account, money direction and amount. Correct sample data only after checking the source.','হিসাব, টাকা আসা-যাওয়া ও পরিমাণ মিলিয়ে নিন। মূল লেনদেন যাচাই করেই নমুনা সংশোধন করুন।')}</p>
                      </div>
                      <div className="divide-y divide-border">
                        {candidates.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => setSelectedErpId(item.id)}
                            className={`flex w-full items-center gap-3 px-3 py-2.5 text-left ${activeErpId === item.id ? 'bg-teal-50/60' : 'hover:bg-ink-50'}`}>
                            <span className="min-w-0 flex-1">
                              <span className="block text-[12.5px] font-medium text-ink">{item.party}</span>
                              <span className="block text-[10.5px] text-ink-400">{item.date} · {item.reference} · {item.type}</span>
                            </span>
                            <span className="text-[12.5px] font-semibold text-ink">{taka(item.amount)}</span>
                            {selectedStatement.matchedErpId === item.id && <CheckCircle2 className="size-4 text-success" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedErp ? (
                    <ErpEditor
                      key={selectedStatement.id+selectedErp.id}
                      transaction={selectedErp}
                      statement={selectedStatement}
                      onSave={(updated) => {setErp((items) => items.map((item) => item.id === updated.id ? updated : item));setCompleted(current=>({...current,[accountId]:false}));updateSelectedStatus('Review');}}
                      matchError={reconciliationMatchError(selectedStatement,selectedErp,statement)}
                      onMatch={() => matchSelected(selectedErp.id)}
                    />
                  ) : (
                    <div className="rounded-xl border border-dashed border-ink-200 bg-card p-6 text-center">
                      <p className="text-sm font-medium text-ink">{text('No ERP match found','ERP-তে মিল পাওয়া যায়নি')}</p>
                      <p className="mt-1 text-xs text-ink-500">{text('Create a new ERP transaction from the statement row or ignore it.','স্টেটমেন্ট থেকে নমুনা ERP লেনদেন তৈরি করুন বা বাদ দিন।')}</p>
                    </div>
                  )}
                </div>
              )}
            </section>
            </div>
          </>
        )}

        {tab === 'history' && (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-9 pl-4 text-xs">{text('Reconciliation','হিসাব মিলানো')}</TableHead>
                <TableHead className="h-9 text-xs">{text('Account','হিসাব')}</TableHead>
                <TableHead className="h-9 text-xs">{text('Statement','স্টেটমেন্ট')}</TableHead>
                <TableHead className="h-9 text-right text-xs">{text('Statement closing','স্টেটমেন্টের শেষ জের')}</TableHead>
                <TableHead className="h-9 text-right text-xs">{text('ERP closing','ERP-র শেষ জের')}</TableHead>
                <TableHead className="h-9 text-right text-xs">{text('Difference','পার্থক্য')}</TableHead>
                <TableHead className="h-9 text-xs">{text('Status','অবস্থা')}</TableHead>
                <TableHead className="h-9 pr-4 text-right text-xs">{text('Action','কাজ')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.filter(item=>item.accountId===accountId).map((item) => {
                const diff = item.statementClosing - item.erpClosing;
                return (
                  <TableRow key={item.id} className="text-[13px]">
                    <TableCell className="py-2 pl-4">
                      <p className="font-medium text-ink">{item.id}</p>
                      <p data-table-helper="" className="text-[11px] text-ink-400">{item.period}</p>
                    </TableCell>
                    <TableCell className="py-2 font-medium text-ink">{item.accountName}</TableCell>
                    <TableCell className="py-2 text-ink-600">{item.statementFile}</TableCell>
                    <TableCell className="py-2 text-right">{taka(item.statementClosing)}</TableCell>
                    <TableCell className="py-2 text-right">{taka(item.erpClosing)}</TableCell>
                    <TableCell className={`py-2 text-right font-medium ${diff === 0 ? 'text-success' : 'text-danger'}`}>{taka(Math.abs(diff))}</TableCell>
                    <TableCell className="py-2">
                      <StatusBadge tone={item.status === 'Completed' ? 'success' : 'warning'} dot>{financeLabel(language,item.status)}</StatusBadge>
                    </TableCell>
                    <TableCell className="py-2 pr-4 text-right">
                      <button
                        onClick={() => setHistoryItem(item)}
                        className="rounded-md p-1.5 text-ink-400 hover:bg-ink-50 hover:text-ink"
                        aria-label={`Open ${item.id}`}>
                        <MoreHorizontal className="size-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      <UploadStatementDialog open={uploadOpen} onOpenChange={setUploadOpen} />
      <Dialog open={Boolean(historyItem)} onOpenChange={open=>!open&&setHistoryItem(null)}><DialogContent role="dialog" aria-modal="true" className="sm:max-w-lg">
       <DialogHeader><DialogTitle>{text('Reconciliation review','হিসাব মিলানোর বিস্তারিত')}</DialogTitle><DialogDescription>{text('Sample history only · no bank or ledger posting.','শুধু নমুনার ইতিহাস। আসল ব্যাংক বা ERP খাতায় কিছু লেখা হয়নি।')}</DialogDescription></DialogHeader>
       {historyItem&&<dl className="space-y-3 text-sm">{[[text('Account','হিসাব'),historyItem.accountName],[text('Period','সময়কাল'),historyItem.period],[text('Statement','স্টেটমেন্ট'),historyItem.statementFile],[text('Bank closing','ব্যাংকের শেষ জের'),taka(historyItem.statementClosing)],[text('ERP closing','ERP-র শেষ জের'),taka(historyItem.erpClosing)],[text('Matched','মিলেছে'),String(historyItem.matched)],[text('Status','অবস্থা'),financeLabel(language,historyItem.status)]].map(([label,value])=><div key={label} className="flex flex-wrap justify-between gap-2"><dt className="text-ink-500">{label}</dt><dd className="font-medium text-ink">{value}</dd></div>)}</dl>}
      </DialogContent></Dialog>
    </div>
  );
}
