/* Phase 14 — Product list/filters/columns/actions, English/Bilingual/Bangla, no source mutation. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
async function main(){
 const {createServer}=await import('vite');
 const server=await createServer({server:{host:'127.0.0.1',port:4399,strictPort:true}});
 await server.listen();
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
 try{
  for(const language of ['English','English + Bangla','Bangla']){
   for(const width of [390,1440]){
    const context=await browser.newContext({viewport:{width,height:width===390?844:900},hasTouch:width===390,acceptDownloads:true,reducedMotion:'reduce'});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.addInitScript(lang=>localStorage.setItem('hisabiq-erp-personal-v1',JSON.stringify({
     mode:'Simple',language:lang,density:'Compact',terminology:'simple',dateView:'transaction'
    })),language);
    const bn=language==='Bangla';
    await page.goto('http://127.0.0.1:4399/#/app/products');
    await page.getByRole('heading',{name:bn?'পণ্য তালিকা':'Products',exact:true}).waitFor();
    await page.getByRole('button',{name:bn?'নতুন পণ্য':'Add product',exact:true}).waitFor();
    await page.getByRole('tab',{name:new RegExp(bn?'পণ্য তালিকা':'Product list')}).waitFor();
    assert.equal(await page.getByRole('columnheader',{name:bn?'স্টকের দাম':'Stock value'}).count(),1);
    assert.equal(await page.getByRole('columnheader',{name:bn?'বিক্রির দাম':'Selling'}).count(),1);
    const rows=page.locator('tbody tr');
    const total=await rows.count();
    assert.ok(total>0,'seed product list is populated');
    const columns=page.getByRole('button',{name:bn?'কলাম':'Columns',exact:true});
    await columns.click();
    const stockColumn=page.getByRole('menuitemcheckbox',{name:bn?'স্টকের দাম':'Stock value'});
    assert.equal(await stockColumn.getAttribute('aria-checked'),'true');
    await stockColumn.click();
    assert.equal(await page.getByRole('columnheader',{name:bn?'স্টকের দাম':'Stock value'}).count(),0);
    // The shared column picker stays open after toggling a checkbox.
    const stockRestore=page.getByRole('menuitemcheckbox',{name:bn?'স্টকের দাম':'Stock value'});
    await stockRestore.click();
    await page.keyboard.press('Escape');
    assert.equal(await page.getByRole('columnheader',{name:bn?'স্টকের দাম':'Stock value'}).count(),1);
    const low=page.getByRole('radio',{name:new RegExp('^'+(bn?'কম':'Low')+' \\(')});
    await low.click();
    assert.equal(await low.getAttribute('aria-checked'),'true');
    const filtered=await rows.count();
    assert.ok(filtered<=total,'low-stock filter limits list');
    const all=page.getByRole('radio',{name:bn?'সব স্টক':'All stock',exact:true});
    await all.click();
    assert.equal(await rows.count(),total,'All stock restores unfiltered product count');
    const search=page.getByRole('textbox',{name:bn?'পণ্য খুঁজুন':'Search products'});
    await search.fill('NOT-A-REAL-PRODUCT-5298');
    await page.getByText(bn?'কোনো পণ্য মেলেনি':'No products match',{exact:true}).waitFor();
    await page.getByRole('button',{name:bn?'ফিল্টার মুছুন':'Clear filters'}).click();
    assert.equal(await search.inputValue(),'');
    assert.equal(await rows.count(),total);
    const action=page.getByRole('button',{name:new RegExp(bn?'পণ্যের কাজ:':'Actions for')}).first();
    await action.click();
    await page.getByText(bn?'বিস্তারিত দেখুন':'View details',{exact:true}).click();
    const details=page.locator('[data-slot="dialog-content"]').last();
    await details.waitFor();
    await page.keyboard.press('Escape');
    await details.waitFor({state:'hidden'});
    const download=page.waitForEvent('download');
    await page.getByRole('button',{name:bn?'ডাউনলোড করুন':'Export',exact:true}).click();
    const csv=await download;
    assert.equal(csv.suggestedFilename(),'hisabiq-products.csv');
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no horizontal overflow');
    assert.deepEqual(errors,[],language+' '+width+'px errors');
    await context.close();
    console.log('Phase 14 Products '+language+' @ '+width+'px passed');
   }
  }
 }finally{await browser.close();await server.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
