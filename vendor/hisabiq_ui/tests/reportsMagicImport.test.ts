import test from 'node:test';
import assert from 'node:assert/strict';
import { toMagicReportsDataset } from '../src/reports/magicpatterns/adapter.ts';
import { summarize, payables } from '../src/reports/magicpatterns/utils/reports/metrics.ts';
import { resolveMagicEvidence } from '../src/reports/magicpatterns/evidence.ts';
import { defaultReportFilters } from '../src/reports/model.ts';
import type { ReportData, ReportRow } from '../src/reports/types.ts';

const asOf='2026-10-27';
const date='2026-10-26';
function empty():ReportData{return {asOf,sales:[],saleLines:[],returns:[],purchases:[],purchaseLines:[],expenses:[],stock:[],lots:[],movements:[],cash:[],finance:[],warranty:[],quality:[]};}
function invoice(id:string, children:ReportRow[]):ReportRow{return {id,label:'INV-'+id,date,party:'Client',partyId:'p-client',status:'Paid',values:{amount:children.reduce((a,r)=>a+Number(r.values.amount??0),0),paid:0,due:0,discount:0},children};}
const source=(id:string,productId:string,amount:number,quantity:number|null,cost:number|null):ReportRow=>({id,label:'Pipe',productId,party:'Client',partyId:'p-client',date,status:'Sold',values:{amount,quantity,cost,profit:cost===null?null:amount-cost,unit:'Pcs'}});
const f={...defaultReportFilters,from:'2026-10-01',to:asOf};

test('an unconvertible historical quantity cannot silently erase the recorded sale total',()=>{
 const d=empty(),line=source('s1','pipe',200,null,null);d.saleLines=[line];d.sales=[invoice('1',[line])];
 const before=JSON.stringify(d),ds=toMagicReportsDataset(d),summary=summarize(ds,'2026-10-01',asOf);
 assert.equal(ds.lines[0].revenue,200);
 assert.equal(summary.revenue,200,'Net sales must be derived from frozen recorded line revenue, not synthetic unit price');
 assert.equal(summary.uncostedRevenue,200);
 assert.equal(ds.lines[0].unitCost,null,'Unknown cost must not become zero or current purchase price');
 assert.equal(JSON.stringify(d),before,'Read-only adapter must never change operational records');
});

test('a supplier bill without an agreed due date is not contractually overdue',()=>{
 const d=empty();d.purchases=[{id:'po1',label:'PO-1',party:'Supplier A',date,status:'Due',values:{amount:100,paid:40,due:60}}];
 const ds=toMagicReportsDataset(d);
 assert.equal(ds.purchases[0].dueDate,'');
 const result=payables(ds);
 assert.equal(result.length,1);
 assert.equal(result[0].amount,60);
 assert.equal(result[0].overdue,0,'Unknown due dates must not be counted as past due');
 assert.equal(result[0].oldestDue,null,'No artificial oldest contractual due date');
});

test('drilldown resolves exact product records, nested invoices and current historical cost status',()=>{
 const d=empty(),a=source('line-a','pipe',100,2,70),b=source('line-b','pipe',150,3,null),other=source('line-c','cable',80,1,50);
 d.saleLines=[a,b,other];d.sales=[invoice('1',[a,other]),invoice('2',[b])];
 const before=JSON.stringify(d);
 const result=resolveMagicEvidence({report:'product-profit',label:'Pipe profit',field:'productId',value:'pipe'},d,f,'profit');
 assert.equal(result.children?.length,1);
 const group=result.children![0];
 assert.equal(group.children?.length,2);
 assert.deepEqual(group.children?.map(x=>x.id).sort(),['line-a','line-b']);
 assert.equal(group.values.profit,null,'Missing cost in one contributor must keep aggregated profit unknown');
 assert.equal(result.values.profit,null);
 assert.equal(JSON.stringify(d),before);
});

test('no matching evidence is explicit and cannot substitute unrelated rows',()=>{
 const d=empty();
 const result=resolveMagicEvidence({report:'receivables',label:'Unknown customer',field:'party',value:'not-real'},d,f,'dues');
 assert.equal(result.children?.length,0);
 assert.equal(result.status,'Source unavailable');
 assert.match(result.note??'',/No exact supporting source/);
});
