import {useEffect,useState} from 'react';
import {Search,Check} from 'lucide-react';
import {Dialog,DialogContent,DialogDescription,DialogHeader,DialogTitle} from '../Dialog';
import {Input} from '../Input';
import {StatusBadge} from '../StatusBadge';
import {matchesSearch} from '../../utils/fuzzySearch';
import {taka} from '../../utils/currency';

export type VendorMemoChoice={
 id:string;
 reference:string;
 date:string;
 description:string;
 productCount?:number;
 pending:boolean;
 pricePending?:boolean;
 duePaisa:number|null;
};
type Props={
 open:boolean;
 title:string;
 memos:VendorMemoChoice[];
 selectedId:string|null;
 onSelect:(id:string)=>void;
 onClose:()=>void;
};

/** One shared searchable modal for Vendor source and payment memos; never a second page grid. */
export function VendorMemoPickerDialog({open,title,memos,selectedId,onSelect,onClose}:Props){
 const [query,setQuery]=useState('');
 const [pendingOnly,setPendingOnly]=useState(false);
 useEffect(()=>{if(open){setQuery('');setPendingOnly(false);}},[open]);
 const shown=memos.filter(m=>(!pendingOnly||m.pending)&&
  matchesSearch(query,[m.reference,m.date,m.description]));
 return <Dialog open={open} onOpenChange={next=>{if(!next)onClose();}}>
  <DialogContent aria-label="Select Vendor memo" className="w-[calc(100vw-2rem)] max-w-xl max-h-[85vh] overflow-y-auto p-0">
   <div className="space-y-3 p-4 sm:p-5">
    <DialogHeader>
     <DialogTitle>{title} · মেমো বাছুন</DialogTitle>
     <DialogDescription>Search and select a memo to continue its existing transaction.</DialogDescription>
    </DialogHeader>
    <div className="relative">
     <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400"/>
     <Input autoFocus aria-label="Search Vendor memos" value={query}
      onChange={event=>setQuery(event.target.value)}
      onKeyDown={event=>{if(event.key==='Enter'&&shown.length){event.preventDefault();onSelect(shown[0].id);}}}
      className="w-full pl-9" placeholder="Search memo, date or product"/>
    </div>
    <label className="flex items-center gap-2 text-xs text-ink-600">
     <input type="checkbox" checked={pendingOnly} onChange={e=>setPendingOnly(e.target.checked)} className="accent-teal-600"/>
     Pending only · বাকি আছে
    </label>
    <div className="max-h-[min(50vh,420px)] overflow-y-auto rounded-md border border-border" role="listbox" aria-label="Vendor memo choices">
     {shown.map(m=><button key={m.id} type="button" role="option" aria-selected={selectedId===m.id}
      onClick={()=>onSelect(m.id)}
      className={'flex min-h-14 w-full min-w-0 items-center gap-3 border-b border-border/70 px-3 py-2.5 text-left last:border-b-0 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-teal-500 '+
       (selectedId===m.id?'bg-teal-50/70 dark:bg-teal-900/20':'hover:bg-ink-50')}>
      <span className="min-w-0 flex-1">
       <span className="flex flex-wrap items-center gap-2 text-xs font-semibold text-ink">
        {m.reference}
        {m.pricePending?<StatusBadge tone="warning">Price pending</StatusBadge>:
         m.pending?<StatusBadge tone="danger">Due</StatusBadge>:
         <StatusBadge tone="success">Settled</StatusBadge>}
       </span>
       <span className="mt-1 block truncate text-xs text-ink-500">{m.date} · {m.description}</span>
      </span>
      <span className="shrink-0 text-right">
       <span className="block whitespace-nowrap text-xs font-semibold text-ink">
        {m.duePaisa===null?'Price not set':taka(m.duePaisa/100)}
       </span>
       {selectedId===m.id&&<span className="inline-flex items-center gap-1 text-[11px] text-teal-700 dark:text-teal-300"><Check className="size-3"/> Selected</span>}
      </span>
     </button>)}
     {shown.length===0&&<p className="px-4 py-8 text-center text-sm text-ink-500">
      {memos.length?'No matching memos. Try a different search.':'No memos available.'}
     </p>}
    </div>
    <p className="text-[11px] text-ink-500">Select a row, or press Enter to open the first search result. Esc closes this dialog.</p>
   </div>
  </DialogContent>
 </Dialog>;
}
