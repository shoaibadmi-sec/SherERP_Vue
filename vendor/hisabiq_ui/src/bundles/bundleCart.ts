import type {BundleVersion,Product,StockLot} from '../types/erp.ts';
import type {CartLine} from '../hooks/usePosCart.ts';
import {allocatableLots} from '../utils/productFeatures.ts';
import {productUnitFactor} from '../utils/unitChain.ts';
import {freezeUnitProfile,unitQuantitiesBase} from '../utils/multiUnitTransactions.ts';

export type BundleComponentDemand={
 sourceLineKey:string;
 componentProductId:string;
 requiredBaseQty:number;
 bundleProductId?:string;
 bundleRevision?:number;
 /** Whole parent Set count for fair Own Stock clamping. */
 bundleSets?:number;
};

/** Expands a mixed POS cart into component stock demand without billing children. */
export function expandCartStockDemand(
 lines:readonly CartLine[],catalog:readonly Product[],
 recipeFor:(bundleProductId:string,revision:number)=>BundleVersion|undefined
):{demands:readonly BundleComponentDemand[];errors:readonly string[]}{
 const demands:BundleComponentDemand[]=[];
 const errors:string[]=[];
 const keys=new Set<string>();
 for(const line of lines){
  const p=line.product;
  if(!line.key||keys.has(line.key)){errors.push('Duplicate or missing cart line key.');continue;}
  keys.add(line.key);
  if(p.kind==='Service')continue;
  if(p.kind!=='Bundle'){
   const factor=productUnitFactor(p,line.unit);
   const validQty=/^\d+(?:\.\d{1,4})?$/.test(line.qty.trim());
   const validSecondary=!line.secondaryQty.trim()||/^\d+(?:\.\d{1,4})?$/.test(line.secondaryQty.trim());
   if(!validQty||!validSecondary||!Number.isFinite(factor)||factor<1||
    (factor===1&&line.secondaryQty.trim()&&Number(line.secondaryQty)!==0)||
    (factor>1&&Number(line.secondaryQty)>=(factor))){
    errors.push('Invalid product quantity or unit for '+p.name+'.');continue;
   }
   const total=line.unitQuantities?unitQuantitiesBase(freezeUnitProfile(p),line.unitQuantities):Number(line.qty)*factor+Number(line.secondaryQty||0);
   if(!Number.isFinite(total)||total<=0){errors.push('Quantity must be greater than zero for '+p.name+'.');continue;}
   demands.push({sourceLineKey:line.key,componentProductId:p.id,requiredBaseQty:total});
   continue;
  }
  if(line.unit!=='Set'||line.secondaryQty.trim()||!/^[1-9]\d*$/.test(line.qty.trim())||
    !Number.isSafeInteger(Number(line.qty))){
   errors.push('Bundle quantity must be a whole positive Set for '+p.name+'.');continue;
  }
  if(!Number.isSafeInteger(line.bundleRevision)||!line.bundleRevision||line.bundleRevision<1){
   errors.push('Missing bundle recipe revision for '+p.name+'.');continue;
  }
  const recipe=recipeFor(p.id,line.bundleRevision);
  if(!recipe||recipe.bundleProductId!==p.id||recipe.revision!==line.bundleRevision){
   errors.push('Bundle revision unavailable for '+p.name+'. Reopen this package before sale.');continue;
  }
  if(recipe.components.length<2){errors.push('Bundle must contain at least two components: '+p.name+'.');continue;}
  const visited=new Set<string>();
  for(const component of recipe.components){
   const child=catalog.find(item=>item.id===component.productId);
   if(visited.has(component.productId)){errors.push('Duplicate bundle component '+component.productId+'.');continue;}
   visited.add(component.productId);
   if(!child||child.kind==='Bundle'||child.kind==='Service'||!child.active){
    errors.push('Missing, nested or inactive stock component: '+component.productId+'.');continue;
   }
   if(!Number.isFinite(component.baseQty)||component.baseQty<=0){
    errors.push('Invalid saved component quantity: '+component.productId+'.');continue;
   }
   const qty=component.baseQty*Number(line.qty);
   if(!Number.isFinite(qty)||qty<=0||qty>Number.MAX_SAFE_INTEGER){
    errors.push('Component quantity overflow for '+child.name+'.');continue;
   }
   if(child.serialTracking==='Required'&&!Number.isInteger(qty)){
    errors.push('Serial-tracked component requires whole units: '+child.name+'.');continue;
   }
   demands.push({sourceLineKey:line.key,componentProductId:child.id,requiredBaseQty:qty,
    bundleProductId:p.id,bundleRevision:recipe.revision,bundleSets:Number(line.qty)});
  }
 }
 return errors.length?{demands:[],errors}:{demands,errors:[]};
}

