import type {PreviewInstallmentAgreement} from '../data/installmentPreviewStore.ts';
import type {InstallmentPaymentPreviewEvent} from './collections.ts';
import {validateScheduleRows,type InstallmentScheduleRow} from './schedule.ts';

type AuditBase={id:string;agreementId:string;operationId:string;actorId:string;reason:string;
 effectiveDate:string;revision:number;sequence:number;sourceSequence?:number;requestSignature?:string};
export type ScheduleRevisionPreview=AuditBase&{type:'schedule-revision';
 beforeRows:InstallmentScheduleRow[];afterRows:InstallmentScheduleRow[];
 requestSignature?:string};
export type AgreementReductionPreview=AuditBase&{type:'agreement-reduction';amountPaisa:number};
export type ReturnAdjustmentPreview=AuditBase&{type:'return-adjustment';lineKey:string;
 returnedBaseQuantity:number;amountPaisa:number;disposition:'Pending refund/credit'|'Adjust due'};
export type ReceiptReversalPreview=AuditBase&{type:'receipt-reversal';sourceReceiptId:string};
export type InstallmentLifecycleEvent=ScheduleRevisionPreview|AgreementReductionPreview|
 ReturnAdjustmentPreview|ReceiptReversalPreview;
export type LifecycleRow={id:string;dueDate:string;amountPaisa:number;paidPaisa:number;
 reducedPaisa:number;outstandingPaisa:number;
 status:'Paid'|'Partial'|'Upcoming'|'Due'|'Overdue'};
export type InstallmentLifecycleProjection={
 rows:LifecycleRow[];totalOutstandingPaisa:number;dueTodayPaisa:number;overduePaisa:number;
 surplusPaisa:number;status:'Active'|'Fully paid'|'Surplus pending';revision:number;
 audit:InstallmentLifecycleEvent[];
};
type WorkRow=Omit<LifecycleRow,'status'|'outstandingPaisa'>;
const asDate=(s:string)=>{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(s)||new Date(s+'T12:00:00Z').toISOString().slice(0,10)!==s)
  throw new Error('Choose a valid business date.');
 return s;
};
const paisa=(n:number,label:string)=>{
 if(!Number.isSafeInteger(n)||n<0)throw new Error(label+' must be nonnegative integer paisa.');
 return n;
};
const outstanding=(row:WorkRow)=>row.amountPaisa-row.paidPaisa-row.reducedPaisa;
const rowsFrom=(rows:readonly InstallmentScheduleRow[]):WorkRow[]=>
 rows.map(r=>({id:r.id,dueDate:r.dueDate,amountPaisa:r.amountPaisa,
  paidPaisa:0,reducedPaisa:0}));
