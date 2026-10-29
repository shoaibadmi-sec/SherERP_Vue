import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, FileSearch } from 'lucide-react';
import { Button } from '../Button';
import { AppSelect } from '../AppSelect';
import { StatusBadge } from '../StatusBadge';
import { ReportHelp, ReportLabel } from './ReportGuidance';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../Table';
import { useUiCopy } from '../../i18n/useUiCopy';
import { taka, formatNumber } from '../../utils/currency';
import { formatDay } from '../../utils/dateRange';
import { reportColumns } from '../../reports/catalog';
import { reportCell } from '../../reports/model';
import { reportPhrase } from '../../reports/copy';
import { reportStatusTone, reportValueTone, reportToneClass } from '../../reports/guidance';
import type { ReportDefinition, ReportFilters, ReportResult, ReportRow } from '../../reports/types';

export function formatReportCell(row:ReportRow,key:string,language:string):string{
 const value=reportCell(row,key),column=reportColumns[key];
 if(value===null)return '—';
 if(value==='')return '—';
 if(column?.kind==='money')return typeof value==='number'?taka(value):String(value);
 if(column?.kind==='quantity')return Number(value).toLocaleString('en-IN',{maximumFractionDigits:12})+(row.values.unit?' '+row.values.unit:'');
 if(column?.kind==='percent')return formatNumber(Number(value))+'%';
 if(column?.kind==='number')return formatNumber(Number(value));
 if(column?.kind==='date')return /^\d{4}-\d{2}-\d{2}$/.test(String(value))?formatDay(String(value)):String(value);
 if(key==='label'&&language==='Bangla')return row.labelBn??row.label;
 return reportPhrase(String(value),language);
}

