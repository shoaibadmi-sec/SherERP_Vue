import type { BundleVersion, Product, StockLot } from '../types/erp.ts';
import { saleAvailableStock } from '../utils/posStock.ts';
import { availableSerials } from '../utils/productFeatures.ts';

/**
 * Advisory UI projection. Real stock allocation, lot consumption, COGS
 * and concurrency protection belong to the authenticated backend.
 */
export function getBundleProjection(
 recipe: BundleVersion,
 catalog: readonly Product[],
 lots: readonly StockLot[],
 now: Date = new Date()
): {
 availableSets: number;
 estimatedCostPerSet: number | null;
 limitingProductIds: readonly string[];
 issues: readonly string[];
} {
 const issues: string[] = [];
 const candidates: {productId:string;sets:number}[] = [];
 const visited = new Set<string>();
 let estimatedCostPerSet = 0;
 if (recipe.components.length < 2) issues.push('A bundle needs at least two stock components.');
 for (const component of recipe.components) {
  if(visited.has(component.productId))issues.push('Duplicate bundle component: '+component.productId);
  visited.add(component.productId);
  const p=catalog.find(product=>product.id===component.productId);
  if (!p || p.kind==='Bundle' || p.kind==='Service' || !p.active) {
   issues.push('Missing, inactive or unsupported component: '+component.productId);
   continue;
  }
  if(!Number.isFinite(component.baseQty)||component.baseQty<=0 ||
   !Number.isFinite(component.unitFactorAtSave)||component.unitFactorAtSave<=0){
    issues.push('Invalid stored component quantity: '+component.productId);
    continue;
  }
  const available=saleAvailableStock(p,[...lots],now);
  const serialLimited=p.serialTracking==='Required'
   ? Math.min(available,new Set(availableSerials(p,[...lots],now).map(s=>s.trim().toLowerCase())).size)
   : available;
  candidates.push({productId:p.id,sets:Math.max(0,Math.floor((serialLimited+1e-9)/component.baseQty))});
  if(!Number.isFinite(p.purchasePrice)||p.purchasePrice<0) {
   issues.push('Unknown estimated component cost: '+p.id);
  } else estimatedCostPerSet+=component.baseQty*p.purchasePrice;
 }
 if(issues.length || candidates.length!==recipe.components.length){
   return {availableSets:0,estimatedCostPerSet:null,limitingProductIds:[],issues};
 }
 const availableSets=Math.min(...candidates.map(c=>c.sets));
 return {availableSets,estimatedCostPerSet,
  limitingProductIds:candidates.filter(c=>c.sets===availableSets).map(c=>c.productId),
  issues:[]};
}

export function bundleInventoryValue(product:Product):number {
 if(product.kind==='Bundle'||product.kind==='Service')return 0;
 return product.stock*product.purchasePrice;
}
