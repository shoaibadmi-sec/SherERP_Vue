import {useEffect,useMemo,useRef,useState} from 'react';
import {HandCoins} from 'lucide-react';
import {Button} from '../Button';
import {Input} from '../Input';
import {AppDatePicker} from '../AppDateRangePicker';
import {AmountInWordsDisplay} from '../AmountInWordsDisplay';
import {Dialog,DialogContent,DialogDescription,DialogFooter,DialogHeader,DialogTitle} from '../Dialog';
import {FinancePaymentSplitEditor,type FinancePaymentDraft} from '../finance/FinancePaymentSplitEditor';
import {financeAccounts} from '../../data/financeAccounts';
import {normalizeFinancePaymentSplits} from '../../utils/financePaymentDrafts';
import {businessToday} from '../../utils/dateRange';
import {taka} from '../../utils/currency';
import {useUiCopy} from '../../i18n/useUiCopy';
import {takaInputToPaisa} from '../../installments/pricing';
import type {InstallmentPaymentPreviewEvent,InstallmentReceiptAllocation} from '../../installments/collections';
import {allocateOldestLifecycleInstallments,projectInstallmentLifecycle,type InstallmentLifecycleEvent} from '../../installments/lifecycle';
import {validateInstallmentCollection} from '../../installments/validateCollection';
import {recordInstallmentReceiptPreview,type PreviewInstallmentAgreement} from '../../data/installmentPreviewStore';

type Props={open:boolean;agreement:PreviewInstallmentAgreement;receipts:readonly InstallmentPaymentPreviewEvent[];
 events?:readonly InstallmentLifecycleEvent[];
 onClose:()=>void;onRecorded:(receipt:InstallmentPaymentPreviewEvent)=>void};
