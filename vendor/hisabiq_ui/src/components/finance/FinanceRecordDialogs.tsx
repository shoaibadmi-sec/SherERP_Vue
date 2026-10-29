import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeftRight, BookOpen, Pencil, Plus, Power, Printer, RefreshCw, RotateCcw, Save, UserRoundCog } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../Button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../Dialog';
import { FormSelect } from '../FormSelect';
import { Input } from '../Input';
import { StatusBadge } from '../StatusBadge';
import {
  financeAccountOptionLabel,
  financePersonOptionLabel,
  type AccountTransfer,
  type FinanceAccount,
  type FinanceAccountType,
  type FinancePerson,
  type FinancePersonRole,
  type FinanceTransaction,
  type FinanceTransactionType
} from '../../data/financeAccounts';
import { taka } from '../../utils/currency';
import { FinancePaymentSplitEditor, type FinancePaymentDraft } from './FinancePaymentSplitEditor';
import { normalizeFinancePaymentSplits, financePaymentSplitsAreValid } from '../../utils/financePaymentDrafts';
import {useUiCopy} from '../../i18n/useUiCopy';
import {financeLabel} from '../../i18n/financeCopy';
import {printReport} from '../../utils/reportOutput';
import { transferAccountId, transferAccountLabel } from '../../utils/accountTransferIdentity';

const typeMeta: Record<FinanceTransactionType, {
  role?: FinancePersonRole;
  relationship?: FinanceTransaction['relationship'];
  direction: FinanceTransaction['direction'];
  opening?: boolean;
}> = {
  'Owner Credit': { role: 'Owner', relationship: 'Owner Balance', direction: 'in' },
  'Owner Debit': { role: 'Owner', relationship: 'Owner Balance', direction: 'out' },
  'Lender Credit': { role: 'Lender', relationship: 'Lender Balance', direction: 'in' },
  'Lender Debit': { role: 'Lender', relationship: 'Lender Balance', direction: 'out' },
  'Borrower Debit': { role: 'Borrower', relationship: 'Borrower Balance', direction: 'out' },
  'Borrower Credit': { role: 'Borrower', relationship: 'Borrower Balance', direction: 'in' },
  'Opening Owner Capital': { role: 'Owner', relationship: 'Owner Balance', direction: 'none', opening: true },
  'Opening Loan': { role: 'Lender', relationship: 'Lender Balance', direction: 'none', opening: true },
  'Opening Borrower Loan': { role: 'Borrower', relationship: 'Borrower Balance', direction: 'none', opening: true },
  'Manual Bank Entry': { direction: 'in' },
  Transfer: { direction: 'none' }
};

const financeTypeOptions: FinanceTransactionType[] = [
  'Lender Credit', 'Lender Debit', 'Borrower Debit', 'Borrower Credit',
  'Owner Credit', 'Owner Debit', 'Opening Owner Capital', 'Opening Loan', 'Opening Borrower Loan'
];

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  const {text}=useUiCopy();
  const bn:Record<string,string>={'Relationship':'হিসাবের সম্পর্ক','Party':'পক্ষ','Amount':'টাকা','Payment method':'টাকার মাধ্যম','Account':'হিসাব','Status':'অবস্থা','Reference':'রেফারেন্স','Notes':'মন্তব্য','Created by':'যিনি লিখেছেন','Current balance':'বর্তমান জের','Opening balance':'শুরুর জের',From:'যে হিসাব থেকে',To:'যে হিসাবে'};
  return (
    <div className="rounded-lg border border-border bg-ink-50/40 px-3 py-2.5">
      <p className="text-[10.5px] uppercase tracking-wide text-ink-400">{text(label,bn[label]??label)}</p>
      <div className="mt-0.5 text-[13px] font-medium text-ink">{children || '—'}</div>
    </div>
  );
}

