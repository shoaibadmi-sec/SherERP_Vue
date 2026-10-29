import {AppSelect} from '../AppSelect';
import type {ColumnMapping,ImportTable,ImportTarget} from '../../import/importTypes.ts';
import {fieldsFor} from '../../import/fieldSchemas.ts';
import {useUiCopy} from '../../i18n/useUiCopy';

export function ImportMappingStep({target,table,mapping,onMapping}:{
 target:ImportTarget;table:ImportTable;mapping:ColumnMapping;onMapping:(next:ColumnMapping)=>void;
}){
 const {text,language,showHelper}=useUiCopy();
 const fields=fieldsFor(target);
 const fieldLabel=(en:string,bn:string)=>language==='Bangla'?bn:en;
 return <div className="space-y-3">
  <p className="text-xs text-ink-600">{text('Match the spreadsheet headings to HisabIQ fields. Required columns are marked *. Unmapped optional columns will be ignored.','ফাইলের কলামের সঙ্গে HisabIQ-এর তথ্যের ঘর মিলিয়ে দিন। * চিহ্নের ঘর আবশ্যক। ঐচ্ছিক ঘর না মিলালে তা বাদ যাবে।')}</p>
  <div className="grid gap-2 sm:grid-cols-2">
   {fields.filter(f=>f.required||mapping[f.key]!==null).map(f=><div key={f.key} className="min-w-0 rounded-md border border-border p-2">
    <p className="mb-1 text-xs font-medium text-ink">{fieldLabel(f.label,f.labelBn??f.label)}{f.required?' *':''}
      {showHelper&&<span className="ml-1 font-bn text-[10px] font-normal text-ink-500">· {f.labelBn}</span>}</p>
    <AppSelect compact label={fieldLabel(f.label,f.labelBn??f.label)} value={mapping[f.key]===null?'none':String(mapping[f.key])}
     onChange={v=>onMapping({...mapping,[f.key]:v==='none'?null:Number(v)})}
     options={[{value:'none',label:text('— Do not import —','— আনবেন না —')},...table.headers.map((h,i)=>({value:String(i),label:h||text('Column','কলাম')+' '+(i+1)}))]}/>
   </div>)}
  </div>
  <details className="rounded-md border border-border p-3">
   <summary className="cursor-pointer text-xs font-medium text-ink">{text('Additional optional fields','আরও ঐচ্ছিক ঘর')} ({fields.filter(f=>!f.required&&mapping[f.key]===null).length})</summary>
   <div className="mt-3 grid gap-2 sm:grid-cols-2">
    {fields.filter(f=>!f.required&&mapping[f.key]===null).map(f=><div key={f.key}>
     <p className="mb-1 text-xs text-ink">{fieldLabel(f.label,f.labelBn??f.label)} {showHelper&&<span className="font-bn text-ink-500">· {f.labelBn}</span>}</p>
     <AppSelect compact label={fieldLabel(f.label,f.labelBn??f.label)} value="none" onChange={v=>onMapping({...mapping,[f.key]:v==='none'?null:Number(v)})}
      options={[{value:'none',label:text('— Do not import —','— আনবেন না —')},...table.headers.map((h,i)=>({value:String(i),label:h||text('Column','কলাম')+' '+(i+1)}))]}/>
    </div>)}
   </div>
  </details>
  <div className="rounded-md bg-ink-50 p-3 text-xs">
   <strong className="text-ink">{text('Source preview','ফাইলের নমুনা')}</strong>
   <div className="mt-2 flex flex-wrap gap-2">
    {table.headers.slice(0,8).map((h,i)=><span key={i} className="rounded border border-border bg-card px-2 py-1 text-ink-600">
      {h}: {String(table.rows[0]?.cells[i]??'—')}
    </span>)}
   </div>
  </div>
 </div>;
}
