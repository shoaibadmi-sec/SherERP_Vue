import {NumericInput} from '../NumericInput';
import React,{useEffect,useRef,useState} from 'react';
import type {Product} from '../../types/erp';
import {productUnitFactor} from '../../utils/unitChain';

/** A single POS V2 quantity control reused by Sales, Purchases, Quotations and Online Orders.
 * Large-unit entry is ONE bordered control with two equal flexible inputs and fixed-width unit labels.
 * No native numeric spinners, nested width:auto blocks or overlapping neighbouring grid cells.
 */
type QuantityProps={
 product:Pick<Product,'unit'|'altUnit'|'unitRelations'>;
 unit:string;
 primary:string|number;
 secondary?:string|number;
 onPrimaryChange:(value:string)=>void;
 onSecondaryChange?:(value:string)=>void;
 onPrimaryEnter?:()=>void;
 onSecondaryEnter?:()=>void;
 onSecondaryBlur?:()=>void;
 primaryRef?:React.Ref<HTMLInputElement>;
 secondaryRef?:React.Ref<HTMLInputElement>;
 primaryLabel:string;
 secondaryLabel?:string;
 disabled?:boolean;
};
const sanitize=(value:string)=>value.replace(/[^\d.]/g,'').replace(/(\..*)\./g,'$1');
export function CompoundQuantityInput({product,unit,primary,secondary='',onPrimaryChange,onSecondaryChange,
 onPrimaryEnter,onSecondaryEnter,onSecondaryBlur,primaryRef,secondaryRef,primaryLabel,secondaryLabel,disabled=false}:QuantityProps){
 const large=productUnitFactor(product,unit)>1;
 const primaryInput=useRef<HTMLInputElement|null>(null);
 const secondaryInput=useRef<HTMLInputElement|null>(null);
 const [primaryText,setPrimaryText]=useState(String(primary));
 const [secondaryText,setSecondaryText]=useState(String(secondary));
 // Keep incomplete decimal typing (e.g. "2.") editable in number-backed preview stores.
 // External unit changes / normalization still synchronize the rendered values.
 useEffect(()=>{
  if(document.activeElement!==primaryInput.current || Number(primaryText)!==Number(primary))
   setPrimaryText(String(primary));
 },[primary]);
 useEffect(()=>{
  if(document.activeElement!==secondaryInput.current || Number(secondaryText)!==Number(secondary))
   setSecondaryText(String(secondary));
 },[secondary]);
 const refTo=(node:HTMLInputElement|null,where:'primary'|'secondary')=>{
  if(where==='primary')primaryInput.current=node;else secondaryInput.current=node;
  const ref=where==='primary'?primaryRef:secondaryRef;
  if(typeof ref==='function')ref(node);
  else if(ref)(ref as React.MutableRefObject<HTMLInputElement|null>).current=node;
 };
 const updatePrimary=(value:string)=>{const clean=sanitize(value);setPrimaryText(clean);onPrimaryChange(clean);};
 const updateSecondary=(value:string)=>{const clean=sanitize(value);setSecondaryText(clean);onSecondaryChange?.(clean);};
 const onEnter=(event:React.KeyboardEvent<HTMLInputElement>,next?:()=>void)=>{
  if(event.key!=='Enter')return;
  event.preventDefault();event.stopPropagation();next?.();
 };
 if(large)return <div data-numeric-joined data-testid="compound-quantity" className="flex h-9 w-full min-w-0 max-w-full items-stretch overflow-hidden rounded-md border border-input bg-ink-50/50 focus-within:border-teal-500 focus-within:bg-card focus-within:ring-2 focus-within:ring-teal-500/20">
  <NumericInput stepperCompact ref={node=>refTo(node,'primary')} type="text" inputMode="decimal" autoComplete="off"
   aria-label={primaryLabel} disabled={disabled} value={primaryText}
   onChange={event=>updatePrimary(event.target.value)} onKeyDown={event=>onEnter(event,onPrimaryEnter??(()=>secondaryInput.current?.focus()))}
   className="h-full w-0 min-w-0 flex-1 bg-transparent px-1.5 text-right text-sm font-medium text-ink outline-none disabled:opacity-60"/>
  <span data-table-helper="" className="flex shrink-0 items-center border-l border-border px-1 text-[10px] text-ink-500">{unit}</span>
  <NumericInput stepperCompact ref={node=>refTo(node,'secondary')} type="text" inputMode="decimal" autoComplete="off"
   aria-label={secondaryLabel??product.unit+' quantity'} disabled={disabled} placeholder="0" value={secondaryText}
   onChange={event=>updateSecondary(event.target.value)}
   onBlur={onSecondaryBlur} onKeyDown={event=>onEnter(event,onSecondaryEnter)}
   className="h-full w-0 min-w-0 flex-1 border-l border-border bg-transparent px-1.5 text-right text-sm font-medium text-ink outline-none disabled:opacity-60"/>
  <span data-table-helper="" className="flex shrink-0 items-center border-l border-border px-1 text-[10px] text-ink-500">{product.unit}</span>
 </div>;
 return <div data-numeric-joined data-testid="single-quantity" className="flex h-9 w-full min-w-0 items-stretch overflow-hidden rounded-md border border-input bg-ink-50/50 focus-within:border-teal-500 focus-within:bg-card focus-within:ring-2 focus-within:ring-teal-500/20">
  <NumericInput ref={node=>refTo(node,'primary')} type="text" inputMode="decimal" autoComplete="off"
   aria-label={primaryLabel} disabled={disabled} value={primaryText}
   onChange={event=>updatePrimary(event.target.value)} onKeyDown={event=>onEnter(event,onPrimaryEnter)}
   className="h-full w-0 min-w-0 flex-1 bg-transparent px-2 text-right text-sm font-medium text-ink outline-none disabled:opacity-60"/>
  <span data-table-helper="" className="flex shrink-0 items-center px-2 text-[10.5px] text-ink-500">{unit}</span>
 </div>;
}
