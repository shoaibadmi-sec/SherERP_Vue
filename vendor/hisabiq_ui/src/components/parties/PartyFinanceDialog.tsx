import { useEffect, useState } from 'react';
import { Check, Landmark } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../Dialog';
import { Button } from '../Button';
import { Input } from '../Input';
import { AppDatePicker } from '../AppDateRangePicker';
import { AppSelect } from '../AppSelect';
import { FinancePaymentSplitEditor, type FinancePaymentDraft } from '../finance/FinancePaymentSplitEditor';
import { financeAccounts, type FinanceTransactionType } from '../../data/financeAccounts';
import { businessToday } from '../../utils/dateRange';
import { financeTypeMeta, type FinanceRole } from '../../utils/partyFinance';
import { validateBusinessDate, validatePartySplits, toPaisa } from '../../utils/partyPayment';
import type { Party } from '../../types/erp';
import type { PartyFinancePayload, PartyMoneySplit } from '../../types/partyLedger';
import { taka } from '../../utils/currency';
import { AmountInWordsDisplay } from '../AmountInWordsDisplay';
import {useUiCopy} from '../../i18n/useUiCopy';
import {financeLabel} from '../../i18n/financeCopy';
import {partyFinancialErrorText} from '../../i18n/partyFinancialCopy';

