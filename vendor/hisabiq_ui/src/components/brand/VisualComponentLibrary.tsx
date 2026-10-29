import {SettingsTabs} from '../../settings/SettingsTabs';
import {FinancialTerminologySettings} from '../../settings/FinancialTerminologySettings';
import {financialDefaults} from '../../financial-display/model';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Bookmark, Eye, LoaderCircle, MoreHorizontal, Paperclip, Plus, Search } from 'lucide-react';
import { TenantSettingsProvider } from '../../settings/TenantSettingsProvider';
import { useUiCopy } from '../../i18n/useUiCopy';
import { MotionTabIndicator, MotionTabList } from '../../motion/MotionTabList';
import { products } from '../../data/products';
import componentCatalog from '../../data/componentCatalog.json';
import { Button } from '../Button';
import { Input } from '../Input';
import { NumericInput } from '../NumericInput';
import { MoneyUnitInput, QuantityUnitInput } from '../MoneyUnitInput';
import { AmountInWordsDisplay } from '../AmountInWordsDisplay';
import { AppSelect } from '../AppSelect';
import { SearchSelect } from '../SearchSelect';
import { AppDatePicker, AppDateRangePicker } from '../AppDateRangePicker';
import { Switch } from '../Switch';
import { Panel } from '../Panel';
import { PageHeader } from '../PageHeader';
import { MetricCard } from '../dashboard/MetricCard';
import { SalesTrendChart } from '../dashboard/SalesTrendChart';
import { CashflowChart } from '../dashboard/CashflowChart';
import { FeedbackState, type FeedbackKind } from '../FeedbackState';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../Dialog';
import { FloatingPanel } from '../layout/FloatingPanel';
import { ReportHelp, ReportLabel } from '../reports/ReportGuidance';
import { CompoundQuantityInput } from '../transactions/CompoundQuantityInput';
import { MultiUnitQuantityInput } from '../transactions/MultiUnitQuantityInput';
import { PhotoUploader } from '../products/PhotoUploader';
import { Disclosure } from '../products/fields/Disclosure';
import { PartyRoleSpecimen } from './PartyRoleSpecimen';
import { ReportToolbarSpecimen } from './ReportToolbarSpecimen';

function Field({ label, children, group = false }: { label: string; children: ReactNode; group?: boolean }) {
  if (group) return <fieldset className="min-w-0"><legend className="mb-1.5 text-[13px] font-medium text-ink">{label}</legend>{children}</fieldset>;
  return <label className="block min-w-0 text-[13px] font-medium text-ink"><span className="mb-1.5 block">{label}</span>{children}</label>;
}

