import {useEffect,useMemo,useState} from 'react';
import {CalendarClock} from 'lucide-react';
import {Button} from '../Button';
import {Input} from '../Input';
import {NumericInput} from '../NumericInput';
import {AppDateRangePicker} from '../AppDateRangePicker';
import {Dialog,DialogContent,DialogDescription,DialogFooter,DialogHeader,DialogTitle} from '../Dialog';
import {Table,TableBody,TableCell,TableHead,TableHeader,TableRow} from '../Table';
import {taka} from '../../utils/currency';
import {addDays,businessToday} from '../../utils/dateRange';
import {useUiCopy} from '../../i18n/useUiCopy';
import {takaInputToPaisa} from '../../installments/pricing';
import {projectInstallmentLifecycle,type InstallmentLifecycleEvent,type ScheduleRevisionPreview} from '../../installments/lifecycle';
import {recordScheduleRevisionPreview} from '../../installments/revisions';
import type {InstallmentScheduleRow} from '../../installments/schedule';
import type {InstallmentPaymentPreviewEvent} from '../../installments/collections';
import type {PreviewInstallmentAgreement} from '../../data/installmentPreviewStore';

type Props={open:boolean;agreement:PreviewInstallmentAgreement;
 receipts:readonly InstallmentPaymentPreviewEvent[];events:readonly InstallmentLifecycleEvent[];
 onClose:()=>void;onRecorded:(event:ScheduleRevisionPreview)=>void};
