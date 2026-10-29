/* Sales & Profit Experiment: separate tab, unchanged originals, real Library controls. */
const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const dir=path.resolve('test-results/sales-hybrid');
const profiles=[
 {width:1440,height:940,theme:'light',language:'English + Bangla'},
 {width:1024,height:800,theme:'dark',language:'English + Bangla'},
 {width:768,height:1000,theme:'light',language:'English + Bangla'},
 {width:390,height:844,theme:'light',language:'English + Bangla'},
 {width:360,height:800,theme:'dark',language:'Bangla'}
];
async function main(){
 fs.mkdirSync(dir,{recursive:true});
 const {preview}=await import('vite');
 const server=await preview({preview:{host:'127.0.0.1',port:4297,strictPort:true}});
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
 try{
  for(const profile of profiles){
   const context=await browser.newContext({viewport:{width:profile.width,height:profile.height},reducedMotion:'reduce',acceptDownloads:true});
   await context.addInitScript(({theme,language})=>{
    localStorage.setItem('hisabiq-theme',theme);
    localStorage.setItem('hisabiq-erp-personal-v1',JSON.stringify({mode:'Simple',language,density:'Compact',terminology:'simple',dateView:'transaction',searchMode:'Default'}));
   },profile);
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   const en=profile.language!=='Bangla';
   await page.goto('http://127.0.0.1:4297/#/app/reports?screen=sales-lab&report=sales-register');
   await page.locator('[data-sales-hybrid]').waitFor({timeout:18000});
   assert.equal(await page.locator('[id^="reports-screen-"][role="tab"]').count(),12,'11 original destinations plus one new experiment');
   assert.equal(await page.locator('#reports-screen-sales-lab').getAttribute('aria-selected'),'true');
   assert.equal(await page.getByRole('searchbox',{name:en?'Search report records':'রিপোর্টের রেকর্ড খুঁজুন'}).count(),1,'one shared library toolbar');
   assert.equal(await page.locator('[data-magic-patterns-reports="sales"]').count(),0,'original screen is not duplicated by default');
   assert.equal(await page.locator('[data-sales-hybrid] .recharts-surface').count()>0,true,'existing sales trend chart reused');
   assert(await page.getByRole('button',{name:en?'Columns':'কলাম'}).count()>0,'column visibility control retained');
   const suffix=profile.language==='Bangla'?'bn':'en-bn';
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+3),'hybrid viewport has no document horizontal overflow');
   await page.screenshot({path:path.join(dir,`${profile.width}-${profile.theme}-${suffix}-hybrid.png`),fullPage:true,animations:'disabled'});
   await page.getByRole('combobox',{name:en?'Choose detailed Sales & Profit report':'বিক্রি ও লাভের রিপোর্ট বাছুন'}).click();
   await page.getByRole('option',{name:en?'Product performance':'পণ্যভিত্তিক বিক্রয়'}).click();
   assert(page.url().includes('report=product-sales'),'experiment selection persists URL');
   assert.equal(await page.locator('#reports-screen-sales-lab').getAttribute('aria-selected'),'true');
   assert((await page.locator('[data-report-row]').count())>=1,'library detail rows accessible');
   const first=page.locator('[data-report-row]').first().getByRole('button').first();
   await first.click();
   await page.getByRole('dialog',{name:en?'Report details':'রিপোর্টের বিস্তারিত'}).waitFor();
   await page.getByRole('button',{name:en?'Close details':'বিস্তারিত বন্ধ করুন'}).click();
   await page.getByRole('button',{name:en?'Hide summary':'সারাংশ আড়াল'}).click();
   assert.equal(await page.locator('#sales-experiment-visual').count(),0,'summary can collapse for table-focused work');
   await page.getByRole('button',{name:en?'Show summary':'সারাংশ দেখুন'}).click();
   await page.getByRole('button',{name:en?'Original Magic Patterns grouping':'মূল Magic Patterns গ্রুপিং'}).click();
   assert.equal(await page.getByRole('heading',{name:'Sales & profit',exact:true}).count(),1,'unmodified original Magic Patterns component shown on demand');
   await page.getByRole('button',{name:en?'Original Sales & profit':'মূল বিক্রি ও লাভ'}).click();
   await page.locator('[data-magic-patterns-reports="sales"]').waitFor();
   assert.equal(await page.locator('[data-sales-hybrid]').count(),0,'original Sales & profit is separate');
   await page.locator('#reports-screen-library').click();
   await page.locator('#report-panel').waitFor();
   assert.equal(await page.locator('#reports-screen-panel').getByRole('tablist',{name:en?'Report groups':'রিপোর্টের বিভাগ'}).getByRole('tab').count(),7,'original report library unchanged');
   assert.deepEqual(errors,[],'no runtime exceptions');
   await context.close();
   console.log('PASS Sales hybrid '+profile.width+' '+profile.theme+' '+profile.language);
  }
 }finally{await browser.close();await new Promise(resolve=>server.httpServer.close(resolve));}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
