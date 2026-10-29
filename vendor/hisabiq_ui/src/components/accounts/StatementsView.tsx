import { useMemo, useState } from 'react';
import { ArrowDownToLine, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../Button';
import { AppDateRangePicker } from '../AppDateRangePicker';
import { datePreset, type IsoRange } from '../../utils/dateRange';
import type { Posting } from '../../types/accounting';
import { accountingAccounts } from '../../data/accounting';
import { balanceSheet, profitAndLoss } from '../../utils/accountingProjection';
import { taka } from '../../utils/currency';
import {useUiCopy} from '../../i18n/useUiCopy';
import {printReport} from '../../utils/reportOutput';

function accountNet(postings: Posting[], accountId: string, from: string, to: string) {
  const account = accountingAccounts.find((item) => item.id === accountId);
  if (!account) return 0;
  return postings
    .filter((posting) => posting.status === 'Posted' && (!from || posting.transactionDate >= from) && (!to || posting.transactionDate <= to))
    .flatMap((posting) => posting.lines)
    .filter((line) => line.accountId === accountId)
    .reduce((sum, line) => sum + (account.group === 'Income' || account.group === 'Liability' || account.group === 'Equity'
      ? line.credit - line.debit
      : line.debit - line.credit), 0);
}

export function StatementsView({ postings }: { postings: Posting[] }) {
  const {text,language,showHelper}=useUiCopy();
  // Display demo Sep–Oct initially, but quick presets always use the actual business date.
  const [range, setRange] = useState<IsoRange>({ from: '2026-09-01', to: '2026-10-31' });
  const { from, to } = range;
  const pnl = useMemo(() => profitAndLoss(postings, {
    from: from || '0001-01-01', to: to || '9999-12-31'
  }), [from, postings, to]);
  const sheet = useMemo(() => balanceSheet(postings, to || '9999-12-31'), [postings, to]);
  const sales = accountNet(postings, 'income-sales', from, to);
  const cogs = accountNet(postings, 'expense-cogs', from, to);
  const otherIncome = Math.max(0, pnl.income - sales);
  const operatingExpenses = Math.max(0, pnl.expenses - cogs);
  const grossProfit = sales - cogs;

  const setPreset = (preset: 'month' | 'quarter' | 'year') => {
    const key = preset === 'month' ? 'This month' : preset === 'quarter' ? 'This quarter' : 'This year';
    setRange(datePreset(key));
  };

  const exportCsv = () => {
    const csv = [
      ['Statement', 'Line', 'Amount'],
      ['Profit & Loss', 'Sales Revenue', sales],
      ['Profit & Loss', 'Other Income', otherIncome],
      ['Profit & Loss', 'Cost of Goods Sold', cogs],
      ['Profit & Loss', 'Gross Profit', grossProfit],
      ['Profit & Loss', 'Operating Expenses', operatingExpenses],
      ['Profit & Loss', 'Net Profit', pnl.netProfit],
      ['Balance Sheet', 'Assets', sheet.assets],
      ['Balance Sheet', 'Liabilities', sheet.liabilities],
      ['Balance Sheet', 'Equity', sheet.equity]
    ].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'financial-statements-' + (from || 'all') + '-to-' + (to || 'all') + '.csv';
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success(text('Statements exported','আর্থিক প্রতিবেদন ডাউনলোড হয়েছে'));
  };

  const printStatements=()=>{
    const sections:[string,string,number][]= [['Profit & Loss','Sales Revenue',sales],['Profit & Loss','Other Income',otherIncome],['Profit & Loss','Cost of Goods Sold',cogs],['Profit & Loss','Gross Profit',grossProfit],['Profit & Loss','Operating Expenses',operatingExpenses],['Profit & Loss','Net Profit',pnl.netProfit],['Balance Sheet','Assets',sheet.assets],['Balance Sheet','Liabilities',sheet.liabilities],['Balance Sheet','Equity',sheet.equity]];
    const bn:Record<string,string>={'Profit & Loss':'লাভ-ক্ষতি','Sales Revenue':'বিক্রির আয়','Other Income':'অন্যান্য আয়','Cost of Goods Sold':'বিক্রি হওয়া পণ্যের খরচ','Gross Profit':'মোট লাভ','Operating Expenses':'ব্যবসার খরচ','Net Profit':'নিট লাভ','Balance Sheet':'ব্যালেন্স শিট',Assets:'সম্পদ',Liabilities:'দেনা',Equity:'মালিকের মূলধন'};
    const label=(s:string)=>text(s,bn[s]??s);
    if(!printReport({title:text('Financial statements','আর্থিক প্রতিবেদন'),language,subtitle:`${from||'—'} — ${to||'—'} · ${text('Transaction Date','লেনদেনের তারিখ')}`,headers:[text('Statement','প্রতিবেদন'),text('Line','খাত'),text('Amount','টাকা')],rows:sections.map(([section,line,value])=>[label(section),label(line),value])}))toast.error(text('Allow the print popup and try again.','প্রিন্ট উইন্ডো খুলতে দিন, তারপর আবার চেষ্টা করুন।'));
  };
  return (
    <div className="p-4">
      <div className="mb-4 flex flex-wrap items-end gap-2">
        <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
          <button onClick={() => setPreset('month')} className="rounded-md px-2.5 py-1.5 text-[11px] font-medium text-ink-600 hover:bg-ink-50">{text('This month','এই মাস')}</button>
          <button onClick={() => setPreset('quarter')} className="rounded-md px-2.5 py-1.5 text-[11px] font-medium text-ink-600 hover:bg-ink-50">{text('Quarter','ত্রৈমাসিক')}</button>
          <button onClick={() => setPreset('year')} className="rounded-md px-2.5 py-1.5 text-[11px] font-medium text-ink-600 hover:bg-ink-50">{text('Year','এই বছর')}</button>
        </div>
        <AppDateRangePicker label={text("Financial statements date range","আর্থিক প্রতিবেদনের তারিখ")}
          className="w-full sm:w-[286px]" value={range} onChange={setRange} />
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCsv}><ArrowDownToLine className="size-4" /> {text('Export','ডাউনলোড')}</Button>
          <Button variant="outline" size="sm" onClick={printStatements}><Printer className="size-4" /> {text('Print','প্রিন্ট')}</Button>
        </div>
        <p className="w-full text-right text-[10.5px] text-ink-400">{text('Financial statements always use Transaction Date.','আর্থিক প্রতিবেদন সবসময় লেনদেনের তারিখ অনুযায়ী তৈরি হয়।')}</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="overflow-hidden rounded-xl border border-border">
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-semibold text-ink">{text('Profit & Loss','লাভ-ক্ষতি')}</p>
            <p className="font-bn text-[11px] text-ink-400">কত লাভ বা ক্ষতি হয়েছে</p>
          </div>
          <div className="space-y-2 p-4 text-[13px]">
            <div className="flex justify-between"><span className="text-ink-500">{text('Sales Revenue','বিক্রির আয়')}</span><span>{taka(sales)}</span></div>
            {otherIncome > 0 && <div className="flex justify-between"><span className="text-ink-500">{text('Other Income','অন্যান্য আয়')}</span><span>{taka(otherIncome)}</span></div>}
            <div className="flex justify-between"><span className="text-ink-500">{text('Cost of Goods Sold','বিক্রি হওয়া পণ্যের খরচ')}</span><span>−{taka(cogs)}</span></div>
            <div className="flex justify-between border-t border-border pt-2 font-semibold"><span>{text('Gross Profit','মোট লাভ')} {showHelper&&<span className="font-bn text-[11px] font-normal text-ink-400">· পণ্য বিক্রির লাভ</span>}</span><span>{grossProfit < 0 ? '−' : ''}{taka(Math.abs(grossProfit))}</span></div>
            <div className="flex justify-between"><span className="text-ink-500">{text('Operating Expenses','ব্যবসার খরচ')}</span><span>−{taka(operatingExpenses)}</span></div>
            <div className="flex justify-between border-t border-border pt-2 text-sm font-semibold"><span>{text('Net Profit','নিট লাভ')} {showHelper&&<span className="font-bn text-[11px] font-normal text-ink-400">· সব খরচের পর লাভ</span>}</span><span className={pnl.netProfit < 0 ? 'text-danger' : 'text-success'}>{pnl.netProfit < 0 ? '−' : ''}{taka(Math.abs(pnl.netProfit))}</span></div>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-border">
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-semibold text-ink">{text('Balance Sheet','ব্যালেন্স শিট')}</p>
            <p className="font-bn text-[11px] text-ink-400">ব্যবসার সম্পদ, দেনা ও মালিকের অংশ</p>
          </div>
          <div className="space-y-2 p-4 text-[13px]">
            <div className="flex justify-between"><span className="text-ink-500">{text('Assets','সম্পদ')}</span><span>{taka(sheet.assets)}</span></div>
            <div className="flex justify-between"><span className="text-ink-500">{text('Liabilities','দেনা')}</span><span>{taka(sheet.liabilities)}</span></div>
            <div className="flex justify-between"><span className="text-ink-500">{text('Equity','মালিকের মূলধন')}</span><span>{taka(sheet.equity)}</span></div>
            <div className="flex justify-between border-t border-border pt-2 font-semibold">
              <span>{text('Books check','হিসাব মেলানো')}</span>
              <span className={sheet.balanced ? 'text-success' : 'text-danger'}>{sheet.balanced ? text('Balanced','হিসাব মিলেছে') : text('Needs review','মিলিয়ে দেখুন')}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

