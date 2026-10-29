import type { ReportRow } from '../types.ts';

export type ReviewMode='monthly'|'yearly'|'custom'|'last24';
export type Readiness='ready'|'needs-review'|'incomplete'|'unavailable';
export type ReviewMetricKey='sales'|'returns'|'netSales'|'costOfGoods'|'grossProfit'|'netProfit'|'purchases'|'expenses'|'cashIn'|'cashOut'|'stockValue'|'customerDue'|'supplierDue'|'lowStockCount'|'cashBalance';
export type ReviewRequest={mode:ReviewMode;from:string;to:string;asOf:string};
export type ReviewMetric={key:ReviewMetricKey;value:number|null;readiness:Readiness;reason:string;source:ReportRow[];basis:'period-flow'|'as-of-snapshot'|'unverified'};
export type ReviewMetrics=Record<ReviewMetricKey,ReviewMetric>;
export type ReviewMonth={month:string;from:string;to:string;partial:boolean;metrics:ReviewMetrics};
export type ReviewPriority={id:string;title:string;titleBn:string;description:string;descriptionBn:string;report:string;source:ReportRow[]};
export type BusinessReviewResult={request:ReviewRequest;effectiveTo:string;metrics:ReviewMetrics;months:ReviewMonth[];priorities:ReviewPriority[];certified:false;disclaimer:string};
