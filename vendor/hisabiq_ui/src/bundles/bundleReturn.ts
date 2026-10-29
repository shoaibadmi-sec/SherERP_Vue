import type {SaleLine,SalesInvoice} from '../types/erp.ts';

export type BundleDisposition='Restock'|'Do not restock';
export type BundleReturnSelection={
 disposition:BundleDisposition;
 /** Mandatory whenever historical serial evidence exists on the component. */
 serials?:readonly string[];
};
export type PriorBundleReturn={
 returnId:string;invoiceId:string;lineId:string;sets:number;
 serials?:Readonly<Record<string,readonly string[]>>;
};
export type BundleReturnRequest={
 invoice:SalesInvoice;line:SaleLine;sets:number;
 choices:Readonly<Record<string,BundleReturnSelection>>;
 priorReturns?:readonly PriorBundleReturn[];
};
export type BundleReturnComponent={
 productId:string;name:string;unit:string;returnedBaseQty:number;
 disposition:BundleDisposition;
 returnedSerials:readonly string[];
 /** Evidence-derived candidate only. These are NEVER inventory movements. */
 eligibleLotCandidates:readonly {lotId:string;quantity:number}[];
 needsConditionInspection:boolean;
};
export type BundleReturnPreview={
 invoiceId:string;lineId:string;bundleRevision:number;
 sets:number;remainingSets:number;refundEstimate:number|null;
 components:readonly BundleReturnComponent[];
 issues:readonly string[];
 /** Never imply inventory, ledger, serial, or cash was posted. */
 previewOnly:true;
};
const quant=(n:number)=>Number(n.toFixed(6));
const positive=(n:number)=>Number.isFinite(n)&&n>0;
const key=(s:string)=>s.trim().toLocaleLowerCase();
const soldSetCount=(line:SaleLine):number=>{
 if(line.unit!=='Set'||!/^[1-9]\d*(?:\s+Sets?)?$/i.test(line.quantity.trim()))return 0;
 const n=Number.parseInt(line.quantity,10);
 return Number.isSafeInteger(n)?n:0;
};
/** Historical source only: never read current bundle recipe, master price or current stock lots. */
export function planBundleReturn(req:BundleReturnRequest):BundleReturnPreview{
 const {invoice,line,sets,choices}=req,issues:string[]=[];
 const historical=invoice.lines.find(l=>l.id===line.id);
 if(!historical||historical.productId!==line.productId||
  JSON.stringify(historical.bundleSnapshot)!==JSON.stringify(line.bundleSnapshot))
  issues.push('Return line must match its immutable source invoice.');
 const snap=line.bundleSnapshot;
 if(!snap||!Number.isSafeInteger(snap.bundleRevision)||snap.bundleRevision<1)
  issues.push('Posted bundle component snapshot is missing.');
 const sold=soldSetCount(line);
 if(!sold)issues.push('Historical bundle sale must have a whole positive Set count.');
 if(line.returnableQuantity!==undefined&&(!Number.isSafeInteger(line.returnableQuantity)||line.returnableQuantity<0))
  issues.push('Invalid source returnable Set balance.');
 const history=(req.priorReturns??[]).filter(r=>r.invoiceId===invoice.id&&r.lineId===line.id);
 const returned=history.reduce((sum,row)=>sum+row.sets,0);
 if(history.some(row=>!Number.isSafeInteger(row.sets)||row.sets<1)||returned>sold)
  issues.push('Historical bundle return records are inconsistent.');
 const remaining=Math.max(0,Math.min(sold-returned,line.returnableQuantity??sold));
 if(!Number.isSafeInteger(sets)||sets<=0||sets>remaining)
  issues.push('Return only whole Sets within the original remaining quantity ('+remaining+').');
 const net=line.netSaleTotal??(invoice.discount===0&&invoice.rounding===0?line.total:null);
 if(net===null||!Number.isFinite(net)||net<0||!Number.isSafeInteger(Math.round(net*100)))
  issues.push('Historical net parent refund allocation is missing; do not use today’s price.');
 // Full original line net refund is allocated proportionally, in cents; never use child prices.
 const refundEstimate=net===null||!Number.isFinite(net)||net<0||!sold?null:
  Number(((Math.round(net*100*(returned+sets)/sold)-Math.round(net*100*returned/sold))/100).toFixed(2));
 const components:BundleReturnComponent[]=[];
 const usedSerials=new Set<string>();
 const usedComponentIds=new Set<string>();
 for(const part of snap?.components??[]){
  if(usedComponentIds.has(part.productId)){issues.push('Duplicate historical component: '+part.productId);continue;}
  usedComponentIds.add(part.productId);
  const selected=choices[part.productId];
  if(!selected||!['Restock','Do not restock'].includes(selected.disposition)){
   issues.push('Choose Restock or Do not restock for '+part.name+'.');
   continue;
  }
  if(!positive(part.baseQtyPerSet)||!positive(part.totalBaseQty)||
   !Number.isFinite(part.unitFactorAtSale)||
   Math.abs(part.totalBaseQty-part.baseQtyPerSet*sold)>1e-6){
   issues.push('Historical quantities are inconsistent for '+part.name+'.');continue;
  }
  const quantity=quant(part.baseQtyPerSet*sets),serials=selected.serials??[];
  const orig=part.serials??[],recorded=new Set(orig.map(key));
  const priorSerials=new Set(history.flatMap(row=>row.serials?.[part.productId]??[]).map(key));
  if(serials.some(s=>!s.trim())||serials.some(s=>!recorded.has(key(s))))
   issues.push('Returned serial must belong to the original package sale: '+part.name+'.');
  for(const serial of serials){
   if(usedSerials.has(key(serial))||priorSerials.has(key(serial)))issues.push('Duplicate or already returned serial: '+serial);
   usedSerials.add(key(serial));
  }
  if(orig.length>0&&(!Number.isInteger(quantity)||serials.length!==quantity))
   issues.push('Select each original returned component serial for '+part.name+'.');
  const originalLots=part.lotAllocations??[];
  const validLots=originalLots.length>0&&originalLots.every(l=>l.lotId.trim()&&positive(l.quantity))&&
    Math.abs(originalLots.reduce((total,l)=>total+l.quantity,0)-part.totalBaseQty)<1e-6;
  const candidates:{lotId:string;quantity:number}[]=[];
  if(selected.disposition==='Restock'){
   if(part.stockSource?.mode==='Vendor'||part.stockSource?.mode==='Negative'){
    issues.push('Sourced/negative component cannot be automatically restocked: '+part.name+'.');
   }else if(!validLots){
    issues.push('Original owned lot evidence is missing for '+part.name+'; select Do not restock.');
   }else if(originalLots.length===1){
    candidates.push({lotId:originalLots[0].lotId,quantity});
   }else if(sets===sold&&returned===0){
    candidates.push(...originalLots.map(l=>({lotId:l.lotId,quantity:l.quantity})));
   }else{
    issues.push('Partial multi-lot return needs manual original-lot allocation review: '+part.name+'.');
   }
  }
  components.push({productId:part.productId,name:part.name,unit:part.unit,
   returnedBaseQty:quantity,disposition:selected.disposition,
   returnedSerials:Object.freeze([...serials]),
   eligibleLotCandidates:Object.freeze(candidates),
   needsConditionInspection:selected.disposition==='Restock'});
 }
 if(snap&&components.length!==snap.components.length)issues.push('Review every historical component before continuing.');
 return Object.freeze({
  invoiceId:invoice.id,lineId:line.id,bundleRevision:snap?.bundleRevision??0,
  sets,remainingSets:remaining,refundEstimate:issues.some(x=>x.includes('net parent'))?null:refundEstimate,
  components:Object.freeze(components),issues:Object.freeze(issues),previewOnly:true as const
 });
}
