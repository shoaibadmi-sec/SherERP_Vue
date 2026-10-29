import { addDays, expenseDateIso } from '../utils/dateRange.ts';
import { reportDefinition } from './catalog.ts';
import { purchasePosition } from '../utils/purchaseSource.ts';
import type { CellValue, PurchaseAssumptions, ReportData, ReportFilters, ReportInput, ReportKey, ReportResult, ReportRow } from './types';

export const defaultReportFilters:ReportFilters={from:'',to:'',search:'',category:'',brand:'',product:'',party:'',user:'',account:'',status:'',compare:'none',sort:'date',direction:'desc'};
const money=(n:number)=>Math.round((n+Number.EPSILON)*100)/100;
const sum=(rows:ReportRow[],key:string)=>money(rows.reduce((n,r)=>n+(typeof r.values[key]==='number'?Number(r.values[key]):0),0));
const quantitySum=(rows:ReportRow[])=>Number(rows.reduce((n,r)=>n+Number(r.values.quantity??0),0).toFixed(12));
export const validDay=(s:string)=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s))&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;
const day=(s:string)=>expenseDateIso(s);
const age=(from:string,to:string)=>validDay(from)&&validDay(to)?Math.floor((Date.parse(to)-Date.parse(from))/86400000):null;
const posted=(r:{recordStatus?:string})=>!r.recordStatus||r.recordStatus==='Posted';
const sourceDate=(r:{transactionDate?:string;date:string})=>r.transactionDate??day(r.date);
const route=(path:string,q:string)=>'/app/'+path+'?q='+encodeURIComponent(q);
const finite=(v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v);

export function previousPeriod(range:{from:string;to:string}) {
 if(!validDay(range.from)||!validDay(range.to)||range.from>range.to)return {from:'',to:''};
 const days=Number(age(range.from,range.to))+1;
 return {from:addDays(range.from,-days),to:addDays(range.from,-1)};
}

export function reorderQuantity(i:{stock:number;dailyDemand:number;leadDays:number;reviewDays:number;safety:number;pack:number}) {
 const demand=Math.max(0,i.dailyDemand),pack=Math.max(1,i.pack);
 const target=demand*(Math.max(0,i.leadDays)+Math.max(0,i.reviewDays))+Math.max(0,i.safety);
 return {quantity:Math.ceil(Math.max(0,target-i.stock)/pack)*pack,daysCover:demand>0?money(Math.max(0,i.stock)/demand):null};
}

/** Invoice-level discount and rounding are allocated in paisa; last line owns the remainder. */
function netAmounts(total:number,weights:number[]) {
 const cents=Math.round(total*100),weight=weights.reduce((s,n)=>s+Math.max(0,n),0);let allocated=0;
 return weights.map((v,index)=>{const n=index===weights.length-1?cents-allocated:weight>0?Math.round(cents*Math.max(0,v)/weight):0;allocated+=n;return n/100;});
}