function ButtonStates() {
  const { text } = useUiCopy();
  const [preview, setPreview] = useState('');
  const [choice, setChoice] = useState('regular');
  return <div className="space-y-4"><div className="flex flex-wrap gap-2">{(['default', 'outline', 'secondary', 'ghost', 'destructive', 'link'] as const).map((variant) => <Button key={variant} variant={variant} onClick={() => setPreview(variant)}>{variant}</Button>)}<Button variant="outline" size="icon" aria-label={text('Inspect button sample', 'বোতামের নমুনা দেখুন')} onClick={() => setPreview('icon')}><Eye className="size-4" aria-hidden="true" /></Button><Button disabled>{text('Disabled', 'বন্ধ')}</Button><Button disabled aria-busy="true"><LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />{text('Loading sample', 'নমুনা আসছে')}</Button></div><Button data-erp-workflow-action="complete" className="w-full text-[15px] font-semibold" onClick={() => setPreview('48px terminal transaction CTA')}><Plus className="size-4" aria-hidden="true" />{text('Checkout review specimen · 48px', 'চেকআউট নমুনা · ৪৮ পিক্সেল')}</Button><fieldset><legend className="mb-2 text-[13px] font-medium text-ink">{text('Single-choice field, not navigation', 'একটি বিকল্প বাছাই, মেনু নয়')}</legend><div className="flex flex-wrap gap-4">{[{ id: 'regular', en: 'Regular', bn: 'সাধারণ' }, { id: 'installment', en: 'Installment', bn: 'কিস্তি' }].map((item) => <label key={item.id} className="flex items-center gap-2 text-sm text-ink"><input type="radio" name="library-payment-choice" value={item.id} checked={choice === item.id} onChange={() => setChoice(item.id)} className="size-4 accent-primary" />{text(item.en, item.bn)}</label>)}</div></fieldset><p className="text-xs text-ink-500">{text('Ordinary controls stay 36px. Only explicit terminal transaction review/completion actions use 48px.', 'সাধারণ বোতাম ৩৬ পিক্সেল। শুধু নির্দিষ্ট লেনদেনের শেষের বোতাম ৪৮ পিক্সেল।')}</p><Dialog open={Boolean(preview)} onOpenChange={(open) => { if (!open) setPreview(''); }}><DialogContent><DialogHeader><DialogTitle>{text('Button specimen', 'বোতামের নমুনা')}</DialogTitle><DialogDescription>{preview} · {text('No business data is changed.', 'ব্যবসার তথ্য বদলায় না।')}</DialogDescription></DialogHeader><Button variant="outline" onClick={() => setPreview('')}>{text('Close', 'বন্ধ করুন')}</Button></DialogContent></Dialog></div>;
}

function CardStates() {
  const { text } = useUiCopy();
  return <div className="space-y-4"><PageHeader title="Sample workspace" titleBn="নমুনা কাজের জায়গা" description="Existing PageHeader and Dashboard composition" descriptionBn="আগের শিরোনাম ও ড্যাশবোর্ডের বিন্যাস" /><div className="grid gap-3 sm:grid-cols-2"><MetricCard widget={{ id: 'receivable', label: text('Receivable', 'পাওনা'), labelBn: 'পাবো', kind: 'metric', visible: true }} /><MetricCard widget={{ id: 'payable', label: text('Payable', 'দেনা'), labelBn: 'দেবো', kind: 'metric', visible: true }} /></div><div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2"><div className="min-w-0"><p className="mb-2 text-[13px] font-medium text-ink">{text('Sales trend · sample data', 'বিক্রির ধারা · নমুনা')}</p><SalesTrendChart height={180} /></div><div className="min-w-0"><p className="mb-2 text-[13px] font-medium text-ink">{text('Cashflow · sample data', 'টাকা আসা-যাওয়া · নমুনা')}</p><CashflowChart height={180} /></div></div><p className="text-xs text-ink-500">{text('These are the existing Dashboard components and fixture values. Metric links open their real ERP destination; they do not post transactions.', 'এগুলো ড্যাশবোর্ডের আসল উপাদান ও নমুনা তথ্য। কার্ডের লিংক মূল মডিউল খোলে, লেনদেন জমা করে না।')}</p><p className="mt-2 text-xs leading-5 text-warning">{text('Legacy gaps: metric footnotes and chart tooltips still contain English. These charts need keyboard access and reduced-motion work before they become complete future defaults.', 'আগের উপাদানে সীমাবদ্ধতা: কার্ডের ছোট লেখা ও চার্টের সহায়তা এখনো ইংরেজি। নতুন পর্দায় নেওয়ার আগে কিবোর্ড ও কম অ্যানিমেশনের কাজ দরকার।')}</p></div>;
}

