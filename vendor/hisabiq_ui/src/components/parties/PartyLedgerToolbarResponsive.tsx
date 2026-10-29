import { useState } from 'react';
import { Printer, RotateCcw, Search, SlidersHorizontal } from 'lucide-react';
import { AppDateRangePicker } from '../AppDateRangePicker';
import { AppSelect } from '../AppSelect';
import { Button } from '../Button';
import { Input } from '../Input';
import type { IsoRange } from '../../utils/dateRange';
import {useUiCopy} from '../../i18n/useUiCopy';

type Props={
  range:IsoRange; onRange:(range:IsoRange)=>void;
  kind:string; onKind:(value:string)=>void;
  query:string; onQuery:(value:string)=>void;
  pageSize:number; onPageSize:(value:number)=>void;
  onStatement:()=>void; onReset:()=>void;
};
const kinds=[
  {value:'All types',label:'All transactions'},
  {value:'sale',label:'Sales'},
  {value:'purchase',label:'Purchases'},
  {value:'customer-payment',label:'Customer payments'},
  {value:'supplier-payment',label:'Supplier payments'},
  {value:'finance',label:'Finance'},
  {value:'opening',label:'Opening balance'},
  {value:'note',label:'Notes'}
];
export function PartyLedgerToolbarResponsive({range,onRange,kind,onKind,query,onQuery,pageSize,onPageSize,onStatement,onReset}:Props){
  const {text}=useUiCopy();
  const [filtersOpen,setFiltersOpen]=useState(false);
  const activeCount=Number(Boolean(range.from||range.to))+Number(kind!=='All types')+Number(Boolean(query.trim()))+Number(pageSize!==25);
  const bn:Record<string,string>={'All transactions':'সব লেনদেন',Sales:'বিক্রি',Purchases:'ক্রয়','Customer payments':'ক্রেতার টাকা','Supplier payments':'সরবরাহকারীকে টাকা',Finance:'টাকার লেনদেন','Opening balance':'শুরুর জের',Notes:'মন্তব্য'};
  return <div data-hisabiq-field-group="party-ledger" className="flex min-w-0 flex-wrap items-center gap-2 border-b border-border px-3 py-2 sm:px-4 md:gap-1.5 md:py-1.5">
    <div className="relative order-1 min-w-0 flex-1 md:order-3 md:min-w-[180px]">
      <Search className="pointer-events-none absolute left-2 top-1/2 z-10 size-4 -translate-y-1/2 text-ink-400" aria-hidden="true"/>
      <Input aria-label={text('Search ledger transactions','খাতার লেনদেন খুঁজুন')} value={query} onChange={event=>onQuery(event.target.value)}
        placeholder={text('Search reference or note','নম্বর বা মন্তব্য খুঁজুন')} className="h-9 min-h-9 w-full pl-8"/>
    </div>
    <Button size="sm" variant="outline" className="order-2 h-9 min-h-9 shrink-0 md:hidden"
      aria-expanded={filtersOpen} aria-controls="party-ledger-filters" onClick={()=>setFiltersOpen(open=>!open)}>
      <SlidersHorizontal className="size-4" /> {text('Filters','ফিল্টার')}{activeCount>0&&<span className="rounded-full bg-teal-50 px-1.5 text-xs text-teal-800">{activeCount}</span>}
    </Button>
    <div id="party-ledger-filters" className={`${filtersOpen?'grid':'hidden'} order-3 w-full min-w-0 grid-cols-2 gap-2 rounded-lg bg-ink-50/50 p-2 md:contents md:p-0`}>
      <div className="col-span-2 min-w-0 md:order-1 md:col-span-1"><AppDateRangePicker label={text('Party ledger date range','পক্ষের খাতার তারিখ')} value={range} onChange={onRange}/></div>
      <div className="min-w-0 md:order-2"><AppSelect label={text('Transaction type','লেনদেনের ধরন')} value={kind} onChange={onKind}
        options={kinds.map(item=>({...item,label:text(item.label,bn[item.label]??item.label)}))}/></div>
      <div className="min-w-0 md:order-4"><AppSelect menuStyle="rows" label={text('Rows per page','প্রতি পাতায়')} value={String(pageSize)}
        options={['5','10','25','50','100']} onChange={value=>onPageSize(Number(value))}/></div>
      <div className="col-span-2 flex min-w-0 items-center gap-2 md:order-5 md:col-span-1 md:ml-auto">
        <Button size="sm" variant="outline" data-ledger-filter-action="" className="h-9 min-h-9 flex-1 md:flex-none" onClick={onReset}
          title={text('Clear filters','ফিল্টার মুছুন')}><RotateCcw className="size-3.5" />{text('Clear filters','ফিল্টার মুছুন')}</Button>
        <Button size="sm" variant="outline" data-ledger-filter-action="" className="h-9 min-h-9 flex-1 md:flex-none" onClick={onStatement}>
          <Printer className="size-3.5" />{text('Print statement','হিসাব প্রিন্ট')}</Button>
      </div>
    </div>
    {!filtersOpen&&activeCount>0&&<div className="order-4 flex w-full items-center justify-between text-xs text-ink-500 md:hidden">
      <span>{activeCount} {text('active filters','টি ফিল্টার চালু')}</span>
      <button type="button" className="h-9 rounded px-2 text-teal-700 underline focus-visible:outline-2" onClick={onReset}>{text('Clear filters','ফিল্টার মুছুন')}</button>
    </div>}
  </div>;
}
