/* Phase 9: notification workbench is a rule/template preview, never an SMS sender. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');

async function main(){
 const {createServer}=await import('vite');
 const server=await createServer({server:{host:'127.0.0.1',port:4394,strictPort:true}});
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
    await page.goto('http://127.0.0.1:4394/#/app/notifications');
    await page.getByRole('heading',{name:bn?'এসএমএস ও নোটিফিকেশন':'ERP Notifications',exact:true}).waitFor();
    await page.getByText(bn?/SMS পাঠানো হবে না বা টাকা কাটা হবে না/:/no SMS will be sent or billed/).first().waitFor();
    const search=page.getByRole('textbox',{name:bn?'নোটিফিকেশন খুঁজুন':'Search ERP notification events'});
    assert.equal(await search.getAttribute('placeholder'),bn?'নোটিফিকেশন বা মডিউল খুঁজুন':'Search notifications or modules');
    assert.match(await page.getByTestId('erp-sms-preview').innerText(),/Panjabi/);
    // UI language is separate from the SMS message language.
    const smsLanguage=page.getByLabel(bn?'SMS-এর ভাষা':'SMS language',{exact:true}).first();
    await smsLanguage.click();
    const langOption=bn?'বাংলা':'Bangla';
    await page.getByRole('option',{name:langOption,exact:true}).click();
    assert.match(await page.getByTestId('erp-sms-preview').innerText(),/পাঞ্জাবি/);
    const enable=page.getByRole('checkbox',{name:bn?'SMS চালু করুন service_ready':'Enable SMS service_ready'});
    assert.equal(await enable.isChecked(),false,'all rules start off');
    await enable.check();
    assert.equal(await enable.isChecked(),true);
    const noSend=page.getByRole('button',{name:bn?'শুধু নমুনা — SMS পাঠাবেন না':'Preview only — never send'});
    await noSend.click();
    await page.getByText(bn?'শুধু নমুনা। কোনো SMS পাঠানো হয়নি।':'Preview only. No SMS was sent.').first().waitFor();

    await page.getByLabel(bn?'নোটিফিকেশনের বিভাগ':'Filter notification group').click();
    await page.getByRole('option',{name:bn?'ঋণ ও মালিক':'Loans & owner',exact:true}).click();
    await page.getByText(bn?'ঋণ পরিশোধ স্মরণ':'Borrower repayment reminder',{exact:true}).first().waitFor();
    await search.fill(bn?'ঋণ':'borrower');
    await page.getByText(bn?'ঋণ পরিশোধ স্মরণ':'Borrower repayment reminder',{exact:true}).first().waitFor();
    await search.fill('unlikely-notification-event-xyz');
    await page.getByText(bn?'এই খোঁজার জন্য কোনো নোটিফিকেশন নেই।':'No events match this filter.',{exact:true}).waitFor();
    assert.deepEqual(errors,[],language+' '+width+'px runtime errors');
    await context.close();
    console.log('Phase 9 notification UI '+language+' @ '+width+'px passed');
   }
  }
 }finally{await browser.close();await server.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
