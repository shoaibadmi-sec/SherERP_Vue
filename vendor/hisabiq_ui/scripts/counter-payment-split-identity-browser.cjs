/* Counter supplier payment splits retain the selected account ID and show distinct account names. */
/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires -- Playwright CLI scripts use CommonJS. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const axePath=require.resolve('axe-core');
async function main(){
 const {createServer}=await import('vite');const server=await createServer({server:{host:'127.0.0.1',port:4402,strictPort:true}});await server.listen();
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});let journeys=0;
 const allProfiles=[[320,700],[360,800],[390,844],[430,932],[768,1024],[1024,768],[1280,800],[1440,900]];
 const profiles=process.env.COUNTER_SPLIT_WIDTH?allProfiles.filter(([width])=>width===Number(process.env.COUNTER_SPLIT_WIDTH)):allProfiles;
 try{
  for(const [width,height]of profiles)for(const theme of ['light','dark'])for(const language of ['English','English + Bangla','Bangla']){
   const context=await browser.newContext({viewport:{width,height},hasTouch:width<=1024,reducedMotion:'reduce',colorScheme:theme});const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
   await context.addInitScript(({theme,language})=>{localStorage.setItem('hisabiq-theme',theme);localStorage.setItem('hisabiq-erp-personal-v1',JSON.stringify({mode:'Simple',language,density:'Compact',terminology:'simple',dateView:'transaction'}));},{theme,language});
   const act=element=>width<=1024?element.tap():element.click();
   await page.goto('http://127.0.0.1:4402/#/app/finance');await page.getByRole('heading',{name:/Finance|টাকা-পয়সা/}).waitFor();await page.addScriptTag({path:axePath});
   await act(page.getByRole('tab',{name:/Money Accounts|টাকার হিসাব/}));await act(page.getByRole('button',{name:/Add account|হিসাব যোগ করুন/}).first());
   const accountDialog=page.getByRole('dialog',{name:/Add account|নতুন হিসাব যোগ করুন/});await accountDialog.waitFor();
   await act(accountDialog.getByRole('combobox'));await act(page.locator('[role="option"][data-value="Bank"]'));
   await accountDialog.getByRole('textbox',{name:/Account name|হিসাবের নাম/}).fill('Dutch-Bangla Bank · 4582');
   await accountDialog.getByRole('textbox',{name:/Bank name|ব্যাংকের নাম/}).fill('Dutch-Bangla Bank');
   await accountDialog.getByRole('textbox',{name:/Account number|হিসাব নম্বর/}).fill('•••• 9999');
   await accountDialog.getByRole('textbox',{name:/Opening balance|শুরুর জের/}).fill('214650');
   await act(accountDialog.getByRole('button',{name:/Save account|হিসাব সংরক্ষণ/}));await accountDialog.waitFor({state:'hidden'});
   await act(page.getByRole('tab',{name:/Counter|কাউন্টার/}));await act(page.locator('button[aria-pressed]').filter({hasText:/Supplier Pay|সরবরাহকারীকে টাকা দিন/}));
   const supplierSearch=page.getByRole('textbox',{name:/Search supplier|সরবরাহকারী খুঁজুন/});await supplierSearch.fill('Karim Traders');await act(page.getByRole('option',{name:/Karim Traders/}));
   await act(page.getByRole('combobox',{name:/Payment method|টাকার মাধ্যম/}));await act(page.locator('[role="option"][data-value="Bank"]'));
   const paymentAccount=page.getByRole('combobox',{name:/Payment account|টাকার হিসাব/});await act(paymentAccount);
   const pickerOptions=await page.locator('[role="option"]').evaluateAll(options=>options.map(option=>({label:option.textContent.trim(),id:option.getAttribute('data-value')})));
   const duplicateOptions=pickerOptions.filter(option=>option.label.startsWith('Dutch-Bangla Bank · 4582'));
   assert.equal(duplicateOptions.length,2,'two matching-name bank accounts are available');
   assert.equal(new Set(duplicateOptions.map(option=>option.label)).size,2,'duplicate-name payment accounts must be distinguishable in the picker');
   const chosenAccountId=duplicateOptions[1].id;await act(page.locator(`[role="option"][data-value="${chosenAccountId}"]`));
   await page.getByRole('textbox',{name:/Payment source amount|পেমেন্টের টাকা/}).fill('125.50');
   await page.getByRole('textbox',{name:/Reference \/ note|রেফারেন্স \/ মন্তব্য/}).fill('Counter supplier split identity QA');
   const before=await page.evaluate(async()=>{const {getPartyPreviewSnapshot}=await import('/src/data/partyPreviewStore.ts');const {supplierSettlementAsOf}=await import('/src/utils/partySettlement.ts');const {businessToday}=await import('/src/utils/dateRange.ts');const state=getPartyPreviewSnapshot();return supplierSettlementAsOf(state.sources,'s1',businessToday()).netBalance;});
   await act(page.getByRole('button',{name:/Review pay supplier|যাচাই করুন: সরবরাহকারীকে টাকা দিন/}));
   const review=page.getByRole('dialog',{name:/Confirm pay supplier|নিশ্চিত করুন: সরবরাহকারীকে টাকা দিন/});await review.waitFor();
   assert.match(await review.innerText(),/Dutch-Bangla Bank · 4582 · •••• 9999/,'review identifies the selected duplicate by masked account number');
   const axeViolations=await page.evaluate(async()=> (await window.axe.run(document.querySelector('[role="dialog"]'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}})).violations.map(item=>({id:item.id,nodes:item.nodes.map(node=>node.target)})));
   assert.deepEqual(axeViolations,[],`${width}px ${theme} ${language} supplier payment review axe violations`);
   await act(review.getByRole('button',{name:/Confirm & record|নিশ্চিত করে লিখুন/}));await review.waitFor({state:'hidden'});
   await page.locator('[role="status"]').filter({hasText:/Recorded in preview|প্রিভিউতে লেখা হয়েছে/}).waitFor();
   const saved=await page.evaluate(async()=>{const {getPartyPreviewSnapshot}=await import('/src/data/partyPreviewStore.ts');const {supplierSettlementAsOf}=await import('/src/utils/partySettlement.ts');const {businessToday}=await import('/src/utils/dateRange.ts');const state=getPartyPreviewSnapshot();return {payment:state.sources.find(row=>row.id.startsWith('party-payment:counter-')),net:supplierSettlementAsOf(state.sources,'s1',businessToday()).netBalance};});
   assert.equal(saved.payment.partyId,'s1');assert.equal(saved.payment.kind,'supplier-payment');assert.equal(saved.payment.amountPaid,125.5);
   assert.deepEqual(saved.payment.paymentSplits.map(split=>[split.accountId,split.amount]),[[chosenAccountId,125.5]]);
   assert.ok(Math.abs(saved.net-(before+125.5))<0.001,'supplier party balance reflects the actual payment');
   await act(page.getByRole('tab',{name:/Money Accounts|টাকার হিসাব/}));
   const duplicateCard=page.locator('p').filter({hasText:'9999'}).locator('xpath=ancestor::div[contains(@class,"rounded-xl")][1]');
   const cardText=await duplicateCard.innerText(),digits=cardText.match(/৳([\d,০-৯]+(?:\.\d+)?)/)[1].replaceAll(',','').replace(/[০-৯]/g,digit=>String('০১২৩৪৫৬৭৮৯'.indexOf(digit)));
   assert.equal(Number(digits),214524.5,'the selected duplicate account loses exactly the split amount');
   assert.deepEqual(errors,[],`${width}px ${theme} ${language} has no runtime errors`);await context.close();journeys++;
  }
 }finally{await browser.close();await server.close();}
 console.log(`Counter supplier split/source/review passed: ${journeys} journeys; ${profiles.length} viewport(s) × 2 themes × 3 languages.`);
}
main().catch(error=>{console.error(error);process.exitCode=1;});
