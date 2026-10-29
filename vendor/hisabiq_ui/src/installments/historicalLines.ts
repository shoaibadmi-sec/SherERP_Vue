import type {CartLine} from '../hooks/usePosCart.ts';
import type {BundleSaleSnapshot,ProductKind,SaleStockSource} from '../types/erp.ts';
import {compoundBaseQuantity} from '../utils/posQuantity.ts';
import type {PreviewInstallmentAgreement} from '../data/installmentPreviewStore.ts';

/** Frozen invoice-line evidence needed before calculating any return value. */
export type InstallmentHistoricalLine={
 lineKey:string;productId:string;kind:ProductKind;
 originalBaseQuantity:number;originalNetPaisa:number;
 selectedUnit:string;unitFactorAtSale:number;
 serials?:readonly string[];
 lotAllocations?:readonly {lotId:string;quantity:number}[];
 bundleSnapshot?:BundleSaleSnapshot;
 stockSource?:SaleStockSource;
};
type Attributed={key:string;amountPaisa:number};
type Context={bundleSnapshot?:(line:CartLine)=>BundleSaleSnapshot|undefined};
const safeMoney=(n:number)=>Number.isSafeInteger(n)&&n>=0;
const safeQuantity=(n:number)=>Number.isFinite(n)&&n>0&&Math.round(n*1e6)/1e6===n;
function deepFreeze<T>(value:T):T{
 if(value && typeof value==='object' && !Object.isFrozen(value)){
  for(const child of Object.values(value))deepFreeze(child);
  Object.freeze(value);
 }
 return value;
}
/** Never looks up live prices or mutable bundle composition after the sale. */
export function createHistoricalInstallmentLines(
 cart:readonly CartLine[],attributedNetAmounts:readonly Attributed[],context:Context={}
):readonly InstallmentHistoricalLine[]{
 if(cart.length!==attributedNetAmounts.length||cart.length===0)
  throw new Error('Historical line/source allocation count differs.');
 const money=new Map<string,number>();
 for(const row of attributedNetAmounts){
  if(!row.key?.trim()||money.has(row.key)||!safeMoney(row.amountPaisa))
   throw new Error('Historical line source ID or allocated money is invalid.');
  money.set(row.key,row.amountPaisa);
 }
 const result=cart.map(line=>{
  const attributed=money.get(line.key);
  if(attributed===undefined||!line.key||!line.product.id)
   throw new Error('Historical line does not match the attributed source line.');
  const kind=line.product.kind??'Stock';
  const factor=line.product.altUnit&&line.unit===line.product.altUnit.unit?
   line.product.altUnit.factor:1;
  if(!Number.isFinite(factor)||factor<=0)
   throw new Error('Historical unit conversion is invalid.');
  const qty=compoundBaseQuantity(line.qty,line.secondaryQty,factor);
  if(!safeQuantity(qty))throw new Error('Historical sold quantity must be positive and precise.');
  let bundleSnapshot:BundleSaleSnapshot|undefined;
  if(kind==='Bundle'){
   if(line.unit!=='Set'||line.secondaryQty.trim()||!Number.isSafeInteger(qty))
    throw new Error('Historical bundle Set quantity must be whole.');
   bundleSnapshot=context.bundleSnapshot?.(line);
   if(!bundleSnapshot||bundleSnapshot.bundleRevision!==line.bundleRevision||
      bundleSnapshot.components.length<2 ||
      bundleSnapshot.components.some(c=>Math.abs(c.totalBaseQty-c.baseQtyPerSet*qty)>1e-6))
    throw new Error('Historical bundle recipe evidence is missing or inconsistent.');
  }
  return deepFreeze({
   lineKey:line.key,productId:line.product.id,kind,
   originalBaseQuantity:qty,originalNetPaisa:attributed,
   selectedUnit:line.unit,unitFactorAtSale:factor,
   ...(line.serials.length?{serials:structuredClone(line.serials)}:{}),
   ...(line.stockSource?{stockSource:structuredClone(line.stockSource)}:{}),
   ...(bundleSnapshot?{bundleSnapshot:structuredClone(bundleSnapshot)}:{})
  }) as InstallmentHistoricalLine;
 });
 return deepFreeze(result);
}
/** Old UI-only agreements must never backfill values from current product records. */
export function returnEligibility(agreement:PreviewInstallmentAgreement):{eligible:boolean;reason:string}{
 const historical=agreement.historicalLines;
 if(!historical?.length)
  return {eligible:false,reason:'Historical sale-line quantity and return evidence are missing.'};
 if(historical.length!==agreement.lineSnapshot.length)
  return {eligible:false,reason:'Historical line evidence does not reconcile to the agreement.'};
 const snapshot=new Map(agreement.lineSnapshot.map(line=>[line.key,line]));
 for(const line of historical){
  const source=snapshot.get(line.lineKey);
  if(!source||source.productId!==line.productId||source.amountPaisa!==line.originalNetPaisa||
   !safeQuantity(line.originalBaseQuantity)||!safeMoney(line.originalNetPaisa))
   return {eligible:false,reason:'Historical line evidence differs from the original source.'};
  if(line.kind==='Bundle'&&
     (!line.bundleSnapshot||line.bundleSnapshot.components.length<2))
   return {eligible:false,reason:'Historical bundle recipe is missing.'};
 }
 if(!historical.some(line=>line.kind!=='Service'))
  return {eligible:false,reason:'Services require an authorized settlement, not stock return.'};
 return {eligible:true,reason:''};
}
