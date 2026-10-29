import {useRef,type Ref,type MutableRefObject} from 'react';
import type {Product} from '../../types/erp';
import {NumericInput} from '../NumericInput';
import {productUnits} from '../../utils/unitChain';
import type {UnitQuantityMap} from '../../utils/multiUnitTransactions';

/** Joined numeric fields for entering three or more units on the same transaction line.
 * Traditional one/two-unit products keep CompoundQuantityInput without visual changes.
 */
export function MultiUnitQuantityInput({product,quantities,onChange,disabled=false,primaryRef,onLastEnter}:{
  product:Pick<Product,'unit'|'altUnit'|'unitRelations'>;
  quantities:UnitQuantityMap;
  onChange:(next:UnitQuantityMap)=>void;
  disabled?:boolean;
  primaryRef?:Ref<HTMLInputElement>;
  onLastEnter?:()=>void;
}) {
  const inputs=useRef<(HTMLInputElement|null)[]>([]);
  const units=productUnits(product);
  return <div data-multi-quantity className="grid min-w-0 grid-cols-1 gap-1">
    {units.map((unit,index)=>
      <div key={unit} data-numeric-joined className="flex h-9 min-w-0 items-stretch overflow-hidden rounded-md border border-input bg-card focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20">
        <NumericInput ref={node=>{
            inputs.current[index]=node;
            if(index===0&&typeof primaryRef==='function')primaryRef(node);
            else if(index===0&&primaryRef)(primaryRef as MutableRefObject<HTMLInputElement|null>).current=node;
          }}
          onKeyDown={event=>{if(event.key==='Enter'){
            event.preventDefault();
            if(index+1<units.length){const next=inputs.current[index+1];next?.focus();next?.select();}
            else onLastEnter?.();
          }}}
          stepperCompact aria-label={'Quantity in '+unit}
          value={quantities[unit]??''} disabled={disabled}
          type="text" inputMode="decimal" placeholder="0"
          onChange={event=>{
            const cleaned=event.target.value.replace(/[^\d.]/g,'').replace(/(\..*)\./g,'$1');
            const [whole='',fraction]=cleaned.split('.');
            const clean=fraction===undefined?whole:(whole||'0')+'.'+fraction.slice(0,4);
            onChange({...quantities,[unit]:clean});
          }}
          className="h-full w-0 min-w-0 flex-1 !rounded-none !border-0 !bg-transparent !shadow-none px-2 text-right text-[13px] text-ink outline-none"/>
        <span title={unit} className="flex w-[65px] min-w-0 shrink-0 items-center justify-center border-l border-border bg-ink-50/50 px-1 text-[12px] text-ink">{unit}</span>
      </div>
    )}
  </div>;
}
