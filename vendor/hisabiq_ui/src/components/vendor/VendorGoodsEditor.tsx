import React,{useMemo,useRef,useState} from 'react';
import {Trash2} from 'lucide-react';
import {Button} from '../Button';
import {Input} from '../Input';
import {AppSelect} from '../AppSelect';
import {AppDatePicker} from '../AppDateRangePicker';
import {ProductCombobox} from '../pos/ProductCombobox';
import {CompoundQuantityInput} from '../transactions/CompoundQuantityInput';
import {AddProductDialog} from '../products/AddProductDialog';
import {availableProducts,createPreviewProduct} from '../../data/erpDemoStore';
import {businessToday} from '../../utils/dateRange';
import {compoundBaseQuantity,compoundLineTotal} from '../../utils/posQuantity';
import {dispatchVendorPreview,getVendorPreviewSnapshot} from '../../vendor/vendorPreviewStore';
import {taka} from '../../utils/currency';
import type {Product} from '../../types/erp';

type Line={key:string;productId:string;unit:string;qty:string;smallQty:string;price:string};
type Props={partyId:string;mode:'taken'|'given';onSaved:()=>void;onCancel:()=>void;onDirtyChange:(dirty:boolean)=>void};
const makeLine=(p:Product,key:string):Line=>({key,productId:p.id,unit:p.altUnit?.unit??p.unit,qty:'1',smallQty:'',price:''});

