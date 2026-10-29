import type { ReportData, ReportRow } from '../types.ts';
import type { BusinessReviewResult } from './types.ts';

export type AuditRank={id:string;label:string;amount:number;quantity:number|null;unit:string;source:ReportRow[]};
export type AuditBook={
 review:BusinessReviewResult;
 topSelling:AuditRank[];topCustomers:AuditRank[];topPerformers:AuditRank[];
 topSuppliers:AuditRank[];topOrdered:AuditRank[];
 expenseCategories:AuditRank[];expenses:ReportRow[];
 customerDues:ReportRow[];supplierDues:ReportRow[];duesAsOf:string|null;
 financeTransactions:ReportRow[];cashTransactions:ReportRow[];
 salesTrend:AuditRank[];priorities:BusinessReviewResult['priorities'];
};
const finite=(v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v);
const cents=(v:number)=>Math.round(v*100);
const round=(v:number)=>Math.round(v)/100;
const inPeriod=(row:ReportRow,r:BusinessReviewResult)=>row.date>=r.request.from&&row.date<=r.effectiveTo;
const take=(rows:ReportRow[],r:BusinessReviewResult)=>rows.filter(x=>inPeriod(x,r));
type Aggregation={id:string;label:string;amount:number;quantity:number|null;unit:string;known:boolean;source:ReportRow[]};

/** All ranked lists aggregate canonical source rows; never join invoice and line totals. */
function rank(rows:ReportRow[],key:(r:ReportRow)=>string,label:(r:ReportRow)=>string,
 field='amount',takeQuantity=false,requireComplete=false):AuditRank[]{
 const groups=new Map<string,Aggregation>();
 for(const r of rows){
  const id=key(r),a=r.values[field],q=r.values.quantity,u=String(r.values.unit??'');
  if(!id)continue;
  let g=groups.get(id);
  if(!g){g={id,label:label(r),amount:0,quantity:0,unit:'',known:true,source:[]};groups.set(id,g);}
  g.source.push(r);
  if(!finite(a)){g.known=false;continue;}
  g.amount+=cents(a);
  if(takeQuantity){
   if(!finite(q)||!u||g.unit&&g.unit!==u)g.quantity=null;
   else if(g.quantity!==null){g.quantity+=q;g.unit=u;}
  }else g.quantity=null;
 }
 return [...groups.values()].filter(g=>g.known||!requireComplete)
  .filter(g=>g.known&&Number.isFinite(g.amount)&&g.amount>0)
  .map(g=>({id:g.id,label:g.label,amount:round(g.amount),quantity:g.quantity,unit:g.unit,source:g.source}))
  .sort((a,b)=>b.amount-a.amount||a.label.localeCompare(b.label)).slice(0,5);
}
function trend(rows:ReportRow[],review:BusinessReviewResult):AuditRank[]{
 const isLong=review.months.length>1,groups=new Map<string,{cents:number;source:ReportRow[]}>();
 for(const r of take(rows,review)){
  if(!finite(r.values.amount))continue;
  const id=isLong?r.date.slice(0,7):'Week '+(Math.floor((Number(r.date.slice(8,10))-1)/7)+1);
  const current=groups.get(id)??{cents:0,source:[]};
  current.cents+=cents(r.values.amount);current.source.push(r);groups.set(id,current);
 }
 return [...groups.entries()].sort(([a],[b])=>isLong?a.localeCompare(b):a.localeCompare(b))
  .slice(-12).map(([id,value])=>({id,label:id,amount:round(value.cents),quantity:null,unit:'',source:value.source}));
}
export function buildAuditBook(data:ReportData,review:BusinessReviewResult):AuditBook{
 if(data.asOf!==review.request.asOf)throw new Error('Review and source snapshot do not have matching as-of dates');
 const sales=take(data.sales,review),lines=take(data.saleLines,review);
 const purchases=take(data.purchases,review),purchaseLines=take(data.purchaseLines,review);
 const expenses=take(data.expenses,review),finance=take(data.finance,review);
 const current=review.effectiveTo===data.asOf;
 // Current preview customer/supplier balances cannot reconstruct historic period-end balances.
 const customerDues=current?data.sales.filter(r=>finite(r.values.due)&&r.values.due>0).sort((a,b)=>Number(b.values.due)-Number(a.values.due)).slice(0,6):[];
 const supplierDues=current?data.purchases.filter(r=>finite(r.values.due)&&r.values.due>0).sort((a,b)=>Number(b.values.due)-Number(a.values.due)).slice(0,6):[];
 return {
  review,
  topSelling:rank(lines,r=>r.productId??'',r=>r.label,'amount',true),
  topCustomers:rank(sales,r=>r.partyId||(!r.party||/^walk[ -]?in|cash customer/i.test(r.party)?'':r.party),r=>r.party||'Unspecified customer'),
  topPerformers:rank(lines,r=>r.productId??'',r=>r.label,'profit',false,true),
  topSuppliers:rank(purchases,r=>r.partyId||r.party||'Unknown',r=>r.party||'Unspecified supplier'),
  topOrdered:rank(purchaseLines,r=>r.productId??'',r=>r.label,'amount',true),
  expenseCategories:rank(expenses,r=>r.category||'Uncategorised',r=>r.category||'Uncategorised'),
  expenses:[...expenses].sort((a,b)=>Number(b.values.amount??0)-Number(a.values.amount??0)).slice(0,6),
  customerDues,supplierDues,duesAsOf:current?data.asOf:null,
  financeTransactions:[...finance].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,7),
  cashTransactions:take(data.cash,review),
  salesTrend:trend(sales,review),priorities:review.priorities,
 };
}
