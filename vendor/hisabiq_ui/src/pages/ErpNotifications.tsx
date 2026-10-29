import {matchesSearch as fuzzyMatch} from '../utils/fuzzySearch';
import {useMemo,useState,useSyncExternalStore} from 'react';
import {Link} from 'react-router-dom';
import {toast} from 'sonner';
import {PageHeader} from '../components/PageHeader';
import {Button} from '../components/Button';
import {Input} from '../components/Input';
import {AppSelect} from '../components/AppSelect';
import {notificationEvents,groups,smsTokens,subscribeNotificationRules,getNotificationSnapshot,
 updateNotificationRule,renderNotificationPreview,notificationEligibility,
 type ErpNotificationEvent,type NotificationGroup,type SmsLanguage,type TriggerMode
} from '../notifications/erpNotificationRules';
import {useUiCopy} from '../i18n/useUiCopy';
import {notificationDisplayText,notificationDisplayOptions} from '../i18n/notificationCopy';

const example={business:'HisabIQ Demo',number:'SRV-00102',total:'2500',paid:'1000',due:'1500',
 party:'Rahman',customer:'Rahman',item:'Panjabi',amount:'1500',balance:'1500',courier:'Steadfast',
 tracking:'DEMO-8761',due_date:'2026-10-20',ready_date:'2026-10-11',date:'2026-10-09',status:'Ready'};
const recipients=['Customer','Service customer','Supplier','Borrower','Lender','Owner / staff','Related party'];

