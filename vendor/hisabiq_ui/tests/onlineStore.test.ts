import test from 'node:test';
import assert from 'node:assert/strict';
import {createOnlineOrder,orderTotals,resetOnlinePreviewForTest,updateOrderStage,setOrderCourier,
 recordCourierCod,recordCourierPayout,courierClearing,getOnlineSnapshot,validateOnlineOrder,upsertSalesLead
} from '../src/onlineSales/onlineStore.ts';
const make=(prepaid:number,mode:'COD'|'Delivery charge advance'|'Partial advance'|'Fully paid')=>({
 channel:'Facebook' as const,sourceReference:'FB DM',customerName:'Example Buyer',phone:'01711482093',
 address:'Dhanmondi Dhaka',lines:[{id:'x',productId:'p2',name:'LED Bulb',quantity:2,unit:'Box',price:500}],
 discount:0,deliveryCharge:100,prepaid,paymentMode:mode,note:''
});
test('COD, delivery-charge paid, partial advance, fully prepaid are calculated separately',()=>{
 for(const [paid,mode,cod] of [[0,'COD',1100],[100,'Delivery charge advance',1000],
  [300,'Partial advance',800],[1100,'Fully paid',0]] as const){
  const draft=make(paid,mode);assert.equal(orderTotals(draft).cod,cod);
  assert.deepEqual(validateOnlineOrder(draft),[]);
 }
});
test('fractional small-unit quantities round per line to paisa',()=>{
 const draft={...make(0,'COD'),lines:[{id:'f',productId:'p5',name:'Fabric',quantity:0.333,unit:'Gira',price:1.23}]};
 assert.equal(orderTotals(draft).items,0.41);
 assert.equal(orderTotals(draft).cod,100.41);
});
test('reject underflow, overpayment, invalid phone and wrong payment mode without mutation',()=>{
 resetOnlinePreviewForTest();const before=getOnlineSnapshot();
 assert.ok(validateOnlineOrder(make(1200,'Partial advance')).length>0);
 assert.ok(validateOnlineOrder({...make(0,'COD'),phone:'1234'}).length>0);
 assert.ok(validateOnlineOrder(make(100,'COD')).length>0);
 assert.throws(()=>createOnlineOrder(make(1200,'Partial advance')));
 assert.equal(getOnlineSnapshot(),before);
});
test('no cash or stock movement on order create, handover, tracking, delivery or payout preview',()=>{
 resetOnlinePreviewForTest();const before=getOnlineSnapshot();
 const created=createOnlineOrder(make(100,'Delivery charge advance'));
 assert.equal(created.stage,'Draft');assert.equal(orderTotals(created).cod,1000);
 assert.throws(()=>updateOrderStage(created.id,'Handed over'),/transition/i);
 updateOrderStage(created.id,'Confirmed');updateOrderStage(created.id,'Packed');
 assert.throws(()=>updateOrderStage(created.id,'Handed over'),/tracking/i);
 setOrderCourier(created.id,'Steadfast','TEST-TRACK-123');
 updateOrderStage(created.id,'Handed over');updateOrderStage(created.id,'In transit');
 assert.throws(()=>recordCourierCod(created.id,1000,70),/after delivery/i);
 updateOrderStage(created.id,'Delivered');
 assert.equal(getOnlineSnapshot().orders.find(o=>o.id===created.id)?.courierReportedCod,0);
 assert.throws(()=>recordCourierPayout(created.id,500,'PAYOUT1'),/COD report/i);
 recordCourierCod(created.id,1000,70);
 assert.equal(courierClearing(getOnlineSnapshot().orders.find(o=>o.id===created.id)!).pending,930);
 recordCourierPayout(created.id,400,'PAYOUT1');
 const after=getOnlineSnapshot().orders.find(o=>o.id===created.id)!;
 assert.equal(after.courierRemitted,400);assert.equal(courierClearing(after).pending,530);
 assert.throws(()=>recordCourierPayout(created.id,540,'OVER'),/exceeds/i);
 assert.equal(getOnlineSnapshot().orders.length,before.orders.length+1);
 assert.ok(after.timeline.some(t=>t.note.includes('no bank posting')));
});
test('customer CRM can record follow-up without auto-creating order or Party',()=>{
 resetOnlinePreviewForTest();const before=getOnlineSnapshot();
 const lead=upsertSalesLead({name:'Online prospect',phone:'01988776655',channel:'YouTube',stage:'New',
 nextFollowUp:'2026-10-11',note:'Need quotation'});
 assert.equal(lead.channel,'YouTube');
 assert.equal(getOnlineSnapshot().orders.length,before.orders.length);
 assert.equal(getOnlineSnapshot().leads.length,1);
 assert.throws(()=>upsertSalesLead({name:'Bad lead',phone:'123',channel:'Facebook',stage:'New',
 nextFollowUp:'2026-10-12',note:''}),/valid Bangladesh/);
});
