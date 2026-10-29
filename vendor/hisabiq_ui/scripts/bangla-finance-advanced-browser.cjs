/* Phase 6: cheque, cash and advanced finance dialogs; no actual ledger postings. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
async function main(){
 const {createServer}=await import('vite');
 const server=await createServer({server:{host:'127.0.0.1',port:4391,strictPort:true}});
 await server.listen();
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
 try{
  for(const language of ['English','English + Bangla','Bangla']){
   for(const width of [390,1440]){
    const ctx=await browser.newContext({viewport:{width,height:width===390?844:900},reducedMotion:'reduce'});
    const page=await ctx.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.addInitScript(lang=>localStorage.setItem('hisabiq-erp-personal-v1',JSON.stringify({
      mode:'Simple',language:lang,density:'Compact',terminology:'simple',dateView:'transaction'
    })),language);
    const bn=language==='Bangla';
    await page.goto('http://127.0.0.1:4391/#/app/finance');
    await page.getByRole('heading',{name:bn?'টাকা-পয়সা':'Finance',exact:true}).waitFor();
    await page.getByRole('button',{name:bn?'নতুন চেক':'New cheque',exact:true}).click();
    const dialog=page.getByRole('dialog').first();
    await dialog.waitFor();
    assert.match(await dialog.innerText(),bn?/ক্লিয়ার হলেই ব্যাংকের জের/:/Bank balance changes only after the cheque clears/);
    await dialog.getByRole('button',{name:bn?'বাতিল':'Cancel',exact:true}).click();
    await page.getByRole('tab',{name:bn?'চেক':'Cheques',exact:true}).click();
    await page.locator('p').filter({hasText:bn?'চেকের তালিকা':'Cheque register'}).first().waitFor();
    await page.getByRole('button',{name:'Actions for CHQ-000031'}).click();
    await page.getByText(bn?'চেকের পরের কাজ':'Next cheque action',{exact:true}).waitFor();
    await page.getByRole('dialog').getByRole('button',{name:bn?'বন্ধ করুন':'Close',exact:true}).first().click();
    await page.getByRole('tab',{name:bn?'ক্যাশ সেশন':'Cash Sessions',exact:true}).click();
    await page.getByText(bn?'ক্যাশ সেশনের ইতিহাস':'Cash session history',{exact:true}).waitFor();
    assert.deepEqual(errors,[],language+' '+width+'px errors');
    await ctx.close();
    console.log('Phase 6 '+language+' '+width+'px passed');
   }
  }
 }finally{await browser.close();await server.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
