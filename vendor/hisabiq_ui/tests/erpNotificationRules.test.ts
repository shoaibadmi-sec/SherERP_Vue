import test from 'node:test';
import assert from 'node:assert/strict';
import {getNotificationSnapshot,resetNotificationRulesForTest,updateNotificationRule,
 renderNotificationPreview,notificationEligibility,notificationEvents
} from '../src/notifications/erpNotificationRules.ts';
test('all ERP-wide transaction SMS events default to OFF and consent on',()=>{
 resetNotificationRulesForTest();
 const state=getNotificationSnapshot();
 for(const {id} of notificationEvents){
  assert.equal(state.rules[id].enabled,false);
  assert.equal(state.rules[id].requireConsent,true);
 }
});
test('rules do not pretend to send SMS when no gateway is connected',()=>{
 resetNotificationRulesForTest();
 updateNotificationRule('sale_completed',{enabled:true,template:'Sale {number}, due BDT {due}'});
 assert.equal(renderNotificationPreview('sale_completed',{number:'INV-1',due:'100'}),
  'Sale INV-1, due BDT 100');
 const elig=notificationEligibility('sale_completed',{phone:'01711482093',consent:true,gatewayConnected:false});
 assert.equal(elig.eligible,false);assert.equal(elig.simulationOnly,true);
 assert.ok(elig.reasons.some(r=>r.includes('not connected')));
 const enabled=notificationEligibility('sale_completed',{phone:'01711482093',consent:true,gatewayConnected:true});
 assert.equal(enabled.eligible,true);
 assert.equal(enabled.simulationOnly,true);
});
test('disabled due reminder, missing consent and invalid phone are blocked',()=>{
 resetNotificationRulesForTest();
 const result=notificationEligibility('due_reminder',{phone:'123',consent:false,gatewayConnected:false});
 assert.equal(result.eligible,false);assert.ok(result.reasons.length>=3);
 assert.throws(()=>updateNotificationRule('courier_handover',{requireConsent:false}),/consent/i);
 assert.throws(()=>updateNotificationRule('courier_handover',{template:'{secret}'}),/placeholders/i);
});

test('Bangla notification switch uses Bangla default without discarding a custom template',()=>{
 resetNotificationRulesForTest();
 const bn=updateNotificationRule('sale_completed',{language:'Bangla'});
 assert.match(bn.template,/বিক্রয়/);
 const custom=updateNotificationRule('sale_completed',{template:'Special sale {number}'});
 assert.equal(updateNotificationRule('sale_completed',{language:'English'}).template,custom.template);
});
