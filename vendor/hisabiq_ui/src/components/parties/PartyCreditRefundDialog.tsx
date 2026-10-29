import { useEffect, useState } from 'react';
import { ArrowLeftRight, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../Dialog';
import { Button } from '../Button';
import { Input } from '../Input';
import { AppDatePicker } from '../AppDateRangePicker';
import { FinancePaymentSplitEditor, type FinancePaymentDraft } from '../finance/FinancePaymentSplitEditor';
import { financeAccounts } from '../../data/financeAccounts';
import { businessToday } from '../../utils/dateRange';
import { customerSettlementAsOf, supplierSettlementAsOf } from '../../utils/partySettlement';
import type { PartySourceRecord, PartyRefundPayload } from '../../types/partyLedger';
import type { Party } from '../../types/erp';
import { taka } from '../../utils/currency';
import { AmountInWordsDisplay } from '../AmountInWordsDisplay';
import {useUiCopy} from '../../i18n/useUiCopy';
import {partyFinancialErrorText} from '../../i18n/partyFinancialCopy';

type Props={open:boolean;party:Party;relationship:'Customer'|'Supplier';sources:readonly PartySourceRecord[];
  onClose:()=>void;onSubmit:(payload:PartyRefundPayload)=>void};
export function PartyCreditRefundDialog({open,party,relationship,sources,onClose,onSubmit}:Props){
  const {text,language,showHelper}=useUiCopy();
  const [date,setDate]=useState(businessToday());
  const [value,setValue]=useState('');
  const [reason,setReason]=useState('');
  const [splits,setSplits]=useState<FinancePaymentDraft[]>([{id:'refund-1',method:'Cash',accountId:'acc-cash',amount:''}]);
  const [review,setReview]=useState(false);
  const [error,setError]=useState('');
  useEffect(()=>{if(open){setDate(businessToday());setValue('');setReason('');setReview(false);setError('');
    setSplits([{id:'refund-1',method:'Cash',accountId:'acc-cash',amount:''}]);}},[open,party.id,relationship]);
  let available=0,unknown=0,advance=0,returned=0;
  try{
    const state=relationship==='Customer'?customerSettlementAsOf(sources,party.id,date):supplierSettlementAsOf(sources,party.id,date);
    available=state.refundableCredit;unknown=state.unverifiedCredit;
    advance=state.cashBackedAdvance;returned=state.returnCredit;
  }catch{/* Invalid date is blocked at confirmation. */}
  const amount=Number(value)||0;
  const refundToCustomer=relationship==='Customer';
  const title=refundToCustomer?'Refund customer credit':'Receive supplier credit refund';
  const submit=()=>{
    setError('');
    const rows=splits.map(row=>({id:row.id,method:row.method,accountId:row.accountId,
      amount:row.amount.trim()===''&&splits.length===1?amount:Number(row.amount)}));
    const payload:PartyRefundPayload={partyId:party.id,relationship,date,amount,reason:reason.trim(),splits:rows};
    if(!review){
      if(!Number.isFinite(amount)||amount<=0||amount>available){setError(text('Refund amount must be positive and cannot exceed verified available credit on this date.','ফেরতের টাকা শূন্যের বেশি এবং এই তারিখের যাচাইকৃত অগ্রিমের মধ্যে থাকতে হবে।'));return;}
      if(!reason.trim()){setError(text('Enter a refund reason.','ফেরতের কারণ লিখুন।'));return;}
      if(rows.some(r=>!Number.isFinite(r.amount)||r.amount<=0)
        ||Math.abs(rows.reduce((sum,row)=>sum+row.amount,0)-amount)>0.001){
        setError(text('Select active money accounts and match the refund total.','চালু টাকার হিসাব বাছুন এবং সব টাকার যোগফল মিলিয়ে নিন।'));return;
      }
      setReview(true);return;
    }
    try{onSubmit(payload);onClose();}catch(e){setError(e instanceof Error?partyFinancialErrorText(language,e.message):text('Refund rejected.','ফেরত গ্রহণ করা যায়নি।'));setReview(false);}
  };
  return <Dialog open={open} onOpenChange={value=>!value&&onClose()}>
    <DialogContent role="dialog" aria-modal="true" aria-label={text("Party credit refund","অগ্রিম টাকা ফেরত")} className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>{text(title,refundToCustomer?'ক্রেতাকে অগ্রিম ফেরত':'সরবরাহকারীর কাছ থেকে অগ্রিম ফেরত নিন')} {showHelper&&<span className="font-bn text-sm font-normal text-ink-500">ক্রেডিট ফেরত</span>}</DialogTitle>
        <DialogDescription>{text('Credit availability is recalculated for the selected business date. Refunds only use verified money or return credit.','বাছা তারিখের অগ্রিম আবার হিসাব হবে। শুধু যাচাই করা টাকা বা ফেরতের অগ্রিম ফেরত দেওয়া যাবে।')}</DialogDescription>
      </DialogHeader>
      <div className="space-y-4 text-sm">
        <div className="rounded-lg bg-ink-50 p-3">
          <p className="text-sm font-semibold">{party.name} · {text(relationship,relationship==='Customer'?'ক্রেতা':'সরবরাহকারী')}</p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div><p className="text-[11px] text-ink-500">{text('Refundable','ফেরতযোগ্য')}</p><strong>{taka(available)}</strong></div>
            <div><p className="text-[11px] text-ink-500">{text('Cash-backed','জমা দেওয়া টাকা')}</p><strong>{taka(advance)}</strong></div>
            <div><p className="text-[11px] text-ink-500">{text('Return credit','পণ্য ফেরতের জমা')}</p><strong>{taka(returned)}</strong></div>
            <div><p className="text-[11px] text-ink-500">{text('Unverified (blocked)','যাচাই হয়নি (বন্ধ)')}</p><strong>{taka(unknown)}</strong></div>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-xs font-medium text-ink-700" >{text('Refund date','ফেরতের তারিখ')}
            <AppDatePicker label={text("Refund date","ফেরতের তারিখ")} value={date} onChange={v=>{setDate(v);setReview(false);}}/>
          </label>
          <label className="space-y-1 text-xs font-medium text-ink-700" >{text('Amount','টাকা')}
            <div className="flex gap-1">
              <Input aria-label={text("Credit refund amount","ফেরতের টাকা")} inputMode="decimal" value={value} onChange={e=>{
                setValue(e.target.value);setReview(false);
                if(splits.length===1)setSplits(current=>current.map(row=>({...row,amount:e.target.value})));
              }} placeholder="0.00"/>
              <Button size="sm" variant="outline" onClick={()=>{const a=String(available);setValue(a);
                if(splits.length===1)setSplits(current=>current.map(row=>({...row,amount:a})));setReview(false);}}>{text('All','সবটুকু')}</Button>
            </div>
          </label>
        </div>
        <label className="block space-y-1 text-xs font-medium text-ink-700" >{text('Reason (required)','কারণ (আবশ্যক)')}
          <Input aria-label={text("Credit refund reason","ফেরতের কারণ")} value={reason} onChange={e=>{setReason(e.target.value);setReview(false);}}
            placeholder={text("e.g. Returned unspent advance","যেমন: অব্যবহৃত অগ্রিম ফেরত")}/>
        </label>
        <FinancePaymentSplitEditor accounts={financeAccounts} rows={splits} onChange={v=>{setSplits(v);setReview(false);}} totalAmount={amount}/>
        <p className="text-xs text-ink-500">{refundToCustomer?text('Cash goes out of your business.','ব্যবসা থেকে টাকা যাবে।'):text('Cash comes into your business.','ব্যবসায় টাকা আসবে।')} {text('This is a preview record only, not a real bank posting.','শুধু নমুনা রেকর্ড; ব্যাংকে আসল লেনদেন নয়।')}</p>
        {review&&<div role="status" className="rounded-lg border border-teal-300 bg-teal-50 p-3 text-xs text-teal-800">
          <p className="font-semibold">{text('Confirm the refund','ফেরতের হিসাব নিশ্চিত করুন')}</p>
          <p>{text(title,refundToCustomer?'ক্রেতাকে অগ্রিম ফেরত':'সরবরাহকারী থেকে ফেরত')} · {date} · {taka(amount)} · {text('Credit remaining','বাকি অগ্রিম')} {taka(available-amount)}</p>
          <AmountInWordsDisplay amount={amount} />
        </div>}
        {!!error&&<p role="alert" className="rounded-md bg-danger-bg p-2 text-xs text-danger">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>{text('Cancel','বাতিল')}</Button>
          <Button disabled={!review&&available<=0} onClick={submit}>
            {review?<><Check className="size-4"/> {text('Confirm credit refund','ফেরত নিশ্চিত করুন')}</>:<><ArrowLeftRight className="size-4"/> {text('Review refund','ফেরত যাচাই করুন')}</>}
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>;
}
