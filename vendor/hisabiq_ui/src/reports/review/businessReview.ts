import { addDays, addMonths } from '../../utils/dateRange.ts';
import { validDay } from '../model.ts';
import type { ReportData, ReportRow } from '../types.ts';
import type { BusinessReviewResult, ReviewMetric, ReviewMetricKey, ReviewMetrics, ReviewMode, ReviewMonth, ReviewPriority, ReviewRequest, Readiness } from './types.ts';

const finite=(v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v);
const two=(n:number)=>Math.round((n+Number.EPSILON)*100)/100;
const beginning=(day:string)=>day.slice(0,7)+'-01';
const monthEnd=(first:string)=>addDays(addMonths(first,1),-1);
const inRange=(row:ReportRow,from:string,to:string)=>!!row.date&&row.date>=from&&row.date<=to;
const records=(rows:ReportRow[],from:string,to:string)=>rows.filter(r=>inRange(r,from,to));
const valueOf=(row:ReportRow,key:string)=>row.values[key];
const total=(rows:ReportRow[],field:string)=>rows.length&&rows.every(row=>finite(valueOf(row,field)))?two(rows.reduce((n,row)=>n+Number(row.values[field]),0)):null;
const reasonNoRecords='No verified coverage or recorded entries for this section. Missing is not zero.';
const reasonPreview='Sum of recorded source rows in the selected period. Source coverage and corrections require owner review.';
export function reviewPeriod(mode:ReviewMode,options:{asOf:string;month?:string;year?:string;from?:string;to?:string}):ReviewRequest{
 const asOf=options.asOf;
 if(!validDay(asOf))throw new Error('Invalid report as-of date');
 let from='',to='';
 if(mode==='monthly'){
  const month=options.month??asOf.slice(0,7);
  if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))throw new Error('Choose a valid month');
  from=month+'-01';to=monthEnd(from);
 }else if(mode==='yearly'){
  const year=options.year??asOf.slice(0,4);
  if(!/^\d{4}$/.test(year))throw new Error('Choose a valid calendar year');
  from=year+'-01-01';to=year+'-12-31';
 }else if(mode==='last24'){
  const current=beginning(asOf);
  from=addMonths(current,-24);to=addDays(current,-1);
 }else{
  from=options.from??'';to=options.to??'';
  if(!validDay(from)||!validDay(to)||from>to)throw new Error('Choose a valid custom date range');
 }
 return {mode,from,to,asOf};
}
const metric=(key:ReviewMetricKey,source:ReportRow[],field:string,basis:ReviewMetric['basis']='period-flow'):ReviewMetric=>{
 const value=total(source,field);
 const readiness:Readiness=!source.length?'unavailable':value===null?'incomplete':'needs-review';
 return {key,value,readiness,reason:!source.length?reasonNoRecords:value===null?'A recorded row has a missing or invalid amount; the figure cannot be totaled.':reasonPreview,source,basis};
};
const missing=(key:ReviewMetricKey,reason:string,basis:ReviewMetric['basis']='unverified',source:ReportRow[]=[]):ReviewMetric=>({key,value:null,readiness:'unavailable',reason,source,basis});
function makeMetrics(data:ReportData,from:string,to:string,includeSnapshot:boolean):ReviewMetrics{
 const sales=records(data.sales,from,to),saleLines=records(data.saleLines,from,to),returns=records(data.returns,from,to);
 const purchases=records(data.purchases,from,to),expenses=records(data.expenses,from,to);
 const cash=records(data.cash,from,to),cashIn=cash.filter(r=>finite(r.values.inflow)&&r.values.inflow>0),cashOut=cash.filter(r=>finite(r.values.outflow)&&r.values.outflow>0);
 const result={} as ReviewMetrics;
 result.sales=metric('sales',sales,'amount');
 result.returns=metric('returns',returns,'amount');
 const grossSales=result.sales.value??(returns.length?0:null);
 const ret=result.returns.value??0;
 result.netSales=grossSales===null?missing('netSales','No recorded sales or returns: trading coverage is not verified.'): {key:'netSales',value:two(grossSales-ret),readiness:result.sales.readiness==='incomplete'||result.returns.readiness==='incomplete'?'incomplete':'needs-review',
 reason:'Recorded invoice totals less recorded return amounts. Completeness and dates require review.',source:[...sales,...returns],basis:'period-flow'};
 result.purchases=metric('purchases',purchases,'amount');
 result.expenses=metric('expenses',expenses,'amount');
 result.cashIn=metric('cashIn',cashIn,'inflow');
 result.cashOut=metric('cashOut',cashOut,'outflow');
 const costMissing=sales.length>0&&(!saleLines.length||saleLines.some(l=>!finite(l.values.cost))) ;
 const costTotal=total(saleLines,'cost');
 result.costOfGoods=costMissing||!saleLines.length?{key:'costOfGoods',value:null,readiness:sales.length?'incomplete':'unavailable',
 reason:sales.length?'Historical issue cost is missing for at least one sold item or the source lines are incomplete.':'No verified historical cost coverage.',source:saleLines,basis:'period-flow'}:
 {key:'costOfGoods',value:costTotal,readiness:costTotal===null?'incomplete':'needs-review',reason:'Sale-time costs taken from recorded issued lines; no current-cost substitution.',source:saleLines,basis:'period-flow'};
 const canCalculate=result.netSales.value!==null&&result.costOfGoods.value!==null&&!returns.length;
 result.grossProfit=canCalculate?{key:'grossProfit',value:two(result.netSales.value!-result.costOfGoods.value!),readiness:'needs-review',
 reason:'Recorded provisional margin before operating costs; source completeness requires review.',source:[...sales,...saleLines],basis:'period-flow'}:
 {key:'grossProfit',value:null,readiness:sales.length||returns.length?'incomplete':'unavailable',
 reason:returns.length?'Cost reversal for recorded returns is not complete. Historical gross profit cannot be claimed.':
 'Missing verified sales/issue-cost coverage; no estimate from current purchase prices.',source:[...sales,...saleLines,...returns],basis:'period-flow'};
 result.netProfit=missing('netProfit','A complete posted expense, other-income, tax, interest and return-adjustment ledger is not available. This is not an audited P&L.', 'unverified',[...sales,...expenses]);
 result.cashBalance=missing('cashBalance','Opening/reconciled Cash, Bank and MFS balances are unavailable; payment movements are not bank balances.');
 const snapshotReason='Period-end reconstruction is unavailable. The current preview snapshot must never be displayed as an older balance.';
 if(!includeSnapshot){
  result.stockValue=missing('stockValue',snapshotReason,'as-of-snapshot');
  result.customerDue=missing('customerDue',snapshotReason,'as-of-snapshot');
  result.supplierDue=missing('supplierDue',snapshotReason,'as-of-snapshot');
  result.lowStockCount=missing('lowStockCount',snapshotReason,'as-of-snapshot');
 }else{
  const stocks=data.stock.filter(r=>finite(r.values.stock));
  const stockValue=total(stocks,'cost');
  result.stockValue=stocks.length?{key:'stockValue',value:stockValue,readiness:stockValue===null?'incomplete':'needs-review',
   reason:stockValue===null?'Current stock lots/valuation are not fully reconciled; missing costs remain unknown.':'Current as-of recorded lot-cost valuation only; owned stock and exclusions need review.',
   source:stocks,basis:'as-of-snapshot'}:missing('stockValue','No current stock source available.','as-of-snapshot');
  const low=stocks.filter(r=>finite(r.values.minStock)&&Number(r.values.stock)<=Number(r.values.minStock));
  result.lowStockCount=stocks.length?{key:'lowStockCount',value:low.length,readiness:'needs-review',reason:'Current recorded stock compared with minimum levels.',source:low,basis:'as-of-snapshot'}:missing('lowStockCount','Stock sources are not available.','as-of-snapshot');
  const owed=data.sales.filter(r=>finite(r.values.due)&&r.values.due>0);
  result.customerDue=metric('customerDue',owed,'due','as-of-snapshot');
  if(owed.length)result.customerDue.reason='Current invoice balances; not a historically reconstructed or contractually overdue balance.';
  const payable=data.purchases.filter(r=>finite(r.values.due)&&r.values.due>0);
  result.supplierDue=metric('supplierDue',payable,'due','as-of-snapshot');
  if(payable.length)result.supplierDue.reason='Current supplier balances; due dates and historical reconstruction require source review.';
 }
 return result;
}
function priorities(data:ReportData,metrics:ReviewMetrics,from:string,to:string,includeSnapshot:boolean):ReviewPriority[]{
 const selected:ReviewPriority[]=[];
 if(includeSnapshot&&metrics.customerDue.value!==null&&metrics.customerDue.value>0)selected.push({id:'collect',title:'Review customer collections',titleBn:'গ্রাহকের বাকি আদায় দেখুন',
 description:'Start with the recorded unpaid invoices; invoice age is not an overdue claim.',descriptionBn:'বাকি বিল দেখে আদায়ের কাজ ধরুন; বিলের বয়স মানেই মেয়াদোত্তীর্ণ নয়।',report:'receivables',source:metrics.customerDue.source});
 if(includeSnapshot&&metrics.lowStockCount.value!==null&&metrics.lowStockCount.value>0)selected.push({id:'stock',title:'Review low stock',titleBn:'কম স্টক পর্যালোচনা করুন',
 description:'Check stock exceptions and reorder quantities before purchasing.',descriptionBn:'ক্রয়ের আগে কম স্টক ও প্রস্তাবিত পরিমাণ দেখুন।',report:'low-stock',source:metrics.lowStockCount.source});
 const cost=records(data.expenses,from,to).filter(r=>finite(r.values.amount)&&r.values.amount>0).sort((a,b)=>Number(b.values.amount)-Number(a.values.amount));
 if(cost.length)selected.push({id:'expense',title:'Inspect major expenses',titleBn:'বড় খরচ যাচাই করুন',
 description:'Open the recorded expenses before deciding where to cut cost.',descriptionBn:'খরচ কমানোর সিদ্ধান্তের আগে মূল ব্যয় দেখুন।',report:'expenses',source:cost.slice(0,10)});
 return selected.slice(0,3);
}
export function buildBusinessReview(data:ReportData,request:ReviewRequest):BusinessReviewResult{
 if(!validDay(request.from)||!validDay(request.to)||request.from>request.to||!validDay(request.asOf))throw new Error('Invalid Business Review period');
 if(request.asOf!==data.asOf)throw new Error('Report data as-of changed; reload the source before generating');
 const end=request.to<data.asOf?request.to:data.asOf;
 const exists=request.from<=end;
 const summary=exists?makeMetrics(data,request.from,end,end===data.asOf):makeMetrics(data,'9999-12-30','9999-12-31',false);
 const months:ReviewMonth[]=[];
 if(exists){
  for(let first=beginning(request.from);first<=end;first=addMonths(first,1)){
   const start=first>request.from?first:request.from,finish=monthEnd(first)<end?monthEnd(first):end;
   months.push({month:first.slice(0,7),from:start,to:finish,partial:start!==first||finish!==monthEnd(first),metrics:makeMetrics(data,start,finish,finish===data.asOf)});
  }
 }
 return {request,effectiveTo:end,metrics:summary,months,priorities:exists?priorities(data,summary,request.from,end,end===data.asOf):[],certified:false,
 disclaimer:'Internal management review of recorded preview entries only; incomplete source coverage, historical stock and reconciled account balances are not certified or independently audited.'};
}
