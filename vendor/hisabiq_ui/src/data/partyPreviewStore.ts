import { parties as seedParties, ledgerEntries as seedLedgerEntries } from './parties.ts';
import { normalizePartyFixture } from './partyFixtureAdapter.ts';
import { validatePartyDraft } from '../utils/partyIdentity.ts';
import { businessToday } from '../utils/dateRange.ts';
import { validatePartyPayment, validatePartyRefund, validatePartySplits, validateBusinessDate, toPaisa } from '../utils/partyPayment.ts';
import { financeTypeMeta } from '../utils/partyFinance.ts';
import { validateOpening,activePartyOpening,isPartyOpening,makeOpeningSource } from '../utils/partyOpening.ts';
import { customerSettlementAsOf, supplierSettlementAsOf, validateCustomerPayment, validateCustomerRefund } from '../utils/partySettlement.ts';
import { assertCounterInvoiceAllocation } from '../utils/counterAllocation.ts';
import { financeAccounts as seedFinanceAccounts, type FinanceAccount } from './financeAccounts.ts';
import type { Party, PartyRole } from '../types/erp';
import type {PartyImportPlan} from '../import/partyImport.ts';
import type {ImportResult} from '../import/importTypes.ts';
import type { PartyDraft, PartyPreviewState, PartySourceRecord, PartyPaymentPayload, PartyRefundPayload, PartyFinancePayload, PartyOpeningPayload } from '../types/partyLedger';

export type PartyPreviewCommand =
  | {type:'create-party'; party:PartyDraft; openings?:Omit<PartyOpeningPayload,'partyId'>[]}
  | {type:'import-parties'; parties:PartyDraft[]}
  | {type:'import-party-batch'; plan:PartyImportPlan}
  | {type:'update-party'; id:string; patch:Partial<PartyDraft>; openings?:Omit<PartyOpeningPayload,'partyId'>[]}
  | {type:'deactivate-party'; id:string}
  | {type:'add-note'; partyId:string; text:string; relationship?:PartyRole}
  | {type:'edit-note'; sourceId:string; text:string}
  | {type:'delete-note'; sourceId:string}
  | {type:'set-opening'; payload:PartyOpeningPayload}
  | {type:'record-payment'; payload:PartyPaymentPayload}
  | {type:'record-finance'; payload:PartyFinancePayload}
  | {type:'refund-credit'; payload:PartyRefundPayload}
  | {type:'edit-source-payment'; sourceId:string; reason:string; payload:PartyPaymentPayload}
  | {type:'reverse-source'; sourceId:string; reason:string};

const listeners = new Set<()=>void>();
const importedSessions=new Map<string,ImportResult>();
let counter = 0;
const fresh = () => normalizePartyFixture(seedParties, seedLedgerEntries);
let state:PartyPreviewState = fresh();

export function getPartyPreviewSnapshot():PartyPreviewState { return state; }
export function subscribePartyPreview(listener:()=>void):()=>void {
  listeners.add(listener);
  return () => {listeners.delete(listener);};
}
export function resetPartyPreviewForTest():void { counter=0; importedSessions.clear(); state=fresh(); listeners.forEach(listener=>listener()); }

export class PartyQuickAddConflict extends Error {
  readonly reason:'inactive'|'ambiguous'|'existing-opening';
  constructor(reason:PartyQuickAddConflict['reason']) { super(reason); this.reason=reason; }
}

/** Reuse an exact identity by adding relationships, never by replacing its saved profile. */
export function quickAddPartyPreview(draft:PartyDraft, openings:Omit<PartyOpeningPayload,'partyId'>[] = []) {
  const errors=validatePartyDraft(draft,state.parties);
  if(errors.length)throw new Error(errors.join(' '));
  const name=draft.name.trim().normalize('NFKC').toLocaleLowerCase();
  const phone=draft.phone.replace(/\D/g,'');
  const matches=phone?state.parties.filter(p=>p.name.trim().normalize('NFKC').toLocaleLowerCase()===name&&p.phone.replace(/\D/g,'')===phone):[];
  if(matches.length>1)throw new PartyQuickAddConflict('ambiguous');
  const existing=matches[0];
  if(existing?.status==='Inactive')throw new PartyQuickAddConflict('inactive');
  if(existing&&openings.some(entry=>existing.roles.includes(entry.relationship)))throw new PartyQuickAddConflict('existing-opening');
  const next=existing
    ?dispatchPartyPreview({type:'update-party',id:existing.id,patch:{roles:[...new Set([...existing.roles,...draft.roles])]},openings})
    :dispatchPartyPreview({type:'create-party',party:draft,openings});
  const id=existing?.id??next.audit[next.audit.length-1].partyId;
  const party=next.parties.find(p=>p.id===id);
  if(!party)throw new Error('The party could not be selected.');
  return {party,reused:!!existing};
}

