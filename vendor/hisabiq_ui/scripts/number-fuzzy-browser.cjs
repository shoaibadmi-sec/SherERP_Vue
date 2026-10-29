/* Shared number entry and fuzzy discovery; actual pointer/touch, keyboard and wheel events. */
const {chromium}=require('playwright');const {expect}=require('playwright/test');
const assert=require('node:assert/strict');const fs=require('node:fs');
const sizes=[[320,700],[360,800],[390,844],[430,932],[768,1024],[1024,768],[1280,800],[1440,900]];
async function main(){
 const {createServer}=await import('vite');const port=Number(process.env.NUMBER_SEARCH_PORT||4870);
 const server=await createServer({server:{host:'127.0.0.1',port,strictPort:true}});await server.listen();
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
 const axe=fs.readFileSync(require.resolve('axe-core/axe.min.js'),'utf8');const output=process.env.NUMBER_SEARCH_OUTPUT||'/tmp/hisabiq-number-search';fs.mkdirSync(output,{recursive:true});
 const smoke=Boolean(process.env.NUMBER_SEARCH_SMOKE);const cases=[];let journeys=0,scans=0;
 for(const language of (process.env.NUMBER_SEARCH_LANGUAGE?[process.env.NUMBER_SEARCH_LANGUAGE]:smoke?['English']:['English','English + Bangla','Bangla']))for(const theme of (smoke?['light']:['light','dark']))for(const [width,height] of (process.env.NUMBER_SEARCH_WIDTH?sizes.filter(([w])=>w===Number(process.env.NUMBER_SEARCH_WIDTH)):smoke?[[390,844]]:sizes))cases.push({language,theme,width,height});
 async function run({language,theme,width,height}){
  const context=await browser.newContext({viewport:{width,height},hasTouch:width<=1024,colorScheme:theme,reducedMotion:'reduce'});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://fonts.googleapis.com/**',r=>r.abort());await page.addInitScript(({language,theme})=>{localStorage.setItem('hisabiq-theme',theme);localStorage.setItem('hisabiq-erp-personal-v1',JSON.stringify({mode:'Simple',language,density:'Compact',terminology:'simple',dateView:'transaction'}));window.__wheelEvents=0;document.addEventListener('wheel',()=>window.__wheelEvents++,{capture:true,passive:true});},{language,theme});
  const t=(en,bn)=>language==='Bangla'?bn:en;const act=e=>width<=1024?e.tap():e.click();
  const go=async path=>{await page.evaluate(path=>{location.hash=path;},path);await page.waitForURL(url=>url.hash==='#'+path);};
  const scan=async name=>{await page.addScriptTag({content:axe});const violations=await page.evaluate(async()=> (await window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}})).violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})));assert.deepEqual(violations,[],name);scans++;assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),name+' overflow');};
  const wheel=async(field,deltaY,deltaX=0)=>{await field.scrollIntoViewIfNeeded();await field.hover();const before=await page.evaluate(()=>window.__wheelEvents);await page.mouse.wheel(deltaX,deltaY);await page.waitForFunction(before=>window.__wheelEvents>before,before);};
  try{
   await page.goto(`http://127.0.0.1:${port}/#/app/pos`,{waitUntil:'domcontentloaded'});
   const discount=page.getByRole('textbox',{name:t('Discount','ছাড়'),exact:true});await discount.waitFor();
   const paid=page.getByRole('textbox',{name:t('Payment amount 1','পেমেন্টের পরিমাণ 1'),exact:true});
   await discount.fill('0.00');await act(paid);await act(discount);await expect(discount).toHaveValue('');
   await discount.fill('12.50');await act(paid);await act(discount);await expect(discount).toHaveValue('12.50');
   await wheel(discount,-120);await expect(discount).toHaveValue('13.50');await wheel(discount,120);await expect(discount).toHaveValue('12.50');
   const still=await page.evaluate(()=>scrollY);await wheel(discount,-100);await expect(discount).toHaveValue('13.50');assert.equal(await page.evaluate(()=>scrollY),still,'focused wheel does not scroll the page');
   await discount.press('ArrowDown');await expect(discount).toHaveValue('12.50');
   await act(paid);await wheel(discount,120);await expect(discount).toHaveValue('12.50');
   await act(discount);await wheel(discount,0,100);await expect(discount).toHaveValue('12.50');
   await discount.fill('0');await wheel(discount,100);await expect(discount).toHaveValue('0');
   const picker=page.getByRole('combobox',{name:t('Add product','পণ্য যোগ করুন'),exact:true});
   await picker.fill('blub');await page.getByRole('option').filter({hasText:'LED Bulb 12W'}).first().waitFor();await picker.press('Escape');await expect(picker).toHaveValue('blub');
   await picker.fill('blub absentword');await expect(page.getByRole('option').filter({hasText:'LED Bulb 12W'})).toHaveCount(0);
   await picker.fill('');await picker.press('Escape');
   const checkout=page.locator('[data-pos-checkout]');await act(checkout.getByRole('button').filter({hasText:/Walk-in customer|সাধারণ ক্রেতা/}).first());
   const customers=page.getByRole('dialog',{name:t('Choose customer','ক্রেতা বাছুন'),exact:true});await customers.getByRole('textbox').fill('Rahamn hardwre');
   await act(customers.getByRole('button').filter({hasText:'Rahman Hardware'}));await customers.waitFor({state:'hidden'});
   await expect(checkout.getByRole('textbox',{name:t('Customer name','ক্রেতার নাম'),exact:true})).toHaveValue('Rahman Hardware');await scan('POS number and fuzzy picker');
   // Bounded number-valued state must stay visibly blank even if its parent converts '' to 0.
   await go('/app/notifications');const days=page.getByRole('spinbutton',{name:t('Reminder days','মনে করানোর দিন'),exact:true});await days.waitFor();
   await days.fill('0');await page.getByRole('heading').first().click();await act(days);await expect(days).toHaveValue('');
   await wheel(days,-100);await expect(days).toHaveValue('1');await days.fill('365');await wheel(days,-100);await expect(days).toHaveValue('365');
   await days.fill('0');await wheel(days,100);await expect(days).toHaveValue('0');
   const phone=page.getByRole('textbox',{name:t('SMS preview phone','SMS নমুনার ফোন'),exact:true});await phone.fill('0');await act(days);await act(phone);await expect(phone).toHaveValue('0');
   assert.equal(await phone.locator('..').locator('[data-number-stepper]').count(),0,'phone is not numeric amount input');await scan('bounded numbers and zero focus');
   // The actual purchase picker shares fuzzy ranking and keeps Enter/quantity stepping.
   await go('/app/purchases/new');const purchase=page.getByRole('combobox',{name:'Search product to add to purchase',exact:true});await purchase.fill('blub');
   const bulb=page.getByRole('option').filter({hasText:'LED Bulb 12W'}).first();await bulb.waitFor();await act(bulb);
   const cost=page.getByRole('textbox',{name:'Purchase cost for LED Bulb 12W',exact:true});await cost.fill('170.25');await wheel(cost,-100);await expect(cost).toHaveValue('171.25');
   await cost.press('ArrowDown');await expect(cost).toHaveValue('170.25');
   // Global fuzzy discovery must retain the original product source destination.
   const global=page.getByRole('combobox',{name:t('Global search','সবখানে খুঁজুন'),exact:true});await page.keyboard.press('Control+k');await expect(global).toBeFocused();
   await global.fill('blub');const results=page.getByRole('listbox',{name:t('Global search suggestions','খোঁজার ফলাফল'),exact:true});await results.getByRole('option').filter({hasText:'LED Bulb 12W'}).waitFor();
   await scan('global fuzzy suggestions');await global.press('Enter');await page.waitForURL(url=>url.hash.includes('/app/products?q=ELC-1201'));
   const productSearch=page.getByRole('textbox',{name:t('Search products','পণ্য খুঁজুন'),exact:true});await expect(productSearch).toHaveValue('ELC-1201');
   await productSearch.fill('blub');await page.getByRole('button',{name:/Actions for LED Bulb 12W|কাজ.*LED Bulb 12W/}).first().waitFor();
   await global.fill('INV-000241');await results.getByRole('option').filter({hasText:'INV-000241'}).waitFor();await global.press('Escape');
   await go('/app/sales');const sales=page.getByRole('textbox',{name:t('Search sales','বিক্রি খুঁজুন'),exact:true});await sales.fill('Rahamn');await page.getByRole('button',{name:t('Actions for','কাজ:')+' INV-000241',exact:true}).waitFor();
   await sales.fill('INV-000242');await expect(page.getByRole('button',{name:t('Actions for','কাজ:')+' INV-000241',exact:true})).toHaveCount(0);
   await go('/app/finance');await act(page.getByRole('tab',{name:/^Counter|^কাউন্টার/}));
   const counterSearch=page.getByRole('textbox',{name:t('Search customer','ক্রেতা খুঁজুন'),exact:true});await counterSearch.fill('Rahamn hardwre');
   await page.getByRole('option').filter({hasText:'Rahman Hardware'}).waitFor();await counterSearch.press('Enter');
   await expect(counterSearch).toHaveValue('Rahman Hardware');
   assert.deepEqual(errors,[]);journeys++;console.log(`Numbers and fuzzy search passed ${language} ${theme} ${width}x${height}`);
  }catch(error){await page.screenshot({path:`${output}/failure-${width}-${theme}-${language.replaceAll(' ','_')}.png`,fullPage:true});console.error(await page.locator('body').innerText());throw new Error(`${language} ${theme} ${width}: ${error.stack}`);}
  finally{await context.close();}
 }
 try{const queue=[...cases];await Promise.all(Array.from({length:smoke?1:Number(process.env.NUMBER_SEARCH_WORKERS||2)},async()=>{while(queue.length)await run(queue.shift());}));console.log(JSON.stringify({journeys,scans}));}
 finally{await browser.close();await server.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
