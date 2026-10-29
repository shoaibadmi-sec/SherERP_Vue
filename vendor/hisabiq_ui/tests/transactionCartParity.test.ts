import test from 'node:test';
import assert from 'node:assert/strict';
import {transactionLineTotal} from '../src/utils/transactionLines.ts';
import {quoteLineTotal,quoteSubtotal,validateQuoteDraft} from '../src/quotations/quotePreviewStore.ts';
import {orderTotals,preparePosHandoff,createOnlineOrder,updateOrderStage,resetOnlinePreviewForTest} from '../src/onlineSales/onlineStore.ts';
import {products} from '../src/data/products.ts';
test('2 Box 5 Pcs and 1 Gauge 12 Gira share the same amount semantics',()=>{
 assert.equal(transactionLineTotal({unit:'Box',quantity:2,secondaryQuantity:5,unitFactor:12,price:1200}),2900);
 assert.equal(transactionLineTotal({unit:'Gauge',quantity:1,secondaryQuantity:12,unitFactor:16,price:1600}),2800);
 assert.equal(transactionLineTotal({unit:'Pcs',quantity:5,price:11.5}),57.5);
});
test('quotation totals retain small units and validate leftover quantity',()=>{
 const line={id:'q',productId:'p2',name:'Bulb',unit:'Box',quantity:2,secondaryQuantity:5,unitFactor:12,price:1200};
 assert.equal(quoteLineTotal(line),2900);
 assert.equal(quoteSubtotal({lines:[line]}),2900);
 const draft={date:'2026-10-09',validUntil:'2026-10-20',customerName:'Buyer',note:'',status:'Draft' as const,
  discount:0,lines:[line]};
 assert.deepEqual(validateQuoteDraft(draft),[]);
 assert.ok(validateQuoteDraft({...draft,lines:[{...line,secondaryQuantity:12}]}).length>0);
});
test('COD and POS handoff preserve both quantities without fake payment',()=>{
 resetOnlinePreviewForTest();
 const draft={channel:'Facebook' as const,sourceReference:'FB',customerName:'Buyer',phone:'01711482093',
  address:'Dhaka',lines:[{id:'1',productId:'p2',name:'LED Bulb 12W',unit:'Box',quantity:2,secondaryQuantity:5,
   unitFactor:10,price:1200}],discount:100,deliveryCharge:80,prepaid:80,paymentMode:'Delivery charge advance' as const,note:''};
 assert.equal(orderTotals(draft).items,3000);
 assert.equal(orderTotals(draft).cod,2900);
 const created=createOnlineOrder(draft);
 updateOrderStage(created.id,'Confirmed');
 const handoff=preparePosHandoff(created.id,products);
 assert.equal(handoff.lines[0].qty,'2');
 assert.equal(handoff.lines[0].secondaryQty,'5');
 assert.equal(handoff.discount,100);
 assert.equal(handoff.advancePreview,80);
 assert.equal('payments' in handoff,false);
});
