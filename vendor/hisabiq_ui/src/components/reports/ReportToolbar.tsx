import { WorkspaceToolbar } from '../WorkspaceToolbar';
import { useId, useState } from 'react';
import { SlidersHorizontal, Columns3, Bookmark, X } from 'lucide-react';
import { Button } from '../Button';
import { Input } from '../Input';
import { AppSelect } from '../AppSelect';
import { AppDateRangePicker } from '../AppDateRangePicker';
import { SearchSelect } from '../SearchSelect';
import { StatusBadge } from '../StatusBadge';
import { ReportHelp, ReportLabel } from './ReportGuidance';
import { useUiCopy } from '../../i18n/useUiCopy';
import { reportPhrase } from '../../reports/copy';
import { validDay } from '../../reports/model';
import type { ReportDefinition, ReportFilters } from '../../reports/types';

type Option={value:string;label:string};
export function ReportToolbar({definition,filters,options,onChange,onColumns,onSaved,asOf}:{
 definition:ReportDefinition;filters:ReportFilters;options:Record<string,Option[]>;onChange:(f:ReportFilters)=>void;
 onColumns:()=>void;onSaved:()=>void;asOf:string;
}){
 const {text,language}=useUiCopy(),id=useId();const [expanded,setExpanded]=useState(false);
 const fields:{key:typeof definition.dimensions[number];en:string;bn:string}[]=[
  {key:'product',en:'Product',bn:'পণ্য'},{key:'category',en:'Category',bn:'ক্যাটাগরি'},{key:'brand',en:'Brand',bn:'ব্র্যান্ড'},
  {key:'party',en:'Customer / supplier',bn:'গ্রাহক / সরবরাহকারী'},{key:'user',en:'Recorded by',bn:'এন্ট্রি করেছেন'},
  {key:'account',en:'Account',bn:'অ্যাকাউন্ট'},{key:'status',en:'Status',bn:'অবস্থা'}];
 const selected=fields.filter(f=>definition.dimensions.includes(f.key)&&filters[f.key]);
 return <WorkspaceToolbar search={<Input type="search" aria-label={text('Search report records','রিপোর্টের রেকর্ড খুঁজুন')} placeholder={text('Search records, references, people…','রেকর্ড, নম্বর, নাম খুঁজুন…')} value={filters.search} onChange={e=>onChange({...filters,search:e.target.value})}/>} details={<>
  {!definition.snapshot&&((filters.from&&!validDay(filters.from))||(filters.to&&!validDay(filters.to))||(filters.from&&filters.to&&filters.from>filters.to))&&<p role="alert" className="text-xs text-danger">{text('Choose a valid date range to view records.','রেকর্ড দেখতে সঠিক সময়কাল বাছুন।')}</p>}
  {expanded&&<div id={id} className="grid grid-cols-1 gap-3 border-t border-border pt-3 sm:grid-cols-2 lg:grid-cols-4">
   {fields.filter(f=>definition.dimensions.includes(f.key)).map(f=><label key={f.key} className="min-w-0 space-y-1 text-xs text-ink-600">
    <ReportLabel en={f.en} bn={f.bn}/>
    {f.key==='status'||f.key==='user'?<AppSelect label={text(f.en,f.bn)} value={filters[f.key]} options={[{value:'',label:text('All','সব')},...(options[f.key]??[]).map(o=>({...o,label:reportPhrase(o.label,language)}))]} onChange={v=>onChange({...filters,[f.key]:v})}/>:
     <SearchSelect id={id+'-'+f.key} noun={{en:f.en,bn:f.bn}} ariaLabel={text(f.en,f.bn)} value={filters[f.key]} options={[{value:'',label:text('All','সব')},...(options[f.key]??[]).map(o=>({...o,label:reportPhrase(o.label,language)}))]} onChange={v=>onChange({...filters,[f.key]:v})}/>}
   </label>)}
  </div>}
  {(selected.length>0||filters.search||definition.snapshot)&&<div className="flex flex-wrap items-center gap-2 text-xs text-ink-600">
   {definition.snapshot&&<span className="mr-auto flex items-center gap-2"><StatusBadge tone="info">{text('Current snapshot','বর্তমান অবস্থা')}</StatusBadge>{asOf}<ReportHelp guide={definition.id==='receivables'||definition.id==='payables'||definition.id==='collections'?'due':'stock'} label={text('Current snapshot','বর্তমান অবস্থা')}/></span>}
   {selected.map(f=><Button key={f.key} variant="outline" size="sm" onClick={()=>onChange({...filters,[f.key]:''})} aria-label={text('Clear '+f.en,f.bn+' মুছুন')}>{text(f.en,f.bn)}: {reportPhrase(options[f.key]?.find(o=>o.value===filters[f.key])?.label??filters[f.key],language)}<X className="size-3" aria-hidden="true"/></Button>)}
   {(selected.length>0||filters.search)&&<Button variant="ghost" size="sm" onClick={()=>onChange({...filters,search:'',category:'',brand:'',product:'',party:'',user:'',account:'',status:''})}>{text('Clear filters','ফিল্টার মুছুন')}</Button>}
  </div>}
 </>}>
   {!definition.snapshot&&<AppDateRangePicker label={text('Report date range','রিপোর্টের সময়কাল')} value={{from:validDay(filters.from)?filters.from:'',to:validDay(filters.to)?filters.to:''}} onChange={r=>onChange({...filters,...r})} className="max-w-full"/>}
   {!definition.snapshot&&<div className="flex items-center"><AppSelect label={text('Compare','তুলনা')} value={filters.compare} className="w-40" options={[{value:'none',label:text('No comparison','তুলনা ছাড়া')},{value:'previous',label:text('Previous period','আগের সময়কাল')}]} onChange={v=>onChange({...filters,compare:v==='previous'?'previous':'none'})}/><ReportHelp guide="compare" label={text('Period comparison','সময়ের তুলনা')}/></div>}
   <Button variant="outline" onClick={()=>setExpanded(v=>!v)} aria-expanded={expanded} aria-controls={id}><SlidersHorizontal className="size-4" aria-hidden="true"/>{text('Filters','ফিল্টার')}{selected.length>0&&<span className="text-primary">({selected.length})</span>}</Button>
   <Button variant="outline" onClick={onColumns}><Columns3 className="size-4" aria-hidden="true"/>{text('Columns','কলাম')}</Button>
   <Button variant="outline" onClick={onSaved}><Bookmark className="size-4" aria-hidden="true"/>{text('Saved views','সংরক্ষিত ভিউ')}</Button>
 </WorkspaceToolbar>;
}

