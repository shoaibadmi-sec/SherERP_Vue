import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../Button';
import { FormSelect } from '../FormSelect';
import { Input } from '../Input';
import { financeAccountOptionLabel, type FinanceAccount } from '../../data/financeAccounts';
import { taka } from '../../utils/currency';
import {useUiCopy} from '../../i18n/useUiCopy';
import {financeLabel} from '../../i18n/financeCopy';

import { accountsForFinanceMethod, normalizeFinancePaymentSplits, type FinancePaymentDraft } from '../../utils/financePaymentDrafts';
export type { FinancePaymentDraft } from '../../utils/financePaymentDrafts';

export function FinancePaymentSplitEditor({
  accounts,
  rows,
  onChange,
  totalAmount, onCreateAccount, preserveInactiveSelected = false
}: {
  accounts: FinanceAccount[];
  rows: FinancePaymentDraft[];
  onChange: (rows: FinancePaymentDraft[]) => void;
  totalAmount: number;
  onCreateAccount?: (rowId:string, method:FinancePaymentDraft['method']) => void;
  /** Used in historical correction forms to show the source already saved on the record. */
  preserveInactiveSelected?: boolean;
}) {
  const {text,language,showHelper}=useUiCopy();
  const normalized = normalizeFinancePaymentSplits(rows, accounts, totalAmount);
  const splitTotal = normalized.reduce((sum, row) => sum + row.amount, 0);

  const add = () => {
    const method: FinancePaymentDraft['method'] = 'Cash';
    onChange([...rows, {
      id: 'finance-payment-' + Date.now(),
      method,
      accountId: accountsForFinanceMethod(accounts, method)[0]?.id ?? '',
      amount: ''
    }]);
  };

  return (
    <div className="rounded-xl border border-border sm:col-span-2">
      <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
        <div>
          <p className="text-[12.5px] font-semibold text-ink">{text('Payment sources','টাকার মাধ্যম')}</p>
          {showHelper&&<p className="font-bn text-[10.5px] text-ink-400">ক্যাশ + ব্যাংক + মোবাইল ব্যাংকিং একসঙ্গে ব্যবহার করা যাবে</p>}
        </div>
        <Button variant="outline" size="sm" onClick={add}><Plus className="size-3.5" /> {text('Add','যোগ করুন')}</Button>
      </div>
      <div className="space-y-2 p-3">
        {rows.map((row) => {
          const available = accountsForFinanceMethod(accounts, row.method);
          const inactiveSelected = preserveInactiveSelected
            ? accounts.find((item) => item.id === row.accountId && item.status === 'Inactive')
            : undefined;
          const choices = inactiveSelected ? [...available, inactiveSelected] : available;
          const selected = choices.find((item) => item.id === row.accountId) ?? available[0];
          return (
            <div key={row.id} className="grid gap-2 sm:grid-cols-[130px_1fr_120px_32px]">
              <FormSelect
                value={row.method}
                onChange={(event) => {
                  const method = event.target.value as FinancePaymentDraft['method'];
                  const first = accountsForFinanceMethod(accounts, method)[0];
                  onChange(rows.map((item) => item.id === row.id ? { ...item, method, accountId: first?.id ?? '' } : item));
                }}
                options={(['Cash', 'Bank', 'Mobile Banking'] as const).map(value=>({value,label:financeLabel(language,value)}))}
              />
              <div className="min-w-0 space-y-1">
              <FormSelect
                value={selected?.id ?? ''}
                aria-label={selected
                  ? text('Payment account','টাকার হিসাব') + ': ' + selected.name + (selected.status === 'Inactive' ? ' · ' + financeLabel(language,'Inactive') : '')
                  : text('Payment account','টাকার হিসাব')}
                onChange={(event) => {
                  const account = choices.find((item) => item.id === event.target.value);
                  onChange(rows.map((item) => item.id === row.id ? { ...item, accountId: account?.id ?? '' } : item));
                }}
                options={choices.map((item) => ({
                  value: item.id,
                  label: financeAccountOptionLabel(item, choices)
                    + (item.status === 'Inactive' ? ' · ' + financeLabel(language, 'Inactive') : '')
                }))}
              />
              {onCreateAccount && <Button variant="outline" size="sm" onClick={() => onCreateAccount(row.id, row.method)}>{text('Add account','হিসাব যোগ করুন')}</Button>}
              </div>
              <Input
                className="text-right"
                inputMode="decimal"
                value={row.amount}
                onChange={(event) => onChange(rows.map((item) => item.id === row.id ? { ...item, amount: event.target.value.replace(/[^\d.]/g, '') } : item))}
                placeholder={rows.length === 1 ? String(totalAmount || 0) : '0'}
              />
              <button
                type="button"
                disabled={rows.length === 1}
                onClick={() => onChange(rows.filter((item) => item.id !== row.id))}
                className="flex size-8 items-center justify-center rounded-md text-ink-400 hover:bg-danger/5 hover:text-danger disabled:opacity-30"
                aria-label={text("Remove payment source","পেমেন্টের মাধ্যম সরান")}>
                <Trash2 className="size-3.5" />
              </button>
            </div>
          );
        })}
        <div className="flex items-center justify-between border-t border-border pt-2 text-[11px]">
          <span className="text-ink-400">{text('Split total','মাধ্যমগুলোর মোট')}</span>
          <span className={Math.abs(splitTotal - totalAmount) < 0.001 ? 'font-medium text-success' : 'font-medium text-warning'}>{taka(splitTotal)}</span>
        </div>
      </div>
    </div>
  );
}

