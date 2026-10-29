import type {InstallmentHistoricalLine} from '../installments/historicalLines.ts';
import type {InstallmentLifecycleEvent} from '../installments/lifecycle.ts';
import {validateInstallmentCollection,type InstallmentCollectionInput} from '../installments/validateCollection.ts';
import type {InstallmentPaymentPreviewEvent} from '../installments/collections.ts';
import {scheduleDifferencePaisa,validateScheduleRows,type InstallmentScheduleRow} from '../installments/schedule.ts';
import {validateInstallmentDraft} from '../installments/validateDraft.ts';

export type PreviewInstallmentAgreement={
  id:string;invoiceReference:string;customerId:string;customerName:string;
  createdAt:string;operationId:string;totalPaisa:number;downPaymentPaisa:number;
  schedule:InstallmentScheduleRow[];
  lineSnapshot:{key:string;productId:string;amountPaisa:number}[];
  /** Optional for legacy preview records; required to value return previews safely. */
  historicalLines?:readonly InstallmentHistoricalLine[];
  paymentSnapshot:{method:string;account:string;amountPaisa:number}[];
};
export type InstallmentPreviewInput=Omit<PreviewInstallmentAgreement,'id'|'createdAt'>;
let sequence=0;
const records:PreviewInstallmentAgreement[]=[];
const clean=(value:string,name:string)=>{
  if(typeof value!=='string'||!value.trim())throw new Error(name+' is required.');
  return value.trim();
};
const paisa=(value:number,name:string)=>{
  if(!Number.isSafeInteger(value)||value<0)throw new Error(name+' must be nonnegative integer paisa.');
  return value;
};
const total=(items:readonly {amountPaisa:number}[],name:string)=>{
  const amount=items.reduce((sum,row)=>sum+paisa(row.amountPaisa,name),0);
  if(!Number.isSafeInteger(amount))throw new Error(name+' exceeds safe money range.');
  return amount;
};

