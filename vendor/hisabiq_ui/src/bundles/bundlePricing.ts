import type {BundleComponent,Product,StockLot} from '../types/erp.ts';
import {allocatableLots} from '../utils/productFeatures.ts';
import {productUnitFactor} from '../utils/unitChain.ts';
import {priceFor} from '../utils/units.ts';

/** Preview-only current cost of a fixed recipe. It is NOT realized historical COGS. */
export function priceBundleComponents(
 components:readonly BundleComponent[],catalog:readonly Product[],
 lots:readonly StockLot[],packagePrice:number,now:Date=new Date()
):{
 lines:readonly {productId:string;baseQty:number;retailUnitPrice:number;retailTotal:number;purchaseTotal:number;stockShort:number}[];
 componentPurchaseCost:number;
 componentsRetailTotal:number;
 packagePrice:number;
 estimatedProfit:number|null;
 estimatedMarginPercent:number|null;
 costFromAvailableLots:boolean;
 issues:readonly string[];
}{
 const lines: {productId:string;baseQty:number;retailUnitPrice:number;retailTotal:number;purchaseTotal:number;stockShort:number}[]=[];
 const issues:string[]=[];
 let costFromAvailableLots=true;
 for(const component of components){
  const p=catalog.find(item=>item.id===component.productId);
  if(!p||p.kind==='Service'||p.kind==='Bundle'||!p.active){
   issues.push('Missing or inactive stock component: '+component.productId);
   continue;
  }
  if(!Number.isFinite(component.baseQty)||component.baseQty<=0){
   issues.push('Invalid component quantity: '+p.name);
   continue;
  }
  const factor=productUnitFactor(p,component.selectedUnit);
  const isAlternate=factor>1;
  if(!Number.isFinite(factor)||factor<1){issues.push('Invalid component unit: '+p.name);continue;}
  const retailUnitPrice=priceFor(p,component.selectedUnit);
  const primary=Number(component.primaryQty),secondary=Number(component.secondaryQty||0);
  const retailTotal=primary*retailUnitPrice+(isAlternate?secondary*retailUnitPrice/factor:0);
  let remaining=component.baseQty;
  let purchaseTotal=0;
  for(const lot of allocatableLots(p,[...lots],now)){
   if(remaining<=1e-9)break;
   const available=Math.max(0,lot.available);
   const take=Math.min(available,remaining);
   if(take>0){
    if(!Number.isFinite(lot.unitCost)||lot.unitCost<0){
      issues.push('Missing current lot purchase cost: '+p.name);
      costFromAvailableLots=false;
      purchaseTotal+=take*p.purchasePrice;
    }else purchaseTotal+=take*lot.unitCost;
    remaining-=take;
   }
  }
  const stockShort=Math.max(0,Number(remaining.toFixed(6)));
  if(stockShort>0){
   costFromAvailableLots=false;
   purchaseTotal+=stockShort*p.purchasePrice;
   issues.push('Not enough stocked lots for '+p.name+'; missing '+stockShort+' '+p.unit+'. Using catalog cost estimate.');
  }
  lines.push({productId:p.id,baseQty:component.baseQty,retailUnitPrice,
   retailTotal,purchaseTotal,stockShort});
 }
 const componentPurchaseCost=lines.reduce((sum,line)=>sum+line.purchaseTotal,0);
 const componentsRetailTotal=lines.reduce((sum,line)=>sum+line.retailTotal,0);
 const validPrice=Number.isFinite(packagePrice)&&packagePrice>0;
 if(!validPrice)issues.push('A valid package selling price is required.');
 const allFound=lines.length===components.length&&components.length>=2;
 const estimatedProfit=validPrice&&allFound?packagePrice-componentPurchaseCost:null;
 const estimatedMarginPercent=estimatedProfit===null?null:estimatedProfit/packagePrice*100;
 return {lines,componentPurchaseCost,componentsRetailTotal,packagePrice,
  estimatedProfit,estimatedMarginPercent,costFromAvailableLots,issues};
}
