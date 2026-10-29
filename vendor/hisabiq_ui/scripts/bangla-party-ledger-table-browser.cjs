/* Phase 26: source-safe Party ledger table and row actions across languages and devices. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
async function main(){
 const {createServer}=await import('vite');
 const server=await createServer({server:{host:'127.0.0.1',port:4412,strictPort:true}});
 await server.listen();
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
 try{
  for(const language of ['English','English + Bangla','Bangla']){
   const bn=language==='Bangla',label=(en,bd)=>bn?bd:en;
   for(const width of [390,768,1440]){
    const context=await browser.newContext({viewport:{width,height:width===390?844:900},hasTouch:width===390,reducedMotion:'reduce'});
    const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.addInitScript(lang=>localStorage.setItem('hisabiq-erp-personal-v1',JSON.stringify({
     mode:'Simple',language:lang,density:'Compact',terminology:'simple',dateView:'transaction'
    })),language);
    await page.goto('http://127.0.0.1:4412/#/app/parties?id=c1&role=Customer');
    await page.getByRole('button',{name:label('Party ledger date range','পক্ষের খাতার তারিখ')}).waitFor();
    await page.getByText(label('Closing balance','শেষ জের'),{exact:true}).last().waitFor();
    assert.ok(await page.getByText(label('Invoice','বিক্রির বিল'),{exact:true}).count()>0,'Source label missing');
    assert.ok(await page.getByText(label('Debit','ডেবিট'),{exact:true}).count()>0,'Money column missing');
    assert.ok(await page.getByText(label('Credit','ক্রেডিট'),{exact:true}).count()>0,'Money column missing');
    const menu=page.getByRole('button',{name:label('Actions for','কাজ')+' INV-000241'});
    await menu.click();
    await page.getByRole('button',{name:label('View','দেখুন'),exact:true}).click();
    const details=page.getByRole('dialog',{name:label('Party transaction details','পার্টির লেনদেনের তথ্য')});
    await details.waitFor();
    await details.getByRole('button',{name:label('Close','বন্ধ করুন'),exact:true}).first().click();
    await details.waitFor({state:'hidden'});
    assert.deepEqual(errors,[],language+' @ '+width+'px');
    console.log('Phase 26 Party ledger '+language+' @ '+width+'px passed');
    await context.close();
   }
  }
 }finally{await browser.close();await server.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
