import type {Product,StockLot,StockMovement,BundleVersion,BundleDraft} from '../types/erp.ts';
import {validateBundleDraft} from '../bundles/bundleValidation.ts';
import {resolveUnitChain} from '../utils/unitChain.ts';
import type {ImportResult} from '../import/importTypes.ts';
import type {ProductImportPlan} from '../import/productImport.ts';
import {products as seedProducts} from './products.ts';
import {stockLots as seedLots,stockMovements as seedMovements} from './productInventory.ts';

export type ProductImportPreviewSnapshot={
 revision:number;appliedSessionIds:readonly string[];
 products:readonly Product[];lots:readonly StockLot[];movements:readonly StockMovement[];
 bundleVersions:readonly BundleVersion[];
 /** Only references from completed, posted sales protect recipe history. Preview-only state. */
 bundleSaleReferences:readonly {invoice:string;bundleProductId:string;revision:number}[];
};
/** Design-preview module singleton, never a tenant or server data source. */
let snapshot:ProductImportPreviewSnapshot={
 revision:0,appliedSessionIds:[],products:seedProducts.map(p=>({...p})),
 lots:seedLots.map(l=>({...l})),movements:seedMovements.map(m=>({...m})),bundleVersions:Object.freeze([]),bundleSaleReferences:Object.freeze([])
};
const listeners=new Set<()=>void>();
const results=new Map<string,ImportResult>();
export const getProductImportPreviewSnapshot=():ProductImportPreviewSnapshot=>snapshot;
export function subscribeProductImportPreview(listener:()=>void):()=>void {
 listeners.add(listener);return ()=>{listeners.delete(listener);};
}
function publish(next:ProductImportPreviewSnapshot):void {
 snapshot=next;for(const listener of listeners)listener();
}
const skuKey=(sku:string)=>sku.trim().toLocaleUpperCase();
/** Single, validated all-or-nothing write. No mutation or notification on failure. */
export function commitProductImportPreview(plan:ProductImportPlan):ImportResult {
 const prior=results.get(plan.sessionId);if(prior)return prior;
 if(!plan.sessionId.trim())throw new Error('An import session ID is required.');
 if(plan.baseRevision!==snapshot.revision)throw new Error('Product preview changed. Reopen Review before importing.');
 if(plan.issues.some(issue=>issue.severity==='error'))throw new Error('Resolve or skip invalid product rows before importing.');
 if(!plan.creates.length&&!plan.updates.length)throw new Error('No products selected to import.');
 const products=snapshot.products.map(p=>({...p}));
 const lots=snapshot.lots.map(l=>({...l,serials:l.serials?[...l.serials]:undefined}));
 const movements=snapshot.movements.map(m=>({...m}));
 const skus=new Set(products.map(p=>skuKey(p.sku)));
 const ids=new Set(products.map(p=>p.id));
 const lotIds=new Set(lots.map(l=>l.id));
 const movementIds=new Set(movements.map(m=>m.id));
 const serials=new Set(lots.flatMap(l=>l.serials??[]).map(s=>s.trim().toLowerCase()));
 const rows=new Set<number>();
 for(const entry of plan.creates){
  if(rows.has(entry.sourceRow))throw new Error('Duplicate source row in import.');
  rows.add(entry.sourceRow);
  const product=entry.product;
  if(product.kind==='Bundle')throw new Error('Bundles must be created through the Bundle editor, not stock import.');
  const sku=skuKey(product.sku);
  if(!sku||skus.has(sku)||ids.has(product.id))throw new Error('Duplicate product ID or SKU: '+product.sku);
  if(!product.name.trim()||!Number.isFinite(product.sellPrice)||product.sellPrice<=0||!Number.isFinite(product.purchasePrice)||product.purchasePrice<0)throw new Error('Invalid product master data.');
  if(!Number.isFinite(product.stock)||product.stock<0||!Number.isFinite(product.minStock)||product.minStock<0)throw new Error('Invalid stock quantity.');
  if(product.altUnit&&(!Number.isFinite(product.altUnit.factor)||product.altUnit.factor<=0||product.altUnit.unit===product.unit))throw new Error('Invalid unit conversion.');
  if(product.unitRelations?.length){
    const chain=resolveUnitChain(product.unitRelations);
    if(chain.stockUnit!==product.unit)throw new Error('The smallest unit must be the stored stock unit.');
    if(product.altUnit&&(product.altUnit.unit!==chain.units[0]||Math.abs(product.altUnit.factor-chain.factors[chain.units[0]])>1e-9))
      throw new Error('The legacy conversion must match the unit chain.');
    if(product.stockViewUnit&&!chain.units.includes(product.stockViewUnit))
      throw new Error('Stock View must be a configured unit.');
  }
  const lot=entry.openingLot,movement=entry.openingMovement;
  if(Boolean(lot)!==Boolean(movement))throw new Error('Opening lot and movement must be paired.');
  if(product.kind==='Service'&&(product.stock||lot||movement))throw new Error('A service cannot have opening stock.');
  if(product.stock>0&&!lot)throw new Error('Opening stock requires one lot and one movement.');
  if(product.stock===0&&(lot||movement))throw new Error('Zero opening stock must not generate a lot.');
  if(lot&&movement){
   if(lotIds.has(lot.id)||movementIds.has(movement.id))throw new Error('Duplicate opening inventory ID.');
   if(lot.productId!==product.id||movement.productId!==product.id||
      lot.source!=='Opening'||movement.type!=='Opening'||lot.receivedAt!==movement.date||
      lot.quantity!==product.stock||lot.available!==product.stock||
      movement.quantity!==product.stock||movement.balance!==product.stock||
      lot.reference!==movement.reference||!Number.isFinite(lot.unitCost)||lot.unitCost<0)
    throw new Error('Opening stock lot/movement mismatch.');
   for(const value of lot.serials??[]){
    const serial=value.trim().toLowerCase();
    if(!serial||serials.has(serial))throw new Error('Duplicate opening serial: '+value);
    serials.add(serial);
   }
   lotIds.add(lot.id);movementIds.add(movement.id);
   lots.unshift({...lot,serials:lot.serials?[...lot.serials]:undefined});
   movements.unshift({...movement});
  }
  skus.add(sku);ids.add(product.id);products.unshift({...product});
 }
 const allowed=new Set(['name','nameBn','category','brand','sellPrice','purchasePrice','minStock','active']);
 for(const entry of plan.updates){
  if(rows.has(entry.sourceRow))throw new Error('Duplicate source row in import.');
  rows.add(entry.sourceRow);
  const index=products.findIndex(product=>product.id===entry.productId);
  if(index<0)throw new Error('Update product no longer exists.');
  if(products[index].kind==='Bundle')throw new Error('Bundle recipes cannot be changed through product import.');
  if(Object.keys(entry.patch).some(key=>!allowed.has(key)))throw new Error('Unsafe product master update.');
  const patch=entry.patch;
  if(patch.sellPrice!==undefined&&(!Number.isFinite(patch.sellPrice)||patch.sellPrice<=0))throw new Error('Invalid updated selling price.');
  if(patch.purchasePrice!==undefined&&(!Number.isFinite(patch.purchasePrice)||patch.purchasePrice<0))throw new Error('Invalid updated purchase price.');
  if(patch.minStock!==undefined&&(!Number.isFinite(patch.minStock)||patch.minStock<0))throw new Error('Invalid updated minimum stock.');
  products[index]={...products[index],...patch};
 }
 const result:ImportResult={sessionId:plan.sessionId,created:plan.creates.length,masterUpdated:plan.updates.length,
  roleAdded:0,openingSources:0,openingLots:plan.creates.filter(c=>Boolean(c.openingLot)).length,
  skipped:plan.skipped,rejected:0,errors:[]};
 publish({revision:snapshot.revision+1,appliedSessionIds:[...snapshot.appliedSessionIds,plan.sessionId],products,lots,movements,bundleVersions:snapshot.bundleVersions,bundleSaleReferences:snapshot.bundleSaleReferences});
 results.set(plan.sessionId,result);
 return result;
}
/**
 * Revisions are immutable recipe history, like catalog versions (not physical lots).
 * UI preview only; real tenant-safe posting is a separate backend concern.
 */
