import {useEffect,useState} from 'react';
import {Plus,Trash2} from 'lucide-react';
import {Button} from '../Button';
import {Input} from '../Input';
import {AppSelect} from '../AppSelect';
import {AppDatePicker} from '../AppDateRangePicker';
import {Dialog,DialogContent,DialogDescription,DialogHeader,DialogTitle} from '../Dialog';
import {taka} from '../../utils/currency';
import {businessToday} from '../../utils/dateRange';
import {financeAccounts} from '../../data/financeAccounts';
import {dispatchVendorPreview,getVendorPreviewSnapshot} from '../../vendor/vendorPreviewStore';
import {sourceOutstanding} from '../../vendor/vendorModel';
import type {VendorSource,VendorSettlementKind} from '../../vendor/vendorTypes';
import {products} from '../../data/products';

export type VendorActionMode='details'|'quote'|'pay'|'return'|'receive-money'|'receive-goods';
type Props={source:VendorSource|null;mode?:VendorActionMode;onClose:()=>void;inline?:boolean};
type SplitDraft={id:string;accountId:string;amount:string};
const accounts=financeAccounts.filter(a=>a.status==='Active'&&['Cash','Bank','Mobile Banking'].includes(a.type));
const defaultAccount=accounts[0]?.id??'';
const toPaisa=(value:string,label:string):number=>{
 const n=Number(value);
 if(!value.trim()||!Number.isFinite(n)||n<=0||!Number.isSafeInteger(Math.round(n*100))
   ||Math.abs(n-Math.round(n*100)/100)>0.0000001)
  throw new Error(label+' must be positive with at most two decimal places.');
 return Math.round(n*100);
};

