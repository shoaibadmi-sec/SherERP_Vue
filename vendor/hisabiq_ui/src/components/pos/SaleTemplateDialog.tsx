import {useEffect,useRef,useState} from 'react';
import {toast} from 'sonner';
import {Button} from '../Button';
import {Input} from '../Input';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription,DialogFooter} from '../Dialog';
import {CartTable} from './CartTable';
import {CustomerPicker} from './CustomerPicker';
import {usePosCart} from '../../hooks/usePosCart';
import {usePreviewCatalog} from '../../bundles/usePreviewCatalog';
import {availableParties} from '../../data/erpDemoStore';
import {saveSaleTemplate} from '../../data/salesPreviewStore';
import {cartFromPreset,templateCart} from '../../utils/salePresets';
import {taka} from '../../utils/currency';
import {useUiCopy} from '../../i18n/useUiCopy';
import type {SaleTemplate} from '../../types/erp';

/** Same POS cart/picker/quantity editor; templates never collect money or reserve stock. */
export function SaleTemplateDialog({template,onClose}:{template:SaleTemplate|null;onClose:()=>void}) {
  const {text}=useUiCopy();
  const products=usePreviewCatalog();
  const cart=usePosCart(()=>cartFromPreset(template?.lines??[],products));
  const [name,setName]=useState(template?.name??'');
  const [error,setError]=useState('');
  const [customerChanged,setCustomerChanged]=useState(false);
  const initialized=useRef(false);
  const searchRef=useRef<HTMLInputElement>(null);
  const nameRef=useRef<HTMLInputElement>(null);
  useEffect(()=>{
    if(initialized.current)return;
    initialized.current=true;
    const matches=availableParties().filter(p=>p.roles.includes('Customer')&&p.status!=='Inactive'&&
      (template?.customerId?p.id===template.customerId:p.name===template?.customer));
    cart.setCustomer(matches.length===1?matches[0]:null);
  },[cart,template]);
  let preview:ReturnType<typeof templateCart>|null=null;
  try{preview=templateCart(cart.lines);}catch{/* Show errors on Save, keep partially entered cart intact. */}
  const missingSource=Boolean(template&&template.lines.some(line=>!products.some(product=>product.id===line.productId&&
    (line.unit===product.unit||line.unit===product.altUnit?.unit))));
  const save=()=>{
    if(!name.trim()){setError(text('Enter a template name.','নমুনার নাম লিখুন।'));nameRef.current?.focus();return;}
    if(missingSource){setError(text('A source product is unavailable. Restore it before editing this template.','আগের একটি পণ্য পাওয়া যাচ্ছে না। নমুনা বদলানোর আগে পণ্যটি ফিরিয়ে আনুন।'));return;}
    if(!preview){setError(text('Add products and check quantities, units and prices.','পণ্য যোগ করুন এবং পরিমাণ, একক ও দাম যাচাই করুন।'));return;}
    try{
      const customer=cart.customer?{customerId:cart.customer.id,customer:cart.customer.name}:
        !customerChanged&&template?.customer?{customer:template.customer,customerId:template.customerId}:{};
      saveSaleTemplate({name,...preview,...customer},template??undefined);
      toast.success(text('Template saved in this preview session','এই প্রিভিউ সেশনে নমুনা রাখা হয়েছে'));
      onClose();
    }catch(cause){setError(cause instanceof Error?cause.message:text('Could not save template.','নমুনা রাখা যায়নি।'));}
  };
  return <Dialog open onOpenChange={open=>{if(!open)onClose();}}>
    <DialogContent className="max-h-[92dvh] w-[calc(100vw-1rem)] overflow-y-auto sm:max-w-6xl">
      <DialogHeader>
        <DialogTitle>{template?text('Edit template','নমুনা বদলান'):text('New sale template','বিক্রির নতুন নমুনা')}</DialogTitle>
        <DialogDescription>{text('Reuse a planned cart in POS. Saved for this preview session; no stock, cash or ledger posting.','এই কার্ট দিয়ে পরে পস-এ বিক্রি শুরু করুন। এই প্রিভিউ সেশনে থাকবে; স্টক, টাকা বা খাতায় জমা হবে না।')}</DialogDescription>
      </DialogHeader>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-medium text-ink">{text('Template name','নমুনার নাম')}
          <Input ref={nameRef} autoFocus value={name} onChange={event=>setName(event.target.value)} className="mt-1" aria-invalid={Boolean(error&&!name.trim())}/>
        </label>
        <div className="space-y-1"><p className="text-xs font-medium text-ink">{text('Customer (optional)','ক্রেতা (ঐচ্ছিক)')}</p>
          <CustomerPicker value={cart.customer} onChange={value=>{setCustomerChanged(true);cart.setCustomer(value);}}/>
        </div>
      </div>
      <CartTable lines={cart.lines} lastAdded={cart.lastAdded} onAdd={cart.addProduct} onUpdate={cart.updateLine}
        onRemove={cart.removeLine} onReorder={cart.reorderLines} onMove={cart.moveLine} searchRef={searchRef}/>
      {error&&<p role="alert" className="text-xs text-danger">{error}</p>}
      <DialogFooter className="items-center">
        <p className="mr-auto text-sm font-semibold">{text('Planned total','পরিকল্পিত মোট')}: {preview?taka(preview.total):'—'}</p>
        <Button variant="outline" onClick={onClose}>{text('Cancel','বাতিল')}</Button>
        <Button onClick={save}>{text('Save template','নমুনা রাখুন')}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}
