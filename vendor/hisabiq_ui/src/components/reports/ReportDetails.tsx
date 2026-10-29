import { useState } from 'react';
import { ArrowLeft, ExternalLink, Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../Button';
import { StatusBadge } from '../StatusBadge';
import { ReportHelp, ReportLabel } from './ReportGuidance';
import { reportStatusTone } from '../../reports/guidance';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../Dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../Table';
import { useUiCopy } from '../../i18n/useUiCopy';
import { reportColumns } from '../../reports/catalog';
import { reportCell } from '../../reports/model';
import { reportPhrase } from '../../reports/copy';
import { formatReportCell } from './ReportResults';
import type { ReportRow } from '../../reports/types';

export function ReportDetails({row,onClose,onPrint}:{row:ReportRow;onClose:()=>void;onPrint:(row:ReportRow)=>void}){
 const {text,language}=useUiCopy(),navigate=useNavigate(),[trail,setTrail]=useState([row]);
 const current=trail[trail.length-1];
 const fields=Object.keys(reportColumns).filter(k=>k!=='label'&&k!=='note'&&reportCell(current,k)!==null&&reportCell(current,k)!=='');
 return <Dialog open onOpenChange={open=>!open&&onClose()}>
  <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
   <DialogHeader><DialogTitle>{text('Report details','রিপোর্টের বিস্তারিত')}</DialogTitle><DialogDescription>{text('Read the source evidence behind this result.','এই ফলাফলের পেছনের মূল তথ্য দেখুন।')}</DialogDescription></DialogHeader>
   {trail.length>1&&<Button variant="ghost" className="w-fit" onClick={()=>setTrail(v=>v.slice(0,-1))}><ArrowLeft className="size-4" aria-hidden="true"/>{text('Back to summary','সারাংশে ফিরুন')}</Button>}
   <h3 className="text-base font-semibold text-ink">{language==='Bangla'?(current.labelBn??current.label):current.label}</h3>
   <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">{fields.map(k=><div key={k} className="min-w-0"><dt className="flex items-center gap-1 text-xs text-ink-500"><ReportLabel en={reportColumns[k].en} bn={reportColumns[k].bn}/><ReportHelp guide={k} label={text(reportColumns[k].en,reportColumns[k].bn)}/></dt><dd className="mt-0.5 break-words text-sm font-medium text-ink">{k==='status'?<StatusBadge tone={reportStatusTone(current.status)} dot>{formatReportCell(current,k,language)}</StatusBadge>:formatReportCell(current,k,language)}</dd></div>)}</dl>
   {current.note&&<p className="rounded-lg bg-ink-50 p-3 text-sm text-ink-600">{reportPhrase(current.note,language)}</p>}
   {current.children&&current.children.length>0&&<div className="overflow-hidden rounded-lg border border-border">
    <Table className="text-[13px]" scrollRegionLabel={text('Contributing records','মূল রেকর্ড')}>
     <TableHeader><TableRow className="bg-ink-50/50"><TableHead className="px-3 py-2">{text('Contributing records','মূল রেকর্ড')}</TableHead><TableHead className="px-3 py-2">{text('Date','তারিখ')}</TableHead><TableHead className="px-3 py-2 text-right">{text('Amount','মোট টাকা')}</TableHead></TableRow></TableHeader>
     <TableBody>{current.children.map(child=><TableRow key={child.id}><TableCell className="px-3 py-2 whitespace-normal"><button type="button" className="whitespace-normal text-left text-sm font-medium leading-6 text-primary hover:underline" onClick={()=>setTrail(v=>[...v,child])}>{language==='Bangla'?(child.labelBn??child.label):child.label}</button></TableCell><TableCell className="px-3 py-2 text-sm text-ink-600">{formatReportCell(child,'date',language)}</TableCell><TableCell className="px-3 py-2 text-right text-sm font-medium">{formatReportCell(child,'amount',language)}</TableCell></TableRow>)}</TableBody>
    </Table>
   </div>}
   <DialogFooter>
    <Button variant="outline" onClick={()=>onPrint(current)}><Printer className="size-4" aria-hidden="true"/>{text('Print details','বিস্তারিত প্রিন্ট')}</Button>
    {current.route&&<Button variant="outline" onClick={()=>{const path=current.route;if(path){onClose();navigate(path);}}}><ExternalLink className="size-4" aria-hidden="true"/>{text('Open source module','মূল মডিউল খুলুন')}</Button>}
    <Button onClick={onClose}>{text('Close details','বিস্তারিত বন্ধ করুন')}</Button>
   </DialogFooter>
  </DialogContent>
 </Dialog>;
}

