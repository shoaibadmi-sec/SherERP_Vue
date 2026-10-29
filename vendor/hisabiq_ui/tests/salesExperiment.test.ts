import test from 'node:test';
import assert from 'node:assert/strict';
import { reportCatalog } from '../src/reports/catalog.ts';
import { reportScreens, reportKeyForScreen } from '../src/reports/screens.ts';
import { reportScreenFromParams, paramsForReportScreen } from '../src/reports/preferences.ts';
import { defaultReportFilters, runReport } from '../src/reports/model.ts';
import { salesExperimentReports, selectSalesExperimentReport } from '../src/reports/salesExperiment.ts';
import type { ReportData } from '../src/reports/types.ts';

const data:ReportData={
 asOf:'2026-10-27',
 sales:[{id:'inv-1',label:'INV-1',date:'2026-10-12',party:'Rahman',partyId:'c1',status:'Paid',values:{amount:1000,paid:1000,due:0,discount:0},
 children:[{id:'line-1',label:'LED',date:'2026-10-12',productId:'p1',category:'Lighting',party:'Rahman',partyId:'c1',status:'Posted',values:{amount:1000,quantity:2,cost:null,profit:null}}]}],
 saleLines:[{id:'line-1',label:'LED',date:'2026-10-12',productId:'p1',category:'Lighting',party:'Rahman',partyId:'c1',status:'Posted',values:{amount:1000,quantity:2,cost:null,profit:null}}],
 returns:[],purchases:[],purchaseLines:[],expenses:[],stock:[],lots:[],movements:[],cash:[],finance:[],warranty:[],quality:[]
};
const from={...defaultReportFilters,from:'2026-10-01',to:'2026-10-27',party:'c1',product:'p1',sort:'amount',direction:'asc' as const,compare:'previous' as const};

test('experiment is an additional screen, never a replacement for original screens and 34-report library',()=>{
 const ids=reportScreens.map(s=>s.id);
 assert.equal(ids.length,12);
 assert.equal(ids.indexOf('sales-lab'),ids.indexOf('sales')+1);
 assert(ids.includes('sales')&&ids.includes('library')&&ids.includes('profit'));
 assert.equal(reportCatalog.length,34);
 assert.deepEqual(salesExperimentReports.map(x=>x.id),['sales-register','product-sales','category-sales','customer-sales','product-profit','sales-returns','discounts']);
});

test('deep links and saved views retain screen, selected report and existing filters',()=>{
 const params=paramsForReportScreen('sales-lab','product-sales',from,['label','amount']);
 assert.equal(reportScreenFromParams(params),'sales-lab');
 assert.equal(reportKeyForScreen('sales-lab',params.get('report')),'product-sales');
 assert.equal(params.get('from'),'2026-10-01');
 assert.equal(params.get('product'),'p1');
 assert.equal(params.get('columns'),'label,amount');
 assert.equal(reportKeyForScreen('sales-lab','stock'),'sales-register','unrelated reports cannot hijack experiment');
 assert.equal(reportKeyForScreen('sales','product-sales'),'sales-register','original Magic sales tab stays unchanged');
});

test('switching detailed reports preserves period and comparison but drops invalid dimension filters and old search/sort',()=>{
 const change=selectSalesExperimentReport('customer-sales',from);
 assert.equal(change.from,from.from);assert.equal(change.to,from.to);
 assert.equal(change.compare,'previous');
 assert.equal(change.party,'c1');
 assert.equal(change.product,'');
 assert.equal(change.sort,'date');assert.equal(change.direction,'desc');
 assert.equal(from.party,'c1','source filters remain unchanged');
});

test('experiment uses the canonical historical-cost calculation without inventing gross profit',()=>{
 const report=runReport('product-profit',data,{...from,party:'Rahman'});
 assert.equal(report.rows.some(r=>r.values.profit===null),true);
 assert.equal(data.saleLines[0].values.cost,null);
});
