import {businessToday} from '../utils/dateRange.ts';
import {
 getInstallmentPreview,listInstallmentReceipts,listInstallmentLifecycleEvents,
 appendInstallmentLifecycleEvent
} from '../data/installmentPreviewStore.ts';
import {returnEligibility} from './historicalLines.ts';
import {projectInstallmentLifecycle,type ReturnAdjustmentPreview,
 type AgreementReductionPreview} from './lifecycle.ts';

export type InstallmentReturnInput={
 agreementId:string;lineKey:string;returnBaseQuantity:number;
 disposition:'Adjust due'|'Pending refund/credit';
 reason:string;actorId:string;baseRevision:number;operationId:string;effectiveDate:string;
};
export type InstallmentSettlementInput={
 agreementId:string;amountPaisa:number;actorId:string;reason:string;
 operationId:string;baseRevision:number;effectiveDate:string;
};
export type InstallmentReturnCheck={
 historicalValuePaisa:number;appliedToDuePaisa:number;excessPaisa:number;issues:string[];
};
const signature=(input:unknown)=>JSON.stringify(input);
function businessDate(date:string):string{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw new Error('Choose a valid adjustment date.');
 const d=new Date(date+'T12:00:00Z');
 if(!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==date||date>businessToday())
  throw new Error('Adjustment business date cannot be invalid or in the future.');
 return date;
}
const positive=(amount:number)=>Number.isSafeInteger(amount)&&amount>0;
const micro=(value:number,name:string):bigint=>{
 if(!Number.isFinite(value)||value<=0||!Number.isSafeInteger(Math.round(value*1e6))||
    Math.abs(value-Math.round(value*1e6)/1e6)>1e-10)
  throw new Error(name+' must be positive with at most six decimal places.');
 return BigInt(Math.round(value*1e6));
};
const proportional=(paisa:bigint,q:bigint,total:bigint)=>
 (paisa*q+total/2n)/total;
function prepared(input:{agreementId:string;actorId:string;reason:string;operationId:string;
 baseRevision:number;effectiveDate:string}){
 const agreement=getInstallmentPreview(input.agreementId);
 if(!agreement)throw new Error('Installment agreement not found.');
 if(!input.actorId?.trim())throw new Error('Actor is required for adjustment.');
 if(!input.reason?.trim()||input.reason.trim().length<3)throw new Error('Adjustment needs a reason.');
 if(!input.operationId?.trim())throw new Error('Operation ID is required.');
 businessDate(input.effectiveDate);
 const prior=listInstallmentLifecycleEvents(agreement.id);
 const projection=projectInstallmentLifecycle(agreement,listInstallmentReceipts(agreement.id),prior,businessToday());
 if(input.baseRevision!==projection.revision)throw new Error('Stale installment adjustment revision.');
 return {agreement,projection};
}
/** Source-valued quantity return: never read current product price or mutate stock. */
export function previewInstallmentReturn(input:InstallmentReturnInput):InstallmentReturnCheck{
 const {agreement,projection}=prepared(input);
 const eligibility=returnEligibility(agreement);
 if(!eligibility.eligible)throw new Error(eligibility.reason);
 if(!['Adjust due','Pending refund/credit'].includes(input.disposition))
  throw new Error('Choose an explicit return disposition.');
 const original=agreement.historicalLines?.find(row=>row.lineKey===input.lineKey);
 if(!original||original.kind==='Service')throw new Error('Historical return source line is unavailable.');
 if(original.kind==='Bundle'&&!original.bundleSnapshot)
  throw new Error('Historical bundle parent recipe is unavailable.');
 const previous=listInstallmentLifecycleEvents(agreement.id).filter(
  (event):event is ReturnAdjustmentPreview=>event.type==='return-adjustment'&&event.lineKey===input.lineKey
 );
 const sold=micro(original.originalBaseQuantity,'Sold base quantity');
 const prior=previous.reduce((total,event)=>total+micro(event.returnedBaseQuantity,'Returned quantity'),0n);
 const next=micro(input.returnBaseQuantity,'Returned base quantity');
 if(prior+next>sold)throw new Error('Return quantity exceeds historical sold balance.');
 if(original.kind==='Bundle'&&(!Number.isInteger(input.returnBaseQuantity)||!Number.isInteger(original.originalBaseQuantity)))
  throw new Error('Return only whole historical bundle Sets.');
 const net=BigInt(original.originalNetPaisa);
 const value=proportional(net,prior+next,sold)-proportional(net,prior,sold);
 if(value<=0n||value>BigInt(Number.MAX_SAFE_INTEGER))
  throw new Error('Historical return value is invalid.');
 const historicalValuePaisa=Number(value);
 const appliedToDuePaisa=Math.min(historicalValuePaisa,projection.totalOutstandingPaisa);
 return {historicalValuePaisa,appliedToDuePaisa,
  excessPaisa:historicalValuePaisa-appliedToDuePaisa,issues:[]};
}
export function recordInstallmentReturnPreview(input:InstallmentReturnInput):ReturnAdjustmentPreview{
 const previous=listInstallmentLifecycleEvents(input.agreementId).find(e=>e.operationId===input.operationId);
 if(previous){
  if(previous.type!=='return-adjustment'||previous.requestSignature!==signature(input))
   throw new Error('Operation already used for different return details.');
  return structuredClone(previous);
 }
 const check=previewInstallmentReturn(input);
 if(check.issues.length)throw new Error(check.issues[0]);
 return appendInstallmentLifecycleEvent({
  type:'return-adjustment',id:'installment-return:'+input.agreementId+':'+(input.baseRevision+1),
  agreementId:input.agreementId,operationId:input.operationId,actorId:input.actorId.trim(),
  reason:input.reason.trim(),effectiveDate:input.effectiveDate,
  revision:input.baseRevision+1,sequence:input.baseRevision+1,
  lineKey:input.lineKey,returnedBaseQuantity:input.returnBaseQuantity,
  amountPaisa:check.historicalValuePaisa,disposition:input.disposition,
  requestSignature:signature(input)
 }) as ReturnAdjustmentPreview;
}
export function recordInstallmentSettlementPreview(input:InstallmentSettlementInput):AgreementReductionPreview{
 const existing=listInstallmentLifecycleEvents(input.agreementId).find(e=>e.operationId===input.operationId);
 if(existing){
  if(existing.type!=='agreement-reduction'||existing.requestSignature!==signature(input))
   throw new Error('Operation already used for different settlement details.');
  return structuredClone(existing);
 }
 const {projection}=prepared(input);
 if(!positive(input.amountPaisa)||input.amountPaisa>projection.totalOutstandingPaisa)
  throw new Error('Settlement exceeds the remaining installment outstanding balance.');
 return appendInstallmentLifecycleEvent({
  type:'agreement-reduction',id:'installment-settlement:'+input.agreementId+':'+(input.baseRevision+1),
  agreementId:input.agreementId,operationId:input.operationId,actorId:input.actorId.trim(),
  reason:input.reason.trim(),effectiveDate:input.effectiveDate,
  revision:input.baseRevision+1,sequence:input.baseRevision+1,
  amountPaisa:input.amountPaisa,requestSignature:signature(input)
 }) as AgreementReductionPreview;
}
