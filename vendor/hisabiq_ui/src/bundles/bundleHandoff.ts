import type {BundleVersion,Product} from '../types/erp.ts';
import {getBundleVersion,getProductImportPreviewSnapshot} from '../data/productImportPreviewStore.ts';

export type BundleHandoffLine={
 productId:string;
 unit:string;
 quantity:number;
 secondaryQuantity?:number;
 bundleRevision?:number;
 bundleRecipeSignature?:string;
};
export type BundleHandoffIssue={productId:string;name:string;reason:string;before:string;after:string};

const recipeText=(components:readonly BundleVersion['components'][number][],names:ReadonlyMap<string,string>)=>
 components.map(c=>String(c.baseQty)+' '+(names.get(c.productId)??c.productId)).join(', ');

/** Snapshot only immutable recipe identity, not provisional inventory or selling prices. */
export function captureBundleHandoff(product:Product):Pick<BundleHandoffLine,'bundleRevision'|'bundleRecipeSignature'> {
 if(product.kind!=='Bundle')return {};
 const latest=getBundleVersion(product.id);
 if(!latest)throw new Error('Package recipe missing: '+product.name);
 return {bundleRevision:latest.revision,bundleRecipeSignature:JSON.stringify(latest.components)};
}
export function inspectBundleHandoff(
 line:BundleHandoffLine,catalog:readonly Product[]=getProductImportPreviewSnapshot().products
):BundleHandoffIssue|undefined{
 const product=catalog.find(p=>p.id===line.productId);
 if(!product||!product.active)return {productId:line.productId,name:product?.name??line.productId,
  reason:'Product is unavailable; reopen the item before conversion.',before:'—',after:'—'};
 if(product.kind!=='Bundle')return undefined;
 const latest=getBundleVersion(product.id);
 const names=new Map(catalog.map(p=>[p.id,p.name]));
 if(!latest)return {productId:product.id,name:product.name,
  reason:'Package recipe is unavailable.',before:'—',after:'—'};
 const after=recipeText(latest.components,names);
 let saved:BundleVersion['components']=[];
 try{const parsed=JSON.parse(line.bundleRecipeSignature??'null');if(Array.isArray(parsed))saved=parsed;}catch{/** Invalid original requires review. */}
 const before=saved.length?recipeText(saved,names):'Unknown saved contents';
 if(line.unit!=='Set'||!Number.isSafeInteger(line.quantity)||line.quantity<=0||
   (line.secondaryQuantity??0)!==0)
  return {productId:product.id,name:product.name,reason:'Bundle quantity must be positive whole Sets.',
   before,after};
 if(!line.bundleRevision||!saved.length||line.bundleRevision!==latest.revision||
    line.bundleRecipeSignature!==JSON.stringify(latest.components))
  return {productId:product.id,name:product.name,
   reason:'Package recipe changed. Review contents before continuing.',before,after};
 return undefined;
}
export function inspectBundleHandoffs(
 lines:readonly BundleHandoffLine[],catalog:readonly Product[]=getProductImportPreviewSnapshot().products
):BundleHandoffIssue[]{
 return lines.map(line=>inspectBundleHandoff(line,catalog)).filter((x):x is BundleHandoffIssue=>Boolean(x));
}
/** Explicit review button only; never call while loading a quote or order. */
export function reviewBundleHandoffs<L extends BundleHandoffLine>(
 lines:readonly L[],catalog:readonly Product[]=getProductImportPreviewSnapshot().products
):L[]{
 return lines.map(line=>{
  const product=catalog.find(p=>p.id===line.productId);
  if(!product||!product.active)throw new Error('Unavailable product: '+line.productId);
  if(product.kind!=='Bundle')return {...line};
  if(line.unit!=='Set'||!Number.isSafeInteger(line.quantity)||line.quantity<1||
    (line.secondaryQuantity??0)!==0)
   throw new Error('Use whole Sets before confirming package changes: '+product.name);
  return {...line,...captureBundleHandoff(product)};
 });
}
export function requireCurrentBundleHandoffs(
 lines:readonly BundleHandoffLine[],catalog:readonly Product[]=getProductImportPreviewSnapshot().products
):void{
 const issues=inspectBundleHandoffs(lines,catalog);
 if(issues.length)throw new Error(issues[0].name+': '+issues[0].reason);
}
