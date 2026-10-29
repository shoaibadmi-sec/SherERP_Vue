import React,{useRef,useState} from 'react';
import {Plus,Trash2} from 'lucide-react';
import {toast} from 'sonner';
import {Button} from '../Button';
import {Input} from '../Input';
import {AppSelect} from '../AppSelect';
import {financeAccounts} from '../../data/financeAccounts';
import {businessToday} from '../../utils/dateRange';
import {taka} from '../../utils/currency';
import {getVendorPreviewSnapshot,dispatchVendorPreview} from '../../vendor/vendorPreviewStore';
import {sourceOutstanding} from '../../vendor/vendorModel';
import {products} from '../../data/products';
import type {VendorSource} from '../../vendor/vendorTypes';

type Split={id:string;accountId:string;amount:string};
type Props={source:VendorSource;onClose:()=>void;hideClose?:boolean};
const accounts=financeAccounts.filter(x=>x.status==='Active'&&['Cash','Bank','Mobile Banking'].includes(x.type));
const toPaisa=(s:string):number=>{
 if(!s.trim())return 0;
 const n=Number(s);const cents=Math.round(n*100);
 if(!Number.isFinite(n)||n<0||!Number.isSafeInteger(cents)||Math.abs(n-cents/100)>1e-7)
  throw new Error('Use a valid money amount with up to two decimal places.');
 return cents;
};
export function VendorClearDuePanel({source,onClose,hideClose=false}:Props){
 const [splits,setSplits]=useState<Split[]>([{id:'s1',accountId:accounts[0]?.id??'',amount:''}]);
 const nextId=useRef(1);
 const [returnQty,setReturnQty]=useState('');
 const [reason,setReason]=useState('');
 const [error,setError]=useState('');
 const outstanding=sourceOutstanding(getVendorPreviewSnapshot(),source.id);
 const product=products.find(p=>p.id===source.productId);
 const cash=splits.reduce((sum,row)=>sum+(Number(row.amount)||0),0);
 const goods=Number(returnQty)||0;
 const goodsValue=source.unitCostBasePaisa===null?0:goods*source.unitCostBasePaisa/100;
 const due=outstanding.monetaryDuePaisa===null?null:outstanding.monetaryDuePaisa/100;
 const priceMissing=source.unitCostBasePaisa===null;
 const stillOut=Math.max(0,source.baseQty-outstanding.returnedBaseQty);
 const ownedAvailable=Math.max(0,getVendorPreviewSnapshot().inventory?.[source.productId]??0);
 const maxByDue=priceMissing?stillOut:Math.max(0,Math.floor(((outstanding.monetaryDuePaisa??0)/source.unitCostBasePaisa)*1000)/1000);
 const maxReturn=Math.max(0,Math.min(stillOut,ownedAvailable,maxByDue));
 const afterThis=due===null?(Math.max(0,stillOut-goods)+' '+(product?.unit??'units')+' still out')
  :taka(Math.max(0,due-cash-goodsValue));
 const save=(event:React.FormEvent)=>{
  event.preventDefault();setError('');
  try{
   if(!Number.isFinite(goods)||goods<0)throw new Error('Enter a valid return quantity.');
   const paymentSplits=splits.filter(s=>s.amount.trim()).map(s=>{
    const a=accounts.find(x=>x.id===s.accountId);
    if(!a)throw new Error('Choose the account the money came from.');
    return {id:s.id,accountId:a.id,method:a.type as 'Cash'|'Bank'|'Mobile Banking',
     amountPaisa:toPaisa(s.amount)};
   });
   const cashPaisa=paymentSplits.reduce((sum,x)=>sum+x.amountPaisa,0);
   const state=getVendorPreviewSnapshot();
   dispatchVendorPreview({type:'clear-source-due',operationId:'vendor-clear-'+source.id+'-'+state.revision,
    vendorPartyId:source.vendorPartyId,sourceId:source.id,date:businessToday(),
    cashPaisa,returnBaseQty:goods,paymentSplits,reason:reason.trim()||undefined});
   // Inline settlement updates immediately; avoid a toast over the next Save button.
   if(!hideClose)toast.success('Due updated in preview · no real money or stock posted');
   onClose();
  }catch(e){setError(e instanceof Error?e.message:'Could not clear the due.');}
 };
 return <form onSubmit={save} aria-label="Clear Vendor due" className={hideClose?
 "space-y-3 border-t border-border pt-4":"mb-4 space-y-3 rounded-xl border border-border bg-ink-50/40 p-3 sm:p-4"}>
  <div className="flex flex-wrap justify-between gap-2"><div>
   <h4 className="text-sm font-semibold text-ink">{hideClose?'Settlement · হিসাব মেটান':'Clear Due · বাকি মেটান'}</h4>
   {!hideClose&&<p className="text-xs text-ink-500">{source.reference??source.id} · {product?.name??source.productId}</p>}
  </div>{!hideClose&&<Button size="sm" variant="outline" type="button" onClick={onClose}>Close</Button>}</div>
  {!hideClose&&<div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
   <div><p className="text-ink-500">Still due</p><strong>{due===null?'Price not set':taka(due)}</strong></div>
   <div><p className="text-ink-500">Products still out</p><strong>{source.baseQty-outstanding.returnedBaseQty} {product?.unit??'units'}</strong></div>
   <div><p className="text-ink-500">After this</p><strong>{afterThis}</strong></div>
  </div>}
  <div className="space-y-3">
   <fieldset disabled={priceMissing} className="min-w-0 min-w-0 space-y-2 rounded-md border border-border bg-ink-50/20 p-3 disabled:opacity-60">
    <legend className="sr-only">Pay Money</legend>
    <div className="flex items-center justify-between">
    <strong className="text-xs text-ink">Pay Money · টাকা দিন</strong>
    <Button type="button" size="sm" variant="ghost" onClick={()=>setSplits(rows=>[...rows,{id:'s'+(++nextId.current),accountId:accounts[0]?.id??'',amount:''}])}><Plus className="size-3"/> Account</Button></div>
    {splits.map((row,i)=><div key={row.id} className="flex items-center gap-2">
     <div className="min-w-0 flex-1"><AppSelect label={'Payment account '+(i+1)}
      value={row.accountId} options={accounts.map(a=>({value:a.id,label:a.name}))}
      onChange={value=>setSplits(rows=>rows.map(s=>s.id===row.id?{...s,accountId:value}:s))}/></div>
     <Input aria-label={'Money from account '+(i+1)} className="w-24" inputMode="decimal"
      value={row.amount} placeholder="৳0" onChange={e=>setSplits(rows=>rows.map(s=>s.id===row.id?{...s,amount:e.target.value}:s))}/>
     {splits.length>1&&<Button type="button" size="sm" variant="ghost"
      aria-label={'Remove payment account '+(i+1)} onClick={()=>setSplits(rows=>rows.filter(s=>s.id!==row.id))}><Trash2 className="size-3"/></Button>}
    </div>)}
    {priceMissing&&<p className="text-xs text-warning">Set the price before paying money.</p>}
   </fieldset>
   <section className="min-w-0 space-y-2 rounded-md border border-border bg-ink-50/20 p-3">
    <strong className="text-xs text-ink">Return Products · পণ্য ফেরত দিন</strong>
    <label className="block text-xs text-ink-500">Quantity in {product?.unit??'units'}
     <div className="mt-1 flex min-w-0 flex-wrap gap-2">
      <Input className="min-w-[8rem] flex-1" aria-label="Products to return" inputMode="decimal" value={returnQty}
       onChange={e=>setReturnQty(e.target.value)} placeholder="0"/>
      <Button type="button" size="sm" variant="outline" disabled={maxReturn===0}
       onClick={()=>setReturnQty(String(maxReturn))}>
        {maxReturn===stillOut?'All ':'Max '}{maxReturn}
      </Button>
     </div>
    </label>
    <p className="text-[11px] text-ink-500">Same product only. Maximum return respects owned stock and remaining due.</p>
   </section>
  </div>
  <label className="block text-xs text-ink-500">Note · optional
   <Input className="mt-1" value={reason} onChange={e=>setReason(e.target.value)} placeholder="Why was this due cleared?"/></label>
  {source.unitCostBasePaisa===null&&<p className="text-xs text-warning">Price not set. You can return products now; set the price before paying money.</p>}
  {error&&<p role="alert" className="rounded-lg bg-danger-bg p-2 text-xs text-danger">{error}</p>}
  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
   <span className="text-xs text-ink-500">{hideClose?'Remaining after: ':'Money: '+taka(cash)+' · Products: '+goods+' · Demo only'}{hideClose?afterThis:''}</span>
   <Button size="sm" type="submit">Save Settlement</Button>
  </div>
 </form>;
}
