import test from 'node:test';
import assert from 'node:assert/strict';
import {buildAuditBook} from '../src/reports/review/auditBook.ts';
import {auditBookHtml} from '../src/reports/review/auditBookHtml.ts';
import {buildBusinessReview,reviewPeriod} from '../src/reports/review/businessReview.ts';
import type {ReportRow,ReportData} from '../src/reports/types.ts';

const asOf='2026-10-27';
const empty=():ReportData=>({asOf,sales:[],saleLines:[],returns:[],purchases:[],purchaseLines:[],expenses:[],stock:[],lots:[],movements:[],cash:[],finance:[],warranty:[],quality:[]});
const row=(id:string,date:string,amount:number|null,more:Record<string,string|number|null>={},extra:Partial<ReportRow>={}):ReportRow=>({id,label:id,date,status:'Posted',values:{amount,...more},...extra});
const summary=(d:ReportData,mode:'monthly'|'yearly'='monthly')=>buildBusinessReview(d,reviewPeriod(mode,{asOf,month:'2026-10',year:'2026'}));
test('source-faithful ranked products, customers, suppliers, ordered items and expense categories',()=>{
 const d=empty();
 d.sales=[row('INV1','2026-10-01',120,{}, {partyId:'c1',party:'Buyer A'}),row('INV2','2026-10-03',70,{}, {partyId:'c2',party:'Buyer B'})];
 d.saleLines=[row('l1','2026-10-01',100,{profit:35,quantity:2,unit:'pcs'}, {productId:'p1',label:'LED'}),
  row('l2','2026-10-01',20,{profit:8,quantity:1,unit:'pcs'}, {productId:'p2',label:'Cable'}),
  row('l3','2026-10-03',70,{profit:30,quantity:3,unit:'pcs'}, {productId:'p1',label:'LED'})];
 d.purchases=[row('PO1','2026-10-02',120,{}, {party:'Vendor A',partyId:'s1'}),row('PO2','2026-10-04',50,{}, {party:'Vendor B',partyId:'s2'})];
 d.purchaseLines=[row('a','2026-10-02',100,{quantity:10,unit:'pcs'}, {productId:'p1',label:'LED'}),row('b','2026-10-04',50,{quantity:4,unit:'pcs'}, {productId:'p2',label:'Cable'})];
 d.expenses=[row('EXP','2026-10-05',60,{}, {category:'Transport'})];
 const b=buildAuditBook(d,summary(d));
 assert.equal(b.topSelling[0].label,'LED');
 assert.equal(b.topSelling[0].amount,170);
 assert.equal(b.topCustomers[0].label,'Buyer A');
 assert.equal(b.topCustomers[0].amount,120);
 assert.equal(b.topSuppliers[0].label,'Vendor A');
 assert.equal(b.topOrdered[0].label,'LED');
 assert.equal(b.topPerformers[0].amount,65);
 assert.equal(b.expenseCategories[0].label,'Transport');
 assert.equal(b.expenseCategories[0].amount,60);
 assert.equal(b.topSelling.length<=5,true);
});

test('no invented profit for absent cost; cross-unit quantities stay uncombined',()=>{
 const d=empty();
 d.saleLines=[row('l1','2026-10-01',100,{profit:null,quantity:5,unit:'Box'}, {productId:'p',label:'Cable'}),
  row('l2','2026-10-02',20,{profit:7,quantity:9,unit:'Pcs'}, {productId:'p',label:'Cable'})];
 const b=buildAuditBook(d,summary(d));
 assert.equal(b.topSelling[0].quantity,null);
 assert.equal(b.topPerformers.length,0,'partial known cost cannot masquerade as per-product gross profit');
});

test('current dues list does not leak into historical month and transfer is separately classified',()=>{
 const d=empty();
 d.sales=[row('INV','2026-10-01',100,{due:60}, {party:'Buyer',partyId:'c'})];
 d.purchases=[row('PUR','2026-10-01',50,{due:30}, {party:'Vendor',partyId:'v'})];
 d.finance=[row('XFER','2026-10-01',1000,{inflow:1000,outflow:1000},{status:'Transfer'}),row('FIN','2026-10-08',30,{inflow:30,outflow:0},{status:'Received'})];
 assert.equal(buildAuditBook(d,summary(d)).customerDues.length,1);
 assert.equal(buildAuditBook(d,summary(d)).supplierDues.length,1);
 assert.equal(buildAuditBook(d,summary(d)).financeTransactions.some(r=>r.label==='XFER'),true);
 const older=buildBusinessReview(d,reviewPeriod('monthly',{asOf,month:'2026-09'}));
 const history=buildAuditBook(d,older);
 assert.equal(history.customerDues.length,0);
 assert.equal(history.supplierDues.length,0);
 assert.equal(history.duesAsOf,null);
});

test('five A4 portrait print pages each include vector chart; escape source labels and disclose readiness',()=>{
 const d=empty();
 d.sales=[row('INVOICE <script>alert(1)</script>','2026-10-01',100,{}, {party:'Buyer & Co'})];
 const b=buildAuditBook(d,summary(d));
 const h=auditBookHtml(b,'English + Bangla');
 assert.equal((h.match(/class="audit-page"/g)??[]).length,5);
 assert.equal((h.match(/class="page-index"/g)??[]).length,5);
 assert.equal((h.match(/class="audit-chart"/g)??[]).length>=5,true);
 assert.match(h,/@page\s*\{[^}]*size:\s*A4 portrait/);
 assert.match(h,/Internal management review/);
 assert.match(h,/1 \/ 5/);
 assert.match(h,/5 \/ 5/);
 assert.equal(h.includes('<script>alert(1)</script>'),false);
 assert.match(h,/INVOICE &lt;script&gt;/);
 assert.match(h,/Buyer &amp; Co/);
});


test('yearly sales trend is chronological and not a top-five-month ranking',()=>{
 const d=empty();
 d.sales=Array.from({length:10},(_,i)=>row('INV'+i,'2026-'+String(i+1).padStart(2,'0')+'-08',10+i*7));
 const book=buildAuditBook(d,summary(d,'yearly'));
 assert.equal(book.salesTrend.length,10);
 assert.equal(book.salesTrend[0].label,'2026-01');
 assert.equal(book.salesTrend[9].label,'2026-10');
});
test('walk-in invoices are not incorrectly ranked as a single named best customer',()=>{
 const d=empty();
 d.sales=[row('INV-A','2026-10-02',800,{}, {party:'Walk-in customer'}),
  row('INV-B','2026-10-03',30,{}, {party:'Rahman Hardware',partyId:'c2'})];
 const book=buildAuditBook(d,summary(d));
 assert.equal(book.topCustomers.length,1);
 assert.equal(book.topCustomers[0].label,'Rahman Hardware');
});
