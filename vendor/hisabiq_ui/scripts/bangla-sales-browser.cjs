/* Phase 17 Sales: list/actions/return/credit localization without financial posting. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
async function main(){
 const {createServer}=await import('vite');
 const server=await createServer({server:{host:'127.0.0.1',port:4402,strictPort:true}});
 await server.listen();
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--no-zygote','--disable-gpu','--disable-dev-shm-usage']});
 try{
  for(const language of ['English','English + Bangla','Bangla']){
   for(const width of [390,1440]){
    const ctx=await browser.newContext({viewport:{width,height:width===390?844:900},hasTouch:width===390,acceptDownloads:true,reducedMotion:'reduce'});
    const page=await ctx.newPage(),errors=[];
    await page.route('https://fonts.googleapis.com/**',r=>r.fulfill({contentType:'text/css',body:''}));
    page.on('pageerror',e=>errors.push(e.message));
    await page.addInitScript(lang=>localStorage.setItem('hisabiq-erp-personal-v1',JSON.stringify({
      mode:'Simple',language:lang,density:'Compact',terminology:'simple',dateView:'transaction'
    })),language);
    const bn=language==='Bangla';
    await page.goto('http://127.0.0.1:4402/#/app/sales',{waitUntil:'domcontentloaded',timeout:120000});
    await page.getByRole('heading',{name:bn?'বিক্রয়':'Sales',exact:true}).waitFor();
    if(width===390){
      await page.locator('.sales-mobile-record').first().waitFor();
      await page.locator('.sales-mobile-record details summary').first().click();
      await page.getByRole('button',{name:bn?'তালিকার অন্যান্য কাজ':'List actions',exact:true}).click();
    }else{
      await page.getByRole('columnheader',{name:bn?'ক্রেতা':'Customer',exact:true}).waitFor();
      await page.getByRole('columnheader',{name:bn?'পণ্য':'Items',exact:true}).waitFor();
    }
    const cols=page.getByRole('button',{name:bn?'কলাম':'Columns',exact:true});
    await cols.click();
    const profit=page.getByRole('menuitemcheckbox',{name:bn?'লাভ':'Profit',exact:true});
    assert.equal(await profit.getAttribute('aria-checked'),'true');
    await profit.click();
    assert.equal(await profit.getAttribute('aria-checked'),'false');
    if(width===390) assert.equal(await page.locator('.sales-mobile-record').first().getByText(bn?/^লাভ:/:/^Profit:/).count(),0);
    else assert.equal(await page.getByRole('columnheader',{name:bn?'লাভ':'Profit',exact:true}).count(),0);
    await profit.click();
    if(width===390) assert.equal(await page.locator('.sales-mobile-record').first().getByText(bn?/^লাভ:/:/^Profit:/).count(),1);
    await page.keyboard.press('Escape');
    if(width===1440) assert.equal(await page.getByRole('columnheader',{name:bn?'লাভ':'Profit',exact:true}).count(),1);
    if(width===390){
      await page.keyboard.press('Escape');
      await page.getByRole('button',{name:bn?'তালিকার অন্যান্য কাজ':'List actions',exact:true}).click();
    }
    const csvWait=page.waitForEvent('download');
    await page.getByRole('button',{name:bn?'ডাউনলোড':'Export',exact:true}).click();
    const download=await csvWait;
    assert.equal(download.suggestedFilename(),'hisabiq-sales.csv');
    const action=page.getByRole('button',{name:new RegExp(bn?'কাজ:':'Actions for')}).first();
    await action.click();
    await page.getByRole('button',{name:bn?'বিল দেখুন':'View invoice',exact:true}).click();
    const invoice=page.locator('[data-slot="dialog-content"]').last();
    await invoice.waitFor();
    await page.keyboard.press('Escape');
    await invoice.waitFor({state:'hidden'});
    // Invoice payment follows the same compact rows as POS on touch and desktop.
    // Keep this journey read-only: cancel instead of posting preview money.
    const dueInvoice=await page.evaluate(async()=>{
      const {getSalesPreviewSnapshot}=await import('/src/data/salesPreviewStore.ts');
      return getSalesPreviewSnapshot().invoices.find(item=>item.due>20)?.invoice;
    });
    assert.ok(dueInvoice,'need an invoice with outstanding due for payment UI checks');
    await page.getByRole('button',{name:(bn?'কাজ: ':'Actions for ')+dueInvoice,exact:true}).click();
    await page.getByRole('button',{name:bn?'টাকা নিন':'Take payment',exact:true}).click();
    // The invoice action popover also has role=dialog; target the modal itself.
    const payment=page.locator('[data-slot="dialog-content"]').last();
    await payment.waitFor();
    const label=(en,bangla)=>bn?bangla:en;
    await payment.getByRole('combobox',{name:label('Payment method 1','পেমেন্টের মাধ্যম 1')}).click();
    await page.getByRole('option',{name:label('Bank','ব্যাংক'),exact:true}).click();
    assert.equal(await payment.getByRole('combobox',{name:label('Payment method 1','পেমেন্টের মাধ্যম 1')}).getAttribute('data-value'),'Bank');
    await payment.getByRole('textbox',{name:label('Payment account 1','পেমেন্টের হিসাব 1')}).fill('QA bank');
    const firstAmount=payment.getByRole('textbox',{name:label('Payment amount 1','পেমেন্টের পরিমাণ 1')});
    await firstAmount.fill('10.25');
    const addPayment=payment.getByRole('button',{name:label('Add another payment source','আরও পেমেন্ট মাধ্যম')});
    await addPayment.click();
    await addPayment.click();
    assert.equal(await payment.getByRole('textbox',{name:/Payment amount|পেমেন্টের পরিমাণ/}).count(),3,'three separate split payment controls');
    await payment.getByRole('textbox',{name:label('Payment amount 3','পেমেন্টের পরিমাণ 3')}).fill('0.50');
    const balance=await payment.getByText(label('Invoice due','বিলের বাকি')).locator('xpath=..').innerText();
    const remainingButton=payment.getByRole('button',{name:label('Remaining','বাকি'),exact:true}).nth(1);
    await remainingButton.click();
    const secondAmount=payment.getByRole('textbox',{name:label('Payment amount 2','পেমেন্টের পরিমাণ 2')});
    const expected=await page.evaluate(async(invoice)=>{
      const {getSalesPreviewSnapshot}=await import('/src/data/salesPreviewStore.ts');
      return Math.round((getSalesPreviewSnapshot().invoices.find(item=>item.invoice===invoice).due-10.75)*100)/100;
    },dueInvoice);
    assert.equal(Number(await secondAmount.inputValue()),expected,'Remaining fills only selected row after other split rows');
    assert.ok(balance.includes('৳'),'invoice due remains visible while splitting');
    for(const field of [firstAmount,secondAmount,payment.getByRole('textbox',{name:label('Payment account 1','পেমেন্টের হিসাব 1')})]){
      const box=await field.boundingBox();
      assert.ok(box&&box.x>=-2&&box.x+box.width<=width+2,'split payment input fits '+width+'px viewport');
    }
    await payment.getByRole('button',{name:label('Cancel','বাতিল'),exact:true}).click();
    await payment.waitFor({state:'hidden'});
    await page.goto('http://127.0.0.1:4402/#/app/sales?tab=return',{waitUntil:'domcontentloaded'});
    await page.getByText(bn?'বিল বাছুন':'Select invoices',{exact:false}).first().waitFor();
    const choices=page.getByRole('checkbox');
    assert.ok(await choices.count()>0,'customer has returnable invoice selections');
    await choices.first().check();
    if(width===1440) await page.getByRole('columnheader',{name:bn?'ফেরতের পরিমাণ':'Return qty',exact:true}).waitFor();
    const qty=page.getByRole('textbox',{name:new RegExp(bn?'ফেরতের পরিমাণ':'Return qty')}).first();
    await qty.fill('1');
    const reason=page.getByRole('combobox',{name:new RegExp(bn?'ফেরতের কারণ':'Return reason')}).first();
    assert.equal(await reason.getAttribute('data-value'),'Customer return','stored source return reason');
    await reason.click();
    await page.getByRole('option',{name:bn?'ভুল পণ্য':'Wrong item',exact:true}).click();
    assert.equal(await reason.getAttribute('data-value'),'Wrong item','translated reason retains English source value');
    const settlement=page.getByRole('combobox',{name:bn?'হিসাব মেলানো':'Settlement'}).first();
    assert.equal(await settlement.getAttribute('data-value'),'Adjust due','stored return settlement');
    await page.goto('http://127.0.0.1:4402/#/app/sales?tab=credits',{waitUntil:'domcontentloaded'});
    await page.getByText(bn?'ক্রেতার টাকা ও জমা':'Customer payments & credit',{exact:false}).first().waitFor();
    await page.getByRole('button',{name:bn?'ক্রেতার টাকা নিন':'Receive customer payment',exact:true}).waitFor();
    if(width===1440) await page.getByRole('columnheader',{name:bn?'জমা টাকা':'Credit balance',exact:true}).waitFor();
    else await page.locator('.sales-mobile-record').first().waitFor();
    assert.deepEqual(errors,[],language+' '+width+'px browser errors');
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no horizontal page overflow');
    await ctx.close();
    console.log('Sales language Phase 17 '+language+' @ '+width+'px passed');
   }
  }
 }finally{await browser.close();await server.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
