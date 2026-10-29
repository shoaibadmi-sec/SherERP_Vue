/* Phase 25 importer issues remain source-safe and localize only UI feedback. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
async function main(){
 const {createServer}=await import('vite');
 const server=await createServer({server:{host:'127.0.0.1',port:4411,strictPort:true}});
 await server.listen();
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
 try {
  for(const language of ['English','English + Bangla','Bangla']){
   const t=(english,bangla)=>language==='Bangla'?bangla:english;
   for(const width of [390,1440]){
    const context=await browser.newContext({viewport:{width,height:width===390?844:900},hasTouch:width===390,reducedMotion:'reduce'});
    const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.addInitScript(lang=>localStorage.setItem('hisabiq-erp-personal-v1',JSON.stringify({
      mode:'Simple',language:lang,density:'Compact',terminology:'simple',dateView:'transaction'
    })),language);
    await page.goto('http://127.0.0.1:4411/#/app/products');
    await page.getByRole('button',{name:t('Import','ফাইল থেকে আনুন'),exact:true}).click();
    const dlg=page.getByRole('dialog',{name:t('Import products','পণ্য আনুন')});
    const file=dlg.getByLabel(t('Select Excel or CSV file','Excel বা CSV ফাইল বাছুন'));
    await file.setInputFiles({name:'unsupported.txt',mimeType:'text/plain',buffer:Buffer.from('hello')});
    await dlg.getByRole('alert').filter({hasText:t(
      'Only .xlsx and .csv are supported; .xls and .xlsm are not supported.',
      'শুধু .xlsx ও .csv ফাইল নেওয়া যাবে; .xls বা .xlsm নয়।'
    )}).waitFor();
    await file.setInputFiles({
      name:'bad-products.csv',mimeType:'text/csv',
      buffer:Buffer.from('Product Name,SKU,Base Unit,Selling Price\n,TEST-P25-'+width+',Pcs,12\n')
    });
    await dlg.getByRole('button',{name:t('Next: Map columns','পরের ধাপ: কলাম মেলান')}).click();
    await dlg.getByRole('button',{name:t('Next: Review','পরের ধাপ: যাচাই')}).click();
    await dlg.getByRole('alert').filter({hasText:t('Product Name is required.','পণ্যের নাম লিখুন।')}).waitFor();
    assert.equal(await dlg.getByRole('button',{name:t('Confirm import','আনা নিশ্চিত করুন')}).isDisabled(),true);
    assert.deepEqual(errors,[],language+' '+width+'px browser errors');
    console.log('Phase 25 safe validation display '+language+' @ '+width+'px passed');
    await context.close();
   }
  }
 } finally {await browser.close();await server.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
