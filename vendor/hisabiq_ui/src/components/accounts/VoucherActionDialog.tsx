import React, { useEffect, useMemo, useState } from 'react';
import { Copy, ExternalLink, Pencil, Printer, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../Button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../Dialog';
import { Input } from '../Input';
import { StatusBadge } from '../StatusBadge';
import { accountingAccounts } from '../../data/accounting';
import type { AccountingSourceTransaction, Posting } from '../../types/accounting';
import { isManualAccountingSource } from '../../utils/moduleUiActions';
import { taka } from '../../utils/currency';

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="rounded-lg bg-ink-50 px-3 py-2.5"><p className="text-[10.5px] text-ink-400">{label}</p><div className="mt-0.5 text-[12.5px] font-medium text-ink">{children}</div></div>;
}

export function VoucherActionDialog({
  source,
  posting,
  onClose,
  onUpdate,
  onDelete,
  onDuplicate,
  onGoToSource
}: {
  source: AccountingSourceTransaction | null;
  posting?: Posting;
  onClose: () => void;
  onUpdate: (source: AccountingSourceTransaction) => void;
  onDelete: (source: AccountingSourceTransaction, reason: string) => void;
  onDuplicate: (source: AccountingSourceTransaction) => void;
  onGoToSource: (source: AccountingSourceTransaction) => void;
}) {
  const [mode, setMode] = useState<'view' | 'edit' | 'delete'>('view');
  const [date, setDate] = useState('');
  const [reference, setReference] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!source) return;
    setMode('view');
    setDate(source.transactionDate);
    setReference(source.reference);
    setDescription(source.description ?? '');
    setAmount(String(source.amount));
    setReason('');
  }, [source]);

  const accountMap = useMemo(() => new Map(accountingAccounts.map((item) => [item.id, item.name])), []);
  if (!source) return null;
  const manual = isManualAccountingSource(source.source);
  const deleted = source.recordStatus === 'Deleted';

  const save = () => {
    const value = parseFloat(amount) || 0;
    if (!value) return toast.error('Enter a valid amount');
    const financial = value !== source.amount || date !== source.transactionDate;
    if (financial && !reason.trim()) return toast.error('Enter a reason for the financial correction');

    let next: AccountingSourceTransaction = {
      ...source,
      transactionDate: date,
      reference: reference.trim() || source.reference,
      description: description.trim(),
      amount: value,
      updatedAt: '2026-10-07T16:20:00+06:00',
      updatedBy: 'Shuvo'
    };

    if (source.source === 'receipt-voucher' || source.source === 'payment-voucher') {
      const first = source.paymentAccounts?.[0];
      next = { ...next, paid: value, paymentAccounts: [{ account: first?.account ?? 'Main Cash Counter', amount: value }] };
    }
    if ((source.source === 'adjustment' || source.source === 'opening-balance') && source.lines?.length && source.amount) {
      const factor = value / source.amount;
      next = {
        ...next,
        lines: source.lines.map((line) => ({
          ...line,
          debit: line.debit ? line.debit * factor : 0,
          credit: line.credit ? line.credit * factor : 0
        }))
      };
    }
    onUpdate(next);
    setMode('view');
  };

  const confirmDelete = () => {
    if (!reason.trim()) return toast.error('Enter a reason for deleting this entry');
    onDelete(source, reason.trim());
    onClose();
  };

  return (
    <Dialog open={!!source} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{source.reference} <StatusBadge tone={deleted ? 'neutral' : 'success'} dot>{deleted ? 'Deleted' : 'Posted'}</StatusBadge></DialogTitle>
        </DialogHeader>

        {mode === 'view' && (
          <div className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <Detail label="Transaction Date">{source.transactionDate}</Detail>
              <Detail label="Created Date">{source.createdAt.slice(0, 10)}</Detail>
              <Detail label="Posted by">{source.postedBy}</Detail>
              <Detail label="Amount">{taka(source.amount)}</Detail>
            </div>
            <div className="rounded-xl border border-border p-3">
              <p className="text-[10.5px] text-ink-400">Description</p>
              <p className="mt-1 text-[12.5px] text-ink-700">{source.description || '—'}</p>
              {source.updatedBy && <p className="mt-2 text-[10.5px] text-ink-400">Last corrected by {source.updatedBy} · {source.updatedAt?.replace('T', ' ').slice(0, 16)}</p>}
              {source.deleteReason && <p className="mt-2 text-[10.5px] text-danger">Deleted by {source.deletedBy} · {source.deleteReason}</p>}
            </div>
            {posting && (
              <div className="overflow-hidden rounded-xl border border-border">
                <div className="flex items-center justify-between border-b border-border px-3 py-2.5"><div><p className="text-[12.5px] font-semibold text-ink">Balanced posting</p><p className="font-bn text-[10.5px] text-ink-400">এই ভাউচার থেকে তৈরি Debit/Credit</p></div><StatusBadge tone={posting.status === 'Posted' ? 'success' : 'neutral'}>{posting.status}</StatusBadge></div>
                <div className="divide-y divide-border">
                  {posting.lines.map((line, index) => (
                    <div key={index} className="grid grid-cols-[1fr_110px_110px] gap-2 px-3 py-2 text-[12px]">
                      <span className="text-ink-600">{accountMap.get(line.accountId) ?? line.accountId}</span>
                      <span className="text-right text-ink-500">{line.debit ? 'Debit ' + taka(line.debit) : '—'}</span>
                      <span className="text-right text-ink-500">{line.credit ? 'Credit ' + taka(line.credit) : '—'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {mode === 'edit' && (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-[13px] font-medium text-ink">Transaction Date<Input className="mt-1.5" type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
            <label className="text-[13px] font-medium text-ink">Created Date<Input className="mt-1.5 bg-ink-50 text-ink-500" readOnly value={source.createdAt.slice(0, 10)} /></label>
            <label className="text-[13px] font-medium text-ink">Reference<Input className="mt-1.5" value={reference} onChange={(event) => setReference(event.target.value)} /></label>
            <label className="text-[13px] font-medium text-ink">Amount<div className="relative mt-1.5"><span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-400">৳</span><Input className="pl-7 text-right" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value.replace(/[^\d.]/g, ''))} /></div></label>
            <label className="text-[13px] font-medium text-ink sm:col-span-2">Description<Input className="mt-1.5" value={description} onChange={(event) => setDescription(event.target.value)} /></label>
            <label className="text-[13px] font-medium text-ink sm:col-span-2">Reason for correction <span className="font-bn text-[11px] font-normal text-ink-400">· আর্থিক পরিবর্তন হলে কারণ আবশ্যক</span><Input className="mt-1.5" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="e.g. Wrong date / amount entered" /></label>
          </div>
        )}

        {mode === 'delete' && (
          <div className="space-y-3">
            <div className="rounded-lg border border-danger/20 bg-danger/5 px-3 py-2.5"><p className="text-[13px] font-medium text-danger">Delete complete voucher?</p><p className="mt-1 font-bn text-[11px] text-ink-500">এক পাশ নয়—পুরো balanced posting একসাথে Deleted হবে এবং audit তথ্য থাকবে।</p></div>
            <label className="text-[13px] font-medium text-ink">Reason for delete <span className="font-bn text-[11px] font-normal text-ink-400">· কেন মুছছেন</span><Input className="mt-1.5" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="e.g. Duplicate voucher" /></label>
          </div>
        )}

        <DialogFooter>
          {mode === 'view' && <>
            <Button variant="outline" onClick={() => window.print()}><Printer className="size-4" /> Print</Button>
            {!deleted && manual && <Button variant="outline" onClick={() => onDuplicate(source)}><Copy className="size-4" /> Duplicate</Button>}
            {!deleted && manual && <Button variant="outline" onClick={() => setMode('edit')}><Pencil className="size-4" /> Edit</Button>}
            {!deleted && manual && <Button variant="outline" onClick={() => { setReason(''); setMode('delete'); }}><Trash2 className="size-4" /> Delete</Button>}
            {!manual && <Button variant="outline" onClick={() => onGoToSource(source)}><ExternalLink className="size-4" /> Go to source</Button>}
            <Button onClick={onClose}>Close</Button>
          </>}
          {mode === 'edit' && <><Button variant="outline" onClick={() => setMode('view')}>Cancel</Button><Button onClick={save}><Save className="size-4" /> Save correction</Button></>}
          {mode === 'delete' && <><Button variant="outline" onClick={() => setMode('view')}>Cancel</Button><Button onClick={confirmDelete}>Delete voucher</Button></>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

