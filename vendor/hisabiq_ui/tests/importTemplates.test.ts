import test from 'node:test';
import assert from 'node:assert/strict';
import {makeTemplateCsv,makeTemplateXlsx,makeImportErrorCsv} from '../src/import/importTemplates.ts';
import type {StagedImportRow} from '../src/import/importTypes.ts';

test('product template includes unit factor, price entry unit and opening lot data',()=>{
 const csv=makeTemplateCsv('product');
 assert.ok(csv.startsWith('\uFEFF'));
 const [headers,row]=csv.trim().replace(/^\uFEFF/,'').split(/\r?\n/);
 const keys=headers.split(',');
 const values=row.split(',');
 assert.equal(values[keys.indexOf('largeUnit')],'Box');
 assert.equal(values[keys.indexOf('conversionFactor')],'10');
 assert.equal(values[keys.indexOf('purchasePrice')],'1200');
 assert.equal(values[keys.indexOf('purchasePriceUnit')],'Box');
 assert.equal(values[keys.indexOf('openingStock')],'2');
});
test('Customer/Supplier templates keep full phone and opposite opening directions',()=>{
 for(const [target,side] of [['customer','Dr'],['supplier','Cr']] as const){
  const csv=makeTemplateCsv(target);
  assert.ok(csv.includes('01712345678'));
  const [head,row]=csv.trim().replace(/^\uFEFF/,'').split(/\r?\n/);
  assert.equal(row.split(',')[head.split(',').indexOf('openingDirection')],side);
 }
});
test('CSV error report neutralizes spreadsheet formula fields',()=>{
 const row:StagedImportRow={
  sourceSheet:'CSV',sourceRow:4,original:{name:'=HYPERLINK("http://bad")',sku:'0007'},
  mapped:{name:'=HYPERLINK("http://bad")'},decision:'reject',
  issues:[{sourceRow:4,field:'name',severity:'error',message:'Unsafe formula-like text'}]
 };
 const csv=makeImportErrorCsv([row]);
 assert.ok(csv.includes('Row'));
 assert.ok(csv.includes('4'));
 assert.ok(csv.includes("'=HYPERLINK"));
 assert.ok(csv.includes('0007'));
});
test('XLSX template returns a real ZIP workbook Blob',async()=>{
 const file=await makeTemplateXlsx('customer');
 assert.ok(file instanceof Blob);
 const magic=new Uint8Array(await file.arrayBuffer()).slice(0,4);
 assert.deepEqual([...magic.slice(0,2)],[0x50,0x4b]);
 assert.ok(file.size>300);
});
