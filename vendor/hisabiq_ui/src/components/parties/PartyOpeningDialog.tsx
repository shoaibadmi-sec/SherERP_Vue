import React,{useEffect,useState} from 'react';
import {BookOpen} from 'lucide-react';
import {Dialog,DialogContent,DialogDescription,DialogHeader,DialogTitle} from '../Dialog';
import {Button} from '../Button';
import {Input} from '../Input';
import {AppDatePicker} from '../AppDateRangePicker';
import {businessToday} from '../../utils/dateRange';
import {useUiCopy} from '../../i18n/useUiCopy';
import {partyRoleLabel,partyOpeningDirectionLabel} from '../../i18n/partyCopy';
import {taka} from '../../utils/currency';
import type {Party,PartyRole} from '../../types/erp';
import type {PartyOpeningPayload,PartySourceRecord} from '../../types/partyLedger';

export const openingDirectionLabels=(role:PartyRole)=>({
 debit:role==='Customer'?'Customer owes us · কাস্টমারের কাছে পাওনা'
  :role==='Supplier'?'Supplier owes us (advance) · সরবরাহকারীর কাছে পাওনা'
  :role==='Borrower'?'Borrower owes us · ঋণগ্রহীতার কাছে পাওনা'
  :'They owe us · আমাদের পাওনা',
 credit:role==='Customer'?'We owe customer · কাস্টমার আমাদের কাছে পাবে'
  :role==='Supplier'?'We owe supplier · সরবরাহকারীর পাওনা'
  :role==='Owner'?'We owe owner (capital) · মালিকের মূলধন'
  :role==='Lender'?'We owe lender · ঋণদাতার পাওনা'
  :'We owe them · আমাদের দেনা'
});
export const defaultOpeningSide=(role:PartyRole):'debit'|'credit'=>
 ['Supplier','Owner','Lender','Vendor','Payee'].includes(role)?'credit':'debit';

