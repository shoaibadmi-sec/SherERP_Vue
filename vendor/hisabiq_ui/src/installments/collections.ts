import type {PreviewInstallmentAgreement} from '../data/installmentPreviewStore.ts';
import {validateScheduleRows} from './schedule.ts';
export type InstallmentReceiptAllocation={scheduleItemId:string;amountPaisa:number};
export type InstallmentPaymentPreviewEvent={
 id:string;agreementId:string;operationId:string;date:string;amountPaisa:number;
 allocations:InstallmentReceiptAllocation[];
 splits:{method:'Cash'|'Bank'|'Mobile Banking';accountId:string;amountPaisa:number}[];
 /** Immutable order across lifecycle changes and receipts on the same business date. */
 sourceSequence?:number;
 createdAt:string;
};
export type InstallmentBalanceRow={id:string;dueDate:string;scheduledPaisa:number;
 paidPaisa:number;outstandingPaisa:number;status:'Paid'|'Partial'|'Upcoming'|'Due'|'Overdue'};
export type InstallmentBalanceProjection={totalOutstandingPaisa:number;dueTodayPaisa:number;
 overduePaisa:number;rows:InstallmentBalanceRow[]};

const paisa=(value:number,name:string):number=>{
 if(!Number.isSafeInteger(value)||value<0)throw new Error(name+' must be a nonnegative whole paisa amount.');
 return value;
};
const checkedDate=(date:string)=>{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw new Error('Invalid business date.');
 const parsed=new Date(date+'T12:00:00Z');
 if(!Number.isFinite(parsed.getTime())||parsed.toISOString().slice(0,10)!==date)throw new Error('Invalid business date.');
 return date;
};
const snapshot=(agreement:PreviewInstallmentAgreement)=>{
 const issues=validateScheduleRows(agreement.schedule);
 if(issues.length)throw new Error(issues[0]);
 const expected=paisa(agreement.totalPaisa,'Agreement total')-paisa(agreement.downPaymentPaisa,'Down payment');
 if(expected<0||agreement.schedule.reduce((sum,row)=>sum+paisa(row.amountPaisa,'Scheduled payment'),0)!==expected)
   throw new Error('Agreement schedule does not match the remaining obligation.');
 return agreement.schedule.map(row=>({id:row.id,dueDate:row.dueDate,scheduledPaisa:row.amountPaisa,
   paidPaisa:0,outstandingPaisa:row.amountPaisa}));
};
/** Keep the original agreement unchanged and validate *all* receipt allocations as one ledger. */
function remainingRows(agreement:PreviewInstallmentAgreement,receipts:readonly InstallmentPaymentPreviewEvent[],asOf?:string){
 if(asOf)checkedDate(asOf);
 const rows=snapshot(agreement);
 const seenIds=new Set<string>(),seenOperations=new Set<string>();
 for(const event of receipts){
   if(event.agreementId!==agreement.id)throw new Error('Receipt belongs to a different agreement.');
   if(!event.id||seenIds.has(event.id)||!event.operationId||seenOperations.has(event.operationId))
     throw new Error('Duplicate installment receipt or operation.');
   seenIds.add(event.id);seenOperations.add(event.operationId);
   checkedDate(event.date);
   if(asOf&&event.date>asOf)continue;
   const value=paisa(event.amountPaisa,'Receipt amount');
   if(value<=0)throw new Error('Receipt amount must be positive.');
   if(!event.allocations.length)throw new Error('A receipt needs a scheduled allocation.');
   let allocated=0;const touched=new Set<string>();
   for(const item of event.allocations){
     if(touched.has(item.scheduleItemId))throw new Error('Duplicate installment allocation.');
     touched.add(item.scheduleItemId);
     const row=rows.find(x=>x.id===item.scheduleItemId);
     if(!row)throw new Error('Unknown installment schedule item.');
     const amount=paisa(item.amountPaisa,'Allocated amount');
     if(amount<=0||amount>row.outstandingPaisa)throw new Error('Allocation exceeds remaining installment balance.');
     row.paidPaisa+=amount;row.outstandingPaisa-=amount;allocated+=amount;
   }
   if(!Number.isSafeInteger(allocated)||allocated!==value)throw new Error('Receipt total differs from allocation sum.');
 }
 return rows;
}
export function projectInstallmentBalance(
 agreement:PreviewInstallmentAgreement,receipts:readonly InstallmentPaymentPreviewEvent[],asOf:string
):InstallmentBalanceProjection{
 checkedDate(asOf);
 const rows=remainingRows(agreement,receipts,asOf);
 const result=rows.map((row):InstallmentBalanceRow=>({
   ...row,status:row.outstandingPaisa===0?'Paid'
     :row.dueDate<asOf?'Overdue'
     :row.dueDate===asOf?'Due'
     :row.paidPaisa>0?'Partial':'Upcoming'
 }));
 return {
   totalOutstandingPaisa:result.reduce((sum,row)=>sum+row.outstandingPaisa,0),
   overduePaisa:result.filter(row=>row.dueDate<asOf).reduce((sum,row)=>sum+row.outstandingPaisa,0),
   dueTodayPaisa:result.filter(row=>row.dueDate<=asOf).reduce((sum,row)=>sum+row.outstandingPaisa,0),
   rows:result
 };
}
/** Applies to the current agreement only, with explicit prepayment of future rows allowed. */
export function allocateOldestInstallments(
 agreement:PreviewInstallmentAgreement,receipts:readonly InstallmentPaymentPreviewEvent[],amountPaisa:number
):InstallmentReceiptAllocation[]{
 const amount=paisa(amountPaisa,'Payment');
 if(amount<=0)throw new Error('Payment must be positive.');
 const outstanding=remainingRows(agreement,receipts);
 const due=outstanding.reduce((sum,row)=>sum+row.outstandingPaisa,0);
 if(amount>due)throw new Error('Payment exceeds the agreement outstanding balance.');
 let left=amount;
 const allocations:InstallmentReceiptAllocation[]=[];
 for(const row of outstanding){
   if(!left)break;
   const applied=Math.min(left,row.outstandingPaisa);
   if(applied>0)allocations.push({scheduleItemId:row.id,amountPaisa:applied});
   left-=applied;
 }
 return allocations;
}
