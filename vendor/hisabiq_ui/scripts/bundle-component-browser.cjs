/* Reuse POS dialogs for bundle components on phone and tablet. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
async function run(){
 const {createServer}=await import('vite');
 const server=await createServer({server:{host:'127.0.0.1',port:4494,strictPort:true}});
 await server.listen();
 const browser=await chromium.launch({args:['--no-sandbox']});
 try{
  for(const viewport of [{width:390,height:844},{width:1024,height:768}]){
   const page=await browser.newPage({viewport,reducedMotion:'reduce'});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:4494/#/app/pos');
   const suffix=String(viewport.width);
   await page.evaluate(async suffix=>{
    const s=await import('/src/data/productImportPreviewStore.ts');
    const v=await import('/src/bundles/bundleValidation.ts');
    const ps=s.getProductImportPreviewSnapshot().products;
    for(const [key,contents] of [
      ['SHORT',[['p12','2'],['p1','1']]],
      ['SERIAL',[['p7','1'],['p1','1']]]
    ]){
      const sku='PKG-'+key+'-'+suffix,components=contents.map(([id,qty],i)=>{
        const item=ps.find(p=>p.id===id);
        return v.makeBundleComponent(item,item.unit,qty,'',i);
      });
      s.upsertBundlePreview({product:{id:'bundle-'+key+'-'+suffix,kind:'Bundle',
       name:key==='SHORT'?'Supply Package':'Serial Package',sku,category:'Hardware',unit:'Set',
       stock:0,minStock:0,purchasePrice:0,sellPrice:1000,active:true},components},null);
    }
   },suffix);
   const search=page.getByRole('combobox',{name:/Add product/i}).first();
   await search.fill('PKG-SHORT-'+suffix);await search.press('ArrowDown');await search.press('Enter');
   const short=page.getByTestId('pos-cart-row').filter({hasText:'Supply Package'});
   await short.waitFor();
   await short.getByText('View included products').click();
   const source=short.getByRole('button',{name:/Choose source for Wood Screw/i});
   await source.click();
   const shortage=page.getByRole('dialog',{name:'Stock shortage'});
   await shortage.waitFor();
   await shortage.getByRole('radio',{name:/Negative Sale/}).click();
   await shortage.getByRole('button',{name:'Allow negative sale'}).click();
   await shortage.waitFor({state:'hidden'});
   await short.getByText(/Negative Sale/).waitFor();
   // Verify the existing Vendor dropdown and nested Quick Add modal inside the component shortage dialog.
   await source.click();
   await shortage.waitFor();
   await shortage.getByRole('radio',{name:/Vendor/}).click();
   await shortage.getByRole('button',{name:'Quick add vendor'}).click();
   const nested=page.getByRole('dialog',{name:'Quick add Vendor'});
   await nested.waitFor();
   await nested.getByRole('textbox',{name:'New Vendor name'}).fill('Bundle Supplier '+suffix);
   await nested.getByRole('button',{name:'Add & select Vendor'}).click();
   await nested.waitFor({state:'hidden'});
   const vendorSelect=shortage.getByRole('combobox',{name:'Vendor'});
   await vendorSelect.click();
   const vendorOptions=page.locator('[role="listbox"][aria-label="Vendor options"]');
   await vendorOptions.waitFor();
   await vendorOptions.getByRole('option',{name:'Bundle Supplier '+suffix}).click();
   await shortage.getByRole('button',{name:'Use vendor'}).click();
   await shortage.waitFor({state:'hidden'});
   await short.getByText(/Price pending/).waitFor();

   // Changing the requested Set quantity must invalidate the previous choice.
   const qty=short.getByRole('textbox',{name:/Quantity for Supply Package/i});
   await qty.fill('2');
   await short.getByRole('button',{name:/Choose source for Wood Screw/i}).waitFor();
   await qty.fill('1');
   await source.click();
   await shortage.waitFor();
   await shortage.getByRole('radio',{name:/Own Stock/}).click();
   await shortage.getByRole('button',{name:'Use own stock'}).click();
   await short.waitFor({state:'hidden'}); // There is no own stock for this bundle component.
   await search.fill('PKG-SERIAL-'+suffix);await search.press('ArrowDown');await search.press('Enter');
   const serial=page.getByTestId('pos-cart-row').filter({hasText:'Serial Package'});
   await serial.waitFor();
   await serial.getByText('View included products').click();
   const serialButton=serial.getByRole('button',{name:/Serial numbers for Gate Valve/i});
   await serialButton.click();
   const pick=page.getByRole('dialog').filter({hasText:'Eligible serials'}).last();
   await pick.waitFor();
   await pick.getByRole('button',{name:/GV34-1001/}).click();
   await pick.getByRole('button',{name:'Use serials'}).click();
   await pick.waitFor({state:'hidden'});
   await serial.getByText(/Serials 1\/1/).waitFor();
   await page.getByRole('button',{name:/Remaining|বাকি/}).last().click();
   const before=await page.evaluate(async()=>JSON.stringify((await import('/src/data/productImportPreviewStore.ts')).getProductImportPreviewSnapshot().lots));
   await page.getByRole('button',{name:/Preview sale/}).click();
   const review=page.getByRole('dialog',{name:'Review sale'});await review.waitFor();
   await review.getByRole('button',{name:'Confirm sale preview'}).click();
   await page.getByRole('dialog',{name:/Sale preview/}).waitFor();
   const after=await page.evaluate(async()=>JSON.stringify((await import('/src/data/productImportPreviewStore.ts')).getProductImportPreviewSnapshot().lots));
   assert.equal(after,before,'preview must not mutate physical stock or serials');
   assert.deepEqual(errors,[]);
   await page.close();
  }
  console.log('Component shortage and serial lot dialogs: phone + tablet passed');
 }finally{await browser.close();await server.close();}
}
run().catch(e=>{console.error(e);process.exitCode=1});
