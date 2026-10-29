import test from 'node:test';
import assert from 'node:assert/strict';
import type { ReportData, ReportRow } from '../src/reports/types.ts';
import { reviewPeriod, buildBusinessReview } from '../src/reports/review/businessReview.ts';

const asOf='2026-10-27';
const row=(id:string,date:string,amount:number,more:Record<string,number|null>={},extra:Partial<ReportRow>={}):ReportRow=>({id,label:id,date,status:'Posted',values:{amount,...more},...extra});
const empty=():ReportData=>({asOf,sales:[],saleLines:[],returns:[],purchases:[],purchaseLines:[],expenses:[],stock:[],lots:[],movements:[],cash:[],finance:[],warranty:[],quality:[]});

test('monthly, yearly and 24 completed months honor calendar boundaries and source as-of',()=>{
 const monthly=reviewPeriod('monthly',{asOf,month:'2024-02'});
 assert.equal(monthly.from,'2024-02-01');assert.equal(monthly.to,'2024-02-29');
 const yearly=reviewPeriod('yearly',{asOf,year:'2025'});
 assert.deepEqual([yearly.from,yearly.to],['2025-01-01','2025-12-31']);
 const last=reviewPeriod('last24',{asOf});
 assert.deepEqual([last.from,last.to],['2024-10-01','2026-09-30']);
 const result=buildBusinessReview(empty(),last);
 assert.equal(result.months.length,24);
 assert.equal(result.months[0].month,'2024-10');
 assert.equal(result.months[23].month,'2026-09');
});

test('blank history is unknown, never fabricated zero or certified profit',()=>{
 const result=buildBusinessReview(empty(),reviewPeriod('monthly',{asOf,month:'2026-09'}));
 assert.equal(result.metrics.sales.value,null);
 assert.equal(result.metrics.expenses.value,null);
 assert.equal(result.metrics.netProfit.value,null);
 assert.equal(result.metrics.stockValue.value,null);
 assert.equal(result.metrics.customerDue.value,null);
 assert.equal(result.metrics.sales.readiness,'unavailable');
 assert.equal(result.certified,false);
});

test('recorded sales, returns, purchase, expenses and cash remain separate, not double counted',()=>{
 const d=empty();
 d.sales=[row('s','2026-10-08',150,{due:20})];
 d.saleLines=[row('l','2026-10-08',150,{cost:90,profit:60})];
 d.returns=[row('r','2026-10-09',10)];
 d.purchases=[row('p','2026-10-11',100,{due:25})];
 d.expenses=[row('e','2026-10-12',20)];
 d.cash=[row('in','2026-10-08',80,{inflow:80,outflow:0}),row('out','2026-10-12',35,{inflow:0,outflow:35})];
 d.finance=[row('transfer','2026-10-12',10000,{inflow:10000,outflow:10000}, {status:'Transfer'})];
 const before=JSON.stringify(d),out=buildBusinessReview(d,reviewPeriod('monthly',{asOf,month:'2026-10'}));
 assert.equal(out.metrics.sales.value,150);
 assert.equal(out.metrics.returns.value,10);
 assert.equal(out.metrics.netSales.value,140);
 assert.equal(out.metrics.purchases.value,100);
 assert.equal(out.metrics.expenses.value,20);
 assert.equal(out.metrics.cashIn.value,80);
 assert.equal(out.metrics.cashOut.value,35);
 assert.equal(out.metrics.grossProfit.value,null,'missing return cost reversal makes gross profit incomplete');
 assert.equal(out.metrics.netProfit.value,null);
 assert.equal(JSON.stringify(d),before,'report generation must not mutate source records');
});

test('historical issue costs remain missing; no fallback to current product prices',()=>{
 const d=empty();d.sales=[row('invoice','2026-10-01',200)];d.saleLines=[row('line','2026-10-01',200,{cost:null})];
 const out=buildBusinessReview(d,reviewPeriod('monthly',{asOf,month:'2026-10'}));
 assert.equal(out.metrics.grossProfit.value,null);
 assert.equal(out.metrics.grossProfit.readiness,'incomplete');
 assert.equal(out.metrics.netProfit.value,null);
});

test('as-of current stock and dues stay point-in-time and never sum across months',()=>{
 const d=empty();
 d.stock=[row('a',asOf,0,{stock:5,cost:500,minStock:6}),row('b',asOf,0,{stock:3,cost:300,minStock:0})];
 d.sales=[row('s',asOf,100,{due:30})];
 d.purchases=[row('p',asOf,50,{due:10})];
 const current=buildBusinessReview(d,reviewPeriod('monthly',{asOf,month:'2026-10'}));
 assert.equal(current.metrics.stockValue.value,800);
 assert.equal(current.metrics.customerDue.value,30);
 assert.equal(current.metrics.supplierDue.value,10);
 const older=buildBusinessReview(d,reviewPeriod('monthly',{asOf,month:'2026-09'}));
 assert.equal(older.metrics.stockValue.value,null);
 assert.equal(older.metrics.customerDue.value,null);
 const annual=buildBusinessReview(d,reviewPeriod('yearly',{asOf,year:'2026'}));
 assert.equal(annual.metrics.stockValue.value,800);
 assert.equal(annual.months.slice(0,-1).every(m=>m.metrics.stockValue.value===null),true);
});

test('priorities identify a source-linked actionable due, stock warning, and expense',()=>{
 const d=empty();
 d.stock=[row('pipe',asOf,0,{stock:1,cost:20,minStock:5})];
 d.sales=[row('INV-1',asOf,100,{due:60})];
 d.expenses=[row('exp','2026-10-01',40,{}, {category:'Transport'})];
 const r=buildBusinessReview(d,reviewPeriod('monthly',{asOf,month:'2026-10'}));
 assert.equal(r.priorities.length,3);
 assert.equal(r.priorities[0].source.length>0,true);
 assert.equal(r.priorities.every(p=>p.source.length>0),true);
 assert.equal(r.priorities.every(p=>p.report.length>0),true);
});

test('partial current month and completed-month distinct, no future fictional rows',()=>{
 const d=empty();
 const r=buildBusinessReview(d,reviewPeriod('yearly',{asOf,year:'2026'}));
 assert.equal(r.months.length,10);
 assert.equal(r.months[r.months.length-1].month,'2026-10');
 assert.equal(r.months[r.months.length-1].partial,true);
 assert.equal(r.months[0].partial,false);
});

test('unknown stock valuation invalidates total instead of suppressing incomplete products',()=>{
 const d=empty();d.stock=[row('a',asOf,0,{stock:3,cost:120,minStock:1}),row('b',asOf,0,{stock:8,cost:null,minStock:2})];
 const r=buildBusinessReview(d,reviewPeriod('monthly',{asOf,month:'2026-10'}));
 assert.equal(r.metrics.stockValue.value,null);
 assert.equal(r.metrics.stockValue.readiness,'incomplete');
});