export function ReportResults({definition,result,filters,onChange,visible,onDetail,page,setPage,pageSize,setPageSize}:{
 definition:ReportDefinition;result:ReportResult;filters:ReportFilters;onChange:(f:ReportFilters)=>void;visible:string[];
 onDetail:(r:ReportRow)=>void;page:number;setPage:(p:number)=>void;pageSize:number;setPageSize:(n:number)=>void;
}){
 const {text,language}=useUiCopy(),pages=Math.max(1,Math.ceil(result.rows.length/pageSize)),current=Math.min(page,pages);
 const rows=result.rows.slice((current-1)*pageSize,current*pageSize),columns=definition.columns.filter(k=>visible.includes(k));
 return <section className="min-w-0 overflow-hidden rounded-xl border border-border bg-card" aria-label={text(definition.en,definition.bn)}>
  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
   <p className="text-sm font-medium text-ink">{text('Report records','রিপোর্টের রেকর্ড')} <span className="ml-1 text-xs font-normal text-ink-500">({formatNumber(result.rows.length)})</span></p>
   <span className="text-xs text-ink-500">{text(result.basis,result.basisBn)}</span>
  </div>
  <Table className="text-[13px]" scrollRegionLabel={text(definition.en+' table',definition.bn+' টেবিল')}>
   <TableHeader><TableRow className="bg-ink-50/50">{columns.map(k=><TableHead key={k} scope="col" aria-sort={filters.sort===k?(filters.direction==='asc'?'ascending':'descending'):undefined} className={'px-3 py-2 '+(reportColumns[k]?.kind&&reportColumns[k]?.kind!=='date'?'text-right':'')}>
    <div className="inline-flex items-center gap-1"><button type="button" className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium leading-4 text-ink-600 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" onClick={()=>onChange({...filters,sort:k,direction:filters.sort===k&&filters.direction==='asc'?'desc':'asc'})}>
     <ReportLabel className="gap-0.5" en={reportColumns[k]?.en??k} bn={reportColumns[k]?.bn??k}/>{filters.sort===k?(filters.direction==='asc'?<ArrowUp className="size-3" aria-hidden="true"/>:<ArrowDown className="size-3" aria-hidden="true"/>):<ArrowUpDown className="size-3 text-ink-400" aria-hidden="true"/>}
    </button><ReportHelp guide={k} label={text(reportColumns[k]?.en??k,reportColumns[k]?.bn??k)}/></div>
   </TableHead>)}</TableRow></TableHeader>
   <TableBody>
    {rows.map(row=><TableRow key={row.id} data-report-row="">
     {columns.map(k=><TableCell key={k} className={'whitespace-nowrap px-3 py-2 '+(reportColumns[k]?.kind&&reportColumns[k]?.kind!=='date'?'text-right font-medium':'max-w-[300px]')}>
      {k==='label'?<button type="button" onClick={()=>onDetail(row)} className="max-w-full whitespace-nowrap text-left font-medium leading-6 text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">{formatReportCell(row,k,language)}</button>:
       k==='status'&&row.status?<span data-report-status={row.status} data-report-tone={reportStatusTone(row.status)}><StatusBadge className="h-6 px-2" tone={reportStatusTone(row.status)} dot>{formatReportCell(row,k,language)}</StatusBadge></span>:
       (k==='cost'||k==='profit')&&row.values[k]===null?<span data-report-cost-missing=""><StatusBadge className="h-6 px-2" tone="warning">{text('Cost missing','খরচ নেই')}</StatusBadge></span>:
       <span data-report-value-tone={reportValueTone(k,row,definition.id)} className={reportColumns[k]?.kind==='money'||k==='stock'||k==='expired'?reportToneClass[reportValueTone(k,row,definition.id)]:''}>{formatReportCell(row,k,language)}</span>}
     </TableCell>)}
    </TableRow>)}
    {!rows.length&&<TableRow><TableCell colSpan={Math.max(1,columns.length)}><div className="flex flex-col items-center gap-2 px-3 py-10 text-center"><FileSearch className="size-7 text-ink-400" aria-hidden="true"/><p className="text-sm font-medium text-ink">{text('No records match your filters.','এই ফিল্টারে কোনো রেকর্ড নেই।')}</p><p data-table-helper="" className="max-w-md text-xs text-ink-500">{text('Try another date range or clear a filter. Missing source records are never filled with invented values.','অন্য সময়কাল বাছুন বা ফিল্টার মুছুন। অনুপস্থিত তথ্যের জায়গায় অনুমান করা মান দেখানো হয় না।')}</p></div></TableCell></TableRow>}
    {rows.length>0&&<TableRow className="bg-ink-50 font-semibold">{columns.map((k,i)=><TableCell key={k} className={'px-3 py-3 '+(i?'text-right':'')}>{i===0?text('Filtered totals','ফিল্টারের মোট'):reportColumns[k]?.kind==='money'?(result.totals[k]===null?'—':taka(result.totals[k]??0)):'—'}</TableCell>)}</TableRow>}
   </TableBody>
  </Table>
  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-3 py-2 text-xs text-ink-600">
   <p aria-live="polite">{result.rows.length?((current-1)*pageSize+1)+'–'+Math.min(current*pageSize,result.rows.length):'0'} {text('of','/')} {formatNumber(result.rows.length)}</p>
   <div className="flex items-center gap-2">
    <AppSelect label={text('Rows per page','প্রতি পাতায় রেকর্ড')} value={String(pageSize)} options={['10','25','50']} className="w-20" onChange={v=>{setPageSize(Number(v));setPage(1);}}/>
    <Button variant="outline" size="icon" aria-label={text('Previous page','আগের পাতা')} disabled={current<=1} onClick={()=>setPage(current-1)}><ChevronLeft className="size-4"/></Button>
    <span>{current} / {pages}</span>
    <Button variant="outline" size="icon" aria-label={text('Next page','পরের পাতা')} disabled={current>=pages} onClick={()=>setPage(current+1)}><ChevronRight className="size-4"/></Button>
   </div>
  </div>
 </section>;
}

