/* Nested Finance people editing preserves person identity and transaction drafts. */
/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires -- Playwright CLI scripts use CommonJS. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const axePath=require.resolve('axe-core');
async function auditDialog(page,dialog,label){
 const violations=await page.evaluate(async element=>(await window.axe.run(element,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}})).violations.map(item=>({id:item.id,nodes:item.nodes.map(node=>node.target)})),await dialog.elementHandle());
 assert.deepEqual(violations,[],`${label} dialog axe violations`);
 const bounds=await dialog.boundingBox(),viewport=page.viewportSize();
 assert.ok(bounds&&viewport&&bounds.x>=0&&bounds.y>=0&&bounds.x+bounds.width<=viewport.width&&bounds.y+bounds.height<=viewport.height,`${label} dialog fits inside ${viewport?.width}×${viewport?.height}`);
}
async function main(){
 const {createServer}=await import('vite');const server=await createServer({server:{host:'127.0.0.1',port:4398,strictPort:true}});await server.listen();
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});let journeys=0;
 const allProfiles=[[320,700],[360,800],[390,844],[430,932],[768,1024],[1024,768],[1280,800],[1440,900]];
 const profiles=process.env.FINANCE_PEOPLE_WIDTH?allProfiles.filter(([width])=>width===Number(process.env.FINANCE_PEOPLE_WIDTH)):allProfiles;
 try{
  for(const [width,height] of profiles)for(const theme of ['light','dark'])for(const language of ['English','English + Bangla','Bangla']){
   const context=await browser.newContext({viewport:{width,height},hasTouch:true,colorScheme:theme,reducedMotion:'reduce'});const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
   await page.addInitScript(({theme,language})=>{localStorage.setItem('hisabiq-theme',theme);localStorage.setItem('hisabiq-erp-personal-v1',JSON.stringify({mode:'Simple',language,density:'Compact',terminology:'simple',dateView:'transaction'}));},{theme,language});
   const act=element=>width<=1024?element.tap():element.click();
   await page.goto('http://127.0.0.1:4398/#/app/finance');await page.getByRole('heading',{name:/Finance|টাকা-পয়সা/}).waitFor();await page.addScriptTag({path:axePath});
   await act(page.getByRole('tab',{name:/Loans & Owners|ঋণ ও মালিক/}));
   await act(page.getByRole('button',{name:/Finance people|হিসাবের ব্যক্তি/}).first());
   const manager=page.getByRole('dialog',{name:/Finance people|হিসাবের ব্যক্তি/});await manager.waitFor();
   await auditDialog(page,manager,`${width}px ${theme} ${language} Finance people manager`);
   for(let index=0;index<2;index++){
    await manager.getByPlaceholder(/Name|নাম/).fill('Twin Finance Person');
    await act(manager.getByRole('button',{name:/Add person|ব্যক্তি যোগ করুন/}));
   }
   assert.equal((await manager.innerText()).match(/Twin Finance Person/g)?.length||0,2,'both same-name people are present in the manager');
   await act(manager.getByRole('button',{name:/Done|সম্পন্ন/}));await manager.waitFor({state:'hidden'});
   await act(page.getByRole('button',{name:/New transaction|নতুন লেনদেন/}).first());
   const parent=page.getByRole('dialog',{name:/New finance transaction|নতুন টাকার লেনদেন/});await parent.waitFor();
   await auditDialog(page,parent,`${width}px ${theme} ${language} Finance transaction parent`);
   const comboboxes=parent.getByRole('combobox');
   await act(comboboxes.nth(1));
   const twinOptions=page.locator('[role="option"]').filter({hasText:'Twin Finance Person'});
   assert.equal(await twinOptions.count(),2,'same-name people remain individually selectable');
   const twinLabels=await twinOptions.allTextContents();assert.equal(new Set(twinLabels).size,2,'duplicate-name option labels distinguish the selected person');
   await page.keyboard.press('Escape');
   await act(comboboxes.first());await act(page.locator('[role="option"][data-value="Borrower Debit"]'));
   const paymentSource=parent.getByText(/Payment sources|টাকার মাধ্যম/,{exact:true}).locator('xpath=ancestor::div[contains(@class,"rounded-xl")][1]').getByRole('textbox').first();
   await paymentSource.fill('321.45');
   await parent.getByRole('textbox',{name:/Reference no\.|নম্বর/}).fill('NEST-KEEP');
   await parent.getByRole('textbox',{name:/Notes|মন্তব্য/}).fill('parent draft survives quick add');
   await act(parent.getByRole('button',{name:/Manage people|ব্যক্তি যোগ \/ সংশোধন/}));
   const nested=page.getByRole('dialog',{name:/Finance people|হিসাবের ব্যক্তি/});await nested.waitFor();
   await auditDialog(page,nested,`${width}px ${theme} ${language} nested people manager`);
   assert.equal(await nested.getByRole('button',{name:/Borrower|ঋণগ্রহীতা/}).getAttribute('aria-pressed'),'true','new person defaults to the parent transaction role');
   await nested.getByPlaceholder(/Name|নাম/).fill('Nested Borrower');
   await nested.getByPlaceholder(/Phone|ফোন নম্বর/).fill('01700000002');
   await act(nested.getByRole('button',{name:/Add person|ব্যক্তি যোগ করুন/}));await nested.waitFor({state:'hidden'});
   assert.equal(await parent.getByRole('textbox',{name:/Amount|টাকা/}).inputValue(),'321.45');
   assert.equal(await parent.getByRole('textbox',{name:/Reference no\.|নম্বর/}).inputValue(),'NEST-KEEP');
   assert.equal(await parent.getByRole('textbox',{name:/Notes|মন্তব্য/}).inputValue(),'parent draft survives quick add');
   assert.match(await parent.innerText(),/Nested Borrower/,'the new contextual-role person is selected in the parent');
   assert.equal(await paymentSource.inputValue(),'321.45','payment amount survives nested manager changes');
   // Finance account creation is deliberately outside this transaction form.
   assert.equal(await parent.getByRole('button',{name:/Add account|হিসাব যোগ করুন/}).count(),0);
   const manage=parent.getByRole('button',{name:/Manage people|ব্যক্তি যোগ \/ সংশোধন/});
   assert.equal(await manage.getAttribute('aria-haspopup'),'dialog','attached gear opens the existing manager');
   assert.equal(await parent.getByRole('textbox',{name:/Amount|টাকা/}).inputValue(),'321.45','transaction amount is preserved');
   assert.equal(await parent.getByRole('textbox',{name:/Reference no\.|নম্বর/}).inputValue(),'NEST-KEEP','transaction reference is preserved');
   assert.equal(await parent.getByRole('textbox',{name:/Notes|মন্তব্য/}).inputValue(),'parent draft survives quick add');
   assert.match(await parent.innerText(),/Main Cash Counter/,'existing payment account remains selectable');
   await act(parent.getByRole('button',{name:/Review transaction|লেনদেন যাচাই/}));
   await act(parent.getByRole('button',{name:/Confirm finance transaction|লেনদেন নিশ্চিত/}));await parent.waitFor({state:'hidden'});
   assert.match(await page.locator('main').innerText(),/NEST-KEEP/,'confirmed parent draft appears in Finance history');
   await act(page.getByRole('button',{name:/Finance people|হিসাবের ব্যক্তি/}).first());
   const savedManager=page.getByRole('dialog',{name:/Finance people|হিসাবের ব্যক্তি/});await savedManager.waitFor();
   await act(savedManager.getByRole('button',{name:/Edit.*Nested Borrower|সংশোধন.*Nested Borrower/}));
   await savedManager.getByLabel(/Name|নাম/).fill('Nested Borrower Edited');
   await savedManager.getByLabel(/Description \/ relationship note|বিবরণ \/ সম্পর্কের মন্তব্য/).fill('relationship updated');
   await act(savedManager.getByRole('button',{name:/Save person|তথ্য সংরক্ষণ/}));
   assert.match(await savedManager.innerText(),/Nested Borrower Edited/,'person save updates the manager list');
   await act(savedManager.getByRole('button',{name:/Edit.*Nested Borrower Edited|সংশোধন.*Nested Borrower Edited/}));
   assert.equal(await savedManager.getByLabel(/Description \/ relationship note|বিবরণ \/ সম্পর্কের মন্তব্য/).inputValue(),'relationship updated','reopening edit reloads saved details');
   await act(savedManager.getByRole('button',{name:/Cancel edit|সংশোধন বাতিল/}));
   await act(savedManager.getByRole('button',{name:/Deactivate.*Nested Borrower Edited|নিষ্ক্রিয় করুন.*Nested Borrower Edited/}));
   await act(savedManager.getByRole('button',{name:/Done|সম্পন্ন/}));await savedManager.waitFor({state:'hidden'});
   const transactionRow=page.getByText('NEST-KEEP',{exact:false}).locator('xpath=ancestor::tr[1]');
   await act(transactionRow.getByRole('button',{name:/Actions for|কাজ/}));
   const transactionAction=page.getByRole('dialog').last();await transactionAction.waitFor();
   await act(transactionAction.getByRole('button',{name:/^Edit$|^সংশোধন$/}));
   const editDialog=page.getByRole('dialog').last();await editDialog.waitFor();
   await act(editDialog.getByRole('combobox').nth(1));
   const inactiveOption=page.locator('[role="option"]').filter({hasText:'Nested Borrower Edited'});
   assert.equal(await inactiveOption.count(),1,'historical transaction retains its inactive person as the selected edit option');
   assert.match(await inactiveOption.textContent(),/Inactive|বন্ধ/,'inactive historical person is identified in the edit list');
   await act(editDialog.getByRole('button',{name:/Cancel|বাতিল/}));
   await act(transactionAction.getByRole('button',{name:/Close|বন্ধ/}).first());
   await act(page.getByRole('button',{name:/New transaction|নতুন লেনদেন/}).first());
   const newParent=page.getByRole('dialog',{name:/New finance transaction|নতুন টাকার লেনদেন/});await newParent.waitFor();
   await act(newParent.getByRole('combobox').first());await act(page.locator('[role="option"][data-value="Borrower Debit"]'));
   await act(newParent.getByRole('combobox').nth(1));
   assert.equal(await page.locator('[role="option"]').filter({hasText:'Nested Borrower Edited'}).count(),0,'inactive people are excluded when selecting a person for a new transaction');
   await page.keyboard.press('Escape');await act(newParent.getByRole('button',{name:/Cancel|বাতিল/}));
   assert.deepEqual(errors,[],`${width}px ${theme} ${language} has no runtime errors`);
   await context.close();journeys++;
  }
 }finally{await browser.close();await server.close();}
 console.log(`Nested Finance people and account workflows passed: ${journeys} journeys; ${profiles.length} viewport(s) × 2 themes × 3 languages.`);
}
main().catch(error=>{console.error(error);process.exitCode=1;});
