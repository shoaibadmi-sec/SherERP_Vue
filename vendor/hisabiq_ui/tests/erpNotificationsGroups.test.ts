import test from 'node:test';
import assert from 'node:assert/strict';
import {notificationEvents,groups,resetNotificationRulesForTest,updateNotificationRule,
 renderNotificationPreview,notificationEligibility,getNotificationSnapshot
} from '../src/notifications/erpNotificationRules.ts';
test('ERP-wide registry covers customer, service tailoring, supplier, borrower, lender, owner, warranty and courier',()=>{
 const expected=['due_reminder','service_ready','service_order_received','supplier_payment',
 'supplier_due','borrower_due','borrower_repayment','lender_funds_received','lender_repayment',
 'owner_withdrawal','warranty_ready','stock_low','courier_handover','sale_completed'];
 for(const id of expected)assert.ok(notificationEvents.some(e=>e.id===id),id+' missing');
 assert.equal(groups.length,6);
 resetNotificationRulesForTest();
 assert.ok(notificationEvents.every(e=>getNotificationSnapshot().rules[e.id].enabled===false));
});
test('tailor Panjabi ready message interpolates item with Bangla translation',()=>{
 resetNotificationRulesForTest();
 assert.match(renderNotificationPreview('service_ready',{business:'Tailor',item:'Panjabi',number:'SRV-101'}),/Panjabi is ready for delivery/);
 updateNotificationRule('service_ready',{language:'Bangla',enabled:true,triggerMode:'On event',recipient:'Service customer'});
 assert.match(renderNotificationPreview('service_ready',{business:'দর্জি',item:'পাঞ্জাবি',number:'SRV-101'}),/পাঞ্জাবি তৈরি হয়েছে/);
 const blocked=notificationEligibility('service_ready',{phone:'01711482093',consent:true,gatewayConnected:false});
 assert.equal(blocked.eligible,false);assert.equal(blocked.simulationOnly,true);
});
test('reminder timing, recipient and quiet hours configurable and validated',()=>{
 resetNotificationRulesForTest();
 updateNotificationRule('borrower_due',{enabled:true,reminderDays:7,recipient:'Borrower',triggerMode:'On event'});
 const r=getNotificationSnapshot().rules.borrower_due;
 assert.equal(r.reminderDays,7);assert.equal(r.triggerMode,'On event');assert.equal(r.recipient,'Borrower');
 assert.ok(notificationEligibility('borrower_due',{phone:'01711482093',consent:true,gatewayConnected:true,withinQuietHours:true}).reasons.includes('Quiet hours active'));
 assert.throws(()=>updateNotificationRule('borrower_due',{reminderDays:500}),/0 and 365/);
 assert.throws(()=>updateNotificationRule('borrower_due',{requireConsent:false}),/consent/i);
 assert.throws(()=>updateNotificationRule('borrower_due',{template:'{unsupported_field}'}),/placeholders/);
});
