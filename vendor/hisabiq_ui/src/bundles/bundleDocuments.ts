import type {BundleSaleSnapshot,BundleVersion,Product,SaleLine} from '../types/erp.ts';
import type {CartLine} from '../hooks/usePosCart.ts';

/** Snapshots the *selected* recipe, never the current editable recipe pointer. */
export function createBundleSaleSnapshot(
 line:CartLine,recipe:BundleVersion,catalog:readonly Product[]
):BundleSaleSnapshot {
 if(line.product.kind!=='Bundle'||line.bundleRevision!==recipe.revision||
    recipe.bundleProductId!==line.product.id){
  throw new Error('Bundle revision mismatch. Reopen the package before preview.');
 }
 if(line.unit!=='Set'||line.secondaryQty.trim()||!/^[1-9]\d*$/.test(line.qty)||
   !Number.isSafeInteger(Number(line.qty)))throw new Error('Bundle quantity must be whole positive Sets.');
 if(recipe.components.length<2)throw new Error('Bundle must contain two components.');
 const sets=Number(line.qty);
 const components=recipe.components.map(c=>{
  const product=catalog.find(p=>p.id===c.productId);
  if(!product||product.kind==='Bundle'||product.kind==='Service')throw new Error('Missing stock component: '+c.productId);
  const total=c.baseQty*sets;
  if(!Number.isFinite(total)||total<=0||!Number.isFinite(c.unitFactorAtSave))
   throw new Error('Invalid saved bundle component quantity.');
  return Object.freeze({
   productId:product.id,name:product.name,sku:product.sku,
   baseQtyPerSet:c.baseQty,totalBaseQty:total,
   unit:product.unit,unitFactorAtSale:c.unitFactorAtSave
  });
 });
 return Object.freeze({bundleRevision:recipe.revision,components:Object.freeze(components)});
}
/** Component content rows are descriptive and have no price/total fields. */
export function bundleContentsForReceipt(
 line:Pick<SaleLine,'bundleSnapshot'>
):readonly {name:string;quantityLabel:string}[]{
 return line.bundleSnapshot?.components.map(c=>({
  name:c.name,
  quantityLabel:c.totalBaseQty+' '+c.unit
 }))??[];
}
