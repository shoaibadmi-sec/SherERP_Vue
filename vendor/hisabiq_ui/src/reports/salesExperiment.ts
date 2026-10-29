import { reportDefinition } from './catalog.ts';
import type { ReportFilters, ReportKey } from './types';

export const salesExperimentReports:ReturnType<typeof reportDefinition>[]=([
 'sales-register','product-sales','category-sales','customer-sales','product-profit','sales-returns','discounts'
] as const).map(reportDefinition);

export function salesExperimentReportKey(requested?:string|null):ReportKey {
 return salesExperimentReports.find(r=>r.id===requested)?.id??'sales-register';
}
/** Report switches keep period context, discard filters unsupported by the selected report. */
export function selectSalesExperimentReport(report:ReportKey,filters:ReportFilters):ReportFilters {
 const definition=reportDefinition(salesExperimentReportKey(report));
 const next={...filters,search:'',sort:'date',direction:'desc' as const};
 for(const key of ['category','brand','product','party','user','account','status'] as const)
  if(!definition.dimensions.includes(key))next[key]='';
 return next;
}
