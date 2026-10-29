import test from 'node:test';
import assert from 'node:assert/strict';
import {getProductImportPreviewSnapshot,upsertBundlePreview,getBundleVersion} from '../src/data/productImportPreviewStore.ts';
import {makeBundleComponent} from '../src/bundles/bundleValidation.ts';
import {captureBundleHandoff,inspectBundleHandoffs,reviewBundleHandoffs,requireCurrentBundleHandoffs} from '../src/bundles/bundleHandoff.ts';
import {saveQuote,changeQuoteStatus,getQuoteSnapshot} from '../src/quotations/quotePreviewStore.ts';
import {draftFromAcceptedQuote,createOnlineOrder,updateOrderStage,preparePosHandoff} from '../src/onlineSales/onlineStore.ts';

const catalog=getProductImportPreviewSnapshot().products;
const a=catalog.find(p=>p.id==='p1')!,b=catalog.find(p=>p.id==='p9')!;
const item={id:'handoff-test-bundle-1',kind:'Bundle' as const,name:'Hand-off Kit',sku:'T-HANDOFF-1',unit:'Set',category:'Hardware',
 stock:0,minStock:0,purchasePrice:0,sellPrice:1800,active:true};
const first=[makeBundleComponent(a,a.unit,'2','',0),makeBundleComponent(b,b.unit,'1','',1)];
const changed=[makeBundleComponent(a,a.unit,'3','',0),makeBundleComponent(b,b.unit,'1','',1)];
const newBundle=()=>upsertBundlePreview({product:item,components:first},null);
const quoteInput=(pin:ReturnType<typeof captureBundleHandoff>)=>({
 date:new Date(Date.now()+6*60*60*1000).toISOString().slice(0,10),
 validUntil:new Date(Date.now()+30*24*60*60*1000+6*60*60*1000).toISOString().slice(0,10),
 customerName:'Bangladesh Shop',
 note:'',status:'Draft' as const,discount:50,lines:[{id:'bundle-quote-line',productId:item.id,name:item.name,unit:'Set',quantity:2,price:1800,...pin}]
});
test('quote → accepted order keeps whole Sets, parent agreed price, revision and recipe signature',()=>{
 newBundle();
 const pin=captureBundleHandoff(item);
 const quote=saveQuote(quoteInput(pin));
 const sent=changeQuoteStatus(quote.id,'Sent');
 assert.equal(sent.lines[0].bundleRevision,1);
 const accepted=changeQuoteStatus(quote.id,'Accepted');
 const online=draftFromAcceptedQuote(accepted);
 assert.equal(online.lines[0].quantity,2);
 assert.equal(online.lines[0].price,1800);
 assert.equal(online.lines[0].bundleRecipeSignature,pin.bundleRecipeSignature);
 const created=createOnlineOrder({...online,phone:'01711223344',address:'Rajshahi'});
 const confirmed=updateOrderStage(created.id,'Confirmed');
 const pos=preparePosHandoff(confirmed.id,getProductImportPreviewSnapshot().products);
 assert.deepEqual(pos.lines.map(l=>[l.productId,l.qty,l.unit,l.price,l.bundleRevision,l.bundleRecipeSignature]),
  [[item.id,'2','Set','1800',1,pin.bundleRecipeSignature]]);
 assert.equal(pos.discount,50);
});
test('editing an unsold recipe in place triggers mismatch even if revision remains 1',()=>{
 const saved=captureBundleHandoff(item);
 const latest=getBundleVersion(item.id)!;
 upsertBundlePreview({product:item,components:changed},latest.revision);
 assert.equal(getBundleVersion(item.id)!.revision,latest.revision);
 const line={productId:item.id,unit:'Set',quantity:2,price:1800,...saved};
 const issues=inspectBundleHandoffs([line]);
 assert.equal(issues.length,1);
 assert.match(issues[0].reason,/changed/);
 assert.match(issues[0].before,/2/);
 assert.match(issues[0].after,/3/);
 assert.throws(()=>requireCurrentBundleHandoffs([line]),/changed/);
 const agreed=reviewBundleHandoffs([line]);
 assert.deepEqual([agreed[0].bundleRevision,agreed[0].quantity,agreed[0].price],[1,2,1800]);
 assert.doesNotThrow(()=>requireCurrentBundleHandoffs(agreed));
});
test('stale accepted quote cannot silently create online order with changed components',()=>{
 const staleQuote=getQuoteSnapshot().quotes.find(q=>q.lines.some(line=>line.productId===item.id))!;
 assert.throws(()=>draftFromAcceptedQuote(staleQuote),/changed/);
 assert.throws(()=>saveQuote(quoteInput({bundleRevision:1,bundleRecipeSignature:JSON.stringify(first)})),/changed/);
 const quote=saveQuote({...quoteInput(captureBundleHandoff(item)),lines:reviewBundleHandoffs(quoteInput({bundleRevision:1,bundleRecipeSignature:JSON.stringify(first)}).lines)});
 assert.equal(changeQuoteStatus(quote.id,'Sent').status,'Sent');
});
test('fractional Sets and missing revision cannot be reviewed into accepted order',()=>{
 assert.equal(inspectBundleHandoffs([{productId:item.id,unit:'Set',quantity:1.5,...captureBundleHandoff(item)}]).length,1);
 assert.throws(()=>reviewBundleHandoffs([{productId:item.id,unit:'Set',quantity:1.5}]),/whole Sets/);
 assert.equal(inspectBundleHandoffs([{productId:item.id,unit:'Set',quantity:2}]).length,1);
});
