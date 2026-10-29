import { reportDefinition } from '../catalog.ts';
import { runReport } from '../model.ts';
import { filtersForAnalysisReport } from '../screens.ts';
import type { ReportData, ReportFilters, ReportRow, ReportScreen, CellValue } from '../types';
import type { EvidenceRequest } from './components/reports/ReportBits';
/** Pure bridge: the imported presentation never owns or copies operational transactions. */
export function resolveMagicEvidence(req:EvidenceRequest,data:ReportData,filters:ReportFilters,screen:ReportScreen):ReportRow {
 const key=reportDefinition(req.report).id;
 const scoped=filtersForAnalysisReport(key,filters,screen);
 if(req.date){scoped.from=req.date;scoped.to=req.toDate??req.date;}
 const result=runReport(key,data,scoped);
 const isMatch=(row:ReportRow):boolean=>!req.field||!req.value
  ||String(row[req.field as 'id'|'productId'|'category'|'party'|'partyId'|'label']??'')===req.value
  ||!!row.children?.some(child=>String(child[req.field as 'id'|'productId'|'category'|'party'|'partyId'|'label']??'')===req.value);
 const children=result.rows.filter(isMatch);
 const values:Record<string,CellValue>={};
 for(const prop of ['amount','cost','profit','paid','due','inflow','outflow'] as const){
  const seen=children.filter(r=>r.values[prop]!==undefined);
  if(!seen.length)continue;
  values[prop]=seen.every(r=>typeof r.values[prop]==='number')?seen.reduce((sum,row)=>sum+Number(row.values[prop]),0):null;
 }
 return {id:'magic-evidence-'+screen+'-'+key+'-'+(req.value??req.date??'all'),label:req.label,date:req.date??'',status:children.length?'Source evidence':'Source unavailable',values,
  note:children.length?(req.context?req.context+' · ':'')+result.basis+' · The entries below reconcile to this selection. Open a row for its recorded contributors.':
   'No exact supporting source is available in the current selection. Missing information remains unknown; no source records were fabricated.',
  children};
}
