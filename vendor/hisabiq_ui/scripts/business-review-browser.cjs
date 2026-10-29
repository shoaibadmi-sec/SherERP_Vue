/* Interactive audit review smoke: source is the built Vite app and canonical report preview. */
const { chromium }=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const out=path.resolve('test-results/business-review');
const profiles=[
 {width:1440,height:900,language:'English + Bangla',theme:'light'},
 {width:1024,height:768,language:'English + Bangla',theme:'dark'},
 {width:768,height:1024,language:'English + Bangla',theme:'light'},
 {width:390,height:844,language:'English + Bangla',theme:'light'},
 {width:360,height:800,language:'Bangla',theme:'dark'}
];
async function main(){
 fs.mkdirSync(out,{recursive:true});
 const {preview}=await import('vite');
 const server=await preview({preview:{host:'127.0.0.1',port:4292,strictPort:true}});
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
 try{
 for(const p of profiles){
  const context=await browser.newContext({viewport:{width:p.width,height:p.height},reducedMotion:'reduce',acceptDownloads:true});
  await context.addInitScript(({language,theme})=>{
   localStorage.setItem('hisabiq-theme',theme);
   localStorage.setItem('hisabiq-erp-personal-v1',JSON.stringify({mode:'Simple',language,density:'Compact',terminology:'simple',dateView:'transaction',searchMode:'Default'}));
  },p);
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4292/#/app/reports?workspace=business-review');
  await page.locator('[data-business-review]').waitFor({timeout:18000});
  assert.equal(await page.locator('[data-business-review] [role="tab"]').count(),4,'four internal review tabs');
  assert.equal(await page.locator('[data-business-review] [data-hisabiq-select]').count(),1,'shared HisabIQ select');
  assert(await page.locator('[data-business-review]').getByText(/not a certified audit|প্রত্যয়িত অডিট/i).count()>0,'uncertified disclaimer shown');
  const suffix=p.language==='Bangla'?'bn':'en';
  const isBn=p.language==='Bangla';
  // Audits use a real HisabIQ calendar for month/year rather than unthemed native text inputs.
  const monthTrigger=page.getByRole('button',{name:isBn?'মাস বাছুন':'Choose month'});
  await monthTrigger.click();
  const monthDialog=page.getByRole('dialog',{name:isBn?'মাস বাছুন ক্যালেন্ডার':'Choose month calendar'});
  await monthDialog.waitFor({state:'visible'});
  assert.equal(await monthDialog.locator('[data-month-value]').count(),12,'12 month options in calendar');
  await monthDialog.locator('[data-month-value="2026-09"]').click();
  await monthDialog.waitFor({state:'hidden'});
  assert(await page.getByText('2026-09-01 – 2026-09-30').count()>0,'month selection updates period');
  assert.equal(await page.locator('input[type="month"]').count(),0,'browser-dependent native month input removed');
  await page.screenshot({path:path.join(out,p.width+'-'+p.theme+'-'+suffix+'-summary.png'),fullPage:true,animations:'disabled'});
  await page.getByRole('combobox',{name:isBn?'অডিটের সময়কাল':'Audit period'}).click();
  await page.getByRole('option',{name:isBn?'বার্ষিক অডিট রিপোর্ট':'Yearly audit report'}).click();
  await page.getByRole('button',{name:isBn?'বছর বাছুন':'Choose year'}).click();
  const yearDialog=page.getByRole('dialog',{name:isBn?'বছর বাছুন ক্যালেন্ডার':'Choose year calendar'});
  await yearDialog.waitFor({state:'visible'});
  assert((await yearDialog.locator('[data-year-value]').count())>=10,'year picker options visible');
  await yearDialog.locator('[data-year-value="2025"]').click();
  assert(await page.getByText('2025-01-01 – 2025-12-31').count()>0,'year selection updates period');
  await page.getByRole('tab',{name:isBn?'মাসভিত্তিক হিসাব':'Monthly figures'}).click();
  assert(await page.locator('[data-business-review] table tbody tr').count()>=1,'yearly monthly schedule visible');
  await page.screenshot({path:path.join(out,p.width+'-'+p.theme+'-'+suffix+'-months.png'),fullPage:true,animations:'disabled'});
  await page.getByRole('tab',{name:isBn?'নথি':'Documents'}).click();
  const downloadPromise=page.waitForEvent('download',{timeout:10000});
  await page.getByRole('button',{name:isBn?'সিএসভি নামান':'Download CSV'}).click();
  const download=await downloadPromise;
  assert(download.suggestedFilename().endsWith('.csv'),'exports real CSV data');
  const popupPromise=page.waitForEvent('popup',{timeout:15000});
  await page.getByRole('button',{name:isBn?'৫ পাতার A4 অডিট রিপোর্ট প্রিন্ট':'Print 5-page A4 audit report'}).click();
  const printed=await popupPromise;
  await printed.locator('.audit-page').first().waitFor();
  assert.equal(await printed.locator('.audit-page').count(),5,'five A4 portrait report pages');
  assert((await printed.locator('svg.audit-chart').count())>=5,'each page retains a vector chart');
  assert.equal(await printed.locator('.audit-page footer .page-index').count(),5,'each page has page numbering');
  assert((await printed.locator('style').textContent()).includes('size:A4 portrait'),'print paper size A4 portrait');
  for(let i=0;i<5;i++){
   const frame=printed.locator('.audit-page').nth(i);
   assert((await frame.locator('svg.audit-chart').count())>=1,'chart rendered on page '+(i+1));
   const bounds=await frame.evaluate(node=>{
    const content=node.querySelector('.page-content'),footer=node.querySelector('footer');
    return {last:content.getBoundingClientRect().bottom,footer:footer.getBoundingClientRect().top};
   });
   assert(bounds.last<=bounds.footer+2,'page '+(i+1)+' content must not overlap footer');
  }
  if(p.width===1440){
   await printed.pdf({path:path.join(out,'audit-5-page-A4.pdf'),printBackground:true,preferCSSPageSize:true});
   for(let i=0;i<5;i++)await printed.locator('.audit-page').nth(i).screenshot({path:path.join(out,'audit-page-'+(i+1)+'.png')});
  }
  await printed.close();
  await page.getByRole('tab',{name:isBn?'পর্যালোচনার ইতিহাস':'Review history'}).click();
  assert.equal(await page.locator('[data-business-review] [role="tab"]').count(),4);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+3),'no document horizontal overflow');
  assert.deepEqual(errors,[],'runtime exceptions');
  await context.close();
  console.log('PASS Business Review '+JSON.stringify(p));
 }
 }finally{await browser.close();await new Promise(resolve=>server.httpServer.close(resolve));}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
