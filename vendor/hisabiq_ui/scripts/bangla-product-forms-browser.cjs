/* Phase 15: Product Settings and Add/Edit in three UI languages, phones and desktops. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
async function main(){
 const {createServer}=await import('vite');
 const server=await createServer({server:{host:'127.0.0.1',port:4400,strictPort:true}});
 await server.listen();
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
 try{
  for(const language of ['English','English + Bangla','Bangla']){
   for(const width of [390,1440]){
    const context=await browser.newContext({viewport:{width,height:width===390?844:900},hasTouch:width===390,reducedMotion:'reduce'});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.addInitScript(lang=>localStorage.setItem('hisabiq-erp-personal-v1',JSON.stringify({
     mode:'Simple',language:lang,density:'Compact',terminology:'simple',dateView:'transaction'
    })),language);
    const bn=language==='Bangla';
    await page.goto('http://127.0.0.1:4400/#/app/products');
    await page.getByRole('button',{name:bn?'নতুন পণ্য':'Add product',exact:true}).click();
    const dialog=page.locator('[data-product-editor]');
    await dialog.waitFor();
    await dialog.locator('#pf-sell').waitFor();
    const kind=dialog.getByRole('radio',{name:bn?/পণ্য/:/Product/}).first();
    assert.equal(await kind.getAttribute('aria-checked'),'true','ProductKind remains Stock');
    await dialog.locator('#pf-other-button').click();
    const serial=dialog.getByRole('radio',{name:bn?'আবশ্যক':'Required',exact:true});await serial.click();
    assert.equal(await serial.getAttribute('aria-checked'),'true');
    await dialog.getByRole('button',{name:bn?'বাতিল':'Cancel',exact:true}).click();
    const discard=page.getByRole('button',{name:bn?'বাদ দিন':'Discard',exact:true});await discard.click();
    await dialog.waitFor({state:'hidden'});
    const nav=page.getByRole('tab',{name:bn?/পণ্যের সেটিংস/:/Product settings/});
    await nav.click();
    const units=page.getByRole('tab',{name:bn?'এককসমূহ':'Units',exact:true});
    await units.click();
    await page.getByText(bn?'এককের নাম':'Unit name',{exact:true}).waitFor();
    await page.getByRole('tab',{name:bn?'ব্র্যান্ডসমূহ':'Brands',exact:true}).click();
    await page.getByText(bn?'ব্র্যান্ডের নাম':'Brand name',{exact:true}).waitFor();
    await page.getByRole('tab',{name:bn?'সাধারণ সেটিংস':'Defaults',exact:true}).click();
    await page.getByText(bn?'ব্যবসার পণ্যের সাধারণ সেটিংস':'Business product defaults',{exact:true}).waitFor();
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no page overflow');
    assert.deepEqual(errors,[],language+' '+width+'px browser errors');
    await context.close();
    console.log('Product Forms Phase 15 '+language+' @ '+width+'px passed');
   }
  }
 }finally{await browser.close();await server.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
