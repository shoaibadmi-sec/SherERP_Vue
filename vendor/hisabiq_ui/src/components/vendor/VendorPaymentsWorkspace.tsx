import {useEffect,useState} from 'react';
import {CheckCircle2,ListFilter} from 'lucide-react';
import {Button} from '../Button';
import {VendorActionDialog} from '../parties/VendorActionDialog';
import {VendorMemoPickerDialog} from './VendorMemoPickerDialog';
import {sourceOutstanding} from '../../vendor/vendorModel';
import {products} from '../../data/products';
import {taka} from '../../utils/currency';
import type {VendorPreviewState,VendorSource} from '../../vendor/vendorTypes';

type Props={state:VendorPreviewState;sources:VendorSource[];sourceId?:string|null};
const money=(paisa:number)=>taka(paisa/100);

/** Selecting a pending source reveals the shared money form in place — no second modal or amount entry. */
export function VendorPaymentsWorkspace({state,sources,sourceId}:Props){
 const [memoPickerOpen,setMemoPickerOpen]=useState(false);
 useEffect(()=>{if(sourceId){setSelectedId(sourceId);setMemoPickerOpen(false);}},[sourceId]);
 const [selectedId,setSelectedId]=useState<string|null>(sourceId??null);
 const due=sources.filter(s=>s.unitCostBasePaisa!==null&&
  (sourceOutstanding(state,s.id).monetaryDuePaisa??0)>0);
 const memoOptions=due.map(source=>({
  id:source.id,reference:source.reference??source.id,date:source.date,
  description:products.find(p=>p.id===source.productId)?.name??source.productId,
  pending:true,duePaisa:sourceOutstanding(state,source.id).monetaryDuePaisa
 }));
 const selected=due.find(s=>s.id===selectedId)??due[0]??null;
 const outstanding=selected?sourceOutstanding(state,selected.id):null;
 const unsettled=sources.filter(s=>s.sourceKind==='sourcing'&&
  sourceOutstanding(state,s.id).unpricedBaseQty>0).length;
 return <section aria-label="Vendor payments workspace" className="min-w-0">
  <div className="min-w-0 rounded-lg border border-border bg-card">
   <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2.5">
    <h4 className="text-sm font-semibold text-ink">Outstanding Memos · বাকি মেমো
      <span className="ml-1.5 text-xs font-normal text-ink-500">({due.length})</span>
    </h4>
    <Button type="button" size="sm" variant="outline" onClick={()=>setMemoPickerOpen(true)}>
     <ListFilter className="size-4"/> Browse memos
    </Button>
   </div>
   <VendorMemoPickerDialog open={memoPickerOpen} title="Payment Memos" memos={memoOptions}
    selectedId={selected?.id??null} onClose={()=>setMemoPickerOpen(false)}
    onSelect={id=>{setSelectedId(id);setMemoPickerOpen(false);}}/>
   <div className="min-w-0 space-y-3 p-3 sm:p-4">
    {selected?<>
     <div>
      <h4 className="text-sm font-semibold text-ink">{selected.sourceKind==='sourcing'?'Pay Vendor · টাকা দিন':'Receive Money · টাকা নিন'}</h4>
      <p className="mt-0.5 text-xs text-ink-500">{selected.reference??selected.id} · {products.find(p=>p.id===selected.productId)?.name??selected.productId}</p>
     </div>
     <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-ink-50/60 px-3 py-2 text-xs">
      <span className="text-ink-500">Remaining due · বাকি</span>
      <strong className="text-base text-ink">{money(outstanding?.monetaryDuePaisa??0)}</strong>
     </div>
     <VendorActionDialog key={selected.id+'-'+state.revision} inline source={selected}
      mode={selected.sourceKind==='sourcing'?'pay':'receive-money'} onClose={()=>undefined}/>
    </>:<div className="flex flex-col items-center justify-center gap-2 py-6 text-center text-xs text-ink-500">
      <CheckCircle2 className="size-6 text-teal-600"/><strong className="text-sm text-ink">No outstanding payments</strong>
      <p>All known Vendor money dues are settled.</p>
    </div>}
    {unsettled>0&&<p className="border-t border-border pt-2 text-xs text-warning">
     {unsettled} memo(s) need a price. Set it in Taken before paying.
    </p>}
   </div>
  </div>
 </section>;
}
