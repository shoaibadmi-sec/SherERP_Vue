/* Phase 29: DOM-based candidates for untranslated human-facing UI copy.
 * Heuristic inventory, NOT certification; English may be a brand, ID or source value.
 * Read-only: no POS posting or ledger mutation.
 */
const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const routes=[
 'app/dashboard','app/pos','app/counter','app/sales','app/quotations',
 'app/online-sales','app/notifications','app/warranty','app/reconciliation',
 'app/finance','app/daybook','app/accounts','app/audit-ledger',
 'app/products','app/parties','app/purchases','app/purchases/new','app/vendors',
 'app/expenses','app/reports','app/settings/business','app/settings/personal',
 'app/settings/products','app/settings/data','app/subscription','app/support'
];
const criteria='h1,h2,h3,h4,button,[role="tab"],th,label,[role="alert"],input[placeholder],textarea[placeholder]';
async function main(){
 const {createServer}=await import('vite');
 const server=await createServer({server:{host:'127.0.0.1',port:4416,strictPort:true}});
 await server.listen();
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
 const result=[],exceptions=[];
 try{
  for(const width of [390,1440]){
   const context=await browser.newContext({viewport:{width,height:width===390?844:900},hasTouch:width===390,reducedMotion:'reduce'});
   const page=await context.newPage();
   await page.addInitScript(()=>localStorage.setItem('hisabiq-erp-personal-v1',JSON.stringify({
    mode:'Simple',language:'Bangla',density:'Compact',terminology:'simple',dateView:'transaction'
   })));
   page.on('pageerror',error=>exceptions.push(error.message));
   for(const route of routes){
    await page.goto('http://127.0.0.1:4416/#/'+route);
    await page.locator('#erp-main').waitFor();
    await page.waitForTimeout(100);
    const candidates=await page.evaluate(selector=>Array.from(document.querySelectorAll(selector)).flatMap(node=>{
     const rect=node.getBoundingClientRect(),style=getComputedStyle(node);
     if(!rect.width||!rect.height||style.visibility==='hidden'||style.display==='none')return [];
     const t=node instanceof HTMLInputElement||node instanceof HTMLTextAreaElement
      ?node.placeholder.trim():node.textContent?.replace(/\s+/g,' ').trim()||'';
     if(!/[A-Za-z]{3,}/.test(t))return [];
     return [{element:node.tagName.toLowerCase(),copy:t.slice(0,140)}];
    }).slice(0,80),criteria);
    result.push({route,width,candidateCount:candidates.length,candidates});
   }
   await context.close();
  }
  const report={generatedAt:new Date().toISOString(),scope:'Visible human-facing DOM labels in full Bangla mode; English is only a review candidate',routes:result,errors:exceptions};
  if(process.env.PHASE29_CENSUS_OUTPUT){
   fs.mkdirSync(path.dirname(process.env.PHASE29_CENSUS_OUTPUT),{recursive:true});
   fs.writeFileSync(process.env.PHASE29_CENSUS_OUTPUT,JSON.stringify(report,null,2));
  }
  console.log('Phase 29 DOM language candidate census:',result.length,'route-width renders;',
   result.reduce((n,row)=>n+row.candidateCount,0),'review candidates;',exceptions.length,'uncaught errors');
  for(const row of result.filter(r=>r.candidateCount))console.log(row.route,row.width,'candidates:',row.candidateCount,'sample:',row.candidates.slice(0,3).map(c=>c.copy));
  if(exceptions.length)throw Error('Uncaught errors in census: '+exceptions.slice(0,6).join('; '));
 }finally{await browser.close();await server.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
