import test from 'node:test';
import assert from 'node:assert/strict';
import {fieldsFor} from '../src/import/fieldSchemas.ts';
import {suggestColumnMapping,mapImportRows,validateMappedRow} from '../src/import/columnMapping.ts';
import type {ImportTable} from '../src/import/importTypes.ts';

test('product headers recognize Bangla name and English SKU / selling price',()=>{
 const suggestion=suggestColumnMapping('product',['পণ্যের নাম','SKU','Selling Price']);
 assert.equal(suggestion.mapping.name,0);
 assert.equal(suggestion.mapping.sku,1);
 assert.equal(suggestion.mapping.sellingPrice,2);
 assert.deepEqual(suggestion.ambiguities,[]);
 assert.ok(fieldsFor('product').some(f=>f.key==='openingStock'));
});
test('customer and supplier schemas have independently dated opening balances',()=>{
 for(const target of ['customer','supplier'] as const){
  const fields=fieldsFor(target);
  assert.ok(fields.some(f=>f.key==='openingAmount'));
  assert.ok(fields.some(f=>f.key==='openingDirection'));
  assert.ok(fields.some(f=>f.key==='openingDate'));
  assert.ok(fields.some(f=>f.key==='phone'));
 }
});
test('duplicate alias headings are ambiguous and not silently picked',()=>{
 const result=suggestColumnMapping('customer',['Name','Customer Name','Mobile']);
 assert.equal(result.mapping.name,null);
 assert.equal(result.mapping.phone,2);
 assert.ok(result.ambiguities.some(x=>x.includes('name')));
});
test('column mapper rejects one source column mapped to multiple target fields',()=>{
 const table:ImportTable={fileName:'legacy.csv',sheet:'CSV',sheetNames:['CSV'],headers:['Name'],rows:[{sourceRow:7,cells:['Blue Shop']}]};
 assert.throws(()=>mapImportRows(table,{name:0,nameBn:0}),/mapped more than once|same source/i);
});
test('original row numbers and raw source values survive mapped staging',()=>{
 const table:ImportTable={fileName:'products.csv',sheet:'CSV',sheetNames:['CSV'],headers:['পণ্যের নাম','SKU','Selling Price'],rows:[
  {sourceRow:9,cells:['LED Bulb','00120','165']},
  {sourceRow:19,cells:['পাইপ','0009','1200']}
 ]};
 const mapping=suggestColumnMapping('product',table.headers).mapping;
 const rows=mapImportRows(table,mapping);
 assert.deepEqual(rows.map(r=>r.sourceRow),[9,19]);
 assert.equal(rows[0].mapped.sku,'00120');
 assert.equal(rows[1].original.SKU,'0009');
 assert.equal(rows[1].sourceSheet,'CSV');
 assert.deepEqual(rows.map(r=>r.decision),['create','create']);
});
test('unmapped required headings fail instead of inventing a product name',()=>{
 const table:ImportTable={fileName:'bad.csv',sheet:'CSV',sheetNames:['CSV'],headers:['SKU'],rows:[{sourceRow:2,cells:['001']}]};
 const mapping=suggestColumnMapping('product',table.headers).mapping;
 assert.throws(()=>mapImportRows(table,mapping),/required|name/i);
});

test('blank required values become review errors and can be corrected without changing originals',()=>{
 const table:ImportTable={fileName:'test.csv',sheet:'CSV',sheetNames:['CSV'],
  headers:['Product Name','Selling Price'],rows:[{sourceRow:4,cells:['',165]}]};
 const rows=mapImportRows(table,suggestColumnMapping('product',table.headers).mapping);
 assert.equal(rows[0].issues[0]?.field,'name');
 assert.equal(rows[0].issues[0]?.severity,'error');
 const fixed=validateMappedRow({...rows[0],mapped:{...rows[0].mapped,name:'LED Bulb 12W'}},'product');
 assert.equal(fixed.issues.length,0);
 assert.equal(fixed.original['Product Name'],'');
 assert.equal(fixed.sourceRow,4);
});
