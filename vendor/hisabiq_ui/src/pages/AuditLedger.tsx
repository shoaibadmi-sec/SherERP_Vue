import {matchesSearch as fuzzyMatch} from '../utils/fuzzySearch';
import React, { useMemo, useState } from 'react';
import { ArrowDownToLine, Eye, MoreHorizontal, Pencil, Printer, ShieldCheck, Trash2 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {downloadReport,printReport} from '../utils/reportOutput';
import { Button } from '../components/Button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../components/Dialog';
import { Input } from '../components/Input';
import { PageHeader } from '../components/PageHeader';
import {useUiCopy} from '../i18n/useUiCopy';
import {documentLabel} from '../i18n/documentCopy';
import { StatusBadge } from '../components/StatusBadge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/Table';
import { FloatingPanel } from '../components/layout/FloatingPanel';
import { AuditDetailsDialog } from '../components/audit/AuditDetailsDialog';
import { AuditEditDialog } from '../components/audit/AuditEditDialog';
import { AuditFilters, type AuditFilterState } from '../components/audit/AuditFilters';
import { useUserPreferences } from '../contexts/UserPreferencesContext';
import { auditSourceRecords } from '../data/auditLedger';
import type { AuditSourceRecord } from '../types/audit';
import { applyDelete, auditTimelineFor, createAuditState, validateDelete } from '../utils/auditEngine';
import { taka } from '../utils/currency';
import { auditDeleteImpact } from '../utils/moduleUiActions';
import { auditActionAvailability, demoPermissions } from '../utils/permissions';

function accountLabel(source: AuditSourceRecord) {
  if (source.source === 'transfer') return [source.fromAccount, source.toAccount].filter(Boolean).join(' → ');
  if (source.paymentAccounts?.length) return source.paymentAccounts.map((item) => item.account).join(' + ');
  return '—';
}

function sourceLabel(source: AuditSourceRecord) {
  const labels: Record<string, string> = {
    sale: 'Sales',
    'customer-payment': 'Sales / Party',
    purchase: 'Purchases',
    'supplier-payment': 'Purchases / Party',
    expense: 'Expenses',
    transfer: 'Finance',
    finance: 'Finance',
    'receipt-voucher': 'Accounts',
    'payment-voucher': 'Accounts',
    adjustment: 'Accounts'
  };
  return labels[source.source] ?? source.source;
}

function sourceRoute(source: AuditSourceRecord) {
  if (source.source === 'sale' || source.source === 'customer-payment') return '/app/sales';
  if (source.source === 'purchase' || source.source === 'supplier-payment') return '/app/purchases';
  if (source.source === 'expense') return '/app/expenses';
  if (source.source === 'finance' || source.source === 'transfer') return '/app/finance';
  return '/app/accounts';
}

export function AuditLedger() {
  const {text,language,showHelper}=useUiCopy();
  const navigate = useNavigate();
  const location = useLocation();
  const { entryDateView, setEntryDateView } = useUserPreferences();
  const [state, setState] = useState(() => createAuditState(auditSourceRecords));
  const [filters, setFilters] = useState<AuditFilterState>({
    search: '',
    from: '2026-10-01',
    to: '2026-10-07',
    source: 'All sources',
    party: 'All parties',
    account: 'All accounts',
    postedBy: 'All posters',
    changedBy: 'All changers',
    status: 'All status',
    changed: 'Changed or not'
  });
  const [detailId, setDetailId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteReason, setDeleteReason] = useState('');

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const editRef = params.get('editRef');
    const openRef = params.get('openRef');
    const reference = editRef || openRef;
    if (!reference) return;
    const match = state.sources.find((item) => item.reference === reference);
    if (match) {
      if (editRef && match.status === 'Posted') setEditId(match.id);
      else setDetailId(match.id);
    } else {
      setFilters((current) => ({ ...current, search: reference }));
      toast.info(text('Source record is not in this audit demo yet','এই লেনদেন নমুনা অডিটে নেই'), { description: text('The Audit Ledger was filtered to the reference.','লেনদেনের নম্বর দিয়ে খোঁজা হয়েছে।') });
    }
  }, [location.search]);

  const changedByOptions = useMemo(() => Array.from(new Set(state.auditEvents.map((event) => event.user))).sort(), [state.auditEvents]);

  const filtered = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    return state.sources.filter((source) => {
      const timeline = auditTimelineFor(state, source.id);
      const changedBy = timeline.map((event) => event.user);
      const accounts = accountLabel(source);
      const viewDate = entryDateView === 'created' ? source.createdAt.slice(0, 10) : source.transactionDate;
      const matchesSearch = fuzzyMatch(query,[
        source.reference,
        source.party,
        source.description,
        source.note,
        source.postedBy,
        source.source,
        accounts,
        String(source.amount)
      ]);
      const matchesDate = (!filters.from || viewDate >= filters.from) && (!filters.to || viewDate <= filters.to);
      const matchesSource = filters.source === 'All sources' || source.source === filters.source;
      const matchesParty = filters.party === 'All parties' || source.party === filters.party;
      const matchesAccount = filters.account === 'All accounts' || accounts.includes(filters.account);
      const matchesPoster = filters.postedBy === 'All posters' || source.postedBy === filters.postedBy;
      const matchesChanger = filters.changedBy === 'All changers' || changedBy.includes(filters.changedBy);
      const matchesStatus = filters.status === 'All status' || source.status === filters.status;
      const matchesChanged = filters.changed === 'Changed or not' || (filters.changed === 'Changed' ? timeline.length > 0 : timeline.length === 0);
      return matchesSearch && matchesDate && matchesSource && matchesParty && matchesAccount && matchesPoster && matchesChanger && matchesStatus && matchesChanged;
    });
  }, [entryDateView, filters, state]);

  const detail = detailId ? state.sources.find((item) => item.id === detailId) ?? null : null;
  const editSource = editId ? state.sources.find((item) => item.id === editId) ?? null : null;
  const deleteSource = deleteId ? state.sources.find((item) => item.id === deleteId) ?? null : null;
  const detailEvents = detail ? auditTimelineFor(state, detail.id) : [];
  const detailPosting = detail ? state.postings.find((item) => item.sourceId === detail.id) : undefined;

  const changedCount = new Set(state.auditEvents.filter((event) => event.type === 'Edited').map((event) => event.sourceId)).size;
  const deletedCount = state.sources.filter((item) => item.status === 'Deleted').length;
  const postedCount = state.sources.filter((item) => item.status === 'Posted').length;
  const deleteValidation = deleteSource ? validateDelete({
    sourceId: deleteSource.id,
    reason: deleteReason.trim() || 'preview',
    user: 'Shuvo',
    at: new Date().toISOString()
  }, state) : { allowed: false, message: undefined };
  const deleteImpacts = deleteSource ? auditDeleteImpact(deleteSource) : [];

  const requestEdit = (source: AuditSourceRecord) => {
    setDetailId(null);
    setEditId(source.id);
  };

  const requestDelete = (source: AuditSourceRecord) => {
    setDetailId(null);
    setDeleteReason('');
    setDeleteId(source.id);
  };

  const goToSource = (source: AuditSourceRecord) => {
    navigate(`${sourceRoute(source)}?open=${encodeURIComponent(source.id)}`);
  };

  const confirmDelete = () => {
    if (!deleteSource) return;
    if (!deleteReason.trim()) return toast.error(text('Enter a reason for deleting this transaction','লেনদেন মুছতে কারণ লিখুন।'));
    try {
      const next = applyDelete({
        sourceId: deleteSource.id,
        reason: deleteReason,
        user: 'Shuvo',
        at: new Date().toISOString()
      }, state);
      setState(next);
      setDeleteId(null);
      setDeleteReason('');
      toast.success(text('Sample posting reversed','নমুনা লেনদেন উল্টো করা হয়েছে'), { description: text('Audit history is retained in this preview; live sources are not connected.','প্রিভিউতে পরিবর্তনের ইতিহাস রাখা হয়েছে। আসল হিসাব সংযুক্ত নয়।') });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : text('Could not delete transaction','লেনদেন মুছতে পারেনি'));
    }
  };

  const reportHeaders=['Transaction date','Created date','Type','Reference','Party','Source','Account','Amount','Posted by','Last changed by','Status'];
  const reportRows=filtered.map(source=>[source.transactionDate,source.createdAt.slice(0,10),source.source,source.reference,source.party??'',sourceLabel(source),accountLabel(source),source.amount,source.postedBy,auditTimelineFor(state,source.id)[0]?.user??'',source.status]);
  const exportAudit=()=>downloadReport('hisabiq-audit-ledger.csv',reportHeaders,reportRows);
  const printAudit=()=>{if(!printReport({title:documentLabel(language,'Audit Ledger'),language,subtitle:`${filters.from||documentLabel(language,'All dates')} — ${filters.to||documentLabel(language,'All dates')} · ${documentLabel(language,entryDateView==='created'?'Created date':'Transaction date')}`,headers:reportHeaders.map(h=>documentLabel(language,h)),rows:reportRows.map(row=>row.map((value,index)=>index===5||index===10?documentLabel(language,String(value)):value))}))toast.error(text('Allow the print preview window, then try again.','প্রিন্টের উইন্ডো খুলতে দিন, তারপর আবার চেষ্টা করুন।'));};

  return (
    <div className="mx-auto max-w-[1440px] space-y-4">
      <PageHeader
        title="Audit Ledger"
        titleBn="হিসাব যাচাই"
        description="Review source records and changes · মূল লেনদেন যাচাই. UI preview only; no live ledger posting."
        descriptionBn="মূল লেনদেন ও পরিবর্তন যাচাই করুন। শুধু প্রিভিউ, আসল খাতায় লেখা হবে না।"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
              <button onClick={() => setEntryDateView('transaction')} className={`rounded-md px-2.5 py-1.5 text-xs font-medium ${entryDateView === 'transaction' ? 'bg-inverse text-white' : 'text-ink-500 hover:bg-ink-50'}`}>{text('Transaction Date','লেনদেনের তারিখ')}</button>
              <button onClick={() => setEntryDateView('created')} className={`rounded-md px-2.5 py-1.5 text-xs font-medium ${entryDateView === 'created' ? 'bg-inverse text-white' : 'text-ink-500 hover:bg-ink-50'}`}>{text('Created Date','লেখার তারিখ')}</button>
            </div>
            <Button variant="outline" size="sm" onClick={exportAudit}><ArrowDownToLine className="size-4" /> {text('Export','ডাউনলোড')}</Button>
            <Button variant="outline" size="sm" onClick={printAudit}><Printer className="size-4" /> {text('Print','প্রিন্ট')}</Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          [text('Posted records','লেখা লেনদেন'), String(postedCount), 'বর্তমানে চালু লেনদেন'],
          [text('Changed records','সংশোধিত লেনদেন'), String(changedCount), 'যেসব লেনদেন ঠিক করা হয়েছে'],
          [text('Deleted records','মুছে ফেলা লেনদেন'), String(deletedCount), 'ইতিহাস রেখে মুছে দেওয়া'],
          [text('Audit events','পরিবর্তনের ইতিহাস'), String(state.auditEvents.length), 'সব পরিবর্তনের ইতিহাস']
        ].map(([label, value, helper]) => (
          <div key={label} className="rounded-xl border border-border bg-card px-4 py-3 shadow-card">
            <p className="text-[12.5px] text-ink-500">{label}</p>
            <p className="mt-0.5 text-lg font-semibold text-ink">{value}</p>
            <p className="font-bn text-[10.5px] text-ink-400">{helper}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
        <AuditFilters value={filters} onChange={setFilters} records={state.sources} changedByOptions={changedByOptions} dateView={entryDateView} />

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-9 pl-4 text-xs">{text(entryDateView === 'transaction' ? 'Transaction Date' : 'Created Date',entryDateView === 'transaction'?'লেনদেনের তারিখ':'লেখার তারিখ')}</TableHead>
                <TableHead className="h-9 text-xs">{text(entryDateView === 'transaction' ? 'Created Date' : 'Transaction Date',entryDateView === 'transaction'?'লেখার তারিখ':'লেনদেনের তারিখ')}</TableHead>
                <TableHead className="h-9 text-xs">{text('Type / Reference','ধরন / নম্বর')}</TableHead>
                <TableHead className="h-9 text-xs">{text('Party / Person','পক্ষ / ব্যক্তি')}</TableHead>
                <TableHead className="h-9 text-xs">{text('Source','উৎস')}</TableHead>
                <TableHead className="h-9 text-xs">{text('Account / Payment','হিসাব / পেমেন্ট')}</TableHead>
                <TableHead className="h-9 text-right text-xs">{text('Amount','টাকা')}</TableHead>
                <TableHead className="h-9 text-xs">{text('Posted by','যিনি লিখেছেন')}</TableHead>
                <TableHead className="h-9 text-xs">{text('Last changed by','শেষ সংশোধনকারী')}</TableHead>
                <TableHead className="h-9 text-xs">{text('Status','অবস্থা')}</TableHead>
                <TableHead className="h-9 pr-4 text-right text-xs">{text('Action','কাজ')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((source) => {
                const timeline = auditTimelineFor(state, source.id);
                const lastChange = timeline[0];
                const availability = auditActionAvailability(source.source, demoPermissions);
                const primaryDate = entryDateView === 'transaction' ? source.transactionDate : source.createdAt.slice(0, 10);
                const secondaryDate = entryDateView === 'transaction' ? source.createdAt.slice(0, 10) : source.transactionDate;
                return (
                  <TableRow key={source.id} className="text-[13px]">
                    <TableCell className="py-2 pl-4 font-medium text-ink">{primaryDate}</TableCell>
                    <TableCell className="py-2 text-ink-500">{secondaryDate}</TableCell>
                    <TableCell className="py-2">
                      <p className="font-medium text-ink">{source.reference}</p>
                      <p data-table-helper="" className="text-[10.5px] text-ink-400">{source.source === 'adjustment' ? 'Adjustment Entry' : source.source.replaceAll('-', ' ')}</p>
                    </TableCell>
                    <TableCell className="py-2 text-ink-600">{source.party || '—'}</TableCell>
                    <TableCell className="py-2 text-ink-500">{text(sourceLabel(source),sourceLabel(source)==='Sales'?'বিক্রি':sourceLabel(source)==='Purchase'?'ক্রয়':sourceLabel(source)==='Expense'?'খরচ':sourceLabel(source)==='Transfer'?'হিসাবে টাকা সরানো':sourceLabel(source))}</TableCell>
                    <TableCell className="max-w-[220px] py-2"><p className="truncate text-ink-500">{accountLabel(source)}</p></TableCell>
                    <TableCell className="py-2 text-right font-semibold text-ink">{taka(source.amount)}</TableCell>
                    <TableCell className="py-2"><p className="font-medium text-ink">{source.postedBy}</p><p data-table-helper="" className="text-[10.5px] text-ink-400">{source.createdAt.slice(11, 16)}</p></TableCell>
                    <TableCell className="py-2 text-ink-500">{lastChange?.user || '—'}</TableCell>
                    <TableCell className="py-2"><StatusBadge tone={source.status === 'Posted' ? 'success' : 'neutral'} dot>{text(source.status,source.status==='Posted'?'লেখা হয়েছে':'মুছে ফেলা')}</StatusBadge></TableCell>
                    <TableCell className="py-2 pr-4 text-right">
                      <FloatingPanel
                        label={'Audit actions for ' + source.reference}
                        width={190}
                        trigger={({ toggle }) => (
                          <button onClick={toggle} className="rounded-md p-1.5 text-ink-400 hover:bg-ink-50 hover:text-ink" aria-label={'Actions for ' + source.reference}>
                            <MoreHorizontal className="size-4" />
                          </button>
                        )}>
                        {(close) => (
                          <div className="py-1">
                            {availability.view && <button className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12.5px] text-ink-700 hover:bg-ink-50" onClick={() => { close(); setDetailId(source.id); }}><Eye className="size-3.5" /> {text('Open','খুলুন')}</button>}
                            {source.status === 'Posted' && availability.correct && <button className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12.5px] text-ink-700 hover:bg-ink-50" onClick={() => { close(); requestEdit(source); }}><Pencil className="size-3.5" /> {text('Correct','সংশোধন')}</button>}
                            {source.status === 'Posted' && availability.delete && <button className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12.5px] text-danger hover:bg-danger/5" onClick={() => { close(); requestDelete(source); }}><Trash2 className="size-3.5" /> {text('Delete','মুছুন')}</button>}
                          </div>
                        )}
                      </FloatingPanel>
                    </TableCell>
                  </TableRow>
                );
              })}
              {!filtered.length && (
                <TableRow>
                  <TableCell colSpan={11} className="py-14 text-center">
                    <ShieldCheck className="mx-auto size-5 text-helper" />
                    <p className="mt-2 text-sm font-medium text-ink">{text('No audit records found','কোনো লেনদেন মেলেনি')}</p>
                    <p data-table-helper="" className="mt-1 font-bn text-xs text-ink-400">এই ফিল্টারে কোনো লেনদেন নেই</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <AuditDetailsDialog
        source={detail}
        posting={detailPosting}
        events={detailEvents}
        onClose={() => setDetailId(null)}
        onEdit={requestEdit}
        onDelete={requestDelete}
        onGoToSource={goToSource}
      />

      <AuditEditDialog
        source={editSource}
        state={state}
        onClose={() => setEditId(null)}
        onApply={(next) => {
          setState(next);
          setEditId(null);
        }}
      />

      <Dialog open={!!deleteSource} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>{text('Review delete impact','মুছলে কী হবে যাচাই করুন')}</DialogTitle></DialogHeader>

          <div className="rounded-lg border border-danger/20 bg-danger/5 px-3 py-2.5">
            <p className="text-[13px] font-medium text-danger">{deleteSource?.reference} · {deleteSource ? taka(deleteSource.amount) : ''}</p>
            <p className="mt-1 font-bn text-[11px] text-ink-500">এক পাশের Debit/Credit আলাদা করে মুছবে না। পুরো লেনদেনের প্রভাব একসাথে বাতিল হবে এবং ইতিহাস থাকবে।</p>
          </div>

          {deleteSource && (
            <div className="rounded-xl border border-border">
              <div className="border-b border-border px-3 py-2.5"><p className="text-[12.5px] font-semibold text-ink">{text('This will update','এই হিসাবগুলো বদলাবে')}</p></div>
              <div className="flex flex-wrap gap-1.5 p-3">
                {deleteImpacts.map((impact) => <span key={impact} className="rounded-md border border-border bg-ink-50 px-2 py-1 text-[11px] text-ink-600">{impact}</span>)}
              </div>
            </div>
          )}

          {!deleteValidation.allowed && deleteValidation.message && deleteReason.trim() !== '' && (
            <div className="rounded-lg border border-warning/20 bg-warning/5 px-3 py-2.5">
              <p className="text-[12.5px] font-medium text-warning">{text('Delete blocked','মোছা যাবে না')}</p>
              <p className="mt-1 font-bn text-[11px] text-ink-600">{deleteValidation.message}</p>
            </div>
          )}
          {deleteSource?.source === 'sale' && (deleteSource.returnedQuantity ?? 0) > 0 && (
            <div className="rounded-lg border border-warning/20 bg-warning/5 px-3 py-2.5">
              <p className="text-[12.5px] font-medium text-warning">{text('Resolve linked Return first','আগে সংশ্লিষ্ট ফেরত ঠিক করুন')}</p>
              <p className="mt-1 font-bn text-[11px] text-ink-600">এই Sale-এর {deleteSource.returnedQuantity}টি পণ্য Return আছে। Return ঠিক বা মুছে তারপর Sale Delete করুন।</p>
            </div>
          )}

          <label className="text-[13px] font-medium text-ink">
            {text('Reason for delete','মোছার কারণ')} {showHelper&&<span className="font-bn text-[11px] font-normal text-ink-400">· কেন মুছছেন</span>}
            <Input className="mt-1.5" value={deleteReason} onChange={(event) => setDeleteReason(event.target.value)} placeholder={text("e.g. Duplicate transaction","যেমন: একই লেনদেন দুইবার হয়েছে")} />
          </label>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>{text('Cancel','বাতিল')}</Button>
            <Button disabled={!deleteSource || (deleteSource.source === 'sale' && (deleteSource.returnedQuantity ?? 0) > 0)} onClick={confirmDelete}>{text('Delete complete transaction','পুরো লেনদেন মুছুন')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

