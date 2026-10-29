/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires -- Browser verification uses CommonJS. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
async function main(){
 const {createServer}=await import('vite');
 const server=await createServer({server:{host:'127.0.0.1',port:4398,strictPort:true}});await server.listen();
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>localStorage.setItem('hisabiq-erp-personal-v1',JSON.stringify({mode:'Simple',language:'English',density:'Compact',terminology:'simple',dateView:'transaction'})));
  await page.goto('http://127.0.0.1:4398/#/app/reports');
  await page.locator('[data-magic-patterns-reports=overview]').waitFor();
  await page.locator('#reports-screen-library').click();
  await page.getByRole('tablist',{name:'Report groups'}).getByRole('tab',{name:'Sales & profit',exact:true}).click();
  await page.waitForURL(/report=sales-register/);
  await page.getByRole('button',{name:'Product performance',exact:true}).click();
  await page.waitForURL(/report=product-sales/);
  await page.goBack();await page.waitForURL(/report=sales-register/);
  const initial=await page.locator('[data-report-row]').count();assert.ok(initial>0);
  await page.getByRole('combobox',{name:'Compare',exact:true}).click();
  await page.getByRole('option',{name:'Previous period',exact:true}).click();
  await page.getByText(/Previous period:/).waitFor();
  await page.getByRole('button',{name:'Filters',exact:true}).click();
  await page.getByRole('combobox',{name:'Status',exact:true}).click();
  await page.getByRole('option',{name:'Due',exact:true}).click();
  assert.ok(await page.locator('[data-report-row]').count()<initial);
  await page.getByRole('button',{name:'Clear filters',exact:true}).click();
  await page.getByRole('searchbox',{name:'Search report records'}).fill('not-a-real-record');
  await page.getByText('No records match your filters.',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Clear filters',exact:true}).click();
  assert.equal(await page.locator('[data-report-row]').count(),initial);
  await page.locator('[data-report-row]').first().getByRole('button').first().click();
  await page.getByRole('dialog',{name:'Report details'}).waitFor();
  await page.getByRole('button',{name:'Close details',exact:true}).click();
  await page.getByRole('button',{name:'Columns',exact:true}).click();
  await page.getByRole('dialog',{name:'Visible columns'}).waitFor();
  await page.getByLabel('Paid',{exact:true}).uncheck();
  await page.getByRole('button',{name:'Done',exact:true}).click();
  assert.equal(await page.getByRole('columnheader',{name:'Paid',exact:true}).count(),0);
  await page.getByRole('button',{name:'Save view',exact:true}).click();
  await page.getByRole('textbox',{name:'View name'}).fill('Owner sales');
  await page.getByRole('button',{name:'Save this view'}).click();
  await page.reload();await page.waitForURL(/report=sales-register/);
  await page.getByRole('button',{name:'Saved views',exact:true}).click();
  await page.getByRole('button',{name:'Open Owner sales',exact:true}).click();
  const downloadEvent=page.waitForEvent('download');await page.getByRole('button',{name:'Export CSV',exact:true}).click();
  const download=await downloadEvent;const csv=fs.readFileSync(await download.path(),'utf8');assert.match(csv,/INV-/);assert.ok(!csv.split('\n')[0].includes('"Paid"'));
  await page.getByRole('tab',{name:'Stock & buying',exact:true}).click();
  await page.getByRole('button',{name:'Purchase planner',exact:true}).click();
  await page.getByRole('spinbutton',{name:'Lead time (days)'}).fill('10');
  await page.getByRole('spinbutton',{name:'Review interval (days)'}).fill('7');
  await page.getByRole('spinbutton',{name:'Safety stock (base units)'}).fill('40');
  await page.getByText('Assumptions apply in each product’s base unit.',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Download purchase list',exact:true}).click();
  await page.goto('http://127.0.0.1:4398/#/app/reports?report=sales-register&from=invalid&to=2026-10-01');
  await page.getByRole('alert').filter({hasText:'Choose a valid date range'}).waitFor();
  assert.equal(await page.locator('[data-report-row]').count(),0);
  await page.goto('http://127.0.0.1:4398/#/app/reports?report=sales-register&from=&to=');
  await page.locator('[data-report-row]').first().waitFor();
  await page.getByRole('button',{name:/^Report date range:/}).click();
  const calendar=page.getByRole('dialog',{name:/Report date range.*calendar/});
  await calendar.getByRole('button',{name:'Last month',exact:true}).click();
  await calendar.getByRole('button',{name:'Apply',exact:true}).click();
  const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Dhaka' }));
  const previousMonth = new Date(Date.UTC(today.getFullYear(), today.getMonth() - 1, 1)).toISOString().slice(0, 10);
  assert.equal(new URLSearchParams(page.url().split('?')[1]).get('from'), previousMonth);
  assert.deepEqual(errors,[]);
  await context.close();
  for(const profile of [{width:390,height:844,theme:'dark',language:'Bangla'},{width:768,height:1024,theme:'light',language:'English + Bangla'},{width:1440,height:1000,theme:'light',language:'English'}]){
   const c=await browser.newContext({viewport:{width:profile.width,height:profile.height},reducedMotion:'reduce'}),p=await c.newPage();
   await p.addInitScript(v=>{localStorage.setItem('hisabiq-theme',v.theme);localStorage.setItem('hisabiq-erp-personal-v1',JSON.stringify({mode:'Simple',language:v.language,density:'Compact',terminology:'simple',dateView:'transaction'}));},profile);
   await p.goto('http://127.0.0.1:4398/#/app/reports');
   await p.locator('[data-magic-patterns-reports=overview]').waitFor();
   assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   fs.mkdirSync('.impeccable/review',{recursive:true});
   await p.screenshot({path:'.impeccable/review/'+(profile.width===390?'mobile':profile.width===768?'tablet':'desktop')+'.png',fullPage:true});
   await c.close();
  }
  console.log('Reports workspace: filters, detail, columns, saved views, CSV, planner, responsive languages/themes passed.');
 }finally{await browser.close();await server.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
