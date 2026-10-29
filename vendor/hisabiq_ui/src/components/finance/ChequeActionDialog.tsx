import React, { useEffect, useState } from 'react';
import { Paperclip, Pencil, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../Button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../Dialog';
import { Input } from '../Input';
import { FormSelect } from '../FormSelect';
import { financeAccountOptionLabel, type FinanceAccount } from '../../data/financeAccounts';
import { resolveChequeAccount } from '../../utils/chequeAccount';
import { StatusBadge } from '../StatusBadge';
import type { ChequeRecord, ChequeStatus } from '../../data/cheques';
import { chequeLifecycleActions, type ChequeLifecycleAction } from '../../utils/moduleUiActions';
import { taka } from '../../utils/currency';
import {useUiCopy} from '../../i18n/useUiCopy';
import {financeLabel} from '../../i18n/financeCopy';
import {printReport} from '../../utils/reportOutput';

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  const {text}=useUiCopy();
  const names:Record<string,string>={'Direction':'চেকের ধরন','Amount':'টাকা','Bank':'ব্যাংক','Party':'পক্ষ','Received / issued':'পাওয়া / দেওয়ার তারিখ','Cheque date':'চেকের তারিখ','Money account':'টাকার হিসাব','Reference':'রেফারেন্স','Attachment filename (not uploaded)':'ফাইলের নাম (আপলোড হয়নি)'};
  return <div className="rounded-lg bg-ink-50 px-3 py-2.5"><p className="text-[10.5px] text-ink-400">{text(label,names[label]??label)}</p><div className="mt-0.5 text-[12.5px] font-medium text-ink">{children}</div></div>;
}

