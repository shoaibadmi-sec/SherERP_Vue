/* Phase 2: English, mixed and Bangla workflows without posting preview transactions. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');

async function main(){
 const {createServer}=await import('vite');
 const server=await createServer({server:{host:'127.0.0.1',port:4387,strictPort:true}});
 await server.listen();
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
 try {
  for (const language of ['English','English + Bangla','Bangla']) {
   const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
   const page=await context.newPage(),errors=[];
   page.on('pageerror',err=>errors.push(err.message));
   await page.addInitScript(lang=>localStorage.setItem('hisabiq-erp-personal-v1',JSON.stringify({
    mode:'Simple',language:lang,density:'Compact',terminology:'simple',dateView:'transaction'
   })),language);
   const bn=language==='Bangla';
   await page.goto('http://127.0.0.1:4387/#/app/sales');
   await page.getByRole('heading',{name:bn?'বিক্রয়':'Sales',exact:true}).waitFor();
   assert.ok(await page.getByRole('columnheader',{name:bn?'বিল':'Invoice',exact:true}).count()>0);
   await page.goto('http://127.0.0.1:4387/#/app/purchases');
   await page.getByRole('heading',{name:bn?'ক্রয়':'Purchases',exact:true}).waitFor();
   assert.ok(await page.getByRole('columnheader',{name:bn?'দেনা':'Due',exact:true}).count()>0);
   await page.goto('http://127.0.0.1:4387/#/app/expenses');
   await page.getByRole('heading',{name:bn?'খরচ':'Expenses',exact:true}).waitFor();
   await page.getByRole('button',{name:bn?'খরচ যোগ করুন':'Add expense',exact:true}).click();
   const dialog=page.getByRole('dialog',{name:bn?'খরচ যোগ করুন':'Add expense'});
   await dialog.waitFor();
   assert.equal(await dialog.locator('input[aria-label="'+(bn?'খরচের টাকা':'Expense amount')+'"]').count(),1);
   assert.match(await dialog.innerText(),bn?/শুধু প্রিভিউ/:/UI preview/);
   await page.goto('http://127.0.0.1:4387/#/app/counter');
   const summary=page.getByRole('heading',{name:bn?'লেনদেনের সারাংশ':'Transaction summary'});
   await summary.waitFor();
   assert.deepEqual(errors,[],language+' errors');
   await context.close();
   console.log('Phase 2 translations '+language+' passed');
  }
 } finally {
  await browser.close();await server.close();
 }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
