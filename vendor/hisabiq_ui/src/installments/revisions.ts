import {businessToday} from '../utils/dateRange.ts';
import {
 getInstallmentPreview,listInstallmentReceipts,listInstallmentLifecycleEvents,
 appendInstallmentLifecycleEvent
} from '../data/installmentPreviewStore.ts';
import {projectInstallmentLifecycle,type ScheduleRevisionPreview} from './lifecycle.ts';
import {validateScheduleRows,type InstallmentScheduleRow} from './schedule.ts';

export type ScheduleRevisionInput={
 agreementId:string;baseRevision:number;operationId:string;actorId:string;
 reason:string;effectiveDate:string;nextUnpaidRows:InstallmentScheduleRow[];
};
const money=(amount:number)=>Number.isSafeInteger(amount)&&amount>=0;
const sum=(rows:readonly {amountPaisa:number}[])=>rows.reduce((n,r)=>n+r.amountPaisa,0);
const key=(input:ScheduleRevisionInput)=>JSON.stringify(input);
const businessDate=(date:string)=>{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw new Error('Revision date is invalid.');
 const parsed=new Date(date+'T12:00:00Z');
 if(!Number.isFinite(parsed.getTime())||parsed.toISOString().slice(0,10)!==date||date>businessToday())
  throw new Error('Revision date cannot be invalid or in the future.');
 return date;
};
/** Prepare before/after snapshots without changing an agreement, receipt or event. */
export function previewScheduleRevision(input:ScheduleRevisionInput):ScheduleRevisionPreview{
 const agreement=getInstallmentPreview(input.agreementId);
 if(!agreement)throw new Error('Installment agreement not found.');
 if(!input.actorId?.trim())throw new Error('Actor identity is required.');
 if(!input.reason?.trim()||input.reason.trim().length<3)throw new Error('Audit reason is required.');
 if(!input.operationId?.trim())throw new Error('Operation ID is required.');
 businessDate(input.effectiveDate);
 const previous=listInstallmentLifecycleEvents(input.agreementId);
 const current=projectInstallmentLifecycle(agreement,listInstallmentReceipts(agreement.id),previous,businessToday());
 if(!Number.isSafeInteger(input.baseRevision)||current.revision!==input.baseRevision)
  throw new Error('Stale installment schedule revision.');
 if(!input.nextUnpaidRows.length||validateScheduleRows(input.nextUnpaidRows).length)
  throw new Error('Unpaid installment rows contain a duplicate or invalid amount or date.');
 if(input.nextUnpaidRows.some(r=>!money(r.amountPaisa)||r.amountPaisa<=0))
  throw new Error('Unpaid installment amounts must be positive.');
 const anchors=current.rows.filter(r=>r.paidPaisa>0||r.reducedPaisa>0);
 const anchorsIds=new Set(anchors.map(r=>r.id));
 if(input.nextUnpaidRows.some(row=>anchorsIds.has(row.id)))
  throw new Error('Cannot edit paid installment anchor or reuse its ID.');
 if(sum(input.nextUnpaidRows)!==current.totalOutstandingPaisa)
  throw new Error('New schedule does not reconcile to the unpaid total.');
 const prior=current.rows.map(row=>({
  id:row.id,dueDate:row.dueDate,amountPaisa:row.amountPaisa,
  editedAmount:false,editedDate:false
 }));
 const kept=anchors.map(row=>({
  id:row.id,dueDate:row.dueDate,amountPaisa:row.paidPaisa+row.reducedPaisa,
  editedAmount:true,editedDate:false
 }));
 const after=[...kept,...input.nextUnpaidRows.map(row=>({...row}))].sort((a,b)=>
  a.dueDate.localeCompare(b.dueDate)||a.id.localeCompare(b.id));
 const problems=validateScheduleRows(after);
 if(problems.length)throw new Error('Invalid revised schedule: '+problems[0]);
 if(sum(after)!==sum(prior))
  throw new Error('Schedule revision changes the original invoice obligation.');
 return {
  type:'schedule-revision',id:'installment-revision:'+agreement.id+':'+(current.revision+1),
  agreementId:agreement.id,operationId:input.operationId,
  actorId:input.actorId.trim(),reason:input.reason.trim(),effectiveDate:input.effectiveDate,
  revision:current.revision+1,sequence:current.revision+1,
  beforeRows:prior,afterRows:after,requestSignature:key(input)
 };
}
export function recordScheduleRevisionPreview(input:ScheduleRevisionInput):ScheduleRevisionPreview{
 const stored=listInstallmentLifecycleEvents(input.agreementId).find(e=>e.operationId===input.operationId);
 if(stored){
  if(stored.type!=='schedule-revision'||stored.requestSignature!==key(input))
   throw new Error('Operation ID already used for a different revision.');
  return structuredClone(stored);
 }
 const prepared=previewScheduleRevision(input);
 return appendInstallmentLifecycleEvent(prepared) as ScheduleRevisionPreview;
}
export function listInstallmentRevisions(agreementId:string):ScheduleRevisionPreview[]{
 return listInstallmentLifecycleEvents(agreementId)
  .filter((e):e is ScheduleRevisionPreview=>e.type==='schedule-revision');
}
