import {useEffect,useMemo,useRef,useState} from 'react';
import {RotateCcw,Scale} from 'lucide-react';
import {AppSelect} from '../AppSelect';
import {Button} from '../Button';
import {Input} from '../Input';
import {NumericInput} from '../NumericInput';
import {AmountInWordsDisplay} from '../AmountInWordsDisplay';
import {Dialog,DialogContent,DialogDescription,DialogFooter,DialogHeader,DialogTitle} from '../Dialog';
import {taka} from '../../utils/currency';
import {businessToday} from '../../utils/dateRange';
import {useUiCopy} from '../../i18n/useUiCopy';
import {takaInputToPaisa} from '../../installments/pricing';
import {returnEligibility} from '../../installments/historicalLines';
import {
 previewInstallmentReturn,recordInstallmentReturnPreview,recordInstallmentSettlementPreview
} from '../../installments/adjustments';
import {projectInstallmentLifecycle,type InstallmentLifecycleEvent,
 type ReturnAdjustmentPreview,type AgreementReductionPreview} from '../../installments/lifecycle';
import type {PreviewInstallmentAgreement} from '../../data/installmentPreviewStore';
import type {InstallmentPaymentPreviewEvent} from '../../installments/collections';

type Props={open:boolean;mode:'Return'|'Settlement';agreement:PreviewInstallmentAgreement;
 receipts:readonly InstallmentPaymentPreviewEvent[];events:readonly InstallmentLifecycleEvent[];
 onClose:()=>void;onRecorded:(event:ReturnAdjustmentPreview|AgreementReductionPreview)=>void};
