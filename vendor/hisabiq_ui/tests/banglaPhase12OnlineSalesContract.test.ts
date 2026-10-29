import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {onlineLabel,onlineOptions} from '../src/i18n/onlineSalesCopy.ts';
import {getOnlineSnapshot,orderTotals,courierClearing} from '../src/onlineSales/onlineStore.ts';

test('all order and lead labels preserve source option values',()=>{
 const statuses=['Draft','Confirmed','Packed','Handed over','In transit','Delivered','Failed delivery','Returning','Returned','Cancelled'];
 const options=onlineOptions('Bangla',statuses);
 assert.deepEqual(options.map(o=>o.value),statuses);
 assert.deepEqual(options.map(o=>o.label),['খসড়া','নিশ্চিত','প্যাক করা','কুরিয়ারকে দেওয়া','পথে আছে','পৌঁছে গেছে','পৌঁছায়নি','ফেরত আসছে','ফেরত এসেছে','বাতিল']);
 const modes=['COD','Delivery charge advance','Partial advance','Fully paid'];
 assert.deepEqual(onlineOptions('Bangla',modes).map(o=>o.value),modes);
 assert.deepEqual(onlineOptions('Bangla',['New','Contacted','Interested','Won','Lost']).map(o=>o.value),['New','Contacted','Interested','Won','Lost']);
 assert.equal(onlineLabel('English','Delivered'),'Delivered');
 assert.equal(onlineLabel('English + Bangla','Delivered'),'Delivered');
 assert.equal(onlineLabel('Bangla','Delivered'),'পৌঁছে গেছে');
 assert.equal(onlineLabel('Bangla','ON-000101'),'ON-000101');
 assert.equal(onlineLabel('Bangla','01711482093'),'01711482093');
});
test('the existing money, courier clearing, CRM and order snapshot do not mutate while translating',()=>{
 const before=JSON.stringify(getOnlineSnapshot());
 const order=getOnlineSnapshot().orders.find(x=>x.number==='ON-000102');
 assert.ok(order);
 const prior=orderTotals(order),clearing=courierClearing(order);
 assert.equal(order.stage,'Delivered');
 assert.equal(order.paymentMode,'COD');
 assert.equal(onlineLabel('Bangla',order.stage),'পৌঁছে গেছে');
 assert.equal(onlineLabel('Bangla',order.paymentMode),'সিওডি (পণ্য পেয়ে টাকা)');
 assert.equal(orderTotals(order).cod,prior.cod);
 assert.equal(courierClearing(order).pending,clearing.pending);
 assert.equal(JSON.stringify(getOnlineSnapshot()),before);
});
test('Phase 12 preserves shared POS cart, quotes and manual COD posting APIs',()=>{
 const page=readFileSync('src/pages/OnlineSales.tsx','utf8');
 assert.match(page,/TransactionCartEditor mode="online"/);
 assert.match(page,/draftFromAcceptedQuote\(quote\)/);
 assert.match(page,/existingOrderForQuote\(quoteId\)/);
 assert.match(page,/preparePosHandoff\(order\.id,previewPosProducts\(\)\)/);
 assert.match(page,/import \{availableProducts as previewPosProducts\} from '\.\.\/data\/erpDemoStore'/);
 assert.match(page,/updateOrderStage\(order\.id,s,note\)/);
 assert.match(page,/setOrderCourier\(order\.id,courier,tracking\)/);
 assert.match(page,/recordCourierCod\(order\.id,Number\(collected\),Number\(fee\)\)/);
 assert.match(page,/recordCourierPayout\(order\.id,Number\(payout\),reference\)/);
 assert.match(page,/onlineOptions\(language,\['All statuses',\.\.\.stages\]\)/);
 assert.match(page,/onlineOptions\(language,paymentModes\)/);
 assert.match(page,/upsertSalesLead\(\{\.\.\.lead,stage\},lead\.id\)/);
 assert.match(page,/FulfillmentDocumentPreview order=\{order\} kind=\{documentKind\}/);
});
