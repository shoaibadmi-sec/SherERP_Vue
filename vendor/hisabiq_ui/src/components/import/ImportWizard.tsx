import {useEffect,useRef,useState} from 'react';
import {Dialog,DialogContent,DialogDescription,DialogHeader,DialogTitle} from '../Dialog';
import {Button} from '../Button';
import {ImportUploadStep} from './ImportUploadStep';
import {ImportMappingStep} from './ImportMappingStep';
import {ImportReviewStep} from './ImportReviewStep';
import {ImportFinishStep} from './ImportFinishStep';
import {suggestColumnMapping,mapImportRows} from '../../import/columnMapping.ts';
import type {ImportTarget,ImportStep,ImportTable,ColumnMapping,StagedImportRow,ImportResult} from '../../import/importTypes.ts';
import {useUiCopy} from '../../i18n/useUiCopy';
import {importTargetTitle,importWizardError} from '../../i18n/importWizardCopy';

const order:ImportStep[]=['upload','map','review','finish'];
export function ImportWizard({target,open,onClose,onApply,prepareRows}:{
 target:ImportTarget;open:boolean;onClose:()=>void;
 onApply?:(rows:StagedImportRow[],sessionId:string)=>Promise<ImportResult>;
 prepareRows?:(rows:StagedImportRow[])=>StagedImportRow[];
}){
 const {text,language,showHelper}=useUiCopy();
 const [step,setStep]=useState<ImportStep>('upload');
 const [tables,setTables]=useState<ImportTable[]>([]);
 const [sheet,setSheet]=useState('');
 const [mapping,setMapping]=useState<ColumnMapping>({});
 const [rows,setRows]=useState<StagedImportRow[]>([]);
 const [result,setResult]=useState<ImportResult|null>(null);
 const [error,setError]=useState('');
 const [busy,setBusy]=useState(false);
 const headerRef=useRef<HTMLHeadingElement>(null);
 const current=tables.find(t=>t.sheet===sheet)??tables[0]??null;
 useEffect(()=>{if(open){setStep('upload');setTables([]);setSheet('');setMapping({});setRows([]);setResult(null);setError('');}},[open,target]);
 useEffect(()=>{if(open)headerRef.current?.focus();},[open,step]);
 const selectSheet=(name:string)=>{
  const table=tables.find(t=>t.sheet===name);if(!table)return;
  setSheet(name);setMapping(suggestColumnMapping(target,table.headers).mapping);setRows([]);setError('');
 };
 const read=(next:ImportTable[])=>{
  setTables(next);const chosen=next.find(t=>t.headers.length>0)??next[0];
  setSheet(chosen?.sheet??'');setMapping(chosen?suggestColumnMapping(target,chosen.headers).mapping:{});
  setRows([]);setError('');
 };
 const next=async()=>{
  setError('');
  if(step==='upload'){
   if(!current||!current.headers.length){setError(text('Select a file with at least one heading row.','কলামের নামসহ একটি ফাইল বাছুন।'));return;}
   setStep('map');return;
  }
  if(step==='map'){
   if(!current)return;
   try{if(!rows.length){const mapped=mapImportRows(current,mapping);setRows(prepareRows?prepareRows(mapped):mapped);}setStep('review');}
   catch(e){setError(importWizardError(language,e instanceof Error?e.message:'Invalid column mapping.'));}
   return;
  }
  if(step==='review'&&onApply){
   if(!rows.some(row=>row.decision!=='skip'&&row.decision!=='reject')){setError(text('Select at least one valid row to import.','আনার জন্য অন্তত একটি সঠিক সারি বাছুন।'));return;}
   setBusy(true);
   try{
    const outcome=await onApply(rows,globalThis.crypto?.randomUUID?.()??String(Date.now()));
    setResult(outcome);setStep('finish');
   }catch(e){setError(importWizardError(language,e instanceof Error?e.message:'Import was not applied.'));}
   finally{setBusy(false);}
  }
 };
 const previous=()=>{const index=order.indexOf(step);if(index>0){setStep(order[index-1]);setError('');}};
 const restart=()=>{setStep('upload');setTables([]);setSheet('');setMapping({});setRows([]);setResult(null);setError('');};
 const title=importTargetTitle(language,target);
 const stepText:Record<ImportStep,string>={upload:text('Upload','ফাইল বাছুন'),map:text('Map columns','কলাম মেলান'),review:text('Review','যাচাই'),finish:text('Finish','শেষ')};
 return <Dialog open={open} onOpenChange={value=>{if(!value&&!busy)onClose();}}>
  <DialogContent role="dialog" aria-modal="true" aria-label={title}
    className="max-h-[94vh] w-[calc(100vw-1rem)] overflow-y-auto sm:max-w-4xl">
   <DialogHeader>
    <DialogTitle ref={headerRef} tabIndex={-1}>{title} {showHelper&&<span className="font-bn text-sm font-normal text-ink-500">· ডাটা ইমপোর্ট</span>}</DialogTitle>
    <DialogDescription>{text('Excel (.xlsx) and CSV (.csv) · UI preview only — no server records are posted.','Excel (.xlsx) বা CSV (.csv) ফাইল আনুন। শুধু নমুনা তালিকায় যোগ হবে; সার্ভারে কোনো তথ্য জমা হবে না।')}</DialogDescription>
   </DialogHeader>
   <div className="grid grid-cols-4 gap-1.5" aria-label={text('Import progress','তথ্য আনার ধাপ')}>
    {order.map((stage,index)=><div key={stage} aria-current={stage===step?'step':undefined}
     className={ "min-w-0 rounded-md px-1.5 py-2 text-center text-[11px] font-medium " +
      (stage===step?'bg-teal-700 text-white':'bg-ink-50 text-ink-500')}>
     {index+1}. {stepText[stage]}
    </div>)}
   </div>
   {error&&<p className="rounded-md bg-danger-bg p-3 text-xs text-danger" role="alert">{error}</p>}
   {step==='upload'&&<ImportUploadStep target={target} tables={tables} selected={current} onRead={read} onSelect={selectSheet} onError={setError}/>}
   {step==='map'&&current&&<ImportMappingStep target={target} table={current} mapping={mapping} onMapping={nextMapping=>{setMapping(nextMapping);setRows([]);setError('');}}/>}
   {step==='review'&&<ImportReviewStep target={target} rows={rows} onRowsChange={next=>setRows(prepareRows?prepareRows(next):next)}/>}
   {step==='finish'&&result&&<ImportFinishStep result={result} rows={rows} onAnother={restart} onView={onClose}/>}
   {step!=='finish'&&<div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
    <Button type="button" variant="outline" disabled={busy} onClick={onClose}>{text('Cancel','বাতিল')}</Button>
    <div className="flex flex-wrap items-center justify-end gap-2">
     {step!=='upload'&&<Button type="button" variant="outline" onClick={previous}>{text('Back','আগে')}</Button>}
     {step==='upload'&&<Button type="button" disabled={!current?.headers.length} onClick={()=>void next()}>{text('Next: Map columns','পরের ধাপ: কলাম মেলান')}</Button>}
     {step==='map'&&<Button type="button" onClick={()=>void next()}>{text('Next: Review','পরের ধাপ: যাচাই')}</Button>}
     {step==='review'&&<Button type="button" disabled={!onApply||busy||!rows.some(row=>row.decision!=='skip'&&row.decision!=='reject')||rows.some(row=>row.decision!=='skip'&&row.issues.some(i=>i.severity==='error'))} onClick={()=>void next()}>
       {busy?text('Importing…','তথ্য আনা হচ্ছে…'):text('Confirm import','আনা নিশ্চিত করুন')}
     </Button>}
    </div>
   </div>}
   {step==='review'&&onApply&&rows.some(row=>!['skip','reject'].includes(row.decision)&&
    Number(target==='product'?row.mapped.openingStock:row.mapped.openingAmount)>0)&&
    <p className="text-xs text-warning" role="note">{text('Confirming will create Opening '+(target==='product'?'Stock lots':'Ledger balances')+' for the selected rows. Party opening balances are unverified historical entries; no payment account is changed.',target==='product'?'নিশ্চিত করলে বাছা সারিতে শুরুর স্টক যোগ হবে। এটি শুধু নমুনা হিসাব।':'নিশ্চিত করলে শুরুর জের যোগ হবে। পুরোনো হিসাব যাচাই করা নয়; ক্যাশ, ব্যাংক বা মোবাইল হিসাব বদলাবে না।')}</p>}
   {step==='review'&&!onApply&&<p role="note" className="text-right text-xs text-ink-500">
    {text('Confirm is unavailable until the '+target+' import adapter is connected. No data has been saved.','এই তথ্য আনার সংযোগ এখনও চালু নেই। কোনো তথ্য জমা হয়নি।')}
   </p>}
  </DialogContent>
 </Dialog>;
}
