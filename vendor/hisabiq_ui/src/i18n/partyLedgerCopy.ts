import type {UiLanguage} from './uiCopy';
import {uiText} from './uiCopy';
import type {PartyAction,PartyLedgerRow} from '../types/partyLedger';
import {partyLedgerImpactText} from './partyFinancialCopy';

/** The keys are the source enums; these labels are presentation-only. */
const sources:Record<PartyLedgerRow['source'],readonly [string,string]>={
 sale:['Invoice','বিক্রির বিল'],
 purchase:['Purchase','কেনার বিল'],
 finance:['Finance','টাকার লেনদেন'],
 opening:['Opening','শুরুর জের'],
 note:['Note','নোট'],
 'sale-return':['Sales return','বিক্রি ফেরত'],
 'purchase-return':['Purchase return','কেনা ফেরত'],
 'customer-payment':['Payment','টাকা জমা'],
 'supplier-payment':['Payment','টাকা দেওয়া'],
 'customer-credit-refund':['Credit refund','ক্রেতাকে জমা ফেরত'],
 'supplier-credit-refund':['Supplier refund','সরবরাহকারীর টাকা ফেরত'],
 'customer-credit-apply':['Credit used','জমা টাকা ব্যবহার'],
 expense:['Expense','খরচ']
};
const actions:Record<PartyAction,readonly [string,string]>={
 view:['View','দেখুন'],
 edit:['Edit','সম্পাদনা'],
 delete:['Delete / reverse','মুছুন / উল্টো এন্ট্রি'],
 reverse:['Reverse','উল্টো এন্ট্রি'],
 print:['Print','প্রিন্ট'],
 return:['Return','ফেরত'],
 source:['Open original','মূল রেকর্ড খুলুন']
};
export function partyLedgerSourceLabel(language:UiLanguage,source:PartyLedgerRow['source']):string {
 const pair=sources[source];
 return pair?uiText(language,pair[0],pair[1]):source;
}
export function partyLedgerActionLabel(language:UiLanguage,action:PartyAction):string {
 const pair=actions[action];
 return uiText(language,pair[0],pair[1]);
}
export function partyLedgerCaption(language:UiLanguage,row:PartyLedgerRow,impactLabel:string,kind:string):string {
 const label=kind==='due'
  ?row.relationship==='Supplier'?'Payable increased':'Due increased'
  :kind==='adjustment'?'Adjustment':impactLabel;
 const known:Record<string,string>={
  'Payable increased':'দেনা বেড়েছে',
  'Due increased':'বাকি বেড়েছে',
  'Adjustment':'সমন্বয়'
 };
 return known[label]?uiText(language,label,known[label]):partyLedgerImpactText(language,label);
}
