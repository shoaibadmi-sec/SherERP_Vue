import { WorkspaceLibrary } from '../components/WorkspaceLibrary';
import { ReportsNav } from '../components/reports/ReportsNav';
import { BusinessReview } from '../components/reports/BusinessReview';
import { MagicReportsView } from '../reports/magicpatterns/MagicReportsView';
import { SalesProfitExperiment } from '../components/reports/SalesProfitExperiment';
import { salesExperimentReportKey, selectSalesExperimentReport } from '../reports/salesExperiment';
import { reportScreens,reportKeyForScreen } from '../reports/screens';
import { ColumnVisibilityEditor } from '../components/ColumnVisibilityEditor';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowDownToLine, ArrowRight, BookmarkPlus, Check, FileText, Info, Printer, RefreshCw, Search, Star, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../components/PageHeader';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { StatusBadge } from '../components/StatusBadge';
import { ReportHelp, ReportLabel } from '../components/reports/ReportGuidance';
import { SearchSelect } from '../components/SearchSelect';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/Dialog';
import { MotionTabIndicator, MotionTabList } from '../motion/MotionTabList';
import { ReportToolbar } from '../components/reports/ReportToolbar';
import { ReportResults, formatReportCell } from '../components/reports/ReportResults';
import { ReportDetails } from '../components/reports/ReportDetails';
import { useUiCopy } from '../i18n/useUiCopy';
import { useTenantSettings } from '../settings/TenantSettingsProvider';
import { reportCatalog, reportColumns, reportDefinition, reportGroups } from '../reports/catalog';
import { previousPeriod, runReport, validDay } from '../reports/model';
import { useReportData } from '../reports/useReportData';
import { filtersFromParams, paramsForReportScreen, reportScreenFromParams, parsePreferences, type ReportPreferences } from '../reports/preferences';
import { addDays, businessToday, formatRange } from '../utils/dateRange';
import { downloadReport, printReport } from '../utils/reportOutput';
import { taka } from '../utils/currency';
import type { PurchaseAssumptions, ReportFilters, ReportKey, ReportRow, ReportScreen } from '../reports/types';

