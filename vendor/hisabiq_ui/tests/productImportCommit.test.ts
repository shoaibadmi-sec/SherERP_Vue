import test from 'node:test';
import assert from 'node:assert/strict';
import {planProductImport} from '../src/import/productImport.ts';
import {getProductImportPreviewSnapshot,commitProductImportPreview,subscribeProductImportPreview} from '../src/data/productImportPreviewStore.ts';
import type {StagedImportRow} from '../src/import/importTypes.ts';
const row=(sourceRow:number,sku:string,stock=1):StagedImportRow=>({
 sourceSheet:'CSV',sourceRow,original:{},mapped:{name:'Imported '+sku,sku,baseUnit:'Pcs',
  sellingPrice:100,purchasePrice:50,openingStock:stock,openingDate:'2026-10-01'},issues:[],decision:'create'
});
const prefix='BATCH-'+Date.now();
const makePlan=(rows:StagedImportRow[],sessionId:string)=>{
 const snap=getProductImportPreviewSnapshot();
 return planProductImport(rows,snap.products,snap.lots,{sessionId,today:'2026-10-09',baseRevision:snap.revision});
};
test('one revision/notification for two products, lots, and movements; session replay no duplicates',()=>{
 const before=getProductImportPreviewSnapshot();let notifications=0;
 const unsubscribe=subscribeProductImportPreview(()=>{notifications++;});
 const session=prefix+'-a';
 const plan=makePlan([row(2,prefix+'-a'),row(3,prefix+'-b',20)],session);
 assert.equal(plan.issues.length,0);
 const result=commitProductImportPreview(plan);const next=getProductImportPreviewSnapshot();
 assert.equal(result.created,2);assert.equal(result.openingLots,2);
 assert.equal(next.revision,before.revision+1);assert.equal(notifications,1);
 assert.equal(next.products.length,before.products.length+2);
 assert.equal(next.lots.length,before.lots.length+2);
 assert.equal(next.movements.length,before.movements.length+2);
 assert.equal(next.products.find(p=>p.sku===prefix+'-b')?.stock,20);
 assert.deepEqual(commitProductImportPreview(plan),result);
 assert.equal(getProductImportPreviewSnapshot(),next);assert.equal(notifications,1);
 unsubscribe();
});
test('late invalid lot and duplicate SKU fail without partial changes',()=>{
 const before=getProductImportPreviewSnapshot();const p=makePlan([row(2,prefix+'-c'),row(3,prefix+'-d')],prefix+'-bad');
 p.creates[1].openingLot!.available=-9;
 assert.throws(()=>commitProductImportPreview(p),/mismatch/);
 assert.equal(getProductImportPreviewSnapshot(),before);
 const dupe=makePlan([row(2,before.products[0].sku)],prefix+'-existing');
 assert.ok(dupe.issues.length>0||dupe.creates.length>0);
 assert.throws(()=>commitProductImportPreview(dupe));
 assert.equal(getProductImportPreviewSnapshot(),before);
});
test('stale revision and planner validation errors reject without state change',()=>{
 const before=getProductImportPreviewSnapshot();
 const p=makePlan([row(2,prefix+'-e')],prefix+'-stale');p.baseRevision--;
 assert.throws(()=>commitProductImportPreview(p),/changed/);
 const bad=makePlan([row(2,prefix+'-f'),row(3,prefix+'-g',-5)],prefix+'-err');
 assert.equal(bad.issues.length,1);
 assert.throws(()=>commitProductImportPreview(bad),/invalid product/);
 assert.equal(getProductImportPreviewSnapshot(),before);
});
