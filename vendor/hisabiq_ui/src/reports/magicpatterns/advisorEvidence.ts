import type { Recommendation } from './utils/reports/advisor';
import type { EvidenceRequest } from './components/reports/ReportBits';
export function advisorEvidenceRequest(r:Recommendation):EvidenceRequest{
 const context=[r.what,r.why,r.action,r.benefit].filter(Boolean).join(' · ');
 const basic={label:r.title,context};
 if(r.id==='cash-dip')return {...basic,report:'cash-book',forecast:true};
 if(r.id==='discounts')return {...basic,report:'discounts'};
 if(r.id==='receipts')return {...basic,report:'data-quality'};
 const at=r.id.indexOf('-'),kind=at<0?r.id:r.id.slice(0,at),value=at<0?'':r.id.slice(at+1);
 switch(kind){
  case 'stock':case 'tied':return {...basic,report:'stock',field:'productId',value};
  case 'price':return {...basic,report:'purchase-prices',field:'productId',value};
  case 'mix':return {...basic,report:'product-profit',field:'productId',value};
  case 'cost':return {...basic,report:'data-quality',field:'productId',value};
  case 'collect':return {...basic,report:'collections',field:'party',value};
  case 'credit':case 'winback':return {...basic,report:'customer-sales',field:'partyId',value};
  case 'expense':return {...basic,report:'expense-categories',field:'category',value};
  default:return {...basic,report:r.area==='Cash'?'cash-book':r.area==='Expenses'?'expenses':r.area==='Data'?'data-quality':'sales-register'};
 }
}
