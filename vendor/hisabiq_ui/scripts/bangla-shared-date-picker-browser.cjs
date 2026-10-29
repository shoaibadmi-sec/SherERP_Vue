/* Phase 27: shared range calendar, preset keys, keyboard focus and single-date entry. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
async function main(){
 const {createServer}=await import('vite');
 const server=await createServer({server:{host:'127.0.0.1',port:4413,strictPort:true}});
 await server.listen();
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
 try {
  for(const language of ['English','English + Bangla','Bangla']){
   const bn=language==='Bangla',label=(en,bd)=>bn?bd:en;
   for(const width of [390,768,1440]){
    const context=await browser.newContext({viewport:{width,height:width===390?844:900},hasTouch:width===390,reducedMotion:'reduce'});
    const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.addInitScript(lang=>localStorage.setItem('hisabiq-erp-personal-v1',JSON.stringify({
     mode:'Simple',language:lang,density:'Compact',terminology:'simple',dateView:'transaction'
    })),language);
    await page.goto('http://127.0.0.1:4413/#/app/parties?id=c1&role=Customer');
    const picker=page.getByRole('button',{name:label('Party ledger date range','পক্ষের খাতার তারিখ')});
    await picker.click();
    const calendar=page.getByRole('dialog',{name:label('Party ledger date range calendar','পক্ষের খাতার তারিখ ক্যালেন্ডার')});
    await calendar.getByText(label('Select date range','তারিখের সময় বাছুন'),{exact:true}).waitFor();
    await calendar.getByRole('button',{name:label('Previous month','আগের মাস')}).waitFor();
    await calendar.getByRole('button',{name:label('Next month','পরের মাস')}).waitFor();
    await calendar.getByRole('button',{name:label('Today','আজ'),exact:true}).click();
    await calendar.getByRole('button',{name:label('Apply','প্রয়োগ করুন')}).click();
    await calendar.waitFor({state:'hidden'});
    const triggerText=await picker.innerText();
    assert.ok(!triggerText.includes('All dates')&&!triggerText.includes('সব তারিখ'));
    if(bn)assert.match(triggerText,/[০-৯]/,'Bangla mode should show localized calendar date digits');
    await picker.click();
    await calendar.getByRole('button',{name:label('Last month','গত মাস'),exact:true}).click();
    await calendar.getByRole('button',{name:label('Cancel','বাতিল')}).click();
    await calendar.waitFor({state:'hidden'});
    assert.equal(await picker.innerText(),triggerText,'Cancel must not commit a date change');
    await picker.click();
    await page.keyboard.press('Escape');
    await calendar.waitFor({state:'hidden'});
    await page.getByRole('button',{name:label('Edit opening balance','শুরুর জের বদলান')}).click();
    const opening=page.getByRole('dialog',{name:label('Party opening balance','পার্টির শুরুর জের')});
    await opening.getByRole('button',{name:label('Opening balance date','শুরুর জেরের তারিখ')}).click();
    const single=page.getByRole('dialog',{name:label('Opening balance date calendar','শুরুর জেরের তারিখ ক্যালেন্ডার')});
    await single.getByText(label('Select date','তারিখ বাছুন'),{exact:true}).waitFor();
    await single.getByRole('button',{name:label('Cancel','বাতিল')}).click();
    await opening.getByRole('button',{name:label('Cancel','বাতিল')}).click();
    assert.deepEqual(errors,[],language+' @ '+width);
    console.log('Phase 27 shared calendars '+language+' @ '+width+'px passed');
    await context.close();
   }
  }
 }finally{await browser.close();await server.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
