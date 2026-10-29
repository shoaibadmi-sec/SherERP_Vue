import {businessToday} from '../utils/dateRange.ts';
import {validateBusinessDate} from '../utils/partyPayment.ts';
import {projectInstallmentLifecycle,type ReceiptReversalPreview} from './lifecycle.ts';
import {
 getInstallmentPreview,listInstallmentReceipts,listInstallmentLifecycleEvents,
 appendInstallmentLifecycleEvent
} from '../data/installmentPreviewStore.ts';

export type ReceiptReversalInput={
 agreementId:string;sourceReceiptId:string;reason:string;actorId:string;operationId:string;
 baseRevision:number;effectiveDate:string;
};
const fingerprint=(i:ReceiptReversalInput)=>JSON.stringify(i);
/** A new compensating preview event; the original receipt is never deleted or edited. */
export function recordInstallmentReceiptReversalPreview(input:ReceiptReversalInput):ReceiptReversalPreview{
 const prior=listInstallmentLifecycleEvents(input.agreementId);
 const replay=prior.find(e=>e.operationId===input.operationId);
 if(replay){
  if(replay.type!=='receipt-reversal'||replay.requestSignature!==fingerprint(input))
   throw new Error('Operation ID already used for different receipt reversal.');
  return structuredClone(replay);
 }
 if(!input.actorId?.trim())throw new Error('Reversal actor is required.');
 if(!input.reason?.trim()||input.reason.trim().length<3)throw new Error('Reversal reason is required.');
 if(!input.operationId?.trim())throw new Error('Reversal operation ID is required.');
 validateBusinessDate(input.effectiveDate);
 const agreement=getInstallmentPreview(input.agreementId);
 if(!agreement)throw new Error('Installment agreement is unavailable.');
 const receipts=listInstallmentReceipts(agreement.id);
 const source=receipts.find(r=>r.id===input.sourceReceiptId);
 if(!source)throw new Error('Receipt source does not belong to this agreement.');
 // Check for an already reversed source before revision validation so a second
 // operation cannot be mistaken for an ordinary stale write.
 if(prior.some(e=>e.type==='receipt-reversal'&&e.sourceReceiptId===source.id))
  throw new Error('Receipt already reversed.');
 const latest=projectInstallmentLifecycle(agreement,receipts,prior,businessToday());
 if(input.baseRevision!==latest.revision)throw new Error('Stale receipt reversal revision.');
 // A later schedule or reduction requires explicit revaluation and cannot be undone blindly.
 if(prior.some(e=>e.type!=='receipt-reversal'&&e.effectiveDate>=source.date))
  throw new Error('Later schedule or adjustment conflicts with this reversal; review source allocations first.');
 if(input.effectiveDate<source.date)
  throw new Error('Reversal date cannot precede original receipt.');
 return appendInstallmentLifecycleEvent({
  type:'receipt-reversal',id:'installment-reversal:'+agreement.id+':'+(latest.revision+1),
  agreementId:agreement.id,sourceReceiptId:source.id,operationId:input.operationId,
  actorId:input.actorId.trim(),reason:input.reason.trim(),
  effectiveDate:input.effectiveDate,revision:latest.revision+1,sequence:latest.revision+1,
  requestSignature:fingerprint(input)
 }) as ReceiptReversalPreview;
}