const sum=(nums:readonly number[])=>nums.reduce((a,b)=>a+b,0);
function checkAudit(e:InstallmentLifecycleEvent,agreementId:string,seen:Set<string>,revision:number){
 if(e.agreementId!==agreementId)throw new Error('Lifecycle event belongs to another agreement.');
 if(!e.id.trim()||!e.operationId.trim()||seen.has(e.id)||seen.has(e.operationId))
  throw new Error('Duplicate lifecycle event or operation.');
 seen.add(e.id);seen.add(e.operationId);
 if(!e.actorId.trim()||!e.reason.trim()||e.reason.trim().length<3)
  throw new Error('Lifecycle event needs an actor and audit reason.');
 asDate(e.effectiveDate);
 if(!Number.isSafeInteger(e.revision)||e.revision!==revision+1)
  throw new Error('Lifecycle event has a stale revision number.');
}
function applyRevision(rows:WorkRow[],event:ScheduleRevisionPreview):WorkRow[]{
 if(validateScheduleRows(event.beforeRows).length||validateScheduleRows(event.afterRows).length)
  throw new Error('Schedule revision contains invalid dates or amounts.');
 const before=event.beforeRows;
 if(before.length!==rows.length||before.some((r,i)=>r.id!==rows[i].id||
  r.dueDate!==rows[i].dueDate||r.amountPaisa!==rows[i].amountPaisa))
  throw new Error('Schedule revision no longer matches current source version.');
 if(sum(before.map(r=>r.amountPaisa))!==sum(event.afterRows.map(r=>r.amountPaisa)))
  throw new Error('Schedule revision cannot change the original obligation.');
 const byId=new Map(rows.map(r=>[r.id,r]));
 for(const prior of rows){
  const next=event.afterRows.find(r=>r.id===prior.id);
  if(prior.paidPaisa>0){
   if(!next||next.dueDate!==prior.dueDate||next.amountPaisa<prior.paidPaisa)
    throw new Error('Paid installment amount and due date cannot be changed.');
   if(next.amountPaisa!==prior.amountPaisa&&next.amountPaisa!==prior.paidPaisa)
    throw new Error('Partial payment carry must retain only the already paid portion.');
  }
  if(prior.reducedPaisa>0&&(!next||next.amountPaisa<prior.paidPaisa+prior.reducedPaisa))
   throw new Error('Reduced installment history cannot be erased.');
 }
 const out=event.afterRows.map(row=>{
  const previous=byId.get(row.id);
  return {id:row.id,dueDate:row.dueDate,amountPaisa:row.amountPaisa,
   paidPaisa:previous?.paidPaisa??0,reducedPaisa:previous?.reducedPaisa??0};
 });
 if(out.some(r=>outstanding(r)<0)||sum(out.map(outstanding))!==sum(rows.map(outstanding)))
  throw new Error('Revised unpaid amounts do not reconcile to the original schedule.');
 return out;
}
/** Replay immutable invoice and receipt evidence by business date; no actual books are posted. */
export function projectInstallmentLifecycle(
 agreement:PreviewInstallmentAgreement,
 receipts:readonly InstallmentPaymentPreviewEvent[],
 events:readonly InstallmentLifecycleEvent[],asOf:string
):InstallmentLifecycleProjection{
 asDate(asOf);
 const problems=validateScheduleRows(agreement.schedule);
 if(problems.length)throw new Error(problems[0]);
 if(sum(agreement.schedule.map(r=>r.amountPaisa))!==paisa(agreement.totalPaisa,'Total')-
     paisa(agreement.downPaymentPaisa,'Down payment'))
  throw new Error('Original invoice and payment schedule do not reconcile.');
 const eventIds=new Set<string>(), operations=new Set<string>();
 for(const e of events){
  if(e.agreementId!==agreement.id)throw new Error('Lifecycle event belongs to another agreement.');
  if(eventIds.has(e.id)||operations.has(e.operationId))
   throw new Error('Duplicate lifecycle event.');
  eventIds.add(e.id);operations.add(e.operationId);
  asDate(e.effectiveDate);
 }
 const activeEvents=events.filter(e=>e.effectiveDate<=asOf).sort((a,b)=>
  a.effectiveDate.localeCompare(b.effectiveDate)||a.sequence-b.sequence);
 const activeReceipts=receipts.filter(r=>r.date<=asOf);
 const ordered=[
  ...activeEvents.map(e=>({date:e.effectiveDate,order:e.sourceSequence??(100000+e.sequence),
   type:'lifecycle' as const,event:e})),
  ...activeReceipts.map((r,i)=>({date:r.date,order:r.sourceSequence??(-100000+i),
   type:'receipt' as const,event:r}))
 ].sort((a,b)=>a.date.localeCompare(b.date)||a.order-b.order);
 let rows=rowsFrom(agreement.schedule),surplus=0,revision=0;
 const seen=new Set<string>(),applied=new Map<string,InstallmentPaymentPreviewEvent>();
 const audit:InstallmentLifecycleEvent[]=[];
 for(const item of ordered){
  if(item.type==='receipt'){
   const receipt=item.event;
   if(receipt.agreementId!==agreement.id)throw new Error('Receipt belongs to another agreement.');
   if(applied.has(receipt.id))throw new Error('Duplicate receipt.');
   let allocated=0;
   for(const part of receipt.allocations){
    const row=rows.find(r=>r.id===part.scheduleItemId);
    if(!row)throw new Error('Receipt allocation refers to an unknown schedule line.');
    const amount=paisa(part.amountPaisa,'Receipt allocation');
    if(amount<=0||amount>outstanding(row))throw new Error('Receipt allocation exceeds outstanding.');
    row.paidPaisa+=amount;allocated+=amount;
   }
   if(allocated!==paisa(receipt.amountPaisa,'Receipt total'))
    throw new Error('Receipt does not reconcile to allocation.');
   applied.set(receipt.id,receipt);
   continue;
  }
  const event=item.event;
  checkAudit(event,agreement.id,seen,revision);
  if(event.type==='schedule-revision')rows=applyRevision(rows,event);
  else if(event.type==='receipt-reversal'){
   const source=applied.get(event.sourceReceiptId);
   if(!source)throw new Error('Receipt reversal source is missing or not yet applied.');
   for(const part of source.allocations){
    const row=rows.find(r=>r.id===part.scheduleItemId);
    if(!row||row.paidPaisa<part.amountPaisa)
     throw new Error('Receipt reversal conflicts with a later schedule revision.');
    row.paidPaisa-=part.amountPaisa;
    if(outstanding(row)<0)throw new Error('Reversal conflicts with a previous reduction.');
   }
   applied.delete(source.id);
  }else{
   let amount=paisa(event.amountPaisa,'Authorized reduction');
   if(amount===0)throw new Error('Reduction must be positive.');
   for(const row of rows){
    const appliedToRow=Math.min(amount,outstanding(row));
    row.reducedPaisa+=appliedToRow;amount-=appliedToRow;
    if(!amount)break;
   }
   surplus+=amount;
  }
  revision=event.revision;
  audit.push(structuredClone(event));
 }
 const result=rows.map((row):LifecycleRow=>{
  const remaining=outstanding(row);
  return {...row,outstandingPaisa:remaining,status:remaining===0?'Paid':
   row.dueDate<asOf?'Overdue':row.dueDate===asOf?'Due':
   row.paidPaisa>0?'Partial':'Upcoming'};
 });
 const due=sum(result.filter(r=>r.dueDate<=asOf).map(r=>r.outstandingPaisa));
 const overdue=sum(result.filter(r=>r.dueDate<asOf).map(r=>r.outstandingPaisa));
 const total=sum(result.map(r=>r.outstandingPaisa));
 return {rows:result,totalOutstandingPaisa:total,dueTodayPaisa:due,
  overduePaisa:overdue,surplusPaisa:surplus,status:surplus?'Surplus pending':
  total?'Active':'Fully paid',revision,audit};
}


