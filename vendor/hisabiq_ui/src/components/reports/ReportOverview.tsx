import { ArrowDownRight, ArrowRight, ArrowUpRight, AlertCircle } from 'lucide-react';
import { ReportSalesTrend } from './ReportSalesTrend';
import { Button } from '../Button';
import { StatusBadge } from '../StatusBadge';
import { ReportHelp, ReportLabel } from './ReportGuidance';
import { reportToneClass, type ReportTone } from '../../reports/guidance';
import { Panel } from '../Panel';
import { useUiCopy } from '../../i18n/useUiCopy';
import { taka, formatNumber } from '../../utils/currency';
import { runReport } from '../../reports/model';
import { reportDefinition } from '../../reports/catalog';
import type { ReportData, ReportFilters, ReportKey, ReportResult, ReportRow } from '../../reports/types';

export function ReportOverview({data,filters,current,previous,onReport,onDetail}:{data:ReportData;filters:ReportFilters;current:ReportResult;previous:ReportResult|null;onReport:(key:ReportKey)=>void;onDetail:(r:ReportRow)=>void}){
 const {text,language}=useUiCopy();
 const related={...filters,category:'',brand:'',product:'',user:'',status:'',account:''};
 const purchases=runReport('purchases',data,related),expenses=runReport('expenses',data,related);
 const receivables=runReport('receivables',data,related),payables=runReport('payables',data,related);
 const cash=runReport('cash-book',data,related);
 const profit=runReport('product-profit',data,filters);
 const cards:{en:string;bn:string;value:number|null;key:ReportKey;note:string;noteBn:string}[]=[
  {en:'Recorded sales',bn:'লেখা বিক্রয়',value:current.totals.amount,key:'sales-register',note:'Before recorded returns',noteBn:'লেখা ফেরতের আগে'},
  {en:'Gross profit',bn:'মোট লাভ',value:profit.rows.length?profit.totals.profit:null,key:'product-profit',note:'Historical costs only · before returns',noteBn:'ঐতিহাসিক খরচে · ফেরতের আগে'},
  {en:'Recorded purchases',bn:'লেখা ক্রয়',value:purchases.totals.amount,key:'purchases',note:'Selected period',noteBn:'নির্বাচিত সময়কাল'},
  {en:'Recorded expenses',bn:'লেখা খরচ',value:expenses.totals.amount,key:'expenses',note:'Not a complete P&L',noteBn:'পূর্ণ লাভ-ক্ষতির হিসাব নয়'},
  {en:'Customer outstanding',bn:'গ্রাহকের কাছে পাওনা',value:receivables.totals.due,key:'receivables',note:'Current invoice balances',noteBn:'বিলের বর্তমান বাকি'},
  {en:'Supplier outstanding',bn:'সরবরাহকারীর দেনা',value:payables.totals.due,key:'payables',note:'Current bill balances',noteBn:'ক্রয় বিলের বর্তমান বাকি'},
  {en:'Recorded money in',bn:'লেখা টাকা এসেছে',value:cash.totals.inflow,key:'cash-book',note:'Recorded payment movements',noteBn:'সংরক্ষিত পেমেন্টের চলাচল'},
  {en:'Recorded money out',bn:'লেখা টাকা গেছে',value:cash.totals.outflow,key:'cash-book',note:'Not a reconciled cash balance',noteBn:'মিলিয়ে নেওয়া ক্যাশের জের নয়'}
 ];
 const top=runReport('product-sales',data,{...filters,sort:'amount',direction:'desc'}).rows.slice(0,5);
 const expenseRows=runReport('expense-categories',data,{...related,sort:'amount',direction:'desc'}).rows;
 const urgent=data.stock.filter(r=>r.status!=='In stock'),expiry=data.lots.filter(r=>r.status==='Expired'||r.status==='Expiring soon');
 const alerts:{key:ReportKey;en:string;bn:string;count:number;hint:string;hintBn:string}[]=[
  {key:'reorder',en:'Prepare your next purchase',bn:'পরের ক্রয়ের পরিকল্পনা',count:urgent.length,hint:'Review usable stock and buying assumptions.',hintBn:'ব্যবহারযোগ্য স্টক ও ক্রয়ের অনুমান দেখুন।'},
  {key:'receivables',en:'Review customer dues',bn:'গ্রাহকের বাকি দেখুন',count:receivables.rows.length,hint:'Current unpaid invoices, ordered by age.',hintBn:'বয়স অনুযায়ী বর্তমান বাকি বিল দেখুন।'},
  {key:'expiry',en:'Check expiry exposure',bn:'মেয়াদের ঝুঁকি দেখুন',count:expiry.length,hint:'Remaining batches nearing or past expiry.',hintBn:'মেয়াদ শেষ বা কাছাকাছি অবশিষ্ট ব্যাচ।'},
  {key:'data-quality',en:'Complete missing source data',bn:'অনুপস্থিত তথ্য পূরণ করুন',count:data.quality.length,hint:'Reliable profit needs historical costs.',hintBn:'নির্ভরযোগ্য লাভে ঐতিহাসিক খরচ দরকার।'}
 ];
 const difference=previous&&current.rows.length&&previous.rows.length?Number(current.totals.amount)-Number(previous.totals.amount):null;
 return <div className="space-y-4">
  <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{cards.map(card=>{
   const tone:ReportTone=card.value===null?'warning':card.key==='purchases'?'info':['expenses','payables'].includes(card.key)||card.en==='Recorded money out'||Number(card.value)<0?'danger':'success';
   const guide=card.key==='product-profit'?'profit':['receivables','payables'].includes(card.key)?'due':'amount';
   return <div key={card.en} data-report-summary={card.key} data-report-tone={tone} className="rounded-xl border border-border bg-card p-3 text-left sm:p-4">
    <div className="flex items-start justify-between gap-1 text-xs text-ink-600"><ReportLabel en={card.en} bn={card.bn}/><ReportHelp guide={guide} label={text(card.en,card.bn)}/></div>
    <button type="button" aria-label={text('Open '+card.en,card.bn+' দেখুন')} onClick={()=>onDetail({id:'summary-'+card.en,label:text(card.en,card.bn),date:data.asOf,status:'Demo data',values:{amount:card.value},note:text(card.note,card.noteBn),children:runReport(card.key,data,related).rows})} className="block h-auto min-h-0 w-full rounded text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
     <span className={'mt-1 block text-xl font-semibold tracking-tight '+reportToneClass[tone]}>{card.value===null?'—':taka(card.value)}</span>
     <span className="mt-1 block text-[11px] text-ink-500">{card.value===null?<StatusBadge tone="warning">{text('Historical cost missing','ঐতিহাসিক খরচ নেই')}</StatusBadge>:text(card.note,card.noteBn)}</span>
    </button>
   </div>;
  })}</div>
  {previous&&<div className="flex flex-wrap items-center gap-2 rounded-lg bg-ink-50 px-3 py-2 text-xs text-ink-600">
   {difference===null?<AlertCircle className="size-4" aria-hidden="true"/>:difference>=0?<ArrowUpRight className="size-4 text-success" aria-hidden="true"/>:<ArrowDownRight className="size-4 text-danger" aria-hidden="true"/>}
   {difference===null?text('Comparable source records are missing in one period; no percentage has been invented.','একটি সময়কালে তুলনাযোগ্য রেকর্ড নেই; শতাংশ অনুমান করা হয়নি।'):text('Recorded sales change: ','লেখা বিক্রয়ের পরিবর্তন: ')+taka(difference)}
  </div>}
  <div className="grid gap-4 xl:grid-cols-3">
   <ReportSalesTrend rows={current.rows} onDetail={onDetail} className="xl:col-span-2"/>
   <Panel title={text('Where to focus','যেখানে নজর দেবেন')} subtitle={text('Review first, then decide','আগে দেখুন, তারপর সিদ্ধান্ত নিন')} bodyClassName="p-1.5">
    <ul className="divide-y divide-border">{alerts.map(a=><li key={a.key}><button type="button" className="flex h-auto min-h-0 w-full items-start gap-3 rounded-lg px-2.5 py-3 text-left hover:bg-ink-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" onClick={()=>onReport(a.key)}><span className="min-w-0 flex-1"><span className="block text-[13px] font-medium text-ink">{text(a.en,a.bn)}</span><span className="mt-0.5 block text-xs text-ink-500">{text(a.hint,a.hintBn)}</span></span><StatusBadge tone={a.count===0?'neutral':a.key==='expiry'?'danger':'warning'}>{formatNumber(a.count)}</StatusBadge></button></li>)}</ul>
   </Panel>
  </div>
  <div className="grid gap-4 lg:grid-cols-2">
   <Panel title={text('Leading products','বেশি বিক্রি হওয়া পণ্য')} actions={<Button variant="ghost" size="sm" onClick={()=>onReport('product-sales')}>{text('View report','রিপোর্ট দেখুন')}<ArrowRight className="size-3" aria-hidden="true"/></Button>} bodyClassName="px-4 py-1">
    {top.length?<ul className="divide-y divide-border">{top.map(r=><li key={r.id}><button type="button" className="flex h-auto min-h-0 w-full items-center justify-between gap-3 py-3 text-left hover:text-primary" onClick={()=>onDetail(r)}><span className="min-w-0 text-[13px] text-ink">{language==='Bangla'?(r.labelBn??r.label):r.label}</span><span className="whitespace-nowrap text-sm font-medium text-ink">{taka(Number(r.values.amount))}</span></button></li>)}</ul>:<p className="py-4 text-sm text-ink-500">{text('No product sales in this selection.','এই ফিল্টারে পণ্যের বিক্রয় নেই।')}</p>}
   </Panel>
   <Panel title={text('Expense categories','খরচের খাত')} actions={<Button variant="ghost" size="sm" onClick={()=>onReport('expense-categories')}>{text('View report','রিপোর্ট দেখুন')}<ArrowRight className="size-3" aria-hidden="true"/></Button>} bodyClassName="px-4 py-1">
    {expenseRows.length?<ul aria-label={text('Expense categories','খরচের খাত')} className="divide-y divide-border">{expenseRows.map(r=><li key={r.id}><button type="button" className="flex h-auto min-h-0 w-full items-center justify-between gap-3 py-3 text-left hover:text-primary" onClick={()=>onDetail(r)}><span className="text-[13px] text-ink">{text(r.label,r.label==='Salary'?'বেতন':r.label==='Rent'?'ভাড়া':r.label==='Transport'?'পরিবহন':r.label==='Utilities'?'বিদ্যুৎ-পানি':r.label==='Maintenance'?'মেরামত':r.label==='Tea & Snacks'?'চা-নাস্তা':r.label)}</span><span className="text-sm font-medium text-ink">{taka(Number(r.values.amount))}</span></button></li>)}</ul>:<p className="py-4 text-sm text-ink-500">{text('No recorded expenses in this period.','এই সময়কালে লেখা খরচ নেই।')}</p>}
   </Panel>
  </div>
  <p className="text-xs text-ink-500">{text('Open any summary to inspect its records. All figures use the current in-browser preview, not live accounting.','রেকর্ড দেখতে যেকোনো সারাংশ খুলুন। সব তথ্য বর্তমান ব্রাউজারের প্রিভিউ থেকে, লাইভ হিসাব নয়।')}</p>
  <div className="flex flex-wrap gap-2">{(['cash-book','stock','payables','warranty'] as ReportKey[]).map(k=><Button key={k} variant="outline" onClick={()=>onReport(k)}>{text(reportDefinition(k).en,reportDefinition(k).bn)}<ArrowRight className="size-3" aria-hidden="true"/></Button>)}</div>
 </div>;
}

