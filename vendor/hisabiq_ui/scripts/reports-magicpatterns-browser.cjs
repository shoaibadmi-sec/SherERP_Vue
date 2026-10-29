/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires -- Playwright CLI uses CommonJS. */
// Focused visual and functional smoke for directly imported Magic Patterns Reports.
// Screenshots are private PR artifacts; no deployment or production data is touched.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const screens=['advisor','profit','buying','cashflow','customers','overview','sales','stock','dues','money','library'];
const out=path.resolve('test-results/reports-magicpatterns');
const presets=[
 {width:1440,theme:'light',language:'English + Bangla'},
 {width:1024,theme:'light',language:'English + Bangla'},
 {width:768,theme:'light',language:'English + Bangla'},
 {width:390,theme:'light',language:'English + Bangla'},
 {width:1440,theme:'dark',language:'English + Bangla'},
 {width:390,theme:'dark',language:'English + Bangla'},
 {width:390,theme:'light',language:'Bangla'},
 {width:390,theme:'dark',language:'Bangla'},
];
async function main(){
 fs.mkdirSync(out,{recursive:true});
 const {preview}=await import('vite');
 const server=await preview({preview:{host:'127.0.0.1',port:4262,strictPort:true}});
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
 try{
  for(const p of presets){
   const context=await browser.newContext({viewport:{width:p.width,height:900},reducedMotion:'reduce'});
   await context.addInitScript(({theme,language})=>{
    localStorage.setItem('hisabiq-theme',theme);
    localStorage.setItem('hisabiq-erp-personal-v1',JSON.stringify({mode:'Simple',language,density:'Compact',terminology:'simple',dateView:'transaction',searchMode:'Default'}));
   },p);
   const page=await context.newPage();
   const errors=[];
   page.on('pageerror',e=>errors.push(e.stack||e.message));
   await page.goto('http://127.0.0.1:4262/#/app/reports');
   try{
    await page.locator('[data-report-workspace]').waitFor({timeout:18000});
    await page.locator('#reports-screen-overview').waitFor({timeout:18000});
   }catch(e){
    const body=await page.locator('body').innerText().catch(()=>'<body failed>');
    fs.writeFileSync(path.join(out,`ERROR-${p.width}-${p.theme}.txt`),JSON.stringify({errors,body:body.slice(0,4000)},null,2));
    throw e;
   }
   assert.equal(await page.locator('[id^="reports-screen-"][role="tab"]').count(),12,'keep all 11 originals plus the experiment');
   assert.equal(await page.locator('#reports-screen-advisor svg.lucide-sparkles').count(),1,'keep Sparkles icon');
   for(const id of screens){
    await page.locator('#reports-screen-'+id).click();
    if(id!=='library'){
     await page.locator('[data-magic-patterns-reports="'+id+'"]').waitFor({timeout:15000});
     assert.equal(await page.getByText('What deserves attention next, and what evidence supports it?',{exact:true}).count(),0,'rejected duplicate helper absent');
     assert.equal(await page.getByText('Supporting report:',{exact:false}).count(),0,'no extra generic source table');
     assert.equal(await page.locator('[data-magic-period-strip]').count(),1,'original period/as-of strip');
    }else{
     await page.locator('#report-panel').waitFor();
     assert((await page.locator('#report-panel').innerText()).length>40,'library retains tools');
     const groupTabs=page.locator('#reports-screen-panel').getByRole('tablist',{name:p.language==='Bangla'?'রিপোর্টের বিভাগ':'Report groups',exact:true}).getByRole('tab');
     assert.equal(await groupTabs.count(),7,'all seven Library groups remain available');
     for(let group=0;group<7;group++){
      await groupTabs.nth(group).click();
      if(p.width>=1024){
       const sidebar=page.locator('#reports-screen-panel aside');
       const content=page.locator('#report-panel > :visible').first();
       const [sidebarBox,contentBox]=await Promise.all([sidebar.boundingBox(),content.boundingBox()]);
       assert(sidebarBox&&contentBox,'Library sidebar and report panel must both be visible');
       assert(Math.abs(sidebarBox.y-contentBox.y)<=2,
        'Report Library filter and sidebar must begin on the same horizontal line in group '+group+
        ' (sidebar y='+sidebarBox.y+', report y='+contentBox.y+')');
      }
      assert.equal(await page.getByText('What needs your attention?',{exact:true}).count(),0,'no redundant question in Library group '+group);
      assert.equal(await page.locator('#report-panel h2').count(),0,'no duplicate report title in Library group '+group);
      assert.equal(await page.getByRole('group',{name:p.language==='Bangla'?'রিপোর্টের কাজ':'Report actions'}).count(),1,'retain report actions in group navigation');
     }
     await groupTabs.first().click();
    }
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+3),'no app-wide horizontal overflow: '+id+' / '+JSON.stringify(p));
    const suffix=p.language==='Bangla'?'bn':'en-bn';
    // The imported Recharts components animate on mount. Capture after their original animation cycle.
    if(['overview','profit','cashflow'].includes(id))await page.waitForTimeout(1700);
    await page.screenshot({path:path.join(out,`${p.width}-${p.theme}-${suffix}-${id}.png`),fullPage:true,animations:'disabled'});
   }
   if(p.width===1440&&p.theme==='light'){
    await page.locator('#reports-screen-cashflow').click();
    await page.locator('[data-magic-patterns-reports="cashflow"]').waitFor();
    assert.equal(await page.getByText('Cash forecast — next 30 days').count(),1);
    assert.equal(await page.getByText('Week by week').count(),1);
    assert.equal(await page.getByText('Working capital').count(),1);
    assert.equal(await page.locator('[data-magic-patterns-reports="cashflow"] svg.recharts-surface').count(),1,'original cash chart present');
    await page.getByLabel('If customers pay').selectOption('15');
    await page.getByLabel('Include stock purchases').uncheck();
    assert.equal(await page.getByLabel('Include stock purchases').isChecked(),false);
    await page.getByText('Opening cash (assumed)',{exact:true}).first().click();
    await page.getByRole('dialog').waitFor();
    assert.match(await page.getByRole('dialog').innerText(),/Illustrative projection/);
    await page.getByRole('button',{name:/Close details/}).click();
    await page.locator('#reports-screen-profit').click();
    await page.locator('[data-magic-patterns-reports="profit"] svg.recharts-surface').first().waitFor();
    const bubbleCount=await page.locator('[data-magic-patterns-reports="profit"] .recharts-scatter').count();
    if(!bubbleCount){
     assert.equal(await page.getByText('No products with known historical issue costs to plot.',{exact:false}).count(),1,
      'When sale-time costs are unknown, Profit Insights must disclose why scatter bubbles are unavailable');
    }
    // Table links are the keyboard/touch alternative to scatter marks.
    const links=page.locator('[data-magic-patterns-reports="profit"] button').filter({hasText:/Pipe|Cable|Switch|Wire/});
    if(await links.count()){
      await links.first().click();
      await page.getByRole('dialog').waitFor();
      await page.getByRole('button',{name:/Close details/}).click();
    }
    await page.locator('#reports-screen-overview').focus();
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('#reports-screen-sales').getAttribute('aria-selected'),'true','keyboard tabs advance');
   }
   assert.deepEqual(errors,[],'console runtime errors in '+JSON.stringify(p));
   await context.close();
   console.log('PASS Magic Reports '+p.width+' '+p.theme+' '+p.language+'; original 11 screens retained');
  }
 }finally{await browser.close();await new Promise(resolve=>server.httpServer.close(resolve));}
}
main().catch(err=>{console.error(err);process.exitCode=1;});