function checkedText(value:string,field:string):string {
  const text=value.trim();
  if (!text) throw new Error(field+' is required.');
  return text;
}
function addParty(input:PartyDraft, existing:Party[]):Party {
  const errors=validatePartyDraft(input,existing);
  if(errors.length)throw new Error(errors.join(' '));
  const id=input.id?.trim()||'party-preview-'+(++counter);
  return {
    id,
    name:input.name.trim(),
    nameBn:input.nameBn?.trim(),
    phone:input.phone.trim(),
    area:input.area.trim(),
    roles:[...input.roles],
    avatarColor:input.avatarColor??'#0D7C74',
    image:input.image,
    balance:0,
    lastActivity:'Just now',
    status:'Active'
  };
}

/** A single audited validation-and-commit transaction in the in-memory UI preview. */
export function commitPartyImportBatch(plan:PartyImportPlan):ImportResult {
 const previous=importedSessions.get(plan.sessionId);
 if(previous)return previous;
 if(!plan.sessionId.trim())throw new Error('Import session ID is required.');
 if(plan.baseRevision!==state.revision)throw new Error('Party preview changed. Recheck the imported rows before confirming.');
 if(plan.issues.some(issue=>issue.severity==='error'))throw new Error('Resolve or skip invalid Party rows before import.');
 if(!plan.changes.length)throw new Error('No valid Parties selected for import.');
 const relationship=plan.target==='customer'?'Customer':'Supplier';
 const parties=state.parties.map(p=>({...p,roles:[...p.roles]}));
 const sources=[...state.sources];
 const audit=[...state.audit];
 const touched=new Set<string>();
 const rows=new Set<string>();
 let nextCounter=counter,created=0,roleAdded=0,openingSources=0;
 const issuedIds=new Set(parties.map(p=>p.id));
 const usedPhones=new Map<string,Set<string>>();
 for(const p of state.parties){
  const key=p.phone.replace(/[\s()-]/g,'');
  if(key)usedPhones.set(key,new Set([...(usedPhones.get(key)??new Set()),p.id]));
 }
 let sequence=Math.max(0,...sources.map(s=>s.sequence));
 for(const change of plan.changes){
  if(!Number.isSafeInteger(change.sourceRow)||change.sourceRow<1||!change.sourceSheet.trim())
   throw new Error('Invalid source row metadata.');
  const rowKey=change.sourceSheet+':'+change.sourceRow;
  if(rows.has(rowKey))throw new Error('Duplicate import source row.');
  rows.add(rowKey);
  let party:Party;
  let before:unknown;
  let after:unknown;
  let sourceId:string|undefined;
  if(change.action==='create'){
   const draft=change.draft;
   if(draft.roles.length!==1||draft.roles[0]!==relationship)throw new Error('Party relationship does not match import target.');
   const problems=validatePartyDraft(draft,parties);
   if(problems.length)throw new Error(problems.join(' '));
   if(draft.id)throw new Error('New Party IDs are assigned by the import store.');
   const normalized=draft.phone.replace(/[\s()-]/g,'');
   if(normalized&&usedPhones.has(normalized)){
    const matchIds=usedPhones.get(normalized)!;
    if(matchIds.size!==1||!change.confirmedSeparateFrom||!matchIds.has(change.confirmedSeparateFrom))
     throw new Error('Matching phone requires explicit Create separately confirmation.');
   }else if(change.confirmedSeparateFrom)throw new Error('Previously confirmed phone match changed; review identity again.');
   const id='party-import-'+plan.sessionId.replace(/[^a-zA-Z0-9_-]/g,'-').slice(0,75)+'-'+change.sourceRow;
   if(issuedIds.has(id))throw new Error('Duplicate imported Party ID.');
   issuedIds.add(id);
   party={id,name:draft.name.trim(),nameBn:draft.nameBn?.trim(),phone:draft.phone.trim(),
    area:draft.area.trim(),roles:[relationship],avatarColor:'#0D7C74',balance:0,lastActivity:'Just now',status:'Active'};
   parties.push(party);
   if(normalized)usedPhones.set(normalized,new Set([...(usedPhones.get(normalized)??new Set()),id]));
   created++;after=party;
  }else{
   if(change.role!==relationship)throw new Error('Import relationship does not match target.');
   const index=parties.findIndex(p=>p.id===change.partyId);
   if(index<0)throw new Error('Matched Party no longer exists.');
   const original=parties[index];
   if(original.status==='Inactive')throw new Error('Cannot add relationship to an inactive Party.');
   if(original.roles.includes(relationship))throw new Error('Selected Party already has this relationship.');
   before=original;
   party={...original,roles:[...original.roles,relationship]};
   parties[index]=party;
   roleAdded++;after=party;
  }
  if(change.opening){
   const opening={...change.opening,partyId:party.id};
   if(opening.relationship!==relationship)throw new Error('Opening relationship does not match imported role.');
   if(toPaisa(opening.amount,'Opening balance')<=0)throw new Error('Zero opening must not create a ledger source.');
   if(activePartyOpening(sources,party.id,relationship))throw new Error('An active opening balance already exists for this relationship.');
   validateOpening(opening,party,sources);
   sourceId='party-opening:import-'+plan.sessionId.replace(/[^a-zA-Z0-9_-]/g,'-').slice(0,75)+'-'+change.sourceRow;
   if(sources.some(s=>s.id===sourceId))throw new Error('Duplicate opening source ID.');
   const source=makeOpeningSource(opening,++sequence,sourceId);
   sources.push({...source,importSessionId:plan.sessionId,importSourceSheet:change.sourceSheet,importSourceRow:change.sourceRow});
   openingSources++;
   after={party,opening:source};
  }
  touched.add(party.id);
  audit.push({id:'audit-preview-'+(++nextCounter),partyId:party.id,sourceId,
    action:change.action==='create'?'import-party-create':'import-party-add-role',
    before,after,actor:'Preview user',at:new Date().toISOString(),
    importSessionId:plan.sessionId,sourceSheet:change.sourceSheet,sourceRow:change.sourceRow,relationship});
 }
 for(const partyId of touched){
  const party=parties.find(p=>p.id===partyId);
  if(party?.roles.includes('Customer'))customerSettlementAsOf(sources,partyId,businessToday());
  if(party?.roles.includes('Supplier'))supplierSettlementAsOf(sources,partyId,businessToday());
 }
 const result:ImportResult={sessionId:plan.sessionId,created,masterUpdated:0,roleAdded,openingSources,
  openingLots:0,skipped:plan.skipped,rejected:0,errors:[]};
 // Publish only after every check succeeds. A thrown validation leaves snapshot and audit unchanged.
 state={parties,sources,audit,revision:state.revision+1};
 counter=nextCounter;
 importedSessions.set(plan.sessionId,result);
 listeners.forEach(listener=>listener());
 return result;
}

