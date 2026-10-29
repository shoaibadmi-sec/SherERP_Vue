import {useEffect,useState,type FormEvent} from 'react';
import {Dialog,DialogContent,DialogDescription,DialogFooter,DialogHeader,DialogTitle} from '../Dialog';
import {Button} from '../Button';
import {Input} from '../Input';
import {useUiCopy} from '../../i18n/useUiCopy';
import {quickAddPartyPreview} from '../../data/partyPreviewStore';
import type {Party} from '../../types/erp';

/** Reuse the canonical Party preview quick-add, not a second POS-only customer record. */
export function InstallmentCustomerQuickAddDialog({open,onClose,onSaved,initialName='',initialPhone='',initialAddress=''}:{
  open:boolean;onClose:()=>void;onSaved:(party:Party)=>void;
  initialName?:string;initialPhone?:string;initialAddress?:string;
}){
  const {text}=useUiCopy();
  const [name,setName]=useState(initialName);
  const [phone,setPhone]=useState(initialPhone);
  const [area,setArea]=useState(initialAddress);
  const [error,setError]=useState('');
  useEffect(()=>{
    if(!open)return;
    setName(initialName);setPhone(initialPhone);setArea(initialAddress);setError('');
  },[open,initialName,initialPhone,initialAddress]);
  const submit=(event:FormEvent)=>{
    event.preventDefault();
    const digits=phone.replace(/\D/g,'');
    if(!name.trim()){setError(text('Enter customer name.','ক্রেতার নাম লিখুন।'));return;}
    if(digits.length<10||digits.length>15){
      setError(text('Enter a valid customer phone number.','ক্রেতার সঠিক ফোন নম্বর দিন।'));return;
    }
    try{
      const result=quickAddPartyPreview({name:name.trim(),phone:phone.trim(),area:area.trim(),roles:['Customer']});
      onSaved(result.party);
      onClose();
    }catch(err){
      setError(err instanceof Error?err.message:text('Could not save the customer.','ক্রেতার তথ্য রাখা যায়নি।'));
    }
  };
  return <Dialog open={open} onOpenChange={value=>{if(!value)onClose();}}>
    <DialogContent className="max-h-[92dvh] w-[calc(100vw-1rem)] overflow-y-auto sm:max-w-md"
      aria-label={text('Quick add customer','নতুন ক্রেতা যোগ করুন')}>
      <DialogHeader>
        <DialogTitle>{text('Quick add customer','নতুন ক্রেতা যোগ করুন')}</DialogTitle>
        <DialogDescription>{text('Add a customer without leaving this sale. Saved to the Party preview list only.','কিস্তির জন্য ক্রেতা যোগ করুন। শুধু প্রিভিউ পার্টি তালিকায় থাকবে।')}</DialogDescription>
      </DialogHeader>
      <form onSubmit={submit} className="space-y-3">
        <label className="block space-y-1 text-xs font-medium text-ink-700">
          {text('Customer name','ক্রেতার নাম')} *
          <Input aria-label={text('Customer name','ক্রেতার নাম')} value={name}
            onChange={event=>setName(event.target.value)} autoFocus required className="h-9"/>
        </label>
        <label className="block space-y-1 text-xs font-medium text-ink-700">
          {text('Phone','ফোন')} *
          <Input aria-label={text('Phone','ফোন')} type="tel" inputMode="tel"
            value={phone} onChange={event=>setPhone(event.target.value)} required className="h-9"/>
        </label>
        <label className="block space-y-1 text-xs font-medium text-ink-700">
          {text('Address','ঠিকানা')}
          <Input aria-label={text('Address','ঠিকানা')} value={area}
            onChange={event=>setArea(event.target.value)} className="h-9"/>
        </label>
        {error&&<p className="text-xs text-danger" role="alert">{error}</p>}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>{text('Cancel','বাতিল')}</Button>
          <Button type="submit">{text('Save customer','ক্রেতা সংরক্ষণ')}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
