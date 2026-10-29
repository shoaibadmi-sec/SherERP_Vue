import test from 'node:test';
import assert from 'node:assert/strict';
import {parseImportCsv,parseImportFile} from '../src/import/fileReader.ts';
import {validateXlsxSafety} from '../src/import/safeXlsx.ts';

test('CSV retains Bangla and leading zeros in SKU and phone',()=>{
 const input='\uFEFFname,phone,sku\r\n"Blue, Shop",01712345678,00019\r\n\r\nবাতি,01900223344,00110\r\n';
 const table=parseImportCsv(input,'items.csv');
 assert.deepEqual(table.headers,['name','phone','sku']);
 assert.equal(table.rows.length,2);
 assert.equal(table.rows[0].cells[0],'Blue, Shop');
 assert.equal(table.rows[0].cells[1],'01712345678');
 assert.equal(table.rows[0].cells[2],'00019');
 assert.equal(table.rows[1].sourceRow,4);
 assert.equal(table.rows[1].cells[0],'বাতি');
});
test('quoted CSV embedded newlines preserve original physical row numbers',()=>{
 const table=parseImportCsv('name,notes\n"Blue\nStore","Line 1, line 2"\nNext,plain\n','line.csv');
 assert.equal(table.rows[0].sourceRow,2);
 assert.equal(table.rows[1].sourceRow,4);
 assert.equal(table.rows[0].cells[0],'Blue\nStore');
});
test('malformed CSV and row overflows fail instead of truncating data',()=>{
 assert.throws(()=>parseImportCsv('name,phone\n"unfinished,01711','bad.csv'),/unterminated/i);
 assert.throws(()=>parseImportCsv('x\n'+Array.from({length:5001},(_,i)=>String(i)).join('\n'),'bad.csv'),/5,000/i);
});
test('CSV file reader rejects old Excel, macros and non-CSV extensions',async()=>{
 for(const name of ['legacy.xls','macro.xlsm','data.txt']){
  const file=new File(['x'],name,{type:'application/octet-stream'});
  await assert.rejects(parseImportFile(file),/\.xlsx|\.csv|not supported/i);
 }
});
test('XLSX preflight rejects malformed ZIP before any cell is read',()=>{
 assert.throws(()=>validateXlsxSafety(new Uint8Array([0,1,2,3])),/zip|workbook|xlsx/i);
});