export function FinanceTransactionActionDialog({
  transaction, accounts, people, onClose, onUpdate, onReverse
}: {
  transaction: FinanceTransaction | null;
  accounts: FinanceAccount[];
  people: FinancePerson[];
  onClose: () => void;
  onUpdate: (transaction: FinanceTransaction) => void;
  onReverse: (transaction: FinanceTransaction) => void;
}) {
  const {text,language}=useUiCopy();
  const [editing, setEditing] = useState(false);
  const [confirmReverse, setConfirmReverse] = useState(false);
  const [type, setType] = useState<FinanceTransactionType>('Lender Credit');
  const [partyId, setPartyId] = useState('');
  const [paymentRows, setPaymentRows] = useState<FinancePaymentDraft[]>([]);
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!transaction) return;
    setEditing(false);
    setConfirmReverse(false);
    setType(transaction.type);
    setPartyId(transaction.partyId || '');
    const splits = transaction.paymentAccounts?.length
      ? transaction.paymentAccounts
      : transaction.accountId
        ? [{ method: transaction.method || 'Cash', account: transaction.account || '', accountId: transaction.accountId, amount: transaction.amount }]
        : [];
    setPaymentRows(splits.map((split, index) => ({ id: 'edit-payment-' + index, method: split.method, accountId: split.accountId, amount: String(split.amount) })));
    setAmount(String(transaction.amount));
    setReference(transaction.reference || '');
    setNote(transaction.note || '');
  }, [transaction]);

  if (!transaction) return null;

  const meta = typeMeta[type];
  const opening = !!meta.opening;
  const peopleOptions = people.filter((person) =>
    (person.id === transaction.partyId && type === transaction.type) ||
    (person.status === 'Active' && (!meta.role || person.roles.includes(meta.role))));
  const selectedPerson = partyId ? peopleOptions.find((person) => person.id === partyId) : peopleOptions[0];
  const accountLabel = (accountId?: string, savedName?: string) => {
    const account = accounts.find((item) => item.id === accountId);
    return account ? financeAccountOptionLabel(account, accounts) : savedName;
  };
  const paymentSplits = normalizeFinancePaymentSplits(paymentRows, accounts, Number(amount) || 0);

  const save = () => {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) return toast.error(text('Enter a valid amount','সঠিক টাকার পরিমাণ লিখুন'));
    if (meta.role && !selectedPerson) return toast.error(text('Select a finance person','হিসাবের ব্যক্তি বাছুন'));
    if (!opening && !financePaymentSplitsAreValid(paymentRows, accounts, value)) return toast.error(text('Enter valid payment sources that add up to the transaction amount','সব মাধ্যমের সঠিক টাকা লিখুন। যোগফল লেনদেনের টাকার সমান হতে হবে।'));
    const firstPayment = paymentSplits[0];
    onUpdate({
      ...transaction,
      type,
      relationship: meta.relationship,
      party: selectedPerson?.name,
      partyId: selectedPerson?.id,
      method: opening ? undefined : firstPayment?.method,
      account: opening ? undefined : firstPayment?.account,
      accountId: opening ? undefined : firstPayment?.accountId,
      paymentAccounts: opening ? undefined : paymentSplits,
      amount: value,
      direction: meta.direction,
      reference: reference.trim() || undefined,
      note: note.trim() || undefined
    });
    setEditing(false);
  };

  const printTransaction=()=>{
    const rows:[string,string|number][]=[
      [text('Type','ধরন'),financeLabel(language,transaction.type)],
      [text('Date','তারিখ'),transaction.date],
      [text('Party','পক্ষ'),transaction.party??'—'],
      [text('Amount','টাকা'),taka(transaction.amount)],
      [text('Status','অবস্থা'),financeLabel(language,transaction.status)],
      [text('Reference','রেফারেন্স'),transaction.reference??'—'],
      [text('Notes','মন্তব্য'),transaction.note??'—']
    ];
    if(!printReport({title:transaction.id,language,subtitle:text('Finance transaction preview — verify source records.','টাকার লেনদেনের নমুনা — মূল তথ্য যাচাই করুন।'),headers:[text('Field','বিবরণ'),text('Value','তথ্য')],rows}))toast.error(text('Allow the print popup and try again.','প্রিন্ট উইন্ডো খুলে আবার চেষ্টা করুন।'));
  };
  return (
    <Dialog open={!!transaction} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? text('Edit finance transaction','টাকার লেনদেন সংশোধন') : financeLabel(language,transaction.type)}</DialogTitle>
          <DialogDescription>{transaction.id} · {transaction.date} · {text('created by','লিখেছেন')} {transaction.createdBy}</DialogDescription>
        </DialogHeader>

        {editing ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-[13px] font-medium text-ink sm:col-span-2">
              {text('Transaction type','লেনদেনের ধরন')}
              <FormSelect className="mt-1.5" value={type} options={financeTypeOptions.map(value=>({value,label:financeLabel(language,value)}))} onChange={(event) => {
                const next = event.target.value as FinanceTransactionType;
                setType(next);
                const nextMeta = typeMeta[next];
                setPartyId(people.find((person) => person.status === 'Active' && (!nextMeta.role || person.roles.includes(nextMeta.role)))?.id || '');
              }} />
            </label>

            <label className="text-[13px] font-medium text-ink">
              {text('Finance person','হিসাবের ব্যক্তি')}
              <FormSelect className="mt-1.5" value={selectedPerson?.id || ''} options={peopleOptions.map(person=>({value:person.id,label:financePersonOptionLabel(person,peopleOptions) + (person.status === 'Inactive' ? ' · ' + financeLabel(language,person.status) : '')}))} onChange={(event) => setPartyId(event.target.value)} />
              <span className="mt-1 block text-[11px] font-normal text-ink-400">{selectedPerson?.name || text('No eligible person','উপযুক্ত ব্যক্তি নেই')}</span>
            </label>

            <label className="text-[13px] font-medium text-ink">
              {text('Amount','টাকা')}
              <div className="relative mt-1.5">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-400">৳</span>
                <Input className="pl-7 text-right" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value.replace(/[^\d.]/g, ''))} />
              </div>
            </label>

            {!opening && <FinancePaymentSplitEditor accounts={accounts} rows={paymentRows} onChange={setPaymentRows} totalAmount={Number(amount) || 0} preserveInactiveSelected />}

            <label className="text-[13px] font-medium text-ink">
              {text('Reference','রেফারেন্স')}
              <Input className="mt-1.5" value={reference} onChange={(event) => setReference(event.target.value)} placeholder="Optional" />
            </label>
            <label className="text-[13px] font-medium text-ink">
              {text('Note','মন্তব্য')}
              <Input className="mt-1.5" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Optional" />
            </label>
          </div>
        ) : (
          <>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <Detail label="Relationship">{transaction.relationship}</Detail>
              <Detail label="Party">{transaction.party}</Detail>
              <Detail label="Amount">{(transaction.direction === 'in' ? '+' : transaction.direction === 'out' ? '−' : '') + taka(transaction.amount)}</Detail>
              <Detail label="Payment method">{transaction.paymentAccounts && transaction.paymentAccounts.length > 1 ? text('Multiple','একাধিক') : transaction.method ? financeLabel(language,transaction.method) : text('No money movement','টাকা সরবে না')}</Detail>
              <Detail label="Account">{transaction.paymentAccounts && transaction.paymentAccounts.length > 1 ? transaction.paymentAccounts.map((split) => accountLabel(split.accountId, split.account)).join(' + ') : accountLabel(transaction.accountId, transaction.account)}</Detail>
              <Detail label="Status"><StatusBadge tone={transaction.status === 'Active' ? 'success' : 'neutral'} dot>{financeLabel(language,transaction.status)}</StatusBadge></Detail>
              <Detail label="Reference">{transaction.reference}</Detail>
              <Detail label="Notes">{transaction.note}</Detail>
              <Detail label="Created by">{transaction.createdBy}</Detail>
            </div>
            {!!transaction.paymentAccounts?.length && transaction.paymentAccounts.length > 1 && (
              <div className="rounded-xl border border-border">
                <div className="border-b border-border px-3 py-2.5"><p className="text-[12.5px] font-semibold text-ink">{text('Payment split','একাধিক মাধ্যমে টাকা')}</p></div>
                <div className="divide-y divide-border">{transaction.paymentAccounts.map((split, index) => <div key={index} className="flex items-center justify-between px-3 py-2 text-[12px]"><span className="text-ink-600">{financeLabel(language,split.method)} · {accountLabel(split.accountId,split.account)}</span><span className="font-medium text-ink">{taka(split.amount)}</span></div>)}</div>
              </div>
            )}
            {confirmReverse && (
              <div className="rounded-lg border border-danger/20 bg-danger/5 px-3 py-2.5">
                <p className="text-[13px] font-medium text-danger">{text('Reverse this transaction?','এই লেনদেন উল্টো করবেন?')}</p>
                <p className="mt-0.5 text-[11px] text-ink-500">{text('The audit record remains visible and the related money movement is restored.','পরিবর্তনের ইতিহাস থাকবে; সংশ্লিষ্ট টাকার আসা-যাওয়া আগের অবস্থায় ফিরবে।')}</p>
              </div>
            )}
          </>
        )}

        <DialogFooter>
          {editing ? <>
            <Button variant="outline" onClick={() => setEditing(false)}>{text('Cancel','বাতিল')}</Button>
            <Button onClick={save}><Save className="size-4" /> {text('Save changes','সংশোধন সংরক্ষণ')}</Button>
          </> : confirmReverse ? <>
            <Button variant="outline" onClick={() => setConfirmReverse(false)}>{text('Keep transaction','লেনদেন রাখুন')}</Button>
            <Button onClick={() => { onReverse(transaction); setConfirmReverse(false); }}><RotateCcw className="size-4" /> {text('Confirm reverse','উল্টো করা নিশ্চিত করুন')}</Button>
          </> : <>
            <Button variant="outline" onClick={printTransaction}><Printer className="size-4" /> {text('Print','প্রিন্ট')}</Button>
            {transaction.status === 'Active' && <>
              <Button variant="outline" onClick={() => setEditing(true)}><Pencil className="size-4" /> {text('Edit','সংশোধন')}</Button>
              <Button variant="outline" onClick={() => setConfirmReverse(true)}><RotateCcw className="size-4" /> {text('Reverse','উল্টো করুন')}</Button>
            </>}
            <Button onClick={onClose}>{text('Close','বন্ধ করুন')}</Button>
          </>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function FinanceAccountActionDialog({
  account, accounts, transactions, transfers, onClose, onUpdate, onToggleStatus, onManualEntry, onTransfer, onReconcile
}: {
  account: FinanceAccount | null;
  accounts: FinanceAccount[];
  transactions: FinanceTransaction[];
  transfers: AccountTransfer[];
  onClose: () => void;
  onUpdate: (account: FinanceAccount) => void;
  onToggleStatus: (account: FinanceAccount) => void;
  onManualEntry: (account: FinanceAccount, direction: 'in' | 'out', amount: number, reference?: string, note?: string) => void;
  onTransfer: (account: FinanceAccount) => void;
  onReconcile: (account: FinanceAccount) => void;
}) {
  const {text,language,showHelper}=useUiCopy();
  const [mode, setMode] = useState<'ledger' | 'edit' | 'manual'>('ledger');
  const [confirmStatus, setConfirmStatus] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<FinanceAccountType>('Bank');
  const [institution, setInstitution] = useState('');
  const [number, setNumber] = useState('');
  const [manualDirection, setManualDirection] = useState<'in' | 'out'>('in');
  const [manualAmount, setManualAmount] = useState('');
  const [manualReference, setManualReference] = useState('');
  const [manualNote, setManualNote] = useState('');

  useEffect(() => {
    if (!account) return;
    setMode('ledger');
    setConfirmStatus(false);
    setName(account.name);
    setType(account.type);
    setInstitution(account.institution || '');
    setNumber(account.number || '');
    setManualDirection('in');
    setManualAmount('');
    setManualReference('');
    setManualNote('');
  }, [account]);

  const ledgerRows = useMemo(() => {
    if (!account) return [];
    const rows = transactions
      .filter((item) => {
        const uniqueName = accounts.filter((itemAccount) => itemAccount.name === account.name).length === 1;
        return item.accountId === account.id
          || item.paymentAccounts?.some((split) => split.accountId === account.id)
          || (uniqueName && !item.accountId && item.account === account.name)
          || (uniqueName && item.paymentAccounts?.some((split) => !split.accountId && split.account === account.name));
      })
      .map((item) => {
        const splitAmount = item.paymentAccounts?.filter((split) => split.accountId === account.id).reduce((sum, split) => sum + split.amount, 0);
        return { id: item.id, date: item.date, label: item.type, amount: splitAmount || item.amount, direction: item.direction, reference: item.reference || '' };
      });
    const transferRows = transfers.filter((item) => transferAccountId(item, 'from', accounts) === account.id || transferAccountId(item, 'to', accounts) === account.id).map((item) => {
      const isFrom = transferAccountId(item, 'from', accounts) === account.id;
      return {
        id: item.id,
        date: item.date,
        label: isFrom ? 'Transfer to ' + transferAccountLabel(item, 'to', accounts) : 'Transfer from ' + transferAccountLabel(item, 'from', accounts),
        amount: item.amount,
        direction: isFrom ? 'out' as const : 'in' as const,
        reference: item.reference || ''
      };
    });
    return [...rows, ...transferRows].slice(0, 8);
  }, [account, accounts, transactions, transfers]);

  if (!account) return null;

  const saveEdit = () => {
    if (!name.trim()) return toast.error(text('Account name is required','হিসাবের নাম লিখুন'));
    onUpdate({ ...account, name: name.trim(), type, institution: institution.trim() || undefined, number: number.trim() || undefined });
    setMode('ledger');
  };

  const saveManual = () => {
    const value = Number(manualAmount);
    if (!Number.isFinite(value) || value <= 0) return toast.error(text('Enter a valid amount','সঠিক টাকার পরিমাণ লিখুন'));
    onManualEntry(account, manualDirection, value, manualReference.trim() || undefined, manualNote.trim() || undefined);
    setManualAmount('');
    setManualReference('');
    setManualNote('');
    setMode('ledger');
  };

  const printAccount=()=>{
    const headers=[text('Date','তারিখ'),text('Reference','রেফারেন্স'),text('Transaction','লেনদেন'),text('Direction','টাকা আসা/যাওয়া'),text('Amount','টাকা')];
    const rows=ledgerRows.map(row=>[row.date,row.reference||row.id,row.label,text(row.direction,row.direction==='in'?'টাকা এসেছে':row.direction==='out'?'টাকা গেছে':'শুরুর জের'),row.amount]);
    if(!printReport({title:account.name,language,subtitle:text('Recent account entries — preview only.','সাম্প্রতিক হিসাবের নমুনা লেনদেন।'),headers,rows}))toast.error(text('Allow the print popup and try again.','প্রিন্ট উইন্ডো খুলে আবার চেষ্টা করুন।'));
  };
  return (
    <Dialog open={!!account} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{account.name}</DialogTitle>
          <DialogDescription>{financeLabel(language,account.type)}{account.number ? ' · ' + account.number : ''} · {text('current balance','বর্তমান জের')} {taka(account.balance)}</DialogDescription>
        </DialogHeader>

        {mode === 'ledger' && <>
          <div className="grid gap-2 sm:grid-cols-3">
            <Detail label="Current balance">{taka(account.balance)}</Detail>
            <Detail label="Opening balance">{taka(account.openingBalance)}</Detail>
            <Detail label="Status"><StatusBadge tone={account.status === 'Active' ? 'success' : 'neutral'} dot>{financeLabel(language,account.status)}</StatusBadge></Detail>
          </div>
          <div className="overflow-hidden rounded-xl border border-border">
            <div className="flex items-center justify-between border-b border-border bg-ink-50/50 px-3 py-2.5">
              <div>
                <p className="text-[13px] font-medium text-ink">{text('Recent ledger','সাম্প্রতিক হিসাব')}</p>
                <p className="text-[10.5px] text-ink-400">{text('Finance entries and account transfers linked here.','এই হিসাবের টাকার লেনদেন ও ট্রান্সফার।')}</p>
              </div>
              <BookOpen className="size-4 text-helper" />
            </div>
            <div className="divide-y divide-border">
              {ledgerRows.length ? ledgerRows.map((row) => (
                <div key={row.id} className="flex items-center gap-3 px-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-medium text-ink">{financeLabel(language,row.label)}</p>
                    <p className="text-[10.5px] text-ink-400">{row.date} · {row.id}{row.reference ? ' · ' + row.reference : ''}</p>
                  </div>
                  <p className={'text-[12.5px] font-semibold ' + (row.direction === 'in' ? 'text-success' : row.direction === 'out' ? 'text-ink' : 'text-info')}>
                    {(row.direction === 'in' ? '+' : row.direction === 'out' ? '−' : '') + taka(row.amount)}
                  </p>
                </div>
              )) : <p className="px-3 py-8 text-center text-sm text-ink-400">{text('No ledger entries yet.','এখনো কোনো হিসাব নেই।')}</p>}
            </div>
          </div>
          {confirmStatus && (
            <div className="rounded-lg border border-warning/20 bg-warning/5 px-3 py-2.5">
              <p className="text-[13px] font-medium text-ink">{account.status === 'Active' ? text('Deactivate this account?','হিসাব বন্ধ করবেন?') : text('Activate this account?','হিসাব চালু করবেন?')}</p>
              <p className="mt-0.5 text-[11px] text-ink-500">{text('History remains intact. Inactive accounts disappear from new payment selections.','পুরোনো হিসাব থাকবে। বন্ধ হিসাব নতুন পেমেন্টে বাছা যাবে না।')}</p>
            </div>
          )}
        </>}

        {mode === 'edit' && (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-[13px] font-medium text-ink">
              {text('Account type','হিসাবের ধরন')}
              <FormSelect className="mt-1.5" value={type} options={(['Cash','Petty Cash','Bank','Mobile Banking'] as const).map(value=>({value,label:financeLabel(language,value)}))} onChange={(event) => setType(event.target.value as FinanceAccountType)} />
            </label>
            <label className="text-[13px] font-medium text-ink">
              {text('Account name','হিসাবের নাম')}
              <Input className="mt-1.5" value={name} onChange={(event) => setName(event.target.value)} />
            </label>
            {type !== 'Cash' && <>
              <label className="text-[13px] font-medium text-ink">
                {type === 'Bank' ? text('Bank name','ব্যাংকের নাম') : type === 'Mobile Banking' ? text('Provider','সেবাদাতা') : text('Label','নাম')}
                <Input className="mt-1.5" value={institution} onChange={(event) => setInstitution(event.target.value)} />
              </label>
              <label className="text-[13px] font-medium text-ink">
                {text('Account number','হিসাব নম্বর')}
                <Input className="mt-1.5" value={number} onChange={(event) => setNumber(event.target.value)} />
              </label>
            </>}
            <div className="sm:col-span-2 rounded-lg bg-ink-50 px-3 py-2 text-[11px] text-ink-500">
              {text('Opening balance is historical setup. Use Money in / out for a real account movement or correction.','শুরুর জের পুরোনো হিসাব। এখন টাকা যোগ বা বিয়োগ করতে টাকা আসা/যাওয়া ব্যবহার করুন।')}
            </div>
          </div>
        )}

        {mode === 'manual' && (
          <div className="space-y-3">
            <div className="rounded-lg border border-teal-100 bg-teal-50/50 px-3 py-2">
              <p className="text-[12.5px] font-medium text-teal-900">{text('Money in / out','টাকা আসা / যাওয়া')} {showHelper&&<span className="font-bn text-[11px] font-normal text-teal-700">· অ্যাকাউন্টে টাকা যোগ বা কমানো</span>}</p>
              <p className="mt-0.5 text-[10.5px] text-teal-700">{text('Use for a real standalone movement. Transfers between your own accounts use Transfer instead.','নিজের দুই হিসাবের মাঝে টাকা সরাতে ট্রান্সফার ব্যবহার করুন।')}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-[13px] font-medium text-ink">
              {text('Direction','টাকা আসা/যাওয়া')}
              <FormSelect className="mt-1.5" value={manualDirection} options={['in','out'].map(value=>({value,label:text(value,value==='in'?'টাকা আসবে':'টাকা যাবে')}))} onChange={(event) => setManualDirection(event.target.value as 'in' | 'out')} />
              <span className="mt-1 block text-[11px] font-normal text-ink-400">{manualDirection === 'in' ? text('Adds to the account.','হিসাবে টাকা বাড়বে।') : text('Subtracts from the account.','হিসাবে টাকা কমবে।')}</span>
            </label>
            <label className="text-[13px] font-medium text-ink">
              {text('Amount','টাকা')}
              <div className="relative mt-1.5">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-400">৳</span>
                <Input className="pl-7 text-right" inputMode="decimal" value={manualAmount} onChange={(event) => setManualAmount(event.target.value.replace(/[^\d.]/g, ''))} />
              </div>
            </label>
            <label className="text-[13px] font-medium text-ink">
              {text('Reference','রেফারেন্স')}
              <Input className="mt-1.5" value={manualReference} onChange={(event) => setManualReference(event.target.value)} placeholder={text("Optional","ঐচ্ছিক")} />
            </label>
            <label className="text-[13px] font-medium text-ink">
              {text('Description / note','বিবরণ / মন্তব্য')}
              <Input className="mt-1.5" value={manualNote} onChange={(event) => setManualNote(event.target.value)} placeholder={text("Why is this entry needed?","কেন টাকা যোগ বা কমাচ্ছেন?")} />
            </label>
            </div>
          </div>
        )}

        <DialogFooter>
          {mode === 'ledger' && !confirmStatus && <>
            <Button variant="outline" onClick={printAccount}><Printer className="size-4" /> {text('Print','প্রিন্ট')}</Button>
            <Button variant="outline" onClick={() => setMode('manual')}><Plus className="size-4" /> {text('Money in / out','টাকা আসা / যাওয়া')}</Button>
            <Button variant="outline" onClick={() => onTransfer(account)}><ArrowLeftRight className="size-4" /> {text('Transfer','ট্রান্সফার')}</Button>
            {account.type !== 'Cash' && <Button variant="outline" onClick={() => onReconcile(account)}><RefreshCw className="size-4" /> {text('Reconcile','মিলিয়ে দেখুন')}</Button>}
            <Button variant="outline" onClick={() => setMode('edit')}><Pencil className="size-4" /> {text('Edit','সংশোধন')}</Button>
            <Button variant="outline" onClick={() => setConfirmStatus(true)}><Power className="size-4" /> {account.status === 'Active' ? text('Deactivate','নিষ্ক্রিয় করুন') : text('Activate','সক্রিয় করুন')}</Button>
            <Button onClick={onClose}>{text('Close','বন্ধ করুন')}</Button>
          </>}
          {mode === 'ledger' && confirmStatus && <>
            <Button variant="outline" onClick={() => setConfirmStatus(false)}>{text('Cancel','বাতিল')}</Button>
            <Button onClick={() => { onToggleStatus(account); setConfirmStatus(false); }}>{account.status === 'Active' ? text('Confirm deactivate','বন্ধ করা নিশ্চিত করুন') : text('Confirm activate','চালু করা নিশ্চিত করুন')}</Button>
          </>}
          {mode === 'edit' && <>
            <Button variant="outline" onClick={() => setMode('ledger')}>{text('Cancel','বাতিল')}</Button>
            <Button onClick={saveEdit}><Save className="size-4" /> {text('Save changes','সংশোধন সংরক্ষণ')}</Button>
          </>}
          {mode === 'manual' && <>
            <Button variant="outline" onClick={() => setMode('ledger')}>{text('Cancel','বাতিল')}</Button>
            <Button onClick={saveManual}>{text('Record entry','লেনদেন লিখুন')}</Button>
          </>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function FinanceTransferActionDialog({
  transfer, onClose, onReverse
}: {
  transfer: AccountTransfer | null;
  onClose: () => void;
  onReverse: (transfer: AccountTransfer) => void;
}) {
  const {text,language}=useUiCopy();
  const [confirmReverse, setConfirmReverse] = useState(false);
  useEffect(() => setConfirmReverse(false), [transfer]);
  if (!transfer) return null;

  const printTransfer=()=>{
    if(!printReport({title:transfer.id,language,subtitle:text('Account transfer preview','টাকা স্থানান্তরের নমুনা হিসাব'),headers:[text('Field','বিবরণ'),text('Value','তথ্য')],rows:[
      [text('Date','তারিখ'),transfer.date],[text('From','যে হিসাব থেকে'),transfer.from],
      [text('To','যে হিসাবে'),transfer.to],[text('Amount','টাকা'),taka(transfer.amount)],
      [text('Status','অবস্থা'),financeLabel(language,transfer.status)],
      [text('Reference','রেফারেন্স'),transfer.reference??'—']
    ]}))toast.error(text('Allow the print popup and try again.','প্রিন্ট উইন্ডো খুলে আবার চেষ্টা করুন।'));
  };
  return (
    <Dialog open={!!transfer} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{text('Account transfer','হিসাবে টাকা সরানো')}</DialogTitle>
          <DialogDescription>{transfer.id} · {transfer.date}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2 sm:grid-cols-2">
          <Detail label="From">{transfer.from}</Detail>
          <Detail label="To">{transfer.to}</Detail>
          <Detail label="Amount">{taka(transfer.amount)}</Detail>
          <Detail label="Status"><StatusBadge tone={transfer.status === 'Completed' ? 'success' : 'neutral'} dot>{financeLabel(language,transfer.status)}</StatusBadge></Detail>
          <div className="sm:col-span-2"><Detail label="Reference">{transfer.reference}</Detail></div>
        </div>
        {confirmReverse && (
          <div className="rounded-lg border border-danger/20 bg-danger/5 px-3 py-2.5">
            <p className="text-[13px] font-medium text-danger">{text('Reverse this transfer?','ট্রান্সফার উল্টো করবেন?')}</p>
            <p className="mt-0.5 text-[11px] text-ink-500">{text('Both account balances are restored while the audit record stays visible.','দুই হিসাবের জের আগের মতো হবে; পরিবর্তনের ইতিহাস থাকবে।')}</p>
          </div>
        )}
        <DialogFooter>
          {confirmReverse ? <>
            <Button variant="outline" onClick={() => setConfirmReverse(false)}>{text('Keep transfer','ট্রান্সফার রাখুন')}</Button>
            <Button onClick={() => { onReverse(transfer); setConfirmReverse(false); }}><RotateCcw className="size-4" /> {text('Confirm reverse','উল্টো করা নিশ্চিত করুন')}</Button>
          </> : <>
            <Button variant="outline" onClick={printTransfer}><Printer className="size-4" /> {text('Print','প্রিন্ট')}</Button>
            {transfer.status === 'Completed' && <Button variant="outline" onClick={() => setConfirmReverse(true)}><RotateCcw className="size-4" /> {text('Reverse','উল্টো করুন')}</Button>}
            <Button onClick={onClose}>{text('Close','বন্ধ করুন')}</Button>
          </>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function FinancePeopleManagerDialog({
  open, people, initialRole = 'Lender', onOpenChange, onAdd, onUpdate
}: {
  open: boolean;
  people: FinancePerson[];
  initialRole?: FinancePersonRole;
  onOpenChange: (open: boolean) => void;
  onAdd: (person: FinancePerson) => void;
  onUpdate: (person: FinancePerson) => void;
}) {
  const {text,language}=useUiCopy();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [roles, setRoles] = useState<FinancePersonRole[]>([initialRole]);

  const reset = () => {
    setEditingId(null);
    setName('');
    setPhone('');
    setDescription('');
    setRoles([initialRole]);
  };

  useEffect(() => { if (open) setRoles([initialRole]); }, [open, initialRole]);
  useEffect(() => { if (!open) reset(); }, [open]);

  const editing = people.find((person) => person.id === editingId);
  const startEdit = (person: FinancePerson) => {
    setEditingId(person.id);
    setName(person.name);
    setPhone(person.phone || '');
    setDescription(person.description || '');
    setRoles(person.roles);
  };
  const toggleRole = (role: FinancePersonRole) => {
    setRoles((current) => current.includes(role) ? current.filter((item) => item !== role) : [...current, role]);
  };
  const save = () => {
    if (!name.trim() || !roles.length) return toast.error(text('Enter a name and choose at least one role','নাম লিখুন এবং অন্তত একটি সম্পর্কের ধরন বাছুন'));
    if (editing) {
      onUpdate({ ...editing, name: name.trim(), phone: phone.trim() || undefined, description: description.trim() || undefined, roles });
    } else {
      onAdd({ id: 'fp-' + Date.now(), name: name.trim(), phone: phone.trim() || undefined, description: description.trim() || undefined, roles, status: 'Active' });
    }
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle><UserRoundCog className="mr-2 inline size-4" />{text('Finance people','হিসাবের ব্যক্তি')}</DialogTitle>
          <DialogDescription>{text('Manage Owner, Lender and Borrower roles without cross-netting balances.','মালিক, ঋণদাতা ও ঋণগ্রহীতার দেনা-পাওনা আলাদা রাখুন।')}</DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-border">
          <div className="grid gap-2 border-b border-border bg-ink-50/60 p-3 md:grid-cols-2">
            <Input aria-label={text('Name','নাম')} value={name} onChange={(event) => setName(event.target.value)} placeholder={text("Name","নাম")} />
            <Input aria-label={text('Phone','ফোন নম্বর')} value={phone} onChange={(event) => setPhone(event.target.value)} placeholder={text("Phone","ফোন নম্বর")} />
            <Input aria-label={text('Description / relationship note','বিবরণ / সম্পর্কের মন্তব্য')} className="md:col-span-2" value={description} onChange={(event) => setDescription(event.target.value)} placeholder={text("Description / relationship note","বিবরণ / সম্পর্কের মন্তব্য")} />
            <div className="flex flex-wrap gap-1.5 md:col-span-2">
              {(['Owner', 'Lender', 'Borrower'] as FinancePersonRole[]).map((role) => (
                <button key={role} type="button" aria-pressed={roles.includes(role)} onClick={() => toggleRole(role)}
                  className={'rounded-md border px-2 py-1 text-xs font-medium ' + (roles.includes(role) ? 'border-teal-200 bg-teal-50 text-teal-700' : 'border-border bg-card text-ink-500')}>
                  {financeLabel(language,role)}
                </button>
              ))}
            </div>
            <div className="flex gap-2 md:col-span-2">
              <Button onClick={save}>{editing ? <Save className="size-4" /> : <Plus className="size-4" />} {editing ? text('Save person','তথ্য সংরক্ষণ') : text('Add person','ব্যক্তি যোগ করুন')}</Button>
              {editing && <Button variant="outline" onClick={reset}>{text('Cancel edit','সংশোধন বাতিল')}</Button>}
            </div>
          </div>

          <div className="max-h-80 divide-y divide-border overflow-auto">
            {people.map((person) => (
              <div key={person.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-ink-50 text-xs font-semibold text-ink-600">
                  {person.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-ink">{financePersonOptionLabel(person,people)}</p>
                  <p className="text-[10.5px] text-ink-400">{person.phone || text('No phone','ফোন নম্বর নেই')}{person.description ? ' · ' + person.description : ''}</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {person.roles.map((role) => <StatusBadge key={role} tone="neutral">{financeLabel(language,role)}</StatusBadge>)}
                  <StatusBadge tone={person.status === 'Active' ? 'success' : 'neutral'} dot>{financeLabel(language,person.status)}</StatusBadge>
                </div>
                <Button variant="outline" size="sm" aria-label={`${text('Edit','সংশোধন')} ${financePersonOptionLabel(person,people)}`} onClick={() => startEdit(person)}><Pencil className="size-3.5" /> {text('Edit','সংশোধন')}</Button>
                <Button variant="outline" size="sm" aria-label={`${text(person.status === 'Active' ? 'Deactivate' : 'Activate',person.status === 'Active' ? 'নিষ্ক্রিয় করুন' : 'সক্রিয় করুন')} ${financePersonOptionLabel(person,people)}`} onClick={() => onUpdate({ ...person, status: person.status === 'Active' ? 'Inactive' : 'Active' })}>
                  <Power className="size-3.5" /> {person.status === 'Active' ? text('Deactivate','নিষ্ক্রিয় করুন') : text('Activate','সক্রিয় করুন')}
                </Button>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter><Button onClick={() => onOpenChange(false)}>{text('Done','সম্পন্ন')}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

