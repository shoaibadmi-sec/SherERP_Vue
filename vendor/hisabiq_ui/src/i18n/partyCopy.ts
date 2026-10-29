import type {PartyRole} from '../types/erp';
import type {UiLanguage} from './uiCopy';
import {uiText} from './uiCopy';

/** Display-only role labels. Persisted relationship IDs remain English enums. */
export const partyRoleBn:Record<PartyRole,string>={
  Customer:'ক্রেতা',Supplier:'সরবরাহকারী',Vendor:'ভেন্ডর',
  Lender:'ঋণদাতা',Borrower:'ঋণগ্রহীতা',Payee:'খরচের প্রাপক',Owner:'মালিক'
};

export const partyRoleLabel=(role:PartyRole,language:UiLanguage)=>
  uiText(language,role,partyRoleBn[role]);

/** Existing direction strings use an English · Bangla visual label; never change debit/credit keys. */
export function partyOpeningDirectionLabel(label:string,language:UiLanguage):string {
  const [english,bangla]=label.split(' · ');
  return language==='English + Bangla'?label:uiText(language,english,bangla??english);
}
