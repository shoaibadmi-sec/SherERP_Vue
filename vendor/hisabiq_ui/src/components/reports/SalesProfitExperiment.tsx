import { useCallback, useMemo, useState } from 'react';
import { BarChart3, ChevronDown, ChevronUp, FlaskConical } from 'lucide-react';
import { AppSelect } from '../AppSelect';
import { Button } from '../Button';
import { ReportToolbar } from './ReportToolbar';
import { ReportResults } from './ReportResults';
import { ReportSalesTrend } from './ReportSalesTrend';
import { useUiCopy } from '../../i18n/useUiCopy';
import { taka } from '../../utils/currency';
import { runReport } from '../../reports/model';
import { salesExperimentReports } from '../../reports/salesExperiment';
import { filtersForAnalysisReport } from '../../reports/screens';
import { useReportsCore } from '../../reports/magicpatterns/hooks/useReportsData';
import { SalesReport } from '../../reports/magicpatterns/components/reports/basic/SalesReport';
import { SourceEvidenceContext, type EvidenceRequest } from '../../reports/magicpatterns/components/reports/ReportBits';
import { resolveMagicEvidence } from '../../reports/magicpatterns/evidence';
import type { ReportData, ReportDefinition, ReportFilters, ReportKey, ReportResult, ReportRow } from '../../reports/types';

type Props={data:ReportData;definition:ReportDefinition;result:ReportResult;filters:ReportFilters;visible:string[];
 options:Record<string,{value:string;label:string}[]>;onFilters:(f:ReportFilters)=>void;onSelectReport:(id:ReportKey)=>void;
 onColumns:()=>void;onSaved:()=>void;onDetail:(r:ReportRow)=>void;onOriginal:()=>void;
 page:number;setPage:(p:number)=>void;pageSize:number;setPageSize:(n:number)=>void;};
type Figure={id:string;en:string;bn:string;value:number|null;rows:ReportRow[];note:string};

