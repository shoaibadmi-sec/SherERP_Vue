import test from 'node:test';
import assert from 'node:assert/strict';
import type {BundleDraft} from '../src/types/erp.ts';
import {makeBundleComponent} from '../src/bundles/bundleValidation.ts';
import {
  getProductImportPreviewSnapshot,getBundleVersion,upsertBundlePreview,
  canDeleteBundlePreview,deleteBundlePreview,registerPostedBundleSalePreview,
  subscribeProductImportPreview,upsertProductPreview,updateProductInventoryPreview
} from '../src/data/productImportPreviewStore.ts';

const seed=getProductImportPreviewSnapshot().products;
const pipe=seed.find(p=>p.id==='p2')!;
const socket=seed.find(p=>p.id==='p5')!;
const prefix='BUNDLE-LIFECYCLE-'+Date.now().toString(36);
const draft=(id:string, qty:string, price=1500):BundleDraft=>({
 product:{id,kind:'Bundle',name:'Pump package '+id,sku:id,unit:'Set',
  category:'Plumbing',stock:0,minStock:0,purchasePrice:0,sellPrice:price,active:true},
 components:[
  makeBundleComponent(pipe,'Box',qty,'2',0),
  makeBundleComponent(socket,'Gauge','1','4',1)
 ]
});
const posted=(invoice:string,id:string,revision:number)=>({
 invoice,recordStatus:'Posted' as const,lines:[{productId:id,bundleRevision:revision}]
});

test('unsold recipe edits replace revision 1 in place instead of generating history',()=>{
 const id=prefix+'-EDIT';
 const a=upsertBundlePreview(draft(id,'1'),null);
 let count=0;
 const stop=subscribeProductImportPreview(()=>{count++;});
 const b=upsertBundlePreview(draft(id,'2',1700),1);
 const c=upsertBundlePreview(draft(id,'3',1900),1);
 stop();
 assert.equal(a.revision,1);
 assert.equal(b.revision,1);
 assert.equal(c.revision,1);
 assert.equal(count,2);
 assert.equal(getProductImportPreviewSnapshot().bundleVersions.filter(v=>v.bundleProductId===id).length,1);
 assert.equal(getBundleVersion(id)?.components[0].baseQty,32);
 assert.equal(getBundleVersion(id)?.revision,1);
 assert.equal(getProductImportPreviewSnapshot().products.find(p=>p.id===id)?.sellPrice,1900);
 assert.equal(a.components[0].baseQty,12,'earlier frozen recipe objects are not mutated in-place');
});

test('after a posted sale, the next edit creates a revision and protects the sold one',()=>{
 const id=prefix+'-SOLD';
 upsertBundlePreview(draft(id,'1'),null);
 registerPostedBundleSalePreview(posted('INV-'+id,id,1));
 assert.equal(canDeleteBundlePreview(id),false);
 const a=upsertBundlePreview(draft(id,'2'),1);
 assert.equal(a.revision,2);
 assert.equal(getBundleVersion(id,1)?.components[0].baseQty,12);
 assert.equal(getBundleVersion(id,2)?.components[0].baseQty,22);
 const b=upsertBundlePreview(draft(id,'3'),2);
 assert.equal(b.revision,2,'unsold revision 2 may be edited repeatedly in place');
 assert.equal(getBundleVersion(id,2)?.components[0].baseQty,32);
 assert.equal(getProductImportPreviewSnapshot().bundleVersions.filter(v=>v.bundleProductId===id).length,2);
 registerPostedBundleSalePreview(posted('INV-'+id+'-2',id,2));
 const c=upsertBundlePreview(draft(id,'4'),2);
 assert.equal(c.revision,3,'a new sale of revision 2 freezes it too');
 assert.equal(getBundleVersion(id,2)?.components[0].baseQty,32);
});

test('unsold package is deletable together with its unsold recipe, then SKU is reusable',()=>{
 const id=prefix+'-DELETE';
 upsertBundlePreview(draft(id,'1'),null);
 assert.equal(canDeleteBundlePreview(id),true);
 const before=getProductImportPreviewSnapshot();
 deleteBundlePreview(id);
 const after=getProductImportPreviewSnapshot();
 assert.equal(after.revision,before.revision+1);
 assert.ok(!after.products.some(p=>p.id===id));
 assert.ok(!after.bundleVersions.some(v=>v.bundleProductId===id));
 assert.equal(getBundleVersion(id),undefined);
 upsertBundlePreview(draft(id,'2'),null);
 assert.equal(getBundleVersion(id)?.revision,1);
});

