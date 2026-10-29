import {CheckCircle2,Download} from 'lucide-react';
import {Button} from '../Button';
import {makeImportErrorCsv,downloadImportBlob} from '../../import/importTemplates.ts';
import type {ImportResult,StagedImportRow} from '../../import/importTypes.ts';
import {useUiCopy} from '../../i18n/useUiCopy';
export function ImportFinishStep({result,rows,onAnother,onView}:{
 result:ImportResult;rows:readonly StagedImportRow[];onAnother:()=>void;onView:()=>void;
}){
 const {text}=useUiCopy();
 const rejectedRows=rows.filter(row=>row.decision==='reject'||row.issues.some(issue=>issue.severity==='error'));
 const metrics=[
  [text('Created','নতুন যোগ হয়েছে'),result.created],[text('Master updated','তথ্য বদলেছে'),result.masterUpdated],
  [text('Role added','সম্পর্ক যোগ হয়েছে'),result.roleAdded],[text('Opening balances','শুরুর জের'),result.openingSources],
  [text('Opening lots','শুরুর স্টক লট'),result.openingLots],[text('Skipped','বাদ দেওয়া'),result.skipped],[text('Rejected','ভুলে বাদ'),result.rejected]
 ];
 return <div className="space-y-3 py-4 text-center">
  <CheckCircle2 className="mx-auto size-10 text-teal-700"/>
  <h3 className="text-base font-semibold text-ink">{text('Added to UI preview','নমুনা তালিকায় যোগ হয়েছে')}</h3>
  <p className="text-xs text-ink-500">{text('In-memory UI preview only — no records were saved to a server.','শুধু এই ব্রাউজারের নমুনা তালিকায় যোগ হয়েছে। সার্ভারে কোনো তথ্য জমা হয়নি।')}</p>
  <div className="grid grid-cols-2 gap-2 rounded-lg bg-ink-50 p-3 text-xs sm:grid-cols-4">
   {metrics.map(([label,value])=><div key={label}><strong className="text-lg text-ink">{value}</strong><p className="text-ink-500">{label}</p></div>)}
  </div>
  <div className="flex flex-wrap justify-center gap-2">
   {rejectedRows.length>0&&<Button variant="outline" onClick={()=>
    downloadImportBlob(new Blob([makeImportErrorCsv(rejectedRows)],{type:'text/csv;charset=utf-8'}),
     'hisabiq-import-errors.csv')}><Download className="size-4"/> {text('Download error report (.csv)','ভুলের তালিকা নামান (.csv)')}</Button>}
   <Button variant="outline" onClick={onAnother}>{text('Import another file','আরেকটি ফাইল আনুন')}</Button>
   <Button onClick={onView}>{text('View records','তালিকা দেখুন')}</Button>
  </div>
 </div>;
}
