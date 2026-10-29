import {matchesSearch as fuzzyMatch} from '../../utils/fuzzySearch';
import {useState} from 'react';
import {CheckCircle2,Search,AlertTriangle,Pencil} from 'lucide-react';
import type {ImportTarget,StagedImportRow} from '../../import/importTypes.ts';
import {validateMappedRow} from '../../import/columnMapping.ts';
import {Input} from '../Input';
import {Button} from '../Button';
import {AppSelect} from '../AppSelect';
import {toBasePrice,toBaseQuantity} from '../../utils/productEntry.ts';
import {useUiCopy} from '../../i18n/useUiCopy';
import {uiText,type UiLanguage} from '../../i18n/uiCopy';
import {importWizardError} from '../../i18n/importWizardCopy';
import {fieldsFor} from '../../import/fieldSchemas.ts';

function partyOpeningPreview(row:StagedImportRow,target:'customer'|'supplier',language:UiLanguage):string|null {
 const amount=Number(row.mapped.openingAmount||0);
 const direction=String(row.mapped.openingDirection||'').trim().toUpperCase();
 if(!Number.isFinite(amount)||amount<=0)return null;
 const explanation=target==='customer'
  ?(direction==='DR'?uiText(language,'Customer owes us','ক্রেতার কাছে পাওনা'):uiText(language,'We owe customer','ক্রেতাকে দিতে হবে'))
  :(direction==='CR'?uiText(language,'We owe supplier','সরবরাহকারীকে দিতে হবে'):uiText(language,'Supplier advance','সরবরাহকারীর অগ্রিম'));
 return uiText(language,'Opening: ','শুরুর জের: ')+direction+' '+amount.toLocaleString('en-BD')+' · '+explanation+' · '+uiText(language,'legacy-unverified, no money moved','পুরোনো যাচাইহীন হিসাব, টাকা সরেনি');
}
function productConversion(row:StagedImportRow,language:UiLanguage):string|null {
 const m=row.mapped,base=String(m.baseUnit??'').trim(),large=String(m.largeUnit??'').trim();
 const factor=large?Number(m.conversionFactor):1;
 if(!base||!Number.isFinite(factor)||factor<=0)return null;
 const opening=Number(m.openingStock||0),cost=Number(m.purchasePrice||0);
 const openingUnit=String(m.openingStockUnit||base),costUnit=String(m.purchasePriceUnit||base);
 if(![base,large].includes(openingUnit)||![base,large].includes(costUnit))return null;
 if(!Number.isFinite(opening)||!Number.isFinite(cost)||opening<0||cost<0)return null;
 const parts=[];
 if(opening>0)parts.push(uiText(language,'Opening: ','শুরুর স্টক: ')+opening+' '+openingUnit+' → '+toBaseQuantity(opening,openingUnit,base,large,factor)+' '+base);
 if(cost>0)parts.push(uiText(language,'Purchase: ','কেনা দাম: ')+cost+'/'+costUnit+' → '+toBasePrice(cost,costUnit,base,large,factor).toFixed(2)+'/'+base);
 return parts.join(' · ')||null;
}
type Filter='all'|'ready'|'errors'|'skipped';
const status=(row:StagedImportRow):Exclude<Filter,'all'>=>
 row.decision==='skip'?'skipped':row.issues.some(i=>i.severity==='error')?'errors':'ready';

