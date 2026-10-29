import {businessToday,type IsoRange} from '../utils/dateRange.ts';
import {sourceOutstanding} from './vendorModel.ts';
import type {VendorLedgerEvent,VendorPreviewState,VendorSide,VendorSource} from './vendorTypes.ts';

export type VendorStatementRow=VendorLedgerEvent&{runningPaisa:number};
export type VendorStatement={
 vendorPartyId:string;side:VendorSide;from:string;to:string;
 openingPaisa:number;periodIncreasePaisa:number;periodDecreasePaisa:number;
 closingPaisa:number;rows:VendorStatementRow[];
 unpricedSources:VendorSource[];
};
const iso=(d:string)=>/^\d{4}-\d\d-\d\d$/.test(d)
 && !Number.isNaN(Date.parse(d+'T12:00:00Z'))
 && new Date(d+'T12:00:00Z').toISOString().slice(0,10)===d;
function validateRange(range:IsoRange,today:string){
 if(Boolean(range.from)!==Boolean(range.to))throw new Error('Choose both date range endpoints.');
 if(range.from&&!iso(range.from)||range.to&&!iso(range.to))throw new Error('Choose a valid date range.');
 if(range.from&&range.from>range.to)throw new Error('Start date cannot be after end date.');
 if(range.to&&range.to>today)throw new Error('Date range cannot be in the future.');
}
export function projectVendorStatement(
 state:VendorPreviewState,vendorPartyId:string,side:VendorSide,
 range:IsoRange,today=businessToday()
):VendorStatement {
 validateRange(range,today);
 const ordered=state.events.filter(e=>e.vendorPartyId===vendorPartyId&&e.side===side
  &&e.status==='Active'&&e.date<=today&&e.deltaPaisa!==0)
 .sort((a,b)=>a.date.localeCompare(b.date)||a.sequence-b.sequence||a.id.localeCompare(b.id));
 let openingPaisa=0,periodIncreasePaisa=0,periodDecreasePaisa=0;
 const rows:VendorStatementRow[]=[];
 for(const e of ordered){
  if(range.from&&e.date<range.from){openingPaisa+=e.deltaPaisa;continue;}
  if(range.to&&e.date>range.to)continue;
  if(e.deltaPaisa>=0)periodIncreasePaisa+=e.deltaPaisa;
  else periodDecreasePaisa-=e.deltaPaisa;
  rows.push({...e,runningPaisa:openingPaisa+periodIncreasePaisa-periodDecreasePaisa});
 }
 const unpricedSources=side==='payable'?state.sources.filter(s=>
  s.vendorPartyId===vendorPartyId&&s.sourceKind==='sourcing'&&s.status==='Active'
  &&s.date<=today&&(!range.from||s.date>=range.from)&&(!range.to||s.date<=range.to)
  &&sourceOutstanding(state,s.id).unpricedBaseQty>0):[];
 return {vendorPartyId,side,from:range.from||'',to:range.to||'',
  openingPaisa,periodIncreasePaisa,periodDecreasePaisa,
  closingPaisa:openingPaisa+periodIncreasePaisa-periodDecreasePaisa,
  rows,unpricedSources};
}
const safe=(value:unknown):string=>{
 let s=String(value??'');
 if(typeof value!=='number'&&/^[\s]*[=+@-]/.test(s))s="'"+s;
 return /[,\n\r"]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;
};
export function serializeVendorStatementCsv(statement:VendorStatement,vendorName:string):string{
 const rows:Array<Array<unknown>>=[
 ['HisabIQ','Demo preview — not accounting records'],
 ['Vendor',vendorName],['Side',statement.side],
 ['From',statement.from||'All time'],['To',statement.to||'All time'],
 ['Opening (paisa)',statement.openingPaisa],
 ['Date','Reference','Description','Change (paisa)','Running (paisa)']
 ];
 for(const e of statement.rows)rows.push([e.date,e.reference??'',e.description,e.deltaPaisa,e.runningPaisa]);
 rows.push(['Period increase (paisa)',statement.periodIncreasePaisa],
  ['Period decrease (paisa)',statement.periodDecreasePaisa],
  ['Closing (paisa)',statement.closingPaisa]);
 if(statement.side==='payable'){
  rows.push(['Price pending — unpriced source quantity','No monetary value assigned'],
   ['Source date','Reference','Product','Unpriced source base quantity']);
  for(const s of statement.unpricedSources)rows.push([s.date,s.reference??s.id,
   s.productId,sourceOutstandingFromSource(statement,s)]);
 }
 return '\uFEFF'+rows.map(row=>row.map(safe).join(',')).join('\r\n')+'\r\n';
}
function sourceOutstandingFromSource(_statement:VendorStatement,s:VendorSource):number {
 // Before priced returns are introduced, unpriced amounts are raw source quantity.
 // The projected pending queue only contains currently unpriced source records.
 return s.baseQty;
}
