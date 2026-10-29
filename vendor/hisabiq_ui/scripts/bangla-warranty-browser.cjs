/* Phase 11: Warranty case/language/receipt surface. Read-only browser check, no posting. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
async function main(){
 const {createServer}=await import('vite');
 const server=await createServer({server:{host:'127.0.0.1',port:4396,strictPort:true}});
 await server.listen();
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
 try{
  for(const language of ['English','English + Bangla','Bangla']){
   for(const width of [390,1440]){
    const context=await browser.newContext({viewport:{width,height:width===390?844:900},hasTouch:width===390,reducedMotion:'reduce'});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.addInitScript(lang=>localStorage.setItem('hisabiq-erp-personal-v1',JSON.stringify({
      mode:'Simple',language:lang,density:'Compact',terminology:'simple',dateView:'transaction'
    })),language);
    const bn=language==='Bangla';
    await page.goto('http://127.0.0.1:4396/#/app/warranty');
    await page.getByRole('heading',{name:bn?'ওয়ারেন্টি':'Warranty',exact:true}).waitFor();
    await page.getByRole('button',{name:bn?'ওয়ারেন্টি গ্রহণ':'Receive warranty',exact:true}).waitFor();
    await page.getByText(bn?'চলমান ওয়ারেন্টি':'Open cases',{exact:true}).first().waitFor();
    const status=page.getByRole('combobox',{name:bn?'অবস্থা':'Status',exact:true});
    await status.click();
    await page.getByRole('option',{name:bn?'ক্রেতাকে দেওয়ার জন্য প্রস্তুত':'Ready for customer'}).click();
    assert.equal(await status.getAttribute('data-value'),'Ready for customer','status source ID is unchanged by locale');
    await status.click();
    await page.getByRole('option',{name:bn?'সব অবস্থা':'All status'}).click();
    await page.locator('tbody tr').first().locator('td').first().click();
    const detail=page.getByRole('dialog');
    await detail.waitFor();
    await detail.getByText(bn?'কাজের ধাপ':'Case timeline',{exact:true}).waitFor();
    const printButton=detail.getByRole('button',{name:bn?'প্রিন্ট':'Print',exact:true});
    await printButton.waitFor();
    const [receipt]=await Promise.all([page.waitForEvent('popup'),printButton.click()]);
    await receipt.getByText(bn?'ওয়ারেন্টি রসিদের নমুনা':'Warranty receipt preview',{exact:true}).waitFor();
    await receipt.getByRole('columnheader',{name:bn?'বিবরণ':'Field'}).waitFor();
    await receipt.getByRole('columnheader',{name:bn?'তথ্য':'Value'}).waitFor();
    const html=await receipt.locator('body').innerText();
    assert.match(html,/WRN-/,'case ID remains on printed receipt');
    await receipt.close();
    await page.keyboard.press('Escape');
    await detail.waitFor({state:'hidden'});
    await page.getByRole('button',{name:bn?'ওয়ারেন্টি গ্রহণ':'Receive warranty',exact:true}).click();
    const intake=page.getByRole('dialog');
    await intake.waitFor();
    await intake.getByText(bn?'ক্রেতা':'Customer',{exact:true}).first().waitFor();
    await intake.getByRole('button',{name:bn?'বাতিল':'Cancel',exact:true}).click();
    await intake.waitFor({state:'hidden'});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Warranty page horizontal overflow');
    assert.deepEqual(errors,[],language+' '+width+'px errors');
    await context.close();
    console.log('Warranty Phase 11 '+language+' @ '+width+'px passed');
   }
  }
 }finally{await browser.close();await server.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
