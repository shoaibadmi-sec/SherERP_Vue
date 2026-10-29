import type {Purchase} from '../types/erp.ts';
import type {IsoRange} from '../utils/dateRange.ts';
import type {VendorLedgerEvent,VendorPreviewState} from './vendorTypes.ts';

export type VendorActivityBucket='vendor-payable'|'vendor-receivable'|'supplier-purchase';
export type VendorActivityKind=VendorLedgerEvent['kind']|'purchase'|'purchase-payment';
export type VendorActivityRow={
 id:string;date:string;reference:string;description:string;
 kind:VendorActivityKind;bucket:VendorActivityBucket;moneyPaisa:number|null;
 sourceEventId?:string;reversed:boolean;sequence:number;
};
const money=(value:number)=>Math.round(value*100);
/** Ordinary purchase dues are independent of all Vendor-source obligations. */
export function ordinaryVendorPurchaseDuePaisa(purchases:readonly Purchase[],vendorPartyId:string):number{
 return purchases.filter(p=>p.supplierId===vendorPartyId)
  .reduce((total,p)=>total+Math.max(0,money(p.total)-money(p.paid)),0);
}

const isoDate=(value:string):string=>{
 if(/^\d{4}-\d\d-\d\d$/.test(value))return value;
 const m=/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/.exec(value.trim());
 if(!m)return '';
 const month=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  .findIndex(x=>x.toLowerCase()===m[2].toLowerCase())+1;
 if(!month)return '';
 const day=Number(m[1]),year=Number(m[3]);
 const date=new Date(Date.UTC(year,month-1,day));
 return date.getUTCFullYear()===year&&date.getUTCMonth()===month-1&&date.getUTCDate()===day
  ?year+'-'+String(month).padStart(2,'0')+'-'+String(day).padStart(2,'0'):'';
};
/**
 * Unified Vendor Party activity timeline. Each entry retains its own
 * balance bucket; ordinary Purchases NEVER become Vendor source payables.
 * Unknown-cost events use null money, rather than fabricated zero valuation.
 */
export function projectVendorActivity(
 state:VendorPreviewState,
 vendorPartyId:string,
 purchases:readonly Purchase[],
 range:IsoRange
):VendorActivityRow[]{
 const reversedEvents=new Set(state.events.filter(e=>e.kind==='reversal'&&e.reversesEventId)
  .map(e=>e.reversesEventId));
 const isWithin=(date:string)=>Boolean(date)&&(!range.from||date>=range.from)&&(!range.to||date<=range.to);
 const activity:VendorActivityRow[]=[];
 for(const event of state.events){
  if(event.vendorPartyId!==vendorPartyId||!isWithin(event.date))continue;
  const source=state.sources.find(s=>s.id===event.sourceId);
  const isUnknownSource=(event.kind==='sourcing'&&(event.description.includes('Price not set')||event.description.includes('Price pending')))
   || (event.kind==='reversal'&&event.deltaPaisa===0&&Boolean(event.reversesEventId));
  activity.push({
   id:event.id,date:event.date,kind:event.kind,sourceEventId:event.id,
   bucket:event.side==='payable'?'vendor-payable':'vendor-receivable',
   reference:event.reference??source?.reference??event.sourceId??event.id,
   description:event.description,
   moneyPaisa:isUnknownSource?null:event.deltaPaisa,
   reversed:reversedEvents.has(event.id),sequence:event.sequence
  });
 }
 for(const purchase of purchases){
  if(purchase.supplierId!==vendorPartyId)continue;
  const date=isoDate(purchase.date);
  if(!isWithin(date))continue;
  activity.push({id:'vendor-purchase:'+purchase.id,date,reference:purchase.ref,
   description:'Ordinary purchase · '+purchase.items,kind:'purchase',
   bucket:'supplier-purchase',moneyPaisa:money(purchase.total),reversed:false,sequence:-2});
  if(purchase.paid>0)activity.push({id:'vendor-purchase-paid:'+purchase.id,date,
   reference:purchase.ref,description:'Ordinary purchase payment',
   kind:'purchase-payment',bucket:'supplier-purchase',
   moneyPaisa:-money(purchase.paid),reversed:false,sequence:-1});
 }
 return activity.sort((a,b)=>b.date.localeCompare(a.date)||a.sequence-b.sequence||a.id.localeCompare(b.id));
}
