import {matchesSearch as fuzzyMatch} from '../utils/fuzzySearch.ts';
import type {Party} from '../types/erp.ts';

export type VendorWorkTab='ledger'|'taken'|'given'|'purchases'|'payments';
const tabs:readonly VendorWorkTab[]=['ledger','taken','given','purchases','payments'];
export const vendorWorkTabs=tabs;

export function resolveVendorView(search:string,parties:readonly Party[]):{partyId:string|null;tab:VendorWorkTab}{
 const q=new URLSearchParams(search.startsWith('?')?search.slice(1):search);
 const id=q.get('partyId');
 const allowed=Boolean(id&&parties.some(p=>p.id===id&&p.roles.includes('Vendor')));
 const tab=q.get('tab');
 return {partyId:allowed?id:null,tab:allowed&&tabs.includes(tab as VendorWorkTab)?tab as VendorWorkTab:'ledger'};
}
export function vendorWorkLink(partyId:string,tab?:VendorWorkTab,sourceId?:string):string{
 const p=new URLSearchParams({partyId});
 if(tab)p.set('tab',tab);
 if(sourceId)p.set('sourceId',sourceId);
 return '/app/vendors?'+p.toString();
}
export function filterVendors(parties:readonly Party[],text:string):Party[]{
 const q=text.trim().toLocaleLowerCase();
 return parties.filter(p=>p.roles.includes('Vendor')&&fuzzyMatch(q,[p.name,p.nameBn,p.phone,p.area]));
}