export function ChequeActionDialog({
  cheque, accounts,
  onClose,
  onUpdate,
  onStatus
}: {
  cheque: ChequeRecord | null;
  accounts: FinanceAccount[];
  onClose: () => void;
  onUpdate: (cheque: ChequeRecord) => void;
  onStatus: (cheque: ChequeRecord, nextStatus: ChequeStatus, reason?: string) => boolean;
}) {
  const {text,language,showHelper}=useUiCopy();
  const [editing, setEditing] = useState(false);
  const [pendingAction, setPendingAction] = useState<ChequeLifecycleAction | null>(null);
  const [reason, setReason] = useState('');
  const [bank, setBank] = useState('');
  const [branch, setBranch] = useState('');
  const [party, setParty] = useState('');
  const [chequeDate, setChequeDate] = useState('');
  const [depositAccountId, setDepositAccountId] = useState('');
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');

  const resetDraft = () => {
    if (!cheque) return;
    setBank(cheque.bank);
    setBranch(cheque.branch ?? '');
    setParty(cheque.party);
    setChequeDate(cheque.chequeDate);
    setDepositAccountId(cheque.depositAccountId ?? resolveChequeAccount(accounts, cheque)?.id ?? '');
    setReference(cheque.reference ?? '');
    setNote(cheque.note ?? '');
  };
  useEffect(() => {
    setEditing(false); setPendingAction(null); setReason(''); resetDraft();
  }, [cheque]);

  if (!cheque) return null;
  const existingAccountId = cheque.depositAccountId ?? resolveChequeAccount(accounts, cheque)?.id;
  const actions = chequeLifecycleActions({ direction: cheque.direction, status: cheque.status });
  const terminal = actions.length === 0;

  const save = () => {
    if (!bank.trim() || !party.trim() || !chequeDate) return toast.error(text('Bank, party and cheque date are required','ব্যাংক, পক্ষ ও চেকের তারিখ লিখুন'));
    const selectedAccount = accounts.find(account => account.id === depositAccountId);
    const preservesInactive = selectedAccount && selectedAccount.id === existingAccountId && selectedAccount.status !== 'Active';
    if (selectedAccount && (selectedAccount.type !== 'Bank' || (selectedAccount.status !== 'Active' && !preservesInactive))) return toast.error(text('Choose a valid active bank account','চালু ব্যাংক হিসাব বাছুন'));
    if (cheque.depositAccount && !selectedAccount && !cheque.depositAccountId && !resolveChequeAccount(accounts, cheque)) return toast.error(text('Choose a bank account for this cheque','এই চেকের ব্যাংক হিসাব বাছুন'));
    onUpdate({
      ...cheque,
      bank: bank.trim(),
      branch: branch.trim() || undefined,
      party: party.trim(),
      chequeDate,
      depositAccount: selectedAccount?.name,
      depositAccountId: selectedAccount?.id,
      reference: reference.trim() || undefined,
      note: note.trim() || undefined
    });
    setEditing(false);
  };

  const printCheque = () => {
    if(!cheque)return;
    const headers=[text('Field','বিবরণ'),text('Value','তথ্য')];
    const rows: Array<[string,string|number]>=[
      [text('Cheque number','চেক নম্বর'),cheque.chequeNumber],
      [text('Direction','চেকের ধরন'),financeLabel(language,cheque.direction)],
      [text('Status','অবস্থা'),financeLabel(language,cheque.status)],
      [text('Bank','ব্যাংক'),cheque.bank],
      [text('Party','পক্ষ'),cheque.party],
      [text('Amount','টাকা'),taka(cheque.amount)],
      [text('Cheque date','চেকের তারিখ'),cheque.chequeDate],
      [text('Money account','টাকার হিসাব'),cheque.depositAccount??'—'],
      [text('Reference','রেফারেন্স'),cheque.reference??'—']
    ];
    if (cheque.attachment) rows.push([text('Attachment filename (not uploaded)','ফাইলের নাম (আপলোড হয়নি)'),cheque.attachment]);
    if(!printReport({title:text('Cheque','চেক')+' #'+cheque.chequeNumber,language,subtitle:text('Cheque status preview — not a bank confirmation.','চেকের নমুনা অবস্থা — ব্যাংকের নিশ্চিতকরণ নয়।'),headers,rows}))toast.error(text('Allow the print popup and try again.','প্রিন্টের উইন্ডো খুলে আবার চেষ্টা করুন।'));
  };
  const confirmStatus = () => {
    if (!pendingAction) return;
    if (pendingAction.reasonRequired && !reason.trim()) return toast.error(text('Enter a reason for this cheque status','চেকের অবস্থা বদলানোর কারণ লিখুন'));
    if (!onStatus(cheque, pendingAction.nextStatus, reason.trim() || undefined)) return;
    setPendingAction(null);
    setReason('');
  };
  const currentAccount = resolveChequeAccount(accounts, cheque);
  const selectableAccounts = accounts.filter(account => account.type === 'Bank' && (account.status === 'Active' || account.id === existingAccountId));

  return (
    <Dialog open={!!cheque} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{text('Cheque','চেক')} #{cheque.chequeNumber} <StatusBadge tone={cheque.status === 'Cleared' ? 'success' : ['Bounced', 'Returned', 'Stopped', 'Cancelled'].includes(cheque.status) ? 'danger' : 'neutral'} dot>{financeLabel(language,cheque.status)}</StatusBadge></DialogTitle>
        </DialogHeader>

        {editing ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-[13px] font-medium text-ink">{text('Bank','ব্যাংক')}<Input className="mt-1.5" value={bank} onChange={(event) => setBank(event.target.value)} /></label>
            <label className="text-[13px] font-medium text-ink">{text('Branch','শাখা')}<Input className="mt-1.5" value={branch} onChange={(event) => setBranch(event.target.value)} /></label>
            <label className="text-[13px] font-medium text-ink">{text('Party','পক্ষ')}<Input className="mt-1.5" value={party} onChange={(event) => setParty(event.target.value)} /></label>
            <label className="text-[13px] font-medium text-ink">{text('Cheque date','চেকের তারিখ')}<Input className="mt-1.5" type="date" value={chequeDate} onChange={(event) => setChequeDate(event.target.value)} /></label>
            <label className="text-[13px] font-medium text-ink">{text('Money account','টাকার হিসাব')}<FormSelect className="mt-1.5" value={depositAccountId} onChange={(event) => setDepositAccountId(event.target.value)} options={[{value:'',label:text('Select bank account','ব্যাংক হিসাব বাছুন')}, ...selectableAccounts.map(account => ({value:account.id,label:financeAccountOptionLabel(account,accounts)+(account.status === 'Inactive' ? ' · '+text('Inactive','বন্ধ') : '')}))]} /></label>
            <label className="text-[13px] font-medium text-ink">{text('Reference','রেফারেন্স')}<Input className="mt-1.5" value={reference} onChange={(event) => setReference(event.target.value)} /></label>
            <label className="text-[13px] font-medium text-ink sm:col-span-2">{text('Note','মন্তব্য')}<Input className="mt-1.5" value={note} onChange={(event) => setNote(event.target.value)} /></label>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <Detail label="Direction">{financeLabel(language,cheque.direction)}</Detail>
              <Detail label="Amount">{taka(cheque.amount)}</Detail>
              <Detail label="Bank">{cheque.bank}{cheque.branch ? ' · ' + cheque.branch : ''}</Detail>
              <Detail label="Party">{cheque.party}</Detail>
              <Detail label="Received / issued">{cheque.receivedOrIssuedDate}</Detail>
              <Detail label="Cheque date">{cheque.chequeDate}</Detail>
              <Detail label="Money account">{currentAccount?.name || cheque.depositAccount || '—'}</Detail>
              <Detail label="Reference">{cheque.reference || '—'}</Detail>
            </div>

            {(cheque.attachment || cheque.note) && <div className="grid gap-2 sm:grid-cols-2">
              {cheque.attachment && <div className="rounded-lg border border-border px-3 py-2.5"><p className="text-[10.5px] text-ink-400">{text('Attachment filename (not uploaded)','ফাইলের নাম (আপলোড হয়নি)')}</p><p className="mt-1 flex items-center gap-1.5 text-[12px] font-medium text-ink"><Paperclip className="size-3.5" /> {cheque.attachment}</p></div>}
              {cheque.note && <div className="rounded-lg border border-border px-3 py-2.5"><p className="text-[10.5px] text-ink-400">{text('Note','মন্তব্য')}</p><p className="mt-1 text-[12px] text-ink-700">{cheque.note}</p></div>}
            </div>}

            {cheque.statusUpdatedBy && <div className="rounded-lg bg-ink-50 px-3 py-2 text-[10.5px] text-ink-500">{text('Last status changed by','শেষ অবস্থা বদলেছেন')} {cheque.statusUpdatedBy} · {cheque.statusUpdatedAt?.replace('T', ' ').slice(0, 16)}{cheque.statusReason ? ' · ' + cheque.statusReason : ''}</div>}

            {!terminal && !pendingAction && <div className="rounded-xl border border-border p-3">
              <p className="text-[12.5px] font-semibold text-ink">{text('Next cheque action','চেকের পরের কাজ')}</p>
              {showHelper&&<p className="mt-0.5 font-bn text-[10.5px] text-ink-400">চেক ক্লিয়ার না হওয়া পর্যন্ত ব্যাংক জের বদলাবে না</p>}
              <div className="mt-2 flex flex-wrap gap-2">
                {actions.map((item) => <Button key={item.id} variant="outline" size="sm" onClick={() => setPendingAction(item)}>{financeLabel(language,item.label)}</Button>)}
              </div>
            </div>}

            {pendingAction && <div className="rounded-xl border border-warning/20 bg-warning/5 p-3">
              <p className="text-[12.5px] font-semibold text-ink">{financeLabel(language,pendingAction.label)}?</p>
              <p className="mt-0.5 text-[11px] text-ink-500">{text('Status will become','নতুন অবস্থা হবে')} <strong>{financeLabel(language,pendingAction.nextStatus)}</strong>{pendingAction.nextStatus === 'Cleared' ? text('. Money account balance will update now.','। এখন ব্যাংকের জের বদলাবে।') : text('.','।')}</p>
              {pendingAction.reasonRequired && <label className="mt-3 block text-[12px] font-medium text-ink">{text('Reason','কারণ')} {showHelper&&<span className="font-bn font-normal text-ink-400">· কারণ</span>}<Input className="mt-1.5" value={reason} onChange={(event) => setReason(event.target.value)} placeholder={text("Why is this status changing?","কেন অবস্থা বদলাচ্ছেন?")} /></label>}
            </div>}
          </div>
        )}

        <DialogFooter>
          {editing ? <><Button variant="outline" onClick={() => {resetDraft(); setEditing(false);}}>{text('Cancel','বাতিল')}</Button><Button onClick={save}>{text('Save cheque','চেক সংরক্ষণ')}</Button></> :
            pendingAction ? <><Button variant="outline" onClick={() => { setPendingAction(null); setReason(''); }}>{text('Back','ফিরুন')}</Button><Button onClick={confirmStatus}>{text('Confirm ','নিশ্চিত করুন: ')+financeLabel(language,pendingAction.nextStatus)}</Button></> :
            <><Button variant="outline" onClick={printCheque}><Printer className="size-4" /> {text('Print','প্রিন্ট')}</Button>{!terminal && <Button variant="outline" onClick={() => setEditing(true)}><Pencil className="size-4" /> {text('Edit','সংশোধন')}</Button>}<Button onClick={onClose}>{text('Close','বন্ধ করুন')}</Button></>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

