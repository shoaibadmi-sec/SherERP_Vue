/* Phase 12: Display-language regression. No courier, stock, payment or message posting. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
async function main(){
 const {createServer}=await import('vite');
 const server=await createServer({server:{host:'127.0.0.1',port:4397,strictPort:true}});
 await server.listen();
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
 try {
  for(const language of ['English','English + Bangla','Bangla']){
   for(const width of [390,1440]){
    const context=await browser.newContext({viewport:{width,height:width===390?844:900},hasTouch:width===390,reducedMotion:'reduce'});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.addInitScript(lang=>localStorage.setItem('hisabiq-erp-personal-v1',JSON.stringify({
      mode:'Simple',language:lang,density:'Compact',terminology:'simple',dateView:'transaction'
    })),language);
    const bn=language==='Bangla',base='http://127.0.0.1:4397/#/app/online-sales';
    await page.goto(base);
    await page.getByRole('heading',{name:bn?'অনলাইন বিক্রি':'Online Sales',exact:true}).waitFor();
    await page.getByRole('button',{name:bn?'নতুন অনলাইন অর্ডার':'New online order'}).waitFor();
    const status=page.getByRole('combobox',{name:bn?'অর্ডারের অবস্থা বাছুন':'Filter order status'});
    await status.click();
    await page.getByRole('option',{name:bn?'পৌঁছে গেছে':'Delivered',exact:true}).click();
    assert.equal(await status.getAttribute('data-value'),'Delivered','filter retains source stage ID');
    await status.click();
    await page.getByRole('option',{name:bn?'সব অবস্থা':'All statuses'}).click();
    await page.getByRole('button',{name:'ON-000101'}).click();
    const detail=page.getByRole('dialog',{name:bn?'অনলাইন অর্ডার ON-000101':'Online order ON-000101'});
    await detail.waitFor();
    await detail.getByText(bn?'কুরিয়ার নেবে:':'COD expected:',{exact:false}).waitFor();
    await page.keyboard.press('Escape');
    await detail.waitFor({state:'hidden'});
    await page.getByRole('button',{name:bn?'নতুন অনলাইন অর্ডার':'New online order'}).click();
    const editor=page.getByRole('dialog',{name:bn?'নতুন অনলাইন অর্ডার':'New online order'});
    await editor.waitFor();
    await editor.getByText(bn?'অগ্রিম টাকার পরিমাণ শুধু নমুনা। ক্যাশ, ব্যাংক বা মোবাইল হিসাবে জমা হয়নি।':'Advance is a preview value; no Cash/Bank/MFS account is posted.',{exact:true}).waitFor();
    const payment=editor.getByRole('combobox',{name:bn?'অর্ডারের টাকা নেওয়ার ধরন':'Order payment mode'});
    assert.equal(await payment.getAttribute('data-value'),'COD');
    await payment.click();
    await page.getByRole('option',{name:bn?'কিছু টাকা অগ্রিম':'Partial advance'}).waitFor();
    await page.keyboard.press('Escape');
    await editor.getByRole('button',{name:bn?'বাতিল':'Cancel',exact:true}).click();
    await editor.waitFor({state:'hidden'});
    await page.getByRole('tab',{name:bn?'ক্রেতার খোঁজখবর':/CRM Leads/}).click();
    await page.getByRole('button',{name:bn?'নতুন ক্রেতার খোঁজ':'Add lead'}).click();
    const lead=page.getByRole('dialog',{name:bn?'ক্রেতার নতুন খোঁজ':'New CRM lead'});
    await lead.waitFor();
    await lead.getByText(bn?'ক্রেতার কথা ও আবার যোগাযোগের তারিখ লিখুন। কোনো বার্তা পাঠানো হবে না।':'Record inquiry and next follow-up; no messages are sent.').waitFor();
    await lead.getByRole('button',{name:bn?'বাতিল':'Cancel',exact:true}).click();
    await lead.waitFor({state:'hidden'});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'page width fits viewport');
    assert.deepEqual(errors,[],language+' @ '+width+'px');
    await context.close();
    console.log('Online Sales Phase 12 '+language+' @ '+width+'px passed');
   }
  }
 } finally { await browser.close(); await server.close(); }
}
main().catch(e=>{console.error(e);process.exitCode=1;});