export function ErpNotificationsWorkbench({embedded=false}:{embedded?:boolean}){
 const {text,language,showHelper}=useUiCopy();
 const display=(value:string)=>notificationDisplayText(language,value);
 const options=(values:readonly string[])=>notificationDisplayOptions(language,values);
 const {rules}=useSyncExternalStore(subscribeNotificationRules,getNotificationSnapshot);
 const [group,setGroup]=useState<NotificationGroup|'All'>('All');
 const [query,setQuery]=useState('');
 const [selected,setSelected]=useState<ErpNotificationEvent>('service_ready');
 const [phone,setPhone]=useState('01711482093'),[consent,setConsent]=useState(false);
 const [draft,setDraft]=useState<string|null>(null);
 const [error,setError]=useState('');
 const selectedDef=notificationEvents.find(e=>e.id===selected)!;
 const rule=rules[selected];
 const events=useMemo(()=>notificationEvents.filter(ev=>
  (group==='All'||ev.group===group)&&fuzzyMatch(query,[ev.label,ev.bn,ev.source,ev.group,ev.audience,notificationDisplayText(language,ev.source),notificationDisplayText(language,ev.group)])),
  [group,query,language]);
 const choose=(id:ErpNotificationEvent)=>{setSelected(id);setDraft(null);setError('');};
 const patch=(patch:Parameters<typeof updateNotificationRule>[1])=>{
  try{updateNotificationRule(selected,patch);setError('');}catch(e){setError(display(e instanceof Error?e.message:'Invalid rule'));}
 };
 const eligibility=notificationEligibility(selected,{phone,consent,gatewayConnected:false});
 const saveTemplate=()=>{try{updateNotificationRule(selected,{template:draft??rule.template});setDraft(null);setError('');toast.success(text('SMS template saved in UI preview','নমুনা SMS বার্তা সংরক্ষিত হয়েছে'));}
  catch(e){setError(display(e instanceof Error?e.message:'Invalid SMS template.'));}};
 return <div className="space-y-4">
  {!embedded&&<PageHeader title="ERP Notifications" titleBn="এসএমএস ও নোটিফিকেশন"
    description={text("One event-based notification system for customers, tailoring, suppliers, borrowers, lenders and the rest of HisabIQ.","ক্রেতা, সার্ভিস, সরবরাহকারী, ঋণ ও ব্যবসার সব SMS নোটিফিকেশন এক জায়গায়।")}/>}
  <p className="rounded-lg border border-warning/30 bg-warning-bg px-4 py-3 text-xs text-warning">
   {text('SMS gateway disconnected: settings and messages are','SMS গেটওয়ে যুক্ত নেই। সেটিংস ও বার্তাগুলো')} <strong>{text('preview only — no SMS will be sent or billed','শুধু নমুনা — SMS পাঠানো হবে না বা টাকা কাটা হবে না')}</strong>.
   {text('All event switches default OFF. Enabling a rule does not send a message, schedule a reminder or alter SMS credits.','সব নোটিফিকেশন শুরুতে বন্ধ। চালু করলেও SMS পাঠানো, সময় ঠিক করা বা SMS ক্রেডিট কাটা হবে না।')}
  </p>
  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
   {[
    [text('Event types','বার্তার ধরন'),String(notificationEvents.length)],
    [text('Enabled rules','চালু নিয়ম'),String(notificationEvents.filter(e=>rules[e.id].enabled).length)],
    [text('Configured groups','বিভাগ'),String(groups.length)],
    [text('SMS transmitted','পাঠানো SMS'),text('0 — preview only','০ — শুধু নমুনা')]
   ].map(([label,value])=><div key={label} className="rounded-lg border border-border bg-card p-3">
    <p className="text-[11px] text-ink-500">{label}</p><p className="mt-1 text-base font-semibold text-ink">{value}</p></div>)}
  </div>
  <div className="grid gap-4 lg:grid-cols-[minmax(300px,1fr)_minmax(300px,1fr)]">
   <section className="rounded-xl border border-border bg-card">
    <div className="space-y-2 border-b border-border p-3">
     <div className="flex flex-wrap items-center gap-2">
      <div className="min-w-[170px] flex-1"><Input aria-label={text("Search ERP notification events","নোটিফিকেশন খুঁজুন")} value={query} onChange={e=>setQuery(e.target.value)} placeholder={text("Search notifications or modules","নোটিফিকেশন বা মডিউল খুঁজুন")}/></div>
      <AppSelect label={text("Filter notification group","নোটিফিকেশনের বিভাগ")} value={group} options={options(['All',...groups])} className="min-w-44" onChange={v=>setGroup(v as NotificationGroup|'All')}/>
     </div>
     <p className="text-xs text-ink-500">{text("SMS events are grouped by ERP workflow; select one to change its settings.","কাজের ধরন অনুযায়ী SMS সাজানো আছে। সেটিংস বদলাতে একটি বেছে নিন।")}</p>
    </div>
    <div className="max-h-[560px] space-y-1 overflow-y-auto p-2">
     {events.map(ev=><div key={ev.id} className={'flex items-center gap-2 rounded-lg border p-2.5 '+(selected===ev.id?'border-teal-400 bg-teal-50/30 dark:bg-teal-900/10':'border-border')}>
      <button type="button" className="min-w-0 flex-1 text-left" onClick={()=>choose(ev.id)}>
       <strong className="block text-xs text-ink">{text(ev.label,ev.bn)}</strong>
       {showHelper&&<p className="font-bn text-[11px] text-ink-500">{ev.bn}</p>}
       <p className="text-[10px] text-ink-400">{display(ev.source)} · {display(ev.audience)}</p>
      </button>
      <label className="flex shrink-0 items-center gap-1 text-xs text-ink-500">
       <input type="checkbox" aria-label={text('Enable SMS ','SMS চালু করুন ') + ev.id} checked={rules[ev.id].enabled}
        onChange={e=>{try{updateNotificationRule(ev.id,{enabled:e.target.checked});choose(ev.id);}catch(error){setError(display(error instanceof Error?error.message:'Could not update this notification rule.'));}}}/>
       {display(rules[ev.id].enabled?'On':'Off')}
      </label>
     </div>)}
     {!events.length&&<p className="p-5 text-center text-sm text-ink-500">{text("No events match this filter.","এই খোঁজার জন্য কোনো নোটিফিকেশন নেই।")}</p>}
    </div>
   </section>
   <section className="h-fit space-y-3 rounded-xl border border-border bg-card p-4">
    <div><h3 className="text-sm font-semibold text-ink">{text(selectedDef.label,selectedDef.bn)}</h3>
     {showHelper&&<p className="font-bn text-xs text-ink-500">{selectedDef.bn}</p>}
     <p className="mt-1 text-xs text-ink-500">{text("Source:","উৎস:")} {display(selectedDef.source)} · {text("Default audience:","প্রাপক:")} {display(selectedDef.audience)}</p></div>
    <div className="grid grid-cols-2 gap-2">
     <label className="space-y-1 text-xs text-ink-500">{text("SMS language","SMS-এর ভাষা")}
      <AppSelect label={text("SMS language","SMS-এর ভাষা")} value={rule.language} options={options(['English','Bangla'])} onChange={v=>{patch({language:v as SmsLanguage});setDraft(null);}}/>
     </label>
     <label className="space-y-1 text-xs text-ink-500">{text("When to notify","কখন জানাবেন")}
      <AppSelect label={text("Notification trigger","নোটিফিকেশন চালুর নিয়ম")} value={rule.triggerMode} options={options(['Manual','On event'])}
       onChange={v=>patch({triggerMode:v as TriggerMode})}/>
     </label>
     <label className="space-y-1 text-xs text-ink-500">{text("Recipient role","যাকে জানাবেন")}
      <AppSelect label={text("Notification recipient","বার্তার প্রাপক")} value={rule.recipient} options={options(recipients)} onChange={v=>patch({recipient:v})}/>
     </label>
     <label className="space-y-1 text-xs text-ink-500">{text("Reminder lead time (days)","কত দিন আগে মনে করাবেন")}
      <Input aria-label={text("Reminder days","মনে করানোর দিন")} type="number" min="0" max="365" value={rule.reminderDays} onChange={e=>patch({reminderDays:Number(e.target.value)})}/>
     </label>
    </div>
    <p className="text-[11px] text-ink-500">{text('SMS language controls the message template; it is separate from the interface language.','SMS-এর ভাষা শুধু বার্তার জন্য। অ্যাপের ভাষা বদলালে SMS-এর ভাষা বদলাবে না।')}</p>
    <div className="flex flex-wrap items-center gap-4">
     <label className="flex items-center gap-2 text-xs text-ink">
      <input type="checkbox" aria-label={text("Respect quiet hours","বিশ্রামের সময় বার্তা নয়")} checked={rule.quietHours} onChange={e=>patch({quietHours:e.target.checked})}/>{text("Respect quiet hours","বিশ্রামের সময় বার্তা নয়")}
     </label>
     <span className="text-[11px] text-ink-500">{text("Customer consent required (always)","প্রাপকের অনুমতি সব সময় লাগবে")}</span>
    </div>
    <label className="block space-y-1 text-xs font-medium text-ink">{text("SMS template","বার্তার নমুনা")}{showHelper&&" · বার্তার নমুনা"}
     <textarea aria-label={text("SMS template","বার্তার নমুনা")} rows={4} maxLength={320} value={draft??rule.template}
      onChange={e=>setDraft(e.target.value)} className="w-full resize-y rounded-md border border-input bg-card p-2 text-sm text-ink"/>
    </label>
    <div className="flex items-center justify-between gap-2">
     <span className="text-[11px] text-ink-500">{(draft??rule.template).length} / 320 {text("characters","অক্ষর")}</span>
     <Button size="sm" variant="outline" disabled={draft===null} onClick={saveTemplate}>{text("Save template","বার্তা সংরক্ষণ করুন")}</Button>
    </div>
    <p className="text-[11px] text-ink-500">{text("Available placeholders:","ব্যবহারযোগ্য ঘর:")} {smsTokens.join(' ')}</p>
    {error&&<p role="alert" className="rounded-md bg-danger-bg p-2 text-xs text-danger">{error}</p>}
    <div className="space-y-2 rounded-lg bg-ink-50 p-3">
     <p className="text-xs font-medium text-ink">{text("Message preview","বার্তার নমুনা")}{showHelper&&" — উদাহরণ"}</p>
     <p className="text-sm text-ink" data-testid="erp-sms-preview">{renderNotificationPreview(selected,{...example,item:rule.language==='Bangla'?'পাঞ্জাবি':'Panjabi'})}</p>
     <p className="text-[11px] text-ink-500">{text("Example item: Panjabi (পাঞ্জাবি). Replace placeholders with actual record fields when backend events exist.","নমুনা পণ্য: পাঞ্জাবি। সার্ভার যুক্ত হলে আসল বিলের তথ্য বসবে।")}</p>
    </div>
    <div className="grid gap-2 sm:grid-cols-2">
     <label className="space-y-1 text-xs text-ink-500">{text("Recipient phone preview","প্রাপকের ফোন নম্বর")}
      <Input aria-label={text("SMS preview phone","SMS নমুনার ফোন")} value={phone} onChange={e=>setPhone(e.target.value)} placeholder="017XXXXXXXX"/></label>
     <label className="flex items-center gap-2 pt-4 text-xs text-ink"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/> {text("Consent recorded","অনুমতি আছে")}</label>
    </div>
    <p className="text-xs text-warning">{eligibility.reasons.map(display).join(' · ')||text('Policy eligible, but demo never sends.','নিয়ম ঠিক আছে, তবে নমুনা থেকে SMS পাঠানো হয় না।')}</p>
    <Button size="sm" variant="outline" onClick={()=>toast(text('Preview only. No SMS was sent.','শুধু নমুনা। কোনো SMS পাঠানো হয়নি।'))}>{text('Preview only — never send','শুধু নমুনা — SMS পাঠাবেন না')}</Button>
    {!embedded&&<p className="border-t border-border pt-2 text-xs text-ink-500">
     {text('Configuration applies ERP-wide, not just online orders. Future server integration will connect event triggers, gateway, credits, delivery reports and opt-outs.','এই নিয়ম পুরো ERP-তে প্রযোজ্য। পরে সার্ভার যুক্ত হলে SMS পাঠানো, ক্রেডিট, ডেলিভারি রিপোর্ট ও বন্ধ করার ব্যবস্থা কাজ করবে।')}
     <Link className="ml-1 text-teal-700 underline underline-offset-2 dark:text-teal-400" to="/app/subscription">{text('See SMS credits','SMS ক্রেডিট দেখুন')}</Link>.
    </p>}
   </section>
  </div>
 </div>;
}
export function ErpNotifications(){return <div className="mx-auto max-w-[1440px]"><ErpNotificationsWorkbench/></div>;}