function InputStates() {
  const { text } = useUiCopy();
  const [search, setSearch] = useState('');
  const [value, setValue] = useState('');
  return <div className="grid gap-4 sm:grid-cols-2"><Field label={text('Search · focus to see the teal halo', 'খুঁজুন · চাপলে ফোকাস দেখাবে')}><Input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={text('Search records, references, people…', 'রেকর্ড, নম্বর, নাম খুঁজুন…')} /></Field><Field label={text('Default editable field', 'সাধারণ ফিল্ড')}><Input value={value} onChange={(event) => setValue(event.target.value)} placeholder={text('Type here', 'এখানে লিখুন')} /></Field><Field label={text('Invalid phone', 'ভুল মোবাইল নম্বর')}><Input type="tel" defaultValue="01711-48" aria-invalid="true" aria-describedby="library-phone-error" /><span id="library-phone-error" className="mt-1 block text-xs text-danger">{text('Enter an 11-digit mobile number.', '১১ সংখ্যার মোবাইল নম্বর দিন।')}</span></Field><Field label={text('Read-only reference', 'শুধু দেখার নম্বর')}><Input value="SAMPLE-1024" readOnly /></Field><Field label={text('Disabled field', 'বন্ধ ফিল্ড')}><Input value={text('Unavailable in this state', 'এই অবস্থায় ব্যবহার করা যাবে না')} disabled /></Field><Field label={text('Multiline note', 'বিস্তারিত নোট')}><textarea rows={3} className="w-full rounded-lg border border-input bg-card p-3 text-sm text-ink" defaultValue={text('Long text wraps without changing single-line controls.', 'বড় লেখা একাধিক লাইনে দেখা যাবে।')} /></Field></div>;
}

function QuantityStates() {
  const { text } = useUiCopy();
  const [amount, setAmount] = useState('1250');
  const [unit, setUnit] = useState('Pcs');
  const [large, setLarge] = useState('2');
  const [small, setSmall] = useState('5');
  const [chain, setChain] = useState<Record<string, string>>({ Carton: '1', Box: '2', Pcs: '3' });
  const product = products.find((item) => item.altUnit) ?? products[0];
  return <div className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><Field label={text('Number with focus/keyboard/wheel stepper', 'সংখ্যা ও বাড়ানো-কমানো')}><NumericInput aria-label={text('Library quantity', 'নমুনা পরিমাণ')} value={large} onChange={(event) => setLarge(event.target.value)} /></Field><Field group label={text('Money + unit', 'টাকা ও একক')}><MoneyUnitInput label={text('Sample price', 'নমুনা দাম')} value={amount} onChange={setAmount} unit={unit} units={['Pcs', 'Box']} onUnitChange={setUnit} /></Field><Field group label={text('Quantity + unit', 'পরিমাণ ও একক')}><QuantityUnitInput label={text('Sample quantity', 'নমুনা পরিমাণ')} value={large} onChange={setLarge} unit={unit} units={['Pcs', 'Box']} onUnitChange={setUnit} /></Field><Field group label={text('Compound large + small units', 'বড় ও ছোট একক')}><CompoundQuantityInput product={product} unit={product.altUnit?.unit ?? product.unit} primary={large} secondary={small} onPrimaryChange={setLarge} onSecondaryChange={setSmall} primaryLabel="Sample large quantity" secondaryLabel="Sample small quantity" /></Field></div><MultiUnitQuantityInput product={{ unit: 'Pcs', unitRelations: [{ leftUnit: 'Carton', quantity: 12, rightUnit: 'Box' }, { leftUnit: 'Box', quantity: 20, rightUnit: 'Pcs' }] }} quantities={chain} onChange={setChain} /><AmountInWordsDisplay variant="compact" amount={Number(amount) || 0} /></div>;
}

