import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../Button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../Dialog';
import { FormSelect } from '../FormSelect';
import { Input } from '../Input';
import { accountingAccounts } from '../../data/accounting';
import { financeAccounts } from '../../data/financeAccounts';
import { parties } from '../../data/parties';
import type { AuditSourceRecord, AuditState, CorrectionCommand } from '../../types/audit';
import { applyCorrection, buildImpactPreview, validateCorrection } from '../../utils/auditEngine';
import { ImpactPreview } from './ImpactPreview';
import {useUiCopy} from '../../i18n/useUiCopy';

const moneyAccountNames = financeAccounts.filter((item) => item.status === 'Active').map((item) => item.name);
const expenseAccounts = accountingAccounts.filter((item) => item.group === 'Expense' && item.active);

export function AuditEditDialog({
  source,
  state,
  onClose,
  onApply
}: {
  source: AuditSourceRecord | null;
  state: AuditState;
  onClose: () => void;
  onApply: (state: AuditState) => void;
}) {
  const {text,showHelper}=useUiCopy();
  const [review, setReview] = useState(false);
  const [date, setDate] = useState('');
  const [reference, setReference] = useState('');
  const [partyId, setPartyId] = useState('');
  const [party, setParty] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [note, setNote] = useState('');
  const [quantity, setQuantity] = useState('');
  const [expenseAccountId, setExpenseAccountId] = useState('');
  const [fromAccount, setFromAccount] = useState('');
  const [toAccount, setToAccount] = useState('');
  const [payments, setPayments] = useState<Array<{ account: string; amount: string }>>([]);
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!source) return;
    setReview(false);
    setDate(source.transactionDate);
    setReference(source.reference);
    setPartyId(source.partyId ?? '');
    setParty(source.party ?? '');
    setAmount(String(source.amount));
    setDescription(source.description ?? '');
    setNote(source.note ?? '');
    setQuantity(source.quantity === undefined ? '' : String(source.quantity));
    setExpenseAccountId(source.expenseAccountId ?? 'expense-misc');
    setFromAccount(source.fromAccount ?? moneyAccountNames[0] ?? '');
    setToAccount(source.toAccount ?? moneyAccountNames[1] ?? moneyAccountNames[0] ?? '');
    setPayments((source.paymentAccounts ?? []).map((item) => ({ account: item.account, amount: String(item.amount) })));
    setReason('');
  }, [source]);

  const command = useMemo<CorrectionCommand | null>(() => {
    if (!source) return null;
    const nextPayments = payments
      .map((item) => ({ account: item.account.trim(), amount: parseFloat(item.amount) || 0 }))
      .filter((item) => item.account || item.amount);
    const paid = nextPayments.reduce((sum, item) => sum + item.amount, 0);
    const patch: CorrectionCommand['patch'] = {};

    if (date !== source.transactionDate) patch.transactionDate = date;
    if (reference.trim() && reference.trim() !== source.reference) patch.reference = reference.trim();
    if (partyId && partyId !== source.partyId) patch.partyId = partyId;
    if (party !== (source.party ?? '')) patch.party = party;
    const nextAmount = parseFloat(amount) || 0;
    if (nextAmount !== source.amount) patch.amount = nextAmount;
    if (description !== (source.description ?? '')) patch.description = description;
    if (note !== (source.note ?? '')) patch.note = note;
    if (source.quantity !== undefined && quantity !== '' && Number(quantity) !== source.quantity) patch.quantity = Number(quantity);
    if (source.source === 'expense' && expenseAccountId !== (source.expenseAccountId ?? 'expense-misc')) patch.expenseAccountId = expenseAccountId;
    if (source.source === 'transfer') {
      if (fromAccount !== (source.fromAccount ?? '')) patch.fromAccount = fromAccount;
      if (toAccount !== (source.toAccount ?? '')) patch.toAccount = toAccount;
    }
    if ((source.paymentAccounts?.length || source.paid > 0) && JSON.stringify(nextPayments) !== JSON.stringify(source.paymentAccounts ?? [])) {
      patch.paymentAccounts = nextPayments;
      patch.paid = paid;
    }

    return {
      sourceId: source.id,
      patch,
      reason,
      user: 'Shuvo',
      at: '2026-10-07T16:30:00+06:00'
    };
  }, [amount, date, description, expenseAccountId, fromAccount, note, party, partyId, payments, quantity, reason, reference, source, toAccount]);

  const preview = command ? buildImpactPreview(command, state) : { changes: [], impacts: [] };
  const validation = command ? validateCorrection(command, state) : { allowed: false, fieldErrors: {} as Record<string, string> };
  const partyOptions = parties.map((item) => ({ value: item.id, label: item.name }));

  const startReview = () => {
    if (!command || !preview.changes.length) return toast.error(text('No changes to review','যাচাই করার মতো কোনো পরিবর্তন নেই।'));
    if (!validation.allowed) {
      toast.error(Object.values(validation.fieldErrors)[0] || text('Review the highlighted fields','চিহ্নিত তথ্যগুলো আবার দেখুন।'));
      return;
    }
    setReview(true);
  };

  const save = () => {
    if (!command) return;
    try {
      onApply(applyCorrection(command, state));
      toast.success(text('Transaction corrected','লেনদেন সংশোধন হয়েছে'), { description: source?.reference });
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : text('Could not apply correction','সংশোধন করা যায়নি'));
    }
  };

  return (
    <Dialog open={!!source} onOpenChange={(open) => !open && onClose()}>
      <DialogContent role="dialog" aria-label={text("Correct transaction","লেনদেন সংশোধন")} className="max-h-[92dvh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{review ? text('Review changes','সংশোধন যাচাই') : text('Correct transaction','লেনদেন সংশোধন')} {showHelper&&<span className="font-bn text-sm font-normal text-ink-400">· হিসাব ঠিক করুন</span>}</DialogTitle>
        </DialogHeader>

        {!review && source && (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-ink-50/50 px-3 py-2">
              <p className="text-[12px] font-medium text-ink">{source.reference} · {source.source.replaceAll('-', ' ')}</p>
              <p className="mt-0.5 font-bn text-[10.5px] text-ink-400">শুধু এই লেনদেনের জন্য নিরাপদ ও প্রযোজ্য ফিল্ডগুলো পরিবর্তন করুন। Created Date কখনও বদলাবে না।</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-[13px] font-medium text-ink">
                {text('Transaction Date','লেনদেনের তারিখ')} {showHelper&&<span className="font-bn text-[11px] font-normal text-ink-400">· যে তারিখের লেনদেন</span>}
                <Input className="mt-1.5" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
              </label>
              <label className="text-[13px] font-medium text-ink">
                {text('Created Date','লেখার তারিখ')}
                <Input className="mt-1.5 bg-ink-50 text-ink-500" value={source.createdAt.slice(0, 10)} readOnly />
                <span className="mt-1 block font-bn text-[10.5px] font-normal text-ink-400">এটি বদলানো যাবে না</span>
              </label>

              <label className="text-[13px] font-medium text-ink">
                {text('Reference','রেফারেন্স')}
                <Input className="mt-1.5" value={reference} onChange={(event) => setReference(event.target.value)} />
              </label>

              <label className="text-[13px] font-medium text-ink">
                {text('Amount','টাকা')}
                <div className="relative mt-1.5">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-400">৳</span>
                  <Input className="pl-7 text-right" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value.replace(/[^\d.]/g, ''))} />
                </div>
                {validation.fieldErrors.paid && <span className="mt-1 block font-bn text-[10.5px] text-danger">Paid amount-এর নিচে মোট Amount করা যাবে না</span>}
              </label>

              {source.partyId ? (
                <label className="text-[13px] font-medium text-ink sm:col-span-2">
                  {text('Party / Person','পক্ষ / ব্যক্তি')} {showHelper&&<span className="font-bn text-[11px] font-normal text-ink-400">· যার সাথে লেনদেন</span>}
                  <FormSelect
                    aria-label={text("Party / Person","পক্ষ / ব্যক্তি")}
                    className="mt-1.5"
                    value={partyId}
                    onChange={(event) => {
                      const id = event.target.value;
                      setPartyId(id);
                      setParty(parties.find((item) => item.id === id)?.name ?? party);
                    }}
                    options={partyOptions}
                  />
                </label>
              ) : source.source !== 'transfer' && (
                <label className="text-[13px] font-medium text-ink sm:col-span-2">
                  {text('Party / Person','পক্ষ / ব্যক্তি')}
                  <Input className="mt-1.5" value={party} onChange={(event) => setParty(event.target.value)} />
                </label>
              )}

              {source.quantity !== undefined && (
                <label className="text-[13px] font-medium text-ink">
                  {text('Quantity','পরিমাণ')}
                  <Input className="mt-1.5 text-right" inputMode="decimal" value={quantity} onChange={(event) => setQuantity(event.target.value.replace(/[^\d.]/g, ''))} />
                  {validation.fieldErrors.quantity && <span className="mt-1 block font-bn text-[10.5px] text-danger">ইতিমধ্যে {source.returnedQuantity}টি ফেরত হয়েছে; এর নিচে Quantity করা যাবে না</span>}
                </label>
              )}

              {source.source === 'expense' && (
                <label className="text-[13px] font-medium text-ink">
                  {text('Expense category','খরচের ধরন')}
                  <FormSelect
                    className="mt-1.5"
                    value={accountingAccounts.find((item) => item.id === expenseAccountId)?.name ?? expenseAccounts[0]?.name ?? ''}
                    onChange={(event) => {
                      const next = expenseAccounts.find((item) => item.name === event.target.value);
                      if (next) setExpenseAccountId(next.id);
                    }}
                    options={expenseAccounts.map((item) => item.name)}
                  />
                </label>
              )}

              {source.source === 'transfer' && <>
                <label className="text-[13px] font-medium text-ink">
                  {text('From account','যে হিসাব থেকে')}
                  <FormSelect className="mt-1.5" value={fromAccount} onChange={(event) => setFromAccount(event.target.value)} options={moneyAccountNames} />
                </label>
                <label className="text-[13px] font-medium text-ink">
                  {text('To account','যে হিসাবে')}
                  <FormSelect className="mt-1.5" value={toAccount} onChange={(event) => setToAccount(event.target.value)} options={moneyAccountNames} />
                  {fromAccount === toAccount && <span className="mt-1 block font-bn text-[10.5px] text-danger">From এবং To account আলাদা হতে হবে</span>}
                </label>
              </>}

              <label className="text-[13px] font-medium text-ink sm:col-span-2">
                {text('Description','বিবরণ')}
                <Input className="mt-1.5" value={description} onChange={(event) => setDescription(event.target.value)} />
              </label>
              <label className="text-[13px] font-medium text-ink sm:col-span-2">
                {text('Internal note','ভেতরের মন্তব্য')}
                <Input className="mt-1.5" value={note} onChange={(event) => setNote(event.target.value)} placeholder={text("Optional audit note","মন্তব্য (ঐচ্ছিক)")} />
              </label>
            </div>

            {(source.paymentAccounts?.length || source.paid > 0) && source.source !== 'transfer' && (
              <div className="rounded-xl border border-border">
                <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
                  <div>
                    <p className="text-[12.5px] font-semibold text-ink">{text('Payment split','একাধিক মাধ্যমে পেমেন্ট')}</p>
                    <p className="font-bn text-[10.5px] text-ink-400">কোন অ্যাকাউন্ট থেকে কত টাকা গেছে বা এসেছে</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setPayments((current) => [...current, { account: moneyAccountNames[0] ?? '', amount: '' }])}><Plus className="size-3.5" /> {text('Add','যোগ করুন')}</Button>
                </div>
                <div className="space-y-2 p-3">
                  {payments.map((payment, index) => (
                    <div key={index} className="grid grid-cols-[1fr_130px_32px] gap-2">
                      <FormSelect value={payment.account} onChange={(event) => setPayments((current) => current.map((item, i) => i === index ? { ...item, account: event.target.value } : item))} options={moneyAccountNames} />
                      <Input className="text-right" inputMode="decimal" value={payment.amount} onChange={(event) => setPayments((current) => current.map((item, i) => i === index ? { ...item, amount: event.target.value.replace(/[^\d.]/g, '') } : item))} placeholder="0" />
                      <button type="button" onClick={() => setPayments((current) => current.filter((_, i) => i !== index))} className="flex size-9 items-center justify-center rounded-md text-ink-400 hover:bg-danger/5 hover:text-danger" aria-label={text("Remove payment","পেমেন্ট সরান")}><Trash2 className="size-3.5" /></button>
                    </div>
                  ))}
                  <div className="flex justify-between border-t border-border pt-2 text-[11px] text-ink-500">
                    <span>{text('Split total','পেমেন্টের মোট')}</span>
                    <span className="font-medium text-ink">৳{payments.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0).toLocaleString()}</span>
                  </div>
                  {validation.fieldErrors.paymentAccounts && <p className="font-bn text-[10.5px] text-danger">পেমেন্টের মোট টাকা Paid amount-এর সাথে মিলতে হবে</p>}
                </div>
              </div>
            )}

            <label className="block text-[13px] font-medium text-ink">
              {text('Reason for change','সংশোধনের কারণ')} {showHelper&&<span className="font-bn text-[11px] font-normal text-ink-400">· কেন পরিবর্তন করছেন</span>}
              <Input className="mt-1.5" value={reason} onChange={(event) => setReason(event.target.value)} placeholder={text("e.g. Wrong date and payment account entered","যেমন: ভুল তারিখ বা পেমেন্টের হিসাব লেখা হয়েছে")} />
              {validation.fieldErrors._reason && <span className="mt-1 block font-bn text-[10.5px] text-danger">আর্থিক পরিবর্তনের কারণ লিখুন</span>}
            </label>
          </div>
        )}

        {review && <ImpactPreview preview={preview} />}

        <DialogFooter>
          {review ? (
            <>
              <Button variant="outline" onClick={() => setReview(false)}>{text('Back','ফিরুন')}</Button>
              <Button onClick={save}>{text('Save changes','সংশোধন সংরক্ষণ')}</Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={onClose}>{text('Cancel','বাতিল')}</Button>
              <Button onClick={startReview}>{text('Review changes','সংশোধন যাচাই')}</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

