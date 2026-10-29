import {CalendarDays,ChevronDown,Info,Printer} from 'lucide-react';
import {toast} from 'sonner';
import {Button} from '../Button';
import {Table,TableBody,TableCell,TableHead,TableHeader,TableRow} from '../Table';
import {taka} from '../../utils/currency';
import {businessToday,formatDay} from '../../utils/dateRange';
import {useUiCopy} from '../../i18n/useUiCopy';
import type {InstallmentPaymentPreviewEvent} from '../../installments/collections';
import {projectInstallmentLifecycle,type InstallmentLifecycleEvent} from '../../installments/lifecycle';
import {returnEligibility} from '../../installments/historicalLines';
import {renderInstallmentLifecyclePrint} from '../../installments/printLifecycle';
import type {PreviewInstallmentAgreement} from '../../data/installmentPreviewStore';

/** Source-derived read-only preview; receipt allocations never write to real ledger. */
export function InstallmentAgreementPreview({agreement,receipts=[],events=[],onReceive,onReschedule,onReturn,onSettle,onReverseReceipt}:{
 agreement:PreviewInstallmentAgreement;receipts?:readonly InstallmentPaymentPreviewEvent[];
 events?:readonly InstallmentLifecycleEvent[];
 onReceive?:()=>void;onReschedule?:()=>void;onReturn?:()=>void;onSettle?:()=>void;
 onReverseReceipt?:(sourceReceiptId:string)=>void;
}){
 const {text}=useUiCopy();
 const summary=projectInstallmentLifecycle(agreement,receipts,events,businessToday());
 const eligibility=returnEligibility(agreement);
 const reversedIds=new Set(events.filter(e=>e.type==='receipt-reversal')
  .map(e=>(e as Extract<InstallmentLifecycleEvent,{type:'receipt-reversal'}>).sourceReceiptId));
 const printPreview=()=>{
  const html=renderInstallmentLifecyclePrint(agreement,receipts,events,businessToday());
  const popup=window.open('','_blank');
  if(!popup){toast.error(text('Allow popups to print the agreement preview.','প্রিভিউ প্রিন্ট করতে পপআপ চালু করুন।'));return;}
  popup.document.open();popup.document.write(html);popup.document.close();
  popup.focus();popup.print();
 };
 return <div className="mt-3 space-y-2">
   <details className="overflow-hidden rounded-xl border border-border bg-card">
     <summary className="flex cursor-pointer items-center gap-2 border-b border-border px-3 py-2.5 text-sm font-medium text-ink">
       <CalendarDays className="size-4 text-teal-700"/>
       <span className="flex-1">{text('Installment schedule','কিস্তির তালিকা')} · {agreement.schedule.length} {text('payments','কিস্তি')}</span>
       <ChevronDown className="size-4 text-ink-500"/>
     </summary>
     <div className="space-y-3 p-3">
       <div className="grid grid-cols-2 gap-3 text-sm">
         <div><p className="text-xs text-ink-500">{text('Agreed price','বিক্রির মোট')}</p>
           <p className="font-semibold text-ink">{taka(agreement.totalPaisa/100)}</p></div>
         <div><p className="text-xs text-ink-500">{text('Down payment','প্রথম জমা')}</p>
           <p className="font-semibold text-ink">{taka(agreement.downPaymentPaisa/100)}</p></div>
       </div>
       <div className="grid grid-cols-2 gap-2 rounded-lg bg-ink-50 p-2.5 text-sm">
         <div><span className="text-xs text-ink-500">{text('Remaining to collect','কিস্তিতে বাকি')}</span>
           <strong className="block text-danger">{taka(summary.totalOutstandingPaisa/100)}</strong></div>
         <div><span className="text-xs text-ink-500">{text('Overdue','সময় পার হয়েছে')}</span>
           <strong className="block text-danger">{taka(summary.overduePaisa/100)}</strong></div>
       </div>
       <div className="overflow-x-auto rounded-lg border border-border">
         <Table scrollRegionLabel={text('Installment payment dates','কিস্তির তারিখ')}>
           <TableHeader><TableRow>
             <TableHead>#</TableHead><TableHead>{text('Due date','তারিখ')}</TableHead>
             <TableHead className="text-right">{text('Paid','জমা')}</TableHead>
             <TableHead className="text-right">{text('Remaining','বাকি')}</TableHead>
             <TableHead>{text('Status','অবস্থা')}</TableHead>
           </TableRow></TableHeader>
           <TableBody>{summary.rows.map((row,index)=><TableRow key={row.id}>
             <TableCell>{index+1}</TableCell>
             <TableCell>{formatDay(row.dueDate)}</TableCell>
             <TableCell className="text-right">{taka(row.paidPaisa/100)}</TableCell>
             <TableCell className="text-right font-medium">{taka(row.outstandingPaisa/100)}</TableCell>
             <TableCell><span className={row.status==='Paid'?'text-success':row.status==='Overdue'?'text-danger':'text-ink-500'}>{row.status}</span></TableCell>
           </TableRow>)}</TableBody>
         </Table>
       </div>
       <div className="space-y-1.5 border-t border-border pt-2">
         <p className="text-xs font-semibold text-ink">{text('Receipt history','জমার ইতিহাস')} · {receipts.length}</p>
         {receipts.length===0&&<p className="text-xs text-ink-500">{text('No installment collection yet.','এখনও কিস্তির টাকা জমা হয়নি।')}</p>}
         {receipts.map((receipt,index)=><div key={receipt.id} className="flex flex-wrap items-center justify-between gap-2 text-xs">
           <span className="text-ink-700">{text('Receipt','রসিদ')} #{index+1} · {formatDay(receipt.date)}
             {reversedIds.has(receipt.id)&&<span className="ml-1 text-danger">· {text('Reversed','বাতিল')}</span>}
           </span>
           <span className="inline-flex items-center gap-2 font-medium text-ink">
             {taka(receipt.amountPaisa/100)}
             {onReverseReceipt&&!reversedIds.has(receipt.id)&&
               <Button size="sm" variant="outline" onClick={()=>onReverseReceipt(receipt.id)}>
                {text('Reverse','বাতিল')}
               </Button>}
           </span>
         </div>)}
       </div>
       {events.length>0&&<div className="space-y-1.5 border-t border-border pt-2">
         <p className="text-xs font-semibold text-ink">{text('Lifecycle history','পরিবর্তনের ইতিহাস')} · {events.length}</p>
         {events.map(event=><div key={event.id} className="flex items-start justify-between gap-2 text-xs">
           <div className="min-w-0"><span className="font-medium text-ink">{event.type==='schedule-revision'?text('Schedule revision','কিস্তির সময় বদল'):
             event.type==='return-adjustment'?text('Return adjustment','পণ্য ফেরত'):
             event.type==='receipt-reversal'?text('Receipt reversal','জমা বাতিল'):
             text('Settlement','সমন্বয়')}</span>
             <p className="text-ink-500">{event.effectiveDate} · {event.reason}</p>
           </div>
           <span className="shrink-0 text-ink-500">v{event.revision}</span>
         </div>)}
       </div>}
       {summary.surplusPaisa>0&&<p role="status" className="rounded-lg bg-ink-50 p-2 text-xs text-danger">
         {text('Pending refund / credit decision','ফেরত টাকা / ক্রেডিট সিদ্ধান্ত বাকি')} · {taka(summary.surplusPaisa/100)}
       </p>}
       <p className="flex items-start gap-1.5 text-xs text-ink-500"><Info className="mt-0.5 size-3.5 shrink-0"/>
         {text('Preview only; receipts are not posted to real cash, bank, stock or customer ledger.','শুধু প্রিভিউ; আসল ক্যাশ, ব্যাংক, স্টক বা ক্রেতার খাতায় জমা হয়নি।')}
       </p>
     </div>
   </details>
   <div className="flex flex-wrap gap-1.5">
     {onReceive&&summary.totalOutstandingPaisa>0&&
       <Button size="sm" onClick={onReceive} className="flex-1">
         {text('Receive payment','কিস্তির টাকা নিন')}
       </Button>}
     {onReschedule&&summary.totalOutstandingPaisa>0&&
       <Button size="sm" variant="outline" onClick={onReschedule} className="flex-1">
         {text('Edit schedule','সময় বদলান')}
       </Button>}
     {onReturn&&<Button size="sm" variant="outline" onClick={onReturn} disabled={!eligibility.eligible}
       title={!eligibility.eligible?eligibility.reason:undefined} className="flex-1">
       {text('Return item','পণ্য ফেরত')}
     </Button>}
     {onSettle&&summary.totalOutstandingPaisa>0&&
       <Button size="sm" variant="outline" onClick={onSettle} className="flex-1">
         {text('Settlement','সমন্বয়')}
       </Button>}
     <Button size="sm" variant="outline" onClick={printPreview} className="flex-1">
       <Printer className="size-3.5"/>{text('Print preview','প্রিভিউ প্রিন্ট')}
     </Button>
   </div>
   {onReturn&&!eligibility.eligible&&<p className="text-[11px] text-ink-500">
     {eligibility.reason}
   </p>}
 </div>;
}