/** Shared source-linked Vendor settlement. No second amount input: account rows are authoritative. */
export function VendorActionDialog({source,mode='details',onClose,inline=false}:Props){
 const product=products.find(p=>p.id===source?.productId);
 const [price,setPrice]=useState('');
 const [qty,setQty]=useState('');
 const [splits,setSplits]=useState<SplitDraft[]>([{id:'primary',accountId:defaultAccount,amount:''}]);
 const [error,setError]=useState('');
 const [date,setDate]=useState(businessToday());
 const [note,setNote]=useState('');
 const isMoney=mode==='pay'||mode==='receive-money';
 const outstanding=source?sourceOutstanding(getVendorPreviewSnapshot(),source.id):null;
 const duePaisa=outstanding?.monetaryDuePaisa??0;
 // A source/mode change resets the form. The full amount is suggested but editable.
 useEffect(()=>{
  const active=source?sourceOutstanding(getVendorPreviewSnapshot(),source.id).monetaryDuePaisa:0;
  setPrice('');setQty('');setError('');setDate(businessToday());setNote('');
  setSplits([{id:'primary',accountId:defaultAccount,amount:
    (mode==='pay'||mode==='receive-money')&&active?String(active/100):''}]);
 },[source?.id,mode]);
 const amountPaisa=splits.reduce((sum,row)=>{
  const num=Number(row.amount);
  return sum+(!row.amount.trim()||!Number.isFinite(num)?0:Math.round(num*100));
 },0);
 const submit=()=>{
  if(!source)return;
  try{
   const state=getVendorPreviewSnapshot();
   const op='vendor-'+mode+'-'+source.id+'-'+state.revision;
   if(mode==='quote'){
    dispatchVendorPreview({type:'set-source-price',operationId:op,vendorPartyId:source.vendorPartyId,
     sourceId:source.id,unitCostBasePaisa:toPaisa(price,'Vendor unit cost'),
     date:date,reason:'Agreed Vendor price'});
   }else if(mode==='pay'||mode==='receive-money'||mode==='return'||mode==='receive-goods'){
    const count=isMoney?undefined:Number(qty);
    if(!isMoney&&(!Number.isFinite(count)||count!<=0))
     throw new Error('Enter a positive matching product quantity.');
    const paymentSplits=isMoney?splits.filter(x=>x.amount.trim()).map((split,i)=>{
     const account=accounts.find(a=>a.id===split.accountId);
     if(!account)throw new Error('Choose a valid payment account.');
     return {id:split.id+'-'+i,accountId:account.id,
      method:account.type as 'Cash'|'Bank'|'Mobile Banking',
      amountPaisa:toPaisa(split.amount,'Account amount')};
    }):undefined;
    const paidPaisa=isMoney?paymentSplits!.reduce((sum,row)=>sum+row.amountPaisa,0):null;
    if(isMoney&&(paidPaisa!<=0||paidPaisa!>duePaisa))
     throw new Error('Payment must be greater than zero and cannot exceed the source due.');
    const returnPaisa=isMoney?null:source.unitCostBasePaisa===null
     ?null:Math.round(count!*source.unitCostBasePaisa);
    const kind:VendorSettlementKind=mode==='return'?'return-to-vendor':
     mode==='receive-goods'?'receive-goods':mode;
    dispatchVendorPreview({type:'settle-source',operationId:op,vendorPartyId:source.vendorPartyId,
     side:kind==='pay'||kind==='return-to-vendor'?'payable':'receivable',
     kind,date,amountPaisa:paidPaisa??returnPaisa,
     allocations:[{sourceId:source.id,amountPaisa:paidPaisa??returnPaisa,baseQty:count}],
     paymentSplits,reason:note.trim()||(isMoney?'Vendor cash settlement':'Matching products returned')});
   }
   setError('');onClose();
  }catch(err){setError(err instanceof Error?err.message:'Vendor action failed.');}
 };
 const isReadOnly=mode==='details';
 const title=mode==='details'?'Vendor source details':mode==='quote'?'Set Price · দাম ঠিক করুন':
  mode==='pay'?'Pay Money · টাকা দিন':mode==='return'?'Return Products · পণ্য ফেরত':
  mode==='receive-money'?'Receive Money · টাকা নিন':'Receive Products · পণ্য ফেরত নিন';
 const body=<>
   {!inline&&<DialogHeader>
    <DialogTitle>{title}</DialogTitle>
    <DialogDescription>Record against the selected Vendor memo.</DialogDescription>
   </DialogHeader>}
   {source&&<div className="space-y-3 text-sm">
    {!inline&&<div className="rounded-lg border border-border bg-ink-50/40 p-3 text-xs">
      <div className="flex flex-wrap justify-between gap-2">
       <span className="font-semibold text-ink">{source.reference??source.id}</span>
       <span className="text-ink-500">{source.date}</span>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
       <span>{product?.name??source.productId} · {source.baseQty} {product?.unit??'units'}</span>
       <strong className="text-right">{outstanding?.monetaryDuePaisa===null?'Price not set':taka(duePaisa/100)}</strong>
      </div>
      {isReadOnly&&<p className="mt-2 text-ink-500">Returned: {outstanding?.returnedBaseQty??0} · Unpriced: {outstanding?.unpricedBaseQty??0} {product?.unit??'units'}</p>}
     </div>}
    {mode==='quote'&&<label className="block space-y-1 text-xs font-medium text-ink">
      Vendor unit cost per {product?.unit??'base unit'}
      <Input aria-label={'Vendor cost per '+(product?.unit??'base unit')} value={price}
       inputMode="decimal" onChange={e=>setPrice(e.target.value)}/>
      <span className="block text-[11px] font-normal text-ink-500">Applies to {outstanding?.unpricedBaseQty??0} unreturned units.</span>
    </label>}
    {isMoney&&<>
      <div className="flex items-center justify-between gap-2">
       <span className="text-xs font-semibold text-ink">Payment Accounts <span className="font-bn font-normal text-ink-500">· পেমেন্টের মাধ্যম</span></span>
       {splits.length===1&&<Button type="button" size="sm" variant="outline"
        onClick={()=>setSplits([{id:'primary',accountId:splits[0]?.accountId??defaultAccount,amount:String(duePaisa/100)}])}>
        Use full amount · পুরো টাকা
       </Button>}
      </div>
      <div className="space-y-2">
       {splits.map((split,i)=><div key={split.id} className="grid grid-cols-[minmax(0,1fr)_minmax(95px,120px)_auto] items-center gap-2">
        <AppSelect label={'Payment account '+(i+1)} value={split.accountId}
         options={accounts.map(a=>({value:a.id,label:a.name}))}
         onChange={accountId=>setSplits(prev=>prev.map(row=>row.id===split.id?{...row,accountId}:row))}/>
        <Input aria-label={'Split amount '+(i+1)} inputMode="decimal" value={split.amount}
         placeholder="৳0" className="text-right"
         onChange={e=>setSplits(prev=>prev.map(row=>row.id===split.id?{...row,amount:e.target.value}:row))}/>
        {splits.length>1?<Button type="button" size="sm" variant="ghost" aria-label={'Remove account '+(i+1)}
          onClick={()=>setSplits(prev=>prev.filter(row=>row.id!==split.id))}><Trash2 className="size-4"/></Button>:
          <span className="w-8" aria-hidden="true"/>}
       </div>)}
       <Button type="button" size="sm" variant="outline" onClick={()=>setSplits(prev=>[
        ...prev,{id:'split-'+Date.now()+'-'+prev.length,accountId:defaultAccount,amount:''}])}>
        <Plus className="size-3.5"/> Add account</Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1.5 text-xs font-medium text-ink">
          Date · তারিখ
          <AppDatePicker label="Vendor settlement date" value={date} onChange={setDate}/>
        </label>
        <label className="block space-y-1.5 text-xs font-medium text-ink">
          Note (optional) · মন্তব্য
          <Input aria-label="Vendor settlement note" value={note} onChange={e=>setNote(e.target.value)}
           placeholder="e.g. bKash TrxID"/>
        </label>
      </div>
      <div className="grid grid-cols-2 gap-2 rounded-lg border border-border bg-ink-50/40 p-3 text-xs">
       <div><span className="block text-ink-500">Total {mode==='receive-money'?'received':'paid'}</span>
        <strong className="text-base text-ink">{taka(amountPaisa/100)}</strong></div>
       <div className="text-right"><span className="block text-ink-500">After payment</span>
        <strong className="text-base text-ink">{amountPaisa>duePaisa?'Exceeds due':taka((duePaisa-amountPaisa)/100)}</strong></div>
      </div>
    </>}
    {(mode==='return'||mode==='receive-goods')&&<label className="block space-y-1 text-xs font-medium text-ink">
      Matching product quantity · ফেরত পণ্য
      <Input aria-label="Return matching quantity" value={qty} inputMode="decimal" onChange={e=>setQty(e.target.value)}/>
      <span className="block text-[11px] font-normal text-ink-500">Return the same product: {product?.name??source.productId}.</span>
     </label>}
    {error&&<p role="alert" className="rounded-lg bg-danger-bg p-2 text-xs text-danger">{error}</p>}
   </div>}
   <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
    <span className="text-[11px] text-ink-500">{isMoney?'Account amounts are added automatically.':''}</span>
    <div className="flex gap-2">
     {!inline&&<Button size="sm" variant="outline" onClick={onClose}>Close</Button>}
     {!isReadOnly&&<Button size="sm" onClick={submit}>
      {mode==='quote'?'Confirm Price':mode==='pay'?'Save Payment':
       mode==='return'?'Save Return':mode==='receive-money'?'Save Receipt':'Save Goods Receipt'}
     </Button>}
    </div>
   </div>
  </>;
 return inline?<section role="region" aria-label="Vendor settlement workspace" className="space-y-3">{body}</section>:
  <Dialog open={!!source} onOpenChange={v=>!v&&onClose()}>
   <DialogContent role="dialog" aria-label={isReadOnly?'Vendor source details':'Vendor settlement'}
    className="max-h-[92vh] overflow-y-auto sm:max-w-md">{body}</DialogContent>
  </Dialog>;
}
