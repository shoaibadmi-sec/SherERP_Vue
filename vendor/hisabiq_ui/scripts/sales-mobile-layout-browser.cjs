/* Sales responsive presentation, wide filter disclosure and resize regression; existing workflow scripts test the mutations. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
async function main(){
 const {preview}=await import('vite');
 const server=await preview({preview:{host:'127.0.0.1',port:4415,strictPort:true}});
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--no-zygote','--disable-gpu','--disable-dev-shm-usage']});
 try{
  for(const language of ['English','English + Bangla','Bangla']){
   for(const width of [360,390,430,768,1024,1440]){
    const page=await browser.newPage({viewport:{width,height:900},hasTouch:width<1280,isMobile:width<768,reducedMotion:'reduce'}),errors=[];
    await page.route('https://fonts.googleapis.com/**',r=>r.fulfill({contentType:'text/css',body:''}));
    page.on('pageerror',e=>errors.push(e.message));
    await page.addInitScript(({language,dark})=>{
     localStorage.setItem('hisabiq-erp-personal-v1',JSON.stringify({mode:'Simple',language,density:'Compact',terminology:'simple',dateView:'transaction'}));
     localStorage.setItem('hisabiq-theme',dark?'dark':'light');
    },{language,dark:language==='Bangla'});
    for(const route of ['sales','sales?tab=return','sales?tab=returns','sales?tab=credits','sales?tab=drafts','quotations','online-sales']){
     await page.goto('http://127.0.0.1:4415/#/app/'+route,{waitUntil:'domcontentloaded',timeout:120000});
     await page.locator('#erp-main h1').waitFor();
     assert.equal(await page.evaluate(()=>matchMedia('(pointer: coarse)').matches),width<1280,'touch-pointer coverage is active for phones/tablets');
     assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),language+' '+width+' '+route+' page fits');
     if(route==='sales'){
      const bn=language==='Bangla';
      if(width>=768){
       // Linked ledger text and phone must stay stacked without a 44px button gap.
       const linkedRow=page.locator('tbody tr').filter({hasText:'Rahman Hardware'}).first();
       const ledgerLink=linkedRow.getByRole('button',{name:'Rahman Hardware',exact:true});
       await ledgerLink.waitFor();
       assert.notEqual(await ledgerLink.getAttribute('data-compact-control'),null,'customer link is an explicit compact text action');
       const metrics=await ledgerLink.evaluate(link=>{
        const phone=link.nextElementSibling;
        const nameBox=link.getBoundingClientRect(),phoneBox=phone.getBoundingClientRect();
        return {height:nameBox.height,gap:phoneBox.top-nameBox.bottom,phone:phone.textContent};
       });
       assert.ok(metrics.height<=24,'ledger name uses text height instead of 44px');
       assert.ok(metrics.gap>=-2&&metrics.gap<=5,'customer and phone stay tightly stacked');
       assert.ok(metrics.phone?.trim(),'phone number remains below customer');
      }
      if(width<768){
       const record=page.locator('.sales-mobile-record').first();
       const action=record.locator('.sales-mobile-record-actions button').first();
       const [body,menu,summary]=await Promise.all([record.locator('.sales-mobile-record-body').boundingBox(),action.boundingBox(),record.locator('summary').boundingBox()]);
       assert.ok(body&&menu&&summary&&menu.y>=body.y+body.height-1,'invoice action sits below totals');
       assert.ok(Math.abs(menu.y-summary.y)<10,'invoice action is beside More details');
       assert.ok(menu.height<=32&&menu.height>=24,'compact invoice menu keeps a usable touch target');
       const total=await record.locator('.sales-mobile-record-body strong').first().boundingBox();
       assert.ok(total&&summary.y-(total.y+total.height)<=8,'More details stays close to totals');
       await action.tap();await page.getByRole('button',{name:bn?'বিল দেখুন':'View invoice',exact:true}).click();
       await page.locator('[data-slot="dialog-content"]').last().waitFor();await page.keyboard.press('Escape');
       // Customer is an independent ledger target, with no nested buttons or accidental invoice opening.
       const ledger=record.getByRole('button',{name:(bn?'ক্রেতার খাতা':'Customer ledger')+' Rahman Hardware',exact:true});
       assert.ok((await ledger.getAttribute('class')).includes('text-teal-700'));
       const [customerBox,totalBox,referenceBox]=await Promise.all([ledger.boundingBox(),record.locator('.sales-mobile-totals').boundingBox(),record.locator('.sales-mobile-record-body').locator('span').first().boundingBox()]);
       assert.ok(customerBox&&totalBox&&referenceBox&&customerBox.y-(referenceBox.y+referenceBox.height)<=2,'customer name stays close to invoice reference');
       assert.ok(totalBox.y-(customerBox.y+customerBox.height)<=4,'totals stay close below customer name');
       for(const label of [bn?'বিক্রির অন্যান্য কাজ':'Sales actions',bn?'তালিকার অন্যান্য কাজ':'List actions']){
        const menuButton=page.getByRole('button',{name:label,exact:true}),box=await menuButton.boundingBox();
        assert.equal(await menuButton.getAttribute('data-hisabiq-variant'),'outline');
        assert.ok(box&&Math.abs(box.width-box.height)<=1,'marked menu button is square');
       }

       assert.equal(await record.locator('button button').count(),0,'record controls are not nested');
       await record.getByRole('button',{name:bn?/^বিস্তারিত দেখুন INV-/:/^View details INV-/}).click({position:{x:12,y:12}});
       await page.locator('[data-slot="dialog-content"]').last().waitFor();await page.keyboard.press('Escape');
       if(width===360){await ledger.focus();await ledger.press('Enter');}else await ledger.tap();
       await page.waitForURL(/#\/app\/parties\?id=/);
       const selectedId=new URLSearchParams(page.url().split('?')[1]).get('id');
       assert.ok(selectedId,'customer ledger receives the linked source ID');
       assert.equal(await page.locator('[data-slot="dialog-content"]').count(),0,'customer action does not open invoice dialog');
       await page.goto('http://127.0.0.1:4415/#/app/sales',{waitUntil:'domcontentloaded'});
       await page.locator('.sales-mobile-record').first().waitFor();
       const walkIn=page.locator('.sales-mobile-record').filter({hasText:'Walk-in customer'}).first();
       assert.equal(await walkIn.getByRole('button',{name:/Customer ledger|ক্রেতার খাতা/}).count(),0,'unlinked walk-in has no false ledger link');
       const nameMetrics=async row=>row.evaluate(element=>{
        const name=element.querySelector('.sales-mobile-customer-row'),text=name.querySelector('.sales-mobile-customer-name'),total=element.querySelector('.sales-mobile-totals');
        return {height:name.getBoundingClientRect().height,above:name.getBoundingClientRect().top-name.previousElementSibling.getBoundingClientRect().bottom,below:total.getBoundingClientRect().top-name.getBoundingClientRect().bottom,font:getComputedStyle(text).fontSize,weight:getComputedStyle(text).fontWeight};
       });
       const linkedMetrics=await nameMetrics(page.locator('.sales-mobile-record').first()),walkInMetrics=await nameMetrics(walkIn);
       assert.deepEqual(linkedMetrics,walkInMetrics,'linked and walk-in customer spacing/typography match');
       assert.equal(linkedMetrics.height,18,'touch target rule must not inflate inline customer name');
       assert.equal(linkedMetrics.font,'13px','customer name is smaller');assert.equal(linkedMetrics.weight,'400','customer name uses regular weight');


      }else if(width<1280){
       const header=label=>page.getByRole('columnheader',{name:label,exact:true});
       assert.equal(await header(bn?'পণ্য':'Items').count(),0,'tablet Items default off');
       assert.equal(await header(bn?'মাধ্যম':'Payment').count(),0,'tablet Payment default off');
       await page.getByRole('button',{name:bn?'কলাম':'Columns',exact:true}).click();
       for(const label of [bn?'পণ্য':'Items',bn?'পেমেন্ট':'Payment']){
        const choice=page.getByRole('menuitemcheckbox',{name:label,exact:true});
        assert.equal(await choice.getAttribute('aria-checked'),'false');await choice.click();
       }
       await page.keyboard.press('Escape');
       assert.equal(await header(bn?'পণ্য':'Items').count(),1);
       assert.equal(await header(bn?'মাধ্যম':'Payment').count(),1);
       await page.reload({waitUntil:'domcontentloaded'});await header(bn?'পণ্য':'Items').waitFor();
       await page.setViewportSize({width:1440,height:900});await header(bn?'মাধ্যম':'Payment').waitFor();
       await page.setViewportSize({width,height:900});
       await page.getByRole('button',{name:bn?'কলাম':'Columns',exact:true}).click();
       for(const label of [bn?'পণ্য':'Items',bn?'পেমেন্ট':'Payment'])await page.getByRole('menuitemcheckbox',{name:label,exact:true}).click();
       await page.keyboard.press('Escape');
       assert.equal(await header(bn?'পণ্য':'Items').count(),0,'tablet overrides survive resize');
      }else{
       assert.equal(await page.getByRole('columnheader',{name:bn?'পণ্য':'Items',exact:true}).count(),1,'desktop Items unchanged');
       assert.equal(await page.getByRole('columnheader',{name:bn?'মাধ্যম':'Payment',exact:true}).count(),1,'desktop Payment unchanged');
      }
     }

     if(width<768){
      assert.equal(await page.locator('.sales-mobile-summary').count(),1);
      if(['sales','quotations','online-sales'].includes(route)){
       await page.locator('.sales-mobile-record').first().waitFor();
       const filters=page.getByRole('button',{name:/Filters|ফিল্টার/,exact:true});
       await filters.click();assert.equal(await filters.getAttribute('aria-expanded'),'true');await filters.click();
      }
     }else{
      assert.equal(await page.locator('.sales-mobile-summary').count(),0,'wide summary unchanged');
      if(['sales','quotations','online-sales'].includes(route)){
       const toggle=page.getByRole('button',{name:/Filters|ফিল্টার/,exact:true});
       assert.equal(await toggle.getAttribute('aria-expanded'),'false','wide filters start collapsed');
       assert.equal(await page.locator('#erp-main').getByRole('combobox').count(),0,'filter controls hidden initially');
       await toggle.press('Enter');
       assert.equal(await toggle.getAttribute('aria-expanded'),'true');
       if(route==='quotations'){
        const draft=page.getByRole('button',{name:language==='Bangla'?'খসড়া':'Draft',exact:true});
        await draft.click();
        const rows=page.locator('tbody tr');
        assert.ok(await rows.count()>0);
        for(const row of await rows.all()) assert.ok((await row.innerText()).includes(language==='Bangla'?'খসড়া':'Draft'));
        await toggle.click();assert.equal(await draft.isVisible(),false);
        await toggle.click();assert.equal(await draft.getAttribute('data-hisabiq-variant'),'default','selected status survives collapse');
       }else{
        const count=route==='sales'?3:2;
        assert.equal(await page.locator('#erp-main').getByRole('combobox').count(),count);
        for(let index=0;index<count;index++){
         const control=page.locator('#erp-main').getByRole('combobox').nth(index);
         await control.click();await page.getByRole('option').nth(1).click();
         const chosen=await control.getAttribute('data-value');
         const result=await page.locator('#erp-main').innerText();
         await toggle.click();assert.equal(await control.isVisible(),false);
         assert.equal(await toggle.getAttribute('aria-expanded'),'false');
         await toggle.click();assert.equal(await control.getAttribute('data-value'),chosen,'selected value survives collapse');
         assert.equal(await page.locator('#erp-main').innerText(),result,'filter result survives collapse');
         await control.click();await page.getByRole('option').first().click();
        }
       }
       await toggle.click();
       assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'expanded/collapsed filters fit viewport');
      }
     }
    }
    // Switch at the breakpoint while a controlled search is filled: state must survive.
    await page.goto('http://127.0.0.1:4415/#/app/sales',{waitUntil:'domcontentloaded'});
    const search=page.getByRole('textbox',{name:/Search sales|বিক্রি খুঁজুন/});
    await search.fill('INV');
    // Inline clear icon must not inherit standalone button touch sizing.
    if(width<1280){
     const clear=search.locator('..').locator('button[aria-label^="Clear "]');
     const clearBox=await clear.boundingBox();
     assert.ok(clearBox&&clearBox.height<=32,'input clear icon remains inside its field');
    }
    await page.setViewportSize({width:width<768?1024:390,height:900});
    await page.locator(width<768?'table':'.sales-mobile-record').first().waitFor();
    assert.equal(await search.inputValue(),'INV','search state survives phone/tablet switch');
    assert.deepEqual(errors,[]);await page.close();console.log(language+' '+width+'px layouts and resize passed');
   }
  }
 }finally{await browser.close();await new Promise(resolve=>server.httpServer.close(resolve));}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
