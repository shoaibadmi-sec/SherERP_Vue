import { Search } from 'lucide-react';
import { AppSelect } from '../AppSelect';
import { AppDateRangePicker } from '../AppDateRangePicker';
import { datePreset } from '../../utils/dateRange';
import { Input } from '../Input';
import {useUiCopy} from '../../i18n/useUiCopy';
import type { EntryDateView, UnifiedTransaction } from '../../types/transactions';

export type DaybookFilterState = {
  search: string;
  from: string;
  to: string;
  type: string;
  account: string;
  user: string;
  status: string;
};

export function DaybookFilters({
  value,
  onChange,
  transactions,
  dateView
}: {
  value: DaybookFilterState;
  onChange: (next: DaybookFilterState) => void;
  transactions: UnifiedTransaction[];
  dateView: EntryDateView;
}) {
  const {text}=useUiCopy();
  const typeBn:Record<string,string>={'Sale':'বিক্রি','Purchase':'ক্রয়','Expense':'খরচ','Receipt':'টাকা পাওয়া','Payment':'টাকা দেওয়া','Transfer':'টাকা স্থানান্তর','Cash session':'ক্যাশ সেশন'};
  const types = Array.from(new Set(transactions.map((item) => item.type))).sort();
  const accounts = Array.from(new Set(transactions.flatMap((item) => item.accounts))).sort();
  const users = Array.from(new Set(transactions.map((item) => item.postedBy))).sort();
  const set = (key: keyof DaybookFilterState, next: string) => onChange({ ...value, [key]: next });


  return (
    <div className="space-y-2 border-b border-border p-3">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1 lg:max-w-md">
          <Search className="pointer-events-none absolute z-10 left-2.5 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
          <Input value={value.search} onChange={(event) => set('search', event.target.value)} className="pl-8" placeholder={text("Search transaction, party, reference or amount","লেনদেন, নাম, নম্বর বা টাকা খুঁজুন")} />
        </div>
        <AppDateRangePicker label={text("Daybook date range","দৈনিক খাতার তারিখ")} className="w-full sm:w-[265px]"
          value={{ from: value.from, to: value.to }}
          onChange={({ from, to }) => onChange({ ...value, from, to })} />
        <span className="whitespace-nowrap text-[10.5px] text-ink-400">
          {dateView === 'transaction' ? text('Transaction Date · যে তারিখের লেনদেন','লেনদেনের তারিখ') : text('Created Date · যেদিন এন্ট্রি হয়েছে','লেখার তারিখ')}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <AppSelect label={text("Transaction type","লেনদেনের ধরন")} className="w-40" value={value.type} onChange={(type) => set('type', type)} options={[{value:'All types',label:text('All types','সব ধরন')},...types.map(v=>({value:v,label:text(v,typeBn[v]??v)}))]} />
        <AppSelect label={text("Account","হিসাব")} className="w-44" value={value.account} onChange={(account) => set('account', account)} options={[{value:'All accounts',label:text('All accounts','সব হিসাব')},...accounts]} />
        <AppSelect label={text("Posted by","যিনি লিখেছেন")} className="w-36" value={value.user} onChange={(user) => set('user', user)} options={[{value:'All users',label:text('All users','সব ব্যবহারকারী')},...users]} />
        <AppSelect label={text("Status","অবস্থা")} className="w-36" value={value.status} onChange={(status) => set('status', status)} options={['All status', 'Posted', 'Draft', 'Deleted', 'Reversed'].map(v=>({value:v,label:text(v,v==='All status'?'সব অবস্থা':v==='Posted'?'লেখা হয়েছে':v==='Draft'?'খসড়া':v==='Deleted'?'মুছে ফেলা':'উল্টো হিসাব')}))} />
        <button type="button" onClick={() => onChange({ search: '', ...datePreset('Today'), type: 'All types', account: 'All accounts', user: 'All users', status: 'All status' })} className="px-2 py-1 text-[11px] font-medium text-ink-400 hover:text-ink">{text('Reset','ফিল্টার মুছুন')}</button>
      </div>
    </div>
  );
}

