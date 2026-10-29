import {useEffect,useRef,useState} from 'react';
import {RotateCcw} from 'lucide-react';
import {Button} from '../Button';
import {Input} from '../Input';
import {Dialog,DialogContent,DialogDescription,DialogFooter,DialogHeader,DialogTitle} from '../Dialog';
import {taka} from '../../utils/currency';
import {businessToday} from '../../utils/dateRange';
import {useUiCopy} from '../../i18n/useUiCopy';
import {projectInstallmentLifecycle,type ReceiptReversalPreview,type InstallmentLifecycleEvent} from '../../installments/lifecycle';
import {recordInstallmentReceiptReversalPreview} from '../../installments/reversals';
import type {PreviewInstallmentAgreement} from '../../data/installmentPreviewStore';
import type {InstallmentPaymentPreviewEvent} from '../../installments/collections';

export function InstallmentReceiptReversalDialog({open,agreement,receipt,receipts,events,onClose,onRecorded}:{
 open:boolean;agreement:PreviewInstallmentAgreement;receipt:InstallmentPaymentPreviewEvent;
 receipts:readonly InstallmentPaymentPreviewEvent[];events:readonly InstallmentLifecycleEvent[];
 onClose:()=>void;onRecorded:(event:ReceiptReversalPreview)=>void;
}){
 const {text}=useUiCopy();
 const [reason,setReason]=useState('');
 const [review,setReview]=useState(false);
 const [error,setError]=useState('');
 const busy=useRef(false);
 useEffect(()=>{
  if(!open)return;
  setReason('');setReview(false);setError('');busy.current=false;
 },[open,receipt.id]);
 const confirm=()=>{
  if(busy.current)return;
  if(reason.trim().length<3){setError(text('Enter a reason for reversal.','জমা বাতিলের কারণ লিখুন।'));return;}
  if(!review){setReview(true);setError('');return;}
  busy.current=true;
  try{
   const version=projectInstallmentLifecycle(agreement,receipts,events,businessToday()).revision;
   const saved=recordInstallmentReceiptReversalPreview({
    agreementId:agreement.id,sourceReceiptId:receipt.id,actorId:'preview-operator',
    reason:reason.trim(),operationId:'reverse-preview-'+crypto.randomUUID(),
    baseRevision:version,effectiveDate:businessToday()
   });
   onRecorded(saved);onClose();
  }catch(e){
   busy.current=false;setReview(false);
   setError(e instanceof Error?e.message:'Cannot reverse receipt preview.');
  }
 };
 return <Dialog open={open} onOpenChange={next=>!next&&onClose()}>
  <DialogContent className="max-h-[92dvh] w-[calc(100vw-1rem)] overflow-y-auto sm:max-w-md"
    aria-label={text('Reverse installment receipt','কিস্তির জমা বাতিল')}>
   <DialogHeader>
    <DialogTitle className="flex items-center gap-2"><RotateCcw className="size-4 text-danger"/>
     {text('Reverse installment receipt','কিস্তির জমা বাতিল')}
    </DialogTitle>
    <DialogDescription>{agreement.invoiceReference} · {receipt.date} · {taka(receipt.amountPaisa/100)}
     <span className="block">{text('Original receipt remains in preview history. No real cash or bank reversal.',
      'মূল জমা ইতিহাসে থাকবে। আসল ক্যাশ বা ব্যাংকে কোনো টাকা ফেরত নয়।')}</span>
    </DialogDescription>
   </DialogHeader>
   <label className="space-y-1 text-xs font-medium text-ink">
    {text('Reason','কারণ')} *
    <Input aria-label={text('Reason','কারণ')} value={reason}
     onChange={e=>{setReason(e.target.value);setReview(false);setError('');}} className="h-9"/>
   </label>
   {review&&<p role="status" className="rounded-md border border-teal-200 bg-teal-50 p-3 text-xs text-teal-800">
    {text('Review the compensating PREVIEW event. The original payment will stay visible.',
     'জমা বাতিলের প্রিভিউ যাচাই করুন। আগের জমা ইতিহাসে থাকবে।')}
   </p>}
   {error&&<p role="alert" className="text-xs text-danger">{error}</p>}
   <DialogFooter>
    <Button variant="outline" onClick={onClose}>{text('Cancel','বাতিল')}</Button>
    <Button disabled={reason.trim().length<3} onClick={confirm}>
     {review?text('Confirm reversal preview','প্রিভিউ বাতিল নিশ্চিত করুন'):text('Review reversal','বাতিল যাচাই করুন')}
    </Button>
   </DialogFooter>
  </DialogContent>
 </Dialog>;
}