export function ImportReviewStep({target,rows,onRowsChange}:{
 target:ImportTarget;rows:StagedImportRow[];onRowsChange:(rows:StagedImportRow[])=>void;
}){
 const {text,language}=useUiCopy();
 const [query,setQuery]=useState('');
 const [filter,setFilter]=useState<Filter>('all');
 const [editing,setEditing]=useState<number|null>(null);
 const [draft,setDraft]=useState<Record<string,string>>({});
 const fieldName=(key:string)=>{const field=fieldsFor(target).find(f=>f.key===key);return field?uiText(language,field.label,field.labelBn??field.label):key;};
 const counts={ready:rows.filter(row=>status(row)==='ready').length,
  errors:rows.filter(row=>status(row)==='errors').length,
  skipped:rows.filter(row=>status(row)==='skipped').length};
 const filtered=rows.filter(row=>{
  if(filter!=='all'&&status(row)!==filter)return false;
  return fuzzyMatch(query,Object.values(row.mapped).map(String));
 });
 const begin=(row:StagedImportRow)=>{
  setEditing(row.sourceRow);setDraft(Object.fromEntries(Object.entries(row.mapped).map(([key,value])=>[key,String(value??'')])));
 };
 const save=(row:StagedImportRow)=>{
  const mapped={...row.mapped,...draft};
  const validated=validateMappedRow({...row,mapped},target);
  onRowsChange(rows.map(candidate=>candidate===row?validated:candidate));
  setEditing(null);setDraft({});
 };
 const skip=(row:StagedImportRow)=>{
  onRowsChange(rows.map(candidate=>candidate===row?{...candidate,decision:row.decision==='skip'?'create':'skip'}:candidate));
 };
 return <div className="space-y-3">
  <div className="grid grid-cols-3 gap-2 rounded-md bg-ink-50 p-3 text-xs sm:grid-cols-4">
   <div><strong className="text-base text-ink">{rows.length}</strong><p className="text-ink-500">{text('Mapped rows','মেলানো সারি')}</p></div>
   <div><strong className="text-base text-teal-700 dark:text-teal-400">{counts.ready}</strong><p className="text-ink-500">{text('Ready','প্রস্তুত')}</p></div>
   <div><strong className="text-base text-danger">{counts.errors}</strong><p className="text-ink-500">{text('Errors','ভুল আছে')}</p></div>
   <div><strong className="text-base text-ink-500">{counts.skipped}</strong><p className="text-ink-500">{text('Skipped','বাদ দেওয়া')}</p></div>
  </div>
  <p className="text-xs text-ink-500">{text('Review source values, converted amounts and duplicate decisions before confirming. No server records are posted.','নিশ্চিত করার আগে তথ্য, একক বদলের হিসাব ও একই ব্যক্তির/পণ্যের সিদ্ধান্ত মিলিয়ে নিন। সার্ভারে কোনো তথ্য জমা হবে না।')}</p>
  <div className="flex flex-wrap gap-1.5" aria-label={text('Review status filters','সারির অবস্থা বাছুন')}>
   {([['all',text('All','সব')+' ('+rows.length+')'],['ready',text('Ready','প্রস্তুত')+' ('+counts.ready+')'],
     ['errors',text('Errors','ভুল')+' ('+counts.errors+')'],['skipped',text('Skipped','বাদ')+' ('+counts.skipped+')']] as const).map(([value,label])=>
    <Button key={value} type="button" size="sm" variant={filter===value?'default':'outline'} onClick={()=>setFilter(value)}>
      {label}
    </Button>)}
  </div>
  <div className="relative max-w-sm"><Search className="absolute left-2.5 top-2.5 size-4 text-ink-400"/>
   <Input aria-label={text('Search mapped rows','আনা সারি খুঁজুন')} value={query} placeholder={text('Search rows…','সারি খুঁজুন…')}
    onChange={e=>setQuery(e.target.value)} className="pl-8"/>
  </div>
  <div className="max-h-72 divide-y divide-border overflow-y-auto rounded-md border border-border">
   {filtered.slice(0,50).map(row=><div key={row.sourceSheet+'-'+row.sourceRow} className="space-y-2 px-3 py-2 text-xs">
    <div className="flex items-start gap-3">
     <span className="w-10 shrink-0 text-ink-400">#{row.sourceRow}</span>
     <div className="min-w-0 flex-1">
      <p className="break-words font-semibold text-ink">{String(row.mapped.name??text('Unnamed row','নাম নেই'))||text('Unnamed row','নাম নেই')}</p>
      <p className="break-words text-ink-500">
       {Object.entries(row.mapped).filter(([k])=>k!=='name').slice(0,5).map(([k,v])=>fieldName(k)+': '+String(v)).join(' · ')}
      </p>
      {target==='product'&&productConversion(row,language)&&<p className="mt-1 text-[11px] font-medium text-teal-700 dark:text-teal-400">{productConversion(row,language)}</p>}
      {target!=='product'&&partyOpeningPreview(row,target,language)&&<p className="mt-1 text-[11px] font-medium text-teal-700 dark:text-teal-400">{partyOpeningPreview(row,target,language)}</p>}
      {row.match&&<p className="mt-1 text-warning">
       {target==='product'?text('Existing SKU match: ','একই বারকোড পাওয়া গেছে: '):text('Potential Party match: ','একই পার্টি হতে পারে: ')}{row.match.label}
       {target==='product'?text(' · Update master data only; stock is unchanged.',' · শুধু পণ্যের তথ্য বদলাবে, স্টক বদলাবে না।'):text(' · Matching by phone does not merge automatically. Choose a deliberate action.',' · একই ফোন পেলেও নিজে থেকে এক হবে না। কী করবেন বাছুন।')}
      </p>}
      {row.issues.map((issue,i)=><p key={i} className={issue.severity==='warning'?'mt-1 text-warning':'mt-1 text-danger'} role={issue.severity==='warning'?'note':'alert'}>{issue.field?fieldName(issue.field)+': ':''}{importWizardError(language,issue.message)}</p>)}
     </div>
     {status(row)==='errors'?<span className="inline-flex items-center gap-1 text-danger"><AlertTriangle className="size-3.5"/> {text('Error','ভুল')}</span>
      :status(row)==='skipped'?<span className="text-ink-500">{text('Skipped','বাদ দেওয়া')}</span>
      :<span className="inline-flex items-center gap-1 text-teal-700 dark:text-teal-400"><CheckCircle2 className="size-3.5"/> {text('Ready','প্রস্তুত')}</span>}
    </div>
    {editing===row.sourceRow?<div className="space-y-2 rounded-md bg-ink-50 p-3">
      <div className="grid gap-2 sm:grid-cols-2">
       {Object.entries(draft).map(([key,value])=><label key={key} className="space-y-1 text-[11px] font-medium text-ink-600">
        <span>{fieldName(key)}</span>
        <Input aria-label={language==='Bangla'?'সম্পাদনা '+fieldName(key)+' সারি '+row.sourceRow:'Edit '+key+' row '+row.sourceRow} value={value}
         onChange={event=>setDraft(prev=>({...prev,[key]:event.target.value}))}/>
       </label>)}
      </div>
      <div className="flex justify-end gap-2">
       <Button size="sm" type="button" variant="outline" onClick={()=>{setEditing(null);setDraft({});}}>{text('Cancel edit','সম্পাদনা বাতিল')}</Button>
       <Button size="sm" type="button" onClick={()=>save(row)}>{text('Save row','সারি রাখুন')} {row.sourceRow}</Button>
      </div>
     </div>:
     <div className="flex items-center justify-end gap-2">
      {target==='product'?<div className="min-w-[160px]">
       <AppSelect label={text('Import action for row','সারি আনার সিদ্ধান্ত')+' '+row.sourceRow} compact value={row.decision}
        options={row.match
         ?[{value:'skip',label:text('Skip duplicate','একই পণ্য বাদ দিন')},{value:'update-master',label:text('Update master only','শুধু পণ্যের তথ্য বদলান')}]
         :[{value:'create',label:text('Create product','নতুন পণ্য যোগ করুন')},{value:'skip',label:text('Skip row','সারি বাদ দিন')}]}
        onChange={value=>onRowsChange(rows.map(item=>item===row?{...item,decision:value as StagedImportRow['decision']}:item))}/>
      </div>:row.match?<div className="min-w-[185px]">
       <AppSelect label={text('Party identity action for row','পার্টি মিললে সিদ্ধান্ত')+' '+row.sourceRow} compact value={row.decision}
        options={[
         {value:'skip',label:text('Skip matched Party','মিলে যাওয়া পার্টি বাদ দিন')},
         ...(!row.match.hasRole?[{value:'add-role',label:text('Add missing relationship','নতুন সম্পর্ক যোগ করুন')}]:[]),
         ...(row.match.kind==='suggested'?[{value:'create',label:text('Create separately (distinct person)','আলাদা ব্যক্তি হিসেবে যোগ করুন')}]:[])
        ]}
        onChange={value=>onRowsChange(rows.map(item=>item===row?{...item,decision:value as StagedImportRow['decision']}:item))}/>
      </div>:<Button size="sm" type="button" variant="outline" onClick={()=>skip(row)}>
       {row.decision==='skip'?text('Include row','সারি রাখুন'):text('Skip row','সারি বাদ দিন')}
      </Button>}
      <Button size="sm" type="button" variant="outline" onClick={()=>begin(row)}
       aria-label={text('Edit mapped row','সারি সম্পাদনা')+' '+row.sourceRow}><Pencil className="size-3"/> {text('Edit','সম্পাদনা')}</Button>
     </div>}
   </div>)}
   {filtered.length>50&&<p className="p-3 text-xs text-ink-500">{text('Showing first 50 mapped rows. Search to narrow results.','প্রথম ৫০টি সারি দেখানো হচ্ছে। আরও খুঁজতে সার্চ করুন।')}</p>}
   {!filtered.length&&<p className="p-6 text-center text-xs text-ink-500">{text('No matching rows.','মিলে এমন সারি নেই।')}</p>}
  </div>
 </div>;
}