function SelectStates() {
  const { text } = useUiCopy();
  const [value, setValue] = useState('active');
  const [entity, setEntity] = useState('hardware');
  const [options, setOptions] = useState([{ value: 'hardware', label: 'Hardware · হার্ডওয়্যার' }, { value: 'electrical', label: 'Electrical · ইলেকট্রিক্যাল' }]);
  return <div className="space-y-4"><div><p className="mb-1.5 text-[13px] font-medium text-ink">{text('Short fixed list', 'ছোট নির্দিষ্ট তালিকা')}</p><AppSelect label={text('Library status', 'নমুনার অবস্থা')} value={value} onChange={setValue} options={[{ value: 'active', label: text('Active', 'চালু') }, { value: 'inactive', label: text('Inactive', 'বন্ধ') }]} /></div><div><p className="mb-1.5 text-[13px] font-medium text-ink">{text('Search + inline Add new', 'খুঁজুন ও নতুন যোগ করুন')}</p><SearchSelect id="library-entity" noun={{ en: 'category', bn: 'ক্যাটাগরি' }} ariaLabel={text('Library category', 'নমুনা ক্যাটাগরি')} value={entity} options={options} onChange={setEntity} onCreate={(name) => { const id = 'sample-' + options.length; setOptions((current) => [...current, { value: id, label: name }]); return id; }} /></div><p className="text-xs leading-5 text-ink-500">{text('Try a missing name, choose Add new, then create or cancel. The parent value and draft stay intact.', 'নতুন নাম খুঁজে যোগ করুন বা বাতিল করুন। আগের ফর্মের তথ্য থাকবে।')}</p></div>;
}

function DateStates() {
  const { text } = useUiCopy();
  const [date, setDate] = useState('2026-10-26');
  const [range, setRange] = useState({ from: '2026-09-27', to: '2026-10-26' });
  return <div className="space-y-4"><div><p className="mb-1.5 text-[13px] font-medium text-ink">{text('Single date', 'একটি তারিখ')}</p><AppDatePicker value={date} onChange={setDate} label={text('Library single date', 'নমুনা এক তারিখ')} /></div><div><p className="mb-1.5 text-[13px] font-medium text-ink">{text('Two-month range with presets', 'দুই মাস ও তারিখের সীমা')}</p><AppDateRangePicker value={range} onChange={setRange} label={text('Library date range', 'নমুনা তারিখের সীমা')} /></div><p className="text-xs text-ink-500">{range.from} → {range.to}</p></div>;
}

function OverlayStates() {
  const { text } = useUiCopy();
  const [dialog, setDialog] = useState('');
  const [enabled, setEnabled] = useState(true);
  return <div className="space-y-5"><div className="flex flex-wrap items-center gap-4"><span className="inline-flex items-center gap-1"><ReportLabel en="Status" bn="অবস্থা" /><ReportHelp guide="status" label={text('Status', 'অবস্থা')} /></span><span className="inline-flex items-center gap-1"><ReportLabel en="Comparison" bn="তুলনা" /><ReportHelp guide="compare" label={text('Period comparison', 'সময়ের তুলনা')} /></span></div><p className="text-xs leading-5 text-ink-500">{text('Focus, tap or hover the information icon. Bilingual mode shows English, a divider, then Bangla.', 'তথ্যের আইকনে চাপুন। দুই ভাষায় ইংরেজি, বিভাজক ও বাংলা দেখা যাবে।')}</p><div className="flex flex-wrap gap-2"><Button onClick={() => setDialog(text('Review sample', 'নমুনা দেখুন'))}><Eye className="size-4" aria-hidden="true" />{text('Open modal', 'ডায়ালগ খুলুন')}</Button><FloatingPanel label={text('Library More menu', 'নমুনার আরও মেনু')} align="right" width={230} trigger={({ toggle, open }) => <Button variant="outline" onClick={toggle} aria-haspopup="menu" aria-expanded={open}><MoreHorizontal className="size-4" aria-hidden="true" />{text('More', 'আরও')}</Button>}>{(close) => <div role="menu" className="p-1">{[text('View details', 'বিস্তারিত দেখুন'), text('Add note', 'নোট যোগ করুন')].map((label) => <button key={label} type="button" role="menuitem" className="block w-full rounded-lg px-3 py-2 text-left text-sm text-ink hover:bg-accent" onClick={() => { close(); setDialog(label); }}>{label}</button>)}</div>}</FloatingPanel><Button variant="outline" onClick={() => setDialog(text('Sample attachment', 'নমুনা ফাইল'))}><Paperclip className="size-4" aria-hidden="true" />{text('Attachment preview', 'ফাইল দেখুন')}</Button></div><div className="flex items-center gap-2 text-sm text-ink"><Switch aria-label={text('Example setting', 'নমুনা সেটিংস')} checked={enabled} onCheckedChange={setEnabled} />{text('Example setting', 'নমুনা সেটিংস')}</div><Dialog open={Boolean(dialog)} onOpenChange={(open) => { if (!open) setDialog(''); }}><DialogContent><DialogHeader><DialogTitle>{dialog}</DialogTitle><DialogDescription>{text('A real shared Dialog: focus stays inside and returns to its opener. This is a local sample.', 'একই ডায়ালগ: ফোকাস ভেতরে থাকবে, বন্ধ করলে আগের বোতামে ফিরবে।')}</DialogDescription></DialogHeader><Input aria-label={text('Sample note in modal', 'ডায়ালগে নমুনা নোট')} placeholder={text('Write a note', 'নোট লিখুন')} /><DialogFooter><Button variant="outline" onClick={() => setDialog('')}>{text('Cancel', 'বাতিল')}</Button><Button onClick={() => setDialog('')}>{text('Finish sample', 'নমুনা শেষ')}</Button></DialogFooter></DialogContent></Dialog></div>;
}

