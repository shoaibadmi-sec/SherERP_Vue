import {AlertTriangle,CheckCircle2} from 'lucide-react';
import {Button} from './Button';
import {Dialog,DialogContent,DialogDescription,DialogFooter,DialogHeader,DialogTitle} from './Dialog';
import {taka} from '../utils/currency';
import {AmountInWordsDisplay} from './AmountInWordsDisplay';
import {useUiCopy} from '../i18n/useUiCopy';

/** UI-only translations; callers keep their source values unchanged. */
const REVIEW_WORDS:Record<string,string>={
 'Review sale':'বিক্রির হিসাব যাচাই',
 'Review sale update':'বিক্রির সংশোধন যাচাই',
 'Confirm sale preview':'বিক্রির প্রিভিউ নিশ্চিত করুন',
 'Confirm sale preview update':'বিক্রির সংশোধন নিশ্চিত করুন',
 'Confirm transaction':'লেনদেন নিশ্চিত করুন',
 'Customer':'ক্রেতা','Supplier':'সরবরাহকারী','Products':'পণ্য',
 'Paid':'জমা','Due':'বাকি','Total':'মোট','Payment':'পেমেন্ট',
};

export function TransactionReviewDialog({open,onClose,onConfirm,title,amount,details,confirmLabel='Confirm transaction',note}:{
 open:boolean;onClose:()=>void;onConfirm:()=>void;title:string;amount:number;
 details:ReadonlyArray<{label:string;value:string}>;confirmLabel?:string;note?:string;
}){
 const {text}=useUiCopy();
 const copy=(label:string)=>text(label,REVIEW_WORDS[label]??label);
 return <Dialog open={open} onOpenChange={next=>{if(!next)onClose();}}>
  <DialogContent role="dialog" aria-label={copy(title)} className="max-h-[92vh] overflow-y-auto sm:max-w-md">
   <DialogHeader><DialogTitle>{copy(title)}</DialogTitle>
    <DialogDescription>{text('Verify the details below. Choose Edit to correct a mistake before confirming.','নিশ্চিত করার আগে নাম, টাকা ও হিসাব মিলিয়ে নিন। ভুল থাকলে সংশোধন করুন।')}</DialogDescription></DialogHeader>
   <div className="space-y-3">
    <div className="rounded-xl border border-border bg-ink-50 p-4">
     <p className="text-xs text-ink-500">{text('Transaction amount','লেনদেনের টাকা')}</p>
     <p className="mt-1 text-2xl font-semibold text-ink">{taka(amount)}</p>
     <AmountInWordsDisplay amount={amount} />
    </div>
    <dl className="divide-y divide-border rounded-xl border border-border px-3">
     {details.map(item=><div className="flex justify-between gap-4 py-2 text-sm" key={item.label}>
      <dt className="min-w-0 flex-1 text-ink-500">{copy(item.label)}</dt><dd className="min-w-0 flex-[1.5] break-words text-right font-medium text-ink">{item.value}</dd>
     </div>)}
    </dl>
    <p className="flex items-start gap-2 text-xs text-ink-500"><AlertTriangle className="size-4 shrink-0 text-warning"/>
     {note??text('This is a preview. No real backend accounting or banking transaction is posted.','এটি শুধু প্রিভিউ। আসল ব্যাংক বা সার্ভারের খাতায় লেনদেন হবে না।')}</p>
    <DialogFooter>
     <Button variant="outline" onClick={onClose}>{text('Edit details','সংশোধন করুন')}</Button>
     <Button onClick={onConfirm}><CheckCircle2 className="size-4"/>{copy(confirmLabel)}</Button>
    </DialogFooter>
   </div>
  </DialogContent>
 </Dialog>;
}
