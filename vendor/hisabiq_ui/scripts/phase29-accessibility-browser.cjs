/* Phase 29: eliminate measured screen-reader name mismatches and nested Party options.
 * Other axe findings (e.g. dashboard scroll-region focus) stay explicitly tracked.
 */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
async function main(){
 const {createServer}=await import('vite');
 const server=await createServer({server:{host:'127.0.0.1',port:4415,strictPort:true}});
 await server.listen();
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
 const axe=fs.readFileSync(require.resolve('axe-core/axe.min.js'),'utf8');
 try{
  for(const language of ['English','English + Bangla','Bangla']){
   const bn=language==='Bangla';
   const t=(en,bd)=>bn?bd:en;
   const context=await browser.newContext({viewport:{width:390,height:844},colorScheme:'light',hasTouch:true,reducedMotion:'reduce'});
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.addInitScript(lang=>localStorage.setItem('hisabiq-erp-personal-v1',JSON.stringify({
    mode:'Simple',language:lang,density:'Compact',terminology:'simple',dateView:'transaction'
   })),language);
   for(const route of ['app/dashboard','app/pos','app/parties?id=c1&role=Customer']){
    await page.goto('http://127.0.0.1:4415/#/'+route);
    await page.locator('#erp-main').waitFor();
    await page.waitForTimeout(100);
    await page.addScriptTag({content:axe});
    const results=await page.evaluate(async()=>{
     const a=await axe.run(document,{runOnly:{type:'rule',values:['label-content-name-mismatch','nested-interactive','scrollable-region-focusable']}});
     return a.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}));
    });
    assert.deepEqual(results,[],language+' '+route+' accessible names and interactive semantics');
    const user=page.getByRole('button',{name:t('User menu','ব্যবহারকারীর মেনু')});
    assert.ok(await user.isVisible(),language+' user menu accessible');
   }
   const picker=page.getByRole('button',{name:t('Party ledger date range','পক্ষের খাতার তারিখ')});
   await picker.click();
   await page.getByRole('dialog',{name:t('Party ledger date range calendar','পক্ষের খাতার তারিখ ক্যালেন্ডার')}).waitFor();
   await page.keyboard.press('Escape');
   const directory=page.getByRole('listbox',{name:t('Parties','পার্টি তালিকা')});
   assert.ok(await directory.getByRole('option').count()>0,'Parties remain keyboard-selectable options');
   await directory.getByRole('option').first().focus();
   assert.equal(await directory.getByRole('option').first().evaluate(el=>el===document.activeElement),true);
   assert.deepEqual(errors,[],language+' browser errors');
   console.log('Phase 29 measured accessible-name/Party-option checks passed: '+language);
   await context.close();
  }
 }finally{await browser.close();await server.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
