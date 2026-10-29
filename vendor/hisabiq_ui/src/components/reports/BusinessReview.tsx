import { useMemo, useState } from 'react';
import { ArrowDownToLine, CalendarRange, FileText, Printer, SearchCheck, Save } from 'lucide-react';
import { toast } from 'sonner';
import { AppSelect } from '../AppSelect';
import { AppDateRangePicker } from '../AppDateRangePicker';
import { AppMonthYearPicker } from '../AppMonthYearPicker';
import { Button } from '../Button';
import { StatusBadge } from '../StatusBadge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../Table';
import { MotionTabList, MotionTabIndicator } from '../../motion/MotionTabList';
import { ReportDetails } from './ReportDetails';
import { useUiCopy } from '../../i18n/useUiCopy';
import { taka, formatNumber } from '../../utils/currency';
import { downloadReport, printReport } from '../../utils/reportOutput';
import { buildBusinessReview, reviewPeriod } from '../../reports/review/businessReview';
import { buildAuditBook } from '../../reports/review/auditBook';
import { printAuditBook } from '../../reports/review/auditBookHtml';
import type { ReviewMode, ReviewMetricKey, ReviewMetric, Readiness } from '../../reports/review/types';
import type { ReportData, ReportRow } from '../../reports/types';

type Tab='summary'|'months'|'documents'|'history';
const tabs:{key:Tab;en:string;bn:string}[]=[
 {key:'summary',en:'Summary',bn:'সারাংশ'},{key:'months',en:'Monthly figures',bn:'মাসভিত্তিক হিসাব'},
 {key:'documents',en:'Documents',bn:'নথি'},{key:'history',en:'Review history',bn:'পর্যালোচনার ইতিহাস'}];
const fields:{key:ReviewMetricKey;en:string;bn:string;count?:boolean}[]=[
 {key:'netSales',en:'Recorded net sales',bn:'বিক্রি (ফেরত বাদে)'},
 {key:'sales',en:'Total sales',bn:'মোট বিক্রি'},{key:'returns',en:'Sales returns',bn:'বিক্রয় ফেরত'},
 {key:'purchases',en:'Purchases (not cost of sales)',bn:'ক্রয় (বিক্রয় খরচ নয়)'},
 {key:'costOfGoods',en:'Historical cost of sales',bn:'বিক্রীত পণ্যের ঐতিহাসিক খরচ'},
 {key:'grossProfit',en:'Provisional gross profit',bn:'প্রাথমিক মোট লাভ'},
 {key:'expenses',en:'Recorded expenses',bn:'লিখিত খরচ'},
 {key:'netProfit',en:'Verified net profit',bn:'যাচাইকৃত নিট লাভ'},
 {key:'cashIn',en:'Recorded money in',bn:'টাকা জমা'},
 {key:'cashOut',en:'Recorded money out',bn:'টাকা খরচ'},
 {key:'stockValue',en:'Current stock value',bn:'বর্তমান স্টক মূল্য'},
 {key:'lowStockCount',en:'Low-stock products',bn:'কম স্টক পণ্য',count:true},
 {key:'customerDue',en:'Current customer due',bn:'বর্তমান পাওনা'},
 {key:'supplierDue',en:'Current supplier due',bn:'বর্তমান দেনা'},
 {key:'cashBalance',en:'Reconciled account balance',bn:'যাচাইকৃত অ্যাকাউন্ট জের'}];