type Props={open:boolean;party:Party;relationship:FinanceRole;initialType?:FinanceTransactionType;onClose:()=>void;onSubmit:(payload:PartyFinancePayload)=>void};
const available:Record<FinanceRole,FinanceTransactionType[]>={
 Owner:['Owner Credit','Owner Debit','Opening Owner Capital'],
 Lender:['Lender Credit','Lender Debit','Opening Loan'],
 Borrower:['Borrower Debit','Borrower Credit','Opening Borrower Loan']
};
const initial=():FinancePaymentDraft[]=>[{id:'cash-1',method:'Cash',accountId:'acc-cash',amount:''}];
export function PartyFinanceDialog({open,party,relationship,initialType,onClose,onSubmit}:Props){
 const {text,language,showHelper}=useUiCopy();
 const [type,setType]=useState<FinanceTransactionType>(available[relationship][0]);
 const [date,setDate]=useState(businessToday());
 const [amount,setAmount]=useState('');
 const [splits,setSplits]=useState<FinancePaymentDraft[]>(initial);
 const [reference,setReference]=useState('');
 const [note,setNote]=useState('');
 const [review,setReview]=useState(false);
 const [error,setError]=useState('');
 useEffect(()=>{
  if(open){setType(initialType&&available[relationship].includes(initialType)?initialType:available[relationship][0]);setDate(businessToday());setAmount('');
   setSplits(initial());setReference('');setNote('');setReview(false);setError('');}
 },[open,party.id,relationship,initialType]);
 const meta=financeTypeMeta[type];
 const opening=!!meta?.opening;
 const money=Number(amount);
 const paymentSplits:PartyMoneySplit[]=opening?[]:splits.map(item=>({
  id:item.id,method:item.method,accountId:item.accountId,amount:Number(item.amount)
 }));
 const changeType=(next:string)=>{setType(next as FinanceTransactionType);setReview(false);setError('');};
 const submit=()=>{
  setError('');
  try{
   validateBusinessDate(date);
   if(!Number.isFinite(money)||toPaisa(money,'Finance amount')<=0)
     throw new Error('Finance amount must be greater than zero.');
   if(!meta||meta.role!==relationship)throw new Error('Invalid finance relationship and type.');
   if(!opening)validatePartySplits(paymentSplits,money);
   if(!review){setReview(true);return;}
   onSubmit({partyId:party.id,relationship,financeType:type,amount:money,date,
    reference:reference.trim()||undefined,note:note.trim()||undefined,splits:paymentSplits});
   onClose();
  }catch(e){setError(partyFinancialErrorText(language,e instanceof Error?e.message:'Cannot record finance transaction.'));setReview(false);}
 };
 return <Dialog open={open} onOpenChange={next=>!next&&onClose()}>
  <DialogContent role="dialog" aria-modal="true" aria-label={text("Party finance transaction","ঋণ বা মূলধনের লেনদেন")}
    className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
   <DialogHeader>
    <DialogTitle>{text('Record finance transaction','মূলধন / ঋণের লেনদেন লিখুন')} {showHelper&&<span className="font-bn text-sm font-normal text-ink-500">মূলধন / ঋণ</span>}</DialogTitle>
    <DialogDescription>{text('Choose capital, lending or borrowing entry. This is a business preview, not a real money transfer.','মূলধন, ধার দেওয়া বা নেওয়ার ধরন বাছুন। এটি শুধু নমুনা; আসল টাকা সরবে না।')}</DialogDescription>
   </DialogHeader>
   <div className="space-y-3 text-sm">
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-ink-50 p-3">
      <div><strong>{party.name}</strong><p className="text-xs text-ink-500">{financeLabel(language,relationship)} · {party.phone}</p></div>
      <span className="text-xs text-ink-600">{text('Tenant finance preview','ব্যবসার নমুনা হিসাব')}</span>
    </div>
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="space-y-1 text-xs font-medium text-ink-700" >{text('Transaction type','লেনদেনের ধরন')}
        <AppSelect label={text("Finance transaction type","টাকার লেনদেনের ধরন")} value={type} onChange={changeType}
          options={available[relationship].map(value=>({value,label:financeLabel(language,value)}))}/>
      </label>
      <label className="space-y-1 text-xs font-medium text-ink-700" >{text('Business date','লেনদেনের তারিখ')}
        <AppDatePicker label={text("Finance transaction date","লেনদেনের তারিখ")} value={date} onChange={value=>{setDate(value);setReview(false);}}/>
      </label>
      <label className="space-y-1 text-xs font-medium text-ink-700" >{text('Amount','টাকা')}
        <Input aria-label={text("Finance amount","টাকার পরিমাণ")} inputMode="decimal" value={amount} placeholder="0.00"
          onChange={event=>{const value=event.target.value;setAmount(value);setReview(false);
            if(splits.length===1)setSplits(rows=>rows.map(row=>({...row,amount:value})));}}/>
      </label>
      <label className="space-y-1 text-xs font-medium text-ink-700" >{text('Reference (optional)','রেফারেন্স (ঐচ্ছিক)')}
        <Input aria-label={text("Finance reference","রেফারেন্স")} value={reference} onChange={e=>{setReference(e.target.value);setReview(false);}}/>
      </label>
    </div>
    {opening?<p role="note" className="rounded-lg bg-warning-bg p-3 text-xs text-warning">
      {text('Opening relationship balance only — no cash, bank or mobile account is affected.','শুধু শুরুর দেনা-পাওনা; ক্যাশ, ব্যাংক বা মোবাইল হিসাব বদলাবে না।')}
    </p>:<FinancePaymentSplitEditor accounts={financeAccounts} rows={splits}
      onChange={rows=>{setSplits(rows);setReview(false);}} totalAmount={Number(amount)||0}/>}
    <label className="block space-y-1 text-xs font-medium text-ink-700" >{text('Note','মন্তব্য')}
      <Input aria-label={text("Finance note","লেনদেনের মন্তব্য")} value={note} onChange={e=>{setNote(e.target.value);setReview(false);}}/>
    </label>
    {review&&<div role="status" className="rounded-lg border border-teal-300 bg-teal-50 p-3 text-xs text-teal-800">
      <strong>{text('Review finance transaction','লেনদেন যাচাই করুন')}</strong><p>{party.name} · {financeLabel(language,type)} · {date} · {taka(money)}</p>
      <AmountInWordsDisplay amount={money} />
      <p>{opening?text('Relationship balance only, no money movement','শুধু সম্পর্কের জের; টাকা সরবে না'):(meta?.direction==='in'?text('Money into business: ','ব্যবসায় টাকা আসবে: '):text('Money out of business: ','ব্যবসা থেকে টাকা যাবে: '))+taka(money)}</p>
      <p>{text('Records one auditable preview source only; no real money is moved.','শুধু প্রিভিউতে লেনদেনের ইতিহাসসহ একটি রেকর্ড যোগ হবে। আসল টাকা সরবে না।')}</p>
    </div>}
    {!!error&&<p role="alert" className="rounded-md bg-danger-bg p-2 text-xs text-danger">{error}</p>}
    <div className="flex justify-end gap-2">
      <Button variant="outline" onClick={onClose}>{text('Cancel','বাতিল')}</Button>
      <Button onClick={submit}>{review?<><Check className="size-4"/> {text('Confirm finance transaction','লেনদেন নিশ্চিত করুন')}</>:
       <><Landmark className="size-4"/> {text('Review finance transaction','লেনদেন যাচাই করুন')}</>}</Button>
    </div>
   </div>
  </DialogContent>
 </Dialog>;
}
