import { Printer, RotateCcw, Search } from 'lucide-react';
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
export function PartyLedgerToolbar({range,onRange,kind,onKind,query,onQuery,pageSize,onPageSize,onStatement,onReset}:Props){
  const {text}=useUiCopy();
  const bn:Record<string,string>={'All transactions':'সব লেনদেন',Sales:'বিক্রি',Purchases:'ক্রয়','Customer payments':'ক্রেতার টাকা','Supplier payments':'সরবরাহকারীকে টাকা',Finance:'টাকার লেনদেন','Opening balance':'শুরুর জের',Notes:'মন্তব্য'};
  return <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2">
    <AppDateRangePicker label={text("Party ledger date range","পক্ষের খাতার তারিখ")} value={range} onChange={onRange}/>
    <AppSelect label={text("Transaction type","লেনদেনের ধরন")} value={kind} onChange={onKind} options={kinds.map(item=>({...item,label:text(item.label,bn[item.label]??item.label)}))}/>
    <div className="relative min-w-[150px] flex-1">
      <Search className="pointer-events-none absolute z-10 left-2 top-1/2 size-4 -translate-y-1/2 text-ink-400"/>
      <Input aria-label={text("Search ledger transactions","খাতার লেনদেন খুঁজুন")} value={query} onChange={event=>onQuery(event.target.value)}
        placeholder={text("Search reference or note","নম্বর বা মন্তব্য খুঁজুন")} className="pl-8"/>
    </div>
    <AppSelect menuStyle="rows" label={text("Rows per page","প্রতি পাতায়")} value={String(pageSize)} options={['5','10','25','50','100']}
      onChange={value=>onPageSize(Number(value))}/>
    <Button size="sm" variant="outline" onClick={onReset} title={text("Clear filters","ফিল্টার মুছুন")}><RotateCcw className="size-3.5"/> {text('Clear filters','ফিল্টার মুছুন')}</Button>
    <Button size="sm" variant="outline" onClick={onStatement}><Printer className="size-3.5"/> {text('Print statement','হিসাব প্রিন্ট')}</Button>
  </div>;
}