export function buildReportData(input:ReportInput):ReportData {
 const data:ReportData={asOf:input.asOf,sales:[],saleLines:[],returns:[],purchases:[],purchaseLines:[],expenses:[],stock:[],lots:[],movements:[],cash:[],finance:[],warranty:[],quality:[]};
 const catalog=new Map(input.products.map(p=>[p.id,p]));
 const issue=(row:ReportRow,note:string)=>data.quality.push({...row,id:'quality-'+row.id,label:row.label,values:{note},note,status:'Needs review',children:undefined});
 const cash=(base:ReportRow,payments:readonly {id:string;account?:string;method:string;amount:number}[],out:boolean)=>{
  for(const p of payments)if(p.amount>0)data.cash.push({...base,id:base.id+'-pay-'+p.id,account:p.account||p.method,method:p.method,
   values:{amount:p.amount,inflow:out?0:p.amount,outflow:out?p.amount:0},children:undefined,
   note:'Source payment breakdown. Individual settlement dates are unavailable; the date shown is the source record date.'});
 };
 for(const sale of input.invoices.filter(posted)){
  const date=sourceDate(sale),nets=netAmounts(sale.total,sale.lines.map(l=>l.total));
  const base:ReportRow={id:sale.id,label:sale.invoice,date,party:sale.party,partyId:sale.partyId,user:sale.salesperson,status:sale.status,method:sale.method,
   values:{amount:sale.total,paid:sale.paid,due:sale.due,discount:sale.discount,days:age(date,input.asOf)},route:route('sales',sale.invoice),note:sale.note};
  base.children=sale.lines.map((line,index)=>{
   const p=catalog.get(line.productId);
   // A readable compound label is not a reliable base quantity without a frozen snapshot.
   const quantity=finite(line.soldBaseQuantity)?line.soldBaseQuantity:/^\d+(\.\d+)?$/.test(line.quantity)?Number(line.quantity):null;
   const cost=finite(line.unitCost)&&quantity!==null?money(line.unitCost*quantity):null;
   const revenue=nets[index]??0;
   const row:ReportRow={...base,id:sale.id+'-'+line.id,label:line.name,labelBn:p?.nameBn,productId:line.productId,category:p?.category,brand:p?.brand,
    values:{quantity,unit:line.unit,amount:revenue,cost,profit:cost===null?null:money(revenue-cost),margin:cost!==null&&revenue>0?money((revenue-cost)/revenue*100):null},
    note:line.bundleSnapshot?'Package revenue; component issue costs require a dedicated source.':line.quantity+' '+line.unit,children:undefined};
   if(line.bundleSnapshot){row.values.cost=null;row.values.profit=null;row.values.margin=null;}
   if(cost===null||line.bundleSnapshot)issue(row,'Historical issue cost is missing. Current product prices are not used to calculate profit.');
   if(quantity===null)issue({...row,id:row.id+'-unit'},'Frozen base quantity is missing; compound quantity has not been guessed.');
   return row;
  });
  data.sales.push(base);data.saleLines.push(...base.children);
  if(sale.payments.length)cash(base,sale.payments,false);
  else if(sale.paid>0)issue(base,'A paid total exists without a payment-source breakdown. It is not added to the account book.');
 }
 for(const ret of input.returns.filter(posted)){
  const row:ReportRow={id:ret.id,label:ret.id,date:sourceDate(ret),party:ret.customer,partyId:ret.customerId,status:ret.settlement,
   values:{amount:ret.amount},note:ret.items,route:route('sales',ret.id)+'&tab=return-history'};
  data.returns.push(row);
  if(ret.settlement==='Cash refund'&&ret.refundMethod)cash(row,[{id:ret.id,method:ret.refundMethod,account:ret.refundAccount,amount:ret.amount}],true);
  issue({...row,id:row.id+'-return-cost'},'Return cost reversal and return-price adjustment postings are not a complete ledger in this preview.');
 }
 for(const purchase of input.purchases.filter(posted)){
  const date=purchase.businessDate??sourceDate(purchase),position=purchasePosition(purchase,input.purchaseEvents??[]);
  const row:ReportRow={id:purchase.id,label:purchase.ref,date,party:purchase.supplier,partyId:purchase.supplierId,user:purchase.postedBy,status:position.due===0?'Paid':position.paid>0?'Partial':'Due',
   values:{amount:purchase.total,paid:position.paid,due:position.due,returned:position.returned,netAmount:position.total,credit:position.credit,days:age(date,input.asOf)},route:route('purchases',purchase.ref),note:purchase.items+(position.returned?' · Supplier returns to date: '+position.returned:'')};
  row.children=(purchase.inventoryLines??[]).map((l,index)=>{
   const p=catalog.get(l.productId);
   return {...row,id:purchase.id+'-'+index,label:p?.name??l.productId,labelBn:p?.nameBn,productId:l.productId,category:p?.category,brand:p?.brand,
    values:{quantity:l.quantity,unit:p?.unit??'',unitCost:finite(l.unitCost)?l.unitCost:null,amount:finite(l.unitCost)?money(l.quantity*l.unitCost):null},children:undefined};
  });
  data.purchases.push(row);data.purchaseLines.push(...row.children);
  if(!row.children.length)issue(row,'Product-level purchase source lines are missing; supplier unit-price comparisons exclude this bill.');
  if(purchase.payments?.length)cash(row,purchase.payments,true);
  else if(purchase.paid>0)issue({...row,id:row.id+'-payment'},'A paid total exists without a payment-source breakdown. It is not added to the account book.');
  for(const event of (input.purchaseEvents??[]).filter(e=>e.purchaseId===purchase.id&&e.kind==='return'&&e.refund>0)){
   if(event.payments?.length)cash({...row,id:event.id,date:event.date,status:'Supplier refund'},event.payments,false);
  }
 }
 for(const expense of input.expenses.filter(posted)){
  const row:ReportRow={id:expense.id,label:expense.ref,date:sourceDate(expense),party:expense.payee,partyId:expense.payeeId,category:expense.category,user:expense.postedBy,method:expense.method,status:expense.paid>=expense.amount?'Paid':expense.paid>0?'Partial':'Due',
   values:{amount:expense.amount,paid:expense.paid,due:money(expense.amount-expense.paid)},note:expense.note,route:route('expenses',expense.ref)};
  data.expenses.push(row);
  if(expense.payments?.length)cash(row,expense.payments,true);
  else if(expense.paid>0)issue({...row,id:row.id+'-payment'},'Payment allocation is missing; the expense is not assigned to an account.');
 }
 for(const product of input.products.filter(p=>p.kind!=='Service'&&p.kind!=='Bundle')){
  const lots=input.lots.filter(l=>l.productId===product.id&&l.available>0),expired=lots.filter(l=>l.expiryDate&&l.expiryDate<input.asOf).reduce((s,l)=>s+l.available,0);
  const stock=Math.max(0,product.stock-expired),lotQuantity=lots.reduce((s,l)=>s+l.available,0);
  const complete=product.stock>=0&&Math.abs(lotQuantity-product.stock)<0.000001&&lots.every(l=>finite(l.unitCost)&&l.unitCost>=0);
  const cost=complete?money(lots.reduce((s,l)=>s+l.available*l.unitCost,0)):null;
  const status=stock<=0?'Out of stock':stock<=product.minStock?'Low stock':'In stock';
  const row:ReportRow={id:product.id,label:product.name,labelBn:product.nameBn,date:input.asOf,productId:product.id,category:product.category,brand:product.brand,status,
   values:{stock,minStock:product.minStock,expired,cost,unit:product.unit,unitCost:product.stock>0&&cost!==null?money(cost/product.stock):null},route:route('products',product.sku),note:product.sku};
  data.stock.push(row);
  if(!complete)issue(row,'Lot quantities or valuation costs do not fully reconcile to the current stock snapshot.');
  for(const l of lots)data.lots.push({...row,id:l.id,label:product.name+' · '+(l.batchNumber??l.label),date:day(l.receivedAt),
   values:{quantity:l.available,unit:product.unit,days:age(day(l.receivedAt),input.asOf),expiryDays:l.expiryDate?age(input.asOf,l.expiryDate):null,expiry:l.expiryDate??'',cost:finite(l.unitCost)?money(l.available*l.unitCost):null},
   status:l.expiryDate&&l.expiryDate<input.asOf?'Expired':l.expiryDate&&Number(age(input.asOf,l.expiryDate))<=30?'Expiring soon':'In stock',note:l.reference??l.source});
 }
 for(const m of input.movements){
  const p=catalog.get(m.productId);
  data.movements.push({id:m.id,label:p?.name??m.productId,labelBn:p?.nameBn,date:day(m.date),productId:m.productId,category:p?.category,brand:p?.brand,status:m.type,values:{quantity:m.quantity,unit:p?.unit??''},note:[m.reference,m.note].filter(Boolean).join(' · '),route:p?route('products',p.sku):undefined});
 }
 for(const t of input.transactions.filter(t=>t.status==='Posted')){
  if(!['finance','transfer','cheque','customer-payment','supplier-payment','receipt-voucher','payment-voucher'].includes(t.source))continue;
  const base:ReportRow={id:t.id,label:t.reference,date:t.transactionDate,party:t.party,partyId:t.partyId,user:t.postedBy,status:t.type,account:t.accounts.join(' + '),values:{inflow:t.moneyIn,outflow:t.moneyOut,amount:t.amount},note:t.details,route:t.sourceRoute};
  if(t.source==='transfer'||t.type==='Transfer'||!t.countsTowardCashflow){
   data.finance.push(base); // Transfers stay separate from operating cash movement.
   continue;
  }
  const breakdown=t.paymentBreakdown?.length?t.paymentBreakdown:t.accounts.length===1?[{label:t.accounts[0],amount:t.moneyIn||t.moneyOut}]:[];
  if(!breakdown.length){data.finance.push(base);if(t.moneyIn||t.moneyOut)issue(base,'Payment allocation is missing; the source is not assigned to a single account.');}
  for(const [index,p]of breakdown.entries()){
   const leg={...base,id:t.id+'-'+index,account:p.label,values:{inflow:t.moneyIn>0?p.amount:0,outflow:t.moneyOut>0?p.amount:0,amount:p.amount}};
   data.finance.push(leg);
   if(t.moneyIn||t.moneyOut)data.cash.push(leg);
  }
 }
 for(const w of input.warranty){
  const p=catalog.get(w.productId);
  data.warranty.push({id:w.id,label:w.id,date:day(w.receivedAt.split(',')[0]),productId:w.productId,category:p?.category,brand:p?.brand,party:w.customer,partyId:w.customerId,status:w.status,
   values:{},note:w.product+' · '+w.issue,route:'/app/warranty'});
 }
 return data;
}

