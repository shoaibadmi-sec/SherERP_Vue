import React,{useEffect,useId,useMemo,useState} from 'react';
import {CheckCircle2,ListFilter} from 'lucide-react';
import {Button} from '../Button';
import {Input} from '../Input';
import {AppSelect} from '../AppSelect';
import {VendorMemoPickerDialog} from './VendorMemoPickerDialog';
import {VendorActionDialog} from '../parties/VendorActionDialog';
import {VendorClearDuePanel} from './VendorClearDuePanel';
import {dispatchVendorPreview,getVendorPreviewSnapshot} from '../../vendor/vendorPreviewStore';
import {sourceOutstanding} from '../../vendor/vendorModel';
import {products} from '../../data/products';
import {businessToday} from '../../utils/dateRange';
import {taka} from '../../utils/currency';
import type {VendorSource,VendorPreviewState} from '../../vendor/vendorTypes';

type Props={
  mode:'taken'|'given';sources:VendorSource[];snapshot:VendorPreviewState;
  sourceId:string|null;onCorrect:(sourceId:string)=>void;
};
const money=(paisa:number)=>taka(paisa/100);
const memoKey=(source:VendorSource)=>source.memoId||source.sourceInvoiceId||source.reference||source.id;
const productName=(s:VendorSource)=>products.find(p=>p.id===s.productId)?.name??s.productId;
const outstanding=(state:VendorPreviewState,s:VendorSource)=>sourceOutstanding(state,s.id);
const requiresAction=(state:VendorPreviewState,s:VendorSource)=>{
  const due=outstanding(state,s);
  return due.unpricedBaseQty>0||(due.monetaryDuePaisa??0)>0;
};

/** Price is optional when goods are taken. Convert the agreed price to the product base unit. */
function VendorPriceForm({source}: {source:VendorSource}){
  const product=products.find(p=>p.id===source.productId);
  const priceInputId=useId();
  const [unit,setUnit]=useState(product?.altUnit?.unit??product?.unit??'');
  const [price,setPrice]=useState('');
  const [error,setError]=useState('');
  const factor=product?.altUnit?.unit===unit?product.altUnit.factor:1;
  const remaining=outstanding(getVendorPreviewSnapshot(),source).unpricedBaseQty;
  const submit=(event:React.FormEvent)=>{
    event.preventDefault();setError('');
    try{
      const amount=Number(price);
      if(!price.trim()||!Number.isFinite(amount)||amount<=0)throw new Error('Enter the agreed unit cost.');
      const basePaisa=Math.round(amount*100/factor);
      if(!Number.isSafeInteger(basePaisa)||basePaisa<=0)throw new Error('Cost is too small for the selected unit.');
      const state=getVendorPreviewSnapshot();
      dispatchVendorPreview({
        type:'set-source-price',operationId:'vendor-price-'+source.id+'-'+state.revision,
        vendorPartyId:source.vendorPartyId,sourceId:source.id,date:businessToday(),
        unitCostBasePaisa:basePaisa,reason:'Agreed price confirmed in Vendor workplace'
      });
      
    }catch(e){setError(e instanceof Error?e.message:'Could not set Vendor cost.');}
  };
  return <form aria-label="Set Vendor price" onSubmit={submit}
    className="space-y-2 rounded-md border border-warning/30 bg-warning-bg/20 p-3">
    <div>
      <h4 className="text-sm font-semibold text-ink">Set Price · দাম ঠিক করুন</h4>
      <p className="mt-1 text-xs text-ink-500">Set the agreed cost to calculate the due. Until then, these goods have no recorded money due.</p>
    </div>
    <div className="grid gap-3 sm:grid-cols-2 sm:items-end" aria-label="Vendor price fields">
      <div className="min-w-0 space-y-1">
        <span className="block text-xs font-medium text-ink-600">Price in · কোন এককে</span>
        <AppSelect label="Vendor price unit" className="[&>button]:h-9" value={unit}
          onChange={setUnit} options={[product?.unit??'',...(product?.altUnit?[product.altUnit.unit]:[])].filter(Boolean)}/>
      </div>
      <div className="min-w-0 space-y-1">
        <label htmlFor={priceInputId} className="block text-xs font-medium text-ink-600">Cost per {unit} · মূল্য</label>
        <div className="flex min-w-0 items-start">
          <Input id={priceInputId} className="h-9 w-full" inputMode="decimal"
            aria-label={'Agreed cost per '+unit} value={price} onChange={e=>setPrice(e.target.value)} placeholder="৳0.00"/>
        </div>
      </div>
    </div>
    <p className="text-xs text-ink-500">Unreturned: {remaining} {product?.unit??'units'}
      {price.trim()&&Number(price)>0?' · Estimated due: '+money(Math.round(remaining*Number(price)*100/factor)):''}</p>
    {error&&<p role="alert" className="text-xs text-danger">{error}</p>}
    <Button type="submit" size="sm">Confirm Vendor Price</Button>
  </form>;
}

