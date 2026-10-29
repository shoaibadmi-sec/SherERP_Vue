import { MotionTabList, MotionTabIndicator } from '../motion/MotionTabList';
import {matchesSearch as fuzzyMatch} from '../utils/fuzzySearch';
import React, { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Banknote,
  BookOpen,
  BriefcaseBusiness,
  CheckCircle2,
  CircleDollarSign,
  Landmark,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Settings,
  UserRoundCog,
  WalletCards
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/Button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/Dialog';
import { FormSelect } from '../components/FormSelect';
import { Input } from '../components/Input';
import { PageHeader } from '../components/PageHeader';
import { CounterWorkspace } from '../components/finance/CounterWorkspace';
import { financePreviewRelationshipSummary, getFinancePreviewSnapshot, subscribeFinancePreview, updateFinancePreview } from '../data/financePreviewStore';
import { FinanceAccountActionDialog, FinancePeopleManagerDialog, FinanceTransactionActionDialog, FinanceTransferActionDialog } from '../components/finance/FinanceRecordDialogs';
import { ChequeDialog } from '../components/finance/ChequeDialogs';
import { ChequeActionDialog } from '../components/finance/ChequeActionDialog';
import { CashSessionDetailsDialog } from '../components/finance/CashSessionDetailsDialog';
import { FinancePaymentSplitEditor, type FinancePaymentDraft } from '../components/finance/FinancePaymentSplitEditor';
import { financeAccountIdentityLabel, transferAccountId, transferAccountLabel } from '../utils/accountTransferIdentity';
import { normalizeFinancePaymentSplits, financePaymentSplitsAreValid, financePaymentDraftTotal } from '../utils/financePaymentDrafts';
import { StatusBadge } from '../components/StatusBadge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/Table';
import { useCashSession } from '../contexts/CashSessionContext';
import {
  accountTransfers as seedTransfers,
  cashSessions,
  financePersonOptionLabel,
  financeAccounts as seedAccounts,
  financeTransactions as seedTransactions,
  type AccountTransfer,
  type FinanceAccount,
  type FinanceAccountType,
  type FinancePerson,
  type FinancePersonRole,
  type FinanceTransaction,
  type FinanceTransactionType,
  type CashSessionRecord
} from '../data/financeAccounts';
import { cheques as seedCheques, type ChequeRecord, type ChequeStatus } from '../data/cheques';
import { taka } from '../utils/currency';
import { chequeMoneyAccount, renameChequeAccountReferences } from '../utils/chequeAccount';
import {businessToday,formatDay} from '../utils/dateRange';
import { chequeLifecycleActions } from '../utils/moduleUiActions';
import { AmountInWordsDisplay } from '../components/AmountInWordsDisplay';
import {useUiCopy} from '../i18n/useUiCopy';
import {financeLabel} from '../i18n/financeCopy';

type Tab = 'overview' | 'transactions' | 'counter' | 'accounts' | 'cheques' | 'cash';

const financeTypeMeta: Record<FinanceTransactionType, {
  role?: FinancePersonRole;
  account?: FinanceTransaction['relationship'];
  direction: FinanceTransaction['direction'];
  opening?: boolean;
}> = {
  'Owner Credit': { role: 'Owner', account: 'Owner Balance', direction: 'in' },
  'Owner Debit': { role: 'Owner', account: 'Owner Balance', direction: 'out' },
  'Lender Credit': { role: 'Lender', account: 'Lender Balance', direction: 'in' },
  'Lender Debit': { role: 'Lender', account: 'Lender Balance', direction: 'out' },
  'Borrower Debit': { role: 'Borrower', account: 'Borrower Balance', direction: 'out' },
  'Borrower Credit': { role: 'Borrower', account: 'Borrower Balance', direction: 'in' },
  'Opening Owner Capital': { role: 'Owner', account: 'Owner Balance', direction: 'none', opening: true },
  'Opening Loan': { role: 'Lender', account: 'Lender Balance', direction: 'none', opening: true },
  'Opening Borrower Loan': { role: 'Borrower', account: 'Borrower Balance', direction: 'none', opening: true },
  'Manual Bank Entry': { direction: 'in' },
  Transfer: { direction: 'none' }
};

const financeTypeOptions: FinanceTransactionType[] = [
  'Lender Credit',
  'Lender Debit',
  'Borrower Debit',
  'Borrower Credit',
  'Owner Credit',
  'Owner Debit',
  'Opening Owner Capital',
  'Opening Loan',
  'Opening Borrower Loan'
];

function transactionTone(transaction: FinanceTransaction) {
  if (transaction.status === 'Reversed') return 'neutral' as const;
  if (transaction.direction === 'in') return 'success' as const;
  if (transaction.direction === 'out') return 'warning' as const;
  return 'info' as const;
}

function TransactionDialog({
  open,
  accounts,
  people,
  nextId,
  onOpenChange,
  onSave, onAddPerson, onUpdatePerson
}: {
  open: boolean;
  accounts: FinanceAccount[];
  people: FinancePerson[];
  nextId: string;
  onOpenChange: (open: boolean) => void;
  onSave: (transaction: FinanceTransaction) => void;
  onAddPerson: (person: FinancePerson) => void;
  onUpdatePerson: (person: FinancePerson) => void;
}) {
  const {text,language,showHelper}=useUiCopy();
  const [type, setType] = useState<FinanceTransactionType>('Lender Credit');
  const [personId, setPersonId] = useState(() => people.find(item => item.status === 'Active' && item.roles.includes('Lender'))?.id ?? '');
  const [peopleOpen, setPeopleOpen] = useState(false);
  const [paymentRows, setPaymentRows] = useState<FinancePaymentDraft[]>([{
    id: 'finance-payment-1',
    method: 'Cash',
    accountId: accounts.find((item) => item.status === 'Active' && (item.type === 'Cash' || item.type === 'Petty Cash'))?.id ?? '',
    amount: ''
  }]);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => businessToday());
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [backdateReason, setBackdateReason] = useState('');
  const [reviewFinance, setReviewFinance] = useState(false);
  useEffect(() => {
    if (open) {
      setDate(businessToday());
      setBackdateReason('');
    }
  }, [open]);
  useEffect(() => setReviewFinance(false), [type, personId, paymentRows, amount, date, reference, note, backdateReason, open, people]);

  const meta = financeTypeMeta[type];
  const rolePeople = people.filter((item) => item.status === 'Active' && (!meta.role || item.roles.includes(meta.role)));
  const isOpening = !!meta.opening;
  const selectedPerson = rolePeople.find((item) => item.id === personId);
  const isBackdated = date < businessToday();
  // For cash/bank transactions, payment sources are the single source of truth.
  // Opening balances have no payment sources and retain an editable amount.
  const transactionAmount = isOpening ? Number(amount) : financePaymentDraftTotal(paymentRows);
  const displayAmount = Number.isFinite(transactionAmount) ? transactionAmount : 0;
  const paymentSplits = normalizeFinancePaymentSplits(paymentRows, accounts, displayAmount);
  const paymentTotal = paymentSplits.reduce((sum, item) => sum + item.amount, 0);

  const save = () => {
    const value = transactionAmount;
    if (!Number.isFinite(value) || value <= 0) {
      toast.error(isOpening
        ? text('Enter an amount','টাকার পরিমাণ লিখুন')
        : text('Enter valid amounts in payment sources','টাকার মাধ্যমগুলোতে সঠিক টাকা লিখুন'));
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date > businessToday()) {
      toast.error(text('Select today or an earlier valid date','আজ বা আগের সঠিক তারিখ দিন'));
      return;
    }
    if (isBackdated && !backdateReason.trim()) {
      toast.error(text('Backdated transactions require a reason','আগের তারিখের লেনদেনের কারণ লিখুন'));
      return;
    }
    if (!selectedPerson) {
      toast.error(text('Select a finance person','মালিক, ঋণদাতা বা ঋণগ্রহীতা বাছুন'));
      return;
    }
    if (!isOpening && !financePaymentSplitsAreValid(paymentRows, accounts, value)) {
      toast.error(text('Enter valid payment sources that add up to the transaction amount','সব মাধ্যমের সঠিক টাকা লিখুন। যোগফল লেনদেনের টাকার সমান হতে হবে।'));
      return;
    }
    if (!reviewFinance) {setReviewFinance(true);return;}
    const firstPayment = paymentSplits[0];

    onSave({
      id: nextId,
      date: formatDay(date),
      type,
      relationship: meta.account,
      party: selectedPerson.name,
      partyId: selectedPerson.id,
      method: isOpening ? undefined : firstPayment?.method,
      account: isOpening ? undefined : firstPayment?.account,
      accountId: isOpening ? undefined : firstPayment?.accountId,
      paymentAccounts: isOpening ? undefined : paymentSplits,
      amount: value,
      direction: meta.direction,
      reference: reference || undefined,
      note: [note, isBackdated ? `Backdate: ${backdateReason}` : ''].filter(Boolean).join(' · ') || undefined,
      status: 'Active',
      createdBy: 'Anisur Rahman'
    });
    onOpenChange(false);
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{text("New finance transaction","নতুন টাকার লেনদেন")} {showHelper&&<span className="font-bn text-sm font-normal text-ink-500">ব্যবসার হিসাব</span>}</DialogTitle>
          <DialogDescription>
            {text('Owner, lender and borrower balances stay independent. Opening balances never move cash or bank money.','মালিক, ঋণদাতা ও ঋণগ্রহীতার হিসাব আলাদা থাকবে। শুরুর জের দিলে ক্যাশ বা ব্যাংকের টাকা বদলাবে না।')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-[13px] font-medium text-ink sm:col-span-2">
            {text('Transaction type','লেনদেনের ধরন')}
            <FormSelect className="mt-1.5" value={type} onChange={(event) => {
              const next = event.target.value as FinanceTransactionType;
              setType(next);
              const nextMeta = financeTypeMeta[next];
              const firstPerson = people.find((item) => item.status === 'Active' && (!nextMeta.role || item.roles.includes(nextMeta.role)));
              setPersonId(firstPerson?.id ?? '');
            }} options={financeTypeOptions.map(value=>({value,label:financeLabel(language,value)}))} />
            <span className="mt-1 block text-[11px] font-normal text-ink-400">
              {isOpening
                ? text('Opening balance only — no cash, bank or mobile banking movement.','শুধু শুরুর জের — ক্যাশ, ব্যাংক বা মোবাইলে টাকা সরবে না।')
                : meta.direction === 'in'
                  ? text('Money comes into the business.','ব্যবসায় টাকা আসবে।')
                  : text('Money goes out of the business.','ব্যবসা থেকে টাকা যাবে।')}
            </span>
          </label>

          <div className="min-w-0">
            <p id="finance-person-label" className="text-[13px] font-medium text-ink">{text('Finance person','হিসাবের ব্যক্তি')}</p>
            <div className="mt-1.5 flex min-w-0" role="group" aria-labelledby="finance-person-label">
              <FormSelect
                aria-label={text('Finance person','হিসাবের ব্যক্তি')}
                className="min-w-0 flex-1 [&>button]:rounded-r-none"
                value={selectedPerson?.id ?? ''}
                onChange={(event) => setPersonId(event.target.value)}
                options={rolePeople.map((item) => ({value: item.id, label: financePersonOptionLabel(item, rolePeople)}))}
              />
              <button type="button"
                aria-label={text('Manage people','ব্যক্তি যোগ / সংশোধন')}
                title={text('Manage people','ব্যক্তি যোগ / সংশোধন')}
                aria-haspopup="dialog"
                onClick={() => setPeopleOpen(true)}
                className="-ml-px flex h-9 w-11 shrink-0 items-center justify-center rounded-r-md border border-input bg-card text-teal-700 hover:bg-teal-50 focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500">
                <Settings className="size-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          <label className="text-[13px] font-medium text-ink">
            {text('Date','তারিখ')}
            <Input className="mt-1.5" type="date" max={businessToday()} value={date} onChange={(event) => setDate(event.target.value)} />
          </label>

          {isBackdated && (
            <label className="text-[13px] font-medium text-ink sm:col-span-2">
              {text('Reason for backdating','আগের তারিখ দেওয়ার কারণ')} <span className="text-danger">*</span>
              <Input className="mt-1.5" value={backdateReason} onChange={(event) => setBackdateReason(event.target.value)} placeholder={text("Why is this transaction being entered for an earlier date?","আগের তারিখ কেন ব্যবহার করছেন?")} />
            </label>
          )}

          {!isOpening && (
            <FinancePaymentSplitEditor
              accounts={accounts}
              rows={paymentRows}
              onChange={setPaymentRows}
              totalAmount={displayAmount}
            />
          )}

          <label className="text-[13px] font-medium text-ink">
            {text('Amount','টাকা')}
            {!isOpening && <span className="ml-1 text-[11px] font-normal text-ink-500">{text('· Auto total','· স্বয়ংক্রিয় মোট')}</span>}
            <div className="relative mt-1.5">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-400">৳</span>
              <Input value={isOpening ? amount : (Number.isFinite(transactionAmount) && transactionAmount > 0 ? String(transactionAmount) : '')}
                onChange={isOpening ? (event) => setAmount(event.target.value.replace(/[^\d.]/g, '')) : undefined}
                readOnly={!isOpening} className={'pl-7 text-right' + (!isOpening ? ' bg-ink-50/40' : '')}
                inputMode={isOpening ? 'decimal' : 'none'} placeholder="0" />
            </div>
          </label>

          <label className="text-[13px] font-medium text-ink">
            {text('Reference no.','নম্বর')}
            <Input className="mt-1.5" value={reference} onChange={(event) => setReference(event.target.value)} placeholder={text("Optional","ঐচ্ছিক")} />
          </label>

          <label className="text-[13px] font-medium text-ink sm:col-span-2">
            {text('Notes','মন্তব্য')}
            <Input className="mt-1.5" value={note} onChange={(event) => setNote(event.target.value)} placeholder={text("Optional internal note","মন্তব্য (ঐচ্ছিক)")} />
          </label>
        </div>

        <AmountInWordsDisplay amount={displayAmount} />
        {reviewFinance && <section role="status" className="space-y-1 rounded-lg border border-border bg-ink-50 p-3 text-sm">
          <p className="font-semibold">{text('Review finance transaction','লেনদেন যাচাই করুন')}</p>
          <p>{selectedPerson?.name} · {type} · {date}</p><p className="font-semibold">{taka(displayAmount)}</p><AmountInWordsDisplay amount={displayAmount} />
          <p>{text('Payment source total:','মাধ্যমগুলোর মোট:')} {taka(paymentTotal)} · {isOpening?text('Opening balance only','শুধু শুরুর জের'):text('Cash/bank movement','ক্যাশ/ব্যাংকে টাকা আসা-যাওয়া')}</p>
        </section>}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{text('Cancel','বাতিল')}</Button>
          <Button onClick={save}>{reviewFinance?text('Confirm finance transaction','লেনদেন নিশ্চিত করুন'):text('Review transaction','লেনদেন যাচাই করুন')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <FinancePeopleManagerDialog open={open && peopleOpen} people={people} initialRole={meta.role} onOpenChange={setPeopleOpen}
      onAdd={(person) => { onAddPerson(person); setPersonId(person.id); setPeopleOpen(false); }} onUpdate={onUpdatePerson} />
    </>
  );
}

function AccountDialog({
  open, initialType = 'Bank',
  onOpenChange,
  onSave
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (account: FinanceAccount) => void;
  initialType?: FinanceAccountType;
}) {
  const {text,language,showHelper}=useUiCopy();
  const [type, setType] = useState<FinanceAccountType>(initialType);
  const [name, setName] = useState('');
  const [institution, setInstitution] = useState('');
  const [number, setNumber] = useState('');
  const [opening, setOpening] = useState('');

  const save = () => {
    if (!name.trim()) {
      toast.error(text('Enter an account name','হিসাবের নাম লিখুন'));
      return;
    }
    const value = Number(opening);
    if (!Number.isFinite(value) || value < 0) {
      toast.error(text('Enter a valid opening balance','শুরুর জেরের সঠিক পরিমাণ লিখুন'));
      return;
    }
    const id = `acc-${Date.now()}`;
    onSave({
      id,
      name: name.trim(),
      type,
      institution: institution || undefined,
      number: number || undefined,
      openingBalance: value,
      balance: value,
      status: 'Active',
      lastActivity: 'Just now'
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{text("Add account","নতুন হিসাব যোগ করুন")} {showHelper&&<span className="font-bn text-sm font-normal text-ink-500">অ্যাকাউন্ট যোগ করুন</span>}</DialogTitle>
          <DialogDescription>{text('Cash, bank and mobile banking accounts share one simple account list.','ক্যাশ, ব্যাংক ও মোবাইল ব্যাংকিং সব একই তালিকায় থাকবে।')}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-[13px] font-medium text-ink">
            {text('Account type','হিসাবের ধরন')}
            <FormSelect className="mt-1.5" value={type} onChange={(event) => setType(event.target.value as FinanceAccountType)} options={(['Cash', 'Petty Cash', 'Bank', 'Mobile Banking'] as const).map(value=>({value,label:financeLabel(language,value)}))} />
          </label>
          <label className="text-[13px] font-medium text-ink">
            {text('Account name','হিসাবের নাম')}
            <Input className="mt-1.5" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. City Bank · 3812" />
          </label>
          {(type === 'Bank' || type === 'Mobile Banking') && (
            <>
              <label className="text-[13px] font-medium text-ink">
                {type === 'Bank' ? text('Bank name','ব্যাংকের নাম') : text('Provider','সেবাদাতা')}
                <Input className="mt-1.5" value={institution} onChange={(event) => setInstitution(event.target.value)} placeholder={type === 'Bank' ? 'Bank name' : 'bKash / Nagad / Rocket'} />
              </label>
              <label className="text-[13px] font-medium text-ink">
                {text('Account number','হিসাব নম্বর')}
                <Input className="mt-1.5" value={number} onChange={(event) => setNumber(event.target.value)} placeholder={text("Optional","ঐচ্ছিক")} />
              </label>
            </>
          )}
          <label className="text-[13px] font-medium text-ink sm:col-span-2">
            {text('Opening balance','শুরুর জের')}
            <div className="relative mt-1.5">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-400">৳</span>
              <Input value={opening} onChange={(event) => setOpening(event.target.value.replace(/[^\d.]/g, ''))} className="pl-7 text-right" inputMode="decimal" placeholder="0" />
            </div>
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{text('Cancel','বাতিল')}</Button>
          <Button onClick={save}>{text('Save account','হিসাব সংরক্ষণ')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TransferDialog({
  open,
  accounts,
  nextId,
  initialFrom,
  onOpenChange,
  onSave
}: {
  open: boolean;
  accounts: FinanceAccount[];
  nextId: string;
  initialFrom?: string;
  onOpenChange: (open: boolean) => void;
  onSave: (transfer: AccountTransfer) => void;
}) {
  const {text}=useUiCopy();
  const active = accounts.filter((item) => item.status === 'Active');
  const [from, setFrom] = useState(active[0]?.id ?? '');
  const [to, setTo] = useState(active[1]?.id ?? '');
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [reviewTransfer, setReviewTransfer] = useState(false);
  React.useEffect(() => setReviewTransfer(false), [from, to, amount, reference, open]);

  React.useEffect(() => {
    if (!open) return;
    const preferred = active.find((item) => item.id === initialFrom)?.id ?? active[0]?.id ?? '';
    setFrom(preferred);
    const other = active.find((item) => item.id !== preferred)?.id ?? '';
    setTo(other);
    setAmount('');
    setReference('');
  }, [open, initialFrom]);

  const save = () => {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      toast.error(text('Enter a transfer amount','কত টাকা সরাবেন লিখুন'));
      return;
    }
    const fromAccount = active.find((item) => item.id === from);
    const toAccount = active.find((item) => item.id === to);
    if (!fromAccount || !toAccount || fromAccount.id === toAccount.id) {
      toast.error(text('Choose two different accounts','দুটি আলাদা হিসাব বাছুন'));
      return;
    }
    if (!reviewTransfer) {setReviewTransfer(true);return;}
    onSave({
      id: nextId,
      date: '06 Oct 2026',
      from: fromAccount.name,
      to: toAccount.name,
      fromAccountId: fromAccount.id,
      toAccountId: toAccount.id,
      amount: value,
      reference: reference || undefined,
      status: 'Completed'
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{text('Transfer between accounts','এক হিসাব থেকে অন্য হিসাবে টাকা সরান')}</DialogTitle>
          <DialogDescription>{text('One transfer creates the matching money-out and money-in movement.','একটি ট্রান্সফারে এক হিসাব থেকে টাকা কমবে, অন্য হিসাবে যোগ হবে।')}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <label className="text-[13px] font-medium text-ink">
            {text('From account','যে হিসাব থেকে')}
            <FormSelect className="mt-1.5" value={from} onChange={(event) => setFrom(event.target.value)} options={active.map((item) => ({ value: item.id, label: financeAccountIdentityLabel(item, active) }))} />
          </label>
          <label className="text-[13px] font-medium text-ink">
            {text('To account','যে হিসাবে')}
            <FormSelect className="mt-1.5" value={to} onChange={(event) => setTo(event.target.value)} options={active.map((item) => ({ value: item.id, label: financeAccountIdentityLabel(item, active) }))} />
          </label>
          <label className="text-[13px] font-medium text-ink">
            {text('Amount','টাকা')}
            <div className="relative mt-1.5">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-400">৳</span>
              <Input value={amount} onChange={(event) => setAmount(event.target.value.replace(/[^\d.]/g, ''))} className="pl-7 text-right" inputMode="decimal" placeholder="0" />
            </div>
          </label>
          <label className="text-[13px] font-medium text-ink">
            {text('Reference / note','নম্বর / মন্তব্য')}
            <Input className="mt-1.5" value={reference} onChange={(event) => setReference(event.target.value)} placeholder={text("Optional","ঐচ্ছিক")} />
          </label>
        </div>

        <AmountInWordsDisplay amount={Number(amount)||0} />
        {reviewTransfer&&<div role="status" className="rounded-xl border border-border bg-ink-50 p-3 text-sm">
          <p className="font-semibold">{text('Check transfer before recording','টাকা সরানোর আগে হিসাব মিলিয়ে নিন')}</p>
          <p className="mt-1">{financeAccountIdentityLabel(active.find((item) => item.id === from) ?? active[0], active)} → {financeAccountIdentityLabel(active.find((item) => item.id === to) ?? active[1], active)}</p><p className="font-semibold">{taka(Number(amount)||0)}</p><AmountInWordsDisplay amount={Number(amount)||0} />
        </div>}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{text('Cancel','বাতিল')}</Button>
          <Button onClick={save}>{reviewTransfer?text('Confirm transfer','টাকা সরানো নিশ্চিত করুন'):text('Review transfer','ট্রান্সফার যাচাই করুন')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function Finance({ counterOnly = false }: { counterOnly?: boolean } = {}) {
  const {text,language,showHelper}=useUiCopy();
  const navigate = useNavigate();
  const { setOpen: setCashDialogOpen, sessionOpen, openingCash, expectedCash, lastCount } = useCashSession();
  const [financeTab, setTab] = useState<Tab>('overview');
  const tab: Tab = counterOnly ? 'counter' : financeTab;
  const { accounts, transactions, people } = useSyncExternalStore(subscribeFinancePreview, getFinancePreviewSnapshot);
  const relationshipSummary = financePreviewRelationshipSummary(transactions);
  const setAccounts: React.Dispatch<React.SetStateAction<FinanceAccount[]>> = (change) => updateFinancePreview('accounts', change);
  const setTransactions: React.Dispatch<React.SetStateAction<FinanceTransaction[]>> = (change) => updateFinancePreview('transactions', change);
  const setPeople: React.Dispatch<React.SetStateAction<FinancePerson[]>> = (change) => updateFinancePreview('people', change);
  const [transfers, setTransfers] = useState<AccountTransfer[]>(() => seedTransfers.map((transfer) => ({
    ...transfer,
    fromAccountId: transferAccountId(transfer, 'from', seedAccounts),
    toAccountId: transferAccountId(transfer, 'to', seedAccounts)
  })));
  const [chequeRecords, setChequeRecords] = useState<ChequeRecord[]>(seedCheques);
  const [transactionOpen, setTransactionOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [peopleOpen, setPeopleOpen] = useState(false);
  const [chequeOpen, setChequeOpen] = useState(false);
  const [chequeAction, setChequeAction] = useState<ChequeRecord | null>(null);
  const [cashSessionAction, setCashSessionAction] = useState<CashSessionRecord | null>(null);
  const [transferFrom, setTransferFrom] = useState<string | undefined>(undefined);
  const [transactionAction, setTransactionAction] = useState<FinanceTransaction | null>(null);
  const [accountAction, setAccountAction] = useState<FinanceAccount | null>(null);
  const [transferAction, setTransferAction] = useState<AccountTransfer | null>(null);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All transaction types');
  const applyTransactionMovement = (list: FinanceAccount[], transaction: FinanceTransaction, factor = 1) => {
    if (transaction.direction === 'none' || transaction.status === 'Reversed') return list;
    const splits = transaction.paymentAccounts?.length
      ? transaction.paymentAccounts
      : transaction.accountId
        ? [{ method: transaction.method ?? 'Cash', account: transaction.account ?? '', accountId: transaction.accountId, amount: transaction.amount }]
        : [];
    return list.map((account) => {
      const movement = splits.filter((split) => split.accountId === account.id).reduce((sum, split) => sum + split.amount, 0);
      if (!movement) return account;
      const signed = transaction.direction === 'in' ? movement : -movement;
      return { ...account, balance: account.balance + signed * factor, lastActivity: 'Just now' };
    });
  };

  const updateFinanceTransaction = (updated: FinanceTransaction) => {
    const previous = transactions.find((item) => item.id === updated.id);
    if (!previous) return;
    setAccounts((current) => applyTransactionMovement(applyTransactionMovement(current, previous, -1), updated, 1));
    setTransactions((current) => current.map((item) => item.id === updated.id ? updated : item));
    setTransactionAction(updated);
    toast.success('Finance transaction updated', { description: updated.id });
  };

  const reverseFinanceTransaction = (transaction: FinanceTransaction) => {
    if (transaction.status === 'Reversed') return;
    const reversed = { ...transaction, status: 'Reversed' as const };
    setAccounts((current) => applyTransactionMovement(current, transaction, -1));
    setTransactions((current) => current.map((item) => item.id === transaction.id ? reversed : item));
    setTransactionAction(reversed);
    toast.success('Transaction reversed', { description: transaction.id + ' remains in the audit history' });
  };

  const updateFinanceAccount = (updated: FinanceAccount) => {
    const previous = accounts.find((item) => item.id === updated.id);
    setAccounts((current) => current.map((item) => item.id === updated.id ? updated : item));
    if (previous && previous.name !== updated.name) {
      setTransactions((current) => current.map((item) => ({
        ...item,
        account: item.accountId === updated.id ? updated.name : item.account,
        paymentAccounts: item.paymentAccounts?.map((split) => split.accountId === updated.id ? { ...split, account: updated.name } : split)
      })));
      setChequeRecords((current) => renameChequeAccountReferences(current, accounts, updated, previous.name));
    }
    setAccountAction(updated);
    toast.success('Account updated', { description: updated.name });
  };

  const toggleFinanceAccount = (account: FinanceAccount) => {
    const updated = { ...account, status: account.status === 'Active' ? 'Inactive' as const : 'Active' as const };
    setAccounts((current) => current.map((item) => item.id === account.id ? updated : item));
    setAccountAction(updated);
    toast.success(updated.status === 'Active' ? 'Account activated' : 'Account deactivated', { description: updated.name });
  };

  const addManualAccountEntry = (account: FinanceAccount, direction: 'in' | 'out', amount: number, reference?: string, note?: string) => {
    const transaction: FinanceTransaction = {
      id: 'FIN-M-' + String(Date.now()).slice(-6),
      date: '06 Oct 2026',
      type: 'Manual Bank Entry',
      method: account.type === 'Cash' || account.type === 'Petty Cash' ? 'Cash' : account.type === 'Bank' ? 'Bank' : 'Mobile Banking',
      account: account.name,
      accountId: account.id,
      amount,
      direction,
      reference,
      note,
      status: 'Active',
      createdBy: 'Anisur Rahman'
    };
    setTransactions((current) => [transaction, ...current]);
    setAccounts((current) => applyTransactionMovement(current, transaction, 1));
    setAccountAction((current) => current && current.id === account.id
      ? { ...current, balance: current.balance + (direction === 'in' ? amount : -amount), lastActivity: 'Just now' }
      : current);
    toast.success('Manual account entry recorded', { description: (direction === 'in' ? '+' : '−') + taka(amount) });
  };

  const openTransfer = (account?: FinanceAccount) => {
    setTransferFrom(account?.id);
    setTransferOpen(true);
  };

  const updateCheque = (updated: ChequeRecord) => {
    setChequeRecords((current) => current.map((item) => item.id === updated.id ? updated : item));
    setChequeAction(updated);
    toast.success('Cheque updated', { description: updated.id });
  };

  const changeChequeStatus = (cheque: ChequeRecord, nextStatus: ChequeStatus, reason?: string) => {
    const source = chequeRecords.find(item => item.id === cheque.id);
    if (!source || source.status !== cheque.status || !chequeLifecycleActions(source).some(action => action.nextStatus === nextStatus)) return false;
    const bankAccount = chequeMoneyAccount(accounts, cheque);
    if (nextStatus === 'Cleared' && !bankAccount) {
      toast.error(text('Choose a valid active bank account before clearing this cheque','চেক ক্লিয়ার করার আগে চালু ব্যাংক হিসাব বাছুন'));
      return false;
    }
    const updated: ChequeRecord = {
      ...cheque,
      status: nextStatus,
      depositAccountId: bankAccount?.id ?? cheque.depositAccountId,
      statusReason: reason,
      statusUpdatedAt: '2026-10-07T16:40:00+06:00',
      statusUpdatedBy: 'Shuvo'
    };
    setChequeRecords((current) => current.map((item) => item.id === cheque.id ? updated : item));
    if (nextStatus === 'Cleared' && cheque.status !== 'Cleared' && cheque.depositAccount) {
      setAccounts((current) => current.map((account) => account.id === bankAccount?.id
        ? { ...account, balance: account.balance + (cheque.direction === 'Received' ? cheque.amount : -cheque.amount), lastActivity: 'Just now' }
        : account));
    }
    setChequeAction(updated);
    toast.success('Cheque status updated', { description: cheque.id + ' · ' + nextStatus });
    return true;
  };

  const reverseAccountTransfer = (transfer: AccountTransfer) => {
    if (transfer.status === 'Reversed') return;
    const reversed = { ...transfer, status: 'Reversed' as const };
    setTransfers((current) => current.map((item) => item.id === transfer.id ? reversed : item));
    setAccounts((current) => current.map((account) => {
      if (account.id === transferAccountId(transfer, 'from', accounts)) return { ...account, balance: account.balance + transfer.amount, lastActivity: 'Just now' };
      if (account.id === transferAccountId(transfer, 'to', accounts)) return { ...account, balance: account.balance - transfer.amount, lastActivity: 'Just now' };
      return account;
    }));
    setTransferAction(reversed);
    toast.success('Transfer reversed', { description: transfer.id });
  };
  const totalLiquid = accounts.filter((item) => item.status === 'Active').reduce((sum, item) => sum + item.balance, 0);
  const cashBalance = accounts.filter((item) => (item.type === 'Cash' || item.type === 'Petty Cash') && item.status === 'Active').reduce((sum, item) => sum + item.balance, 0);
  const bankBalance = accounts.filter((item) => item.type === 'Bank' && item.status === 'Active').reduce((sum, item) => sum + item.balance, 0);
  const mobileBalance = accounts.filter((item) => item.type === 'Mobile Banking' && item.status === 'Active').reduce((sum, item) => sum + item.balance, 0);

  const filteredTransactions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return transactions.filter((item) => {
      const matchesType = typeFilter === 'All transaction types' || item.type === typeFilter;
      const matchesQuery = fuzzyMatch(q,[item.id,item.party,item.type,item.account,item.reference,item.note]);
      return matchesType && matchesQuery;
    });
  }, [transactions, query, typeFilter]);

  const tabs: Array<[Tab, string, string]> = [
    ['overview', text('Overview','সারাংশ'), text('Money position and relationship balances','টাকা ও দেনা-পাওনার হিসাব')],
    ['accounts', text('Money Accounts','টাকার হিসাব'), text('Cash, bank, mobile banking and petty cash','ক্যাশ, ব্যাংক ও মোবাইল')],
    ['counter', text('Counter','কাউন্টার'), text('Fast receive, pay, expense and transfer','টাকা নেওয়া-দেওয়া ও খরচ')],
    ['transactions', text('Loans & Owners','ঋণ ও মালিক'), text('Owner, lender and borrower money','মালিক ও ঋণের হিসাব')],
    ['cheques', text('Cheques','চেক'), text('Received, issued and post-dated cheques','পাওয়া, দেওয়া ও ভবিষ্যৎ তারিখের চেক')],
    ['cash', text('Cash Sessions','ক্যাশ সেশন'), text('Open, close and reconcile cash drawer','ক্যাশ খোলা, বন্ধ ও মেলানো')]
  ];

  const pdcCount = chequeRecords.filter((item) => item.chequeDate > '2026-10-07' && !['Cleared', 'Cancelled', 'Returned', 'Stopped', 'Bounced'].includes(item.status)).length;
  const bouncedCount = chequeRecords.filter((item) => item.status === 'Bounced' || item.status === 'Returned').length;
  const varianceSessions = cashSessions.filter((item) => item.status === 'Closed' && (item.variance ?? 0) !== 0).length;

  const pendingChequeAmount = chequeRecords
    .filter((item) => !['Cleared', 'Cancelled', 'Returned', 'Stopped', 'Bounced'].includes(item.status))
    .reduce((sum, item) => sum + item.amount, 0);

  const summaryCards = [
    { label: text('Available money','ব্যবহারের টাকা'), value: taka(totalLiquid), sub: text('Cash + bank + mobile banking','ক্যাশ, ব্যাংক ও মোবাইল'), icon: CircleDollarSign },
    { label: text('Cash','ক্যাশ'), value: taka(cashBalance), sub: sessionOpen ? text('Cash session open','ক্যাশ সেশন চালু') : text('Cash session closed','ক্যাশ সেশন বন্ধ'), icon: Banknote },
    { label: text('Bank','ব্যাংক'), value: taka(bankBalance), sub: text('Across active bank accounts','চালু ব্যাংক হিসাবগুলোর মোট'), icon: Landmark },
    { label: text('Mobile banking','মোবাইল ব্যাংকিং'), value: taka(mobileBalance), sub: text('bKash, Nagad and wallets','বিকাশ, নগদ ও অন্যান্য ওয়ালেট'), icon: WalletCards },
    { label: text('Cheques pending','অপেক্ষমাণ চেক'), value: taka(pendingChequeAmount), sub: text('Waiting for clearance','চেকের টাকা জমা হয়নি'), icon: BookOpen },
    { label: text('Lender payable','ঋণদাতাকে দেনা'), value: taka(relationshipSummary.outstandingLoan), sub: text('Money we still need to repay','যত টাকা ফেরত দিতে হবে'), icon: ArrowDownLeft, tone: 'text-danger' },
    { label: text('Borrower receivable','ঋণগ্রহীতার কাছে পাওনা'), value: taka(relationshipSummary.borrowerReceivable), sub: text('Money others still owe us','অন্যের কাছে আমাদের পাওনা'), icon: ArrowUpRight, tone: 'text-teal-700' }
  ];

  return (
    <div className="mx-auto max-w-[1440px] space-y-4">
      <PageHeader
        title={counterOnly ? 'Counter' : 'Finance'}
        titleBn={counterOnly ? 'কাউন্টার' : 'টাকা-পয়সা'}
        description={counterOnly ? 'Receive, pay, record expenses, transfer money and manage owner or loan transactions.' : 'Cash, bank, mobile banking, loans, cheques and everyday money movement.'}
        descriptionBn={counterOnly?'ক্রেতা-সরবরাহকারীর টাকা, খরচ, ট্রান্সফার এবং মালিক ও ঋণের হিসাব করুন।':'ক্যাশ, ব্যাংক, ঋণ, চেক ও দৈনিক টাকার হিসাব।'}
        actions={counterOnly ? undefined : (
          <>
            <Button variant="outline" size="sm" onClick={() => setPeopleOpen(true)}>
              <UserRoundCog className="size-4" /> {text('Finance people','হিসাবের ব্যক্তি')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setChequeOpen(true)}>
              <Plus className="size-4" /> {text('New cheque','নতুন চেক')}
            </Button>
            <Button size="sm" onClick={() => setTransactionOpen(true)}>
              <Plus className="size-4" /> {text('New transaction','নতুন লেনদেন')}
            </Button>
          </>
        )}
      />

      {!counterOnly && <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-7">
        {summaryCards.map(({ label, value, sub, icon: Icon, tone }) => (
          <div key={label} className="rounded-xl border border-border bg-card px-4 py-3 shadow-card">
            <div className="flex items-start justify-between gap-2">
              <p className="text-[12.5px] text-ink-500">{label}</p>
              <Icon className="size-4 text-helper" />
            </div>
            <p className={`mt-0.5 text-lg font-semibold ${tone ?? 'text-ink'}`}>{value}</p>
            <p className="mt-0.5 text-[10.5px] text-ink-400">{sub}</p>
          </div>
        ))}
      </div>}

      {!counterOnly && (pdcCount > 0 || bouncedCount > 0 || varianceSessions > 0) && (
        <div className="flex flex-wrap gap-2 rounded-xl border border-warning/20 bg-warning/5 p-3">
          <button onClick={() => setTab('cheques')} className="rounded-lg border border-warning/20 bg-card px-3 py-2 text-left hover:bg-warning/5">
            <p className="text-[12px] font-medium text-ink">{pdcCount} post-dated cheque{pdcCount === 1 ? '' : 's'}</p>
            <p className="font-bn text-[10.5px] text-ink-400">পরে জমা দেওয়ার চেক দেখুন</p>
          </button>
          {bouncedCount > 0 && <button onClick={() => setTab('cheques')} className="rounded-lg border border-danger/20 bg-card px-3 py-2 text-left hover:bg-danger/5"><p className="text-[12px] font-medium text-danger">{bouncedCount} cheque issue{bouncedCount === 1 ? '' : 's'}</p><p className="font-bn text-[10.5px] text-ink-400">Bounced / Returned চেক দেখুন</p></button>}
          {varianceSessions > 0 && <button onClick={() => setTab('cash')} className="rounded-lg border border-warning/20 bg-card px-3 py-2 text-left hover:bg-warning/5"><p className="text-[12px] font-medium text-ink">{varianceSessions} cash variance</p><p className="font-bn text-[10.5px] text-ink-400">Short / over যাচাই করুন</p></button>}
        </div>
      )}

      <div className="rounded-xl border border-border bg-card shadow-card">
        {!counterOnly && <MotionTabList className="flex flex-nowrap gap-1 overflow-x-auto border-b border-border px-3 scrollbar-thin" role="tablist">
          {tabs.map(([id, label, helper]) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              title={helper}
              onClick={() => setTab(id)}
              className={`min-h-11 shrink-0 px-2.5 py-2.5 text-[13px] font-medium ${
                tab === id ? 'text-ink' : 'text-ink-500 hover:text-ink'
              }`}>
              {label}
            <MotionTabIndicator active={tab === id} /></button>
          ))}
        </MotionTabList>}

        {tab === 'overview' && (
          <div className="grid gap-4 p-4 xl:grid-cols-[1.25fr_1fr]">
            <section className="min-w-0 space-y-4">
              <div className="rounded-xl border border-border">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-ink">Business relationship balances</p>
                    <p className="text-[11px] text-ink-500">Owner, lender and borrower balances never cross-net.</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setTransactionOpen(true)}>
                    <Plus className="size-4" /> Add finance entry
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-px bg-ink-100 md:grid-cols-3">
                  {[
                    ['Owner capital', relationshipSummary.ownerCapital, 'Owner'],
                    ['Owner advance', relationshipSummary.ownerAdvance, 'Owner'],
                    ['Outstanding loan', relationshipSummary.outstandingLoan, 'Lender'],
                    ['Lender credit', relationshipSummary.lenderCredit, 'Lender'],
                    ['Borrower receivable', relationshipSummary.borrowerReceivable, 'Borrower'],
                    ['Borrower credit', relationshipSummary.borrowerCredit, 'Borrower']
                  ].map(([label, value, group]) => (
                    <div key={String(label)} className="bg-card p-3">
                      <p className="text-[11px] text-ink-400">{group}</p>
                      <p className="text-[12.5px] font-medium text-ink">{label}</p>
                      <p className="mt-1 text-base font-semibold text-ink">{taka(Number(value))}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-border">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-ink">Recent loans & owner money</p>
                    <p className="text-[11px] text-ink-500">Owner, lender and borrower money stays separate.</p>
                  </div>
                  <button onClick={() => setTab('transactions')} className="text-xs font-medium text-teal-700 hover:underline">View all</button>
                </div>
                <Table scrollRegionLabel={text('Recent loans and owner money','সাম্প্রতিক ঋণ ও মালিকের অর্থ')}>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="h-9 pl-4 text-xs">{text('Transaction','লেনদেন')}</TableHead>
                      <TableHead className="h-9 text-xs">{text('Party','পক্ষ')}</TableHead>
                      <TableHead className="h-9 text-xs">{text('Account','হিসাব')}</TableHead>
                      <TableHead className="h-9 pr-4 text-right text-xs">{text('Amount','টাকা')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.slice(0, 5).map((item) => (
                      <TableRow key={item.id} className="text-[13px]">
                        <TableCell className="py-2 pl-4">
                          <p className="font-medium text-ink">{item.type}</p>
                          <p data-table-helper="" className="text-[10.5px] text-ink-400">{item.date} · {item.id}</p>
                        </TableCell>
                        <TableCell className="py-2">{item.party ?? '—'}</TableCell>
                        <TableCell className="py-2 text-ink-500">{item.relationship ?? item.account ?? '—'}</TableCell>
                        <TableCell className={`py-2 pr-4 text-right font-semibold ${
                          item.direction === 'in' ? 'text-success' : item.direction === 'out' ? 'text-ink' : 'text-info'
                        }`}>
                          {item.direction === 'in' ? '+' : item.direction === 'out' ? '−' : ''}{taka(item.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </section>

            <section className="min-w-0 space-y-4">
              <div className="rounded-xl border border-border p-4">
                <p className="text-sm font-semibold text-ink">Money Accounts</p>
                <p className="mb-3 text-[11px] text-ink-500">Live balances by money account.</p>
                <div className="space-y-2">
                  {accounts.filter((item) => item.status === 'Active').map((account) => (
                    <button
                      key={account.id}
                      onClick={() => setTab('accounts')}
                      className="flex w-full items-center gap-3 rounded-lg border border-border px-3 py-2.5 text-left hover:bg-ink-50">
                      <span className="flex size-8 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                        {account.type === 'Cash' ? <Banknote className="size-4" /> : account.type === 'Bank' ? <Landmark className="size-4" /> : <WalletCards className="size-4" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12.5px] font-medium text-ink">{account.name}</span>
                        <span className="block text-[10.5px] text-ink-400">{account.type} · {account.lastActivity}</span>
                      </span>
                      <span className="text-[13px] font-semibold text-ink">{taka(account.balance)}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-border p-4">
                <p className="text-sm font-semibold text-ink">Quick tools</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {[
                    { label: 'Counter', helper: 'Receive / pay', icon: BriefcaseBusiness, action: () => navigate('/app/counter') },
                    { label: 'Transfer', helper: 'Between accounts', icon: ArrowLeftRight, action: () => setTransferOpen(true) },
                    { label: 'Reconcile', helper: 'Bank statement', icon: CheckCircle2, action: () => navigate('/app/reconciliation') },
                    { label: 'Daybook', helper: 'All transactions', icon: BookOpen, action: () => navigate('/app/daybook') }
                  ].map(({ label, helper, icon: Icon, action }) => (
                    <button key={label} onClick={action} className="rounded-lg border border-border p-3 text-left hover:bg-ink-50">
                      <Icon className="size-4 text-teal-700" />
                      <p className="mt-2 text-[12.5px] font-medium text-ink">{label}</p>
                      <p className="text-[10.5px] text-ink-400">{helper}</p>
                    </button>
                  ))}
                </div>
              </div>
            </section>
          </div>
        )}

        {tab === 'transactions' && (
          <>
            <div className="flex flex-col gap-2 border-b border-border p-3 lg:flex-row lg:items-center">
              <div className="relative min-w-0 flex-1 lg:max-w-md">
                <Search className="pointer-events-none absolute z-10 left-2.5 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
                <Input value={query} onChange={(event) => setQuery(event.target.value)} className="pl-8" placeholder="Search finance transaction, party or reference" />
              </div>
              <FormSelect className="w-full lg:w-48" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} options={['All transaction types', ...financeTypeOptions]} />
              <Button variant="outline" size="sm" onClick={() => setPeopleOpen(true)}>
                <UserRoundCog className="size-4" /> {text('Finance people','হিসাবের ব্যক্তি')}
              </Button>
              <Button size="sm" onClick={() => setTransactionOpen(true)}>
                <Plus className="size-4" /> {text('New transaction','নতুন লেনদেন')}
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-9 pl-4 text-xs">{text('Finance transaction','টাকার লেনদেন')}</TableHead>
                  <TableHead className="h-9 text-xs">{text('Relationship','সম্পর্ক')}</TableHead>
                  <TableHead className="h-9 text-xs">{text('Party','পক্ষ')}</TableHead>
                  <TableHead className="h-9 text-xs">{text('Payment','পেমেন্ট')}</TableHead>
                  <TableHead className="h-9 text-xs">{text('Account','হিসাব')}</TableHead>
                  <TableHead className="h-9 text-right text-xs">{text('Amount','টাকা')}</TableHead>
                  <TableHead className="h-9 text-xs">{text('Status','অবস্থা')}</TableHead>
                  <TableHead className="h-9 pr-4 text-right text-xs">{text('Action','কাজ')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((item) => (
                  <TableRow key={item.id} className="text-[13px]">
                    <TableCell className="py-2 pl-4">
                      <p className="font-medium text-ink">{item.type}</p>
                      <p data-table-helper="" className="text-[10.5px] text-ink-400">{item.date} · {item.id}{item.reference ? ` · ${item.reference}` : ''}</p>
                    </TableCell>
                    <TableCell className="py-2 text-ink-600">{item.relationship ?? '—'}</TableCell>
                    <TableCell className="py-2 font-medium text-ink">{item.party ?? '—'}</TableCell>
                    <TableCell className="py-2 text-ink-500">{item.paymentAccounts && item.paymentAccounts.length > 1 ? 'Multiple' : item.method ?? 'No money movement'}</TableCell>
                    <TableCell className="py-2 text-ink-500">{item.paymentAccounts && item.paymentAccounts.length > 1 ? item.paymentAccounts.map((split) => split.account).join(' + ') : item.account ?? '—'}</TableCell>
                    <TableCell className={`py-2 text-right font-semibold ${
                      item.direction === 'in' ? 'text-success' : item.direction === 'out' ? 'text-ink' : 'text-info'
                    }`}>
                      {item.direction === 'in' ? '+' : item.direction === 'out' ? '−' : ''}{taka(item.amount)}
                    </TableCell>
                    <TableCell className="py-2"><StatusBadge tone={transactionTone(item)} dot>{financeLabel(language,item.status)}</StatusBadge></TableCell>
                    <TableCell className="py-2 pr-4 text-right">
                      <button
                        onClick={() => setTransactionAction(item)}
                        aria-label={text('Actions for','কাজ') + ' ' + item.id}
                        className="rounded-md p-1.5 text-ink-400 hover:bg-ink-50 hover:text-ink">
                        <MoreHorizontal className="size-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}

        {tab === 'counter' && <CounterWorkspace accounts={accounts} setAccounts={setAccounts} onNewFinanceTransaction={() => setTransactionOpen(true)} onTransfer={({ fromAccountId, toAccountId, amount, date, reference }) => {
          const fromAccount = accounts.find((account) => account.id === fromAccountId);
          const toAccount = accounts.find((account) => account.id === toAccountId);
          if (!fromAccount || !toAccount) return;
          setTransfers((current) => [{
            id: `TRF-${String(42 + current.length - seedTransfers.length).padStart(6, '0')}`,
            date: formatDay(date),
            from: fromAccount.name,
            to: toAccount.name,
            fromAccountId,
            toAccountId,
            amount,
            reference,
            status: 'Completed',
          }, ...current]);
        }} />}

        {tab === 'accounts' && (
          <div className="p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[13px] font-medium text-ink">{text('Money accounts','টাকার হিসাব')}</p>
                <p className="text-[11px] text-ink-500">{text('Cash, bank and mobile banking with opening balance and ledger access.','ক্যাশ, ব্যাংক ও মোবাইল হিসাবের জের ও লেনদেন দেখুন।')}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => openTransfer()}>
                  <ArrowLeftRight className="size-4" /> {text('Transfer','ট্রান্সফার')}
                </Button>
                <Button size="sm" onClick={() => setAccountOpen(true)}>
                  <Plus className="size-4" /> {text('Add account','হিসাব যোগ করুন')}
                </Button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {accounts.map((account) => (
                <div key={account.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                      {account.type === 'Cash' ? <Banknote className="size-4" /> : account.type === 'Bank' ? <Landmark className="size-4" /> : <WalletCards className="size-4" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-ink">{account.name}</p>
                      <p className="text-[10.5px] text-ink-400">{financeLabel(language,account.type)}{account.number ? ` · ${account.number}` : ''}</p>
                    </div>
                    <StatusBadge tone={account.status === 'Active' ? 'success' : 'neutral'} dot>{financeLabel(language,account.status)}</StatusBadge>
                  </div>

                  <p className="mt-4 text-2xl font-semibold text-ink">{taka(account.balance)}</p>
                  <div className="mt-1 flex items-center justify-between text-[10.5px] text-ink-400">
                    <span>{text('Opening','শুরুর জের')} {taka(account.openingBalance)}</span>
                    <span>{account.lastActivity}</span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3">
                    <Button variant="outline" size="sm" onClick={() => setAccountAction(account)}>
                      <BookOpen className="size-4" /> {text('Ledger','খাতা')}
                    </Button>
                    {account.type !== 'Cash' && (
                      <Button variant="outline" size="sm" onClick={() => navigate(`/app/reconciliation?account=${encodeURIComponent(account.name)}`)}>
                        <CheckCircle2 className="size-4" /> {text('Reconcile','মিলিয়ে দেখুন')}
                      </Button>
                    )}
                    <button
                      onClick={() => setAccountAction(account)}
                      aria-label={text('Actions for','কাজ') + ' ' + account.name}
                      className="ml-auto rounded-md p-1.5 text-ink-400 hover:bg-ink-50 hover:text-ink">
                      <MoreHorizontal className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-xl border border-border">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-ink">{text('Transfer history','ট্রান্সফারের ইতিহাস')}</p>
                  <p className="text-[11px] text-ink-500">{text('Transfers between business money accounts.','ব্যবসার এক হিসাব থেকে অন্য হিসাবে টাকা সরানোর ইতিহাস।')}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => openTransfer()}>
                  <Plus className="size-4" /> {text('New transfer','নতুন ট্রান্সফার')}
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="h-9 pl-4 text-xs">{text('Transfer','ট্রান্সফার')}</TableHead>
                    <TableHead className="h-9 text-xs">{text('From','থেকে')}</TableHead>
                    <TableHead className="h-9 text-xs">{text('To','যে হিসাবে')}</TableHead>
                    <TableHead className="h-9 text-right text-xs">{text('Amount','টাকা')}</TableHead>
                    <TableHead className="h-9 text-xs">{text('Status','অবস্থা')}</TableHead>
                    <TableHead className="h-9 pr-4 text-right text-xs">{text('Action','কাজ')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transfers.map((item) => (
                    <TableRow key={item.id} className="text-[13px]">
                      <TableCell className="py-2 pl-4">
                        <p className="font-medium text-ink">{item.id}</p>
                        <p data-table-helper="" className="text-[10.5px] text-ink-400">{item.date}{item.reference ? ` · ${item.reference}` : ''}</p>
                      </TableCell>
                      <TableCell className="py-2">{transferAccountLabel(item, 'from', accounts)}</TableCell>
                      <TableCell className="py-2">{transferAccountLabel(item, 'to', accounts)}</TableCell>
                      <TableCell className="py-2 text-right font-semibold">{taka(item.amount)}</TableCell>
                      <TableCell className="py-2"><StatusBadge tone={item.status === 'Completed' ? 'success' : 'neutral'} dot>{financeLabel(language,item.status)}</StatusBadge></TableCell>
                      <TableCell className="py-2 pr-4 text-right">
                        <button onClick={() => setTransferAction({ ...item, from: transferAccountLabel(item, 'from', accounts), to: transferAccountLabel(item, 'to', accounts) })} aria-label={text('Actions for','কাজ') + ' ' + item.id} className="rounded-md p-1.5 text-ink-400 hover:bg-ink-50 hover:text-ink">
                          <MoreHorizontal className="size-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}


        {tab === 'cheques' && (
          <div className="p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[13px] font-medium text-ink">{text('Cheque register','চেকের তালিকা')} {showHelper&&<span className="font-bn text-[11px] font-normal text-ink-400">· পাওয়া ও দেওয়া চেক</span>}</p>
                <p className="text-[11px] text-ink-500">{text('Post-dated cheques stay visible. Bank balance changes only when a cheque clears.','ভবিষ্যৎ তারিখের চেক দেখা যাবে। ক্লিয়ার হলেই ব্যাংকের টাকা বদলাবে।')}</p>
              </div>
              <Button size="sm" onClick={() => setChequeOpen(true)}><Plus className="size-4" /> {text('New cheque','নতুন চেক')}</Button>
            </div>

            <div className="overflow-hidden rounded-xl border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="h-9 pl-4 text-xs">{text('Cheque','চেক')}</TableHead>
                    <TableHead className="h-9 text-xs">{text('Party','পক্ষ')}</TableHead>
                    <TableHead className="h-9 text-xs">{text('Bank','ব্যাংক')}</TableHead>
                    <TableHead className="h-9 text-xs">{text('Cheque date','চেকের তারিখ')}</TableHead>
                    <TableHead className="h-9 text-xs">{text('Money account','টাকার হিসাব')}</TableHead>
                    <TableHead className="h-9 text-right text-xs">{text('Amount','টাকা')}</TableHead>
                    <TableHead className="h-9 text-xs">{text('Status','অবস্থা')}</TableHead>
                    <TableHead className="h-9 pr-4 text-right text-xs">{text('Action','কাজ')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {chequeRecords.map((cheque) => {
                    const pdc = cheque.chequeDate > '2026-10-07' && cheque.status !== 'Cleared';
                    return (
                      <TableRow key={cheque.id} className="text-[13px]">
                        <TableCell className="py-2 pl-4">
                          <p className="font-medium text-ink">{financeLabel(language,cheque.direction)} · #{cheque.chequeNumber}</p>
                          <p data-table-helper="" className="text-[10.5px] text-ink-400">{cheque.id}{pdc ? ' · PDC' : ''}{cheque.reference ? ' · ' + cheque.reference : ''}</p>
                        </TableCell>
                        <TableCell className="py-2 font-medium text-ink">{cheque.party}</TableCell>
                        <TableCell className="py-2 text-ink-500">{cheque.bank}{cheque.branch ? ' · ' + cheque.branch : ''}</TableCell>
                        <TableCell className="py-2">
                          <p className="text-ink-600">{cheque.chequeDate}</p>
                          {pdc && <p data-table-helper="" className="font-bn text-[10.5px] text-warning">{text('Post-dated cheque','ভবিষ্যৎ তারিখের চেক')}</p>}
                        </TableCell>
                        <TableCell className="py-2 text-ink-500">{cheque.depositAccount || '—'}</TableCell>
                        <TableCell className="py-2 text-right font-semibold">{taka(cheque.amount)}</TableCell>
                        <TableCell className="py-2"><StatusBadge tone={cheque.status === 'Cleared' ? 'success' : cheque.status === 'Bounced' ? 'danger' : pdc ? 'warning' : 'neutral'} dot>{financeLabel(language,cheque.status)}</StatusBadge></TableCell>
                        <TableCell className="py-2 pr-4 text-right">
                          <button onClick={() => setChequeAction(cheque)} className="rounded-md p-1.5 text-ink-400 hover:bg-ink-50 hover:text-ink" aria-label={'Actions for ' + cheque.id}>
                            <MoreHorizontal className="size-4" />
                          </button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {tab === 'cash' && (
          <div className="grid grid-cols-1 gap-4 p-4 xl:grid-cols-[360px_minmax(0,1fr)]">
            <section className="rounded-xl border border-border p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-ink">{text('Current cash session','বর্তমান ক্যাশ সেশন')}</p>
                  <p className="text-[11px] text-ink-500">{text('Drawer accountability without manufacturing balancing entries.','ক্যাশ গুনে মিলান। পার্থক্যের জন্য নিজে থেকে নতুন লেনদেন হবে না।')}</p>
                </div>
                <StatusBadge tone={sessionOpen ? 'success' : 'neutral'} dot>{sessionOpen ? financeLabel(language,'Open') : financeLabel(language,'Closed')}</StatusBadge>
              </div>

              {sessionOpen ? (
                <>
                  <div className="mt-4 rounded-lg bg-ink-50 p-3">
                    <p className="text-[11px] text-ink-400">{text('Current preview session · resets on reload','নমুনা ক্যাশ সেশন · পাতা রিলোড করলে রিসেট হবে')}</p>
                    <div className="mt-2 grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[10.5px] text-ink-400">{text('Opening cash','শুরুর ক্যাশ')}</p>
                        <p className="text-sm font-semibold text-ink">{taka(openingCash)}</p>
                      </div>
                      <div>
                        <p className="text-[10.5px] text-ink-400">{text('Expected now','এখন থাকার কথা')}</p>
                        <p className="text-sm font-semibold text-ink">{taka(expectedCash)}</p>
                      </div>
                    </div>
                  </div>
                  <Button className="mt-3 w-full" onClick={() => setCashDialogOpen(true)}>{text('Count / close cash session','ক্যাশ গুনুন / সেশন বন্ধ করুন')}</Button>
                </>
              ) : (
                <Button className="mt-4 w-full" onClick={() => setCashDialogOpen(true)}>{text('Open cash session','ক্যাশ সেশন খুলুন')}</Button>
              )}

              {lastCount&&<p className="mt-3 text-xs text-ink-600" role="status">{text('Last count:','শেষ গুনেছেন:')} {taka(lastCount.counted)} · {lastCount.closed?financeLabel(language,'Closed'):text('Saved','সংরক্ষিত')}{lastCount.note?' · '+lastCount.note:''}</p>}
              <button onClick={() => setCashDialogOpen(true)} className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-border py-2 text-xs font-medium text-ink-600 hover:bg-ink-50">
                <RefreshCw className="size-3.5" /> {text('Cash reconciliation','ক্যাশ মিলানো')}
              </button>
            </section>

            <section className="min-w-0 rounded-xl border border-border">
              <div className="border-b border-border px-4 py-3">
                <p className="text-sm font-semibold text-ink">{text('Cash session history','ক্যাশ সেশনের ইতিহাস')}</p>
                <p className="text-[11px] text-ink-500">{text('Expected vs counted cash, with short/over variance kept visible.','হিসাবে থাকার কথা ও গুনে পাওয়া ক্যাশের পার্থক্য দেখা যাবে।')}</p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="h-9 pl-4 text-xs">{text('Session','সেশন')}</TableHead>
                    <TableHead className="h-9 text-xs">{text('Opened / closed','খোলা / বন্ধ')}</TableHead>
                    <TableHead className="h-9 text-right text-xs">{text('Opening','শুরুর জের')}</TableHead>
                    <TableHead className="h-9 text-right text-xs">{text('Expected','থাকার কথা')}</TableHead>
                    <TableHead className="h-9 text-right text-xs">{text('Counted','গুনে পাওয়া')}</TableHead>
                    <TableHead className="h-9 text-right text-xs">{text('Variance','পার্থক্য')}</TableHead>
                    <TableHead className="h-9 text-xs">{text('Status','অবস্থা')}</TableHead>
                    <TableHead className="h-9 pr-4 text-right text-xs">{text('Action','কাজ')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cashSessions.map((session) => (
                    <TableRow key={session.id} className="text-[13px]">
                      <TableCell className="py-2 pl-4">
                        <p className="font-medium text-ink">{session.id}</p>
                        <p data-table-helper="" className="text-[10.5px] text-ink-400">{session.date}</p>
                      </TableCell>
                      <TableCell className="py-2 text-ink-500">{session.openedAt}{session.closedAt ? ` → ${session.closedAt}` : ' → now'}</TableCell>
                      <TableCell className="py-2 text-right">{taka(session.openingCash)}</TableCell>
                      <TableCell className="py-2 text-right">{taka(session.expectedCash)}</TableCell>
                      <TableCell className="py-2 text-right">{session.countedCash === undefined ? '—' : taka(session.countedCash)}</TableCell>
                      <TableCell className={`py-2 text-right font-medium ${
                        !session.variance ? 'text-success' : session.variance < 0 ? 'text-danger' : 'text-warning'
                      }`}>
                        {session.variance === undefined ? '—' : session.variance === 0 ? taka(0) : `${session.variance > 0 ? '+' : '−'}${taka(Math.abs(session.variance))}`}
                      </TableCell>
                      <TableCell className="py-2">
                        <StatusBadge tone={session.status === 'Open' ? 'success' : session.variance ? 'warning' : 'neutral'} dot>{financeLabel(language,session.status)}</StatusBadge>
                      </TableCell>
                      <TableCell className="py-2 pr-4 text-right"><button onClick={() => setCashSessionAction(session)} className="rounded-md p-1.5 text-ink-400 hover:bg-ink-50 hover:text-ink" aria-label={'Actions for ' + session.id}><MoreHorizontal className="size-4" /></button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </section>
          </div>
        )}
      </div>

      <TransactionDialog
        open={transactionOpen}
        accounts={accounts}
        people={people}
        onAddPerson={person => setPeople(current => [...current, person])}
        onUpdatePerson={person => {setPeople(current => current.map(item => item.id === person.id ? person : item)); setTransactions(current => current.map(item => item.partyId === person.id ? {...item, party:person.name} : item));}}
        nextId={`FIN-${String(189 + transactions.length - seedTransactions.length).padStart(6, '0')}`}
        onOpenChange={setTransactionOpen}
        onSave={(transaction) => {
          setTransactions((current) => [transaction, ...current]);
          setAccounts((current) => applyTransactionMovement(current, transaction, 1));
          toast.success('Finance transaction saved', { description: transaction.type + ' · ' + taka(transaction.amount) });
        }}
      />

      <AccountDialog
        open={accountOpen}
        onOpenChange={setAccountOpen}
        onSave={(account) => {
          setAccounts((current) => [...current, account]);
          toast.success('Account added', { description: account.name });
        }}
      />

      <TransferDialog
        open={transferOpen}
        initialFrom={transferFrom}
        accounts={accounts}
        nextId={`TRF-${String(42 + transfers.length - seedTransfers.length).padStart(6, '0')}`}
        onOpenChange={setTransferOpen}
        onSave={(transfer) => {
          setTransfers((current) => [transfer, ...current]);
          setAccounts((current) => current.map((account) => {
            if (account.id === transfer.fromAccountId) return { ...account, balance: account.balance - transfer.amount, lastActivity: 'Just now' };
            if (account.id === transfer.toAccountId) return { ...account, balance: account.balance + transfer.amount, lastActivity: 'Just now' };
            return account;
          }));
          toast.success('Transfer completed', { description: transferAccountLabel(transfer, 'from', accounts) + ' → ' + transferAccountLabel(transfer, 'to', accounts) + ' · ' + taka(transfer.amount) });
        }}
      />

      <ChequeDialog
        open={chequeOpen}
        accountOptions={accounts.filter((item) => item.status === 'Active' && item.type === 'Bank')}
        onOpenChange={setChequeOpen}
        onSave={(cheque) => {
          setChequeRecords((current) => [cheque, ...current]);
          toast.success('Cheque saved', { description: cheque.direction + ' · ' + taka(cheque.amount) });
        }}
      />

      <FinancePeopleManagerDialog
        open={peopleOpen}
        people={people}
        onOpenChange={setPeopleOpen}
        onAdd={(person) => {
          setPeople((current) => [...current, person]);
          toast.success('Finance person added', { description: person.name + ' · ' + person.roles.join(', ') });
        }}
        onUpdate={(person) => {
          setPeople((current) => current.map((item) => item.id === person.id ? person : item));
          setTransactions((current) => current.map((item) => item.partyId === person.id ? { ...item, party: person.name } : item));
          toast.success('Finance person updated', { description: person.name });
        }}
      />

      <ChequeActionDialog
        cheque={chequeAction}
        accounts={accounts}
        onClose={() => setChequeAction(null)}
        onUpdate={updateCheque}
        onStatus={changeChequeStatus}
      />

      <CashSessionDetailsDialog
        session={cashSessionAction}
        onClose={() => setCashSessionAction(null)}
        onReconcile={(session) => navigate(`/app/reconciliation?account=${encodeURIComponent('Main Cash Counter')}&session=${encodeURIComponent(session.id)}`)}
      />

      <FinanceTransactionActionDialog
        transaction={transactionAction}
        accounts={accounts}
        people={people}
        onClose={() => setTransactionAction(null)}
        onUpdate={updateFinanceTransaction}
        onReverse={reverseFinanceTransaction}
      />

      <FinanceAccountActionDialog
        account={accountAction}
        accounts={accounts}
        transactions={transactions}
        transfers={transfers}
        onClose={() => setAccountAction(null)}
        onUpdate={updateFinanceAccount}
        onToggleStatus={toggleFinanceAccount}
        onManualEntry={addManualAccountEntry}
        onTransfer={(account) => { setAccountAction(null); openTransfer(account); }}
        onReconcile={(account) => { setAccountAction(null); navigate(`/app/reconciliation?account=${encodeURIComponent(account.name)}`); }}
      />

      <FinanceTransferActionDialog
        transfer={transferAction}
        onClose={() => setTransferAction(null)}
        onReverse={reverseAccountTransfer}
      />
    </div>
  );
}