function FutureStates() {
  const { text } = useUiCopy();
  const [kind, setKind] = useState<FeedbackKind>('no-results');
  const [advanced, setAdvanced] = useState(false);
  const copy: Record<FeedbackKind, [string, string, string, string]> = {
    empty: ['No records yet', 'এখনো রেকর্ড নেই', 'The first saved record will appear here.', 'প্রথম তথ্য জমা হলে এখানে দেখা যাবে।'],
    'no-results': ['No matching records', 'মিলে এমন রেকর্ড নেই', 'Clear filters or try another name.', 'ফিল্টার মুছুন বা অন্য নাম লিখুন।'],
    error: ['Could not load this list', 'তালিকা আনা যায়নি', 'Your sample values are kept. Try again.', 'নমুনার তথ্য আছে। আবার চেষ্টা করুন।'],
    permission: ['Access is unavailable', 'দেখার অনুমতি নেই', 'Ask your business owner for access.', 'ব্যবসার মালিকের কাছে অনুমতি চান।'],
    loading: ['Loading sample', 'নমুনা আসছে', 'The layout stays stable while data arrives.', 'তথ্য আসার সময় জায়গা একই থাকবে।'],
  };
  const [title, titleBn, description, descriptionBn] = copy[kind];
  return <div className="space-y-4"><AppSelect label={text('Feedback state', 'অবস্থার নমুনা')} value={kind} onChange={(value) => setKind(value as FeedbackKind)} options={Object.entries(copy).map(([value, labels]) => ({ value, label: text(labels[0], labels[1]) }))} /><FeedbackState kind={kind} title={text(title, titleBn)} description={text(description, descriptionBn)} action={kind === 'error' || kind === 'no-results' ? { label: text(kind === 'error' ? 'Retry sample' : 'Clear sample filters', kind === 'error' ? 'আবার চেষ্টা করুন' : 'নমুনা ফিল্টার মুছুন'), onClick: () => setKind('empty') } : undefined} /><Disclosure id="library-advanced" en="Advanced options" bn="আরও সেটিংস" summary={text('Rare settings stay collapsed until needed.', 'কম ব্যবহারের সেটিংস দরকারে খুলুন।')} open={advanced} onToggle={() => setAdvanced((value) => !value)}><p className="p-4 text-sm text-ink-600">{text('Compose future screens with the same controls, states and source-linked workflow.', 'ভবিষ্যতের পর্দায় একই ফিল্ড, অবস্থা ও উৎসের কাজ ব্যবহার করুন।')}</p></Disclosure></div>;
}

