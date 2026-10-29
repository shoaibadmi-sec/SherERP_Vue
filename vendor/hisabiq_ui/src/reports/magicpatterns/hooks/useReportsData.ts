import { useMemo } from 'react';
import type { ReportData, ReportFilters } from '../../../reports/types';
import type { Period } from '../types/reports';
import { addDays, resolvePeriod } from '../utils/reports/period';
import { toMagicReportsDataset } from '../adapter';
import { customerStats, openInvoices, payables, productStats, summarize } from '../utils/reports/metrics';
import { tiedStock } from '../utils/reports/planning';
export function useReportsCore(data:ReportData, filters:ReportFilters){
 const ds=useMemo(()=>toMagicReportsDataset(data),[data]);
 const period:Period=useMemo(()=>resolvePeriod('custom',ds.asOf,filters.from||addDays(ds.asOf,-29),filters.to||ds.asOf),
 [ds.asOf,filters.from,filters.to]);
 const core=useMemo(()=>({ds,current:summarize(ds,period.from,period.to),previous:summarize(ds,period.prevFrom,period.prevTo),
 last30:summarize(ds,addDays(ds.asOf,-29),ds.asOf),prev30:summarize(ds,addDays(ds.asOf,-59),addDays(ds.asOf,-30)),
 stats:productStats(ds,period.from,period.to),stats30:productStats(ds,addDays(ds.asOf,-29),ds.asOf),
 open:openInvoices(ds),customers:customerStats(ds,period.from,period.to),
 payables:payables(ds),tied:tiedStock(productStats(ds,addDays(ds.asOf,-29),ds.asOf))}),[ds,period.from,period.to,period.prevFrom,period.prevTo]);
 return {core,period};
}
export type ReportsCore=ReturnType<typeof useReportsCore>['core'];
