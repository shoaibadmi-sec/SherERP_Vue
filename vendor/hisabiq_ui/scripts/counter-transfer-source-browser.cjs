/* Counter transfer rows retain source IDs and reverse the same account balances. */
/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires -- Playwright CLI scripts use CommonJS. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const axePath=require.resolve('axe-core');
const profiles=[[320,700],[360,800],[390,844],[430,932],[768,1024],[1024,768],[1280,800],[1440,900]];
async function main(){
 const {createServer}=await import('vite');const server=await createServer({server:{host:'127.0.0.1',port:4395,strictPort:true}});await server.listen();
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});let journeys=0;
 try{
  for(const [width,height]of profiles)for(const theme of ['light','dark'])for(const language of ['English','English + Bangla','Bangla']){
   const context=await browser.newContext({viewport:{width,height},hasTouch:width<=1024,colorScheme:theme,reducedMotion:'reduce'});
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.addInitScript(({theme,language})=>{
    localStorage.setItem('hisabiq-theme',theme);
    localStorage.setItem('hisabiq-erp-personal-v1',JSON.stringify({mode:'Simple',language,density:'Compact',terminology:'simple',dateView:'transaction'}));
   },{theme,language});
   const bn=language==='Bangla';const act=element=>width<=1024?element.tap():element.click();
   await page.goto('http://127.0.0.1:4395/#/app/finance');
   await page.addScriptTag({path:axePath});
   await page.getByRole('heading',{name:/Finance|টাকা-পয়সা/}).waitFor();
   await act(page.getByRole('tab',{name:/Money Accounts|টাকার হিসাব/}));
   const balance=async(name)=>{
    const card=page.getByText(name,{exact:true}).first().locator('xpath=ancestor::div[contains(@class,"rounded-xl")][1]');
    return Number((await card.innerText()).match(/৳([\d,]+(?:\.\d+)?)/)[1].replaceAll(',',''));
   };
   const fromBefore=await balance('Main Cash Counter'),toBefore=await balance('Dutch-Bangla Bank · 4582');
   await act(page.getByRole('tab',{name:/Counter|কাউন্টার/}));
   await act(page.getByRole('button',{name:/^Bank Transfer|^টাকা স্থানান্তর করুন/}));
   const from=page.getByRole('combobox',{name:/From account|যে হিসাব থেকে যাবে/});
   const to=page.getByRole('combobox',{name:/To account|যে হিসাবে যাবে/});
   await act(from);await act(page.getByRole('option',{name:/Main Cash Counter/}));
   await act(to);await act(page.getByRole('option',{name:/Dutch-Bangla Bank · 4582/}));
   await page.getByRole('textbox',{name:/Transfer amount|পাঠানোর টাকা/}).fill('123.45');
   await act(page.getByRole('button',{name:/Review transfer money|যাচাই করুন: টাকা স্থানান্তর করুন/}));
   const review=page.getByRole('dialog',{name:/Confirm transfer money|নিশ্চিত করুন: টাকা স্থানান্তর করুন/});await review.waitFor();
   if([320,390,1440].includes(width)){
    const violations=await page.evaluate(async()=> (await window.axe.run(document.querySelector('[role="dialog"]'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})));
    assert.deepEqual(violations,[],`${language} ${width}px ${theme} transfer confirmation axe violations`);
   }
   await act(review.getByRole('button',{name:/Confirm & record|নিশ্চিত করে লিখুন/}));
   await page.getByRole('status').filter({hasText:/Recorded in preview|প্রিভিউতে লেখা হয়েছে/}).waitFor();
   await act(page.getByRole('tab',{name:/Money Accounts|টাকার হিসাব/}));
   const history=page.getByText(/Transfer history|ট্রান্সফারের ইতিহাস/).first().locator('xpath=ancestor::div[contains(@class,"rounded-xl")][1]');
   const transferRows=history.locator('tbody tr');
   assert.equal(await transferRows.filter({hasText:'123.45'}).count(),1,`${language}: transfer must be present in source history`);
   const row=transferRows.filter({hasText:'123.45'}).first();
   assert.match(await row.innerText(),/TRF-000042/);
   assert.ok(Math.abs(await balance('Main Cash Counter')-(fromBefore-123.45))<0.001,'history source balance matches transfer');
   assert.ok(Math.abs(await balance('Dutch-Bangla Bank · 4582')-(toBefore+123.45))<0.001,'history destination balance matches transfer');
   await act(row.getByRole('button',{name:/Actions for TRF-000042|কাজ TRF-000042/}));
   const action=page.getByRole('dialog',{name:/Account transfer|হিসাবে টাকা সরানো/});
   if([320,390,1440].includes(width)){
    const violations=await page.evaluate(async()=> (await window.axe.run(document.querySelector('[role="dialog"]'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})));
    assert.deepEqual(violations,[],`${language} ${width}px ${theme} transfer action axe violations`);
   }
   await act(action.getByRole('button',{name:/^Reverse$|^উল্টো করুন$/}));
   await act(action.getByRole('button',{name:/Confirm reverse|উল্টো করা নিশ্চিত করুন/}));
   assert.match(await row.innerText(),bn?/উল্টো হিসাব/:/Reversed/,'reversal retains source history');
   assert.ok(Math.abs(await balance('Main Cash Counter')-fromBefore)<0.001,'reversal restores source account');
   assert.ok(Math.abs(await balance('Dutch-Bangla Bank · 4582')-toBefore)<0.001,'reversal restores destination account');
   assert.deepEqual(errors,[],`${language} ${width}px ${theme} has no page errors`);
   await context.close();journeys++;
  }
 }finally{await browser.close();await server.close();}
 console.log(`Counter transfer source/history/reversal passed: ${journeys} journeys; 8 viewports × 2 themes × 3 languages.`);
}
main().catch(e=>{console.error(e);process.exitCode=1;});