/** In-memory preview-only record; no party, finance, stock or backend source mutations. */
export function recordInstallmentPreview(input:InstallmentPreviewInput):PreviewInstallmentAgreement {
  clean(input.operationId,'Operation ID');
  const oldOperation=records.find(record=>record.operationId===input.operationId);
  if(oldOperation){
    const {id:_id,createdAt:_at,...previous}=oldOperation;
    if(JSON.stringify(previous)!==JSON.stringify(input))throw new Error('Operation already used for different installment details.');
    return structuredClone(oldOperation);
  }
  clean(input.invoiceReference,'Invoice reference');
  clean(input.customerId,'Customer');
  clean(input.customerName,'Customer name');
  paisa(input.totalPaisa,'Total invoice');
  paisa(input.downPaymentPaisa,'Down payment');
  const error=validateInstallmentDraft({customerId:input.customerId,customerName:input.customerName,
    phone:'',totalPaisa:input.totalPaisa,downPaymentPaisa:input.downPaymentPaisa,schedule:input.schedule});
  if(error.length)throw new Error(error[0]);
  if(input.lineSnapshot.length===0||new Set(input.lineSnapshot.map(l=>l.key)).size!==input.lineSnapshot.length)
    throw new Error('Duplicate or missing invoice line identity.');
  if(input.lineSnapshot.some(l=>!l.productId?.trim()))throw new Error('Invoice line product required.');
  if(total(input.lineSnapshot,'Invoice line')!==input.totalPaisa)
    throw new Error('Invoice line prices must reconcile to the agreed invoice total.');
  if(input.historicalLines){
    const source=new Map(input.lineSnapshot.map(row=>[row.key,row]));
    if(input.historicalLines.length!==source.size||
       input.historicalLines.some(row=>{
         const original=source.get(row.lineKey);
         return !original||original.productId!==row.productId||
           original.amountPaisa!==row.originalNetPaisa||
           !Number.isFinite(row.originalBaseQuantity)||row.originalBaseQuantity<=0;
       }))throw new Error('Historical sale lines must match their original invoice values.');
  }
  if(input.paymentSnapshot.some(row=>!row.method.trim()||!row.account.trim()||row.method==='Customer Credit'))
    throw new Error('Choose actual money accounts for the initial payment.');
  if(total(input.paymentSnapshot,'Payment split')!==input.downPaymentPaisa)
    throw new Error('Payment splits must reconcile to the down payment.');
  if(validateScheduleRows(input.schedule).length||scheduleDifferencePaisa(input.schedule,input.totalPaisa-input.downPaymentPaisa)!==0)
    throw new Error('Schedule total must match the remaining balance.');
  if(records.some(record=>record.invoiceReference===input.invoiceReference))
    throw new Error('Invoice already has an installment agreement.');
  const created:PreviewInstallmentAgreement={...structuredClone(input),id:'installment-preview-'+(++sequence),createdAt:new Date().toISOString()};
  records.push(created);
  return structuredClone(created);
}
export function listInstallmentPreviews():PreviewInstallmentAgreement[]{return structuredClone(records);}
export function getInstallmentPreview(id:string):PreviewInstallmentAgreement|undefined{
  const match=records.find(row=>row.id===id);
  return match?structuredClone(match):undefined;
}
export type InstallmentReceiptPreviewInput=Omit<InstallmentCollectionInput,'agreement'> & {agreementId:string};
let receiptSequence=0;
/** Monotonic source order for same-date agreement changes and collections. */
let previewSourceSequence=0;
const receipts:InstallmentPaymentPreviewEvent[]=[];
/** Immutable idempotent browser-preview only; no Party/Finance ledger mutation. */
export function recordInstallmentReceiptPreview(input:InstallmentReceiptPreviewInput):InstallmentPaymentPreviewEvent{
 if(!input.operationId?.trim())throw new Error('Receipt operation ID is required.');
 const previously=receipts.find(record=>record.operationId===input.operationId);
 if(previously){
   const {id:_id,createdAt:_created,sourceSequence:_seq,...payload}=previously;
   if(JSON.stringify(payload)!==JSON.stringify(input))throw new Error('Operation already used for different installment receipt details.');
   return structuredClone(previously);
 }
 const agreement=getInstallmentPreview(input.agreementId);
 if(!agreement)throw new Error('Installment agreement not found.');
 const existing=receipts.filter(row=>row.agreementId===agreement.id);
 const errors=validateInstallmentCollection({...input,agreement},existing,
   listInstallmentLifecycleEvents(agreement.id));
 if(errors.length)throw new Error(errors[0]);
 const event:InstallmentPaymentPreviewEvent={
   ...structuredClone(input),id:'installment-receipt-preview-'+(++receiptSequence),
   sourceSequence:++previewSourceSequence,createdAt:new Date().toISOString()
 };
 receipts.push(event);
 return structuredClone(event);
}
export function listInstallmentReceipts(agreementId:string):InstallmentPaymentPreviewEvent[]{
 return structuredClone(receipts.filter(row=>row.agreementId===agreementId));
}
export function resetInstallmentPreviewsForTest():void{
 sequence=0;receiptSequence=0;previewSourceSequence=0;records.splice(0);receipts.splice(0);lifecycleEvents.splice(0);
}

/** Source-event append is isolated from Party/Finance/stock; still a volatile UI preview. */
const lifecycleEvents:InstallmentLifecycleEvent[]=[];
export function listInstallmentLifecycleEvents(agreementId:string):InstallmentLifecycleEvent[]{
 return structuredClone(lifecycleEvents.filter(e=>e.agreementId===agreementId));
}
export function appendInstallmentLifecycleEvent(event:InstallmentLifecycleEvent):InstallmentLifecycleEvent{
 if(!records.some(a=>a.id===event.agreementId))throw new Error('Installment agreement not found.');
 const other=lifecycleEvents.find(e=>e.operationId===event.operationId);
 if(other){
  const {sourceSequence:_sourceSequence,...existingPayload}=other;
  if(JSON.stringify(existingPayload)!==JSON.stringify(event))
   throw new Error('Operation already used for a different lifecycle event.');
  return structuredClone(other);
 }
 if(lifecycleEvents.some(e=>e.id===event.id))
  throw new Error('Duplicate lifecycle event identity.');
 const previous=lifecycleEvents.filter(e=>e.agreementId===event.agreementId);
 if(event.revision!==previous.length+1)
  throw new Error('Stale lifecycle source revision.');
 const copy={...structuredClone(event),sourceSequence:++previewSourceSequence};
 lifecycleEvents.push(copy);
 return structuredClone(copy);
}