export function projectCartShortages(
 demands:readonly BundleComponentDemand[],catalog:readonly Product[],
 lots:readonly StockLot[],now:Date=new Date()
):readonly {componentProductId:string;requiredBaseQty:number;availableBaseQty:number;shortageBaseQty:number}[]{
 const required=new Map<string,number>();
 for(const d of demands)required.set(d.componentProductId,(required.get(d.componentProductId)??0)+d.requiredBaseQty);
 return [...required].map(([componentProductId,requiredBaseQty])=>{
  const product=catalog.find(p=>p.id===componentProductId);
  const availableBaseQty=product&&product.kind!=='Bundle'&&product.kind!=='Service'&&product.active?
   Math.max(0,Math.min(product.stock,
    allocatableLots(product,[...lots],now).reduce((total,lot)=>total+lot.available,0))):0;
  return {componentProductId,requiredBaseQty,availableBaseQty,
   shortageBaseQty:Math.max(0,Number((requiredBaseQty-availableBaseQty).toFixed(6)))};
 });
}

/** Pure, all-or-nothing *preview* lot reservation; never posts or mutates inventory. */
export function allocateBundlePreview(
 demands:readonly BundleComponentDemand[],catalog:readonly Product[],
 lots:readonly StockLot[],now:Date=new Date()
):{allocations:readonly {sourceLineKey:string;productId:string;lotId:string;quantity:number;unitCost:number}[];
 errors:readonly string[]}{
 const shortages=projectCartShortages(demands,catalog,lots,now);
 const errors=shortages.filter(r=>r.shortageBaseQty>0).map(r=>
  'Component stock shortage: '+r.componentProductId+' · '+r.shortageBaseQty);
 const reserved=new Map<string,number>();
 const allocations:{sourceLineKey:string;productId:string;lotId:string;quantity:number;unitCost:number}[]=[];
 for(const d of demands){
  const p=catalog.find(p=>p.id===d.componentProductId);
  if(!p||p.kind==='Bundle'||p.kind==='Service'||!p.active){errors.push('Missing Stock component: '+d.componentProductId);continue;}
  if(p.serialTracking==='Required'){
   errors.push('Required component serials must be selected before preview: '+p.name);
   continue;
  }
  if(!Number.isFinite(d.requiredBaseQty)||d.requiredBaseQty<=0){
   errors.push('Invalid required quantity for '+p.name);continue;
  }
  let remaining=d.requiredBaseQty;
  for(const lot of allocatableLots(p,[...lots],now)){
   if(remaining<=1e-8)break;
   const available=Math.max(0,lot.available-(reserved.get(lot.id)??0));
   const take=Math.min(available,remaining);
   if(take<=0)continue;
   if(!Number.isFinite(lot.unitCost)||lot.unitCost<0){
    errors.push('Unknown component lot unit cost: '+p.name);
    break;
   }
   allocations.push({sourceLineKey:d.sourceLineKey,productId:p.id,lotId:lot.id,quantity:take,unitCost:lot.unitCost});
   reserved.set(lot.id,(reserved.get(lot.id)??0)+take);
   remaining-=take;
  }
  if(remaining>1e-7)errors.push('Component stock shortage: '+p.name+' · '+Number(remaining.toFixed(6)));
 }
 return errors.length?{allocations:[],errors}:{allocations,errors:[]};
}
