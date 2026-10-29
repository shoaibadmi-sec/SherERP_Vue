/* Cross-module fuzzy filters retain reference, role and status identity. */
const {chromium}=require('playwright');const {expect}=require('playwright/test');const assert=require('node:assert/strict');
async function main(){const {createServer}=await import('vite');const port=4871;const server=await createServer({server:{host:'127.0.0.1',port,strictPort:true}});await server.listen();const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});let journeys=0;
try{for(const language of ['English','English + Bangla','Bangla'])for(const theme of ['light','dark']){
 const ctx=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,colorScheme:theme,reducedMotion:'reduce'});const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://fonts.googleapis.com/**',r=>r.abort());await page.addInitScript(({language,theme})=>{localStorage.setItem('hisabiq-theme',theme);localStorage.setItem('hisabiq-erp-personal-v1',JSON.stringify({mode:'Simple',language,density:'Compact',terminology:'simple',dateView:'transaction'}));},{language,theme});const t=(en,bn)=>language==='Bangla'?bn:en;const go=async path=>{await page.evaluate(path=>{location.hash=path;},path);await page.waitForURL(url=>url.hash==='#'+path);};
 try{
  await page.goto(`http://127.0.0.1:${port}/#/app/purchases`,{waitUntil:'domcontentloaded'});
  await page.getByRole('textbox',{name:t('Search purchases','কেনাকাটা খুঁজুন'),exact:true}).fill('Karim tradres');
  await page.getByRole('button',{name:t('Actions for','কাজ:')+' PUR-000118',exact:true}).waitFor();
  await page.getByRole('combobox',{name:t('Purchase status filter','ক্রয়ের অবস্থা বাছুন'),exact:true}).tap();await page.locator('[role="option"][data-value="Due"]').tap();
  await expect(page.getByRole('button',{name:t('Actions for','কাজ:')+' PUR-000112',exact:true})).toHaveCount(0);await page.getByRole('button',{name:t('Actions for','কাজ:')+' PUR-000118',exact:true}).waitFor();
  await go('/app/expenses');const expense=page.getByPlaceholder(t('Search expense, payee, category or reference','খরচ, প্রাপক, ধরন বা রেফারেন্স খুঁজুন'));await expense.fill('Shapla tranpsort');await page.getByRole('button',{name:t('Actions for','কাজের তালিকা:')+' EXP-000061',exact:true}).waitFor();
  await go('/app/quotations');const quote=page.getByRole('textbox',{name:t('Search quotations','কোটেশন খুঁজুন'),exact:true});await quote.fill('Rahamn hardwre');await page.getByRole('button',{name:'QT-000041',exact:true}).waitFor();await quote.fill('QT-000042');await expect(page.getByRole('button',{name:'QT-000041',exact:true})).toHaveCount(0);await page.getByRole('button',{name:'QT-000042',exact:true}).waitFor();
  await go('/app/parties');const directory=page.getByRole('textbox',{name:t('Search parties','পার্টি খুঁজুন'),exact:true});await directory.fill('Rahamn hardwre');await page.getByRole('option').filter({hasText:'Rahman Hardware'}).first().waitFor();
  await go('/app/vendors');await page.getByRole('textbox',{name:'Search Vendors',exact:true}).fill('Shapla tranpsort');await page.getByRole('button').filter({hasText:'Shapla Transport'}).first().waitFor();
  await go('/app/settings/personal');await page.getByRole('textbox',{name:'Search settings',exact:true}).fill('rounidng');await page.getByRole('button').filter({hasText:/rounding/i}).first().waitFor();
  assert.deepEqual(errors,[]);journeys++;console.log(`Fuzzy module filters passed ${language} ${theme}`);
 }catch(error){console.error(await page.locator('body').innerText());throw error;}finally{await ctx.close();}
}console.log(JSON.stringify({journeys}));}finally{await browser.close();await server.close();}}
main().catch(error=>{console.error(error);process.exitCode=1;});
