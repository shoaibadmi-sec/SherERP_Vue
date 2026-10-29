import { useCallback, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { useUiCopy } from '../../i18n/useUiCopy';
import type { ReportData, ReportFilters, ReportKey, ReportRow, ReportScreen } from '../types';
import { useReportsCore } from './hooks/useReportsData';
import { usePremiumInsights, defaultPremiumSettings } from './hooks/usePremiumInsights';
import { KpiEvidenceContext, SourceEvidenceContext, type EvidenceRequest } from './components/reports/ReportBits';
import { OverviewReport } from './components/reports/basic/OverviewReport';
import { SalesReport } from './components/reports/basic/SalesReport';
import { StockReport } from './components/reports/basic/StockReport';
import { DuesReport } from './components/reports/basic/DuesReport';
import { MoneyReport } from './components/reports/basic/MoneyReport';
import { AdvisorReport } from './components/reports/premium/AdvisorReport';
import { ProfitReport } from './components/reports/premium/ProfitReport';
import { BuyingReport } from './components/reports/premium/BuyingReport';
import { CashflowReport } from './components/reports/premium/CashflowReport';
import { CustomersReport } from './components/reports/premium/CustomersReport';
import { addDays, longDate, presetLabels } from './utils/reports/period';
import type { PeriodPreset } from './types/reports';
import { resolveMagicEvidence } from './evidence';

type Props={screen:ReportScreen;data:ReportData;filters:ReportFilters;onFilters:(f:ReportFilters)=>void;onDetail:(r:ReportRow)=>void;onReport:(k:ReportKey)=>void;onScreen:(s:ReportScreen)=>void;scopeKey:string};
const dateScreen=new Set<ReportScreen>(['overview','sales','money','profit','customers']);
export function evidenceKey(screen:ReportScreen,label:string):ReportKey {
 const value=label.toLowerCase();
 if(/profit|margin|cost coverage|cost missing/.test(value))return 'product-profit';
 if(/expense|money out/.test(value))return 'expenses';
 if(/supplier|payable|owe suppliers/.test(value))return 'payables';
 if(/stock|reorder|turns|purchase|buy/.test(value))return screen==='buying'?'reorder':'stock';
 if(/customer|receivable|owe you|unpaid|due|collection|money received/.test(value))return 'receivables';
 if(/cash|money in/.test(value))return 'cash-book';
 return screen==='profit'?'product-profit':screen==='buying'?'reorder':screen==='stock'?'stock':screen==='dues'?'receivables':screen==='money'?'cash-book':screen==='customers'?'customer-sales':'sales-register';
}
export function MagicReportsView({screen,data,filters,onFilters,onDetail,onReport,onScreen,scopeKey}:Props){
 const {text}=useUiCopy();
 const {core,period}=useReportsCore(data,filters);
 const [settings,setSettings]=useState(defaultPremiumSettings);
 const [manualRange,setManualRange]=useState(false);
 const insights=usePremiumInsights(core,settings);
 const evidence=useCallback((req:EvidenceRequest)=>{
  if(req.forecast || (screen==='cashflow'&&req.date&&req.date>data.asOf)){
   const day=insights.forecast.days.find(d=>d.date===req.date);
   onDetail({id:'cash-projection-'+(req.date??'summary'),label:req.label,date:req.date??'',status:'Illustrative projection',
    values:{inflow:day?.inflow??(req.forecast?insights.forecast.totalIn:null),outflow:day?.outflow??(req.forecast?insights.forecast.totalOut:null),balance:day?.balance??null},
    note:(req.context?req.context+' · ':'')+'Forecast point, not a posted transaction. Customer payments '+settings.lateDays+' days later than usual, safety buffer '+settings.buffer+' BDT and stock purchases '+(settings.includePurchases?'included':'excluded')+'. Reconciled opening cash is unavailable. No source record or payment was created.'});
   return;
  }
  onDetail(resolveMagicEvidence(req,data,filters,screen));
 },[data,filters,onDetail,screen,settings,insights]);
 const kpiEvidence=useCallback((label:string)=>{
  if(screen==='cashflow'){
   onDetail({id:'forecast-assumptions-'+label,label,date:'',status:'Illustrative projection',values:{},
    note:'This is an unposted 30-day scenario. Opening cash is assumed zero when reconciled balances are unavailable. Safety level: '+settings.buffer+' BDT. Customer payment delay: '+settings.lateDays+' days. Stock purchases '+(settings.includePurchases?'included.':'excluded.')+' No payment or financial entry was created.'});return;
  }
  evidence({report:evidenceKey(screen,label),label});
 },[evidence,onDetail,screen,settings]);
 const changePreset=(next:PeriodPreset)=>{
  if(next==='custom'){setManualRange(true);return;}
  setManualRange(false);
  let from=data.asOf;
  if(next==='7d')from=addDays(data.asOf,-6);
  else if(next==='30d')from=addDays(data.asOf,-29);
  else if(next==='90d')from=addDays(data.asOf,-89);
  else if(next==='month')from=data.asOf.slice(0,8)+'01';
  onFilters({...filters,from,to:data.asOf});
 };
 const days=filters.from&&filters.to?Math.round((Date.parse(filters.to)-Date.parse(filters.from))/86400000)+1:30;
 const preset:PeriodPreset=manualRange?'custom':filters.from===data.asOf&&filters.to===data.asOf?'today':days===7?'7d':days===30?'30d':days===90?'90d':filters.from===data.asOf.slice(0,8)+'01'?'month':'custom';
 return <div className="min-w-0 space-y-4" data-magic-patterns-reports={screen}>
   <div className="flex flex-wrap items-center gap-2 text-xs text-ink-500" data-magic-period-strip="">
    {dateScreen.has(screen)?<>
     <label className="flex items-center gap-2"><CalendarDays className="size-4" aria-hidden="true"/>
      <span className="sr-only">{text('Period','সময়কাল')}</span>
      <select aria-label={text('Report period','রিপোর্টের সময়কাল')} className="h-9 rounded-lg border border-border bg-card px-2 text-[13px] text-ink" value={preset} onChange={event=>changePreset(event.target.value as PeriodPreset)}>
       {(['today','7d','month','30d','90d','custom'] as const).map(p=><option key={p} value={p}>{presetLabels[p]}</option>)}
      </select></label>
     {preset==='custom'&&<>
      <input aria-label={text('From date','শুরুর তারিখ')} type="date" max={data.asOf} value={filters.from} className="h-9 rounded-lg border border-border bg-card px-2 text-[13px]" onChange={event=>onFilters({...filters,from:event.target.value})}/>
      <input aria-label={text('To date','শেষ তারিখ')} type="date" max={data.asOf} value={filters.to} className="h-9 rounded-lg border border-border bg-card px-2 text-[13px]" onChange={event=>onFilters({...filters,to:event.target.value})}/>
     </>}
     <span>{longDate(period.from)} – {longDate(period.to)} · {text('previous-period comparison','আগের সময়ের তুলনা')}</span>
    </>:<span>{text("Today's position","আজকের অবস্থা")} · {text('As of','হালনাগাদ')} {longDate(core.ds.asOf)} · {text('recent 30 days of sales','শেষ ৩০ দিনের বিক্রয়')}</span>}
    <span className="ml-auto text-[11px]">{text('Source: HisabIQ preview records','উৎস: হিসাবআইকিউ প্রিভিউ রেকর্ড')}</span>
   </div>
   {screen==='cashflow'&&!core.ds.accounts.length&&<p role="status" className="rounded-lg border border-warning/20 bg-warning-bg p-2 text-xs text-warning">
    {text('Illustrative forecast: starting cash is assumed zero because reconciled account balances are unavailable. No real transaction is posted.','উদাহরণ পূর্বাভাস: যাচাই করা অ্যাকাউন্টের জের নেই, তাই শুরুর টাকা শূন্য ধরা হয়েছে। কোনো লেনদেন লেখা হয় না।')}
   </p>}
   <SourceEvidenceContext.Provider value={evidence}><KpiEvidenceContext.Provider value={kpiEvidence}>
    {screen==='overview'&&<OverviewReport core={core} period={period} onOpen={value=>onScreen(value as ReportScreen)}/>}
    {screen==='sales'&&<SalesReport core={core} period={period}/>}
    {screen==='stock'&&<StockReport core={core}/>}
    {screen==='dues'&&<DuesReport core={core}/>}
    {screen==='money'&&<MoneyReport core={core} period={period}/>}
    {screen==='advisor'&&<AdvisorReport core={core} insights={insights} onOpen={onScreen} scopeKey={scopeKey}/>}
    {screen==='profit'&&<ProfitReport core={core} period={period}/>}
    {screen==='buying'&&<BuyingReport core={core} insights={insights} settings={settings} onSettings={setSettings}/>}
    {screen==='cashflow'&&<CashflowReport core={core} insights={insights} settings={settings} onSettings={setSettings}/>}
    {screen==='customers'&&<CustomersReport core={core} period={period}/>}
   </KpiEvidenceContext.Provider></SourceEvidenceContext.Provider>
   <p className="text-xs text-ink-500">
    <button type="button" className="text-primary hover:underline" onClick={()=>onReport(screen==='buying'?'reorder':screen==='advisor'?'collections':screen==='profit'?'product-profit':screen==='sales'?'sales-register':screen==='stock'?'stock':screen==='dues'?'receivables':screen==='money'?'cash-book':screen==='customers'?'customer-sales':'overview')}>{text('Full source report in library','সব মূল তথ্য রিপোর্ট লাইব্রেরিতে')}</button>
    {' · '}{text('Historical cost remains unknown where missing; estimates do not post transactions.','পুরনো খরচ না থাকলে অজানাই থাকে; অনুমান থেকে লেনদেন লেখা হয় না।')}
   </p>
  </div>;
}