const label=(key:ReviewMetricKey)=>fields.find(f=>f.key===key)!;
const display=(metric:ReviewMetric)=>metric.value===null?'—':metric.key==='lowStockCount'?formatNumber(metric.value):taka(metric.value);
const readName=(v:Readiness,en:(a:string,b:string)=>string)=>v==='needs-review'?en('Needs review','যাচাই দরকার'):v==='incomplete'?en('Incomplete','অসম্পূর্ণ'):v==='unavailable'?en('Unavailable','তথ্য নেই'):en('Ready','প্রস্তুত');
const primary:ReviewMetricKey[]=['netSales','grossProfit','expenses','purchases'];
const liquidity:ReviewMetricKey[]=['cashIn','cashOut','customerDue','supplierDue','cashBalance'];
const inventory:ReviewMetricKey[]=['stockValue','lowStockCount'];
const columns:ReviewMetricKey[]=['netSales','costOfGoods','grossProfit','expenses','cashIn','cashOut','stockValue'];
type SessionDraft={id:string;period:string;date:string;values:{key:ReviewMetricKey;value:number|null}[]};
export function BusinessReview({data}:{data:ReportData}){
 const {text,language}=useUiCopy();
 const [mode,setMode]=useState<ReviewMode>('monthly');
 const [month,setMonth]=useState(data.asOf.slice(0,7));
 const [year,setYear]=useState(data.asOf.slice(0,4));
 const [range,setRange]=useState({from:data.asOf.slice(0,7)+'-01',to:data.asOf});
 const [active,setActive]=useState<Tab>('summary');
 const [detail,setDetail]=useState<ReportRow|null>(null);
 const [drafts,setDrafts]=useState<SessionDraft[]>([]);
 const request=useMemo(()=>{try{return reviewPeriod(mode,{asOf:data.asOf,month,year,from:range.from,to:range.to});}catch{return null;}},[mode,month,year,range,data.asOf]);
 const report=useMemo(()=>request?buildBusinessReview(data,request):null,[request,data]);
 const period=report?report.request.from+' – '+report.effectiveTo:'—';
 const show=(key:ReviewMetricKey,metric:ReviewMetric,context='')=>{
  if(!metric.source.length)return;
  const name=label(key);
  setDetail({id:'review-'+context+'-'+key,label:(context?context+' · ':'')+text(name.en,name.bn),date:'',status:'Needs review',values:{amount:metric.value},note:metric.reason,children:metric.source});
 };
 const printEvidence=(row:ReportRow)=>{
  const evidence=row.children?.length?row.children:[row];
  if(!printReport({title:row.label,language,subtitle:period+' · Uncertified internal preview',headers:[text('Reference','নম্বর'),text('Date','তারিখ'),text('Amount','মোট')],
   rows:evidence.map(r=>[r.label,r.date,typeof r.values.amount==='number'?r.values.amount:'—'])}))
    toast.error(text('Allow print popup and try again.','প্রিন্ট চালু করে আবার চেষ্টা করুন।'));
 };
 const card=(key:ReviewMetricKey)=>{
  if(!report)return null;
  const m=report.metrics[key],name=label(key);
  return <div key={key} className="min-w-0 rounded-xl border border-border bg-card p-3 shadow-card">
   <div className="flex flex-wrap items-center justify-between gap-1 text-xs text-ink-600"><span>{text(name.en,name.bn)}</span>
    <StatusBadge tone={m.readiness==='incomplete'?'warning':m.readiness==='needs-review'?'info':'neutral'}>{readName(m.readiness,text)}</StatusBadge>
   </div>
   <div className="mt-1 truncate text-xl font-semibold tracking-tight text-ink">{display(m)}</div>
   <p className="mt-1 line-clamp-2 text-[11px] text-ink-500">{m.reason}</p>
   {m.source.length>0&&<Button variant="ghost" size="sm" onClick={()=>show(key,m)}><SearchCheck className="size-3.5"/>{text('View evidence','মূল রেকর্ড')}</Button>}
  </div>;
 };
 const monthRows=()=>report?.months.map(m=>[m.month,...columns.map(k=>m.metrics[k].value===null?'—':m.metrics[k].value!),m.partial?text('Partial; needs review','আংশিক; যাচাই দরকার'):text('Coverage unverified','তথ্য যাচাই হয়নি')])??[];
 const headings=[text('Month','মাস'),...columns.map(k=>text(label(k).en,label(k).bn)),text('Readiness','তথ্যের অবস্থা')];
 const printDraft=(monthly=false)=>{
  if(!report)return;
  if(!monthly){
   if(!printAuditBook(buildAuditBook(data,report),language))
    toast.error(text('Allow the print popup and try again.','প্রিন্টের অনুমতি দিয়ে আবার চেষ্টা করুন।'));
   return;
  }
  const source=monthly?{title:text('Monthly audit schedule — draft','মাসিক অডিট বিবরণ — খসড়া'),headers:headings,rows:monthRows()}:
   {title:text('Internal business audit sheet — NOT certified','অভ্যন্তরীণ অডিট শিট — প্রত্যয়িত নয়'),
    headers:[text('Measure','হিসাব'),text('Recorded amount','লিখিত পরিমাণ'),text('Readiness','তথ্যের অবস্থা')],
    rows:fields.map(f=>[text(f.en,f.bn),display(report.metrics[f.key]),readName(report.metrics[f.key].readiness,text)+' · '+report.metrics[f.key].reason])};
  if(!printReport({...source,language,subtitle:period+' · '+report.disclaimer}))
   toast.error(text('Allow print popup and try again.','প্রিন্ট চালু করে আবার চেষ্টা করুন।'));
 };
 const csv=()=>{if(report)downloadReport('hisabiq-audit-'+mode+'-'+data.asOf+'.csv',headings,monthRows());};
 const saveSession=()=>{
  if(!report)return;
  setDrafts(v=>[{id:crypto.randomUUID(),period,date:new Date().toISOString(),values:fields.map(f=>({key:f.key,value:report.metrics[f.key].value}))},...v].slice(0,10));
  toast.info(text('Saved for this open page only; this is not a permanent audit archive.','শুধু এই পাতার জন্য সংরক্ষিত; এটি স্থায়ী অডিট আর্কাইভ নয়।'));
 };
 return <div className="min-w-0 space-y-4" data-business-review="">
  <section className="space-y-2 rounded-xl border border-border bg-card p-3">
   <div className="flex flex-wrap items-center gap-2">
    <AppSelect label={text('Audit period','অডিটের সময়কাল')} value={mode} onChange={v=>setMode(v as ReviewMode)}
     options={[{value:'monthly',label:text('Monthly audit report','মাসিক অডিট রিপোর্ট')},{value:'yearly',label:text('Yearly audit report','বার্ষিক অডিট রিপোর্ট')},
      {value:'last24',label:text('Last 24 complete months','শেষ ২৪টি পূর্ণ মাস')},{value:'custom',label:text('Custom dates','পছন্দের তারিখ')}]}/>
    {mode==='monthly'&&<div className="flex items-center gap-2 text-xs text-ink-600">
     <span>{text('Month','মাস')}</span>
     <AppMonthYearPicker mode="month" value={month} maxDate={data.asOf} label={text('Choose month','মাস বাছুন')} onChange={setMonth} className="w-[170px]"/>
    </div>}
    {mode==='yearly'&&<div className="flex items-center gap-2 text-xs text-ink-600">
     <span>{text('Year','বছর')}</span>
     <AppMonthYearPicker mode="year" value={year} maxDate={data.asOf} label={text('Choose year','বছর বাছুন')} onChange={setYear} className="w-[135px]"/>
    </div>}
    {mode==='custom'&&<AppDateRangePicker label={text('Date range','সময়কাল')} value={range} onChange={setRange}/>}
    <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-ink-500"><CalendarRange className="size-4"/>{period}</span>
   </div>
   <p className="text-xs text-ink-500">{text('Owner-facing preview from recorded sources. Not a certified audit, reconciled bank statement or final Profit & Loss.','মূল তথ্য থেকে ব্যবসার নিজের প্রিভিউ। এটি প্রত্যয়িত অডিট, ব্যাংক বিবরণী বা চূড়ান্ত লাভ-ক্ষতির হিসাব নয়।')}</p>
  </section>
  <MotionTabList aria-label={text('Audit report sections','অডিট রিপোর্টের অংশ')} className="flex min-w-0 gap-1 overflow-x-auto border-b border-border">
   {tabs.map(t=><button type="button" role="tab" key={t.key} aria-selected={active===t.key} className={'relative h-9 shrink-0 whitespace-nowrap px-3 text-[13px] font-medium '+(active===t.key?'text-primary':'text-ink-500 hover:text-ink')} onClick={()=>setActive(t.key)}>
    {text(t.en,t.bn)}<MotionTabIndicator active={active===t.key}/></button>)}
  </MotionTabList>
  {!report&&<p role="alert" className="rounded-lg border border-danger/30 p-3 text-sm text-danger">{text('Choose a valid reporting period.','সঠিক রিপোর্টের সময়কাল বাছুন।')}</p>}
  {report&&active==='summary'&&<>
   <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">{primary.map(card)}</div>
   <div className="grid min-w-0 gap-4 xl:grid-cols-2">
    <section className="min-w-0 space-y-3 rounded-xl border border-border bg-card p-3">
     <h3 className="text-sm font-semibold text-ink">{text('Money and due balances','টাকা ও পাওনা-দেনা')}</h3>
     <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">{liquidity.map(card)}</div>
    </section>
    <section className="min-w-0 space-y-3 rounded-xl border border-border bg-card p-3">
     <h3 className="text-sm font-semibold text-ink">{text('Stock and decision priorities','স্টক ও করণীয়')}</h3>
     <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">{inventory.map(card)}</div>
     <h4 className="border-t border-border pt-2 text-xs font-semibold text-ink">{text('Evidence-backed actions','মূল তথ্যভিত্তিক করণীয়')}</h4>
     {report.priorities.map(p=><div key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-ink-50 p-2">
      <div className="min-w-0"><p className="text-[13px] font-medium text-ink">{text(p.title,p.titleBn)}</p><p className="text-xs text-ink-500">{text(p.description,p.descriptionBn)}</p></div>
      <Button variant="outline" size="sm" onClick={()=>setDetail({id:'review-priority-'+p.id,label:p.title,labelBn:p.titleBn,date:'',status:'Needs review',values:{},note:p.description,children:p.source})}>{text('Evidence','মূল তথ্য')}</Button>
     </div>)}
     {!report.priorities.length&&<p className="text-xs text-ink-500">{text('No unsupported recommendations are invented.','মূল তথ্য ছাড়া পরামর্শ দেওয়া হয় না।')}</p>}
    </section>
   </div>
   <section className="rounded-xl border border-border bg-card p-3 text-sm text-ink-600">
    <h3 className="mb-1 font-semibold text-ink">{text('Profit and readiness','লাভ ও তথ্য যাচাই')}</h3>{report.metrics.netProfit.reason}
    <p className="mt-1 text-xs">{text('Purchases are not cost of goods sold, and missing returns or expenses cannot be treated as zero.','ক্রয় মানেই বিক্রিত পণ্যের খরচ নয়; ফেরত বা ব্যয়ের অনুপস্থিত হিসাব শূন্য নয়।')}</p>
   </section>
  </>}
  {report&&active==='months'&&<section className="min-w-0 overflow-hidden rounded-xl border border-border bg-card">
   <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border p-3"><div><h3 className="text-sm font-semibold text-ink">{text('Month-by-month business figures','মাসভিত্তিক ব্যবসার হিসাব')}</h3>
    <p className="text-[11px] text-ink-500">{text('Missing months are not zero; closing balances cannot be added across months.','অনুপস্থিত মাস শূন্য নয়; প্রতি মাসের শেষ জের যোগ করা হয় না।')}</p></div>
    <Button variant="outline" onClick={csv}><ArrowDownToLine className="size-4"/>{text('Export CSV','সিএসভি নামান')}</Button>
   </div>
   <Table className="text-[13px]" scrollRegionLabel={text('Monthly audit schedule','মাসভিত্তিক অডিট')}>
    <TableHeader><TableRow>{headings.map((h,i)=><TableHead key={i} className={'px-3 py-2 text-xs '+(i>0&&i<=columns.length?'text-right':'')}>{h}</TableHead>)}</TableRow></TableHeader>
    <TableBody>
     {report.months.map(m=><TableRow key={m.month}><TableCell className="px-3 py-2 font-medium text-ink">{m.month}{m.partial&&<span className="block text-[11px] text-warning">{text('Partial','আংশিক')}</span>}</TableCell>
      {columns.map(k=><TableCell key={k} className="px-3 py-2 text-right">{m.metrics[k].source.length?
       <button type="button" className="text-primary hover:underline focus-visible:ring-2 focus-visible:ring-primary" onClick={()=>show(k,m.metrics[k],m.month)}>{display(m.metrics[k])}</button>:<span className="text-ink-500">{display(m.metrics[k])}</span>}</TableCell>)}
      <TableCell className="px-3 py-2 text-xs text-ink-500">{m.partial?text('Partial · verify','আংশিক · যাচাই'):text('Coverage unverified','তথ্য যাচাই হয়নি')}</TableCell></TableRow>)}
     <TableRow className="bg-ink-50 font-semibold"><TableCell className="px-3 py-2">{text('Selected total / closing','সময়ের মোট / শেষ জের')}</TableCell>
      {columns.map(k=><TableCell key={k} className="px-3 py-2 text-right">{display(report.metrics[k])}</TableCell>)}<TableCell className="px-3 py-2 text-xs">{text('Needs review','যাচাই দরকার')}</TableCell>
     </TableRow>
    </TableBody>
   </Table>
  </section>}
  {report&&active==='documents'&&<section className="space-y-3 rounded-xl border border-border bg-card p-4">
   <h3 className="text-sm font-semibold text-ink">{text('Generate a draft internal audit sheet','অভ্যন্তরীণ অডিট শিটের খসড়া')}</h3>
   <p className="text-sm text-ink-600">{text('Print the five-page A4 portrait illustrated audit pack, or the separate monthly supporting schedule. Save PDF from the browser print dialog. Charts and rankings use recorded sources; this is not a certified report.','চিত্রসহ পাঁচ পাতার A4 অডিট রিপোর্ট অথবা আলাদা মাসভিত্তিক বিবরণ প্রিন্ট করুন। প্রিন্ট থেকে পিডিএফ রাখতে পারবেন। সব চার্ট ও তালিকা মূল তথ্যভিত্তিক; এটি প্রত্যয়িত অডিট নয়।')}</p>
   <div className="flex flex-wrap gap-2"><Button onClick={()=>printDraft()}><Printer className="size-4"/>{text('Print 5-page A4 audit report','৫ পাতার A4 অডিট রিপোর্ট প্রিন্ট')}</Button>
    <Button variant="outline" onClick={()=>printDraft(true)}><FileText className="size-4"/>{text('Print monthly schedule','মাসভিত্তিক বিবরণ প্রিন্ট')}</Button>
    <Button variant="outline" onClick={csv}><ArrowDownToLine className="size-4"/>{text('Download CSV','সিএসভি নামান')}</Button>
    <Button variant="outline" onClick={saveSession}><Save className="size-4"/>{text('Keep draft this session','এই সেশনে খসড়া রাখুন')}</Button>
   </div>
   <p role="status" className="rounded-lg bg-ink-50 p-3 text-xs text-ink-600">{report.disclaimer}</p>
  </section>}
  {report&&active==='history'&&<section className="space-y-3 rounded-xl border border-border bg-card p-4">
   <h3 className="text-sm font-semibold text-ink">{text('Session drafts — not reviewed','এই সেশনের খসড়া — যাচাইহীন')}</h3>
   <p className="text-xs text-ink-500">{text('These drafts disappear on reload. No professional signature, immutable history or external bank delivery is implied.','রিলোড করলে এই খসড়াগুলো থাকবে না। অনুমোদন, স্থায়ী ইতিহাস বা ব্যাংকে পাঠানো বোঝায় না।')}</p>
   {drafts.map(d=><div key={d.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-2 text-sm"><span>{d.period}<span className="block text-[11px] text-ink-500">{d.date}</span></span><StatusBadge tone="warning">{text('Draft','খসড়া')}</StatusBadge></div>)}
   {!drafts.length&&<p className="py-6 text-center text-sm text-ink-500">{text('No draft saved in this session.','এই সেশনে কোনো খসড়া নেই।')}</p>}
  </section>}
  {detail&&<ReportDetails key={detail.id} row={detail} onClose={()=>setDetail(null)} onPrint={printEvidence}/>}
 </div>;
}
