import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=(path:string)=>readFileSync(path,'utf8');

test('print path uses an explicit language instead of a React context that is absent in static markup',()=>{
 const source=read('src/components/brand/printReceipt.tsx');
 assert.match(source,/printDocumentLanguage\(design\?\.language\?\?props\.language/);
 assert.match(source,/ReceiptPreview \{\.\.\.props\}/);
 const receipt=read('src/components/brand/ReceiptPreview.tsx');
 assert.match(receipt,/language\?: UiLanguage/);
 assert.match(receipt,/documentLabel\(language,english\)/);
});
test('CSV export retains its original English columns and data contracts',()=>{
 const report=read('src/utils/reportOutput.ts');
 assert.match(report,/export function reportCsv\(headers:string\[\],rows/);
 assert.match(report,/reportCsv\(headers,rows\)/);
 const sales=read('src/pages/Sales.tsx');
 assert.match(sales,/downloadReport\('hisabiq-sales\.csv', \['Invoice','Date','Customer'/);
 const daybook=read('src/pages/Daybook.tsx');
 assert.match(daybook,/downloadReport\('hisabiq-daybook\.csv',reportHeaders/);
});
test('printed source records retain preview warning and properly escaped values',()=>{
 const report=read('src/utils/reportOutput.ts');
 assert.match(report,/documentLabel\(language,'HisabIQ UI preview/);
 assert.match(report,/const escape=/);
 assert.match(report,/lang="/);
 const sales=read('src/utils/salesDocuments.ts');
 assert.match(sales,/export function invoiceReceipt\(invoice: SalesInvoice, language\?: UiLanguage\)/);
 assert.match(sales,/export function returnDocument\(item: SalesReturn, language:UiLanguage/);
});
