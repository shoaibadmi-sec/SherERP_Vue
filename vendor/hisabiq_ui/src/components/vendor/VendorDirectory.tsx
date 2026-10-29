import {Search} from 'lucide-react';
import {Input} from '../Input';
import {PartyAvatar} from '../PartyAvatar';
import {vendorBalances} from '../../vendor/vendorModel';
import {taka} from '../../utils/currency';
import type {Party} from '../../types/erp';

export type VendorDirectoryFilter='all'|'needs-price'|'pay'|'receive';
export type VendorDirectoryRow={p:Party;balance:ReturnType<typeof vendorBalances>};

type Props={
  rows:VendorDirectoryRow[];
  shown:VendorDirectoryRow[];
  selectedId:string;
  query:string;
  onQuery:(value:string)=>void;
  filter:VendorDirectoryFilter;
  onFilter:(value:VendorDirectoryFilter)=>void;
  onSelect:(partyId:string)=>void;
  picker?:boolean;
};

export function VendorDirectory({rows,shown,selectedId,query,onQuery,filter,onFilter,onSelect,picker=false}:Props){
  const priceCount=rows.filter(({balance})=>balance.unpricedSourceCount>0).length;
  const payCount=rows.filter(({balance})=>balance.knownPayablePaisa>0).length;
  const receiveCount=rows.filter(({balance})=>balance.knownReceivablePaisa>0).length;
  const filters:{id:VendorDirectoryFilter;label:string;count:number}[]=[
    {id:'all',label:'All',count:rows.length},
    {id:'needs-price',label:'Needs price',count:priceCount},
    {id:'pay',label:'To pay',count:payCount},
    {id:'receive',label:'To receive',count:receiveCount}
  ];
  return <section className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card"
    role="region" aria-label="Vendor directory">
    <div className="space-y-2 border-b border-border p-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 z-10 size-4 -translate-y-1/2 text-ink-400" aria-hidden="true"/>
        <Input aria-label="Search Vendors" value={query} onChange={e=>onQuery(e.target.value)}
          onKeyDown={event=>{if(event.key==='Enter'&&shown.length){event.preventDefault();onSelect(shown[0].p.id);}
           if(event.key==='ArrowDown'){event.preventDefault();event.currentTarget.closest('section')?.querySelector<HTMLButtonElement>('[role="option"]')?.focus();}}}
          placeholder="Search name or phone…" className={'w-full rounded-md border border-border pl-8 pr-3 text-sm '+(picker?'h-11':'h-8')}/>
      </div>
      <div className="flex flex-wrap gap-1" role="group" aria-label="Vendor filter">
        {filters.map(item=><button key={item.id} type="button" aria-pressed={filter===item.id}
          onClick={()=>onFilter(item.id)}
          className={'min-h-9 rounded-md px-2 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 '
          +(filter===item.id?'bg-inverse text-white':'bg-ink-50 text-ink-600 hover:bg-ink-100')}>
          {item.label} <span className="text-[11px] opacity-75">{item.count}</span>
        </button>)}
      </div>
    </div>
    <div className="flex items-center justify-between px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-ink-400">
      <span>{shown.length} Vendors · ভেন্ডর</span>
      <span>Balances · জের</span>
    </div>
    <ul data-vendor-directory-list className={(picker?'max-h-[min(48vh,420px)] min-h-0':'max-h-[calc(100vh-290px)] min-h-[320px]')+' flex-1 overflow-y-auto scrollbar-thin'}
      role="listbox" aria-label="Vendors">
      {shown.map(({p,balance})=>{
        const active=p.id===selectedId;
        return <li role="presentation" key={p.id}>
          <button type="button" role="option" aria-selected={active} onClick={()=>onSelect(p.id)}
            className={'flex w-full min-w-0 items-center gap-2.5 border-l-2 px-3 py-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-teal-500 '+(picker?'min-h-14 ':'')
              +(active?'border-teal-600 bg-teal-50/60 dark:bg-teal-900/20':'border-transparent hover:bg-ink-50')}>
            <PartyAvatar name={p.name} color={p.avatarColor} image={p.image} size={34}/>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-medium text-ink">{p.name}</span>
              <span className="block truncate text-[11px] text-ink-400">{p.phone} · {p.lastActivity}</span>
            </span>
            <span className="min-w-0 max-w-[46%] shrink-0 text-right">
              {balance.unpricedSourceCount>0&&<span className="block text-[11px] font-medium text-warning">Price pending ({balance.unpricedSourceCount})</span>}
              {balance.knownPayablePaisa>0&&<span className="block whitespace-nowrap text-xs font-semibold text-danger">{taka(balance.knownPayablePaisa/100)} <span className="text-[10px] font-normal">Pay</span></span>}
              {balance.knownReceivablePaisa>0&&<span className="block whitespace-nowrap text-xs font-semibold text-teal-700 dark:text-teal-300">{taka(balance.knownReceivablePaisa/100)} <span className="text-[10px] font-normal">Receive</span></span>}
              {!balance.unpricedSourceCount&&!balance.knownPayablePaisa&&!balance.knownReceivablePaisa&&
                <><span className="block text-xs font-semibold text-ink-400">৳0</span><span className="block text-[10px] text-ink-400">Settled</span></>}
            </span>
          </button>
        </li>;
      })}
      {shown.length===0&&<li className="px-3 py-10 text-center text-sm text-ink-500">
        {query?'No Vendors match your search.':filter==='needs-price'?'No Vendors need a price right now.':filter==='all'?'No Vendors yet. Add one above.':'No Vendors have this type of due.'}
      </li>}
    </ul>
  </section>;
}
