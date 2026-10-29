import {useEffect,useState} from 'react';
import {toast} from 'sonner';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '../Dialog';
import {Button} from '../Button';
import {AppSelect} from '../AppSelect';
import {ImportWizard} from '../import/ImportWizard';
import {planPartyImport,resolvePartyImportDecisions,type PartyImportTarget} from '../../import/partyImport.ts';
import {commitPartyImportBatch,getPartyPreviewSnapshot} from '../../data/partyPreviewStore.ts';
import {businessToday} from '../../utils/dateRange.ts';
import type {PartyRole} from '../../types/erp.ts';
import type {StagedImportRow} from '../../import/importTypes.ts';
import {useUiCopy} from '../../i18n/useUiCopy';
import {partyImportErrorText} from '../../i18n/partyImportCopy';

export function PartyExcelImportDialog({open,selectedRole,onClose,onLegacyImport}:{
 open:boolean;selectedRole:PartyRole|'All';onClose:()=>void;onLegacyImport:()=>void;
}){
 const {text,language,showHelper}=useUiCopy();
 const [target,setTarget]=useState<PartyImportTarget|''>('');
 useEffect(()=>{
  if(open)setTarget(selectedRole==='Customer'?'customer':selectedRole==='Supplier'?'supplier':'');
 },[open,selectedRole]);
 const prepareRows=(rows:StagedImportRow[]):StagedImportRow[]=>{
  if(!target)return rows;
  const cleaned=rows.map(row=>({...row,issues:row.issues.filter(issue=>!['party','identity'].includes(issue.field??''))}));
  const resolved=resolvePartyImportDecisions(cleaned,target,getPartyPreviewSnapshot());
  const planned=planPartyImport(resolved,target,getPartyPreviewSnapshot(),{sessionId:'party-review',today:businessToday()});
  return resolved.map(row=>({...row,issues:[...row.issues,...planned.issues.filter(issue=>issue.sourceRow===row.sourceRow)]}));
 };
 if(!open)return null;
 if(!target)return <Dialog open={open} onOpenChange={value=>!value&&onClose()}>
  <DialogContent className="sm:max-w-md" role="dialog" aria-label={text('Choose Party import type','কোন পার্টির তথ্য আনবেন?')}>
   <DialogHeader>
    <DialogTitle>{text('Import customers or suppliers','ক্রেতা বা সরবরাহকারীর তথ্য আনুন')} {showHelper&&<span className="font-bn text-xs font-normal text-ink-500">· ডাটা ইমপোর্ট</span>}</DialogTitle>
    <DialogDescription>{text('Choose one relationship. A person can be both Customer and Supplier; each opening balance remains separate.','ক্রেতা অথবা সরবরাহকারী বাছুন। একই ব্যক্তি উভয় হতে পারেন, কিন্তু শুরুর জের আলাদা থাকবে।')}</DialogDescription>
   </DialogHeader>
   <div className="space-y-2">
    <AppSelect label={text('Relationship to import','কোন সম্পর্কের তথ্য আনবেন')} value={target} onChange={value=>setTarget(value as PartyImportTarget)}
     placeholder={text('Choose customer or supplier','ক্রেতা বা সরবরাহকারী বাছুন')} options={[
      {value:'customer',label:showHelper?'Customers · ক্রেতা':text('Customers','ক্রেতা')},
      {value:'supplier',label:showHelper?'Suppliers · সরবরাহকারী':text('Suppliers','সরবরাহকারী')}
     ]}/>
    <p className="text-xs text-ink-500">{text('Imported opening balances never move Cash, Bank or Mobile Banking accounts.','আনা শুরুর জের ক্যাশ, ব্যাংক বা মোবাইল ব্যাংকিংয়ের টাকা বদলায় না।')}</p>
   </div>
   <div className="flex flex-wrap justify-between gap-2 border-t border-border pt-3">
    <Button variant="outline" onClick={onClose}>{text('Cancel','বাতিল')}</Button>
    <Button variant="outline" onClick={onLegacyImport}>{text('Legacy multi-role CSV','আগের ধরনের CSV')}</Button>
   </div>
  </DialogContent>
 </Dialog>;
 return <ImportWizard target={target} open={open} onClose={onClose} prepareRows={prepareRows}
  onApply={async(rows,sessionId)=>{
   const snapshot=getPartyPreviewSnapshot();
   const cleaned=rows.map(row=>({...row,issues:row.issues.filter(issue=>issue.field!=='party')}));
   const resolved=resolvePartyImportDecisions(cleaned,target,snapshot);
   const plan=planPartyImport(resolved,target,snapshot,{sessionId,today:businessToday()});
   if(plan.issues.length){
    const errors=plan.issues.filter(issue=>issue.severity==='error');
    if(errors.length)throw new Error(errors.slice(0,3).map(issue=>text('Row','সারি')+' '+issue.sourceRow+': '+partyImportErrorText(language,issue.message)).join(' • ')+
     (errors.length>3?' ('+errors.length+' '+text('errors','ভুল')+')':''));
   }
   const result=commitPartyImportBatch(plan);
   toast.success(target==='customer'?text('Customer import applied to preview','নমুনা তালিকায় ক্রেতা যোগ হয়েছে'):text('Supplier import applied to preview','নমুনা তালিকায় সরবরাহকারী যোগ হয়েছে'),
    {description:result.created+' '+text('created','নতুন')+' · '+result.roleAdded+' '+text('roles added','সম্পর্ক যোগ')+' · '+result.openingSources+' '+text('openings','শুরুর জের')});
   return result;
  }}/>;
}