const numberKeys=['amount','paid','due','cost','profit','discount','inflow','outflow','count'];
export function reportCell(row:ReportRow,key:string):CellValue {
 if(key==='label')return row.label;
 if(key==='date')return row.date;
 if(key==='note')return row.note??'';
 if(['category','brand','party','user','account','method','status'].includes(key))return row[key as 'category']??'';
 return row.values[key]??null;
}

function matches(row:ReportRow,f:ReportFilters,dated:boolean) {
 if(dated&&((f.from&&!validDay(f.from))||(f.to&&!validDay(f.to))||(f.from&&f.to&&f.from>f.to)))return false;
 if(dated&&((f.from&&(!row.date||row.date<f.from))||(f.to&&(!row.date||row.date>f.to))))return false;
 if(f.category&&row.category!==f.category&&!row.children?.some(r=>r.category===f.category))return false;
 if(f.brand&&row.brand!==f.brand&&!row.children?.some(r=>r.brand===f.brand))return false;
 if(f.product&&row.productId!==f.product&&!row.children?.some(r=>r.productId===f.product))return false;
 if(f.party&&row.party!==f.party)return false;
 if(f.user&&row.user!==f.user)return false;
 if(f.account&&row.account!==f.account)return false;
 if(f.status&&row.status!==f.status)return false;
 const q=f.search.trim().toLocaleLowerCase();
 return !q||[row.label,row.labelBn,row.party,row.note,row.category,row.brand,...Object.values(row.values)].join(' ').toLocaleLowerCase().includes(q);
}

