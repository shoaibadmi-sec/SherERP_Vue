import test from 'node:test';
import assert from 'node:assert/strict';
import {zipSync,strToU8} from 'fflate';
import {validateXlsxSafety} from '../src/import/safeXlsx.ts';
import {makeTemplateXlsx} from '../src/import/importTemplates.ts';

const workbook=(sheet:string)=>zipSync({
 '[Content_Types].xml':strToU8('<Types/>'),
 'xl/workbook.xml':strToU8('<workbook/>'),
 'xl/worksheets/sheet1.xml':strToU8(sheet)
});
test('known minimal XLSX ZIP passes structure preflight without executing cells',()=>{
 assert.doesNotThrow(()=>validateXlsxSafety(workbook('<worksheet><sheetData/></worksheet>')));
});
test('formula with a cached numeric value is rejected',()=>{
 const formula=workbook('<worksheet><sheetData><row><c><f>2+2</f><v>4</v></c></row></sheetData></worksheet>');
 assert.throws(()=>validateXlsxSafety(formula),/formula|paste values/i);
});
test('XML formula using a namespace prefix is rejected',()=>{
 const formula=workbook('<worksheet><x:f>HYPERLINK("https://bad")</x:f></worksheet>');
 assert.throws(()=>validateXlsxSafety(formula),/formula/i);
});
test('remote links, macros and decompression-bomb workbooks are rejected',()=>{
 const external=zipSync({'[Content_Types].xml':strToU8('<Types/>'),'xl/workbook.xml':strToU8('<workbook/>'),
   'xl/worksheets/sheet1.xml':strToU8('<sheet/>'),'xl/externalLinks/externalLink1.xml':strToU8('<link/>')});
 assert.throws(()=>validateXlsxSafety(external),/external link|unsafe/i);
 const bomb=workbook('<worksheet>'+('x'.repeat(2_000_000))+'</worksheet>');
 assert.throws(()=>validateXlsxSafety(bomb),/decompression|ratio/i);
});
test('HisabIQ generated Excel template passes XLSX safety check',async()=>{
 const blob=await makeTemplateXlsx('product');
 const bytes=new Uint8Array(await blob.arrayBuffer());
 assert.doesNotThrow(()=>validateXlsxSafety(bytes));
});
