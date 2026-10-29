/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires -- Playwright CLI scripts use CommonJS. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
async function main(){
 const{createServer}=await import('vite');const server=await createServer({server:{host:'127.0.0.1',port:4303,strictPort:true}});await server.listen();
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
 try{for(const theme of ['light','dark'])for(const width of [390,768,1024,1440]){
  const context=await browser.newContext({viewport:{width,height:960},hasTouch:width<1024,reducedMotion:'reduce',acceptDownloads:true});
  await context.addInitScript(theme=>{localStorage.setItem('hisabiq-theme',theme);window.print=()=>undefined;},theme);
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const choose=async(label,value)=>{await page.getByRole('combobox',{name:label,exact:true}).click();await page.getByRole('option',{name:value,exact:true}).click();};
  await page.goto('http://127.0.0.1:4303/#/app/purchases');
  await choose('Purchase supplier filter','Karim Traders');assert.equal(await page.locator('tbody tr').count(),2);
  await choose('Purchase status filter','Due');assert.equal(await page.locator('tbody tr').count(),1);assert.match(await page.locator('tbody').innerText(),/PUR-000118/);
  await choose('Purchase status filter','Partial');assert.match(await page.locator('tbody').innerText(),/No purchases match/);
  await page.getByRole('button',{name:'Reset filters',exact:true}).first().click();
  await page.getByRole('textbox',{name:'Search purchases'}).fill('Teflon');assert.equal(await page.locator('tbody tr').count(),1);
  await page.getByRole('button',{name:'Actions for PUR-000118',exact:true}).click();await page.getByRole('button',{name:'View bill',exact:true}).click();
  const details=page.getByRole('dialog',{name:'Bill details'});await details.waitFor();assert.match(await details.innerText(),/Karim Traders/);assert.ok(await details.getByRole('button',{name:/^Pay /}).isDisabled());await details.getByRole('button',{name:'Close',exact:true}).first().click();
  await page.getByRole('button',{name:'Actions for PUR-000118',exact:true}).click();const printing=page.waitForEvent('popup');await page.getByRole('button',{name:'Print bill',exact:true}).click();const printed=await printing;await printed.waitForLoadState();assert.match(await printed.locator('body').innerText(),/PUR-000118/);assert.doesNotMatch(await printed.locator('body').innerText(),/PUR-000117/);await printed.close();
  await page.getByRole('button',{name:'Actions for PUR-000118',exact:true}).click();await page.getByRole('button',{name:'Review return',exact:true}).click();assert.match(page.url(),/tab=return/);
  const source=page.getByRole('region',{name:'Purchase return source'});assert.match(await source.innerText(),/PUR-000118/);assert.match(await source.innerText(),/Return quantities unavailable/);
  assert.equal(await source.getByRole('textbox').count(),0,'No fabricated return quantity fields');assert.equal(await source.getByRole('button',{name:'Complete return',exact:true}).count(),0);assert.doesNotMatch(await source.innerText(),/৳5,860/,'No synthetic 10% refund');
  await source.getByRole('button',{name:'View original bill',exact:true}).click();await details.waitFor();assert.match(await details.innerText(),/PUR-000118/);await details.getByRole('button',{name:'Close',exact:true}).first().click();
  await source.getByRole('button',{name:'Choose another purchase',exact:true}).click();const search=page.getByRole('textbox',{name:'Find purchase reference'});await search.fill('');await page.getByRole('button',{name:'Find purchase',exact:true}).click();assert.match(await page.getByRole('alert').innerText(),/Enter the purchase reference/);
  await search.fill('Karim');await search.press('Enter');assert.match(await page.getByRole('alert').innerText(),/Several purchases/);assert.match(await source.innerText(),/No purchase selected/);
  await search.fill('NOT-A-BILL');await search.press('Enter');assert.match(await page.getByRole('alert').innerText(),/No purchase found/);
  await search.fill('PUR-000117');await search.press('Enter');assert.match(await source.innerText(),/PUR-000117/);
  await page.getByRole('tab',{name:/Return history/}).click();assert.match(await page.locator('main').innerText(),/Preview and sample history/);const downloading=page.waitForEvent('download');await page.getByRole('button',{name:'Export',exact:true}).click();const download=await downloading;assert.match(await fs.readFile(await download.path(),'utf8'),/PR-000028/);
  assert.deepEqual(errors,[]);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await context.close();console.log(`Purchase filters, source actions, print/CSV and honest return review passed: ${width}px ${theme}`);
 }}finally{await browser.close();await server.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
