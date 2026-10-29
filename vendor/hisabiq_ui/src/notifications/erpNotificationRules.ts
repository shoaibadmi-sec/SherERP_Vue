/** ERP-wide SMS event registry, tenant-rule preview. No gateway calls, messages, charges, or scheduling. */
export type NotificationGroup='Sales & customer'|'Services & tailoring'|'Suppliers & purchases'|'Loans & owner'|'Warranty & stock'|'Online & courier';
export const notificationEvents=[
 {id:'sale_completed',label:'Sales invoice completed',bn:'বিক্রি সম্পন্ন',source:'POS / Sales',group:'Sales & customer',audience:'Customer'},
 {id:'sale_payment_received',label:'Customer payment received',bn:'বকেয়া আদায়',source:'POS / Party ledger',group:'Sales & customer',audience:'Customer'},
 {id:'due_reminder',label:'Customer due reminder',bn:'গ্রাহকের বকেয়া স্মরণ',source:'Party ledger',group:'Sales & customer',audience:'Customer'},
 {id:'customer_overdue',label:'Overdue customer balance',bn:'মেয়াদোত্তীর্ণ বকেয়া',source:'Party ledger',group:'Sales & customer',audience:'Customer'},
 {id:'customer_credit_added',label:'Customer credit deposited',bn:'গ্রাহকের অগ্রিম জমা',source:'Party ledger',group:'Sales & customer',audience:'Customer'},
 {id:'customer_refund',label:'Customer credit refund',bn:'গ্রাহকের টাকা ফেরত',source:'Party ledger',group:'Sales & customer',audience:'Customer'},
 {id:'sales_return',label:'Sale return completed',bn:'বিক্রয় ফেরত',source:'Sales',group:'Sales & customer',audience:'Customer'},
 {id:'quotation_sent',label:'Quotation shared',bn:'মূল্য প্রস্তাব পাঠানো',source:'Quotations',group:'Sales & customer',audience:'Customer'},
 {id:'service_order_received',label:'Service / tailor order received',bn:'সেলাই বা সার্ভিস অর্ডার',source:'Service orders',group:'Services & tailoring',audience:'Service customer'},
 {id:'service_in_progress',label:'Service work started',bn:'কাজ শুরু হয়েছে',source:'Service orders',group:'Services & tailoring',audience:'Service customer'},
 {id:'service_ready',label:'Service item ready for delivery',bn:'পাঞ্জাবি/কাজ ডেলিভারির জন্য প্রস্তুত',source:'Service orders',group:'Services & tailoring',audience:'Service customer'},
 {id:'service_handover',label:'Service item handed to customer',bn:'তৈরি পণ্য হস্তান্তর',source:'Service orders',group:'Services & tailoring',audience:'Service customer'},
 {id:'service_payment_due',label:'Service balance reminder',bn:'সার্ভিসের বকেয়া',source:'Service orders',group:'Services & tailoring',audience:'Service customer'},
 {id:'supplier_purchase',label:'Purchase order placed',bn:'সরবরাহকারীকে ক্রয়ের খবর',source:'Purchases',group:'Suppliers & purchases',audience:'Supplier'},
 {id:'supplier_goods_received',label:'Supplier goods received',bn:'পণ্য পাওয়া গেছে',source:'Purchases',group:'Suppliers & purchases',audience:'Supplier'},
 {id:'supplier_payment',label:'Supplier payment sent',bn:'সরবরাহকারীকে টাকা দেওয়া',source:'Supplier ledger',group:'Suppliers & purchases',audience:'Supplier'},
 {id:'supplier_due',label:'Supplier payable reminder',bn:'সরবরাহকারীর পাওনা',source:'Supplier ledger',group:'Suppliers & purchases',audience:'Owner / staff'},
 {id:'supplier_return',label:'Purchase return / claim',bn:'ক্রয় ফেরত ও দাবি',source:'Purchases',group:'Suppliers & purchases',audience:'Supplier'},
 {id:'borrower_loan_given',label:'Loan given to borrower',bn:'ঋণ প্রদান',source:'Borrower ledger',group:'Loans & owner',audience:'Borrower'},
 {id:'borrower_due',label:'Borrower repayment reminder',bn:'ঋণ পরিশোধ স্মরণ',source:'Borrower ledger',group:'Loans & owner',audience:'Borrower'},
 {id:'borrower_repayment',label:'Borrower repayment received',bn:'ঋণের কিস্তি গ্রহণ',source:'Borrower ledger',group:'Loans & owner',audience:'Borrower'},
 {id:'lender_funds_received',label:'Funds received from lender',bn:'ঋণদাতার কাছ থেকে টাকা পাওয়া',source:'Lender ledger',group:'Loans & owner',audience:'Lender'},
 {id:'lender_repayment',label:'Lender repayment sent',bn:'ঋণদাতাকে পরিশোধ',source:'Lender ledger',group:'Loans & owner',audience:'Lender'},
 {id:'lender_due',label:'Lender repayment due',bn:'ঋণদাতার বকেয়া',source:'Lender ledger',group:'Loans & owner',audience:'Owner / staff'},
 {id:'owner_contribution',label:'Owner invested funds',bn:'মালিকের মূলধন জমা',source:'Owner ledger',group:'Loans & owner',audience:'Owner / staff'},
 {id:'owner_withdrawal',label:'Owner withdrew funds',bn:'মালিকের উত্তোলন',source:'Owner ledger',group:'Loans & owner',audience:'Owner / staff'},
 {id:'warranty_received',label:'Warranty product received',bn:'ওয়ারেন্টি পণ্য গ্রহণ',source:'Warranty',group:'Warranty & stock',audience:'Customer'},
 {id:'warranty_ready',label:'Warranty item ready for pickup',bn:'ওয়ারেন্টি পণ্য প্রস্তুত',source:'Warranty',group:'Warranty & stock',audience:'Customer'},
 {id:'warranty_replaced',label:'Warranty replacement completed',bn:'পণ্য বদল হয়েছে',source:'Warranty',group:'Warranty & stock',audience:'Customer'},
 {id:'stock_low',label:'Low stock alert',bn:'কম স্টকের সতর্কতা',source:'Products',group:'Warranty & stock',audience:'Owner / staff'},
 {id:'order_confirmed',label:'Online order confirmed',bn:'অনলাইন অর্ডার নিশ্চিত',source:'Online Sales',group:'Online & courier',audience:'Customer'},
 {id:'courier_handover',label:'Courier handover',bn:'কুরিয়ারে হস্তান্তর',source:'Online Sales',group:'Online & courier',audience:'Customer'},
 {id:'parcel_delivered',label:'Courier delivered',bn:'ডেলিভারি সম্পন্ন',source:'Online Sales',group:'Online & courier',audience:'Customer'},
 {id:'parcel_failed',label:'Delivery failed / return',bn:'ডেলিভারি ব্যর্থ',source:'Online Sales',group:'Online & courier',audience:'Customer'},
 {id:'cod_settled',label:'COD merchant settlement',bn:'কুরিয়ারের COD হিসাব',source:'Online Sales / Finance',group:'Online & courier',audience:'Owner / staff'},
] as const satisfies readonly {id:string;label:string;bn:string;source:string;group:NotificationGroup;audience:string}[];
export type ErpNotificationEvent=typeof notificationEvents[number]['id'];
export type SmsLanguage='English'|'Bangla';
export type TriggerMode='Manual'|'On event';
export type NotificationRule={
 enabled:boolean;language:SmsLanguage;template:string;requireConsent:boolean;
 triggerMode:TriggerMode;recipient:string;reminderDays:number;quietHours:boolean;
};
export type NotificationSnapshot={revision:number;rules:Record<ErpNotificationEvent,NotificationRule>};
export const groups:NotificationGroup[]=['Sales & customer','Services & tailoring','Suppliers & purchases','Loans & owner','Warranty & stock','Online & courier'];

