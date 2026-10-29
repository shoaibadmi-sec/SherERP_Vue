import type {Party,PartyRole} from '../types/erp.ts';
import type {PartyDraft,PartyOpeningPayload,PartyPreviewState} from '../types/partyLedger.ts';
import type {ImportIssue,StagedImportRow} from './importTypes.ts';
import {validatePartyDraft} from '../utils/partyIdentity.ts';
import {activePartyOpening,validateOpening} from '../utils/partyOpening.ts';

export type PartyImportTarget='customer'|'supplier';
export type PartyImportChange=
 | {action:'create';sourceRow:number;sourceSheet:string;draft:PartyDraft;
    opening?:Omit<PartyOpeningPayload,'partyId'>;confirmedSeparateFrom?:string}
 | {action:'add-role';sourceRow:number;sourceSheet:string;partyId:string;role:'Customer'|'Supplier';
    opening?:Omit<PartyOpeningPayload,'partyId'>};
export type PartyImportPlan={sessionId:string;baseRevision:number;target:PartyImportTarget;
 changes:PartyImportChange[];issues:ImportIssue[];skipped:number};
const trim=(v:unknown)=>v===null||v===undefined?'':String(v).trim();
const normalizePhone=(v:string)=>v.replace(/[\s()-]/g,'');
const err=(sourceRow:number,field:string,message:string):ImportIssue=>({sourceRow,field,severity:'error',message});
function parsedDate(raw:unknown):string{
 const date=raw instanceof Date?raw.toISOString().slice(0,10):trim(raw);
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(Date.parse(date+'T12:00:00Z'))||
    new Date(date+'T12:00:00Z').toISOString().slice(0,10)!==date)throw new Error('Enter a real YYYY-MM-DD opening date.');
 return date;
}
/** Identity is matched only by a strong explicit ID or suggestive phone; names never silently merge. */
export function resolvePartyImportDecisions(
 rows:readonly StagedImportRow[],target:PartyImportTarget,state:PartyPreviewState
):StagedImportRow[]{
 const role:PartyRole=target==='customer'?'Customer':'Supplier';
 const phones=new Map<string,Party[]>();
 for(const party of state.parties){
  const phone=normalizePhone(party.phone);if(phone)phones.set(phone,[...(phones.get(phone)??[]),party]);
 }
 const seenIds=new Set<string>(),seenPhones=new Set<string>();
 return rows.map(row=>{
  const issues=row.issues.filter(issue=>issue.field!=='party'&&issue.field!=='identity');
  const providedId=trim(row.mapped.partyId);
  const phone=typeof row.mapped.phone==='number'?'':normalizePhone(trim(row.mapped.phone));
  const priorId=providedId&&seenIds.has(providedId);
  const priorPhone=phone&&seenPhones.has(phone);
  if(providedId)seenIds.add(providedId);
  if(phone)seenPhones.add(phone);
  const strong=providedId?state.parties.find(p=>p.id===providedId):undefined;
  const likely=!providedId&&phone?phones.get(phone)??[]:[];
  const candidate=strong??(likely.length===1?likely[0]:undefined);
  let decision=row.decision,match:StagedImportRow['match'];
  if(providedId&&!strong){
   issues.push(err(row.sourceRow,'identity','Party ID was not found. Correct the ID or clear it.'));
   decision=row.decision==='skip'?'skip':'reject';
  }else if(priorId||priorPhone){
   issues.push({sourceRow:row.sourceRow,field:'identity',severity:'warning',message:'Repeated Party ID/phone in this file; skipped to prevent duplicate identities.'});
   decision='skip';
  }else if(likely.length>1){
   issues.push(err(row.sourceRow,'identity','Phone matches multiple Parties. Enter the exact Party ID or correct the phone.'));
   decision=row.decision==='skip'?'skip':'reject';
  }else if(candidate){
   match={kind:strong?'strong':'suggested',existingId:candidate.id,label:candidate.name,hasRole:candidate.roles.includes(role)};
   const changedMatch=row.match?.existingId!==candidate.id;
   if(changedMatch||(row.decision!=='add-role'&&row.decision!=='create'&&row.decision!=='skip'))decision='skip';
   if(candidate.roles.includes(role)&&decision==='add-role')decision='skip';
   if(strong&&decision==='create')decision='skip';
   // Initial rows are always create; matched identities must never auto-merge.
   if(!row.match&&row.decision==='create')decision='skip';
   issues.push({sourceRow:row.sourceRow,field:'identity',severity:'warning',message:
    (strong?'Party ID confirmed: ':'Possible phone match: ')+candidate.name+' · '+(candidate.roles.includes(role)?'relationship already exists':'choose Add role or explicitly Create separately')});
  }else {
   match=undefined;
   if(row.decision==='add-role'||(row.decision==='skip'&&row.match))decision='create';
   if(row.decision==='reject'&&!providedId)decision='create';
  }
  return {...row,decision,match,issues};
 });
}
export function planPartyImport(
 rows:readonly StagedImportRow[],target:PartyImportTarget,existing:PartyPreviewState,
 options:{sessionId:string;today:string}
):PartyImportPlan{
 const role=target==='customer'?'Customer':'Supplier';
 const plan:PartyImportPlan={sessionId:options.sessionId,baseRevision:existing.revision,target,changes:[],issues:[],skipped:0};
 const seen=new Set<string>(),stagedParties=[...existing.parties];
 for(const row of rows){
  if(row.decision==='skip'||row.decision==='reject'){plan.skipped++;continue;}
  if(row.issues.some(issue=>issue.severity==='error')){
   plan.issues.push(...row.issues.filter(issue=>issue.severity==='error'));continue;
  }
  try {
   const name=trim(row.mapped.name),nameBn=trim(row.mapped.nameBn);
   const rawPhone=row.mapped.phone;
   if(typeof rawPhone==='number')throw new Error('Excel numeric phone may have lost a leading zero. Enter the complete number as text, e.g. 017...');
   const phone=trim(rawPhone),area=trim(row.mapped.area),partyId=trim(row.mapped.partyId);
   const normalized=normalizePhone(phone);
   if(/^1[3-9]\d{8}$/.test(normalized))throw new Error('Bangladesh mobile appears to be missing its leading 0. Enter 01... as literal text.');
   const sameFileKey=partyId?'id:'+partyId:normalized?'phone:'+normalized:'row:'+row.sourceRow;
   if(seen.has(sameFileKey))throw new Error('Duplicate identity in the same import file.');
   seen.add(sameFileKey);
   if(phone&&!/^[\d\s+()-]{3,30}$/.test(phone))throw new Error('Invalid phone format; preserve the original leading zero.');
   const matched=partyId?existing.parties.find(p=>p.id===partyId):
     normalized?existing.parties.filter(p=>normalizePhone(p.phone)===normalized):[];
   const candidate=Array.isArray(matched)?matched.length===1?matched[0]:undefined:matched;
   if(partyId&&!candidate)throw new Error('Party ID not found.');
   if(!partyId&&normalized&&Array.isArray(matched)&&matched.length>1)throw new Error('Phone matches several Parties; specify Party ID.');
   if(row.decision==='add-role'){
    if(!candidate||row.match?.existingId!==candidate.id)throw new Error('Add Role requires an explicitly selected matching Party.');
    if(candidate.roles.includes(role))throw new Error(role+' role is already assigned.');
   }else if(row.decision==='create'){
    if(partyId)throw new Error('Cannot create separately using an existing Party ID.');
    if(candidate&&row.match?.existingId!==candidate.id)throw new Error('Creating a separate Party with a matched phone requires explicit confirmation.');
   }else throw new Error('Unsupported Party import decision.');
   const amountRaw=trim(row.mapped.openingAmount);
   if(amountRaw&&!/^(?:\d+(?:\.\d{1,2})?|\.\d{1,2})$/.test(amountRaw))throw new Error('Opening amount must be nonnegative with at most two decimals.');
   const amount=amountRaw?Number(amountRaw):0;
   if(!Number.isFinite(amount)||!Number.isSafeInteger(Math.round(amount*100)))throw new Error('Invalid opening amount.');
   const sideText=trim(row.mapped.openingDirection).toUpperCase();
   const dateRaw=row.mapped.openingDate;
   const note=trim(row.mapped.openingNote);
   let opening:Omit<PartyOpeningPayload,'partyId'>|undefined;
   if(amount>0){
    if(!['DR','CR'].includes(sideText))throw new Error('Choose Dr or Cr for a nonzero opening.');
    const date=parsedDate(dateRaw);
    if(date>options.today)throw new Error('Opening date cannot be in the future.');
    opening={relationship:role,date,amount,side:sideText==='DR'?'debit':'credit',note};
   }else if(sideText||trim(dateRaw)||note) {
    throw new Error('Opening direction/date/note requires a positive opening amount.');
   }
   if(row.decision==='add-role'){
    const party=candidate!;
    if(opening){
     if(activePartyOpening(existing.sources,party.id,role))throw new Error('An active opening balance already exists for '+role+'.');
     validateOpening({...opening,partyId:party.id},{...party,roles:[...party.roles,role]},existing.sources);
    }
    plan.changes.push({action:'add-role',sourceRow:row.sourceRow,sourceSheet:row.sourceSheet,
      partyId:party.id,role,opening});
   }else{
    const draft:PartyDraft={name,nameBn,phone,area,roles:[role]};
    const problems=validatePartyDraft(draft,stagedParties);
    if(problems.length)throw new Error(problems.join(' '));
    const tempParty:Party={id:'import-preview-'+row.sourceRow,name,phone,area,
      nameBn,roles:[role],balance:0,lastActivity:'Preview',avatarColor:'#0D7C74',status:'Active'};
    if(opening)validateOpening({...opening,partyId:tempParty.id},tempParty,existing.sources);
    stagedParties.push(tempParty);
    plan.changes.push({action:'create',sourceRow:row.sourceRow,sourceSheet:row.sourceSheet,
      draft,opening,confirmedSeparateFrom:candidate?.id});
   }
  }catch(e){plan.issues.push(err(row.sourceRow,'party',e instanceof Error?e.message:'Invalid Party row.'));}
 }
 return plan;
}
