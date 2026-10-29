import test from 'node:test';
import assert from 'node:assert/strict';
import {saveQuote,changeQuoteStatus,getQuoteSnapshot} from '../src/quotations/quotePreviewStore.ts';
import {draftFromAcceptedQuote,createOnlineOrder,existingOrderForQuote,
 getOnlineSnapshot,resetOnlinePreviewForTest,updateOrderStage,preparePosHandoff,reviseOnlineDraft,
 orderTotals} from '../src/onlineSales/onlineStore.ts';
import {products} from '../src/data/products.ts';

function accepted(){
 const q=saveQuote({date:'2026-10-09',validUntil:'2026-10-29',status:'Draft',
 customerName:'Tailor goods buyer',customerPhone:'01711482093',note:'Quote terms',discount:50,
 lines:[{id:'quote-1',productId:'p2',name:'LED Bulb 12W',unit:'Box',quantity:2,price:1550}]});
 changeQuoteStatus(q.id,'Sent');
 return changeQuoteStatus(q.id,'Accepted');
}
test('accepted quote locks quoted prices, units and discount in linked online order',()=>{
 resetOnlinePreviewForTest();
 const quote=accepted();
 const draft=draftFromAcceptedQuote(quote);
 assert.equal(draft.sourceQuoteId,quote.id);
 assert.equal(draft.lines[0]?.unit,'Box');assert.equal(draft.lines[0]?.price,1550);
 assert.equal(draft.discount,50);assert.equal(draft.deliveryCharge,0);
 assert.throws(()=>createOnlineOrder(draft),/address/i);
 const valid={...draft,address:'Nawabpur, Dhaka'};
 assert.throws(()=>createOnlineOrder({...valid,discount:60}),/prices, units and discount/i);
 assert.throws(()=>createOnlineOrder({...valid,lines:[{...valid.lines[0],quantity:3}]}),/prices, units and discount/i);
 const order=createOnlineOrder(valid);
 assert.equal(orderTotals(order).grand,3050);
 assert.equal(order.sourceQuoteId,quote.id);
 assert.equal(existingOrderForQuote(quote.id)?.id,order.id);
 const revision=getOnlineSnapshot().revision;
 assert.equal(createOnlineOrder(valid).id,order.id);
 assert.equal(getOnlineSnapshot().revision,revision);
 assert.equal(getOnlineSnapshot().orders.filter(o=>o.sourceQuoteId===quote.id).length,1);
 assert.throws(()=>reviseOnlineDraft(order.id,{...valid,discount:70}),/locked/);
});
test('unaccepted quotations cannot be converted; POS requires confirmed order and original products',()=>{
 resetOnlinePreviewForTest();
 const fresh=saveQuote({date:'2026-10-09',validUntil:'2026-10-20',status:'Draft',
 customerName:'Not accepted',customerPhone:'01711482093',note:'',discount:0,
 lines:[{id:'x',productId:'p1',name:'Pipe',unit:'Pcs',quantity:1,price:420}]});
 assert.throws(()=>draftFromAcceptedQuote(fresh),/accepted/i);
 const quote=accepted();
 const order=createOnlineOrder({...draftFromAcceptedQuote(quote),address:'Dhaka',deliveryCharge:100,prepaid:100,
 paymentMode:'Delivery charge advance'});
 assert.throws(()=>preparePosHandoff(order.id,products),/Confirm/i);
 updateOrderStage(order.id,'Confirmed');
 const handoff=preparePosHandoff(order.id,products);
 assert.equal(handoff.lines[0]?.unit,'Box');
 assert.equal(handoff.lines[0]?.price,'1550');
 assert.equal(handoff.discount,50);
 assert.equal(handoff.deliveryCharge,100);
 assert.equal(handoff.advancePreview,100);
 assert.equal('payments' in handoff,false);
 assert.equal(getOnlineSnapshot().orders.find(o=>o.id===order.id)?.stage,'Confirmed');
 assert.throws(()=>preparePosHandoff(order.id,[]),/unavailable/i);
 updateOrderStage(order.id,'Packed');
 updateOrderStage(order.id,'Cancelled');
 assert.throws(()=>preparePosHandoff(order.id,products),/Confirm/i);
});