export function dispatchPartyPreview(command:PartyPreviewCommand,accounts:readonly FinanceAccount[]=seedFinanceAccounts):PartyPreviewState {
 if(command.type==='import-party-batch'){commitPartyImportBatch(command.plan);return state;}
  let parties=state.parties;
  let sources=state.sources;
  let targetPartyId='';
  let sourceId:string|undefined;
  let before:unknown;
  let after:unknown;
  const findParty=(id:string)=> {
    const party=parties.find(p=>p.id===id);
    if(!party)throw new Error('Party not found.');
    return party;
  };
  const applyOpening=(payload:PartyOpeningPayload)=>{
    const p=findParty(payload.partyId);
    validateOpening(payload,p,sources);
    const previous=sources.filter(row=>row.partyId===p.id&&row.relationship===payload.relationship
      &&row.status==='Active'&&isPartyOpening(row));
    const old=previous.length?[...previous]:undefined;
    sources=sources.map(row=>previous.some(o=>o.id===row.id)?{...row,status:'Reversed' as const}:row);
    const id='party-opening:'+(++counter);
    const newSource=toPaisa(payload.amount,'Opening balance')===0?undefined
      :makeOpeningSource(payload,Math.max(0,...sources.map(row=>row.sequence))+1,id);
    if(newSource)sources=[...sources,newSource];
    // Opening changes are backdated: recheck all later verified refunds
    // before changing the observable snapshot.
    if(payload.relationship==='Customer')customerSettlementAsOf(sources,p.id,businessToday());
    if(payload.relationship==='Supplier')supplierSettlementAsOf(sources,p.id,businessToday());
    targetPartyId=p.id;sourceId=newSource?.id??previous[0]?.id;
    before=old;after=newSource??{cleared:true,partyId:p.id,relationship:payload.relationship};
  };
  if(command.type==='create-party'){
    const party=addParty(command.party,parties);
    parties=[...parties,party];
    targetPartyId=party.id;after=party;
    if(command.openings?.length){
      const relationships=new Set<string>();
      for(const opening of command.openings){
        if(relationships.has(opening.relationship))throw new Error('Only one opening per relationship.');
        relationships.add(opening.relationship);
        applyOpening({...opening,partyId:party.id});
      }
      after={party,openings:sources.filter(row=>row.partyId===party.id&&isPartyOpening(row))};
      sourceId=undefined;targetPartyId=party.id;
    }
  } else if(command.type==='import-parties'){
    const additions:Party[]=[];
    for(const draft of command.parties) additions.push(addParty(draft,[...parties,...additions]));
    if(!additions.length)throw new Error('No parties to import.');
    parties=[...parties,...additions];
    targetPartyId=additions[0].id;after=additions;
  } else if(command.type==='update-party'){
    const party=findParty(command.id);
    const patch={...party,...command.patch,id:party.id};
    const errors=validatePartyDraft(patch,parties,party.id);
    if(errors.length)throw new Error(errors.join(' '));
    before=party;
    after={...patch,name:patch.name.trim(),phone:patch.phone.trim(),area:patch.area.trim(),roles:[...patch.roles]};
    parties=parties.map(p=>p.id===party.id?after as Party:p);
    targetPartyId=party.id;
    if(command.openings?.length){
      const roleSet=new Set<string>();
      for(const opening of command.openings){
        if(roleSet.has(opening.relationship))throw new Error('Only one opening per relationship.');
        roleSet.add(opening.relationship);
        applyOpening({...opening,partyId:party.id});
      }
      after={party:parties.find(p=>p.id===party.id),openings:command.openings};
      targetPartyId=party.id;sourceId=undefined;
    }
  } else if(command.type==='deactivate-party'){
    const party=findParty(command.id);
    if(sources.some(s=>s.partyId===party.id&&s.status==='Active'&&s.kind!=='note'))throw new Error('Cannot deactivate a party with linked transactions.');
    before=party;after={...party,status:'Inactive' as const};
    parties=parties.map(p=>p.id===party.id?after as Party:p);
    targetPartyId=party.id;
  } else if(command.type==='set-opening'){
    applyOpening(command.payload);
  } else if(command.type==='record-finance'){
    const payload=command.payload;
    const party=findParty(payload.partyId);
    const meta=financeTypeMeta[payload.financeType];
    if(!meta||meta.role!==payload.relationship||!party.roles.includes(meta.role))
      throw new Error('Finance type does not match the selected party role or relationship.');
    if(party.status==='Inactive')throw new Error('Inactive party cannot record finance transactions.');
    validateBusinessDate(payload.date);
    if(toPaisa(payload.amount,'Finance amount')<=0)throw new Error('Finance amount must be positive.');
    if(meta.opening){
      if(activePartyOpening(sources,payload.partyId,meta.role))throw new Error('An opening balance already exists; use Edit opening balance.');
      if(payload.splits.length)throw new Error('Opening finance balance must not move any money account.');
    }else validatePartySplits(payload.splits,payload.amount);
    if(payload.operationId&&!/^[A-Za-z0-9_-]{4,100}$/.test(payload.operationId))
      throw new Error('Invalid operation ID.');
    const id='party-finance:'+(payload.operationId??(++counter).toString());
    if(sources.some(row=>row.id===id))throw new Error('Duplicate finance operation.');
    const amount=payload.amount;
    const source:PartySourceRecord={
      id,partyId:party.id,relationship:meta.role,kind:'finance',financeType:payload.financeType,
      date:payload.date,sequence:Math.max(0,...sources.map(row=>row.sequence))+1,
      reference:payload.reference?.trim()||id.toUpperCase(),
      description:payload.financeType+(payload.note?.trim()?' · '+payload.note.trim():''),
      debit:meta.entry==='debit'?amount:0,credit:meta.entry==='credit'?amount:0,
      amountPaid:meta.opening?0:amount,
      paymentSplits:payload.splits.map(split=>({...split})),
      method:meta.opening?undefined:payload.splits.length===1?payload.splits[0].method:'Multiple',
      accountId:meta.opening?undefined:payload.splits.length===1?payload.splits[0].accountId:undefined,
      provenance:'verified',status:'Active'
    };
    sources=[...sources,source];targetPartyId=party.id;sourceId=id;after=source;
  } else if(command.type==='record-payment'||command.type==='refund-credit'){
    const isRefund=command.type==='refund-credit';
    const payload=command.payload;
    if(isRefund)validatePartyRefund(payload as PartyRefundPayload);
    else validatePartyPayment(payload as PartyPaymentPayload,accounts);
    const party=findParty(payload.partyId);
    if(!party.roles.includes(payload.relationship))throw new Error('Party does not have the selected relationship.');
    if(party.status==='Inactive')throw new Error('Inactive party cannot receive new transactions.');
    const current=payload.relationship==='Customer'
      ? customerSettlementAsOf(sources,party.id,payload.date)
      : supplierSettlementAsOf(sources,party.id,payload.date);
    const total=payload.amount;
    if(isRefund)validateCustomerRefund(current,{amount:total});
    else {
      validateCustomerPayment(current,{amount:total,discount:(payload as PartyPaymentPayload).discount,
        reason:(payload as PartyPaymentPayload).reason});
      assertCounterInvoiceAllocation(sources,payload as PartyPaymentPayload);
    }
    const op=payload.operationId;
    if(op&&!/^[a-zA-Z0-9_-]{4,100}$/.test(op))throw new Error('Invalid operation ID.');
    const id=(isRefund?'party-refund:':'party-payment:')+(op??(++counter).toString());
    if(sources.some(row=>row.id===id))throw new Error('Duplicate payment operation; already recorded.');
    const discount=isRefund?0:(payload as PartyPaymentPayload).discount??0;
    const kind=isRefund
      ? (payload.relationship==='Customer'?'customer-credit-refund':'supplier-credit-refund')
      : (payload.relationship==='Customer'?'customer-payment':'supplier-payment');
    const debit=payload.relationship==='Customer'
      ? (isRefund?total:0)
      : (isRefund?0:total+discount);
    const credit=payload.relationship==='Customer'
      ? (isRefund?0:total+discount)
      : (isRefund?total:0);
    const source:PartySourceRecord={
      id,partyId:party.id,relationship:payload.relationship,kind,date:payload.date,
      sequence:Math.max(0,...sources.map(row=>row.sequence))+1,
      reference:id.replace('party-','').toUpperCase(),
      description:(isRefund?'Credit refunded':!total&&discount?'Discount / settlement recorded':'Payment recorded')+' · '+party.name+
        (payload.reason?.trim()?' · '+payload.reason.trim():''),
      debit,credit,amountPaid:total,discount,provenance:'verified',
      invoiceId:!isRefund?(payload as PartyPaymentPayload).invoiceId:undefined,
      paymentSplits:payload.splits.map(row=>({...row})),
      method:payload.splits.length===1?payload.splits[0].method:payload.splits.length?'Multiple':discount?'Settlement':undefined,
      accountId:payload.splits.length===1?payload.splits[0].accountId:undefined,
      status:'Active'
    };
    const proposed=[...sources,source];
    // Replay all later events after back-dated actions. A previously valid
    // refund must never become unfunded because a source changed earlier in time.
    if(payload.relationship==='Customer')customerSettlementAsOf(proposed,party.id,businessToday());
    else supplierSettlementAsOf(proposed,party.id,businessToday());
    sources=proposed;targetPartyId=party.id;sourceId=id;after=source;
  } else if(command.type==='edit-source-payment'||command.type==='reverse-source'){
    const original=sources.find(row=>row.id===command.sourceId);
    if(!original)throw new Error('Original source record was not found.');
    if(original.status!=='Active')throw new Error('Source is already reversed or inactive.');
    // Only preview-created payment/refund sources may be changed here; Sales,
    // Purchases and legacy opening records have their own source editors.
    if(!/^party-(payment|refund|finance):/.test(original.id)||
      !['customer-payment','supplier-payment','customer-credit-refund','supplier-credit-refund','finance'].includes(original.kind))
      throw new Error('Original source action is not allowed from the Party preview.');
    if(!command.reason.trim())throw new Error('An audit reason is required.');
    let updated:PartySourceRecord;
    if(command.type==='reverse-source') {
      updated={...original,status:'Reversed'};
    }else{
      if(original.kind!=='customer-payment'&&original.kind!=='supplier-payment')
        throw new Error('Refund edits require a dedicated source workflow. Reverse and re-record if permitted.');
      validatePartyPayment(command.payload,accounts);
      if(command.payload.partyId!==original.partyId||command.payload.relationship!==original.relationship)
        throw new Error('Changing source party or relationship is not allowed.');
      const amount=command.payload.amount;
      const discount=command.payload.discount??0;
      assertCounterInvoiceAllocation(sources.filter(row=>row.id!==original.id),command.payload);
      updated={...original,date:command.payload.date,amountPaid:amount,discount,
        debit:original.relationship==='Customer'?0:amount+discount,
        credit:original.relationship==='Customer'?amount+discount:0,
        invoiceId:command.payload.invoiceId,
        paymentSplits:command.payload.splits.map(row=>({...row})),
        method:command.payload.splits.length===1?command.payload.splits[0].method:'Multiple',
        accountId:command.payload.splits.length===1?command.payload.splits[0].accountId:undefined,
        description:'Corrected preview payment · '+command.reason.trim()};
    }
    const proposed=sources.map(row=>row.id===original.id?updated:row);
    // Revalidate dependent refunds and advances after correction, not only
    // the targeted amount. Refuse edits that would bankrupt a later refund.
    if(original.relationship==='Customer')customerSettlementAsOf(proposed,original.partyId,businessToday());
    else supplierSettlementAsOf(proposed,original.partyId,businessToday());
    sources=proposed;targetPartyId=original.partyId;sourceId=original.id;
    before=original;after=updated;
  } else if(command.type==='add-note'){
    const noteParty=findParty(command.partyId);
    if(command.relationship&&!noteParty.roles.includes(command.relationship))throw new Error('Party does not have this relationship.');
    const description=checkedText(command.text,'Note');
    const note:PartySourceRecord={id:'note-preview-'+(++counter),partyId:command.partyId,
      relationship:command.relationship??noteParty.roles[0],kind:'note',date:businessToday(),
      sequence:Math.max(0,...sources.map(s=>s.sequence))+1,description,debit:0,credit:0,status:'Active'};
    sources=[...sources,note];targetPartyId=command.partyId;sourceId=note.id;after=note;
  } else if(command.type==='edit-note'||command.type==='delete-note'){
    const note=sources.find(s=>s.id===command.sourceId&&s.kind==='note'&&s.status==='Active');
    if(!note)throw new Error('Active note not found.');
    before=note;
    const updated:PartySourceRecord=command.type==='edit-note'
      ? {...note,description:checkedText(command.text,'Note')}
      : {...note,status:'Deleted'};
    after=updated;sources=sources.map(s=>s.id===note.id?updated:s);
    targetPartyId=note.partyId;sourceId=note.id;
  } else {
    throw new Error('Unsupported preview action.');
  }
  const updated:PartyPreviewState={parties,sources,revision:state.revision+1,
    audit:[...state.audit,{id:'audit-preview-'+(++counter),partyId:targetPartyId,sourceId,
      action:command.type,before,after,actor:'Preview user',at:new Date().toISOString(),
      reason:command.type==='set-opening'?command.payload.note:undefined}]};
  state=updated;
  listeners.forEach(listener=>listener());
  return updated;
}