function UploadStates() {
  const { text } = useUiCopy();
  const [photos, setPhotos] = useState<string[]>([]);
  const current = useRef(photos); current.current = photos;
  useEffect(() => () => current.current.forEach((url) => URL.revokeObjectURL(url)), []);
  return <div><PhotoUploader photos={photos} max={2} label={text('Add sample photo', 'নমুনা ছবি যোগ')} onChange={(next) => { photos.filter((url) => !next.includes(url)).forEach((url) => URL.revokeObjectURL(url)); setPhotos(next); }} hint={text('Local image preview only; no file is uploaded.', 'শুধু এই ব্রাউজারে ছবি দেখা যাবে। আপলোড হয় না।')} /><p className="mt-3 text-xs text-ink-500">{text('Current uploader has some legacy English thumbnail labels; this source gap remains visible for later localization.', 'ছবির ছোট কিছু লেখা এখনো ইংরেজি। পরের ভাষার আপডেটে ঠিক করতে হবে।')}</p></div>;
}

function FinancialSettingsSpecimen(){const [value,setValue]=useState(financialDefaults);const[tab,setTab]=useState('editor');return <div className="grid min-w-0 gap-4 lg:grid-cols-[215px_minmax(0,1fr)]"><SettingsTabs secondary id="library-settings-tabs" panelId="library-settings-panel" label="Settings navigation specimen" value={tab} onChange={setTab} items={[{id:'editor',label:'Names & Khata',bn:'হিসাবের নাম'},{id:'notes',label:'Navigation behavior',bn:'নেভিগেশনের নিয়ম'}]}/><div id="library-settings-panel" role="tabpanel" aria-labelledby={`library-settings-tabs-${tab}`} className="min-w-0">{tab==='editor'?<FinancialTerminologySettings value={value} onChange={setValue} disabled={false} language="English + Bangla"/>:<p className="text-sm text-helper">Party viewport bands: phone below 768px, tablet 768–1023px, desktop from 1024px. Sub-settings move to the left only on desktop. Use arrows and Enter to switch tabs; the editor draft is kept.</p>}</div></div>;}

