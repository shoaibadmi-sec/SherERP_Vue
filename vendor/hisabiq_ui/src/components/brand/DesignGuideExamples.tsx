import { useId, useState, type ReactNode } from 'react';
import { Eye, Plus, Search } from 'lucide-react';
import { TenantSettingsProvider } from '../../settings/TenantSettingsProvider';
import { useUiCopy } from '../../i18n/useUiCopy';
import { MotionTabIndicator, MotionTabList } from '../../motion/MotionTabList';
import { Button } from '../Button';
import { Input } from '../Input';
import { Panel } from '../Panel';
import { AppSelect } from '../AppSelect';
import { SearchSelect } from '../SearchSelect';
import { AppDateRangePicker } from '../AppDateRangePicker';
import { Switch } from '../Switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../Dialog';
import { StatusBadge } from '../StatusBadge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../Table';
import { taka } from '../../utils/currency';

function Field({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return <div className="min-w-0"><label htmlFor={id} className="mb-1.5 block text-[13px] font-medium text-ink">{label}</label>{children}</div>;
}

function Examples() {
  const { text, language } = useUiCopy();
  const id = useId();
  const [tab, setTab] = useState('fields');
  const [note, setNote] = useState('');
  const [search, setSearch] = useState('');
  const [amount, setAmount] = useState('1250');
  const [method, setMethod] = useState('cash');
  const [party, setParty] = useState('rahman');
  const [options, setOptions] = useState([{ value: 'rahman', label: 'Rahman Hardware · রহমান হার্ডওয়্যার', meta: '01711-123456' }, { value: 'karim', label: 'Karim Store · করিম স্টোর', meta: '01811-234567' }]);
  const [dates, setDates] = useState({ from: '2026-10-01', to: '2026-10-26' });
  const [enabled, setEnabled] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [notice, setNotice] = useState('');
  const tabs = [{ value: 'fields', label: text('Fields & overlays', 'ফিল্ড ও ডায়ালগ') }, { value: 'table', label: text('Table & states', 'টেবিল ও অবস্থা') }];
  const chooseTab = (index: number) => {
    const next = tabs[index].value;
    setTab(next);
    document.getElementById(id + '-tab-' + next)?.focus();
  };
  const rows = [
    { name: 'PVC Pipe 1 inch', bn: 'পিভিসি পাইপ', qty: 4, price: 420, state: 'paid' },
    { name: 'LED Bulb 12W', bn: 'এলইডি বাল্ব', qty: 2, price: 1550, state: 'partial' },
  ].filter((row) => (row.name + row.bn).toLowerCase().includes(search.toLowerCase()));
  return <section id="live-components" aria-labelledby="live-components-title" style={{ fontFeatureSettings: 'normal', fontVariantNumeric: 'normal' }} className="mx-auto max-w-[1280px] scroll-mt-20 px-4 py-8 sm:px-6">
    <div className="mb-5"><h2 id="live-components-title" className="text-xl font-semibold text-ink">{text('Try the actual shared components', 'একই উপাদান ব্যবহার করে দেখুন')}</h2>
      <p className="mt-1 text-sm text-ink-500">{text('Local samples only. Changes here do not record transactions or create business data.', 'এগুলো শুধু নমুনা। এখানে কোনো লেনদেন বা ব্যবসার তথ্য জমা হয় না।')}</p></div>
    <div className="mb-5 overflow-x-auto border-b border-border">
      <MotionTabList aria-label={text('Component examples', 'উপাদানের নমুনা')} className="flex min-w-max gap-4">
        {tabs.map((item, index) => <button key={item.value} type="button" role="tab" id={id + '-tab-' + item.value} aria-controls={id + '-panel-' + item.value} aria-selected={tab === item.value} tabIndex={tab === item.value ? 0 : -1}
          onClick={() => setTab(item.value)} onKeyDown={(event) => {
            if (event.key === 'ArrowRight' || event.key === 'ArrowLeft' || event.key === 'Home' || event.key === 'End') {
              event.preventDefault(); chooseTab(event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length);
            }
          }} className={'relative px-2 py-3 text-[13px] font-medium ' + (tab === item.value ? 'text-ink' : 'text-ink-500')}>
          {item.label}<MotionTabIndicator active={tab === item.value} />
        </button>)}
      </MotionTabList>
    </div>
    <div role="tabpanel" id={id + '-panel-fields'} aria-labelledby={id + '-tab-fields'} hidden={tab !== 'fields'}>
      <div className="grid gap-4 md:grid-cols-2">
        <Panel title={text('Inputs & selectors', 'ইনপুট ও বাছাই')}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id={id + '-note'} label={text('Note', 'নোট')}><Input id={id + '-note'} value={note} onChange={(event) => setNote(event.target.value)} placeholder={text('Write a short note', 'একটি ছোট নোট লিখুন')} /></Field>
            <Field id={id + '-amount'} label={text('Amount · ৳', 'টাকার পরিমাণ · ৳')}><Input id={id + '-amount'} inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} className="text-right" /></Field>
            <Field id={id + '-method'} label={text('Payment method', 'পেমেন্ট মাধ্যম')}><AppSelect id={id + '-method'} label={text('Payment method', 'পেমেন্ট মাধ্যম')} value={method} onChange={setMethod} options={[{ value: 'cash', label: text('Cash', 'ক্যাশ') }, { value: 'bank', label: text('Bank', 'ব্যাংক') }, { value: 'mfs', label: text('MFS', 'মোবাইল ব্যাংকিং') }]} /></Field>
            <Field id={id + '-party'} label={text('Customer', 'ক্রেতা')}><SearchSelect id={id + '-party'} ariaLabel={text('Sample customer', 'নমুনা ক্রেতা')} noun={{ en: 'customer', bn: 'ক্রেতা' }} value={party} options={options} onChange={setParty} onCreate={(name) => { const value = 'sample-' + options.length; setOptions((current) => [...current, { value, label: name, meta: 'Local guide sample' }]); return value; }} /></Field>
            <div className="sm:col-span-2"><p className="mb-1.5 text-[13px] font-medium text-ink">{text('Date range', 'তারিখের সীমা')}</p><AppDateRangePicker label={text('Sample date range', 'নমুনা তারিখের সীমা')} value={dates} onChange={setDates} /></div>
            <Field id={id + '-invalid'} label={text('Phone · invalid example', 'মোবাইল · ভুল নমুনা')}><Input id={id + '-invalid'} type="tel" value="01711-48" readOnly aria-invalid="true" aria-describedby={id + '-error'} /><p id={id + '-error'} className="mt-1 text-xs text-danger">{text('Enter an 11-digit mobile number.', '১১ সংখ্যার মোবাইল নম্বর দিন।')}</p></Field>
            <Field id={id + '-readonly'} label={text('Reference · read-only', 'রেফারেন্স · শুধু দেখুন')}><Input id={id + '-readonly'} value="SAMPLE-1024" readOnly /></Field>
            <div className="flex items-center gap-2 text-sm text-ink"><Switch aria-label={text('Show sample details', 'নমুনার বিস্তারিত দেখান')} checked={enabled} onCheckedChange={setEnabled} />{text('Show sample details', 'নমুনার বিস্তারিত দেখান')}</div>
            <Field id={id + '-disabled'} label={text('Disabled field', 'বন্ধ ফিল্ড')}><Input id={id + '-disabled'} value="Unavailable in sample" disabled /></Field>
          </div>
        </Panel>
        <Panel title={text('Actions & confirmation', 'কাজ ও নিশ্চিতকরণ')}>
          <div className="flex flex-wrap gap-2">
            {(['default', 'outline', 'secondary', 'ghost', 'destructive', 'link'] as const).map((variant) => <Button key={variant} variant={variant} onClick={() => { setNotice(''); setDialog(true); }}>{variant}</Button>)}
            <Button variant="outline" size="icon" aria-label={text('Open sample preview', 'নমুনা দেখুন')} onClick={() => setDialog(true)}><Eye className="size-4" aria-hidden="true" /></Button>
            <Button disabled>{text('Disabled', 'বন্ধ')}</Button>
          </div>
          <p className="my-4 text-xs leading-5 text-ink-500">{text('All normal actions are 36px. Each active specimen opens the same local preview; destructive styling does not delete anything here.', 'সাধারণ সব বোতাম ৩৬ পিক্সেল। বোতাম চাপলে শুধু নমুনা ডায়ালগ খোলে।')}</p>
          <Button data-erp-workflow-action="complete" className="w-full text-[15px] font-semibold" onClick={() => setDialog(true)}><Plus className="size-4" aria-hidden="true" />{text('Preview checkout · 48px', 'চেকআউট নমুনা · ৪৮ পিক্সেল')}</Button>
          <label className="mt-5 block text-[13px] font-medium text-ink" htmlFor={id + '-notes'}>{text('Multiline note', 'বিস্তারিত নোট')}</label>
          <textarea id={id + '-notes'} rows={3} className="mt-1.5 w-full resize-y rounded-lg border border-input bg-card p-3 text-sm text-ink" defaultValue={text('A multiline field grows with its content.', 'বড় নোটের জন্য একাধিক লাইন থাকবে।')} />
          <p role="status" className="mt-3 min-h-5 text-xs text-ink-500">{notice}</p>
          {enabled && <p className="mt-3 text-xs leading-5 text-ink-500">Source: Button, Input/NumericInput, AppSelect, SearchSelect, AppDateRangePicker, Switch and Dialog. No replacement primitives.</p>}
        </Panel>
      </div>
    </div>
    <div role="tabpanel" id={id + '-panel-table'} aria-labelledby={id + '-tab-table'} hidden={tab !== 'table'}>
      <Panel title={text('Products table roles', 'পণ্যের টেবিলের মাপ')} subtitle="13px data · 12px heading · 11px helper/badge" actions={<div className="flex items-center gap-2"><Search className="size-4 text-ink-400" aria-hidden="true" /><Input type="search" aria-label={text('Search sample rows', 'নমুনা সারি খুঁজুন')} value={search} onChange={(event) => setSearch(event.target.value)} /></div>} bodyClassName="p-0">
        <Table><TableHeader><TableRow><TableHead scope="col">{text('Product', 'পণ্য')}</TableHead><TableHead scope="col" className="text-right">{text('Qty', 'পরিমাণ')}</TableHead><TableHead scope="col" className="text-right">{text('Price', 'দাম')}</TableHead><TableHead scope="col" className="text-right">{text('Total', 'মোট')}</TableHead><TableHead scope="col">{text('State', 'অবস্থা')}</TableHead></TableRow></TableHeader>
          <TableBody>{rows.map((row) => <TableRow key={row.name}><TableCell><span className="font-medium">{language === 'Bangla' ? row.bn : row.name}</span>{language === 'English + Bangla' && <span data-table-helper lang="bn" className="font-bn block text-ink-500">{row.bn}</span>}</TableCell><TableCell className="text-right">{row.qty}</TableCell><TableCell className="text-right">{taka(row.price)}</TableCell><TableCell className="text-right font-semibold">{taka(row.price * row.qty)}</TableCell><TableCell><StatusBadge tone={row.state === 'paid' ? 'success' : 'warning'}>{row.state === 'paid' ? text('Paid', 'পরিশোধিত') : text('Partial', 'আংশিক')}</StatusBadge></TableCell></TableRow>)}
            {!rows.length && <TableRow><TableCell colSpan={5} className="py-6 text-center">{text('No matching sample products. Clear the search.', 'মিলে এমন পণ্য নেই। খোঁজা মুছে দিন।')}</TableCell></TableRow>}
          </TableBody></Table>
      </Panel>
      <div className="mt-4 flex flex-wrap gap-2">{(['success', 'warning', 'danger', 'info', 'neutral', 'teal', 'ink'] as const).map((tone) => <StatusBadge key={tone} tone={tone} dot>{tone}</StatusBadge>)}</div>
    </div>
    <Dialog open={dialog} onOpenChange={setDialog}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>{text('Review sample', 'নমুনা দেখুন')}</DialogTitle><DialogDescription>{text('This demonstrates the shared modal. No payment or stock is posted.', 'এটি শুধু ডায়ালগের নমুনা। কোনো টাকা বা স্টক জমা হয় না।')}</DialogDescription></DialogHeader>
      <p className="text-sm text-ink">{text('Sample amount', 'নমুনা টাকার পরিমাণ')}: {amount || '0'}</p>
      <AppSelect label={text('Sample method inside dialog', 'ডায়ালগে নমুনা মাধ্যম')} value={method} onChange={setMethod} options={['cash', 'bank', 'mfs']} />
      <DialogFooter><Button variant="outline" onClick={() => setDialog(false)}>{text('Cancel', 'বাতিল')}</Button><Button onClick={() => { setDialog(false); setNotice(text('Sample preview closed. No transaction was recorded.', 'নমুনা বন্ধ হয়েছে। কোনো লেনদেন জমা হয়নি।')); }}>{text('Finish sample', 'নমুনা শেষ করুন')}</Button></DialogFooter>
    </DialogContent></Dialog>
  </section>;
}

export function DesignGuideExamples() {
  return <TenantSettingsProvider><Examples /></TenantSettingsProvider>;
}
