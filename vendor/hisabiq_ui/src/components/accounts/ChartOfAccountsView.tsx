import {matchesSearch as fuzzyMatch} from '../../utils/fuzzySearch';
import { useMemo, useState } from 'react';
import { MoreHorizontal, Pencil, Plus, Power, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../Button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../Dialog';
import { FormSelect } from '../FormSelect';
import { Input } from '../Input';
import { StatusBadge } from '../StatusBadge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../Table';
import { FloatingPanel } from '../layout/FloatingPanel';
import { accountingAccounts } from '../../data/accounting';
import type { AccountingAccount, AccountingGroup } from '../../types/accounting';
import type { TerminologyMode } from '../../types/transactions';
import { accountingAccountLabel } from '../../utils/accountingLabels';

const groups: AccountingGroup[] = ['Asset', 'Liability', 'Equity', 'Income', 'Expense'];

export function ChartOfAccountsView({
  terminologyMode,
  onOpeningBalance
}: {
  terminologyMode: TerminologyMode;
  onOpeningBalance?: () => void;
}) {
  const [accounts, setAccounts] = useState<AccountingAccount[]>(accountingAccounts);
  const [query, setQuery] = useState('');
  const [groupFilter, setGroupFilter] = useState('All groups');
  const [editing, setEditing] = useState<AccountingAccount | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [helperBn, setHelperBn] = useState('');
  const [group, setGroup] = useState<AccountingGroup>('Asset');
  const [parent, setParent] = useState('');

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return accounts.filter((account) => {
      const matchesQuery = fuzzyMatch(needle,[account.code,account.name,account.helperBn,account.parent]);
      const matchesGroup = groupFilter === 'All groups' || account.group === groupFilter;
      return matchesQuery && matchesGroup;
    });
  }, [accounts, groupFilter, query]);

  const openCreate = () => {
    setEditing(null);
    setCode(String(7000 + accounts.length * 10));
    setName('');
    setHelperBn('');
    setGroup('Expense');
    setParent('Custom');
    setDialogOpen(true);
  };

  const openEdit = (account: AccountingAccount) => {
    setEditing(account);
    setCode(account.code);
    setName(account.name);
    setHelperBn(account.helperBn);
    setGroup(account.group);
    setParent(account.parent);
    setDialogOpen(true);
  };

  const save = () => {
    if (!code.trim() || !name.trim()) return toast.error('Code and account name are required');
    if (editing) {
      setAccounts((current) => current.map((item) => item.id === editing.id ? { ...item, code: code.trim(), name: name.trim(), helperBn: helperBn.trim(), group, parent: parent.trim() || group } : item));
      toast.success('Account updated', { description: name.trim() });
    } else {
      const account: AccountingAccount = {
        id: 'custom-' + Date.now(),
        code: code.trim(),
        name: name.trim(),
        helperBn: helperBn.trim() || 'কাস্টম হিসাবের খাত',
        group,
        parent: parent.trim() || group,
        active: true
      };
      setAccounts((current) => [...current, account]);
      toast.success('Account added', { description: account.name });
    }
    setDialogOpen(false);
  };

  const toggleStatus = (account: AccountingAccount) => {
    setAccounts((current) => current.map((item) => item.id === account.id ? { ...item, active: !item.active } : item));
    toast.success(account.active ? 'Account deactivated' : 'Account activated', { description: account.name });
  };

  return (
    <div className="p-4">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-ink">Chart of Accounts</p>
          <p className="font-bn text-[11px] text-ink-400">ব্যবসার সব হিসাবের খাত — HisabIQ প্রয়োজনীয় খাত আগে থেকেই তৈরি করে দেয়</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {onOpeningBalance && <Button variant="outline" size="sm" onClick={onOpeningBalance}>Opening balance</Button>}
          <Button size="sm" onClick={openCreate}><Plus className="size-4" /> Add account</Button>
        </div>
      </div>

      <div className="mb-3 flex flex-col gap-2 sm:flex-row">
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute z-10 left-2.5 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
          <Input className="pl-8" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search code, account or group" />
        </div>
        <FormSelect className="sm:w-44" value={groupFilter} onChange={(event) => setGroupFilter(event.target.value)} options={['All groups', ...groups]} />
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-9 pl-4 text-xs">Code</TableHead>
              <TableHead className="h-9 text-xs">Account</TableHead>
              <TableHead className="h-9 text-xs">Group</TableHead>
              <TableHead className="h-9 text-xs">Parent</TableHead>
              <TableHead className="h-9 text-xs">Status</TableHead>
              <TableHead className="h-9 pr-4 text-right text-xs">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((account) => (
              <TableRow key={account.id} className="text-[13px]">
                <TableCell className="py-2 pl-4 text-ink-500">{account.code}</TableCell>
                <TableCell className="py-2">
                  <p className="font-medium text-ink">{accountingAccountLabel(account, terminologyMode)}</p>
                  <p data-table-helper="" className="font-bn text-[10.5px] text-ink-400">{account.helperBn}</p>
                </TableCell>
                <TableCell className="py-2 text-ink-600">{account.group}</TableCell>
                <TableCell className="py-2 text-ink-500">{account.parent}</TableCell>
                <TableCell className="py-2"><StatusBadge tone={account.active ? 'success' : 'neutral'} dot>{account.active ? 'Active' : 'Inactive'}</StatusBadge></TableCell>
                <TableCell className="py-2 pr-4 text-right">
                  <FloatingPanel
                    label={'Account actions for ' + account.name}
                    width={190}
                    trigger={({ toggle }) => <button onClick={toggle} className="rounded-md p-1.5 text-ink-400 hover:bg-ink-50 hover:text-ink" aria-label={'Actions for ' + account.name}><MoreHorizontal className="size-4" /></button>}>
                    {(close) => <div className="py-1">
                      <button className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12.5px] text-ink-700 hover:bg-ink-50" onClick={() => { close(); openEdit(account); }}><Pencil className="size-3.5" /> Edit</button>
                      <button className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12.5px] text-ink-700 hover:bg-ink-50" onClick={() => { close(); toggleStatus(account); }}><Power className="size-3.5" /> {account.active ? 'Deactivate' : 'Activate'}</button>
                    </div>}
                  </FloatingPanel>
                </TableCell>
              </TableRow>
            ))}
            {!filtered.length && <TableRow><TableCell colSpan={6} className="py-12 text-center text-sm text-ink-400">No accounts match this filter.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? 'Edit account' : 'Add account'} <span className="font-bn text-sm font-normal text-ink-400">· হিসাবের খাত</span></DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-[13px] font-medium text-ink">Code<Input className="mt-1.5" value={code} onChange={(event) => setCode(event.target.value.replace(/[^\d]/g, ''))} /></label>
            <label className="text-[13px] font-medium text-ink">Group<FormSelect className="mt-1.5" value={group} onChange={(event) => setGroup(event.target.value as AccountingGroup)} options={groups} /></label>
            <label className="text-[13px] font-medium text-ink sm:col-span-2">Account name<Input className="mt-1.5" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Generator Repair Expense" /></label>
            <label className="text-[13px] font-medium text-ink">Parent group<Input className="mt-1.5" value={parent} onChange={(event) => setParent(event.target.value)} placeholder={group} /></label>
            <label className="text-[13px] font-medium text-ink">Bangla helper<Input className="mt-1.5 font-bn" value={helperBn} onChange={(event) => setHelperBn(event.target.value)} placeholder="সহজ বাংলা ব্যাখ্যা" /></label>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={save}>{editing ? 'Save changes' : 'Add account'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