/** An adjustment never creates a real stock, cash, bank, customer credit or invoice event. */
export function InstallmentAdjustmentDialog({open,mode,agreement,receipts,events,onClose,onRecorded}:Props){
 const {text}=useUiCopy();
 const [lineKey,setLineKey]=useState('');
 const [quantity,setQuantity]=useState('');
 const [amount,setAmount]=useState('');
 const [reason,setReason]=useState('');
 const [review,setReview]=useState(false);
 const [error,setError]=useState('');
 const busy=useRef(false);
 const available=agreement.historicalLines?.filter(row=>row.kind!=='Service')??[];
 const eligibility=returnEligibility(agreement);
 const projection=useMemo(()=>projectInstallmentLifecycle(agreement,receipts,events,businessToday()),
  [agreement,receipts,events]);
 useEffect(()=>{
  if(!open)return;
  setLineKey(available[0]?.lineKey??'');
  setQuantity('');setAmount('');setReason('');setReview(false);setError('');busy.current=false;
 },[open,mode,agreement.id]);
 const selected=available.find(line=>line.lineKey===lineKey);
 const returnCheck=useMemo(()=>{
  if(mode!=='Return'||!selected||!quantity||!eligibility.eligible)return null;
  try{
   return previewInstallmentReturn({
    agreementId:agreement.id,lineKey,returnBaseQuantity:Number(quantity),
    disposition:'Adjust due',reason:reason.trim()||'Preview historical return',
    actorId:'preview-operator',operationId:'return-check',
    baseRevision:projection.revision,effectiveDate:businessToday()
   });
  }catch{return null;}
 },[mode,agreement.id,lineKey,quantity,reason,projection.revision,eligibility.eligible,selected]);
 const settlePaisa=useMemo(()=>{try{return takaInputToPaisa(amount);}catch{return 0;}},[amount]);
 const valuePaisa=mode==='Return'?returnCheck?.historicalValuePaisa??0:settlePaisa;
 const remaining=Math.max(0,projection.totalOutstandingPaisa-valuePaisa);
 const excess=Math.max(0,valuePaisa-projection.totalOutstandingPaisa);
 const canReview=reason.trim().length>=3&&(mode==='Return'?Boolean(returnCheck):
  settlePaisa>0&&settlePaisa<=projection.totalOutstandingPaisa);
 const change=()=>{setReview(false);setError('');};
 const save=()=>{
  if(busy.current)return;
  if(!canReview){
   setError(text('Enter valid amount/quantity and the reason.','সঠিক টাকা বা পরিমাণ এবং কারণ লিখুন।'));return;
  }
  if(!review){setReview(true);return;}
  busy.current=true;
  try{
   const common={agreementId:agreement.id,baseRevision:projection.revision,
    operationId:'adjustment-preview-'+crypto.randomUUID(),
    actorId:'preview-operator',reason:reason.trim(),effectiveDate:businessToday()};
   const event=mode==='Return'?recordInstallmentReturnPreview({
    ...common,lineKey,returnBaseQuantity:Number(quantity),disposition:'Adjust due'
   }):recordInstallmentSettlementPreview({...common,amountPaisa:settlePaisa});
   onRecorded(event);onClose();
  }catch(e){
   busy.current=false;setReview(false);
   setError(e instanceof Error?e.message:text('Adjustment preview could not be saved.','সমন্বয় প্রিভিউ রাখা যায়নি।'));
  }
 };
 const title=mode==='Return'?text('Installment return preview','কিস্তি বিক্রির ফেরত প্রিভিউ'):
  text('Installment settlement','কিস্তির সমন্বয়');
 return <Dialog open={open} onOpenChange={next=>!next&&onClose()}>
  <DialogContent className="max-h-[92dvh] w-[calc(100vw-1rem)] overflow-y-auto sm:max-w-lg" aria-label={title}>
   <DialogHeader>
    <DialogTitle className="flex items-center gap-2">
     {mode==='Return'?<RotateCcw className="size-4 text-teal-700"/>:<Scale className="size-4 text-teal-700"/>}{title}
    </DialogTitle>
    <DialogDescription>{agreement.customerName} · {agreement.invoiceReference} ·
     {text('Preview only, not posted to sales, stock or money accounts.',
      'শুধু প্রিভিউ; বিক্রি, স্টক বা টাকা হিসাবে জমা নয়।')}</DialogDescription>
   </DialogHeader>
   <div className="space-y-3">
    <div className="flex justify-between gap-2 rounded-lg bg-ink-50 p-3 text-xs">
     <span>{text('Agreement outstanding','বিক্রির বাকি')}</span>
     <strong className="text-danger">{taka(projection.totalOutstandingPaisa/100)}</strong>
    </div>
    {mode==='Return'?<>
      {!eligibility.eligible?<p role="alert" className="rounded-lg bg-ink-50 p-3 text-xs text-danger">
        {eligibility.reason}</p>:<>
       <AppSelect label={text('Return line','ফেরতের পণ্য')} value={lineKey} onChange={v=>{setLineKey(v);change();}}
        options={available.map(row=>({value:row.lineKey,label:row.productId+' · '+row.originalBaseQuantity+' '+row.selectedUnit}))}/>
       <label className="block space-y-1 text-xs font-medium text-ink">
        {text('Return quantity (original base units)','ফেরতের পরিমাণ (মূল একক)')}
        <NumericInput aria-label={text('Return quantity','ফেরতের পরিমাণ')}
         inputMode="decimal" value={quantity} onChange={e=>{setQuantity(e.target.value);change();}}
         className="h-9 w-full text-right"/>
       </label>
       <p className="text-xs text-ink-500">{text('Historical line value','বিক্রির সময়ের লাইন মূল্য')}: {taka((selected?.originalNetPaisa??0)/100)}</p>
      </>}
    </>:<label className="block space-y-1 text-xs font-medium text-ink">
      {text('Settlement amount','সমন্বয়ের টাকা')}
      <NumericInput aria-label={text('Settlement amount','সমন্বয়ের টাকা')} inputMode="decimal"
       value={amount} onChange={e=>{setAmount(e.target.value);change();}}
       className="h-9 w-full text-right"/>
    </label>}
    <label className="block space-y-1 text-xs font-medium text-ink">
     {text('Reason for adjustment','সমন্বয়ের কারণ')} *
     <Input aria-label={text('Reason','কারণ')} value={reason} className="h-9"
      onChange={e=>{setReason(e.target.value);change();}}/>
    </label>
    <div className="space-y-2 rounded-lg border border-border p-3 text-xs">
     <div className="flex justify-between gap-2"><span>{text('Source reduction','সমন্বয়ের টাকা')}</span>
      <strong>{taka(valuePaisa/100)}</strong></div>
     <div className="flex justify-between gap-2"><span>{text('Remaining due after','এরপর বাকি')}</span>
      <strong className="text-danger">{taka(remaining/100)}</strong></div>
     {excess>0&&<p className="text-danger" role="status">
      {text('Pending refund or customer credit decision · ','ফেরত টাকা বা ক্রেতার অগ্রিম সিদ্ধান্ত বাকি · ')}
      {taka(excess/100)}
     </p>}
     <AmountInWordsDisplay amount={valuePaisa/100}/>
    </div>
    {review&&<div role="status" className="rounded-lg border border-teal-200 bg-teal-50 p-3 text-xs text-teal-800">
     {text('Confirm an audited preview only. No refund, stock return, settlement cash or ledger entry is posted.',
      'শুধু নিরীক্ষাযোগ্য প্রিভিউ সংরক্ষণ হবে। আসল টাকা/স্টক/খাতায় জমা বা ফেরত নয়।')}
    </div>}
    {error&&<p role="alert" className="text-xs text-danger">{error}</p>}
   </div>
   <DialogFooter>
    <Button variant="outline" onClick={onClose}>{text('Cancel','বাতিল')}</Button>
    <Button disabled={!canReview} onClick={save}>
      {review?text('Confirm preview','প্রিভিউ নিশ্চিত করুন'):text('Review adjustment','সমন্বয় যাচাই')}
    </Button>
   </DialogFooter>
  </DialogContent>
 </Dialog>;
}