const initial=():FinancePaymentDraft[]=>[{id:'cash-1',method:'Cash',accountId:'acc-cash',amount:''}];
/** Browser-preview collection, not a second financial/Party ledger. */
export function InstallmentReceivePaymentDialog({open,agreement,receipts,events=[],onClose,onRecorded}:Props){
 const {text}=useUiCopy();
 const [date,setDate]=useState(businessToday());
 const [amount,setAmount]=useState('');
 const [splits,setSplits]=useState<FinancePaymentDraft[]>(initial);
 const [manual,setManual]=useState(false);
 const [allocations,setAllocations]=useState<Record<string,string>>({});
 const [review,setReview]=useState(false);
 const [error,setError]=useState('');
 const submitting=useRef(false);
 const operation=useRef('');
 useEffect(()=>{
   if(!open)return;
   setDate(businessToday());setAmount('');setSplits(initial());setManual(false);
   setAllocations({});setReview(false);setError('');submitting.current=false;
   operation.current='installment-receipt-'+(typeof crypto!=='undefined'&&'randomUUID' in crypto?crypto.randomUUID():String(Date.now()));
 },[open,agreement.id]);
 const today=businessToday();
 const summary=useMemo(()=>projectInstallmentLifecycle(agreement,receipts,events,today),
  [agreement,receipts,events,today]);
 const parsed=useMemo(()=>{try{return takaInputToPaisa(amount);}catch{return 0;}},[amount]);
 const currentAllocation=useMemo(():InstallmentReceiptAllocation[]=>{
   if(manual)return summary.rows.flatMap(row=>{
     const raw=allocations[row.id]??'';
     if(!raw.trim())return [];
     try{const amountPaisa=takaInputToPaisa(raw);return amountPaisa>0?[{scheduleItemId:row.id,amountPaisa}]:[];}
     catch{return [{scheduleItemId:row.id,amountPaisa:-1}];}
   });
   if(parsed<=0)return [];
   try{return allocateOldestLifecycleInstallments(agreement,receipts,events,parsed,date);}catch{return [];}
 },[agreement,allocations,manual,parsed,receipts,events,date,summary.rows]);
 const actualSplits=useMemo(()=>normalizeFinancePaymentSplits(splits,financeAccounts,parsed/100).map(row=>({
   method:row.method,accountId:row.accountId,amountPaisa:Math.round(row.amount*100)
 })),[splits,parsed]);
 const hasAllSplits=actualSplits.length===splits.length;
 const validationInput={agreement,operationId:operation.current,date,amountPaisa:parsed,
   allocations:currentAllocation,splits:actualSplits};
 const check=()=>{
   if(!amount.trim())return text('Enter the amount received.','জমা টাকার পরিমাণ দিন।');
   if(parsed>summary.totalOutstandingPaisa)return text(
     'Payment exceeds this agreement. Return change or record a separate customer advance.',
     'এই বিক্রির বাকি টাকার বেশি। অতিরিক্ত টাকা ফেরত দিন অথবা আলাদা ক্রেতার অগ্রিম হিসাবে রাখুন।'
   );
   if(!hasAllSplits)return text('Complete every payment source row.','সব টাকার মাধ্যম পূরণ করুন।');
   const problems=validateInstallmentCollection(validationInput,receipts,events);
   return problems[0]??'';
 };
 const confirm=()=>{
   if(submitting.current)return;
   const problem=check();
   if(problem){setError(problem);setReview(false);return;}
   if(!review){setReview(true);setError('');return;}
   submitting.current=true;
   try{
     const saved=recordInstallmentReceiptPreview({
       agreementId:agreement.id,operationId:operation.current,date,amountPaisa:parsed,
       allocations:currentAllocation,splits:actualSplits
     });
     onRecorded(saved);onClose();
   }catch(e){
     submitting.current=false;setReview(false);
     setError(e instanceof Error?e.message:text('Cannot save receipt preview.','পেমেন্ট প্রিভিউ রাখা যায়নি।'));
   }
 };
 const updateAmount=(value:string)=>{
   setAmount(value);setReview(false);setError('');
   if(splits.length===1)setSplits(previous=>previous.map(row=>({...row,amount:value})));
 };
 return <Dialog open={open} onOpenChange={next=>!next&&onClose()}>
   <DialogContent className="max-h-[92dvh] w-[calc(100vw-1rem)] overflow-y-auto sm:max-w-2xl"
      aria-label={text('Receive installment payment','কিস্তির টাকা নিন')}>
     <DialogHeader>
       <DialogTitle className="flex items-center gap-2"><HandCoins className="size-4 text-teal-700"/>
         {text('Receive installment payment','কিস্তির টাকা নিন')}
       </DialogTitle>
       <DialogDescription>
         {agreement.customerName} · {agreement.invoiceReference} · {text('Preview only, no cash/bank/ledger posting.','শুধু প্রিভিউ; আসল ক্যাশ বা খাতায় জমা হবে না।')}
       </DialogDescription>
     </DialogHeader>
     <div className="space-y-3">
       <div className="grid grid-cols-2 gap-2 rounded-lg bg-ink-50 p-3 text-xs sm:grid-cols-3">
         <div className="col-span-2 min-w-0 sm:col-span-1"><p className="text-ink-500">{text('Total remaining','মোট বাকি')}</p>
           <p className="font-semibold text-danger">{taka(summary.totalOutstandingPaisa/100)}</p></div>
         <div><p className="text-ink-500">{text('Due now','এখন দিতে হবে')}</p>
           <p className="font-semibold text-ink">{taka(summary.dueTodayPaisa/100)}</p></div>
         <div><p className="text-ink-500">{text('Overdue','মেয়াদ পার হয়েছে')}</p>
           <p className="font-semibold text-danger">{taka(summary.overduePaisa/100)}</p></div>
       </div>
       <div className="grid gap-2 sm:grid-cols-2">
         <label className="space-y-1 text-xs font-medium text-ink-700">
           {text('Payment date','জমার তারিখ')}
           <AppDatePicker label={text('Payment date','জমার তারিখ')}
             value={date} onChange={value=>{setDate(value);setReview(false);setError('');}}/>
         </label>
         <label className="space-y-1 text-xs font-medium text-ink-700">
           {text('Amount received','জমা টাকা')}
           <div className="flex gap-1.5">
             <Input inputMode="decimal" aria-label={text('Payment amount','পেমেন্টের টাকা')}
               value={amount} onChange={event=>updateAmount(event.target.value)} placeholder="0.00" className="min-w-0 flex-1 text-right"/>
             <Button size="sm" variant="outline" onClick={()=>updateAmount(String(summary.totalOutstandingPaisa/100))}>
               {text('Full','পুরো বাকি')}
             </Button>
           </div>
         </label>
       </div>
       <FinancePaymentSplitEditor accounts={financeAccounts} rows={splits}
         onChange={value=>{setSplits(value);setReview(false);setError('');}} totalAmount={parsed/100}/>
       <details className="rounded-lg border border-border px-3 py-2.5" onToggle={event=>{
          const expanded=event.currentTarget.open;
          if(expanded!==manual){setManual(expanded);setReview(false);setError('');}
       }}>
         <summary className="cursor-pointer text-xs font-medium text-teal-700">
           {text('Advanced · choose installment allocation','বিস্তারিত · কোন কিস্তির টাকা')}
         </summary>
         <p className="mt-2 text-xs text-ink-500">{text('Leave an amount blank for zero. Only this agreement is affected.','ফাঁকা রাখলে শূন্য। শুধু এই বিক্রির কিস্তিতে জমা হবে।')}</p>
         <div className="mt-2 space-y-2">
           {summary.rows.filter(row=>row.outstandingPaisa>0).map((row,index)=>
             <label key={row.id} className="flex items-center justify-between gap-2 text-xs text-ink">
               <span className="min-w-0 flex-1">#{index+1} · {row.dueDate} · {taka(row.outstandingPaisa/100)}</span>
               <Input aria-label={'Allocate installment '+(index+1)} inputMode="decimal"
                 className="h-9 w-[120px] text-right" value={allocations[row.id]??''}
                 onChange={event=>{setAllocations(previous=>({...previous,[row.id]:event.target.value}));setReview(false);setError('');}}/>
             </label>
           )}
         </div>
       </details>
       <p className="text-xs text-ink-500">
         {text('Allocated to this agreement','এই বিক্রিতে জমা')}: <strong>{taka(currentAllocation.reduce((sum,item)=>sum+item.amountPaisa,0)/100)}</strong>
       </p>
       <AmountInWordsDisplay amount={parsed/100}/>
       {review && <div role="status" className="rounded-lg border border-teal-200 bg-teal-50 p-3 text-xs text-teal-800">
         <p className="font-semibold">{text('Confirm receipt preview','পেমেন্ট যাচাই করুন')}</p>
         <p>{agreement.customerName} · {taka(parsed/100)} · {date}</p>
         <p>{text('Remaining after','এরপর বাকি')} {taka((summary.totalOutstandingPaisa-parsed)/100)}</p>
       </div>}
       {error&&<p role="alert" className="text-xs text-danger">{error}</p>}
     </div>
     <DialogFooter>
       <Button variant="outline" onClick={onClose}>{text('Cancel','বাতিল')}</Button>
       <Button disabled={submitting.current||summary.totalOutstandingPaisa===0} onClick={confirm}>
         {review?text('Confirm receipt preview','প্রিভিউ জমা নিশ্চিত করুন'):text('Review payment','পেমেন্ট যাচাই করুন')}
       </Button>
     </DialogFooter>
   </DialogContent>
 </Dialog>;
}