export function SalesProfitExperiment({data,definition,result,filters,visible,options,onFilters,onSelectReport,onColumns,onSaved,onDetail,onOriginal,page,setPage,pageSize,setPageSize}:Props){
 const {text}=useUiCopy();
 const [summaryOpen,setSummaryOpen]=useState(true),[groupingOpen,setGroupingOpen]=useState(false);
 const sales=useMemo(()=>runReport('sales-register',data,filtersForAnalysisReport('sales-register',filters,'sales')),[data,filters]);
 const returns=useMemo(()=>runReport('sales-returns',data,filtersForAnalysisReport('sales-returns',filters,'sales')),[data,filters]);
 const discounts=useMemo(()=>runReport('discounts',data,filtersForAnalysisReport('discounts',filters,'sales')),[data,filters]);
 const profit=useMemo(()=>runReport('product-profit',data,filtersForAnalysisReport('product-profit',filters,'sales')),[data,filters]);
 const {core,period}=useReportsCore(data,filters);
 const figures=useMemo<Figure[]>(()=>{
  const knownProfit=profit.rows.length&&profit.rows.every(r=>typeof r.values.profit==='number')?
   Math.round(profit.rows.reduce((n,r)=>n+Number(r.values.profit),0)*100)/100:null;
  return [
   {id:'sales',en:'Recorded sales',bn:'লিখিত বিক্রয়',value:sales.rows.length?sales.totals.amount??null:null,rows:sales.rows,note:sales.basis},
   {id:'returns',en:'Sales returns',bn:'বিক্রয় ফেরত',value:returns.rows.length?returns.totals.amount??null:null,rows:returns.rows,note:returns.basis},
   {id:'discounts',en:'Discounts',bn:'ছাড়',value:discounts.rows.length?discounts.totals.discount??null:null,rows:discounts.rows,note:discounts.basis},
   {id:'profit',en:'Known gross profit',bn:'জানা মোট লাভ',value:knownProfit,rows:profit.rows,
    note:knownProfit===null?'Historical sale-time cost is unavailable for one or more lines; profit has not been estimated from current purchase prices.':profit.basis}
  ];
 },[sales,returns,discounts,profit]);
 const openFigure=(f:Figure)=>{if(!f.rows.length)return;onDetail({id:'sales-lab-'+f.id,label:text(f.en,f.bn),date:'',
   status:f.value===null?'Incomplete':'Source evidence',values:{amount:f.value},note:f.note,children:f.rows});};
 const evidence=useCallback((req:EvidenceRequest)=>onDetail(resolveMagicEvidence(req,data,filters,'sales')),[data,filters,onDetail]);
 return <div data-sales-hybrid="" className="min-w-0 space-y-4">
  <div className="flex flex-wrap items-center justify-between gap-2">
   <div className="flex min-w-0 items-start gap-2"><FlaskConical className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true"/>
    <div><h2 className="text-sm font-semibold text-ink">{text('Combined Sales & Profit workspace','সমন্বিত বিক্রয় ও লাভ রিপোর্ট')}</h2>
     <p className="text-[11px] text-ink-500">{text('Experimental layout. Both existing report destinations remain unchanged.','পরীক্ষামূলক ডিজাইন। আগের দুই রিপোর্ট অপরিবর্তিত।')}</p></div>
   </div>
   <Button variant="outline" size="sm" onClick={onOriginal}>{text('Original Sales & profit','মূল বিক্রি ও লাভ')}</Button>
  </div>
  <div className="flex flex-wrap items-end justify-between gap-2">
   <div className="min-w-[192px] flex-1 sm:max-w-[320px]"><p className="mb-1 text-xs font-medium text-ink-600">{text('Detailed report','বিস্তারিত রিপোর্ট')}</p>
    <AppSelect label={text('Choose detailed Sales & Profit report','বিক্রি ও লাভের রিপোর্ট বাছুন')} value={definition.id}
     options={salesExperimentReports.map(r=>({value:r.id,label:text(r.en,r.bn)}))} onChange={v=>onSelectReport(v as ReportKey)}/></div>
   <Button variant="outline" onClick={()=>setSummaryOpen(v=>!v)} aria-expanded={summaryOpen} aria-controls="sales-experiment-visual">
    <BarChart3 className="size-4" aria-hidden="true"/>{text(summaryOpen?'Hide summary':'Show summary',summaryOpen?'সারাংশ আড়াল':'সারাংশ দেখুন')}
    {summaryOpen?<ChevronUp className="size-4"/>:<ChevronDown className="size-4"/>}
   </Button>
  </div>
  <ReportToolbar definition={definition} filters={filters} options={options} onChange={onFilters}
   onColumns={onColumns} onSaved={onSaved} asOf={data.asOf}/>
  {summaryOpen&&<section id="sales-experiment-visual" className="min-w-0 space-y-3" aria-label={text('Visual sales summary','বিক্রয়ের চিত্রভিত্তিক সারাংশ')}>
   <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">{figures.map(f=><div key={f.id} className="min-w-0 rounded-xl border border-border bg-card p-3">
    <p className="text-xs text-ink-600">{text(f.en,f.bn)}</p>
    {f.rows.length?<button type="button" onClick={()=>openFigure(f)} aria-label={text('Inspect '+f.en,f.bn+' দেখুন')}
     className="mt-1 block max-w-full truncate text-left text-lg font-semibold tracking-tight text-primary hover:underline focus-visible:ring-2 focus-visible:ring-primary">
     {f.value===null?'—':taka(f.value)}</button>:<p className="mt-1 text-lg font-semibold text-ink-500">—</p>}
    {f.id==='profit'&&f.value===null&&<p className="mt-1 text-[11px] text-warning">{text('Missing historical cost or source','পুরনো খরচ বা মূল তথ্য নেই')}</p>}
   </div>)}</div>
   <ReportSalesTrend rows={sales.rows} onDetail={onDetail}/>
   <div className="flex flex-wrap items-center justify-between gap-2">
    <p className="text-[11px] text-ink-500">{text('The trend reflects applicable source filters. The original Magic Patterns grouping below follows selected dates only.','ট্রেন্ডে মূল ফিল্টার প্রযোজ্য। নিচের Magic Patterns গ্রুপিং শুধু নির্বাচিত তারিখ অনুসরণ করে।')}</p>
    <Button size="sm" variant="ghost" aria-expanded={groupingOpen} aria-controls="sales-experiment-original" onClick={()=>setGroupingOpen(v=>!v)}>
     {text(groupingOpen?'Hide original grouping':'Original Magic Patterns grouping',groupingOpen?'মূল গ্রুপিং আড়াল':'মূল Magic Patterns গ্রুপিং')}
     {groupingOpen?<ChevronUp className="size-4"/>:<ChevronDown className="size-4"/>}
    </Button>
   </div>
   {groupingOpen&&<div id="sales-experiment-original" className="min-w-0">
    <SourceEvidenceContext.Provider value={evidence}><SalesReport core={core} period={period}/></SourceEvidenceContext.Provider>
   </div>}
  </section>}
  <ReportResults definition={definition} result={result} filters={filters} onChange={onFilters}
   visible={visible} onDetail={onDetail} page={page} setPage={setPage} pageSize={pageSize} setPageSize={setPageSize}/>
  <p className="text-[11px] text-ink-500">{text('Source rows, columns, saved views, CSV, print and drill-down reuse Report Library. No transaction is posted or changed.','মূল রেকর্ড, কলাম, সংরক্ষিত ভিউ, সিএসভি, প্রিন্ট ও বিস্তারিত রিপোর্ট লাইব্রেরি থেকেই আসে। লেনদেন বদলায় না।')}</p>
 </div>;
}