/**
 * Allocate new collections against the currently effective, versioned agreement
 * schedule rather than the original POS installments. Includes partial successor
 * rows and prior reductions; does not mutate historical receipt allocations.
 */
export function allocateOldestLifecycleInstallments(
 agreement:PreviewInstallmentAgreement,
 receipts:readonly InstallmentPaymentPreviewEvent[],
 events:readonly InstallmentLifecycleEvent[],
 amountPaisa:number,asOf:string
):{scheduleItemId:string;amountPaisa:number}[]{
 if(!Number.isSafeInteger(amountPaisa)||amountPaisa<=0)
  throw new Error('Payment must be positive whole paisa.');
 const projection=projectInstallmentLifecycle(agreement,receipts,events,asOf);
 if(amountPaisa>projection.totalOutstandingPaisa)
  throw new Error('Payment exceeds current agreement outstanding balance.');
 const allocations:{scheduleItemId:string;amountPaisa:number}[]=[];
 let remaining=amountPaisa;
 for(const row of projection.rows){
  if(remaining===0)break;
  const take=Math.min(remaining,row.outstandingPaisa);
  if(take>0)allocations.push({scheduleItemId:row.id,amountPaisa:take});
  remaining-=take;
 }
 if(remaining!==0)throw new Error('Payment cannot be allocated to current schedule.');
 return allocations;
}
