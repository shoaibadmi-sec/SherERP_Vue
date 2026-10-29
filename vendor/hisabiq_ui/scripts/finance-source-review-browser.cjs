/* Review regressions: duplicate transfer labels, transfer date, and expense source identity. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const axePath=require.resolve('axe-core');
const profiles=[[320,700],[360,800],[390,844],[430,932],[768,1024],[1024,768],[1280,800],[1440,900]];
async function main(){
 const {createServer}=await import('vite');
 const port=Number(process.env.REVIEW_PORT||49311);
 const server=await createServer({cacheDir:'.superpowers/finance-source-review-cache',server:{host:'127.0.0.1',port,strictPort:true}});
 await server.listen();
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH,args:['--no-sandbox']});
 let passed=0;
 try{
  for(const [width,height] of profiles.filter(([w])=>!process.env.REVIEW_WIDTH||w===Number(process.env.REVIEW_WIDTH)))
   for(const theme of ['light','dark'])for(const language of ['English','English + Bangla','Bangla']){
    const context=await browser.newContext({viewport:{width,height},hasTouch:width<=1024,reducedMotion:'reduce',colorScheme:theme});
    await context.addInitScript(({theme,language})=>{localStorage.setItem('hisabiq-theme',theme);localStorage.setItem('hisabiq-erp-personal-v1',JSON.stringify({mode:'Simple',language,density:'Compact',terminology:'simple',dateView:'transaction'}));},{theme,language});
    const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.route('https://fonts.googleapis.com/**',r=>r.abort());
    const act=e=>width<=1024?e.tap():e.click();
    await page.goto(`http://127.0.0.1:${port}/#/app/finance`);
    await page.getByRole('heading',{name:/^Finance$|^টাকা-পয়সা$/}).waitFor();
    const moneyAccounts=page.getByRole('tab',{name:/Money Accounts|টাকার হিসাব/});
    const counter=page.getByRole('tab',{name:/Counter|কাউন্টার/});
    const addAccount=async(type,name,institution,number)=>{
      await act(moneyAccounts);await act(page.getByRole('button',{name:/Add account|হিসাব যোগ করুন/}).first());
      const d=page.getByRole('dialog',{name:/Add account|নতুন হিসাব যোগ করুন/});
      await act(d.getByRole('combobox').first());await act(page.locator(`[role="option"][data-value="${type}"]`));
      await d.getByRole('textbox',{name:/Account name|হিসাবের নাম/}).fill(name);
      await d.getByRole('textbox',{name:/Bank name|Provider|ব্যাংকের নাম|সেবাদাতা/}).fill(institution);
      await d.getByRole('textbox',{name:/Account number|হিসাব নম্বর/}).fill(number);
      await d.getByRole('textbox',{name:/Opening balance|শুরুর জের/}).fill('500');
      await act(d.getByRole('button',{name:/Save account|হিসাব সংরক্ষণ/}));await d.waitFor({state:'hidden'});
    };
    await addAccount('Bank','Dutch-Bangla Bank · 4582','Dutch-Bangla Bank','•••• 4582');
    await act(counter);await act(page.getByRole('button',{name:/^Bank Transfer|^টাকা স্থানান্তর করুন/}));
    await act(page.getByRole('combobox',{name:/From account|যে হিসাব থেকে যাবে/}));await act(page.getByRole('option',{name:/Main Cash Counter/}));
    await act(page.getByRole('combobox',{name:/To account|যে হিসাবে যাবে/}));
    await page.getByRole('option',{name:/Dutch-Bangla Bank/}).first().waitFor();
    const duplicates=await page.getByRole('option').evaluateAll(nodes=>nodes.filter(n=>n.textContent.trim().startsWith('Dutch-Bangla Bank · 4582')).map(n=>({id:n.dataset.value,label:n.textContent.trim()})));
    assert.equal(duplicates.length,2);
    assert.equal(new Set(duplicates.map(n=>n.label)).size,2,'same-name and same-number transfer accounts must remain distinguishable');
    const chosen=duplicates[1];await act(page.locator(`[role="option"][data-value="${chosen.id}"]`));
    await page.getByRole('textbox',{name:/Transfer amount|পাঠানোর টাকা/}).fill('12.50');
    await page.getByRole('textbox',{name:/Reference \/ note|রেফারেন্স \/ মন্তব্য/}).fill('Transfer source review');
    await act(page.getByRole('button',{name:/Review transfer money|যাচাই করুন: টাকা স্থানান্তর করুন/}));
    let review=page.getByRole('dialog',{name:/Confirm transfer money|নিশ্চিত করুন: টাকা স্থানান্তর করুন/});
    assert.ok((await review.innerText()).includes(chosen.label),'confirmation retains the chosen source identity label');
    await act(review.getByRole('button',{name:/Confirm & record|নিশ্চিত করে লিখুন/}));await review.waitFor({state:'hidden'});
    await act(moneyAccounts);
    const transferRow=page.locator('tbody tr').filter({hasText:'TRF-000042'});
    await transferRow.waitFor();
    const expectedDate=await page.evaluate(async()=>{const {businessToday,formatDay}=await import('/src/utils/dateRange.ts');return formatDay(businessToday());});
    assert.ok((await transferRow.innerText()).includes(expectedDate),'Counter transfer history keeps the actual transaction date');
    assert.ok((await transferRow.innerText()).includes(chosen.label),'history retains the same unique source identity');
    await act(transferRow.getByRole('button',{name:/Actions for TRF-000042|কাজ TRF-000042/}));
    const transferDetail=page.getByRole('dialog',{name:/Account transfer|হিসাবে টাকা সরানো/});
    assert.ok((await transferDetail.innerText()).includes('Transfer source review'),'transfer retains the entered reference');
    await act(transferDetail.getByRole('button',{name:/^Close$|^বন্ধ করুন$/}).first());
    await addAccount('Mobile Banking','Rocket Merchant QA','Rocket','01700998877');
    await act(counter);await act(page.getByRole('button',{name:/^Expense|^খরচ লিখুন/}));
    await page.getByPlaceholder(/e.g. Transport|যেমন: পরিবহন/).fill('Transport');
    await act(page.getByRole('combobox',{name:/Payment method|টাকার মাধ্যম/}));await act(page.locator('[role="option"][data-value="Mobile Banking"]'));
    await act(page.getByRole('combobox',{name:/Payment account|টাকার হিসাব/}));
    const rocket=page.getByRole('option',{name:'Rocket Merchant QA',exact:true});const rocketId=await rocket.getAttribute('data-value');await act(rocket);
    await page.getByRole('textbox',{name:/Payment source amount|পেমেন্টের টাকা/}).fill('7.25');
    await page.getByRole('textbox',{name:/Reference \/ note|রেফারেন্স \/ মন্তব্য/}).fill('Source identity review');
    await act(page.getByRole('button',{name:/Review record expense|যাচাই করুন: খরচ লিখুন/}));
    review=page.getByRole('dialog',{name:/Confirm record expense|নিশ্চিত করুন: খরচ লিখুন/});
    await review.waitFor();await page.addScriptTag({path:axePath});
    assert.deepEqual(await page.evaluate(async()=> (await axe.run(document.querySelector('[role="dialog"]'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}})).violations.map(v=>v.id)),[]);
    await act(review.getByRole('button',{name:/Confirm & record|নিশ্চিত করে লিখুন/}));await review.waitFor({state:'hidden'});
    const readExpense=()=>page.evaluate(async()=>{const {getExpensePreviewSnapshot}=await import('/src/data/expensePreviewStore.ts');return getExpensePreviewSnapshot().expenses.find(e=>e.note.startsWith('Source identity review'));});
    const saved=await readExpense();assert.ok(saved,'expense is saved');
    assert.deepEqual({accountId:saved.payments[0].accountId,method:saved.payments[0].method},
      {accountId:rocketId,method:'Mobile Banking'},'expense retains its exact account identity and does not invent a bKash provider');
    if(width<1024)await act(page.getByRole('button',{name:/Open ERP navigation|ERP মেনু খুলুন/}));
    await act(page.locator('a[href="#/app/expenses"]:visible').last());
    await act(page.getByText('Source identity review',{exact:true}));
    await act(page.getByRole('dialog').getByRole('button',{name:/Correct expense|খরচ সংশোধন/}));
    const correction=page.getByRole('dialog',{name:/Correct expense|খরচ সংশোধন/});await correction.waitFor();
    assert.ok((await correction.innerText()).includes('Rocket Merchant QA'),'correction offers the original custom account');
    await correction.getByRole('textbox',{name:/Expense correction reason|খরচ সংশোধনের কারণ/}).fill('Keep original payment source');
    await act(correction.getByRole('button',{name:/Review changes|সংশোধন যাচাই করুন/}));
    await act(correction.getByRole('button',{name:/Confirm preview correction|প্রিভিউ সংশোধন নিশ্চিত করুন/}));
    await correction.waitFor({state:'hidden'});
    assert.deepEqual((await readExpense()).payments,saved.payments,'metadata correction preserves payment source identity and method');
    await act(page.getByRole('dialog').getByRole('button',{name:/^Close$|^বন্ধ করুন$/}).first());
    await act(page.getByRole('tab',{name:/^Reports$|^রিপোর্ট$/}));
    await act(page.getByRole('button',{name:/Expense report date range|খরচের রিপোর্টের তারিখ/}));
    const reportCalendar=page.getByRole('dialog',{name:/Expense report date range|খরচের রিপোর্টের তারিখ/});
    await act(reportCalendar.getByRole('button',{name:/^Today$|^আজ$/}));
    await act(reportCalendar.getByRole('button',{name:/^Apply$|^প্রয়োগ করুন$/}));
    const paymentReport=page.getByText(/By payment method|পেমেন্টের মাধ্যম অনুযায়ী/).locator('xpath=ancestor::div[contains(@class,"rounded-xl")][1]');
    assert.ok((await paymentReport.innerText()).includes(language==='Bangla'?'মোবাইল ব্যাংকিং':'Mobile Banking'),'the expense appears in its payment-method report');
    assert.match(await paymentReport.innerText(),/7\.25/,'payment-method report retains the expense amount');
    assert.deepEqual(errors,[]);
    await context.close();passed++;console.log(`Passed ${passed}: ${width}px ${theme} ${language}`);
   }
 }finally{await browser.close();await server.close();}
 console.log(`Finance source review passed: ${passed} workflows and ${passed} axe scans`);
}
main().catch(e=>{console.error(e);process.exitCode=1;});
