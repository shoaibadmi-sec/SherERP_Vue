import type {Party,PartyRole} from '../types/erp';
import type {PartyOpeningPayload,PartySourceRecord} from '../types/partyLedger';
import {validateBusinessDate,toPaisa} from './partyPayment.ts';
import {financeTypeMeta} from './partyFinance.ts';

export function isPartyOpening(source:PartySourceRecord):boolean {
 return source.kind==='opening'||(source.kind==='finance'&&
   (!!(source.financeType&&financeTypeMeta[source.financeType]?.opening)||
    /^Opening (Owner Capital|Loan|Borrower Loan)$/.test(source.description)));
}
export function activePartyOpening(sources:readonly PartySourceRecord[],partyId:string,role:PartyRole):PartySourceRecord|undefined {
 return sources.find(s=>s.partyId===partyId&&s.relationship===role&&s.status==='Active'&&isPartyOpening(s));
}
export function validateOpening(payload:PartyOpeningPayload,party:Party,sources:readonly PartySourceRecord[]):void {
 if(party.status==='Inactive')throw new Error('An inactive party cannot receive opening balance changes.');
 if(!party.roles.includes(payload.relationship))throw new Error('Party does not have the selected relationship.');
 validateBusinessDate(payload.date);
 const amount=toPaisa(payload.amount,'Opening balance');
 if(!['debit','credit'].includes(payload.side))throw new Error('Choose a valid opening balance direction.');
 if(payload.note&&payload.note.trim().length>400)throw new Error('Opening note is too long.');
 const older=sources.filter(s=>s.partyId===party.id&&s.relationship===payload.relationship&&s.status==='Active'
   &&s.kind!=='note'&&!isPartyOpening(s)).map(s=>s.date).sort()[0];
 if(older&&payload.date>older)throw new Error('Opening date must not be after the first existing transaction ('+older+').');
 if(!Number.isSafeInteger(amount))throw new Error('Invalid opening balance.');
}
export function makeOpeningSource(payload:PartyOpeningPayload,sequence:number,id:string):PartySourceRecord {
 return {
  id,partyId:payload.partyId,relationship:payload.relationship,kind:'opening',
  date:payload.date,sequence,reference:'OPEN-'+payload.relationship.toUpperCase(),
  description:'Opening balance · প্রারম্ভিক জের'+(payload.note?.trim()?' · '+payload.note.trim():''),
  debit:payload.side==='debit'?payload.amount:0,credit:payload.side==='credit'?payload.amount:0,
  amountPaid:0,paymentSplits:[],provenance:'legacy-unverified',status:'Active'
 };
}
