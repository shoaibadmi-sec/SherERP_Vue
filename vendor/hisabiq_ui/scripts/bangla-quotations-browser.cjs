/* Phase 10 quotation/print copy. Does not submit sales, money, stock or ledger records. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
async function main(){
 const {createServer}=await import('vite');
 const server=await createServer({server:{host:'127.0.0.1',port:4395,strictPort:true}});
 await server.listen();
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
 try{
  for(const language of ['English','English + Bangla','Bangla']){
   for(const width of [390,1440]){
    const context=await browser.newContext({viewport:{width,height:width===390?844:900},hasTouch:width===390,reducedMotion:'reduce'});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.addInitScript(lang=>localStorage.setItem('hisabiq-erp-personal-v1',JSON.stringify({
      mode:'Simple',language:lang,density:'Compact',terminology:'simple',dateView:'transaction'
    })),language);
    const bn=language==='Bangla';
    await page.goto('http://127.0.0.1:4395/#/app/quotations');
    await page.getByRole('heading',{name:bn?'মূল্য প্রস্তাব':'Quotations',exact:true}).waitFor();
    await page.getByRole('button',{name:bn?'নতুন কোটেশন':'New quotation'}).waitFor();
    const filter=page.getByRole('button',{name:bn?'খসড়া':'Draft',exact:true});
    await filter.click();
    await page.getByRole('button',{name:'QT-000042',exact:true}).waitFor();
    await page.getByRole('button',{name:bn?'সব':'All',exact:true}).click();
    await page.getByRole('button',{name:'QT-000041',exact:true}).click();
    const detail=page.getByRole('dialog',{name:'Quotation QT-000041'});
    await detail.waitFor();
    const print=detail.locator('#quotation-print');
    await print.waitFor();
    await print.getByText('QT-000041',{exact:true}).first().waitFor();
    await print.getByText('Rahman Hardware',{exact:true}).waitFor();
    const printText=await print.innerText();
    assert.match(printText,bn?/শুধু কোটেশন। স্টক বা টাকার হিসাবে কোনো পরিবর্তন হয়নি।/:/Quotation only. No stock reservation or financial posting./);
    assert.match(printText,bn?/পণ্য/:/Product/);
    assert.match(printText,bn?/মোট/:/Total/);
    assert.match(printText,/3,100/);
    await detail.getByRole('button',{name:bn?'প্রিন্ট':'Print',exact:true}).waitFor();
    await page.keyboard.press('Escape');
    await detail.waitFor({state:'hidden'});
    await page.getByRole('button',{name:bn?'নতুন কোটেশন':'New quotation'}).click();
    const editor=page.getByRole('dialog',{name:bn?'নতুন কোটেশন':'New quotation'});
    await editor.waitFor();
    await editor.getByText(bn?'কোটেশন দিলে স্টক কমবে না, টাকা জমা হবে না, পার্টির হিসাবে এন্ট্রি হবে না।':'Prices only: quotations do not reserve stock, collect money or post to the Party ledger.').waitFor();
    await editor.getByRole('button',{name:bn?'বাতিল':'Cancel',exact:true}).click();
    await editor.waitFor({state:'hidden'});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no page overflow');
    assert.deepEqual(errors,[],language+' '+width+'px browser errors');
    await context.close();
    console.log('Quotation language + print Phase 10 '+language+' @ '+width+'px passed');
   }
  }
 }finally{await browser.close();await server.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
