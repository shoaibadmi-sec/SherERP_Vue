import {useEffect,useMemo,useState} from 'react';
import {AlertTriangle,ArrowLeft,CheckCircle2,History,RotateCcw} from 'lucide-react';
import {Button} from '../Button';
import {Input} from '../Input';
import {AppSelect} from '../AppSelect';
import {Dialog,DialogContent,DialogDescription,DialogHeader,DialogTitle} from '../Dialog';
import {businessToday} from '../../utils/dateRange';
import {taka} from '../../utils/currency';
import {products} from '../../data/products';
import {dispatchVendorPreview} from '../../vendor/vendorPreviewStore';
import {vendorCorrectionImpact} from '../../vendor/vendorCorrection';
import type {VendorLedgerEvent,VendorPreviewState,VendorSource} from '../../vendor/vendorTypes';

type Mode='correct'|'reverse';
type Props={
 source:VendorSource|null;
 event:VendorLedgerEvent|null;
 state:VendorPreviewState;
 onClose:()=>void;
 onReviewEvent:(event:VendorLedgerEvent)=>void;
 onBackToSource:()=>void;
};
const actor='Demo UI operator';
const moneyToPaisa=(value:string):number|null=>{
 if(!value.trim())return null;
 const n=Number(value);
 if(!Number.isFinite(n)||n<=0||!Number.isSafeInteger(Math.round(n*100))
  ||Math.abs(n-Math.round(n*100)/100)>1e-7)throw new Error('Cost must be positive with at most two decimal places, or blank for Price pending.');
 return Math.round(n*100);
};
export function VendorCorrectionDialog({
 source,event,state,onClose,onReviewEvent,onBackToSource
}:Props){
 const [mode,setMode]=useState<Mode>('correct');
 const [reason,setReason]=useState('');
 const [productId,setProductId]=useState('');
 const [quantity,setQuantity]=useState('');
 const [cost,setCost]=useState('');
 const [error,setError]=useState('');
 const today=businessToday();
 const activeSource=source?state.sources.find(s=>s.id===source.id)??source:null;
 const impact=useMemo(()=>activeSource?vendorCorrectionImpact(state,activeSource.id):null,
  [activeSource,state]);
 const selected=event??null;
 const focusEvent=selected!==null;
 useEffect(()=>{
  setMode('correct');setReason('');setError('');
  setProductId(source?.productId??'');
  setQuantity(source?String(source.baseQty):'');
  setCost(source?.unitCostBasePaisa===null||source===null?'':String(source.unitCostBasePaisa/100));
 },[source?.id,selected?.id]);
 const product=products.find(p=>p.id===activeSource?.productId);
 const targetEvent=selected??state.events.find(e=>e.sourceId===activeSource?.id
  &&(e.kind==='sourcing'||e.kind==='issue')&&e.vendorPartyId===activeSource?.vendorPartyId
  &&!state.events.some(r=>r.kind==='reversal'&&r.reversesEventId===e.id));
 const linked=useMemo(()=>{
  if(!impact)return [];
  const ids=[...impact.linkedSettlementIds,...impact.linkedPricingEventIds];
  return ids.flatMap(id=>{
   const settlement=state.settlements.find(s=>s.id===id);
   const linkedEvent=settlement?state.events.find(e=>e.kind==='settlement'&&e.operationId===settlement.operationId)
    :state.events.find(e=>e.id===id);
   return linkedEvent?[linkedEvent]:[];
  });
 },[impact,state]);
 const dateError=Boolean(focusEvent&&targetEvent&&targetEvent.date>today);
 const selectedBlocker=selected?.kind==='reversal'?'A reversal cannot itself be reversed.':
  selected&&state.events.some(e=>e.kind==='reversal'&&e.reversesEventId===selected.id)
   ?'This ledger event has already been reversed.':
  selected&&['sourcing','issue'].includes(selected.kind)?impact?.blocker??null:
  selected?.kind==='pricing'&&impact?.linkedSettlementIds.length
   ?'Reverse linked settlement(s) before reversing a confirmed Vendor price.':null;
 const blocked=focusEvent?Boolean(selectedBlocker):!impact?.reversible;
 const submit=()=>{
  setError('');
  try{
   if(!reason.trim()||reason.trim().length<5)throw new Error('Write a correction reason of at least 5 characters.');
   const operationId='vendor-audit-'+state.revision+'-'+(selected?.id??activeSource?.id??'source');
   if(focusEvent||mode==='reverse'){
    if(!targetEvent)throw new Error('No original ledger event is selected.');
    dispatchVendorPreview({type:'reverse-event',operationId,vendorPartyId:targetEvent.vendorPartyId,
     eventId:targetEvent.id,date:today,reason:reason.trim(),actor});
   }else{
    if(!activeSource)throw new Error('Select the Vendor source to correct.');
    const baseQty=Number(quantity);
    if(!Number.isFinite(baseQty)||baseQty<=0)throw new Error('Corrected quantity must be positive.');
    const unitCostBasePaisa=moneyToPaisa(cost);
    const newId=activeSource.id+'-corrected-'+(state.revision+1);
    dispatchVendorPreview({type:'correct-source',operationId,vendorPartyId:activeSource.vendorPartyId,
     sourceId:activeSource.id,date:today,reason:reason.trim(),actor,
     replacement:{id:newId,productId,baseQty,unitCostBasePaisa,
      date:activeSource.date,reference:activeSource.reference,
      sourceInvoiceId:activeSource.sourceInvoiceId,sourceSaleLineId:activeSource.sourceSaleLineId,
      memoId:activeSource.memoId}});
   }
   onClose();
  }catch(e){setError(e instanceof Error?e.message:'Cannot apply Vendor correction.');}
 };
 const show=Boolean(activeSource||selected);
 return <Dialog open={show} onOpenChange={v=>!v&&onClose()}>
  <DialogContent role="dialog" aria-modal="true" aria-label="Review Vendor correction"
   className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
   <DialogHeader>
    <DialogTitle className="flex items-center gap-2"><History className="size-4"/>
      {focusEvent?'Reverse ledger event':'Review Vendor source'}
      <span className="font-bn text-sm font-normal text-ink-500">· সংশোধন</span>
    </DialogTitle>
    <DialogDescription>
     Demo-only correction. Original events stay visible; reversal adds a compensating audit line. Real cash and inventory are not posted.
    </DialogDescription>
   </DialogHeader>
   {selected&&activeSource&&<Button type="button" size="sm" variant="ghost" onClick={onBackToSource}>
     <ArrowLeft className="size-4"/> Back to source review</Button>}
   {activeSource&&<div className="rounded-lg border border-border bg-ink-50/30 p-3 text-xs">
    <div className="flex flex-wrap justify-between gap-2">
     <strong className="text-ink">{activeSource.reference??activeSource.id}</strong>
     <span className="text-ink-500">{activeSource.date}</span>
    </div>
    <p className="mt-1 text-ink-600">{product?.name??activeSource.productId} · {activeSource.baseQty} {product?.unit??'base units'}</p>
    <p className="mt-1 text-ink-500">{activeSource.unitCostBasePaisa===null?'Price pending · দাম পরে নির্ধারণ':
     'Known source amount: '+taka((activeSource.sourceAmountPaisa??0)/100)}</p>
    {impact?.linkedSaleInvoiceId&&<p className="mt-1">Linked sale: <strong>{impact.linkedSaleInvoiceId}</strong></p>}
   </div>}
   {focusEvent&&selectedBlocker&&<p role="alert" className="rounded-lg border border-warning/25 bg-warning-bg/20 p-3 text-xs text-ink">
     <AlertTriangle className="mr-1 inline size-4 text-warning"/>{selectedBlocker}
   </p>}
   {selected&&<div className="rounded-lg border border-border p-3 text-xs">
    <p className="font-semibold capitalize text-ink">{selected.kind} · {selected.date}</p>
    <p className="mt-1 text-ink-500">{selected.description}</p>
    <p className="mt-1">Original ledger effect: <strong>{taka(selected.deltaPaisa/100)}</strong></p>
    <p className="mt-1 text-ink-500">Reversal adds {taka(-selected.deltaPaisa/100)}; original line remains in the audit trail.</p>
   </div>}
   {!focusEvent&&impact?.requiresCustomerReturnReview&&
    <div className="flex gap-2 rounded-lg border border-warning/25 bg-warning-bg/30 p-3 text-xs">
     <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning"/>
     <p>Needs source review: customer returns may mean goods received here, sent directly to the Vendor, or refund without physical receipt. This correction will <strong>not automatically restock</strong> or cancel the customer refund.</p>
    </div>}
   {!focusEvent&&impact?.blocker&&
    <div className="space-y-2 rounded-lg border border-warning/25 bg-warning-bg/20 p-3 text-xs" role="alert">
     <p className="font-semibold text-ink"><AlertTriangle className="mr-1 inline size-4 text-warning"/> Action blocked: {impact.blocker}</p>
     {linked.length>0&&<div className="space-y-2">
       <p className="text-ink-500">Review and reverse these linked entries first, with a separate reason for each:</p>
       {linked.map(e=><div key={e.id} className="flex items-center justify-between gap-2 rounded-md border border-border bg-card p-2">
        <span className="min-w-0 flex-1 truncate">{e.kind} · {e.date} · {taka(e.deltaPaisa/100)}</span>
        <Button type="button" size="sm" variant="outline" onClick={()=>onReviewEvent(e)}>Review reversal</Button>
       </div>)}
      </div>}
    </div>}
   {!focusEvent&&impact?.reversible&&<div className="flex flex-wrap gap-1" role="tablist" aria-label="Vendor correction action">
     <Button role="tab" aria-selected={mode==='correct'} size="sm" variant={mode==='correct'?'default':'outline'}
      onClick={()=>setMode('correct')}>Correct source</Button>
     <Button role="tab" aria-selected={mode==='reverse'} size="sm" variant={mode==='reverse'?'default':'outline'}
      onClick={()=>setMode('reverse')}>Reverse source</Button>
    </div>}
   {!focusEvent&&mode==='correct'&&impact?.reversible&&activeSource&&
    <div className="grid gap-3 sm:grid-cols-2">
     <div className="sm:col-span-2"><p className="mb-1 text-xs font-medium text-ink">Corrected product</p>
      <AppSelect label="Corrected Vendor product" value={productId}
       options={products.filter(p=>p.kind!=='Service').map(p=>({value:p.id,label:p.name}))}
       onChange={setProductId} disabled={Boolean(activeSource.sourceInvoiceId)}/>
      {activeSource.sourceInvoiceId&&<p className="mt-1 text-[11px] text-ink-500">
       Product is locked because this source links to customer sale {activeSource.sourceInvoiceId}. Review that invoice before changing products.
      </p>}
     </div>
     <label className="text-xs font-medium text-ink">Corrected quantity · পরিমাণ
      <Input className="mt-1" aria-label="Corrected source quantity" inputMode="decimal"
       value={quantity} onChange={e=>setQuantity(e.target.value)}/>
     </label>
     <label className="text-xs font-medium text-ink">Base-unit price (৳) · optional for source
      <Input className="mt-1" aria-label="Corrected source cost" inputMode="decimal" placeholder="Price pending"
       value={cost} onChange={e=>setCost(e.target.value)}/>
     </label>
    </div>}
   {(focusEvent||impact?.reversible)&&<label className="block text-xs font-medium text-ink">
    Required audit reason · সংশোধনের কারণ
    <Input className="mt-1" aria-label="Vendor correction reason" value={reason} onChange={e=>setReason(e.target.value)}
     placeholder="Why must this source or transaction be changed?"/>
   </label>}
   {error&&<p role="alert" className="rounded-md bg-danger-bg p-2 text-xs text-danger">{error}</p>}
   <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-3">
    <Button type="button" size="sm" variant="outline" onClick={onClose}>Close</Button>
    {!blocked&&show&&<Button type="button" size="sm" onClick={submit} disabled={Boolean(dateError)}>
      {focusEvent||mode==='reverse'?<RotateCcw className="size-4"/>:<CheckCircle2 className="size-4"/>}
      {focusEvent||mode==='reverse'?'Confirm demo reversal':'Save corrected demo source'}
    </Button>}
   </div>
  </DialogContent>
 </Dialog>;
}