function Library() {
  const { text } = useUiCopy();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const categories = [{ id: 'all', en: 'All components', bn: 'সব উপাদান' }, { id: 'parties', en: 'Party Ledger', bn: 'পক্ষের খাতা' }, { id: 'forms', en: 'Forms & fields', bn: 'ফর্ম ও ফিল্ড' }, { id: 'tables', en: 'Tables & filters', bn: 'টেবিল ও ফিল্টার' }, { id: 'overlays', en: 'Help & overlays', bn: 'সহায়তা ও ডায়ালগ' }, { id: 'future', en: 'Future compositions', bn: 'ভবিষ্যতের ব্যবহার' }];
  const examples: Record<string, ReactNode> = { settings: <FinancialSettingsSpecimen/>, parties: <PartyRoleSpecimen />, reports: <ReportToolbarSpecimen />, buttons: <ButtonStates />, cards: <CardStates />, inputs: <InputStates />, quantities: <QuantityStates />, selectors: <SelectStates />, dates: <DateStates />, overlays: <OverlayStates />, feedback: <FutureStates />, uploads: <UploadStates /> };
  const visible = componentCatalog.filter((entry) => (category === 'all' || entry.category === category) && (entry.title + entry.bn + entry.sources.join(' ') + entry.states.join(' ')).toLowerCase().includes(search.trim().toLowerCase()));
  return <section id="component-library" className="mx-auto max-w-[1280px] scroll-mt-20 px-4 py-8 sm:px-6" aria-labelledby="component-library-title">
    <div className="mb-5"><p className="mb-2 text-xs font-medium text-teal-700">HisabIQ · Visual component library</p><h1 id="component-library-title" className="text-2xl font-semibold tracking-tight text-ink">{text('See it, try it, reuse the same component.', 'দেখুন, ব্যবহার করুন, একই উপাদান নিন।')}</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-ink-500">{text('Working specimens from the ERP, including role-sensitive Party actions, report filters and bilingual help. Prepared future compositions are labelled separately. All examples use isolated sample state.', 'ERP-এর আসল উপাদানের নমুনা: সম্পর্ক অনুযায়ী কাজ, রিপোর্টের ফিল্টার ও দুই ভাষার সহায়তা। ভবিষ্যতের নমুনা আলাদা করে চিহ্নিত।')}</p></div>
    <label className="mb-4 block text-[13px] font-medium text-ink">{text('Find a visual component', 'দেখে উপাদান খুঁজুন')}<span className="relative mt-1.5 block"><Search className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-ink-400" aria-hidden="true" /><Input type="search" className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={text('Search calendar, role, tooltip, quantity, loading…', 'ক্যালেন্ডার, পক্ষ, সহায়তা, পরিমাণ খুঁজুন…')} /></span></label>
    <div className="mb-5 overflow-x-auto border-b border-border"><MotionTabList aria-label={text('Component families', 'উপাদানের ধরন')} className="flex min-w-max gap-3">{categories.map((item, index) => <button type="button" role="tab" key={item.id} id={'library-tab-' + item.id} aria-controls="library-specimens" aria-selected={category === item.id} tabIndex={category === item.id ? 0 : -1} onClick={() => setCategory(item.id)} onKeyDown={(event) => { if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return; event.preventDefault(); const next = event.key === 'Home' ? 0 : event.key === 'End' ? categories.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : categories.length - 1)) % categories.length; setCategory(categories[next].id); document.getElementById('library-tab-' + categories[next].id)?.focus(); }} className={'relative whitespace-nowrap px-2 py-3 text-[13px] font-medium ' + (category === item.id ? 'text-ink' : 'text-ink-500')}>{text(item.en, item.bn)}<MotionTabIndicator active={category === item.id} /></button>)}</MotionTabList></div>
    <div id="library-specimens" role="tabpanel" aria-labelledby={'library-tab-' + category} className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
      {visible.map((entry) => <section id={'specimen-' + entry.id} key={entry.id} className={'min-w-0 scroll-mt-20 ' + (entry.wide ? 'lg:col-span-2' : '')}><Panel title={text(entry.title, entry.bn)} actions={<span className={'rounded-md px-2 py-1 text-[11px] ' + (entry.status === 'prepared' ? 'bg-warning-bg text-warning' : 'bg-teal-50 text-teal-700')}>{entry.status === 'prepared' ? text('Prepared composition', 'ভবিষ্যতের নমুনা') : text('Used in HisabIQ', 'HisabIQ-এ ব্যবহৃত')}</span>}><div className="space-y-4">{examples[entry.id]}<div className="border-t border-border pt-3"><p className="text-[11px] leading-5 text-ink-500">{text('States', 'অবস্থা')}: {entry.states.join(' · ')}</p><p className="break-words text-[11px] leading-5 text-ink-500">{text('Source', 'উৎস')}: {entry.sources.join(' · ')}</p></div></div></Panel></section>)}
      {!visible.length && <FeedbackState kind="no-results" title={text('No matching component', 'মিলে এমন উপাদান নেই')} description={text('Try a source name, another term or All components.', 'অন্য নাম লিখুন বা সব উপাদান দেখুন।')} action={{ label: text('Clear library search', 'খোঁজা মুছুন'), onClick: () => { setSearch(''); setCategory('all'); } }} />}
    </div>
    <p className="mt-5 flex items-center gap-2 text-xs text-ink-500"><Bookmark className="size-4 shrink-0" aria-hidden="true" />{text('The rulebook and full icon/source inventory follow below. New components enter the same catalogue and verification process.', 'নিচে নিয়ম ও সব আইকনের তালিকা আছে। নতুন উপাদানও একই তালিকা ও যাচাইয়ে যোগ হবে।')}</p>
  </section>;
}

export function VisualComponentLibrary() {
  return <TenantSettingsProvider><Library /></TenantSettingsProvider>;
}
