import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../Dialog';
import { Button } from '../Button';
import { Input } from '../Input';
import { AppDatePicker } from '../AppDateRangePicker';
import { FinancePaymentSplitEditor, type FinancePaymentDraft } from '../finance/FinancePaymentSplitEditor';
import { financeAccounts } from '../../data/financeAccounts';
import type { PartyLedgerRow, PartyMoneySplit, PartyPaymentPayload, PartySourceRecord } from '../../types/partyLedger';
import { taka } from '../../utils/currency';
import {useUiCopy} from '../../i18n/useUiCopy';
import {partyFinancialErrorText} from '../../i18n/partyFinancialCopy';

type Props={
 row:PartyLedgerRow|null; source:PartySourceRecord|null; mode:'edit'|'reverse';
 onClose:()=>void;
 onEdit:(sourceId:string,payload:PartyPaymentPayload,reason:string)=>void;
 onReverse:(sourceId:string,reason:string)=>void;
};
const defaultSplits=(source:PartySourceRecord|null):FinancePaymentDraft[]=>{
 if(source?.paymentSplits?.length)return source.paymentSplits.map(x=>({...x,amount:String(x.amount)}));
 return [{id:'edit-split',method:'Cash',accountId:'acc-cash',amount:String(source?.amountPaid??0)}];
};
export function PartyTransactionDialog({row,source,mode,onClose,onEdit,onReverse}:Props){
 const {text,language}=useUiCopy();
 const [date,setDate]=useState('');
 const [amount,setAmount]=useState('');
 const [discount,setDiscount]=useState('');
 const [reason,setReason]=useState('');
 const [splits,setSplits]=useState<FinancePaymentDraft[]>([]);
 const [review,setReview]=useState(false);
 const [error,setError]=useState('');
 useEffect(()=>{
  if(row&&source){
   setDate(source.date);setAmount(String(source.amountPaid??0));
   setDiscount(String(source.discount??0));setReason('');
   setSplits(defaultSplits(source));setReview(false);setError('');
  }
 },[row?.id,source?.id,mode]);
 const changed=()=>{
  if(!row||!source)return;
  setError('');
  if(!reason.trim()){setError(text('An audit reason is required.','কেন সংশোধন করছেন তা লিখুন।'));return;}
  if(mode==='reverse'){
   if(!review){setReview(true);return;}
   try{onReverse(source.id,reason.trim());onClose();}catch(e){setError(e instanceof Error?partyFinancialErrorText(language,e.message):text('Cannot reverse source.','লেনদেন উল্টো করা যায়নি।'));setReview(false);}
   return;
  }
  const money=Number(amount);
  const rebate=Number(discount)||0;
  const normalized:PartyMoneySplit[]=splits.map(item=>({...item,amount:Number(item.amount)}));
  if(!Number.isFinite(money)||money<=0||!Number.isFinite(rebate)||rebate<0){
   setError(text('Enter a valid payment amount and discount.','পেমেন্টের টাকা ও ছাড়ের সঠিক পরিমাণ লিখুন।'));return;
  }
  if(normalized.some(x=>!Number.isFinite(x.amount)||x.amount<=0)||
   Math.abs(normalized.reduce((sum,x)=>sum+x.amount,0)-money)>0.001){
   setError(text('Payment sources must add up to the amount.','সব মাধ্যমের টাকার যোগফল মূল টাকার সমান হতে হবে।'));return;
  }
  if(!review){setReview(true);return;}
  const payload:PartyPaymentPayload={partyId:source.partyId,
   relationship:source.relationship as 'Customer'|'Supplier',date,amount:money,discount:rebate,
   reason:reason.trim(),invoiceId:source.invoiceId,splits:normalized};
  try{onEdit(source.id,payload,reason.trim());onClose();}
  catch(e){setError(e instanceof Error?partyFinancialErrorText(language,e.message):text('Correction rejected.','সংশোধন গ্রহণ করা হয়নি।'));setReview(false);}
 };
 const isPayment=source?.kind==='customer-payment'||source?.kind==='supplier-payment';
 return <Dialog open={!!row} onOpenChange={open=>!open&&onClose()}>
  <DialogContent role="dialog" aria-modal="true" aria-label={text("Party transaction editor","লেনদেন সংশোধন")}
    className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
   <DialogHeader>
    <DialogTitle>{mode==='reverse'?text('Reverse source transaction','মূল লেনদেন উল্টো করুন'):text('Edit payment source','পেমেন্ট সংশোধন')}</DialogTitle>
    <DialogDescription>{row?.reference??row?.id} · {row?.date} · {taka((row?.debit||row?.credit)||0)}.
     {text('This changes only the audited preview source, never the original Sales or Purchase transaction.','এটি শুধু যাচাইকৃত নমুনা রেকর্ড বদলাবে। আসল বিক্রি বা ক্রয় বদলাবে না।')}</DialogDescription>
   </DialogHeader>
   {row&&source&&<div className="space-y-3 text-sm">
    <p className="rounded-md bg-ink-50 p-3 text-xs text-ink-600">
      {mode==='reverse'?text('Reversal excludes this source from clean ledgers and rechecks later credit refunds.','উল্টো করলে খাতায় এই লেনদেন বাদ যাবে; পরের অগ্রিম ফেরতের হিসাব আবার মিলবে।'):text('Update payment details; all later settlements and refundable credit will be recalculated.','পেমেন্ট সংশোধনে পরের দেনা-পাওনা ও ফেরতযোগ্য অগ্রিম আবার গণনা হবে।')}
    </p>
    {mode==='edit'&&isPayment&&<>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-xs font-medium" >{text('Corrected date','সংশোধিত তারিখ')}
          <AppDatePicker label={text("Corrected payment date","সংশোধিত পেমেন্টের তারিখ")} value={date}
            onChange={value=>{setDate(value);setReview(false);}}/>
        </label>
        <label className="space-y-1 text-xs font-medium" >{text('Corrected amount','সংশোধিত টাকা')}
          <Input aria-label={text("Corrected payment amount","সংশোধিত পেমেন্টের টাকা")} inputMode="decimal" value={amount}
            onChange={e=>{setAmount(e.target.value);if(splits.length===1)
              setSplits(current=>current.map(x=>({...x,amount:e.target.value})));setReview(false);}}/>
        </label>
        <label className="space-y-1 text-xs font-medium" >{text('Discount','ছাড়')}
          <Input aria-label={text("Corrected discount","সংশোধিত ছাড়")} inputMode="decimal" value={discount}
            onChange={e=>{setDiscount(e.target.value);setReview(false);}}/>
        </label>
      </div>
      <FinancePaymentSplitEditor accounts={financeAccounts} rows={splits} totalAmount={Number(amount)||0}
        onChange={value=>{setSplits(value);setReview(false);}}/>
    </>}
    <label className="block space-y-1 text-xs font-medium" >{text('Correction reason (required)','সংশোধনের কারণ (আবশ্যক)')}
      <Input aria-label={text("Correction reason","সংশোধনের কারণ")} value={reason}
        onChange={e=>{setReason(e.target.value);setReview(false);}}/>
    </label>
    {review&&<div role="status" className="rounded-lg border border-warning bg-warning-bg p-3 text-xs text-ink">
      <p className="font-semibold">{text('Confirm audit-impacting','এই পরিবর্তন নিশ্চিত করুন')} {mode==='edit'?text('correction','সংশোধন'):text('reversal','উল্টো লেনদেন')}</p>
      <p>{text('Source','উৎস')} {source.reference??source.id} · {taka(source.amountPaid??Math.abs(source.debit-source.credit))}</p>
      {mode==='edit'&&<p>{text('New amount','নতুন টাকা')} {taka(Number(amount)||0)} · {text('Discount','ছাড়')} {taka(Number(discount)||0)}</p>}
      <p>{text('Reason:','কারণ:')} {reason}</p>
    </div>}
    {error&&<p role="alert" className="rounded-md bg-danger-bg p-2 text-xs text-danger">{error}</p>}
    <div className="flex justify-end gap-2">
      <Button variant="outline" onClick={onClose}>{text('Cancel','বাতিল')}</Button>
      <Button onClick={changed}>{review
       ?mode==='edit'?text('Confirm correction','সংশোধন নিশ্চিত করুন'):text('Confirm reversal','উল্টো লেনদেন নিশ্চিত করুন')
       :mode==='edit'?text('Review correction','সংশোধন যাচাই'):text('Review reversal','উল্টো লেনদেন যাচাই')}</Button>
    </div>
   </div>}
  </DialogContent>
 </Dialog>;
}
