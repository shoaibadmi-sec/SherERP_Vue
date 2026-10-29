import test from 'node:test';
import assert from 'node:assert/strict';
import { buildReportData, runReport, previousPeriod, reorderQuantity, defaultReportFilters } from '../src/reports/model.ts';
import { paramsForReport, parsePreferences } from '../src/reports/preferences.ts';

const invoice = (patch = {}) => ({ id:'s1',invoice:'INV-1',date:'01 Oct 2026',time:'10:00',party:'Rahman',partyId:'c1',items:1,total:90,subtotal:100,discount:10,rounding:0,paid:90,due:0,method:'Cash',status:'Paid',payments:[{id:'p1',method:'Cash',amount:40,account:'Counter'},{id:'p2',method:'bKash',amount:50,account:'Merchant'}],salesperson:'Anis',lines:[{id:'l1',productId:'p1',name:'Pipe',quantity:'10',unit:'Pcs',soldBaseQuantity:10,price:10,total:100}],...patch });
const product = {id:'p1',name:'Pipe',nameBn:'পাইপ',sku:'P-1',category:'Plumbing',brand:'RFL',unit:'Pcs',stock:12,minStock:5,sellPrice:10,purchasePrice:1,active:true};
const input = (patch = {}) => ({asOf:'2026-10-24',invoices:[invoice()],returns:[],purchases:[],expenses:[],products:[product],lots:[],movements:[],transactions:[],warranty:[],...patch});

