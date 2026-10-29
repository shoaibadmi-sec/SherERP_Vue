/* Products Phase 16: stock lots, movement history, detail and adjustment in 3 languages. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
async function main(){
 const {createServer}=await import('vite');
 const server=await createServer({server:{host:'127.0.0.1',port:4401,strictPort:true}});
 await server.listen();
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
 try{
  for(const language of ['English','English + Bangla','Bangla']){
   for(const width of [390,1440]){
    const ctx=await browser.newContext({viewport:{width,height:width===390?844:920},hasTouch:width===390,reducedMotion:'reduce'});
    const page=await ctx.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.addInitScript(lang=>localStorage.setItem('hisabiq-erp-personal-v1',JSON.stringify({
      mode:'Simple',language:lang,density:'Compact',terminology:'simple',dateView:'transaction'
    })),language);
    const bn=language==='Bangla';
    await page.goto('http://127.0.0.1:4401/#/app/products?view=lots');
    await page.getByRole('columnheader',{name:bn?'স্টকের উৎস / লট':'Source / lot',exact:true}).waitFor();
    await page.getByRole('columnheader',{name:bn?'এককের কেনা দাম':'Unit cost',exact:true}).waitFor();
    const filter=page.getByRole('combobox',{name:bn?'পণ্য দিয়ে স্টক খুঁজুন':'Filter inventory by product'});
    assert.equal(await filter.getAttribute('data-value'),'','All products source value is empty');
    await page.goto('http://127.0.0.1:4401/#/app/products?view=history');
    await page.getByRole('columnheader',{name:bn?'লেনদেনের ধরন':'Movement',exact:true}).waitFor();
    await page.getByRole('columnheader',{name:bn?'অবশিষ্ট':'Balance',exact:true}).waitFor();
    await page.goto('http://127.0.0.1:4401/#/app/products');
    const act=page.getByRole('button',{name:new RegExp(bn?'পণ্যের কাজ:':'Actions for')}).first();
    await act.click();
    await page.getByRole('button',{name:bn?'স্টক ঠিক করুন':'Adjust stock',exact:true}).click();
    const dialog=page.locator('[data-slot="dialog-content"]').last();
    await dialog.waitFor();
    await dialog.getByRole('button',{name:bn?'স্টক কমান':'Remove stock',exact:true}).click();
    await dialog.getByRole('button',{name:bn?'বাতিল':'Cancel',exact:true}).click();
    await dialog.waitFor({state:'hidden'});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'screen no horizontal document overflow');
    assert.deepEqual(errors,[],language+' '+width+'px errors');
    await ctx.close();
    console.log('Phase 16 inventory '+language+' @ '+width+'px passed');
   }
  }
 }finally{await browser.close();await server.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
