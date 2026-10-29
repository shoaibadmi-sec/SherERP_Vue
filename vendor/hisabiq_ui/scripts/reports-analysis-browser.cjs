/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires -- Browser verification uses CommonJS. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const screens=['overview','sales','stock','dues','money','advisor','profit','buying','cashflow','customers','library'];
async function main(){
 const {createServer}=await import('vite');
 const server=await createServer({server:{host:'127.0.0.1',port:4407,strictPort:true}});await server.listen();
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--disable-gpu']});
 const captures=process.env.REPORTS_SCREENSHOT_DIR||'/tmp/hisabiq-reports-captures';fs.mkdirSync(captures,{recursive:true});
 const errors=[];
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),page=await context.newPage();
  page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>localStorage.setItem('hisabiq-erp-personal-v1',JSON.stringify({mode:'Simple',language:'English',density:'Compact',terminology:'simple',dateView:'transaction'})));
  await page.goto('http://127.0.0.1:4407/#/app/reports');
  const nav=page.getByRole('tablist',{name:'Report destinations'});
  await page.locator('#reports-screen-overview[aria-selected=true]').waitFor();
  assert.equal(await nav.getByRole('tab').count(),11);
  assert.equal(await nav.getByRole('tab',{selected:true}).innerText(),'Overview');
  assert.equal(await page.locator('[data-report-summary]').count(),8);
  await page.getByRole('button',{name:'Open Recorded sales',exact:true}).click();
  await page.getByRole('dialog',{name:'Report details'}).waitFor();
  await page.getByRole('button',{name:'Close details',exact:true}).click();
  const salesBefore=await page.locator('[data-report-summary="sales-register"]').innerText();
  await page.goto('http://127.0.0.1:4407/#/app/reports?screen=overview&report=purchases');
  await page.getByRole('heading',{name:'Business overview',exact:true}).waitFor();
  assert.equal(await page.locator('[data-report-summary="sales-register"]').innerText(),salesBefore,'mismatched query must not label purchases as sales');
  await page.goto('http://127.0.0.1:4407/#/app/reports?screen=money');
  await page.getByText('Recorded expenses',{exact:true}).waitFor();
  const expenseBefore=(await page.locator('[data-analysis-metric="expenses"]').first().innerText()).match(/৳[\d,.]+/)[0];
  await page.goto('http://127.0.0.1:4407/#/app/reports?screen=money&account=Cash');
  const expenseMetric=page.locator('[data-analysis-metric="expenses"]').first();
  await expenseMetric.getByText('all accounts',{exact:true}).waitFor();
  assert.equal((await expenseMetric.innerText()).match(/৳[\d,.]+/)[0],expenseBefore,'unsupported account must not fabricate zero expense');
  await expenseMetric.click();
  await page.getByRole('heading',{name:'Recorded expenses · all accounts',exact:true}).waitFor();
  await page.getByRole('button',{name:'Close details',exact:true}).click();
  for(const screen of screens){
   await page.locator('#reports-screen-'+screen).click();
   assert.equal(new URLSearchParams((await page.evaluate(()=>location.hash)).split('?')[1]).get('screen'),screen);
   await page.locator('#reports-screen-'+screen+'[aria-selected=true]').waitFor();
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,screen+' desktop overflow');
  }
  await page.locator('#reports-screen-cashflow').click();
  await page.getByRole('spinbutton',{name:'Assumed opening cash (BDT)',exact:true}).fill('100000000000000000000');
  await page.locator('[data-scenario-error]').waitFor({timeout:2000});
  assert.equal(await page.getByRole('button',{name:'Save scenario',exact:true}).isDisabled(),true);
  await page.getByRole('spinbutton',{name:'Assumed opening cash (BDT)',exact:true}).fill('25000');
  await page.getByRole('spinbutton',{name:'Expected daily money in (BDT)',exact:true}).fill('500');
  await page.getByRole('button',{name:'Save scenario',exact:true}).click();
  await page.getByRole('button',{name:'Scenario saved',exact:true}).waitFor();
  await page.reload();
  assert.equal(await page.getByRole('spinbutton',{name:'Assumed opening cash (BDT)',exact:true}).inputValue(),'25000');
  await page.getByRole('button',{name:'Save view',exact:true}).click();
  await page.getByRole('textbox',{name:'View name'}).fill('Cash plan');
  await page.getByRole('button',{name:'Save this view',exact:true}).click();
  await page.locator('#reports-screen-stock').click();
  await page.getByRole('button',{name:'Saved views',exact:true}).click();
  await page.getByRole('button',{name:'Open Cash plan',exact:true}).click();
  assert.equal(await nav.getByRole('tab',{selected:true}).innerText(),'Cash forecast');
  await page.locator('#reports-screen-advisor').click();
  const before=await page.getByRole('button',{name:'Dismiss suggestion',exact:true}).count();assert.ok(before>0);
  await page.getByRole('button',{name:'Sources & calculation'}).first().click();
  await page.getByRole('dialog',{name:'Report details'}).waitFor();
  await page.getByRole('button',{name:'Close details',exact:true}).click();
  const stockPanel=page.getByRole('heading',{name:'Review the next purchase',exact:true}).locator('xpath=ancestor::section[1]');
  await stockPanel.getByRole('button',{name:'Sources & calculation'}).click();
  await page.getByRole('button',{name:'Close details',exact:true}).click();
  await stockPanel.getByText('Reviewed',{exact:true}).waitFor();
  await page.evaluate(async()=>{
   const store=await import('/src/data/erpDemoStore.ts'),cart=await import('/src/utils/purchaseCart.ts');
   const product=store.availableProducts().find(p=>p.stock>0&&p.stock<p.minStock-1);
   if(!product)throw new Error('Low-stock fixture required');
   const line={...cart.makePurchaseLine(product),bigQty:'0',smallQty:'1',unitQuantities:undefined,cost:'10',costUnit:product.unit};
   store.createPreviewPurchase({id:'review-refresh',ref:'PUR-REVIEW-REFRESH',date:'27 Oct 2026',businessDate:'2026-10-27',supplierId:'supplier',supplier:'Supplier',items:product.name,total:cart.lineAmount(line),paid:0,payments:[],roundingRule:'No rounding',cartSnapshot:[line],inventoryLines:[{productId:product.id,quantity:cart.baseQty(line),unitCost:cart.baseCost(line)}]});
  });
  await stockPanel.getByText('To review',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Dismiss suggestion',exact:true}).first().click();
  await page.getByRole('button',{name:'Restore dismissed',exact:true}).click();
  assert.equal(await page.getByRole('button',{name:'Dismiss suggestion',exact:true}).count(),before);
  await page.locator('#reports-screen-overview').click();
  const selected=nav.getByRole('tab',{selected:true});await selected.focus();await page.keyboard.press('ArrowRight');
  assert.equal(await nav.getByRole('tab',{selected:true}).innerText(),'Sales & profit');
  await page.keyboard.press('End');assert.equal(await nav.getByRole('tab',{selected:true}).innerText(),'Report library');
  await page.goto('http://127.0.0.1:4407/#/app/reports?report=sales-register');
  await page.getByRole('heading',{name:'Sales register',exact:true}).waitFor();
  const start=await page.locator('[data-report-row]').count();assert.ok(start>0);
  await page.getByRole('searchbox',{name:'Search report records'}).fill('no-source-here');
  await page.getByText('No records match your filters.',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Clear filters',exact:true}).click();
  assert.equal(await page.locator('[data-report-row]').count(),start);
  const downloadEvent=page.waitForEvent('download');await page.getByRole('button',{name:'Export CSV',exact:true}).click();
  const download=await downloadEvent;assert.match(fs.readFileSync(await download.path(),'utf8'),/INV-/);
  await context.close();
  const axe=fs.readFileSync(require.resolve('axe-core/axe.min.js'),'utf8');
  const profiles=[{width:1440,height:1000,theme:'light',language:'English'},{width:1024,height:768,theme:'dark',language:'English + Bangla'},{width:768,height:1024,theme:'light',language:'Bangla'},{width:390,height:844,theme:'dark',language:'Bangla'},{width:360,height:800,theme:'light',language:'English + Bangla'}];
  const violations=[];
  for(const profile of profiles){
   const ctx=await browser.newContext({viewport:{width:profile.width,height:profile.height},colorScheme:profile.theme,reducedMotion:'reduce'}),p=await ctx.newPage();
   p.on('pageerror',error=>errors.push(error.message));
   await p.addInitScript(profile=>{localStorage.setItem('hisabiq-theme',profile.theme);localStorage.setItem('hisabiq-erp-personal-v1',JSON.stringify({mode:'Simple',language:profile.language,density:'Compact',terminology:'simple',dateView:'transaction'}));},profile);
   for(const screen of screens){
    await p.goto('http://127.0.0.1:4407/#/app/reports?screen='+screen);
    await p.locator('#reports-screen-'+screen+'[aria-selected=true]').waitFor();
    await p.evaluate(()=>document.fonts.ready);
    assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,JSON.stringify({...profile,screen})+' page overflow');
    await p.addScriptTag({content:axe});
    const scan=await p.evaluate(async()=>window.axe.run(document.querySelector('[data-report-workspace]'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));
    for(const issue of scan.violations)violations.push({screen,profile,id:issue.id,nodes:issue.nodes.map(n=>({target:n.target,summary:n.failureSummary}))});
    if((profile.width===1440&&['overview','advisor','profit','cashflow'].includes(screen))||(profile.width===390&&['stock','advisor','cashflow'].includes(screen))||(profile.width===768&&screen==='buying'))await p.screenshot({path:path.join(captures,screen+'-'+profile.width+'-'+profile.theme+'.png'),fullPage:true});
   }
   await ctx.close();
  }
  fs.writeFileSync(path.join(captures,'axe-findings.json'),JSON.stringify(violations,null,2));
  assert.deepEqual(errors,[],'runtime errors');assert.deepEqual(violations,[],'Reports accessibility findings');
  console.log('PASS: 11 destinations, URL/history, 8 KPIs, evidence, saved scenarios/views, advisor actions, CSV, keyboard; 55 viewport/language/theme axe scans and overflow checks.');
 }finally{await browser.close();await server.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
