/* Phase 5: English, mixed and Bangla finance/reconciliation UI at phone and desktop widths. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
async function main(){
 const {createServer}=await import('vite');
 const server=await createServer({server:{host:'127.0.0.1',port:4390,strictPort:true}});
 await server.listen();
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
 try {
  for(const language of ['English','English + Bangla','Bangla']){
   for(const width of [390,1440]){
    const ctx=await browser.newContext({viewport:{width,height:width===390?844:900},reducedMotion:'reduce'});
    const page=await ctx.newPage(),errors=[];
    page.on('pageerror',err=>errors.push(err.message));
    await page.addInitScript(lang=>localStorage.setItem('hisabiq-erp-personal-v1',JSON.stringify({
       mode:'Simple',language:lang,density:'Compact',terminology:'simple',dateView:'transaction'
    })),language);
    const bn=language==='Bangla';
    await page.goto('http://127.0.0.1:4390/#/app/finance');
    await page.getByRole('heading',{name:bn?'টাকা-পয়সা':'Finance',exact:true}).waitFor();
    await page.getByText(bn?'ঋণদাতাকে দেনা':'Lender payable',{exact:true}).first().waitFor();
    await page.getByRole('button',{name:bn?'নতুন লেনদেন':'New transaction',exact:true}).click();
    const dialog=page.getByRole('dialog').first();
    await dialog.waitFor();
    assert.match(await dialog.innerText(),bn?/শুরুর জের দিলে ক্যাশ/:/Opening balances never move cash/);
    await page.goto('http://127.0.0.1:4390/#/app/reconciliation');
    await page.getByRole('heading',{name:bn?'হিসাব মিলানো':'Account reconciliation',exact:true}).waitFor();
    await page.getByText(bn?'স্টেটমেন্টের শেষ জের':'Statement closing',{exact:true}).first().waitFor();
    assert.deepEqual(errors,[],language+' '+width+'px runtime errors');
    await ctx.close();
    console.log('Phase 5 '+language+' '+width+'px passed');
   }
  }
 }finally{await browser.close();await server.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
