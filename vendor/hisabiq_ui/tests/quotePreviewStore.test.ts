import test from 'node:test';
import assert from 'node:assert/strict';
import {getQuoteSnapshot,saveQuote,duplicateQuote,changeQuoteStatus,deleteDraftQuote,
 quoteSubtotal,quoteTotal,quoteDisplayStatus,validateQuoteDraft,subscribeQuotes
} from '../src/quotations/quotePreviewStore.ts';
const make=(name:string)=>({
 date:'2026-10-09',validUntil:'2026-10-19',customerName:name,
 note:'',status:'Draft' as const,discount:25,
 lines:[{id:'l1',productId:'p2',name:'LED Bulb',unit:'Box',quantity:2,price:1550}]
});
test('quantities, discount and unit price are never interpreted as stock movement',()=>{
 const quote=make('Buyer');
 assert.equal(quoteSubtotal(quote),3100);assert.equal(quoteTotal(quote),3075);
 assert.equal(validateQuoteDraft(quote).length,0);
});
test('reject invalid dates, negative unit price, zero qty and oversize discount',()=>{
 assert.ok(validateQuoteDraft({...make('Buyer'),validUntil:'2026-02-30'}).length);
 assert.ok(validateQuoteDraft({...make('Buyer'),lines:[{...make('Buyer').lines[0],quantity:0}]}).length);
 assert.ok(validateQuoteDraft({...make('Buyer'),lines:[{...make('Buyer').lines[0],price:-1}]}).length);
 assert.ok(validateQuoteDraft({...make('Buyer'),discount:4000}).length);
});
test('create edit duplicate and status changes are atomic observable preview changes',(t)=>{
 t.mock.timers.enable({apis:['Date'],now:new Date('2026-10-10T06:00:00Z')});
 const before=getQuoteSnapshot();let calls=0;
 const off=subscribeQuotes(()=>calls++);
 const added=saveQuote(make('Quotation QA'));
 assert.equal(added.status,'Draft');assert.equal(getQuoteSnapshot().revision,before.revision+1);
 const sent=changeQuoteStatus(added.id,'Sent');
 assert.equal(sent.status,'Sent');
 assert.equal(quoteDisplayStatus(sent,'2026-10-20'),'Expired');
 const updated=saveQuote({...make('Quotation QA Updated'),discount:30},added.id);
 assert.equal(updated.status,'Draft');assert.equal(updated.number,added.number);
 const copied=duplicateQuote(added.id);
 assert.notEqual(copied.id,added.id);assert.equal(copied.discount,30);
 assert.equal(changeQuoteStatus(added.id,'Sent').status,'Sent');
 assert.equal(changeQuoteStatus(added.id,'Accepted').status,'Accepted');
 assert.throws(()=>deleteDraftQuote(added.id),/Only draft/);
 deleteDraftQuote(copied.id);
 assert.equal(getQuoteSnapshot().quotes.some(q=>q.id===copied.id),false);
 assert.equal(calls,7);
 off();
});

test('expired sent quotes cannot be accepted until revised',(t)=>{
 t.mock.timers.enable({apis:['Date'],now:new Date('2026-10-20T06:00:00Z')});
 const created=saveQuote({...make('Expired buyer'),date:'2026-09-01',validUntil:'2026-09-05'});
 changeQuoteStatus(created.id,'Sent');
 assert.equal(quoteDisplayStatus(getQuoteSnapshot().quotes.find(q=>q.id===created.id)!), 'Expired');
 assert.throws(()=>changeQuoteStatus(created.id,'Accepted'),/Expired/);
});
