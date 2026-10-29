/* Sales return limits/net refunds, template CRUD -> POS, and return-ledger identity.
 * Local preview only. Real pointer/touch/keyboard interactions; no forced clicks or sleeps. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const sizes=[[320,700],[360,800],[390,844],[430,932],[768,1024],[1024,768],[1280,800],[1440,900]];
async function main(){
 const {createServer}=await import('vite');
 const port=Number(process.env.SALES_AUDIT_PORT||4860);
 const server=await createServer({server:{host:'127.0.0.1',port,strictPort:true}});await server.listen();
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
 const axeSource=fs.readFileSync(require.resolve('axe-core/axe.min.js'),'utf8');
 const smoke=Boolean(process.env.SALES_AUDIT_SMOKE);
 let journeys=0,scans=0;const violations=[];
 try{
  const cases=[];
  for(const language of (smoke?['English']:['English','English + Bangla','Bangla']))
  for(const theme of (smoke?['light']:['light','dark']))
  for(const [width,height] of (smoke?[[320,700],[360,800]]:sizes))cases.push({language,theme,width,height});
  async function runCase({language,theme,width,height}){
   const bn=language==='Bangla',touch=width<=1024;
   const ctx=await browser.newContext({viewport:{width,height},hasTouch:touch,colorScheme:theme,reducedMotion:'reduce'});
   const page=await ctx.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
   await page.route('https://fonts.googleapis.com/**',route=>route.abort());
   await page.addInitScript(({language,theme})=>{
    localStorage.setItem('hisabiq-erp-personal-v1',JSON.stringify({mode:'Simple',language,density:'Compact',terminology:'simple',dateView:'transaction'}));
    localStorage.setItem('hisabiq-theme',theme);
   },{language,theme});
   const click=async locator=>touch?locator.tap():locator.click();
   const label=(en,bangla)=>bn?bangla:en;
   const tab=async(en,bangla)=>click(page.getByRole('tab',{name:new RegExp('^'+label(en,bangla))}));
   const axe=async(name,root)=>{
    await page.addScriptTag({content:axeSource});
    const result=await page.evaluate(async selector=>window.axe.run(selector||document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}}),root);
    for(const violation of result.violations)violations.push({language,theme,width,name,id:violation.id,nodes:violation.nodes.map(node=>node.target)});
    scans++;
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${name}: page overflow ${width}`);
   };
   try{
    await page.goto(`http://127.0.0.1:${port}/#/app/sales?tab=return`,{waitUntil:'domcontentloaded'});
    await page.getByRole('checkbox').first().check();
    const quantity=page.getByRole('textbox',{name:label('Return qty','ফেরতের পরিমাণ')+' · MS Angle 1.5" × 1.5"'});
    for(const malformed of ['-1','1e3','1..2']){
     await quantity.fill(malformed);assert.equal(await quantity.inputValue(),malformed);
     assert.ok(await page.getByRole('button',{name:label('Complete return','ফেরত সম্পন্ন করুন'),exact:true}).isDisabled(),'reject malformed source return quantity');
    }
    await quantity.fill('1');
    const rate=page.getByRole('textbox',{name:new RegExp(label('Return price for','ফেরত পণ্যের দাম:')+' MS Angle')});
    assert.ok(await rate.isDisabled(),'historical refund rate cannot be overwritten');
    // Opening/cancelling a contextual child must preserve the partially entered parent return.
    await tab('Drafts & templates','খসড়া ও নমুনা');
    const templates=page.locator('section').filter({hasText:label('Sale templates','বিক্রির নমুনা')});
    await click(templates.getByRole('button',{name:label('Actions','কাজ'),exact:true}).first());
    await click(page.getByRole('button',{name:label('Edit template','নমুনা বদলান'),exact:true}));
    let dialog=page.getByRole('dialog',{name:label('Edit template','নমুনা বদলান'),exact:true});await dialog.waitFor();
    const nameLabel=label('Template name','নমুনার নাম');
    assert.equal(await dialog.getByRole('textbox',{name:nameLabel}).inputValue(),'Monthly site supply');
    await dialog.getByRole('textbox',{name:nameLabel}).fill('Cancelled change');
    await click(dialog.getByRole('button',{name:label('Cancel','বাতিল'),exact:true}));await dialog.waitFor({state:'hidden'});
    await tab('Sales return','বিক্রি ফেরত');assert.equal(await quantity.inputValue(),'1');
    // Exhaust a source line, then verify the balance and denial survive module navigation.
    await quantity.fill('220');await click(page.getByRole('button',{name:label('Complete return','ফেরত সম্পন্ন করুন'),exact:true}));
    await page.getByText('RTN-000015',{exact:true}).waitFor();
    await tab('Sales return','বিক্রি ফেরত');await page.getByRole('checkbox').first().check();await quantity.fill('1');
    assert.ok(await page.getByRole('button',{name:label('Complete return','ফেরত সম্পন্ন করুন'),exact:true}).isDisabled());
    await page.getByRole('alert').first().waitFor();await axe('exhausted return');
    // Create, validate and edit a template through the actual POS cart components.
    await tab('Drafts & templates','খসড়া ও নমুনা');await click(templates.getByRole('button',{name:label('Template','নমুনা'),exact:true}));
    dialog=page.getByRole('dialog',{name:label('New sale template','বিক্রির নতুন নমুনা'),exact:true});await dialog.waitFor();
    await click(dialog.getByRole('button',{name:label('Save template','নমুনা রাখুন'),exact:true}));await dialog.getByRole('alert').waitFor();
    await dialog.getByRole('textbox',{name:nameLabel}).fill('QA Sales template');
    const picker=dialog.locator('input[role="combobox"]');await picker.fill('LED Bulb');
    await page.getByRole('option').filter({hasText:'LED Bulb 12W'}).first().waitFor();await picker.press('Enter');
    let row=dialog.getByTestId('pos-cart-row').first();await row.waitFor();
    const quantities=row.locator('[data-testid="compound-quantity"] input');
    await quantities.first().fill('2');await quantities.nth(1).fill('5');
    await axe('new template dialog','[data-dialog-root]');
    await click(dialog.getByRole('button',{name:label('Save template','নমুনা রাখুন'),exact:true}));await dialog.waitFor({state:'hidden'});
    let card=templates.locator('.divide-y > div').filter({hasText:'QA Sales template'});
    await click(card.getByRole('button',{name:label('Actions','কাজ'),exact:true}));
    await click(page.getByRole('button',{name:label('Edit template','নমুনা বদলান'),exact:true}));
    dialog=page.getByRole('dialog',{name:label('Edit template','নমুনা বদলান'),exact:true});await dialog.waitFor();
    await dialog.getByRole('textbox',{name:nameLabel}).fill('QA Edited template');
    row=dialog.getByTestId('pos-cart-row').first();assert.equal(await row.locator('[data-testid="compound-quantity"] input').first().inputValue(),'2');
    assert.equal(await row.locator('[data-testid="compound-quantity"] input').nth(1).inputValue(),'5');
    await click(dialog.getByRole('button',{name:label('Save template','নমুনা রাখুন'),exact:true}));await dialog.waitFor({state:'hidden'});
    card=templates.locator('.divide-y > div').filter({hasText:'QA Edited template'});
    await click(card.getByRole('button',{name:label('Actions','কাজ'),exact:true}));await click(page.getByRole('button',{name:label('Duplicate','নকল তৈরি'),exact:true}));
    const copy=templates.locator('.divide-y > div').filter({hasText:'QA Edited template copy'});
    await click(copy.getByRole('button',{name:label('Use template','নমুনা দিয়ে বিক্রি করুন'),exact:true}));
    await page.getByRole('heading',{name:'Template sale',exact:true}).waitFor();
    await page.waitForFunction(()=>document.querySelectorAll('[data-testid="pos-cart-row"]').length===1);
    assert.equal(await page.getByTestId('pos-cart-row').count(),1,'created/edited/copied template loads actual cart');
    assert.equal(await page.getByTestId('pos-cart-row').locator('[data-testid="compound-quantity"] input').first().inputValue(),'2');
    await click(page.getByRole('button',{name:'Back to sales',exact:true}));
    await tab('Drafts & templates','খসড়া ও নমুনা');await copy.waitFor();
    await click(copy.getByRole('button',{name:label('Actions','কাজ'),exact:true}));await click(page.getByRole('button',{name:label('Delete','মুছুন'),exact:true}));await copy.waitFor({state:'hidden'});
    // Arrange a real Sonner action toast and prove the shared pointer rule preserves its control.
    await page.evaluate(async()=>{
     const url=performance.getEntriesByType('resource').map(entry=>entry.name).find(name=>name.includes('/sonner.js?'));
     if(!url)throw new Error('Sonner module was not loaded');
     const {toast}=await import(url);
     window.__salesNotificationActions=0;
     toast('QA interactive notification',{duration:Infinity,action:{label:'QA notification action',onClick:()=>{window.__salesNotificationActions++;}}});
    });
    await click(page.getByRole('button',{name:'QA notification action',exact:true}));
    assert.equal(await page.evaluate(()=>window.__salesNotificationActions),1,'notification controls remain interactive');
    await tab('Return history','ফেরতের ইতিহাস');await click(page.getByRole('button',{name:label('Actions for','কাজ:')+' RTN-000013',exact:true}));
    await click(page.getByRole('dialog',{name:label('Actions for','কাজ:')+' RTN-000013',exact:true}).getByRole('button',{name:label('Customer ledger','ক্রেতার খাতা'),exact:true}));
    await page.waitForURL(url=>url.hash.includes('/app/parties?')&&url.hash.includes('id=c1'),{waitUntil:'domcontentloaded'});
    assert.ok(page.url().includes('role=Customer'),'Customer role is selected');
    await page.goto(`http://127.0.0.1:${port}/#/app/sales?tab=return`,{waitUntil:'domcontentloaded'});await page.getByRole('checkbox').first().check();await quantity.fill('1');
    assert.ok(await page.getByRole('button',{name:label('Complete return','ফেরত সম্পন্ন করুন'),exact:true}).isDisabled(),'return history survives leaving Sales');
    assert.deepEqual(errors,[],'no browser exceptions');journeys++;
    console.log(`Sales audit regressions passed ${language} ${theme} ${width}x${height}`);
   }catch(error){console.error('Failure URL',page.url());throw new Error(`${language} ${theme} ${width}x${height}: ${error.stack}`);}
   finally{await ctx.close();}
  }
  const queue=[...cases];
  await Promise.all(Array.from({length:smoke?1:2},async()=>{while(queue.length)await runCase(queue.shift());}));
  console.log(JSON.stringify({journeys,scans,violations}));assert.deepEqual(violations,[]);
 }finally{await browser.close();await server.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
