/* Phase 10: vendor statement labels and printable balance are localized without mutating ledger or CSV values. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');

async function main(){
 const {createServer}=await import('vite');
 const server=await createServer({server:{host:'127.0.0.1',port:4386,strictPort:true}});
 await server.listen();
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
 try{
  for(const language of ['English','English + Bangla','Bangla']){
   for(const width of [390,1440]){
    const context=await browser.newContext({viewport:{width,height:width===390?840:900},hasTouch:width===390,reducedMotion:'reduce',acceptDownloads:true});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.addInitScript(lang=>localStorage.setItem('hisabiq-erp-personal-v1',JSON.stringify({
      mode:'Simple',language:lang,density:'Compact',terminology:'simple',dateView:'transaction',searchMode:'Default'
    })),language);
    const bn=language==='Bangla';
    await page.goto('http://127.0.0.1:4386/#/app/vendors?partyId=v1&tab=taken');
    const vendor=page.getByRole('region',{name:'Selected Vendor work'});
    await vendor.waitFor();
    await vendor.getByRole('tab',{name:bn?/হিসাব/:/Ledger/}).click();
    // Mobile Vendor actions are grouped behind More, using desktop action names.
    if(width<640){
      await vendor.getByRole('button',{name:'More Vendor actions'}).click();
      await page.getByRole('dialog',{name:'More Vendor actions'}).getByRole('button',{name:'Print Ledger'}).click();
    }else{
      await vendor.getByRole('button',{name:'Print Ledger'}).click();
    }
    const dialog=page.getByRole('dialog',{name:bn?'ভেন্ডরের হিসাবের বিবরণ':'Vendor ledger statement'});
    await dialog.waitFor();
    await dialog.getByText(bn?'শুধু নমুনা — আসল হিসাব নয়। দেনা ও পাওনা আলাদা দেখানো হয়।':'Demo preview — not accounting records. Payable and receivable are always separate.').waitFor();
    assert.equal(await dialog.getByRole('columnheader',{name:bn?'চলতি জের':'Running'}).count(),1);
    assert.equal(await dialog.getByRole('columnheader',{name:bn?'বেড়েছে':'Increase'}).count(),1);
    const payable=dialog.getByRole('tab',{name:bn?'ভেন্ডরকে দিতে হবে':'You owe Vendor'});
    const receivable=dialog.getByRole('tab',{name:bn?'ভেন্ডরের কাছে পাবেন':'Vendor owes you'});
    assert.equal(await payable.getAttribute('aria-selected'),'true');
    await receivable.click();
    assert.equal(await receivable.getAttribute('aria-selected'),'true');
    await dialog.getByText(bn?'দেওয়া পণ্যের পাওনা':'Given products receivable').waitFor();
    await payable.click();
    await dialog.getByText(bn?'নেওয়া পণ্যের দেনা':'Taken products payable').waitFor();
    const download=page.waitForEvent('download');
    await dialog.getByRole('button',{name:bn?'CSV নামান':'Export CSV'}).click();
    const downloaded=await download;
    assert.match(downloaded.suggestedFilename(),/^vendor-ledger-v1-payable\.csv$/);
    await dialog.getByRole('button',{name:bn?'বন্ধ করুন':'Close',exact:true}).first().click();
    await dialog.waitFor({state:'hidden'});
    assert.deepEqual(errors,[],language+' '+width+'px runtime errors');
    await context.close();
    console.log('Phase 10 Vendor statement '+language+' @ '+width+'px passed');
   }
  }
 }finally{await browser.close();await server.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
