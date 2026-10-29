/* Phase 28: compact language-mode, tablet-orientation and accessibility gate.
 * Read-only navigation: no changes to source transactions or stored money.
 */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const langs=['English','English + Bangla','Bangla'];
const sizes=[
 {width:390,height:844,name:'phone portrait'},
 {width:768,height:1024,name:'tablet portrait'},
 {width:1024,height:768,name:'tablet landscape'},
 {width:1440,height:900,name:'desktop'}
];
const routes=[
 'app/dashboard','app/pos','app/counter','app/purchases/new','app/vendors',
 'app/products','app/parties?id=c1&role=Customer','app/finance','app/daybook',
 'app/reports','app/settings/personal'
];
const shouldRun=(route,size)=>size.width!==1024||['app/pos','app/purchases/new','app/vendors','app/parties?id=c1&role=Customer'].includes(route);
const results=[];
const problems=[];
async function main(){
 const {createServer}=await import('vite');
 const server=await createServer({server:{host:'127.0.0.1',port:4414,strictPort:true}});
 await server.listen();
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
 const axeScript=fs.readFileSync(require.resolve('axe-core/axe.min.js'),'utf8');
 try{
  for(const language of langs)for(const size of sizes)for(const theme of ['light','dark']){
   const context=await browser.newContext({
    viewport:{width:size.width,height:size.height},colorScheme:theme,
    hasTouch:size.width<=1024,reducedMotion:'reduce'
   });
   const page=await context.newPage();
   const errors=[];page.on('pageerror',err=>errors.push(err.message));
   await page.addInitScript(lang=>localStorage.setItem('hisabiq-erp-personal-v1',JSON.stringify({
    mode:'Simple',language:lang,density:'Compact',terminology:'simple',dateView:'transaction',
    searchMode:'Default'
   })),language);
   for(const route of routes){
    if(!shouldRun(route,size))continue;
    errors.length=0;
    await page.goto('http://127.0.0.1:4414/#/'+route);
    await page.locator('#erp-main').waitFor();
    await page.waitForTimeout(120);
    const scan=await page.evaluate(()=>({
     lang:document.documentElement.lang,
     viewport:innerWidth,
     scroll:document.documentElement.scrollWidth,
     main:!!document.querySelector('main#erp-main'),
     skip:!!document.querySelector('a[href="#erp-main"]')
    }));
    const record={language,screen:size.name,width:size.width,theme,route,...scan,errors:[...errors]};
    results.push(record);
    const expectedLang=language==='Bangla'?'bn':'en';
    if(scan.lang!==expectedLang||scan.scroll>scan.viewport+2||!scan.main||!scan.skip||errors.length){
     problems.push(record);
    }
    // Audit, rather than falsely certify, accessibility rules that the rest of
    // the product may still violate. Export actionable rule/selector evidence.
    if(size.width===390&&theme==='light'&&['app/dashboard','app/pos','app/parties?id=c1&role=Customer'].includes(route)){
     await page.addScriptTag({content:axeScript});
     const findings=await page.evaluate(async()=>{
      const audit=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}});
      return audit.violations.map(v=>({
       id:v.id,impact:v.impact,description:v.help,
       selectors:v.nodes.slice(0,5).map(n=>n.target.join(' '))
      }));
     });
     if(findings.length)problems.push({kind:'axe-findings',language,route,findings});
    }
   }
   // The skip link must still move keyboard focus to the main ERP task region.
   if(size.width===390&&theme==='light'){
    await page.goto('http://127.0.0.1:4414/#/app/dashboard');
    await page.locator('#erp-main').waitFor();
    await page.locator('a[href="#erp-main"]').focus();
    await page.keyboard.press('Enter');
    const target=await page.evaluate(()=>document.activeElement?.id);
    if(target!=='erp-main')problems.push({kind:'skip-focus',language,target});
   }
   await context.close();
   console.log('Phase 28',language,size.name,theme,'checked');
  }
  if(process.env.PHASE28_AUDIT_OUTPUT){
   fs.mkdirSync(require('node:path').dirname(process.env.PHASE28_AUDIT_OUTPUT),{recursive:true});
   fs.writeFileSync(process.env.PHASE28_AUDIT_OUTPUT,JSON.stringify({screens:results,findings:problems},null,2));
  }
  const blockers=problems.filter(p=>p.kind!=='axe-findings');
  const axeCases=problems.filter(p=>p.kind==='axe-findings');
  console.log('Phase 28:',results.length,'route renders;',axeCases.length,'axe audit cases with findings;',blockers.length,'hard failures');
  for(const p of axeCases)console.warn('Accessibility findings (recorded for Phase 29):',JSON.stringify(p));
  assert.deepEqual(blockers,[],'Language, runtime, skip-focus or page overflow regression');
 }finally{await browser.close();await server.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
