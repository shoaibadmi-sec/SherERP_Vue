import type { ReportData, ReportRow } from '../types';
import type { ReportDataset, ReportProduct, ProductProfile, ReportCustomer } from './types/reports';
import { addDays } from './utils/reports/period.ts';

/** Presentation-only view model: all records come from the existing HisabIQ ReportData. */
const n=(value:unknown):number|null=>typeof value==='number'&&Number.isFinite(value)?value:null;
const positive=(value:unknown)=>Math.max(0,n(value)??0);
const idOf=(row:ReportRow)=>row.partyId||row.party||'cash';
const stockId=(row:ReportRow)=>row.productId||row.id;
export function toMagicReportsDataset(data:ReportData):ReportDataset {
 const parentByLine=new Map(data.sales.flatMap(s=>(s.children??[]).map(l=>[l.id,s] as const)));
 const lineDiscount=(line:ReportRow)=>{const p=parentByLine.get(line.id);if(!p)return 0;const denominator=positive(p.values.amount);return denominator?positive(p.values.discount)*positive(line.values.amount)/denominator:0;};
 const lines=data.saleLines.map(r=>{
  const parent=parentByLine.get(r.id);const actualQuantity=n(r.values.quantity);
  const qty=actualQuantity??0;const revenue=positive(r.values.amount),discount=lineDiscount(r);
  const actualCost=n(r.values.cost);
  return {id:r.id,invoice:parent?.label??r.id,date:r.date,customerId:idOf(r),customer:r.party??'Cash sale',
   productId:r.productId??null,name:r.label,category:r.category??'',qty,unit:String(r.values.unit??''),
   price:qty>0?(revenue+discount)/qty:0,discount,revenue,unitCost:actualQuantity!==null&&actualQuantity>0&&actualCost!==null?actualCost/actualQuantity:null,source:'Recorded' as const};
 });
 const invoices=data.sales.map(r=>{
  const payments=data.cash.filter(p=>p.id.startsWith(r.id+'-pay-')&&positive(p.values.inflow)>0)
   .map(p=>({date:p.date,amount:positive(p.values.inflow),method:p.method??p.account??'Recorded'}));
  return {id:r.label,date:r.date,customerId:idOf(r),customer:r.party??'Cash sale',phone:'',total:positive(r.values.amount),
   dueOverride:positive(r.values.due),payments,source:'Recorded' as const};
 });
 const purchases=data.purchases.map(r=>({id:r.id,date:r.date,supplierId:r.partyId??r.party??'unknown',supplier:r.party??'Unknown supplier',
 productId:'',name:r.label,category:'',qty:0,unit:'',unitCost:0,amount:positive(r.values.amount),paid:positive(r.values.paid),dueDate:''}));
 const supplierIndex=new Map(purchases.map(p=>[p.supplierId,{id:p.supplierId,name:p.supplier,phone:'',area:''}]));
 const suppliers=[...supplierIndex.values()];
 const latestSoldPrice=new Map<string,number>();
 for(const l of lines){if(l.productId&&l.qty>0&&!latestSoldPrice.has(l.productId))latestSoldPrice.set(l.productId,l.revenue/l.qty);}
 const products:ReportProduct[]=data.stock.map(r=>({id:stockId(r),name:r.label,category:r.category??'',unit:String(r.values.unit??''),
  stock:positive(r.values.stock),active:true,purchasePrice:positive(r.values.unitCost),sellPrice:latestSoldPrice.get(stockId(r))??0}));
 const profiles:ProductProfile[]=data.stock.map(r=>{
  const productId=stockId(r),recent=lines.filter(l=>l.productId===productId&&l.date>=addDays(data.asOf,-27)&&l.date<=data.asOf);
  const known=recent.every(l=>l.qty>0),dailyDemand=known?recent.reduce((s,l)=>s+l.qty,0)/28:0;
  const supplierLine=data.purchaseLines.find(p=>p.productId===productId);
  const supplierId=supplierLine?.partyId??supplierLine?.party??'unknown';
  const price=n(r.values.unitCost);
  return {productId,supplierId,previousCost:null,costSource:price===null?'Missing' as const:'Purchase lot' as const,
    leadDays:7,pack:1,dailyDemand,trend:0,discountPct:0,stockAgeDays:0};
 });
 const byCustomer=new Map<string,ReportCustomer>();
 for(const invoice of invoices){if(!byCustomer.has(invoice.customerId))byCustomer.set(invoice.customerId,{id:invoice.customerId,name:invoice.customer,phone:'',
  area:'',weight:1,payDays:20,credit:invoice.dueOverride>0});}
 const expenses=data.expenses.map(r=>({id:r.id,date:r.date,category:r.category??'Other',payee:r.party??'',description:r.note??'',
  amount:positive(r.values.amount),paid:positive(r.values.paid),method:r.method??'',hasReceipt:false,source:'Recorded' as const}));
 const returns=data.returns.map(r=>({id:r.id,date:r.date,invoice:r.label,customer:r.party??'',name:r.label,qty:0,amount:positive(r.values.amount),settlement:r.status}));
 return {asOf:data.asOf,products,profiles,customers:[...byCustomer.values()],suppliers,recurringExpenses:[],variableExpenses:[],
 lines,invoices,purchases,expenses,returns,vendorBalances:[],accounts:[]};
}
