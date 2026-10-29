import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {salesLabel,salesOptions} from '../src/i18n/salesCopy.ts';

test('Phase 17 Sales uses existing English, English + Bangla and Bangla display modes',()=>{
 for(const english of ['Customer','Items','Columns','View invoice','Complete return','Refund credit','Edit sale']){
  assert.equal(salesLabel('English',english),english);
  assert.equal(salesLabel('English + Bangla',english),english);
  assert.notEqual(salesLabel('Bangla',english),english);
 }
 assert.equal(salesLabel('Bangla','Customer'),'ক্রেতা');
 assert.equal(salesLabel('Bangla','Return qty'),'ফেরতের পরিমাণ');
 assert.equal(salesLabel('Bangla','Apply to invoice'),'বিলের বাকি মেটান');
 for(const id of ['INV-000101','SR-000002','01711482093','Rahman Hardware','SKU-08','1 Gauge 12 Gira','৳2,456']){
  assert.equal(salesLabel('Bangla',id),id);
 }
});

test('return reasons, settlements and filters preserve stored English domain IDs in Bangla',()=>{
 const reasons=['Customer return','Damaged','Wrong item','Warranty claim'];
 const settlements=['Adjust due','Customer credit','Cash refund'];
 const methods=['Cash','bKash','Nagad','Card','Bank'];
 for(const opts of [reasons,settlements,methods]){
  assert.deepEqual(salesOptions('Bangla',opts).map(x=>x.value),opts);
  assert.deepEqual(salesOptions('English',opts).map(x=>x.label),opts);
 }
 assert.deepEqual(salesOptions('Bangla',settlements).map(x=>x.label),['বাকি থেকে কমান','ক্রেতার জমা','টাকা ফেরত']);
});

test('Sales localized presentation does not alter sales, payments, returns, cart or CSV source contract',()=>{
 const src=readFileSync('src/pages/Sales.tsx','utf8');
 const values=[
  "const salesColumnStorageKey = 'hisabiq-sales-visible-columns'",
  "onToggle(column.id)",
  'useModuleColumns("sales",salesColumnStorageKey',
  "const [status, setStatus] = useState('All status')",
  "const [method, setMethod] = useState('All payments')",
  "const [returnSettlement, setReturnSettlement] = useState<SalesReturn['settlement']>('Adjust due')",
  "const [returnReason, setReturnReason] = useState<Record<string, string>>({})",
  "value={returnReason[line.id] ?? 'Customer return'}",
  "returnSettlement === 'Adjust due'",
  "returnSettlement === 'Cash refund'",
  "const filtered = useMemo(",
  "invoiceProfit(invoice)",
  "returnAmount = selectedReturnLines.reduce(",
  "onSave({",
  "downloadReport('hisabiq-sales.csv', ['Invoice','Date','Customer','Phone','Items','Total','Paid','Due','Payment','Status']",
  "navigate(`/app/pos?mode=edit&invoice=${invoice.invoice}`)",
  "navigate(`/app/pos?mode=duplicate&invoice=${invoice.invoice}`)"
 ];
 for(const v of values) assert.ok(src.includes(v),'source contract: '+v);
 assert.ok(src.includes("options={salesOptions(language,['Customer return', 'Damaged', 'Wrong item', 'Warranty claim'])}"));
 assert.ok(src.includes("options={salesOptions(language,['Adjust due', 'Customer credit', 'Cash refund'])}"));
 assert.ok(src.includes("aria-label={sl(\"Search sales\")}"));
 assert.doesNotMatch(src,/setReturnSettlement\(sl\(/);
 assert.doesNotMatch(src,/setReturnReason\(sl\(/);
 assert.doesNotMatch(src,/setMethod\(sl\(/);
 assert.doesNotMatch(src,/downloadReport\(sl\(/);
});
