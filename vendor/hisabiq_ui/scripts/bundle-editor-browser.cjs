/* Bundle editor regression: original stock components, automatic history, mobile popup. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
async function run(){
 const {createServer}=await import('vite');
 const server=await createServer({server:{host:'127.0.0.1',port:4473,strictPort:true}});
 await server.listen();
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
 const errors=[];
 try{
  for(const viewport of [{width:390,height:844},{width:1024,height:768}]){
   const page=await browser.newPage({viewport,reducedMotion:'reduce'});
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:4473/#/app/products');
   await page.getByRole('button',{name:/Add package/i}).click();
   const editor=page.getByTestId('bundle-editor');
   await editor.waitFor();
   await editor.getByRole('textbox',{name:'Package name'}).fill('Tubewell Set');
   const sku='PKG-'+viewport.width+'-'+Date.now();
   await editor.getByRole('textbox',{name:'Package SKU'}).fill(sku);
   await editor.getByRole('combobox',{name:'Category',exact:true}).click();
    await page.getByText('Add new category',{exact:true}).click();
   const quick=page.locator('[data-slot="dialog-content"]').last();
   await quick.getByPlaceholder('Category name').fill('New Package Category '+viewport.width);
   await quick.getByRole('button',{name:'Add category'}).click();
   await quick.waitFor({state:'hidden'});
   assert.match(await editor.getByRole('combobox',{name:'Category'}).innerText(),new RegExp('New Package Category '+viewport.width));
   await editor.getByRole('textbox',{name:'Price per Set'}).fill('5000');
   for(const [i,name] of ['LED Bulb 12W','Wire Mesh Net 3 ft'].entries()){
    const pick=editor.getByRole('combobox',{name:'Find stock component'});
    await pick.fill(name);
    await pick.press('Enter');
    assert.equal(await editor.getByTestId('bundle-component-row').count(),i+1);
   }
   assert.equal(await editor.getByTestId('bundle-component-row').count(),2);
   assert.equal(await editor.locator('[data-cart-kind="sale"]').count(),1,'bundle editor should reuse POS cart layout');
   assert.equal(await editor.getByTestId('bundle-component-row').first().getByRole('radiogroup',{name:/unit/i}).count(),1);
   await editor.getByTestId('bundle-component-row').first().getByRole('button',{name:/Show purchase cost/i}).click();
   await editor.getByTestId('bundle-component-row').first().getByText(/estimated purchase/i).waitFor();
   await editor.getByText('Component purchase cost').waitFor();
   await editor.getByText('Products at POS prices').waitFor();
   await editor.getByText('Package selling price').waitFor();
   await editor.getByText('Estimated package profit').waitFor();
   await editor.getByTestId('bundle-component-row').first().getByRole('textbox',{name:/quantity/i}).first().fill('2');
   await editor.getByTestId('bundle-pricing-summary').getByRole('button',{name:'Save package'}).click();
   await editor.waitFor({state:'hidden'});
   const initial=await page.evaluate(async id=>{
    const mod=await import('/src/data/productImportPreviewStore.ts');
    const state=mod.getProductImportPreviewSnapshot();
    const p=state.products.find(p=>p.sku===id);
    return state.bundleVersions.find(x=>x.bundleProductId===p?.id);
   },sku);
   assert.equal(initial.revision,1);
   assert.equal(initial.components.length,2);
   const actions=page.getByRole('button',{name:'Actions for Tubewell Set'}).last();
   await actions.click();
   await page.getByRole('button',{name:'Edit product'}).last().click();
   await editor.waitFor();
   await editor.getByTestId('bundle-component-row').first().getByRole('textbox',{name:/quantity/i}).first().fill('3');
   await editor.getByTestId('bundle-pricing-summary').getByRole('button',{name:'Save package'}).click();
   const revisions=await page.evaluate(async id=>{
    const mod=await import('/src/data/productImportPreviewStore.ts');
    const state=mod.getProductImportPreviewSnapshot();
    const p=state.products.find(p=>p.sku===id);
    return state.bundleVersions.filter(x=>x.bundleProductId===p?.id);
   },sku);
   assert.equal(revisions.length,1,'editing before sale should NOT create a new version');
   assert.equal(revisions[0].components[0].primaryQty,'3');
   await page.getByRole('button',{name:'Actions for Tubewell Set'}).last().click();
   await page.getByRole('button',{name:'Delete package'}).waitFor({state:'visible'}); // React popup mounts asynchronously
   // A real sale preview does not post; emulate an authenticated posted-invoice event for lifecycle verification.
   await page.evaluate(async id=>{
     const mod=await import('/src/data/productImportPreviewStore.ts');
     const item=mod.getProductImportPreviewSnapshot().products.find(p=>p.sku===id);
     mod.registerPostedBundleSalePreview({invoice:'INV-'+id,recordStatus:'Posted',
       lines:[{productId:item.id,bundleRevision:1}]});
   },sku);
   await page.getByRole('button',{name:'Delete package'}).waitFor({state:'hidden'});
   await page.getByRole('button',{name:'Edit product'}).last().click();
   await editor.waitFor();
   await editor.getByTestId('bundle-component-row').first().getByRole('textbox',{name:/quantity/i}).first().fill('4');
   await editor.getByTestId('bundle-pricing-summary').getByRole('button',{name:'Save package'}).click();
   await editor.waitFor({state:'hidden'});
   const history=await page.evaluate(async id=>{
     const mod=await import('/src/data/productImportPreviewStore.ts');
     const state=mod.getProductImportPreviewSnapshot();
     const item=state.products.find(p=>p.sku===id);
     return state.bundleVersions.filter(x=>x.bundleProductId===item.id);
   },sku);
   assert.equal(history.length,2,'the first post-sale edit should create revision 2');
   assert.equal(history[0].components[0].primaryQty,'3','revision 1 used in the sale stays frozen');
   assert.equal(history[1].components[0].primaryQty,'4');
   await page.getByRole('button',{name:'Actions for Tubewell Set'}).last().click();
   await page.getByRole('button',{name:'Edit product'}).last().click();
   await editor.waitFor();
   await editor.getByTestId('bundle-component-row').first().getByRole('textbox',{name:/quantity/i}).first().fill('5');
   await editor.getByTestId('bundle-pricing-summary').getByRole('button',{name:'Save package'}).click();
   await editor.waitFor({state:'hidden'});
   assert.deepEqual(await page.evaluate(async id=>{
     const mod=await import('/src/data/productImportPreviewStore.ts');
     const state=mod.getProductImportPreviewSnapshot();
     const item=state.products.find(p=>p.sku===id);
     return state.bundleVersions.filter(x=>x.bundleProductId===item.id).map(x=>x.components[0].primaryQty);
   },sku),['3','5'],'unsold revision 2 is editable in place');
   await page.getByRole('button',{name:'Actions for Tubewell Set'}).last().click();
   await page.getByRole('button',{name:'View details'}).last().click();
   const details=page.locator('[data-slot="dialog-content"]').last();
   await details.getByRole('tab',{name:/History/i}).click();
   await details.getByText('Recipe revisions').waitFor();
   await details.getByText('Version 1').waitFor();
   await details.getByText('Version 2').waitFor();
   assert.equal(await details.getByRole('button',{name:/Adjust stock/i}).count(),0);
   await details.getByRole('button',{name:'Close',exact:true}).first().click();
   await page.getByRole('button',{name:'Actions for Tubewell Set'}).last().click();
   await page.getByRole('button',{name:'Duplicate'}).last().click();
   await page.getByRole('button',{name:'Actions for Tubewell Set Copy'}).last().click();
   await page.getByRole('button',{name:'Delete package'}).click();
   const confirm=page.locator('[data-slot="dialog-content"]').last();
   await confirm.getByText(/Delete unsold package/).waitFor();
   await confirm.getByRole('button',{name:'Delete package'}).click();
   await confirm.waitFor({state:'hidden'});
   assert.equal(await page.getByText('Tubewell Set Copy',{exact:true}).count(),0,'unsold duplicate gets removed');
   assert.equal(await page.getByText('Tubewell Set',{exact:true}).count()>0,true,'sold original remains');
   await page.evaluate(()=>{window.location.hash='#/app/pos';});
   const posSearch=page.getByRole('combobox',{name:/Add product/i}).first();
   await posSearch.waitFor();
   await posSearch.fill(sku);
   await page.getByRole('option',{name:/Tubewell Set/}).click();
   const posLine=page.locator('[data-testid="pos-cart-row"]').filter({hasText:'Tubewell Set'}).first();
   await posLine.getByRole('button',{name:/Show purchase price for Tubewell Set/i}).click();
   await posLine.getByText(/package cost/i).waitFor();
   await posLine.getByText(/estimated/i).waitFor();
   const costTooltip=posLine.getByText(/Current component lots/);
   const costBounds=await costTooltip.boundingBox();
   assert.ok(costBounds,'POS package cost tooltip is visible');
   assert.ok(costBounds.x>=-2&&costBounds.x+costBounds.width<=viewport.width+2,
     'POS package cost tooltip must stay inside viewport on phones');

   await posLine.getByText(/View included products/i).waitFor();
   await page.evaluate(()=>{window.location.hash='#/app/purchases/new';});
   const purchaseSearch=page.getByRole('combobox',{name:'Search product to add to purchase'});
   await purchaseSearch.waitFor();
   await purchaseSearch.fill(sku);
   assert.equal(await page.getByRole('option',{name:/Tubewell Set/}).count(),0,'a virtual bundle cannot be directly purchased into stock');

   assert.equal(await page.locator('body').evaluate(el=>el.scrollWidth<=innerWidth),true);
   await page.close();
  }
  assert.deepEqual(errors,[]);
  console.log('Bundle edit-in-place, posted-sale revisions, unsold delete and mobile/landscape: PASS');
 }finally{await browser.close();await server.close();}
}
run().catch(e=>{console.error(e);process.exitCode=1});
