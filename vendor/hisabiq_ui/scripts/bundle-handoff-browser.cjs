/* Bundle version handoff: accepted quote identity, changed recipe review, POS V2 parent line. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
async function main(){
 const {createServer}=await import('vite');
 const server=await createServer({server:{host:'127.0.0.1',port:4497,strictPort:true}});
 await server.listen();
 const browser=await chromium.launch({args:['--no-sandbox']});
 try{
  for(const viewport of [{width:390,height:844},{width:1024,height:768}]){
   const page=await browser.newPage({viewport,reducedMotion:'reduce'});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:4497/#/app/online-sales');
   const created=await page.evaluate(async()=>{
    const m=await import('/src/data/productImportPreviewStore.ts');
    const v=await import('/src/bundles/bundleValidation.ts');
    const h=await import('/src/bundles/bundleHandoff.ts');
    const online=await import('/src/onlineSales/onlineStore.ts');
    const products=m.getProductImportPreviewSnapshot().products;
    const a=products.find(p=>p.id==='p1'),b=products.find(p=>p.id==='p9');
    const p={id:'handoff-browser-bundle',kind:'Bundle',name:'Handoff Set',sku:'PKG-HANDOFF-TEST',
     category:'Hardware',unit:'Set',stock:0,minStock:0,purchasePrice:0,sellPrice:1800,active:true};
    const recipe=qty=>[v.makeBundleComponent(a,a.unit,String(qty),'',0),
     v.makeBundleComponent(b,b.unit,'1','',1)];
    m.upsertBundlePreview({product:p,components:recipe(2)},null);
    const pinned=h.captureBundleHandoff(p);
    const line={id:'line-1',productId:p.id,name:p.name,quantity:2,unit:'Set',price:1750,
     secondaryQuantity:0,unitFactor:1,...pinned};
    const draft={channel:'Facebook',sourceReference:'Inbox 101',customerName:'Demo Buyer',
     phone:'01711223344',address:'Rajshahi',lines:[line],discount:50,deliveryCharge:100,
     prepaid:0,paymentMode:'COD',note:''};
    const order=online.createOnlineOrder(draft);
    online.updateOrderStage(order.id,'Confirmed');
    m.upsertBundlePreview({product:p,components:recipe(3)},1);
    if(m.getBundleVersion(p.id).revision!==1)throw new Error('Unsold recipe revision should remain 1');
    if(!h.inspectBundleHandoffs([line]).length)throw new Error('Changed recipe must require review');
    return {number:order.number,prior:pinned.bundleRecipeSignature};
   });
   await page.getByRole('button',{name:created.number}).first().click();
   await page.getByRole('button',{name:/Open in POS V2/}).click();
   const dialog=page.getByRole('dialog',{name:'Review changed package'});
   await dialog.waitFor();
   assert.match(await dialog.innerText(),/Saved:/);
   assert.match(await dialog.innerText(),/Current:/);
   await dialog.getByRole('button',{name:'Use current package recipe'}).click();
   await page.getByTestId('pos-cart-row').filter({hasText:'Handoff Set'}).waitFor();
   const rows=page.getByTestId('pos-cart-row').filter({hasText:'Handoff Set'});
   assert.equal(await rows.count(),1);
   assert.match(await rows.innerText(),/2/);
   const status=await page.evaluate(async()=>{
    const online=await import('/src/onlineSales/onlineStore.ts');
    const store=await import('/src/data/productImportPreviewStore.ts');
    const h=await import('/src/bundles/bundleHandoff.ts');
    const order=online.getOnlineSnapshot().orders.find(o=>o.number===document.body.textContent?.match(/ON-\d{6}/)?.[0]);
    const updated=online.getOnlineSnapshot().orders.find(o=>o.lines.some(l=>l.productId==='handoff-browser-bundle'));
    return {line:updated.lines[0],current:store.getBundleVersion('handoff-browser-bundle'),
     issues:h.inspectBundleHandoffs(updated.lines)};
   });
   assert.equal(status.line.price,1750);
   assert.equal(status.line.quantity,2);
   assert.deepEqual(status.issues,[]);
   assert.equal(status.line.bundleRevision,status.current.revision);
   assert.notEqual(status.line.bundleRecipeSignature,created.prior);
   assert.deepEqual(errors,[]);
   await page.close();
  }
  console.log('Bundle handoff: phone/tablet stale-recipe review and preserved parent price/quantity passed');
 }finally{await browser.close();await server.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1});
