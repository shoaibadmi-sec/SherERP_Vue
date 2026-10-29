import type {CartLine} from '../hooks/usePosCart.ts';
import type {PosStockAllocation} from './vendorStock.ts';
import type {VendorPreviewSale,VendorSourceInput} from './vendorTypes.ts';
import {businessToday} from '../utils/dateRange.ts';

export type PreparedVendorSalePreview={
 sale:VendorPreviewSale;
 sources:Array<{vendorPartyId:string;source:VendorSourceInput}>;
};
/**
 * Creates a linked DEMO-ONLY sourcing snapshot. Never writes any Sale,
 * owned stock, cashbook, bankbook or customer ledger record.
 */
export function prepareVendorSalePreview(
 invoiceId:string,allocations:readonly PosStockAllocation[],saleLines:readonly CartLine[]
):PreparedVendorSalePreview{
 if(!invoiceId.trim())throw new Error('Demo invoice reference required.');
 if(allocations.length!==saleLines.length)throw new Error('Cart allocations are stale.');
 const sources:PreparedVendorSalePreview['sources']=[];
 const sourceIds=new Set<string>();
 for(const [i,line] of saleLines.entries()){
  const a=allocations[i];
  if(a.key!==line.key||a.productId!==line.product.id)
   throw new Error('Cart allocations changed; recheck Vendor sourcing.');
  if(a.needsSourceBaseQty>0)throw new Error('Choose a stock source before demo simulation.');
  if(a.vendorBaseQty<=0)continue;
  const decision=line.stockSource;
  if(decision?.mode!=='Vendor')throw new Error('Missing linked Vendor source.');
  if(!decision.vendorId)throw new Error('Vendor identity required.');
  const sourceId='vendor-source:'+invoiceId+':'+line.key;
  if(sourceIds.has(sourceId))throw new Error('Duplicate sale source.');
  sourceIds.add(sourceId);
  if(decision.unitCost!==null&&(!Number.isFinite(decision.unitCost)||decision.unitCost<=0))
   throw new Error('Vendor unit cost must be positive or explicitly unknown.');
  const unitCostBasePaisa=decision.unitCost===null?null:Math.round(decision.unitCost*100);
  sources.push({vendorPartyId:decision.vendorId,source:{
   id:sourceId,productId:line.product.id,baseQty:a.vendorBaseQty,
   unitCostBasePaisa,date:businessToday(),reference:invoiceId,
   sourceInvoiceId:invoiceId,sourceSaleLineId:line.key
  }});
 }
 const vendorPartyIds=[...new Set(sources.map(s=>s.vendorPartyId))];
 const sale:VendorPreviewSale={id:'vendor-demo-sale:'+invoiceId,
  invoiceId,date:businessToday(),vendorPartyIds,sourceIds:[...sourceIds],sourceMode:'demo'};
 return {sale,sources};
}