export function Reports() {
 const {text,language}=useUiCopy(),{state,actorId}=useTenantSettings(),navigate=useNavigate();
 const [params,setParams]=useSearchParams();
 const reviewWorkspace=params.get('workspace')==='business-review';
 const screen=reportScreenFromParams(params);
 const definition=reportDefinition(reportKeyForScreen(screen,params.get('report')));
 const filters=useMemo(()=>{
  const f=filtersFromParams(params);
  if(!params.has('from'))f.from=addDays(businessToday(),-29);
  if(!params.has('to'))f.to=businessToday();
  return f;
 },[params]);
 const visible=useMemo(()=>{
  const selected=params.has('columns')?(params.get('columns')??'').split(','):definition.columns;
  return definition.columns.filter(k=>k==='label'||selected.includes(k));
 },[params,definition]);
 const [refresh,setRefresh]=useState(0),data=useReportData(refresh);
 const [page,setPage]=useState(1),[pageSize,setPageSize]=useState(10),[detail,setDetail]=useState<ReportRow|null>(null);
 const [librarySearch,setLibrarySearch]=useState(''),[dialog,setDialog]=useState<'columns'|'save'|'saved'|null>(null),[viewName,setViewName]=useState('');
 const [assumptions,setAssumptions]=useState<PurchaseAssumptions>({leadDays:7,reviewDays:7,safety:0,pack:1,budget:0});
 const [showBasis,setShowBasis]=useState(false),[storageWarning,setStorageWarning]=useState('');
 const storageKey='hisabiq-report-views-v1:'+state.tenantId+':'+actorId;
 const readPreferences=useCallback(()=>{try{return parsePreferences(localStorage.getItem(storageKey));}catch{return parsePreferences(null);}},[storageKey]);
 const [preferences,setPreferences]=useState<ReportPreferences>(readPreferences);
 useEffect(()=>{setPreferences(readPreferences());},[readPreferences]);
 const queryKey=params.toString();
 useEffect(()=>{setPage(1);},[queryKey]);
 const savePreferences=(next:ReportPreferences)=>{
  setPreferences(next);
  try{localStorage.setItem(storageKey,JSON.stringify(next));setStorageWarning('');}
  catch{setStorageWarning(text('Browser storage is unavailable; this view is kept for this session only.','ব্রাউজারে সংরক্ষণ করা যাচ্ছে না; এই সেশন পর্যন্ত ভিউটি থাকবে।'));}
 };
 const update=(next:ReportFilters)=>{
  const transient=Object.keys(next).every(k=>['search','sort','direction'].includes(k)||next[k as keyof ReportFilters]===filters[k as keyof ReportFilters]);
  setParams(paramsForReportScreen(screen,definition.id,next,visible),{replace:transient});setPage(1);
 };
 const selectReport=(key:ReportKey,sourceFilters?:ReportFilters)=>{
  const next=reportDefinition(key),f={...(sourceFilters??filters),sort:'date',direction:'desc' as const};
  for(const dim of ['category','brand','product','party','user','account','status'] as const)if(!next.dimensions.includes(dim))f[dim]='';
  setParams(paramsForReportScreen('library',next.id,f,next.columns));setPage(1);setShowBasis(false);
 };
 const selectExperimentReport=(key:ReportKey)=>{
  const selected=salesExperimentReportKey(key),next=reportDefinition(selected);
  const scoped=selectSalesExperimentReport(selected,filters);
  setParams(paramsForReportScreen('sales-lab',next.id,scoped,next.columns));
  setPage(1);setDetail(null);setShowBasis(false);
 };
 const selectScreen=(nextScreen:ReportScreen)=>{const next=reportDefinition(reportScreens.find(item=>item.id===nextScreen)!.report);setParams(paramsForReportScreen(nextScreen,next.id,{...filters,search:'',category:'',brand:'',product:'',party:'',user:'',account:'',status:'',sort:'date',direction:'desc'},next.columns));setShowBasis(false);setDetail(null);};
 const result=useMemo(()=>runReport(definition.id,data,filters,assumptions),[definition,data,filters,assumptions]);
 const previous=filters.compare==='previous'&&!definition.snapshot&&validDay(filters.from)&&validDay(filters.to)&&filters.from<=filters.to?runReport(definition.id,data,{...filters,...previousPeriod(filters)},assumptions):null;
 const rawOptions=useMemo(()=>{
  const rows=definition.group==='sales'||definition.group==='overview'?[...data.sales,...data.saleLines]:definition.group==='purchasing'?[...data.purchases,...data.purchaseLines]:definition.group==='stock'?[...data.stock,...data.lots,...data.movements]:definition.group==='people'?[...data.sales,...data.purchases]:definition.group==='money'?[...data.cash,...data.expenses,...data.finance]:[...data.warranty,...data.quality];
  const options:Record<string,{value:string;label:string}[]>={};
  for(const key of ['category','brand','product','party','user','account','status'] as const){
   const values=new Map<string,string>();
   for(const r of rows){const v=key==='product'?r.productId:r[key];if(v)values.set(v,key==='product'?(language==='Bangla'?(r.labelBn??r.label):r.label):v);}
   options[key]=[...values].sort(([,a],[,b])=>a.localeCompare(b)).map(([value,label])=>({value,label}));
  }
  return options;
 },[definition,data,language]);
 const reportTitle=text(definition.en,definition.bn),outputColumns=definition.columns.filter(k=>visible.includes(k));
 const outputRows=(rows:ReportRow[],columns=outputColumns)=>rows.map(r=>columns.map(k=>formatReportCell(r,k,language)));
 const headers=(columns=outputColumns)=>columns.map(k=>text(reportColumns[k]?.en??k,reportColumns[k]?.bn??k));
 const validRange=(!filters.from||validDay(filters.from))&&(!filters.to||validDay(filters.to));
 const filterDescription=[definition.snapshot?text('Current snapshot','বর্তমান অবস্থা'):validRange?formatRange(filters):text('Invalid date range','ভুল সময়কাল'),...Object.entries(filters).filter(([k,v])=>v&&['search','category','brand','party','product','user','account','status'].includes(k)).map(([k,v])=>k+': '+(rawOptions[k]?.find(o=>o.value===v)?.label??v))].join(' · ');
 const print=(rows:ReportRow[]=result.rows,title=reportTitle,columns=outputColumns)=>{
  if(!printReport({title,language,subtitle:filterDescription+' · '+text(result.basis,result.basisBn),headers:headers(columns),rows:outputRows(rows,columns)}))toast.error(text('Allow the print popup and try again.','প্রিন্ট উইন্ডো খুলে আবার চেষ্টা করুন।'));
 };
 const exportCsv=()=>downloadReport('hisabiq-'+definition.id+'.csv',[...headers(),text('Selection','ফিল্টার'),text('Basis','ভিত্তি')],result.rows.map(r=>[...outputRows([r])[0],filterDescription,text(result.basis,result.basisBn)]));
 const printDetails=(row:ReportRow)=>{const cols=Object.keys(reportColumns).filter(k=>k==='label'||k==='note'||row.values[k]!==undefined||['date','party','category','user','account','status'].includes(k));print([row],row.label,cols);};
 const favorite=preferences.favorites.includes(definition.id);
 const toggleFavorite=()=>savePreferences({...preferences,favorites:favorite?preferences.favorites.filter(k=>k!==definition.id):[...preferences.favorites,definition.id]});
 const library=librarySearch?reportCatalog.filter(r=>(r.en+' '+r.bn+' '+r.question).toLocaleLowerCase().includes(librarySearch.toLocaleLowerCase())):definition.group==='overview'?preferences.favorites.map(reportDefinition):reportCatalog.filter(r=>r.group===definition.group);
 const suggestedRows=result.rows.filter(r=>typeof r.values.suggested==='number'&&r.values.suggested>0),plannedCost=result.totals.amount;
 const downloadPurchaseList=()=>downloadReport('hisabiq-purchase-plan.csv',headers(),outputRows(suggestedRows));

 return <div className="mx-auto max-w-[1440px] space-y-4" data-report-workspace="">
  <PageHeader title={reviewWorkspace?'Business Review':'Reports'} titleBn={reviewWorkspace?'ব্যবসা পর্যালোচনা':'রিপোর্ট'} description={reviewWorkspace?'Monthly and yearly internal audit reports from recorded sources.':'Understand your business. Decide what to buy, collect and improve.'} descriptionBn={reviewWorkspace?'মাসিক ও বার্ষিক অভ্যন্তরীণ অডিট রিপোর্ট':'ব্যবসার অবস্থা বুঝুন। কী কিনবেন, কত আদায় করবেন ও কোথায় উন্নতি করবেন ঠিক করুন।'} actions={<>
   <Button variant="outline" onClick={()=>{const next=new URLSearchParams(params);if(reviewWorkspace)next.delete('workspace');else next.set('workspace','business-review');setParams(next);}}>
    <FileText className="size-4" aria-hidden="true"/>{reviewWorkspace?text('Back to reports','রিপোর্টে ফিরুন'):text('Audit report','অডিট রিপোর্ট')}
   </Button>
   {!reviewWorkspace&&<>
   <Button variant="outline" onClick={()=>{setRefresh(v=>v+1);toast(text('Preview records refreshed.','প্রিভিউ রেকর্ড আবার পড়া হয়েছে।'));}} aria-label={text('Refresh reports','রিপোর্ট হালনাগাদ')}><RefreshCw className="size-4" aria-hidden="true"/></Button>
   <Button variant="outline" onClick={()=>setDialog('save')}><BookmarkPlus className="size-4" aria-hidden="true"/>{text('Save view','ভিউ সংরক্ষণ')}</Button>
   <Button variant="outline" disabled={!!definition.unavailable} onClick={()=>print()}><Printer className="size-4" aria-hidden="true"/>{screen==='library'||screen==='overview'?text('Print report','রিপোর্ট প্রিন্ট'):text('Print source report','মূল রিপোর্ট প্রিন্ট')}</Button>
   <Button disabled={!!definition.unavailable} onClick={exportCsv}><ArrowDownToLine className="size-4" aria-hidden="true"/>{screen==='library'||screen==='overview'?text('Export CSV','সিএসভি নামান'):text('Source CSV','মূল তথ্য নামান')}</Button>
  </>}
  </>}/>
  {reviewWorkspace?<BusinessReview data={data}/>:<>
  {screen==='library'&&<div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-500"><div className="flex flex-wrap items-center gap-2"><StatusBadge tone="info">{text('Demo data','ডেমো তথ্য')}</StatusBadge><p>{text('Current in-browser records · not live accounting','বর্তমান ব্রাউজারের রেকর্ড · লাইভ হিসাব নয়')}</p></div><span>{text('Asia/Dhaka','ঢাকার সময়')} · {data.asOf}</span></div>}
  {storageWarning&&<p role="status" className="text-xs text-warning">{storageWarning}</p>}
  <ReportsNav value={screen} onChange={selectScreen}/>
  <div id="reports-screen-panel" role="tabpanel" aria-labelledby={'reports-screen-'+screen} className="min-w-0 space-y-4">
  {screen==='library'&&<div className="flex min-w-0 items-center border-b border-border">
   <div className="min-w-0 flex-1 overflow-x-auto">
   <MotionTabList aria-label={text('Report groups','রিপোর্টের বিভাগ')} className="flex min-w-max gap-1">
    {reportGroups.map((g,index)=><button key={g.id} id={'report-tab-'+g.id} type="button" role="tab" aria-selected={definition.group===g.id} aria-controls="report-panel" tabIndex={definition.group===g.id?0:-1}
     onClick={()=>selectReport(reportCatalog.find(r=>r.group===g.id)!.id)}
     onKeyDown={e=>{if(['ArrowRight','ArrowLeft','Home','End'].includes(e.key)){e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?reportGroups.length-1:(index+(e.key==='ArrowRight'?1:-1)+reportGroups.length)%reportGroups.length;selectReport(reportCatalog.find(r=>r.group===reportGroups[next].id)!.id);document.getElementById('report-tab-'+reportGroups[next].id)?.focus();}}}
     className={'relative inline-flex h-9 items-center gap-2 whitespace-nowrap px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary '+(definition.group===g.id?'text-primary':'text-ink-500 hover:text-ink')}>
     {text(g.en,g.bn)}<MotionTabIndicator active={definition.group===g.id}/>
    </button>)}
   </MotionTabList>
   </div>
   <div className="flex shrink-0 items-center gap-1 pl-2" role="group" aria-label={text('Report actions','রিপোর্টের কাজ')}><Button variant="ghost" size="icon" aria-label={text(favorite?'Unpin report':'Pin report',favorite?'রিপোর্টের পিন খুলুন':'রিপোর্ট পিন করুন')} aria-pressed={favorite} onClick={toggleFavorite}><Star className={'size-4 '+(favorite?'fill-current text-primary':'text-ink-400')} aria-hidden="true"/></Button><Button variant="ghost" size="icon" aria-label={text('How this report is calculated','রিপোর্ট কীভাবে হিসাব হয়')} aria-expanded={showBasis} onClick={()=>setShowBasis(v=>!v)}><Info className="size-4" aria-hidden="true"/></Button></div>
  </div>}
  <div className={'grid min-w-0 gap-4 '+(screen==='library'?'lg:grid-cols-[215px_minmax(0,1fr)]':'')}>
   {screen==='library'&&<div className="hidden min-w-0 lg:block"><WorkspaceLibrary title={text('Report library','রিপোর্টের তালিকা')} searchLabel={text('Find a report','রিপোর্ট খুঁজুন')} placeholder={text('Find a report…','রিপোর্ট খুঁজুন…')} search={librarySearch} onSearch={setLibrarySearch} footer={text('34 reports · detailed sources, saved views and exports. Subscription rules are unchanged in this preview.','৩৪টি রিপোর্ট · মূল তথ্য, সংরক্ষিত ভিউ ও রপ্তানি। এই প্রিভিউতে সাবস্ক্রিপশনের নিয়ম অপরিবর্তিত।')}>
    {!librarySearch&&<p className="px-2 py-1 text-[11px] text-ink-500">{definition.group==='overview'?text('Pinned reports','পিন করা রিপোর্ট'):text(reportGroups.find(g=>g.id===definition.group)!.en,reportGroups.find(g=>g.id===definition.group)!.bn)}</p>}
    <nav className="space-y-0.5">{library.map(r=><button key={r.id} type="button" aria-current={r.id===definition.id?'page':undefined} onClick={()=>{selectReport(r.id);setLibrarySearch('');}} className={'flex h-9 w-full items-center gap-2 rounded-lg px-2 text-left text-[12px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary '+(r.id===definition.id?'bg-teal-50 font-medium text-teal-700':'text-ink-600 hover:bg-ink-50')}><span className="min-w-0 flex-1 truncate">{text(r.en,r.bn)}</span>{r.unavailable&&<Info className="size-3 shrink-0 text-ink-400" aria-label={text('Needs source data','মূল তথ্য দরকার')}/>}</button>)}</nav>
    {!library.length&&<p className="p-2 text-xs text-ink-500">{text('No matching reports.','মিলে এমন রিপোর্ট নেই।')}</p>}
   </WorkspaceLibrary></div>}
   <section id="report-panel" role={screen==='library'?'tabpanel':undefined} aria-labelledby={screen==='library'?'report-tab-'+definition.group:undefined} className="flex min-w-0 flex-col gap-4">
    {screen==='library'&&<div className="lg:hidden"><SearchSelect id="mobile-report-picker" noun={{en:'report',bn:'রিপোর্ট'}} ariaLabel={text('Choose report','রিপোর্ট বাছুন')} value={definition.id} options={reportCatalog.map(r=>({value:r.id,label:text(r.en,r.bn)}))} onChange={v=>selectReport(reportDefinition(v).id)}/></div>}
    {screen==='library'&&showBasis&&<div className="rounded-lg bg-ink-50 p-3 text-xs leading-relaxed text-ink-600">{text(result.basis,result.basisBn)}. {text('Draft, deleted and reversed source records are excluded. Missing cost is unknown, not zero. Open a row for supporting records. Stock and outstanding balances are current snapshots, not reconstructed historical balances.','খসড়া, মুছে দেওয়া ও বিপরীত করা রেকর্ড বাদ। খরচ অনুপস্থিত হলে শূন্য ধরা হয় না। মূল তথ্য দেখতে রেকর্ড খুলুন। স্টক ও বাকি বর্তমান অবস্থা, পুরোনো তারিখের পুনর্গঠিত জের নয়।')}</div>}
    {definition.unavailable?<section className="rounded-xl border border-border bg-card p-6">
     <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-ink-50 text-ink-500"><Search className="size-5" aria-hidden="true"/></div>
     <h3 className="text-sm font-semibold text-ink"><StatusBadge tone="warning">{text('Source data required','মূল তথ্য দরকার')}</StatusBadge></h3><p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-600">{text(definition.unavailable.en,definition.unavailable.bn)}</p>
     <div className="mt-4 flex flex-wrap gap-2"><Button variant="outline" onClick={()=>selectReport('data-quality')}>{text('Review data completeness','তথ্যের পূর্ণতা দেখুন')}<ArrowRight className="size-4" aria-hidden="true"/></Button>{definition.id==='reconciliation'&&<Button onClick={()=>navigate('/app/reconciliation')}>{text('Open reconciliation','হিসাব মিলানো খুলুন')}</Button>}</div>
    </section>:<>
     {screen==='library'&&<ReportToolbar definition={definition} filters={filters} options={rawOptions} onChange={update} onColumns={()=>setDialog('columns')} onSaved={()=>setDialog('saved')} asOf={data.asOf}/>}
     {screen==='sales-lab'&&<SalesProfitExperiment
      data={data} definition={definition} result={result} filters={filters} visible={visible}
      options={rawOptions} onFilters={update} onSelectReport={selectExperimentReport}
      onColumns={()=>setDialog('columns')} onSaved={()=>setDialog('saved')} onDetail={setDetail}
      onOriginal={()=>selectScreen('sales')} page={page} setPage={setPage} pageSize={pageSize} setPageSize={setPageSize}/>}
     {screen!=='library'&&screen!=='sales-lab'&&<MagicReportsView key={screen+':'+storageKey} screen={screen} data={data} filters={filters} onFilters={update} onDetail={setDetail} onReport={selectReport} onScreen={selectScreen} scopeKey={storageKey}/>}
     {screen==='library'&&definition.id==='reorder'&&<section className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="text-sm font-semibold text-ink">{text('Buying assumptions','ক্রয়ের অনুমান')}</h3><p className="mt-1 text-xs text-ink-500">{text('Assumptions apply in each product’s base unit.','প্রতিটি পণ্যের মূল এককে এই অনুমান প্রযোজ্য।')}</p></div><Button variant="outline" disabled={!suggestedRows.length} onClick={downloadPurchaseList}><ArrowDownToLine className="size-4" aria-hidden="true"/>{text('Download purchase list','ক্রয়ের তালিকা নামান')}</Button></div>
      <div className="mt-3 grid grid-cols-2 gap-3 xl:grid-cols-5">{([
       {key:'leadDays',en:'Lead time (days)',bn:'ডেলিভারির সময় (দিন)'},{key:'reviewDays',en:'Review interval (days)',bn:'পরের পর্যালোচনা (দিন)'},{key:'safety',en:'Safety stock (base units)',bn:'সেফটি স্টক (মূল একক)'},{key:'pack',en:'Purchase pack (base units)',bn:'ক্রয়ের প্যাক (মূল একক)'},{key:'budget',en:'Budget (BDT)',bn:'বাজেট (টাকা)'}
      ] as const).map(f=><div key={f.key} className="space-y-1 text-xs text-ink-600"><div className="flex items-center justify-between gap-1"><label htmlFor={'report-assumption-'+f.key}><ReportLabel en={f.en} bn={f.bn}/></label><ReportHelp guide={f.key} label={text(f.en,f.bn)}/></div><Input id={'report-assumption-'+f.key} type="number" aria-label={text(f.en,f.bn)} min={f.key==='pack'?1:0} max={f.key==='leadDays'||f.key==='reviewDays'?365:100000000} value={assumptions[f.key]} onChange={e=>{const n=Number(e.target.value);if(Number.isFinite(n))setAssumptions(v=>({...v,[f.key]:Math.max(f.key==='pack'?1:0,Math.min(n,f.key==='leadDays'||f.key==='reviewDays'?365:100000000))}));}}/></div>)}</div>
      <p className="mt-3 text-xs text-ink-600">{text('Estimated purchase cost: ','প্রস্তাবিত ক্রয়ের খরচ: ')}<strong>{plannedCost===null?text('Some costs are unknown','কিছু খরচ অজানা'):taka(plannedCost??0)}</strong>{assumptions.budget>0&&plannedCost!==null&&<span className={(plannedCost??0)>assumptions.budget?'ml-2 text-danger':'ml-2 text-success'}>{(plannedCost??0)>assumptions.budget?text('Over budget by ','বাজেটের বেশি ')+taka((plannedCost??0)-assumptions.budget):text('Within budget','বাজেটের মধ্যে')}</span>}</p>
      <p className="mt-1 text-xs text-ink-500">{text('Estimate only. Incoming orders, reservations and lost sales are not available in this preview. Review each quantity before ordering.','শুধু অনুমান। এই প্রিভিউতে আসন্ন পণ্য, সংরক্ষণ ও হারানো বিক্রয়ের তথ্য নেই। অর্ডারের আগে প্রতিটি পরিমাণ যাচাই করুন।')}</p>
     </section>}
     
     {(screen==='library'||screen==='sales-lab')&&previous&&definition.id!=='overview'&&<p className="rounded-lg bg-ink-50 px-3 py-2 text-xs text-ink-600">{text('Previous period','আগের সময়কাল')}: {formatRange(previousPeriod(filters))} · {previous.rows.length?text('Recorded amount: ','লেখা মোট: ')+taka(previous.totals.amount??0):text('No comparable records.','তুলনাযোগ্য রেকর্ড নেই।')}</p>}
     {screen==='library'&&definition.id==='expiry'&&<p className="text-xs text-ink-500">{text('Negative days mean the batch has expired; positive days are time remaining. Stock age is shown separately.','ঋণাত্মক দিন মানে ব্যাচের মেয়াদ পেরিয়েছে; ধনাত্মক দিন মানে মেয়াদ বাকি। স্টকের বয়স আলাদা দেখানো হয়।')}</p>}
     {(screen==='library'||screen==='sales-lab')&&definition.id==='product-profit'&&<p className="text-xs text-ink-500">{text('Before return reversals and operating expenses. “—” means historical cost is missing; current purchase prices are never substituted.','ফেরতের বিপরীত হিসাব ও পরিচালন খরচের আগে। “—” মানে ঐতিহাসিক খরচ নেই; বর্তমান ক্রয়মূল্য ব্যবহার করা হয়নি।')}</p>}
     
     {screen==='library'&&<ReportResults definition={definition} result={result} filters={filters} onChange={update} visible={visible} onDetail={setDetail} page={page} setPage={setPage} pageSize={pageSize} setPageSize={setPageSize}/>}
    </>}
   </section>
  </div>
  </div>
  {detail&&<ReportDetails key={detail.id} row={detail} onClose={()=>setDetail(null)} onPrint={printDetails}/>}
  <Dialog open={dialog!==null} onOpenChange={v=>!v&&setDialog(null)}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>{dialog==='columns'?text('Visible columns','দেখানো কলাম'):dialog==='save'?text('Save report view','রিপোর্টের ভিউ সংরক্ষণ'):text('Saved views','সংরক্ষিত ভিউ')}</DialogTitle><DialogDescription>{dialog==='columns'?text('Choose what appears in the table, CSV and printout.','টেবিল, সিএসভি ও প্রিন্টে কী দেখাবেন বাছুন।'):text('Saved on this browser for the current business and user.','এই ব্যবসা ও ব্যবহারকারীর জন্য এই ব্রাউজারে সংরক্ষিত।')}</DialogDescription></DialogHeader>
   {dialog==='columns'&&<ColumnVisibilityEditor label={text('Visible columns','দেখানো কলাম')} columns={definition.columns.map(k=>({id:k,label:text(reportColumns[k].en,reportColumns[k].bn)}))} value={visible} required={['label']} onChange={columns=>setParams(paramsForReportScreen(screen,definition.id,filters,columns),{replace:true})}/>}
   {dialog==='save'&&<label className="space-y-1 text-sm text-ink"><span>{text('View name','ভিউয়ের নাম')}</span><Input aria-label={text('View name','ভিউয়ের নাম')} value={viewName} maxLength={80} onChange={e=>setViewName(e.target.value)} placeholder={text('e.g. Weekly purchasing review','যেমন: সাপ্তাহিক ক্রয় পর্যালোচনা')}/></label>}
   {dialog==='saved'&&<div className="max-h-[50vh] space-y-2 overflow-y-auto">{preferences.views.length?preferences.views.map(v=><div key={v.id} className="flex items-center gap-2 rounded-lg border border-border p-2"><button type="button" className="min-w-0 flex-1 text-left text-sm font-medium text-primary hover:underline" aria-label={text('Open '+v.name,v.name+' খুলুন')} onClick={()=>{setParams(paramsForReportScreen(v.screen??'library',v.report,v.filters,v.columns),{replace:true});setDialog(null);}}>{v.name}<span className="mt-0.5 block text-xs font-normal text-ink-500">{text(reportDefinition(v.report).en,reportDefinition(v.report).bn)}</span></button><Button variant="ghost" size="icon" aria-label={text('Delete '+v.name,v.name+' মুছুন')} onClick={()=>savePreferences({...preferences,views:preferences.views.filter(s=>s.id!==v.id)})}><Trash2 className="size-4" aria-hidden="true"/></Button></div>):<p className="py-6 text-center text-sm text-ink-500">{text('No saved views yet. Set your filters, then choose Save view.','এখনো ভিউ সংরক্ষণ করা হয়নি। ফিল্টার ঠিক করে ভিউ সংরক্ষণ করুন।')}</p>}</div>}
   <DialogFooter><Button variant="outline" onClick={()=>setDialog(null)}>{dialog==='columns'?text('Done','সম্পন্ন'):text('Close','বন্ধ')}</Button>{dialog==='save'&&<Button disabled={!viewName.trim()||preferences.views.length>=20} onClick={()=>{savePreferences({...preferences,views:[...preferences.views,{id:crypto.randomUUID(),name:viewName.trim(),report:definition.id,screen,filters:{...filters},columns:[...visible]}]});setViewName('');setDialog(null);}}><Check className="size-4" aria-hidden="true"/>{text('Save this view','এই ভিউ সংরক্ষণ')}</Button>}</DialogFooter>
  </DialogContent></Dialog>
  </>}
 </div>;
}