type Props={
 open:boolean;party:Party;relationship:PartyRole;
 existing?:PartySourceRecord;
 onClose:()=>void;onSubmit:(payload:PartyOpeningPayload)=>void;
};
export function PartyOpeningDialog({open,party,relationship,existing,onClose,onSubmit}:Props){
 const {text,language,showHelper}=useUiCopy();
 const roleLabel=partyRoleLabel(relationship,language);
 const [amount,setAmount]=useState('');
 const [side,setSide]=useState<'debit'|'credit'>(defaultOpeningSide(relationship));
 const [date,setDate]=useState(businessToday());
 const [note,setNote]=useState('');
 const [error,setError]=useState('');
 useEffect(()=>{
  if(open){
   setAmount(existing?String(existing.debit||existing.credit):'');
   setSide(existing?.credit?'credit':existing?.debit?'debit':defaultOpeningSide(relationship));
   setDate(existing?.date??businessToday());setNote('');setError('');
  }
 },[open,relationship,party.id,existing?.id]);
 const names=openingDirectionLabels(relationship);
 const submit=(e:React.FormEvent)=>{
  e.preventDefault();setError('');
  try{
   if(!amount.trim())throw new Error(text('Enter the opening balance, or 0 to clear it.','শুরুর জের লিখুন। আগের জের মুছতে ০ লিখুন।'));
   onSubmit({partyId:party.id,relationship,amount:Number(amount),side,date,note:note.trim()});
   onClose();
  }catch(e){setError(e instanceof Error?e.message:text('Could not save opening balance.','শুরুর জের রাখা যায়নি।'));}
 };
 return <Dialog open={open} onOpenChange={value=>!value&&onClose()}>
  <DialogContent role="dialog" aria-modal="true" aria-label={text("Party opening balance","পার্টির শুরুর জের")} className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
   <DialogHeader>
    <DialogTitle><BookOpen className="mr-1.5 inline size-4"/> {existing?text('Edit opening balance','শুরুর জের বদলান'):text('Set opening balance','শুরুর জের দিন')} {showHelper&&<span className="font-bn text-sm font-normal text-ink-500">প্রারম্ভিক জের</span>}</DialogTitle>
    <DialogDescription>{party.name} · {roleLabel} · {text('UI preview','শুধু প্রিভিউ')}</DialogDescription>
   </DialogHeader>
   <form onSubmit={submit} className="space-y-4" aria-label={text("Opening balance form","শুরুর জেরের ফরম")}>
    {existing&&<div className="rounded-md border border-border bg-ink-50 p-3 text-xs text-ink-600">
      {text('Current:','এখন আছে:')} <strong className="text-ink">{taka(existing.debit||existing.credit)} {existing.credit?'Cr':'Dr'}</strong> · {existing.date}
      <p className="mt-1">{text('A correction preserves the previous source and records an audit event.','সংশোধন করলে আগের হিসাবের তথ্য ও পরিবর্তনের ইতিহাস রাখা হবে।')}</p>
    </div>}
    <fieldset className="space-y-2">
     <legend className="text-xs font-semibold text-ink">{text('Balance direction','জেরের ধরন')} {showHelper&&<span className="font-bn font-normal text-ink-500">কার কাছে পাওনা?</span>}</legend>
     {(['debit','credit'] as const).map(value=><label key={value} className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-xs transition-colors ${side===value?'border-teal-500 bg-teal-50/60 dark:bg-teal-950/30':'border-border hover:bg-ink-50'}`}>
      <input type="radio" name="party-opening-side" checked={side===value} onChange={()=>setSide(value)} className="size-4 accent-teal-600"/>
      <span className="text-ink">{partyOpeningDirectionLabel(names[value],language)}</span><span className="ml-auto text-ink-500">{value==='debit'?'Dr':'Cr'}</span>
     </label>)}
    </fieldset>
    <div className="grid gap-3 sm:grid-cols-2">
     <label className="space-y-1 text-xs font-medium text-ink-700">{text('Amount (৳)','টাকার পরিমাণ (৳)')}
      <Input aria-label={text('Opening balance amount','শুরুর জেরের টাকা')} value={amount} inputMode="decimal" placeholder="0.00"
       onChange={e=>setAmount(e.target.value)} autoFocus/>
     </label>
     <div className="space-y-1 text-xs font-medium text-ink-700"><span>{text('Opening date','শুরুর তারিখ')}</span>
      <AppDatePicker label={text('Opening balance date','শুরুর জেরের তারিখ')} value={date} onChange={setDate}/>
     </div>
    </div>
    <label className="block space-y-1 text-xs font-medium text-ink-700">{text('Correction note (optional)','সংশোধনের নোট (ঐচ্ছিক)')}
     <Input aria-label={text('Opening balance note','শুরুর জেরের নোট')} value={note} maxLength={400} placeholder={text("As per old account book","আগের খাতা অনুযায়ী")} onChange={e=>setNote(e.target.value)}/>
    </label>
    <p role="note" className="rounded-md bg-ink-50 p-3 text-xs text-ink-600">
     {text('Opening balance changes the ledger only. No cash or bank payment is posted, and old credit is not automatically refundable. Enter 0 to clear an existing balance.','শুরুর জের শুধু খাতার হিসাব বদলায়। ক্যাশ বা ব্যাংকে কোনো টাকা জমা/খরচ হবে না। আগের জমা টাকা নিজে থেকে ফেরত দেওয়ার উপযোগী হবে না। পুরোনো জের মুছতে ০ লিখুন।')}
    </p>
    {error&&<p role="alert" className="rounded-md bg-danger-bg p-2 text-xs text-danger">{error}</p>}
    <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={onClose} >{text('Cancel','বাতিল')}</Button>
      <Button type="submit">{Number(amount)===0&&existing?text('Clear opening balance','শুরুর জের মুছুন'):text('Save opening balance','শুরুর জের রাখুন')}</Button></div>
   </form>
  </DialogContent>
 </Dialog>;
}