test('ever sold package cannot be deleted even if sale is old or version is returned',()=>{
 const id=prefix+'-PROTECTED';
 upsertBundlePreview(draft(id,'1'),null);
 registerPostedBundleSalePreview(posted('INV-'+id,id,1));
 upsertBundlePreview(draft(id,'2'),1);
 const before=getProductImportPreviewSnapshot();
 assert.equal(canDeleteBundlePreview(id),false);
 assert.throws(()=>deleteBundlePreview(id),/sold|invoice|used/i);
 assert.equal(getProductImportPreviewSnapshot(),before);
});

test('a preview/draft never counts as a posted sale and invalid sale registration is atomic',()=>{
 const id=prefix+'-UNSOLD';
 upsertBundlePreview(draft(id,'1'),null);
 const before=getProductImportPreviewSnapshot();
 assert.throws(()=>registerPostedBundleSalePreview({
   invoice:'INV-'+id,recordStatus:'Draft' as unknown as 'Posted',lines:[{productId:id,bundleRevision:1}]
 }),/posted/i);
 assert.throws(()=>registerPostedBundleSalePreview(posted('INV-'+id,id,12)),/revision|unknown/i);
 assert.throws(()=>registerPostedBundleSalePreview({
   invoice:'INV-'+id,recordStatus:'Posted',lines:[{productId:id}]
 }),/revision|missing/i);
 assert.equal(getProductImportPreviewSnapshot(),before);
 assert.equal(canDeleteBundlePreview(id),true);
});

test('replayed invoice cannot duplicate sale usage or silently change its historical version',()=>{
 const id=prefix+'-REPLAY';
 upsertBundlePreview(draft(id,'1'),null);
 const sale=posted('INV-'+id,id,1);
 registerPostedBundleSalePreview(sale);
 const before=getProductImportPreviewSnapshot();
 registerPostedBundleSalePreview(sale);
 assert.equal(getProductImportPreviewSnapshot(),before);
 upsertBundlePreview(draft(id,'2'),1);
 assert.throws(()=>registerPostedBundleSalePreview(posted('INV-'+id,id,2)),/conflict|already|invoice/i);
 assert.equal(getBundleVersion(id,1)?.components[0].baseQty,12);
});

test('saving with no changes makes no new version or catalog revision, even after a sale',()=>{
 const id=prefix+'-UNCHANGED';
 const saved=upsertBundlePreview(draft(id,'1'),null);
 const before=getProductImportPreviewSnapshot();
 assert.strictEqual(upsertBundlePreview(draft(id,'1'),1,saved),saved);
 assert.strictEqual(getProductImportPreviewSnapshot(),before);
 registerPostedBundleSalePreview(posted('INV-'+id,id,1));
 const referenced=getBundleVersion(id)!;
 const afterSale=getProductImportPreviewSnapshot();
 assert.strictEqual(upsertBundlePreview(draft(id,'1'),1,referenced),referenced);
 assert.strictEqual(getProductImportPreviewSnapshot(),afterSale);
});

test('stale open unsold editor is rejected instead of overwriting an in-place edit',()=>{
 const id=prefix+'-STALE';
 const opened=upsertBundlePreview(draft(id,'1'),null);
 upsertBundlePreview(draft(id,'2'),1,opened);
 const latest=getBundleVersion(id)!;
 assert.equal(latest.revision,1);
 const before=getProductImportPreviewSnapshot();
 assert.throws(()=>upsertBundlePreview(draft(id,'3'),1,opened),/changed/i);
 assert.strictEqual(getProductImportPreviewSnapshot(),before);
});

test('unrelated stock catalog edits never erase the posted-sale lock',()=>{
 const id=prefix+'-SURVIVE';
 upsertBundlePreview(draft(id,'1'),null);
 registerPostedBundleSalePreview(posted('INV-'+id,id,1));
 const before=getProductImportPreviewSnapshot();
 upsertProductPreview({...pipe,name:pipe.name+' (label updated)'});
 const changed=getProductImportPreviewSnapshot();
 assert.strictEqual(changed.bundleSaleReferences,before.bundleSaleReferences);
 updateProductInventoryPreview({...socket},changed.lots,changed.movements);
 assert.equal(canDeleteBundlePreview(id),false);
 assert.throws(()=>deleteBundlePreview(id),/sold/i);
});