test('date, category and search filters change actual source totals and exclude draft/deleted sales',()=>{
 const data=buildReportData(input({invoices:[invoice(),invoice({id:'draft',recordStatus:'Draft',total:500}),invoice({id:'deleted',recordStatus:'Deleted'}),invoice({id:'s2',date:'02 Oct 2026',invoice:'INV-2',total:200})]}) as never);
 const f={...defaultReportFilters,from:'2026-10-01',to:'2026-10-01',category:'Plumbing',search:'Rahman'};
 const result=runReport('sales-register',data,f);
 assert.equal(result.rows.length,1);assert.equal(result.totals.amount,90);
 assert.equal(runReport('sales-register',data,{...f,category:'Electrical'}).rows.length,0);
});
test('unknown historical cost stays unknown even when the product master has a purchase price',()=>{
 const data=buildReportData(input() as never);
 assert.equal(data.saleLines[0].values.amount,90);assert.equal(data.saleLines[0].values.profit,null);
 assert.equal(runReport('product-profit',data,defaultReportFilters).rows[0].values.profit,null);
});
test('historical cost and integer discount allocation reconcile to invoice net revenue',()=>{
 const lines=[{id:'l1',productId:'p1',name:'Pipe',quantity:'1',unit:'Pcs',soldBaseQuantity:1,price:50,total:50,unitCost:30},{id:'l2',productId:'p1',name:'Pipe',quantity:'1',unit:'Pcs',soldBaseQuantity:1,price:50,total:50,unitCost:20}];
 const data=buildReportData(input({invoices:[invoice({total:99.99,discount:0.01,lines})]}) as never);
 assert.equal(Math.round(data.saleLines.reduce((s,r)=>s+Number(r.values.amount),0)*100),9999);
 assert.equal(runReport('product-profit',data,defaultReportFilters).rows[0].values.profit,49.99);
});
test('account filtering totals only the matching split, not the whole invoice receipt',()=>{
 const data=buildReportData(input() as never);
 const r=runReport('cash-book',data,{...defaultReportFilters,account:'Merchant'});
 assert.equal(r.totals.inflow,50);assert.equal(r.totals.outflow,0);
});
test('current outstanding is not fabricated as an historical balance or a due-date overdue amount',()=>{
 const data=buildReportData(input({invoices:[invoice({paid:20,due:70})]}) as never);
 const r=runReport('receivables',data,{...defaultReportFilters,from:'2026-09-01',to:'2026-09-30'});
 assert.equal(r.rows.length,1);assert.equal(r.rows[0].values.due,70);
 assert.match(r.basis,/current/i);assert.equal(r.rows[0].values.days,23);
});
test('previous comparison period has exactly the same number of calendar days across months',()=>{
 assert.deepEqual(previousPeriod({from:'2026-10-01',to:'2026-10-24'}),{from:'2026-09-07',to:'2026-09-30'});
});
test('reorder excludes expired stock and rounds purchasing packs without subtracting commitments twice',()=>{
 assert.deepEqual(reorderQuantity({stock:120,dailyDemand:20,leadDays:10,reviewDays:7,safety:40,pack:100}),{quantity:300,daysCover:6});
 const d=buildReportData(input({products:[{...product,stock:12}],lots:[{id:'old',productId:'p1',quantity:12,available:12,unitCost:1,source:'Opening',label:'Old',receivedAt:'2026-09-01',expiryDate:'2026-10-20'}]}) as never);
 assert.equal(d.stock[0].values.stock,0);assert.equal(d.stock[0].values.expired,12);
});
test('unknown mixed-unit quantities are not guessed from human-readable compound text',()=>{
 const d=buildReportData(input({invoices:[invoice({lines:[{id:'l1',productId:'p1',name:'Pipe',quantity:'2 Box 5 Pcs',unit:'Pcs',price:100,total:100}]})]}) as never);
 assert.equal(d.saleLines[0].values.quantity,null);
});
test('malformed date ranges fail safely instead of treating them as all dates',()=>{
 const d=buildReportData(input() as never);
 assert.equal(runReport('sales-register',d,{...defaultReportFilters,from:'bad-date',to:'2026-10-01'}).rows.length,0);
});
test('an intentionally cleared date range survives the URL round trip',()=>{
 const params=paramsForReport('sales-register',defaultReportFilters,['label','amount']);
 assert.equal(params.has('from'),true);assert.equal(params.get('from'),'');assert.equal(params.has('to'),true);
});
test('corrupt saved views recover without crashing or creating unknown reports',()=>{
 assert.equal(parsePreferences('{broken').views.length,0);
 assert.equal(parsePreferences(JSON.stringify({views:[{id:'bad',name:'Bad',report:'nonexistent',filters:{},columns:[]}]})).views.length,0);
});
test('supplier returns reduce current payable through the existing source position',()=>{
 const p={id:'pu1',ref:'PUR-1',date:'01 Oct 2026',supplierId:'s1',supplier:'Supplier',items:'Pipe',total:100,paid:20};
 const d=buildReportData(input({purchases:[p],purchaseEvents:[{id:'r1',purchaseId:'pu1',kind:'return',date:'2026-10-02',reason:'Return',before:p,after:p,amount:30,refund:0,settlement:'credit'}]}) as never);
 assert.equal(runReport('payables',d,defaultReportFilters).totals.due,50);
});
test('finance splits preserve per-account amounts instead of joining account names',()=>{
 const tx={id:'fin1',source:'finance',sourceId:'fin1',reference:'FIN1',type:'Owner Credit',transactionDate:'2026-10-01',createdAt:'2026-10-01T10:00:00Z',postedBy:'Owner',amount:100,moneyIn:100,moneyOut:0,accounts:['Counter','Bank'],paymentBreakdown:[{label:'Counter',amount:30},{label:'Bank',amount:70}],status:'Posted',countsTowardCashflow:true};
 const d=buildReportData(input({transactions:[tx]}) as never);
 assert.equal(runReport('finance-movements',d,{...defaultReportFilters,account:'Bank'}).totals.inflow,70);
 assert.equal(runReport('cash-book',d,{...defaultReportFilters,account:'Bank'}).totals.inflow,70);
});
test('fractional base quantities retain their precision in grouped demand',()=>{
 const d=buildReportData(input({invoices:[invoice({lines:[{id:'small',productId:'p1',name:'Pipe',quantity:'0.004',unit:'Pcs',soldBaseQuantity:0.004,price:100,total:100}]})]}) as never);
 assert.equal(runReport('product-sales',d,defaultReportFilters).rows[0].values.quantity,0.004);
 assert.equal(runReport('reorder',d,{...defaultReportFilters,from:'2026-10-01',to:'2026-10-01'}).rows[0].values.quantity,0.004);
});
test('stock velocity exposes unsold stock without inventing demand or adding unlike units',()=>{
 const d=buildReportData(input({products:[product,{...product,id:'p2',name:'Wire',unit:'Feet',stock:10}]}) as never);
 const r=runReport('stock-velocity',d,{...defaultReportFilters,from:'2026-10-01',to:'2026-10-10'});
 assert.equal(r.rows.length,2);
 assert.equal(r.rows.find(r=>r.productId==='p1')?.values.quantity,10);
 assert.equal(r.rows.find(r=>r.productId==='p2')?.values.cover,null);
});
