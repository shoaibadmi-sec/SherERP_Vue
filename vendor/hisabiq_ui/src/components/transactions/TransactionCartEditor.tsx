import {NumericInput} from '../NumericInput';
import React, {useEffect,useRef} from 'react';
import {ArrowDown,ArrowUp,X} from 'lucide-react';
import {ProductCombobox} from '../pos/ProductCombobox';
import {CompoundQuantityInput} from './CompoundQuantityInput';
import {normalizeCompoundQuantity} from '../../utils/posQuantity';
import {ProductThumb} from '../ProductThumb';
import {taka} from '../../utils/currency';
import {formatStock} from '../../utils/units';
import type {Product} from '../../types/erp';
import {transactionLineTotal} from '../../utils/transactionLines';

/** POS V2/Magic Patterns visual contract for non-posting transaction cart editors. */
export type EditableTransactionLine={
 id:string;productId:string;name:string;quantity:number;unit:string;price:number;
 secondaryQuantity?:number;unitFactor?:number;
};
type Props<L extends EditableTransactionLine>={
 mode:'quotation'|'online';
 products:readonly Product[];
 lines:L[];
 onAdd:(product:Product)=>void;
 onUpdate:(id:string,patch:Partial<L>)=>void;
 onRemove:(id:string)=>void;
 onMove?:(id:string,delta:number)=>void;
 onCreate?:()=>void;
 locked?:boolean;
};
const grid='grid min-w-0 grid-cols-[34px_minmax(160px,1fr)_165px_90px_100px_98px_54px] items-center gap-1.5';
const input='h-9 w-full rounded-md border border-transparent bg-transparent px-2 text-right text-sm text-ink hover:border-border focus:border-teal-500 focus:bg-card focus:outline-none focus:ring-2 focus:ring-teal-500/20';
/** Same inline add row, compact product thumbnails, themed controls and keyboard flow as POS. */
export function TransactionCartEditor<L extends EditableTransactionLine>({mode,products,lines,onAdd,onUpdate,onRemove,onMove,onCreate,locked=false}:Props<L>){
 const searchRef=useRef<HTMLInputElement>(null);
 const quantityRefs=useRef<Record<string,HTMLInputElement|null>>({});
 const secondaryRefs=useRef<Record<string,HTMLInputElement|null>>({});
 const previousCount=useRef(lines.length);
 useEffect(()=>{
  if(lines.length>previousCount.current&&!locked){
   const last=lines[lines.length-1];if(last){quantityRefs.current[last.id]?.focus();quantityRefs.current[last.id]?.select();}
  }
  previousCount.current=lines.length;
 },[lines.length,locked]);
 const inputPrefix=mode==='online'?'Order ':'';
 const productLabel=mode==='online'?'Add online order product':'Add product to quotation';
 const backToProduct=(event:React.KeyboardEvent)=>{
  if(event.key==='Enter'){event.preventDefault();searchRef.current?.focus();}
 };
 return <div data-cart-kind="shared" data-testid={'transaction-cart-'+mode} className="min-w-0 overflow-x-auto rounded-xl border border-border bg-card shadow-card">
  <div data-cart-header className={grid+' border-b border-border px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-ink-500'}>
   <span className="text-right">#</span><span>Product · পণ্য</span><span className="text-right">Qty · পরিমাণ</span><span>Unit</span>
   <span className="text-right">Price</span><span className="text-right">Amount</span><span className="sr-only">Actions</span>
  </div>
  <div className="divide-y divide-border">
   {lines.map((line,i)=>{
    const product=products.find(p=>p.id===line.productId);
    const large=product?.altUnit&&line.unit===product.altUnit.unit;
    const factor=large?product!.altUnit!.factor:1;
    const canChange=!locked;
    return <div data-testid="transaction-cart-row" data-cart-row="shared" data-compound={Boolean(large)} key={line.id} className={grid+' px-3 py-1.5 hover:bg-ink-50/40'}>
     <span className="text-right text-sm text-ink-400">{i+1}.</span>
     <div className="flex min-w-0 items-center gap-2.5">
      <ProductThumb size={32} src={product?.image}/>
      <div className="min-w-0"><p className="truncate text-[13px] font-medium text-ink">{line.name}</p>
       <p data-table-helper="" className="truncate text-[11px] text-ink-500"><span className="font-bn">{product?.nameBn??''}</span>
        {product?.nameBn?' · ':''}{product?.category??'Product'} · {product?formatStock(product):'Saved quote item'}
       </p>
      </div>
     </div>
     <div data-cart-field="Quantity · পরিমাণ"><CompoundQuantityInput key={line.unit} product={product??{unit:line.unit}} unit={line.unit}
      primary={line.quantity} secondary={line.secondaryQuantity??0} disabled={!canChange}
      primaryRef={node=>{quantityRefs.current[line.id]=node;}}
      secondaryRef={node=>{secondaryRefs.current[line.id]=node;}}
      primaryLabel={inputPrefix+'Quantity row '+(i+1)}
      secondaryLabel={inputPrefix+(product?.unit??'Small unit')+' quantity row '+(i+1)}
      onPrimaryChange={value=>onUpdate(line.id,{quantity:Number(value||0)} as Partial<L>)}
      onSecondaryChange={value=>onUpdate(line.id,{secondaryQuantity:Number(value||0),unitFactor:factor} as Partial<L>)}
      onPrimaryEnter={()=>{
       if(large){secondaryRefs.current[line.id]?.focus();secondaryRefs.current[line.id]?.select();}
       else searchRef.current?.focus();
      }}
      onSecondaryBlur={()=>{
       const normalized=normalizeCompoundQuantity(line.quantity,line.secondaryQuantity??0,factor);
       onUpdate(line.id,{quantity:Number(normalized.primaryQty||0),
        secondaryQuantity:Number(normalized.secondaryQty||0),unitFactor:factor} as Partial<L>);
      }}
      onSecondaryEnter={()=>{
       const normalized=normalizeCompoundQuantity(line.quantity,line.secondaryQuantity??0,factor);
       onUpdate(line.id,{quantity:Number(normalized.primaryQty||0),
        secondaryQuantity:Number(normalized.secondaryQty||0),unitFactor:factor} as Partial<L>);
       searchRef.current?.focus();
      }}/></div>
     <div data-cart-field="Price in · একক">{product?.altUnit ? <div className="flex h-9 min-w-0 rounded-md bg-ink-50 p-0.5" role="radiogroup" aria-label={inputPrefix+'Unit row '+(i+1)}>
       {[product.altUnit.unit,product.unit].map(unit=><button key={unit} type="button" role="radio"
        aria-checked={line.unit===unit} disabled={!canChange} onClick={()=>{
         if(unit===line.unit)return;
         const oldFactor=line.unit===product.altUnit!.unit?product.altUnit!.factor:1;
         const nextFactor=unit===product.altUnit!.unit?product.altUnit!.factor:1;
         const configuredOld=oldFactor>1?(product.altUnit!.price??product.sellPrice*oldFactor):product.sellPrice;
         const configuredNew=nextFactor>1?(product.altUnit!.price??product.sellPrice*nextFactor):product.sellPrice;
         const nextPrice=Math.abs(line.price-configuredOld)<0.0001?configuredNew:line.price/oldFactor*nextFactor;
         onUpdate(line.id,{unit,quantity:line.quantity,secondaryQuantity:0,unitFactor:nextFactor,
          price:Number(nextPrice.toFixed(4))} as Partial<L>);
        }} className={'min-w-0 flex-1 rounded px-1 text-[12px] font-medium transition-colors '+(line.unit===unit?'bg-card text-ink shadow-card ring-1 ring-primary':'text-ink-500 hover:text-ink')}>
         {unit}
       </button>)}
      </div> : <span className="px-2 text-sm text-ink-600">{line.unit}</span>}</div>
     <div data-cart-field="Price · দাম"><div className="relative"><span data-table-helper="" className="pointer-events-none absolute left-1.5 top-1/2 -translate-y-1/2 text-xs text-ink-400">৳</span>
      <NumericInput aria-label={inputPrefix+'Price row '+(i+1)} type="number" min="0" step="any" inputMode="decimal"
       disabled={!canChange} value={line.price} onChange={event=>onUpdate(line.id,{price:Number(event.target.value)} as Partial<L>)}
       onKeyDown={backToProduct} className={input+' pl-5'}/></div></div>
     <strong data-cart-field="Total · মোট" className="text-right text-[13px] text-ink">{taka(transactionLineTotal({...line,unitFactor:factor}))}</strong>
     <div className="flex items-center justify-end">
      {onMove&&!locked&&<div className="flex flex-col">
       <button type="button" aria-label={'Move row '+(i+1)+' up'} disabled={i===0} onClick={()=>onMove(line.id,-1)} className="rounded text-ink-500 hover:text-teal-700 disabled:opacity-30"><ArrowUp className="size-3.5"/></button>
       <button type="button" aria-label={'Move row '+(i+1)+' down'} disabled={i===lines.length-1} onClick={()=>onMove(line.id,1)} className="rounded text-ink-500 hover:text-teal-700 disabled:opacity-30"><ArrowDown className="size-3.5"/></button>
      </div>}
      {!locked&&<button type="button" aria-label={'Remove '+line.name} onClick={()=>onRemove(line.id)}
       className="flex size-7 items-center justify-center rounded-md text-ink-400 hover:bg-danger-bg hover:text-danger"><X className="size-4"/></button>}
     </div>
    </div>;
   })}
   {!locked&&<div data-testid="transaction-add-row" data-cart-add className={grid+' bg-teal-50/35 px-3 py-2'}>
    <span className="text-right text-sm text-teal-600">{lines.length+1}.</span>
    <ProductCombobox ref={searchRef} mode={mode} products={products} onSelect={onAdd} onCreate={onCreate?()=>onCreate():undefined} ariaLabel={productLabel}/>
    <span data-table-helper="" className="text-right text-xs text-ink-400">Qty</span><span data-table-helper="" className="text-xs text-ink-400">Unit</span>
    <span data-table-helper="" className="text-right text-xs text-ink-400">Price</span><span data-table-helper="" className="text-right text-xs text-ink-400">Amount</span><span/>
   </div>}
  </div>
  {!lines.length&&<p data-table-helper="" className="px-4 py-5 text-center text-xs text-ink-500">Search to add your first product · <span className="font-bn">পণ্য যোগ করুন</span></p>}
 </div>;
}