export function getBundleVersion(bundleProductId:string,revision?:number):BundleVersion|undefined {
 const versions=snapshot.bundleVersions.filter(item=>item.bundleProductId===bundleProductId);
 return revision===undefined?versions[versions.length-1]:versions.find(item=>item.revision===revision);
}
/** A preview hook for a genuinely posted invoice only; never call from F9 sale preview or drafts. */
export function registerPostedBundleSalePreview(invoice:{
 invoice:string;recordStatus:'Posted';lines:readonly {productId:string;bundleRevision?:number}[];
}):void {
 if(invoice.recordStatus!=='Posted')throw new Error('Only posted sale invoices may protect bundle revisions.');
 if(!invoice.invoice.trim())throw new Error('Posted invoice reference is required.');
 const referenced=new Map<string,number>();
 for(const line of invoice.lines){
  const product=snapshot.products.find(p=>p.id===line.productId);
  if(product?.kind!=='Bundle')continue;
  if(!Number.isInteger(line.bundleRevision)||!getBundleVersion(line.productId,line.bundleRevision))
   throw new Error('Missing or unknown bundle revision in posted invoice: '+line.productId);
  if(referenced.has(line.productId)&&referenced.get(line.productId)!==line.bundleRevision)
   throw new Error('Conflicting bundle revisions on one invoice: '+line.productId);
  referenced.set(line.productId,line.bundleRevision!);
 }
 if(!referenced.size)return;
 const existing=snapshot.bundleSaleReferences.filter(row=>row.invoice===invoice.invoice);
 if(existing.length){
  if(existing.length===referenced.size&&existing.every(row=>referenced.get(row.bundleProductId)===row.revision))
   return; // posting retry is idempotent
  throw new Error('Invoice already recorded with conflicting bundle revisions.');
 }
 const additions=Array.from(referenced,([bundleProductId,revision])=>
  Object.freeze({invoice:invoice.invoice,bundleProductId,revision}));
 publish({...snapshot,revision:snapshot.revision+1,
  bundleSaleReferences:Object.freeze([...snapshot.bundleSaleReferences,...additions])});
}
/** An unsold bundle can be deleted; any historical sale blocks deletion permanently. */
export function canDeleteBundlePreview(bundleProductId:string):boolean {
 return snapshot.products.some(p=>p.id===bundleProductId&&p.kind==='Bundle')&&
  !snapshot.bundleSaleReferences.some(row=>row.bundleProductId===bundleProductId);
}
export function deleteBundlePreview(bundleProductId:string):void {
 if(!snapshot.products.some(p=>p.id===bundleProductId&&p.kind==='Bundle'))
  throw new Error('Bundle product not found.');
 if(!canDeleteBundlePreview(bundleProductId))
  throw new Error('This package was sold and cannot be deleted; deactivate it instead.');
 if(snapshot.lots.some(lot=>lot.productId===bundleProductId)||
    snapshot.movements.some(movement=>movement.productId===bundleProductId))
  throw new Error('A package with recorded inventory cannot be deleted.');
 publish({...snapshot,revision:snapshot.revision+1,
  products:snapshot.products.filter(p=>p.id!==bundleProductId),
  bundleVersions:Object.freeze(snapshot.bundleVersions.filter(v=>v.bundleProductId!==bundleProductId))});
}
/** Saving an unused recipe updates it in place. Once sold, the next edit starts a new revision. */
export function upsertBundlePreview(
 draft:BundleDraft,expectedRevision:number|null,expectedRecipe?:BundleVersion
):BundleVersion {
 const product=draft.product;
 const existing=snapshot.products.find(item=>item.id===product.id);
 const latest=getBundleVersion(product.id);
 if(expectedRevision===null){
  if(existing||latest)throw new Error('Product ID already exists. Create a new Bundle SKU.');
 }else{
  if(!Number.isInteger(expectedRevision)||expectedRevision<1||!existing||existing.kind!=='Bundle'||!latest)
   throw new Error('Bundle revision changed or product no longer exists.');
  if(latest.revision!==expectedRevision)throw new Error('Bundle revision changed. Reopen and review before saving.');
  if(expectedRecipe&&latest!==expectedRecipe)
   throw new Error('Bundle recipe changed in another editor. Reopen before saving.');
 }
 if(snapshot.products.some(item=>item.id!==product.id&&skuKey(item.sku)===skuKey(product.sku)))
  throw new Error('Product SKU already exists.');
 const errors=validateBundleDraft(draft,snapshot.products);
 if(errors.length)throw new Error(errors.join(' '));
 const soldCurrent=latest&&snapshot.bundleSaleReferences.some(ref=>
  ref.bundleProductId===product.id&&ref.revision===latest.revision);
 const revision=!latest?1:soldCurrent?latest.revision+1:latest.revision;
 const version:BundleVersion=Object.freeze({
  bundleProductId:product.id,revision,
  createdAt:!latest||soldCurrent?new Date().toISOString():latest.createdAt,
  components:Object.freeze(draft.components.map(component=>Object.freeze({...component})))
 });
 const savedProduct:Product={
  ...product,kind:'Bundle',unit:'Set',stock:0,minStock:0,purchasePrice:0,
  altUnit:undefined,stockViewUnit:undefined,serialTracking:'Off',expiry:undefined
 };
 // A Save click with no actual master-data or component change is a no-op.
 // In particular, a previously sold package does not get a phantom revision.
 const fields:readonly (keyof Product)[]=['kind','name','nameBn','sku','category','brand','image',
  'unit','sellPrice','active','stock','minStock','purchasePrice','altUnit','stockViewUnit','serialTracking','expiry','warranty'];
 const sameProduct=Boolean(existing&&fields.every(key=>JSON.stringify(existing[key])===JSON.stringify(savedProduct[key])));
 const sameComponents=Boolean(latest&&latest.components.length===version.components.length&&
  latest.components.every((old,index)=>{
   const next=version.components[index];
   return old.productId===next.productId&&old.primaryQty===next.primaryQty&&
    old.secondaryQty===next.secondaryQty&&old.selectedUnit===next.selectedUnit&&
    old.baseQty===next.baseQty&&old.unitFactorAtSave===next.unitFactorAtSave&&old.sortOrder===next.sortOrder;
  }));
 if(latest&&sameProduct&&sameComponents)return latest;
 const products=existing?snapshot.products.map(item=>item.id===existing.id?savedProduct:item):[savedProduct,...snapshot.products];
 const versions=latest&&!soldCurrent
  ?snapshot.bundleVersions.map(v=>v.bundleProductId===product.id&&v.revision===latest.revision?version:v)
  :[...snapshot.bundleVersions,version];
 publish({...snapshot,revision:snapshot.revision+1,products,
  bundleVersions:Object.freeze(versions)});
 return version;
}
/** The manual Add/Edit screen shares the same Product projection as bulk imports. */
export function upsertProductPreview(product:Product,lot?:StockLot,movement?:StockMovement):void {
 if(product.kind==='Bundle'||snapshot.products.some(item=>item.id===product.id&&item.kind==='Bundle'))
  throw new Error('Bundle products must be edited through the versioned Bundle editor.');
 const products=snapshot.products.filter(p=>p.id!==product.id);
 if(products.some(p=>skuKey(p.sku)===skuKey(product.sku)))throw new Error('Product SKU already exists.');
 if(Boolean(lot)!==Boolean(movement))throw new Error('Opening lot and movement must be paired.');
 if(lot&&(lot.productId!==product.id||movement?.productId!==product.id))throw new Error('Opening reference mismatch.');
 publish({revision:snapshot.revision+1,appliedSessionIds:snapshot.appliedSessionIds,
  products:[{...product},...products],lots:lot?[{...lot},...snapshot.lots]:snapshot.lots,
  movements:movement?[{...movement},...snapshot.movements]:snapshot.movements,bundleVersions:snapshot.bundleVersions,bundleSaleReferences:snapshot.bundleSaleReferences});
}
/** Keep stock corrections and manually received lots visible after Product-page navigation. */
export function updateProductInventoryPreview(product:Product,lots:readonly StockLot[],movements:readonly StockMovement[]):void {
 if(product.kind==='Bundle'||snapshot.products.some(item=>item.id===product.id&&item.kind==='Bundle'))
  throw new Error('Virtual bundles have no direct stock to adjust.');
 const products=snapshot.products.map(p=>p.id===product.id?{...product}:p);
 if(!products.some(p=>p.id===product.id))throw new Error('Product does not exist.');
 publish({revision:snapshot.revision+1,appliedSessionIds:snapshot.appliedSessionIds,
  products,lots:[...lots],movements:[...movements],bundleVersions:snapshot.bundleVersions,bundleSaleReferences:snapshot.bundleSaleReferences});
}
