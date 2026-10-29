import { useMemo, useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../Button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../Dialog';
import { FormSelect } from '../FormSelect';
import { Input } from '../Input';
import { accountingAccounts } from '../../data/accounting';
import type { AccountingSourceTransaction } from '../../types/accounting';
import { openingBalanceLines } from '../../utils/moduleUiActions';

const supportedIds = new Set([
  'asset-cash', 'asset-bank', 'asset-mfs', 'asset-ar', 'asset-inventory',
  'liability-ap', 'liability-loan', 'equity-capital'
]);

export function OpeningBalanceDialog({
  open,
  onOpenChange,
  onSave
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (source: AccountingSourceTransaction) => void;
}) {
  const accounts = accountingAccounts.filter((item) => supportedIds.has(item.id));
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('2026-10-01');
  const [note, setNote] = useState('');
  const account = useMemo(() => accounts.find((item) => item.id === accountId) ?? accounts[0], [accountId, accounts]);

  const save = () => {
    const value = parseFloat(amount) || 0;
    if (!account || value <= 0) return toast.error('Choose an account and enter an opening amount');
    onSave({
      id: 'opening-' + Date.now(),
      source: 'opening-balance',
      reference: 'OPEN-' + String(Date.now()).slice(-6),
      transactionDate: date,
      createdAt: '2026-10-07T16:10:00+06:00',
      postedBy: 'Shuvo',
      amount: value,
      paid: 0,
      due: 0,
      description: note.trim() || 'Opening balance · ' + account.name,
      lines: openingBalanceLines(account.id, account.group, value),
      recordStatus: 'Posted'
    });
    setAmount('');
    setNote('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Opening balance <span className="font-bn text-sm font-normal text-ink-400">· শুরুর হিসাব</span></DialogTitle>
          <DialogDescription>Enter the balance that existed before HisabIQ started. The balanced accounting entry is created automatically.</DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-teal-100 bg-teal-50/50 p-3 text-[12px] text-teal-900">
          <div className="flex gap-2"><PlusCircle className="mt-0.5 size-4 shrink-0" /><div><p className="font-medium">Guided setup — no Debit/Credit needed</p><p className="mt-0.5 font-bn text-[10.5px] text-teal-700">আপনি শুধু কোন শুরুর ব্যালেন্স এবং কত টাকা ছিল তা দিন। দুই পাশ HisabIQ নিজে মিলাবে।</p></div></div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-[13px] font-medium text-ink sm:col-span-2">
            Opening balance account
            <FormSelect
              className="mt-1.5"
              value={account?.name ?? ''}
              onChange={(event) => {
                const next = accounts.find((item) => item.name === event.target.value);
                if (next) setAccountId(next.id);
              }}
              options={accounts.map((item) => item.name)}
            />
            {account && <span className="mt-1 block font-bn text-[10.5px] font-normal text-ink-400">{account.helperBn}</span>}
          </label>
          <label className="text-[13px] font-medium text-ink">
            Amount
            <div className="relative mt-1.5">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-400">৳</span>
              <Input className="pl-7 text-right" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value.replace(/[^\d.]/g, ''))} placeholder="0" />
            </div>
          </label>
          <label className="text-[13px] font-medium text-ink">
            As of date
            <Input className="mt-1.5" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </label>
          <label className="text-[13px] font-medium text-ink sm:col-span-2">
            Note
            <Input className="mt-1.5" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Optional setup note" />
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save}>Post opening balance</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