function grouped(rows:ReportRow[],by:'productId'|'category'|'party',label:'label'|'category'|'party'):ReportRow[]{
 const groups=new Map<string,ReportRow[]>();
 for(const r of rows){const key=r[by]||'Unspecified';groups.set(key,[...(groups.get(key)??[]),r]);}
 return [...groups.entries()].map(([id,children])=>{
  const first=children[0],values:Record<string,CellValue>={count:children.length};
  for(const key of numberKeys.filter(k=>k!=='count'))values[key]=children.some(c=>c.values[key]===null)?null:sum(children,key);
  const units=new Set(children.map(r=>r.values.unit).filter(Boolean));
  values.quantity=units.size===1&&!children.some(r=>r.values.quantity===null)?quantitySum(children):null;
  values.unit=units.size===1?String([...units][0]):'';
  values.margin=finite(values.profit)&&Number(values.amount)>0?money(values.profit/Number(values.amount)*100):null;
  return {id:'group-'+id,label:String(first[label]??id),labelBn:label==='label'?first.labelBn:undefined,date:'',status:'',category:first.category,brand:first.brand,productId:by==='productId'?id:undefined,party:by==='party'?id:undefined,values,children};
 });
}

export function runReport(key:ReportKey,data:ReportData,f:ReportFilters,assumptions:PurchaseAssumptions={leadDays:7,reviewDays:7,safety:0,pack:1,budget:0}):ReportResult {
 const definition=reportDefinition(key),snapshot=!!definition.snapshot;
 let basis=snapshot?'Current snapshot · '+data.asOf:'Source records in the selected period';
 let basisBn=snapshot?'বর্তমান অবস্থার তথ্য · '+data.asOf:'নির্বাচিত সময়কালের মূল রেকর্ড';
 const select=(rows:ReportRow[],dated=!snapshot)=>rows.filter(r=>matches(r,f,dated));
 let rows:ReportRow[]=[];
 switch(key){
  case 'overview':case 'sales-register':rows=select(data.sales);break;
  case 'product-sales':case 'product-profit':rows=grouped(select(data.saleLines),'productId','label');break;
  case 'category-sales':rows=grouped(select(data.saleLines),'category','category');break;
  case 'customer-sales':rows=grouped(select(data.sales),'party','party');break;
  case 'sales-returns':rows=select(data.returns);break;
  case 'discounts':rows=select(data.sales).filter(r=>Number(r.values.discount)>0);break;
  case 'purchases':rows=select(data.purchases);break;
  case 'supplier-purchases':rows=grouped(select(data.purchases),'party','party');break;
  case 'purchase-prices':rows=select(data.purchaseLines);break;
  case 'stock':rows=select(data.stock);break;
  case 'low-stock':rows=select(data.stock).filter(r=>r.status!=='In stock');break;
  case 'stock-velocity':{
   const sales=data.saleLines.filter(r=>matches(r,{...f,status:'',search:''},true));
   const span=validDay(f.from)&&validDay(f.to)?Number(age(f.from,f.to))+1:0;
   rows=select(data.stock,false).map(stock=>{
    const sold=sales.filter(r=>r.productId===stock.productId),known=sold.every(r=>r.values.quantity!==null),quantity=known?quantitySum(sold):null;
    return {...stock,values:{...stock.values,quantity,cover:quantity!==null&&quantity>0&&span>0?Number((Number(stock.values.stock)/(quantity/span)).toFixed(2)):null},
     note:sold.length?'Recorded sales in the observation window; no lost-sales estimate.':'No recorded sales in this window; demand has not been invented.'};
   });
   basis='Current usable stock with recorded sales quantities in the selected observation window';basisBn='বর্তমান ব্যবহারযোগ্য স্টক ও নির্বাচিত সময়কালের সংরক্ষিত বিক্রয়ের পরিমাণ';break;
  }
  case 'stock-ageing':rows=select(data.lots).map(r=>({...r,values:{...r.values,days:age(r.date,data.asOf)}}));break;
  case 'expiry':rows=select(data.lots).filter(r=>r.values.expiry);break;
  case 'stock-movements':rows=select(data.movements);break;
  case 'receivables':case 'collections':rows=select(data.sales).filter(r=>Number(r.values.due)>0);basis+=' · invoice age, not overdue days';basisBn+=' · বিলের বয়স, মেয়াদ পেরোনোর দিন নয়';break;
  case 'payables':rows=select(data.purchases).filter(r=>Number(r.values.due)>0);basis+=' · invoice age, not overdue days';basisBn+=' · বিলের বয়স, মেয়াদ পেরোনোর দিন নয়';break;
  case 'cash-book':rows=select(data.cash);basis='Payment breakdown preview · dates follow source records, not a reconciled cash ledger';basisBn='পেমেন্টের প্রিভিউ · তারিখ মূল রেকর্ড অনুযায়ী, মিলিয়ে নেওয়া ক্যাশ খাতা নয়';break;
  case 'expenses':rows=select(data.expenses);break;
  case 'expense-categories':rows=grouped(select(data.expenses),'category','category');break;
  case 'finance-movements':rows=select(data.finance);break;
  case 'warranty':rows=select(data.warranty);break;
  case 'data-quality':rows=select(data.quality);break;
  case 'reorder':{
   const demand=data.saleLines.filter(r=>matches(r,{...f,status:'',search:''},true));
   const observed=Number(age(f.from,f.to))+1;
   const days=f.from&&f.to&&observed>0?observed:0;
   rows=select(data.stock,false).map(stock=>{
    const sold=demand.filter(r=>r.productId===stock.productId),known=sold.every(r=>r.values.quantity!==null);
    const quantity=quantitySum(sold),daily=days&&known?quantity/days:0;
    const suggestion=reorderQuantity({stock:Number(stock.values.stock),dailyDemand:daily,leadDays:assumptions.leadDays,reviewDays:assumptions.reviewDays,safety:assumptions.safety,pack:assumptions.pack});
    const unitCost=stock.values.unitCost;
    const qty=days&&sold.length&&known?suggestion.quantity:null;
    return {...stock,values:{...stock.values,quantity:known?quantity:null,suggested:qty,cover:suggestion.daysCover,amount:qty!==null&&finite(unitCost)?money(qty*unitCost):null},
     note:qty===null?'Choose a dated demand window with recorded base quantities.':sold.length<3?'Limited sales history; review this suggestion.':'Owner-entered lead time; no confirmed incoming or reservation source.'};
   });
   basis='Current usable stock + selected sales observation window; lead time, safety and pack size are owner assumptions';
   basisBn='বর্তমান ব্যবহারযোগ্য স্টক ও নির্বাচিত সময়ের বিক্রয়; ডেলিভারি, সেফটি ও প্যাকের আকার আপনার অনুমান';
   break;
  }
  default:rows=[];
 }
 rows=[...rows].sort((a,b)=>{
  const x=reportCell(a,f.sort),y=reportCell(b,f.sort);
  if(x===null||x==='')return y===null||y===''?0:1;if(y===null||y==='')return -1;
  const result=typeof x==='number'&&typeof y==='number'?x-y:String(x).localeCompare(String(y));
  return f.direction==='asc'?result:-result;
 });
 const totals:Record<string,number|null>={};
 for(const k of numberKeys)totals[k]=rows.some(r=>r.values[k]===null)?null:sum(rows,k);
 return {rows,totals,basis,basisBn};
}
