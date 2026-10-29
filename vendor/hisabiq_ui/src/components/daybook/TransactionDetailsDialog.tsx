import React from 'react';
import { Copy, ExternalLink, Printer } from 'lucide-react';
import { Button } from '../Button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../Dialog';
import { StatusBadge } from '../StatusBadge';
import type { UnifiedTransaction } from '../../types/transactions';
import { taka } from '../../utils/currency';
import { daybookActionAvailability, demoPermissions } from '../../utils/permissions';
import { daybookContextActions } from '../../utils/moduleUiActions';

function Field({ label, helper, children }: { label: string; helper?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border px-3 py-2.5">
      <p className="text-[10.5px] text-ink-400">{label}{helper ? <span className="font-bn"> · {helper}</span> : null}</p>
      <div className="mt-0.5 text-[13px] font-medium text-ink">{children}</div>
    </div>
  );
}

export function TransactionDetailsDialog({
  transaction,
  onClose,
  onEdit,
  onDelete,
  onGoToSource,
  onPrint,
  onDuplicate
}: {
  transaction: UnifiedTransaction | null;
  onClose: () => void;
  onEdit: (transaction: UnifiedTransaction) => void;
  onDelete: (transaction: UnifiedTransaction) => void;
  onGoToSource: (transaction: UnifiedTransaction) => void;
  onPrint: (transaction: UnifiedTransaction) => void;
  onDuplicate: (transaction: UnifiedTransaction) => void;
}) {
  if (!transaction) return null;
  const availability = daybookActionAvailability(transaction.source, demoPermissions);
  const extras = daybookContextActions(transaction.source);
  return (
    <Dialog open={!!transaction} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{transaction.type} · {transaction.reference}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Transaction Date" helper="যে তারিখের লেনদেন">{transaction.transactionDate}</Field>
          <Field label="Created Date" helper="যেদিন এন্ট্রি হয়েছে">{transaction.createdAt.replace('T', ' ').slice(0, 16)}</Field>
          <Field label="Posted by" helper="কে এন্ট্রি করেছেন">{transaction.postedBy}</Field>
          <Field label="Posted at">{transaction.createdAt.replace('T', ' ').slice(0, 16)}</Field>
          <Field label="Party" helper="কার সাথে">{transaction.party || '—'}</Field>
          <Field label="Amount" helper="মোট পরিমাণ">{taka(transaction.amount)}</Field>
          <Field label="Status"><StatusBadge tone={transaction.status === 'Posted' ? 'success' : transaction.status === 'Deleted' ? 'danger' : 'neutral'} dot>{transaction.status}</StatusBadge></Field>
          <Field label="Last edited by">{transaction.updatedBy || '—'}</Field>
          <Field label="Last edited at">{transaction.updatedAt ? transaction.updatedAt.replace('T', ' ').slice(0, 16) : '—'}</Field>
          {transaction.status === 'Deleted' && <Field label="Deleted by / at">{transaction.deletedBy || '—'}{transaction.deletedAt ? ' · ' + transaction.deletedAt.replace('T', ' ').slice(0, 16) : ''}</Field>}
          <Field label="Money In" helper="টাকা এসেছে">{transaction.moneyIn ? taka(transaction.moneyIn) : '—'}</Field>
          <Field label="Money Out" helper="টাকা গেছে">{transaction.moneyOut ? taka(transaction.moneyOut) : '—'}</Field>
          <Field label="Account" helper="যে অ্যাকাউন্টে প্রভাব">{transaction.accounts.join(' + ') || '—'}</Field>
        </div>

        {transaction.deleteReason && <div className="rounded-lg border border-danger/20 bg-danger/5 px-3 py-2.5"><p className="text-[10.5px] text-danger">Delete reason</p><p className="mt-0.5 text-[12.5px] text-ink-700">{transaction.deleteReason}</p></div>}

        {transaction.details && (
          <div className="rounded-lg bg-ink-50 px-3 py-2.5">
            <p className="text-[10.5px] text-ink-400">Details · <span className="font-bn">লেনদেনের বিস্তারিত</span></p>
            <p className="mt-0.5 text-[13px] text-ink-700">{transaction.details}</p>
          </div>
        )}

        {!!transaction.paymentBreakdown?.length && (
          <div className="rounded-xl border border-border">
            <div className="border-b border-border px-3 py-2">
              <p className="text-[12.5px] font-medium text-ink">Payment breakdown <span className="font-bn text-[11px] font-normal text-ink-400">· কোথা থেকে কত টাকা</span></p>
            </div>
            <div className="divide-y divide-border">
              {transaction.paymentBreakdown.map((payment, index) => (
                <div key={`${payment.label}-${index}`} className="flex items-center justify-between px-3 py-2 text-[12.5px]">
                  <span className="text-ink-600">{payment.label}</span>
                  <span className="font-medium text-ink">{taka(payment.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <DialogFooter>
          {extras.includes('print') && <Button variant="outline" onClick={() => onPrint(transaction)}><Printer className="size-4" /> Print</Button>}
          {extras.includes('duplicate') && transaction.status !== 'Deleted' && <Button variant="outline" onClick={() => onDuplicate(transaction)}><Copy className="size-4" /> Duplicate</Button>}
          {availability.open && <Button variant="outline" onClick={() => onGoToSource(transaction)}><ExternalLink className="size-4" /> Go to source</Button>}
          {availability.delete && transaction.status !== 'Deleted' && <Button variant="outline" onClick={() => onDelete(transaction)}>Review reversal</Button>}
          {availability.edit && transaction.status !== 'Deleted' && <Button variant="outline" onClick={() => onEdit(transaction)}>Edit</Button>}
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

