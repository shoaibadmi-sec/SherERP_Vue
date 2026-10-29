import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {notificationDisplayOptions,notificationDisplayText} from '../src/i18n/notificationCopy.ts';
import {getNotificationSnapshot,resetNotificationRulesForTest,updateNotificationRule,notificationEligibility,renderNotificationPreview} from '../src/notifications/erpNotificationRules.ts';

const file=(path:string)=>readFileSync(path,'utf8');

test('SMS notification UI translations leave choice IDs and option values untouched',()=>{
 const choices=notificationDisplayOptions('Bangla',['Customer','Supplier','Borrower','Manual','On event','English','Bangla']);
 assert.deepEqual(choices.map(x=>x.value),['Customer','Supplier','Borrower','Manual','On event','English','Bangla']);
 assert.equal(choices[2].label,'ঋণগ্রহীতা');
 assert.equal(notificationDisplayText('English','SMS gateway is not connected'),'SMS gateway is not connected');
 assert.equal(notificationDisplayText('Bangla','SMS gateway is not connected'),'SMS গেটওয়ে যুক্ত নেই');
 assert.equal(notificationDisplayText('Bangla','Some new server error'),'Some new server error');
});

test('Changing UI language does not change persisted SMS language, template, safety or phone eligibility',()=>{
 resetNotificationRulesForTest();
 const before=getNotificationSnapshot().rules.service_ready;
 assert.equal(before.enabled,false);
 assert.equal(before.language,'English');
 assert.equal(before.requireConsent,true);
 assert.equal(notificationDisplayText('Bangla','Manual'),'নিজে চালু করুন');
 assert.equal(getNotificationSnapshot().rules.service_ready.language,'English');
 const after=updateNotificationRule('service_ready',{language:'Bangla',enabled:true});
 assert.equal(after.language,'Bangla');
 assert.ok(after.template.includes('পাঞ্জাবি')===false,'template stays parameterized until record substitution');
 assert.match(renderNotificationPreview('service_ready',{business:'দোকান',item:'পাঞ্জাবি',number:'SRV-00102'}),/পাঞ্জাবি/);
 const eligible=notificationEligibility('service_ready',{phone:'01711482093',consent:true,gatewayConnected:false});
 assert.equal(eligible.eligible,false);
 assert.equal(eligible.simulationOnly,true);
 assert.ok(eligible.reasons.includes('SMS gateway is not connected'));
 assert.throws(()=>updateNotificationRule('service_ready',{requireConsent:false}),/consent/i);
});

test('Phase 9 workbench renders translated UI, never translates stored identifiers or SMS tokens',()=>{
 const page=file('src/pages/ErpNotifications.tsx');
 assert.ok(page.includes('const {text,language,showHelper}=useUiCopy()'));
 assert.ok(page.includes('options={options(recipients)}'));
 assert.ok(page.includes('options={options([\'Manual\',\'On event\'])}'));
 assert.ok(page.includes("eligibility.reasons.map(display)"));
 assert.ok(page.includes("renderNotificationPreview(selected"));
 assert.ok(page.includes('gatewayConnected:false'));
 assert.ok(page.includes("smsTokens.join(' ')"));
 assert.ok(page.includes("updateNotificationRule(ev.id,{enabled:e.target.checked})"));
 assert.ok(page.includes("setGroup(v as NotificationGroup|'All')"));
 assert.ok(page.includes("text('Preview only. No SMS was sent."));
 const model=file('src/notifications/erpNotificationRules.ts');
 assert.ok(model.includes("triggerMode:'Manual'"));
 assert.ok(model.includes("enabled:false,language:'English'"));
 assert.ok(model.includes('if(rule.requireConsent!==true)'));
});
