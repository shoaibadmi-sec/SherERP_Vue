import test from 'node:test';
import assert from 'node:assert/strict';
import {products} from '../src/data/products.ts';
import {saleTemplates} from '../src/data/sales.ts';
import {cartFromPreset,templateCart} from '../src/utils/salePresets.ts';
import {getSalesPreviewSnapshot,saveSaleTemplate,updateSalesPreview} from '../src/data/salesPreviewStore.ts';

test('templates share a source across create, edit, duplicate, POS load and delete',()=>{
 const original=getSalesPreviewSnapshot();
 const source=structuredClone(saleTemplates[0]);
 const saved=saveSaleTemplate({...source,name:'New session template',total:999999});
 assert.notEqual(saved.id,source.id);
 assert.equal(getSalesPreviewSnapshot().templates.find(item=>item.id===saved.id)?.name,'New session template');
 const loaded=cartFromPreset(saved.lines,products);
 assert.deepEqual(loaded.map(line=>line.product.id),source.lines.map(line=>line.productId));
 assert.equal(saved.total,templateCart(loaded).total,'recompute totals from validated compound quantities');
 const updated=saveSaleTemplate({...saved,name:'Updated template',lines:saved.lines.slice(0,2)},saved);
 assert.equal(updated.id,saved.id);assert.equal(updated.items,2);
 assert.equal(getSalesPreviewSnapshot().templates.find(item=>item.id===saved.id)?.lines.length,2);
 assert.throws(()=>saveSaleTemplate({...saved,name:'Stale'},saved),/changed/);
 const copy=saveSaleTemplate({...updated,name:'Updated copy'});
 assert.notEqual(copy.id,updated.id);assert.deepEqual(copy.lines,updated.lines);
 updateSalesPreview('templates',items=>items.filter(item=>item.id!==copy.id));
 assert.equal(getSalesPreviewSnapshot().templates.some(item=>item.id===copy.id),false);
 assert.deepEqual(saleTemplates[0],source,'fixture stays immutable');
 updateSalesPreview('templates',()=>original.templates);
});
test('template validation rejects malformed quantities, prices, missing products and empty carts',()=>{
 const source=saleTemplates[0];const cart=cartFromPreset(source.lines,products);
 assert.throws(()=>templateCart([]));
 for(const qty of ['1..2','Infinity','-1'])assert.throws(()=>templateCart([{...cart[0],qty}]));
 for(const price of ['1..2','Infinity','-1','12.34567'])assert.throws(()=>templateCart([{...cart[0],price}]));
 assert.throws(()=>saveSaleTemplate({...source,name:' '}));
 assert.throws(()=>saveSaleTemplate({...source,lines:[{...source.lines[0],productId:'missing'}]}),/unavailable/);
 assert.throws(()=>saveSaleTemplate({...source,lines:[{...source.lines[0],unit:'Unknown'}]}),/unit/);
});
test('template round trip preserves compound units and recipe identity without reserving serials or sources',()=>{
 const cart=cartFromPreset([{productId:'p2',qty:'2',secondaryQty:'5',unit:'Box',price:1650}],products);
 const saved=templateCart(cart);assert.equal(saved.total,4125);
 assert.deepEqual(cartFromPreset(saved.lines,products).map(line=>[line.qty,line.secondaryQty,line.unit,line.price]),[['2','5','Box','1650']]);
});

test('planned bundles preserve pinned recipes without persisting fulfillment reservations',()=>{
 const original=cartFromPreset(saleTemplates[0].lines,products)[0];
 const product={...original.product,kind:'Bundle' as const,unit:'Set',altUnit:undefined};
 const planned={...original,product,qty:'2',secondaryQty:'',unit:'Set',price:'100',bundleRevision:3,
  bundleRecipeSignature:'pinned-recipe',serials:['planned-serial'],bundleSerials:{p1:['planned-serial']}};
 const saved=templateCart([planned]);
 assert.equal(saved.lines[0].bundleRevision,3);assert.equal(saved.lines[0].bundleRecipeSignature,'pinned-recipe');
 assert.equal(saved.lines[0].serials,undefined);assert.equal(saved.lines[0].bundleSerials,undefined);
 assert.throws(()=>templateCart([{...planned,qty:'1.5'}]));
});