export function VendorGoodsEditor({partyId,mode,onSaved,onCancel,onDirtyChange}:Props){
 const [catalog,setCatalog]=useState(()=>availableProducts().filter(p=>p.kind!=='Service'));
 const [rows,setRows]=useState<Line[]>([]);
 const [date,setDate]=useState(businessToday());
 const [memo,setMemo]=useState('');
 const [error,setError]=useState('');
 const [addingProduct,setAddingProduct]=useState(false);
 const [counter,setCounter]=useState(0);
 const searchRef=useRef<HTMLInputElement>(null);
 const quantityRef=useRef<HTMLInputElement>(null);
 const byId=useMemo(()=>new Map(catalog.map(p=>[p.id,p] as const)),[catalog]);
 const dirty=()=>onDirtyChange(true);
 const add=(p:Product)=>{
  const next=counter+1;setCounter(next);
  setRows(items=>[...items,makeLine(p,'vrow-'+next)]);
  dirty();setError('');
  window.requestAnimationFrame(()=>quantityRef.current?.focus());
 };
 const change=(id:string,patch:Partial<Line>)=>{
  setRows(items=>items.map(item=>item.key===id?{...item,...patch}:item));dirty();setError('');
 };
 const cancel=()=>{onDirtyChange(false);onCancel();};
 const total=rows.reduce((sum,line)=>{
  const p=byId.get(line.productId);
  if(!p)return sum;
  const factor=p.altUnit&&line.unit===p.altUnit.unit?p.altUnit.factor:1;
  return sum+compoundLineTotal(line.qty,line.smallQty,factor,line.price);
 },0);
 const submit=(event:React.FormEvent)=>{
  event.preventDefault();
  try{
   if(!rows.length)throw new Error('Add at least one product.');
   const snapshot=getVendorPreviewSnapshot();
   const operationId='vendor-'+mode+'-'+partyId+'-'+snapshot.revision;
   const reference=memo.trim()||((mode==='given'?'V-GV-':'V-TK-')+String(snapshot.revision+1).padStart(4,'0'));
   const sources=rows.map((line,i)=>{
    const p=byId.get(line.productId);
    if(!p)throw new Error('Select a valid product for every row.');
    const factor=p.altUnit&&line.unit===p.altUnit.unit?p.altUnit.factor:1;
    const baseQty=compoundBaseQuantity(line.qty,line.smallQty,factor);
    if(!Number.isFinite(baseQty)||baseQty<=0)throw new Error('Enter a valid quantity for '+p.name+'.');
    const price=Number(line.price);
    if(mode==='given'&&(!line.price.trim()||!Number.isFinite(price)||price<=0))
     throw new Error('Enter the agreed price for '+p.name+'.');
    if(line.price.trim()&&(!Number.isFinite(price)||price<=0))
     throw new Error('Price must be a positive number.');
    const unitCostBasePaisa=line.price.trim()?Math.round(price*100/factor):null;
    if(unitCostBasePaisa!==null&&(!Number.isSafeInteger(unitCostBasePaisa)||unitCostBasePaisa<=0))
     throw new Error('Price is too small for the selected unit.');
    return {id:operationId+':'+i,productId:p.id,baseQty,unitCostBasePaisa,date};
   });
   dispatchVendorPreview({type:mode==='given'?'issue-goods-memo':'record-sourcing-memo',
    operationId,vendorPartyId:partyId,memoId:operationId,date,reference,sources});
   onDirtyChange(false);onSaved();
  }catch(e){setError(e instanceof Error?e.message:'Cannot save products.');}
 };
 return <form aria-label={mode==='given'?'Give products editor':'Take products editor'} onSubmit={submit}
  className="space-y-3 rounded-xl border border-border bg-card p-3 shadow-card sm:p-4">
  <div className="flex flex-wrap items-center justify-between gap-2">
   <div><h3 className="text-sm font-semibold text-ink">{mode==='given'?'Give Products · পণ্য দিন':'Take Products · পণ্য নিন'}</h3>
    <p className="font-bn text-xs text-ink-500">{mode==='given'?'ভেন্ডরকে পণ্য দেওয়া':'ভেন্ডর থেকে পণ্য নেওয়া'}</p></div>
   <Button type="button" size="sm" variant="outline" onClick={cancel}>Cancel</Button>
  </div>
  <div className="grid gap-3 sm:grid-cols-2">
   <label className="text-xs font-medium text-ink">Memo / Reference · মেমো
    <Input className="mt-1" aria-label="Vendor memo reference" value={memo} onChange={e=>{setMemo(e.target.value);dirty();}} placeholder="Auto if empty"/>
   </label>
   <div className="text-xs font-medium text-ink">Date · তারিখ
    <AppDatePicker label="Vendor memo date" value={date} onChange={v=>{setDate(v);dirty();}}/>
   </div>
  </div>
  <div className="space-y-2">
   <label className="block text-xs font-medium text-ink">Add product · পণ্য যোগ করুন</label>
   <ProductCombobox mode="purchase" products={catalog} ref={searchRef} onSelect={add}
    onCreate={()=>setAddingProduct(true)} ariaLabel="Search products to add to Vendor memo"/>
   {rows.map((line,i)=>{
    const p=byId.get(line.productId);
    if(!p)return null;
    const factor=p.altUnit&&line.unit===p.altUnit.unit?p.altUnit.factor:1;
    const own=getVendorPreviewSnapshot().inventory?.[p.id]??p.stock;
    return <div key={line.key} className="rounded-lg border border-border bg-card p-3">
     <div className="mb-2 flex items-center gap-2">
      <strong className="text-xs text-ink-500">{i+1}.</strong>
      <span className="min-w-0 flex-1 text-sm font-medium text-ink">{p.name}</span>
      <span className="text-xs text-ink-500">Own: {own} {p.unit}</span>
      <Button type="button" size="sm" variant="ghost" aria-label={'Remove '+p.name}
       onClick={()=>{setRows(items=>items.filter(x=>x.key!==line.key));dirty();}}><Trash2 className="size-4"/></Button>
     </div>
     <div className="grid gap-3 sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)]">
      <div><p className="mb-1 text-xs text-ink-500">Quantity · পরিমাণ</p>
       <CompoundQuantityInput product={p} unit={line.unit} primary={line.qty} secondary={line.smallQty}
        primaryRef={i===rows.length-1?quantityRef:undefined}
        onPrimaryChange={v=>change(line.key,{qty:v})}
        onSecondaryChange={v=>change(line.key,{smallQty:v})}
        primaryLabel={'Quantity for '+p.name} secondaryLabel={'Small quantity for '+p.name}
        onPrimaryEnter={line.unit===p.unit?()=>searchRef.current?.focus():undefined}
        onSecondaryEnter={()=>searchRef.current?.focus()}/>
      </div>
      <div><p className="mb-1 text-xs text-ink-500">Price in · দাম কোন এককে</p>
       <AppSelect label={'Price unit for '+p.name} value={line.unit} onChange={unit=>change(line.key,{unit,smallQty:'',price:''})}
        options={[p.unit,...(p.altUnit?[p.altUnit.unit]:[])]}/></div>
      <label className="text-xs text-ink-500">Price / {line.unit} {mode==='taken'?'· optional':''}
       <Input className="mt-1" aria-label={'Price for '+p.name} inputMode="decimal" value={line.price}
        placeholder={mode==='taken'?'Price not set':'৳'} onChange={e=>change(line.key,{price:e.target.value.replace(/[^\d.]/g,'')})}/></label>
     </div>
     <p className="mt-1 text-right text-xs text-ink-600">{line.price.trim()?taka(compoundLineTotal(line.qty,line.smallQty,factor,line.price)):'Price not set · দাম ঠিক হয়নি'}</p>
    </div>;
   })}
   
  </div>
  {error&&<p role="alert" className="rounded-md bg-danger-bg p-2 text-xs text-danger">{error}</p>}
  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
   <div><p className="text-xs text-ink-500">{mode==='given'?'Vendor owes · পাওনা':'Agreed amount · ঠিক করা দাম'}</p>
    <strong className="text-lg text-ink">{taka(total)}</strong>
    {mode==='taken'&&rows.some(x=>!x.price.trim())&&<p className="text-xs text-warning">Some products have no price yet</p>}
   </div>
   <Button type="submit" size="sm">Save {mode==='given'?'Given':'Taken'} Products</Button>
  </div>
  <AddProductDialog open={addingProduct} onOpenChange={setAddingProduct}
   existingSerials={[]} onSave={(p,opening)=>{createPreviewProduct(p,opening);setCatalog(items=>[...items,p]);add(p);setAddingProduct(false);}}/>
 </form>;
}