export function VendorSourceWorkspace({mode,sources,snapshot,sourceId,onCorrect}:Props){
  const [selectedId,setSelectedId]=useState<string|null>(sourceId);
  const [memoPickerOpen,setMemoPickerOpen]=useState(false);
  useEffect(()=>{if(sourceId){setSelectedId(sourceId);setMemoPickerOpen(false);}},[sourceId]);
  const chooseSource=(id:string)=>{setSelectedId(id);setMemoPickerOpen(false);};
  const [givenAction,setGivenAction]=useState<'receive-money'|'receive-goods'>('receive-money');
  const groups=useMemo(()=>{
    const map=new Map<string,VendorSource[]>();
    sources.forEach(s=>{
      const key=memoKey(s);
      map.set(key,[...(map.get(key)??[]),s]);
    });
    return Array.from(map.entries()).map(([key,lines])=>({
      key,lines,needsAction:lines.some(s=>requiresAction(snapshot,s)),
      unpriced:lines.some(s=>outstanding(snapshot,s).unpricedBaseQty>0),
      duePaisa:lines.reduce((sum,s)=>sum+(outstanding(snapshot,s).monetaryDuePaisa??0),0),
      date:lines[0].date
    })).sort((a,b)=>Number(b.needsAction)-Number(a.needsAction)||b.date.localeCompare(a.date));
  },[sources,snapshot]);
  const memoOptions=groups.map(g=>({
    id:g.key,reference:g.key,date:g.date,description:g.lines.map(line=>productName(line)).join(', '),
    productCount:g.lines.length,pending:g.needsAction,pricePending:g.unpriced,
    duePaisa:g.unpriced&&!g.duePaisa?null:g.duePaisa
  }));
  const selected=sources.find(s=>s.id===selectedId)??groups.find(g=>g.needsAction)?.lines.find(s=>requiresAction(snapshot,s))
    ??groups[0]?.lines[0]??null;
  const currentGroup=selected?groups.find(g=>g.lines.some(s=>s.id===selected.id)):null;
  const pending=selected?outstanding(snapshot,selected):null;
  const canSettle=Boolean(pending&&(pending.unpricedBaseQty>0||(pending.monetaryDuePaisa??0)>0));
  const product=selected?products.find(p=>p.id===selected.productId):undefined;
  return <section role="region" aria-label={mode==='taken'?'Taken product workplace':'Given product workplace'}
    className="min-w-0">
    <div className="min-w-0 rounded-lg border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2.5">
        <h4 className="text-sm font-semibold text-ink">
          {mode==='taken'?'Taken Memos · নেওয়া মেমো':'Given Memos · দেওয়া মেমো'}
          <span className="ml-1.5 text-xs font-normal text-ink-500">({groups.length})</span>
        </h4>
        <Button type="button" variant="outline" size="sm" onClick={()=>setMemoPickerOpen(true)}>
          <ListFilter className="size-4"/> Browse memos
        </Button>
      </div>
      <VendorMemoPickerDialog open={memoPickerOpen}
        title={mode==='taken'?'Taken Memos':'Given Memos'}
        memos={memoOptions} selectedId={currentGroup?.key??null}
        onClose={()=>setMemoPickerOpen(false)}
        onSelect={memoId=>{
          const group=groups.find(g=>g.key===memoId);
          if(group)chooseSource(group.lines.find(line=>requiresAction(snapshot,line))?.id??group.lines[0].id);
        }}/>
      <div aria-label="Selected Vendor memo" className="min-w-0 space-y-3 p-3 sm:p-4">
        {selected?<>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <h4 className="text-sm font-semibold text-ink">
                {mode==='taken'?'Settle Memo · হিসাব মেটান':'Receive Settlement · পাওনা নিন'}
              </h4>
              <p className="mt-0.5 text-xs text-ink-500">{selected.reference??selected.id} · {selected.date}</p>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={()=>onCorrect(selected.id)}>Correct</Button>
          </div>
          {currentGroup&&currentGroup.lines.length>1&&<div className="flex flex-wrap gap-1.5">
            {currentGroup.lines.map(s=><button type="button" key={s.id} aria-pressed={selected.id===s.id}
              onClick={()=>setSelectedId(s.id)}
              className={'rounded-md border px-2.5 py-1.5 text-xs '+
                (selected.id===s.id?'border-teal-500 bg-teal-50 text-teal-800 dark:bg-teal-900/20 dark:text-teal-200':'border-border text-ink-600 hover:bg-ink-50')}>
              {productName(s)}</button>)}
          </div>}
          <div className="flex flex-wrap gap-x-7 gap-y-2 rounded-md bg-ink-50/60 px-3 py-2 text-xs">
            <div className="min-w-0"><span className="block text-ink-500">Product · পণ্য</span>
              <strong className="text-ink">{product?.name??selected.productId}</strong></div>
            <div><span className="block text-ink-500">Quantity · পরিমাণ</span>
              <strong className="text-ink">{selected.baseQty} {product?.unit??'units'}</strong></div>
            <div><span className="block text-ink-500">{mode==='taken'?'You Owe · দেনা':'Vendor Owes · পাওনা'}</span>
              <strong className="text-ink">{pending?.monetaryDuePaisa===null?'Price not set':money(pending?.monetaryDuePaisa??0)}</strong></div>
          </div>
          {mode==='taken'?<div className="space-y-3">
            {pending&&pending.unpricedBaseQty>0&&<VendorPriceForm key={selected.id} source={selected}/>}
            {canSettle?<VendorClearDuePanel key={selected.id+'-'+snapshot.revision} source={selected}
              onClose={()=>undefined} hideClose/>:
              <p className="flex items-center gap-2 text-xs text-ink-600">
                <CheckCircle2 className="size-4 text-teal-600"/> This memo is settled. Use Correct to review earlier changes.</p>}
          </div>:<div className="space-y-3">
            {canSettle&&selected.unitCostBasePaisa!==null?<div>
              <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Vendor receiving method">
                <Button type="button" size="sm" variant={givenAction==='receive-money'?undefined:'outline'}
                  onClick={()=>setGivenAction('receive-money')}>Receive Money · টাকা নিন</Button>
                <Button type="button" size="sm" variant={givenAction==='receive-goods'?undefined:'outline'}
                  onClick={()=>setGivenAction('receive-goods')}>Receive Products · পণ্য ফেরত নিন</Button>
              </div>
              <VendorActionDialog key={selected.id+givenAction+snapshot.revision} inline source={selected}
                mode={givenAction} onClose={()=>undefined}/>
            </div>:<p className="flex items-center gap-2 text-xs text-ink-600">
              <CheckCircle2 className="size-4 text-teal-600"/> This Vendor memo has no remaining due.</p>}
          </div>}
        </>:<div className="py-5 text-center text-sm text-ink-500">No memo yet. Take or give products to begin.</div>}
      </div>
    </div>
  </section>;
}