const asRows=(agreement:PreviewInstallmentAgreement,receipts:readonly InstallmentPaymentPreviewEvent[],
 events:readonly InstallmentLifecycleEvent[]):InstallmentScheduleRow[]=>{
 const projection=projectInstallmentLifecycle(agreement,receipts,events,businessToday());
 return projection.rows.filter(r=>r.outstandingPaisa>0).map(row=>({
  id:row.paidPaisa>0||row.reducedPaisa>0?row.id+'-carried-'+(projection.revision+1):row.id,
  dueDate:row.paidPaisa>0||row.reducedPaisa>0?addDays(row.dueDate,1):row.dueDate,
  amountPaisa:row.outstandingPaisa,editedAmount:false,editedDate:false
 }));
};
/** Only unpaid portions are editable; paid/deducted source evidence is automatically anchored. */
export function InstallmentRescheduleDialog({open,agreement,receipts,events,onClose,onRecorded}:Props){
 const {text}=useUiCopy();
 const [rows,setRows]=useState<InstallmentScheduleRow[]>([]);
 const [amounts,setAmounts]=useState<Record<string,string>>({});
 const [reason,setReason]=useState('');
 const [message,setMessage]=useState('');
 const [review,setReview]=useState(false);
 const projection=useMemo(()=>projectInstallmentLifecycle(agreement,receipts,events,businessToday()),
  [agreement,receipts,events]);
 useEffect(()=>{
  if(!open)return;
  const start=asRows(agreement,receipts,events);
  setRows(start);setAmounts(Object.fromEntries(start.map(r=>[r.id,String(r.amountPaisa/100)])));
  setReason('');setMessage('');setReview(false);
 },[open,agreement,receipts,events]);
 const sum=rows.reduce((n,row)=>n+row.amountPaisa,0);
 const valid=rows.length>0&&sum===projection.totalOutstandingPaisa &&
   rows.every(r=>r.amountPaisa>0&&Number.isSafeInteger(r.amountPaisa))&&reason.trim().length>=3;
 const edit=(id:string,field:Partial<InstallmentScheduleRow>)=>{
  setRows(prev=>prev.map(row=>row.id===id?{...row,...field}:row));setReview(false);setMessage('');
 };
 const onAmount=(id:string,value:string)=>{
  setAmounts(prev=>({...prev,[id]:value}));
  let p=0;try{p=takaInputToPaisa(value);}catch{/* blocked in review */}
  edit(id,{amountPaisa:p,editedAmount:true});
 };
 const save=()=>{
  if(!valid){setMessage(text('Complete the reason and balance the unpaid amounts.','কারণ লিখে বাকি টাকার হিসাব মিলান।'));return;}
  if(!review){setReview(true);return;}
  try{
   const saved=recordScheduleRevisionPreview({
    agreementId:agreement.id,baseRevision:projection.revision,
    operationId:'schedule-change-'+crypto.randomUUID(),actorId:'preview-operator',
    reason:reason.trim(),effectiveDate:businessToday(),nextUnpaidRows:rows
   });
   onRecorded(saved);onClose();
  }catch(error){setMessage(error instanceof Error?error.message:'Schedule could not be revised.');setReview(false);}
 };
 return <Dialog open={open} onOpenChange={next=>!next&&onClose()}>
  <DialogContent className="max-h-[92dvh] w-[calc(100vw-1rem)] overflow-y-auto sm:max-w-2xl"
    aria-label={text('Edit installment schedule','কিস্তির সময়সূচি বদলান')}>
   <DialogHeader>
    <DialogTitle className="flex items-center gap-2"><CalendarClock className="size-4 text-teal-700"/>
     {text('Edit installment schedule','কিস্তির সময়সূচি বদলান')}</DialogTitle>
    <DialogDescription>{text('Already paid dates and amounts stay locked. Only unpaid parts can move. Preview only.',
      'আগে জমা দেওয়া টাকা ও তারিখ অপরিবর্তিত থাকবে। শুধু বাকি কিস্তি বদলাবে। এটি প্রিভিউ।')}</DialogDescription>
   </DialogHeader>
   <div className="space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-ink-50 p-3 text-xs">
      <span>{text('Remaining to schedule','কিস্তিতে বাকি')}</span>
      <strong className="text-danger">{taka(projection.totalOutstandingPaisa/100)}</strong>
    </div>
    {rows.length===0?<p className="text-xs text-ink-500">{text('No unpaid installments to change.','কোনো বাকি কিস্তি নেই।')}</p>:
    <div className="overflow-x-auto rounded-lg border border-border">
     <Table scrollRegionLabel={text('Editable unpaid schedule','সম্পাদনাযোগ্য বাকি কিস্তি')}>
      <TableHeader><TableRow><TableHead>#</TableHead><TableHead>{text('Due date','তারিখ')}</TableHead><TableHead className="text-right">{text('Amount','টাকা')}</TableHead></TableRow></TableHeader>
      <TableBody>{rows.map((row,i)=><TableRow key={row.id}>
       <TableCell>{i+1}</TableCell>
       <TableCell className="min-w-[155px]"><AppDateRangePicker single
        value={{from:row.dueDate,to:row.dueDate}} label={text('Due date '+(i+1),'তারিখ '+(i+1))}
        onChange={value=>edit(row.id,{dueDate:value.from,editedDate:true})}/></TableCell>
       <TableCell className="min-w-[125px]"><NumericInput inputMode="decimal"
        aria-label={text('Amount '+(i+1),'টাকা '+(i+1))} value={amounts[row.id]??''}
        className="h-9 w-full text-right" onChange={e=>onAmount(row.id,e.target.value)}/></TableCell>
      </TableRow>)}</TableBody>
     </Table>
    </div>}
    <div className="flex flex-wrap justify-between gap-2 rounded-lg bg-ink-50 p-2.5 text-xs">
     <span>{text('Scheduled unpaid total','পরিবর্তিত বাকি')} <strong>{taka(sum/100)}</strong></span>
     <span className={sum===projection.totalOutstandingPaisa?'text-success':'text-danger'}>
      {text('Difference','অমিল')} {taka(Math.abs(sum-projection.totalOutstandingPaisa)/100)}
     </span>
    </div>
    <label className="block space-y-1 text-xs font-medium text-ink">
     {text('Reason for change','পরিবর্তনের কারণ')} *
     <Input aria-label={text('Reason','কারণ')} value={reason}
      onChange={e=>{setReason(e.target.value);setReview(false);}} className="h-9"/>
    </label>
    {review&&<div role="status" className="rounded-lg border border-teal-200 bg-teal-50 p-3 text-xs text-teal-800">
      {text('Review: no new sale, cash movement or stock posting. Revision history will be saved in preview only.',
       'পর্যালোচনা: নতুন বিক্রি বা ক্যাশ/স্টক জমা হবে না। শুধু প্রিভিউতে সময়সূচি বদলাবে।')}
    </div>}
    {message&&<p role="alert" className="text-xs text-danger">{message}</p>}
   </div>
   <DialogFooter>
    <Button variant="outline" onClick={onClose}>{text('Cancel','বাতিল')}</Button>
    <Button disabled={!valid} onClick={save}>{review?text('Save schedule preview','প্রিভিউ সংরক্ষণ'):text('Review schedule','হিসাব যাচাই')}</Button>
   </DialogFooter>
  </DialogContent>
 </Dialog>;
}
