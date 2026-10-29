import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fulfillmentLabel} from '../src/i18n/fulfillmentCopy.ts';
import {getOnlineSnapshot,orderTotals,lineTotal} from '../src/onlineSales/onlineStore.ts';

test('three fulfillment document identities and stored values remain stable in every language',()=>{
 const documentTitles=['Order confirmation','Packing list','Delivery challan'];
 const component=readFileSync('src/components/online/FulfillmentDocumentPreview.tsx','utf8');
 assert.match(component,/export const documentTitles:FulfillmentDocument\[\]=\['Order confirmation','Packing list','Delivery challan'\]/);
 for(const english of documentTitles){
  assert.equal(fulfillmentLabel('English',english),english);
  assert.equal(fulfillmentLabel('English + Bangla',english),english);
 }
 assert.equal(fulfillmentLabel('Bangla','Order confirmation'),'অর্ডার নিশ্চিতকরণ');
 assert.equal(fulfillmentLabel('Bangla','Packing list'),'প্যাকিং তালিকা');
 assert.equal(fulfillmentLabel('Bangla','Delivery challan'),'ডেলিভারি চালান');
 assert.equal(fulfillmentLabel('Bangla','Delivered'),'পৌঁছে গেছে');
 assert.equal(fulfillmentLabel('Bangla','In transit'),'পথে আছে');
 assert.equal(fulfillmentLabel('Bangla','ON-000101'),'ON-000101');
 assert.equal(fulfillmentLabel('Bangla','Rahman Hardware'),'Rahman Hardware');
});
test('all three customer-facing disclaimers explain these are preview documents, not posting',()=>{
 assert.match(fulfillmentLabel('Bangla','Order confirmation only; a Sales invoice is generated separately by POS.'),/বিক্রির বিল/);
 assert.match(fulfillmentLabel('Bangla','Delivery challan only — not a sales invoice or courier waybill.'),/ওয়েবিল/);
 assert.match(fulfillmentLabel('Bangla','Packing checklist only — no financial figures, payment or stock posting.'),/এন্ট্রি হবে না/);
 assert.match(fulfillmentLabel('Bangla','UI preview only — no stock, payment or courier posting.'),/শুধু নমুনা/);
});
test('printing and translating do not mutate order/line quantities, price, amounts or courier clearing',()=>{
 const before=JSON.stringify(getOnlineSnapshot());
 const order=getOnlineSnapshot().orders.find(o=>o.number==='ON-000101');
 assert.ok(order);
 const totals=orderTotals(order);
 const rowAmount=lineTotal(order.lines[0]);
 assert.ok(rowAmount>0);
 assert.equal(fulfillmentLabel('Bangla',order.stage),'পথে আছে');
 assert.equal(fulfillmentLabel('Bangla',order.channel),order.channel);
 assert.equal(fulfillmentLabel('Bangla',order.courier??''),order.courier);
 assert.deepEqual(orderTotals(order),totals);
 assert.equal(lineTotal(order.lines[0]),rowAmount);
 assert.equal(JSON.stringify(getOnlineSnapshot()),before);
});
test('the existing print scope, A4 CSS and fulfillment type conditions remain unchanged',()=>{
 const src=readFileSync('src/components/online/FulfillmentDocumentPreview.tsx','utf8');
 assert.match(src,/useUiCopy\(\)/);
 assert.match(src,/fulfillmentLabel\(language,english\)/);
 assert.match(src,/orderTotals\(order\)/);
 assert.match(src,/lineTotal\(l\)/);
 assert.match(src,/order\.lines\.map/);
 assert.match(src,/showAmounts=kind==='Order confirmation'/);
 assert.match(src,/kind==='Packing list'/);
 assert.match(src,/kind==='Delivery challan'/);
 assert.match(src,/window\.print\(\)/);
 assert.match(src,/#fulfillment-print-document/);
 assert.match(src,/@page \{size:A4;margin:0;\}/);
 assert.doesNotMatch(src,/updateOrderStage\(|recordCourierCod\(|recordCourierPayout\(|stockMovement/);
});