const overrides:Partial<Record<ErpNotificationEvent,[string,string]>>={
 sale_completed:['{business}: Invoice {number} total BDT {total}. Due BDT {due}.','{business}: বিক্রয় রসিদ {number}, মোট {total} টাকা, বকেয়া {due} টাকা।'],
 sale_payment_received:['{business}: Payment BDT {paid} received for {number}. Remaining due BDT {due}.','{business}: {number} এর {paid} টাকা পেয়েছি। বকেয়া {due} টাকা।'],
 due_reminder:['{business}: Invoice {number} has BDT {due} outstanding. Due date {due_date}.','{business}: {number} এর বকেয়া {due} টাকা। শেষ তারিখ {due_date}।'],
 customer_overdue:['{business}: Your outstanding balance is BDT {balance}. Please contact us.','{business}: আপনার বকেয়া {balance} টাকা। অনুগ্রহ করে যোগাযোগ করুন।'],
 supplier_payment:['{business}: Payment BDT {paid} sent for {number}. Thank you.','{business}: {number} এর বিপরীতে {paid} টাকা দেওয়া হয়েছে।'],
 borrower_due:['{business}: Dear {party}, loan installment BDT {due} due on {due_date}. Ref {number}.','{business}: প্রিয় {party}, ঋণ কিস্তি {due} টাকা, শেষ তারিখ {due_date}। {number}।'],
 borrower_repayment:['{business}: We received your repayment BDT {paid}. Balance BDT {balance}.','{business}: ঋণ পরিশোধ {paid} টাকা পেয়েছি। বাকি {balance} টাকা।'],
 lender_repayment:['{business}: Repayment BDT {paid} sent. Ref {number}.','{business}: ঋণদাতাকে {paid} টাকা পরিশোধ করা হয়েছে। রেফারেন্স {number}।'],
 service_order_received:['{business}: We received your {item} order {number}. Thank you.','{business}: আপনার {item} অর্ডার {number} নেওয়া হয়েছে। ধন্যবাদ।'],
 service_ready:['{business}: Your {item} is ready for delivery! Order {number}. Please collect it.','{business}: আপনার {item} তৈরি হয়েছে! অর্ডার {number}। অনুগ্রহ করে সংগ্রহ করুন।'],
 service_handover:['{business}: Your {item} from order {number} was delivered. Thank you.','{business}: অর্ডার {number} এর {item} হস্তান্তর করা হয়েছে। ধন্যবাদ।'],
 service_payment_due:['{business}: Balance BDT {due} remains for your {item}, order {number}.','{business}: অর্ডার {number} এর {item} এর বকেয়া {due} টাকা।'],
 warranty_ready:['{business}: Your {item} is ready for pickup. Case {number}.','{business}: আপনার {item} গ্রহণের জন্য প্রস্তুত। কেস {number}।'],
 stock_low:['{business}: Low stock: {item}. Current balance {balance}.','{business}: {item} এর স্টক কম। বর্তমানে {balance}।'],
 order_confirmed:['{business}: Order {number} confirmed. Total BDT {total}.','{business}: আপনার অর্ডার {number} নিশ্চিত। মোট {total} টাকা।'],
 courier_handover:['{business}: Order {number} sent by {courier}. Tracking {tracking}.','{business}: অর্ডার {number} {courier} এ পাঠানো হয়েছে। ট্র্যাকিং {tracking}।'],
 parcel_delivered:['{business}: Order {number} is marked delivered. Thank you.','{business}: আপনার অর্ডার {number} ডেলিভারি হয়েছে। ধন্যবাদ।'],
 parcel_failed:['{business}: Delivery for order {number} needs attention.','{business}: অর্ডার {number} ডেলিভারিতে সমস্যা হয়েছে।'],
 cod_settled:['{business}: Courier settlement for {number} recorded, BDT {paid}.','{business}: {number} এর COD সেটেলমেন্ট {paid} টাকা হিসাবভুক্ত।']
};
function makeMessages(language:SmsLanguage):Record<ErpNotificationEvent,string>{
 return Object.fromEntries(notificationEvents.map(e=>[e.id,overrides[e.id]?.[language==='English'?0:1]??
  (language==='English'?'{business}: '+e.label+'. Ref {number}.':'{business}: '+e.bn+'। রেফারেন্স {number}।')])) as Record<ErpNotificationEvent,string>;
}
export const defaultSmsTemplates=makeMessages('English');
export const banglaSmsTemplates=makeMessages('Bangla');
const defaultRule=(event:typeof notificationEvents[number]):NotificationRule=>({
 enabled:false,language:'English',template:defaultSmsTemplates[event.id],requireConsent:true,
 triggerMode:'Manual',recipient:event.audience,reminderDays:3,quietHours:true
});
const initial=():NotificationSnapshot=>({revision:0,rules:Object.fromEntries(notificationEvents.map(e=>[e.id,defaultRule(e)])) as Record<ErpNotificationEvent,NotificationRule>});
let state=initial();
const listeners=new Set<()=>void>();
export const getNotificationSnapshot=()=>state;
export const subscribeNotificationRules=(f:()=>void)=>{listeners.add(f);return()=>{listeners.delete(f);};};
export function resetNotificationRulesForTest(){state=initial();listeners.forEach(f=>f());}
const placeholders=['business','number','total','paid','due','courier','tracking','party','customer','item','amount','balance','date','due_date','ready_date','status'];
export const smsTokens=placeholders.map(p=>'{'+p+'}');
export function updateNotificationRule(event:ErpNotificationEvent,patch:Partial<NotificationRule>):NotificationRule{
 const definition=notificationEvents.find(e=>e.id===event);
 if(!definition)throw new Error('Unknown ERP notification event.');
 const old=state.rules[event];
 const fallback=patch.language&&patch.language!==old.language&&patch.template===undefined&&
  (old.template===defaultSmsTemplates[event]||old.template===banglaSmsTemplates[event])
  ?(patch.language==='Bangla'?banglaSmsTemplates[event]:defaultSmsTemplates[event]):old.template;
 const rule={...old,...patch,template:patch.template??fallback};
 if(!['English','Bangla'].includes(rule.language))throw new Error('Invalid SMS language.');
 if(!['Manual','On event'].includes(rule.triggerMode))throw new Error('Invalid notification trigger.');
 if(!rule.recipient.trim()||rule.recipient.length>50)throw new Error('Recipient category is required.');
 if(!Number.isInteger(rule.reminderDays)||rule.reminderDays<0||rule.reminderDays>365)throw new Error('Reminder days must be between 0 and 365.');
 if(!rule.template.trim()||rule.template.length>320||
   /\{[^{}]+\}/.test(rule.template.replace(/\{(?:business|number|total|paid|due|courier|tracking|party|customer|item|amount|balance|date|due_date|ready_date|status)\}/g,'')))
  throw new Error('Template must be 1–320 characters and contain only supported placeholders.');
 if(rule.requireConsent!==true)throw new Error('Recipient consent is required for SMS.');
 state={revision:state.revision+1,rules:{...state.rules,[event]:rule}};listeners.forEach(f=>f());return rule;
}
export function renderNotificationPreview(event:ErpNotificationEvent,context:Record<string,string|number>){
 const rule=state.rules[event];if(!rule)throw new Error('Unknown event.');
 return rule.template.replace(/\{(business|number|total|paid|due|courier|tracking|party|customer|item|amount|balance|date|due_date|ready_date|status)\}/g,(_all,key:string)=>String(context[key]??'—'));
}
export function notificationEligibility(event:ErpNotificationEvent,opts:{phone:string;consent:boolean;gatewayConnected:boolean;withinQuietHours?:boolean}){
 const rule=state.rules[event];if(!rule)throw new Error('Unknown event.');
 const reasons:string[]=[];
 if(!rule.enabled)reasons.push('Event is disabled');
 if(!opts.consent)reasons.push('Recipient has not consented');
 if(!/^(?:\+?880|0)1[3-9]\d{8}$/.test(opts.phone.replace(/[ -]/g,'')))reasons.push('Invalid Bangladesh phone');
 if(!opts.gatewayConnected)reasons.push('SMS gateway is not connected');
 if(rule.quietHours&&opts.withinQuietHours)reasons.push('Quiet hours active');
 return {eligible:reasons.length===0,reasons,simulationOnly:true as const};
}
