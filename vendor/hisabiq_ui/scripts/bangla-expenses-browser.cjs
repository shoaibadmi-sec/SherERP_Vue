/* Phase 19: Expense list, category/payee management and CSV language coverage. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');

async function main(){
 const {createServer}=await import('vite');
 const server=await createServer({server:{host:'127.0.0.1',port:4404,strictPort:true}});
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
    await page.goto('http://127.0.0.1:4404/#/app/expenses');
    await page.getByText(bn?'চালু খরচ':'Active expenses',{exact:true}).waitFor();
    await page.getByText(bn?'ব্যাংক ও মোবাইল':'Bank & mobile',{exact:true}).waitFor();
    const categories=page.getByRole('tab',{name:bn?'খরচের ধরন':'Categories',exact:true});
    await categories.click();
    await page.getByText(bn?'খরচের ধরনসমূহ':'Expense categories',{exact:true}).waitFor();
    await page.getByRole('columnheader',{name:bn?'বিবরণ':'Description',exact:true}).waitFor();
    await page.getByRole('columnheader',{name:bn?'চালু খরচের মোট':'Active total',exact:true}).waitFor();
    await page.getByRole('button',{name:bn?'ধরন যোগ করুন':'Add category',exact:true}).click();
    const editor=page.getByRole('dialog',{name:bn?'খরচের ধরন বদলান':'Expense category editor'});
    await editor.waitFor();
    await editor.getByRole('button',{name:bn?'বাতিল':'Cancel',exact:true}).click();
    await editor.waitFor({state:'hidden'});
    await page.getByRole('tab',{name:bn?'টাকা প্রাপক':'Payees',exact:true}).click();
    await page.getByText(bn?'টাকা প্রাপকদের তালিকা':'Expense payees',{exact:true}).waitFor();
    await page.getByRole('columnheader',{name:bn?'শেষ ব্যবহার':'Last used',exact:true}).waitFor();
    await page.getByRole('columnheader',{name:bn?'মোট দেওয়া':'Total paid',exact:true}).waitFor();
    await page.getByRole('tab',{name:bn?'খরচের তালিকা':'Expense list'}).click();
    const filter=page.getByRole('combobox',{name:bn?'খরচের ধরন বাছুন':'Expense category filter'});
    await filter.waitFor();
    assert.equal(await filter.getAttribute('data-value'),'All categories','category filter machine value');
    await page.getByRole('combobox',{name:bn?'খরচের অবস্থা বাছুন':'Expense status filter'}).waitFor();
    const actions=page.getByRole('button',{name:new RegExp(bn?'কাজের তালিকা:':'Actions for')});
    assert.ok(await actions.count()>0,'existing expense actions remain available');
    await actions.first().click();
    await page.getByRole('button',{name:bn?'সংশোধন':'Correct',exact:true}).waitFor();
    await page.keyboard.press('Escape');
    const dl=page.waitForEvent('download');
    await page.getByRole('button',{name:bn?'ডাউনলোড':'Export',exact:true}).click();
    assert.equal((await dl).suggestedFilename(),'hisabiq-expenses.csv');
    assert.deepEqual(errors,[],language+' '+width+'px page errors');
    await context.close();
    console.log('Phase 19 expenses '+language+' @ '+width+'px passed');
   }
  }
 }finally{await browser.close();await server.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
