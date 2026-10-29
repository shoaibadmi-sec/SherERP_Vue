/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires -- Playwright CLI scripts use CommonJS. */
const{chromium}=require('playwright');const assert=require('node:assert/strict');
async function main(){
 const{preview}=await import('vite');const server=await preview({preview:{host:'127.0.0.1',port:4316,strictPort:true}});
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
 try{for(const theme of ['light','dark']){
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true});
  await context.addInitScript(theme=>{localStorage.setItem('hisabiq-theme',theme);window.print=()=>{window.__printed=true;};},theme);
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4316/#/app/sales');await page.getByRole('button',{name:'Actions for INV-000241',exact:true}).click();
  const opened=page.waitForEvent('popup');await page.getByRole('button',{name:'Print',exact:true}).click();const receipt=await opened;
  await receipt.getByText(/INV-000241/).first().waitFor();await receipt.waitForFunction(()=>window.__printed===true);
  assert.ok(await receipt.locator('link[rel=stylesheet]').count()>0,'Built receipt loads the actual app stylesheet');
  assert.equal(await receipt.locator('html').getAttribute('data-theme'),'light');assert.equal(await receipt.evaluate(()=>window.opener),null);
  assert.equal(await receipt.locator('[data-invoice-template],#document-receipt>div').first().evaluate(node=>getComputedStyle(node).backgroundColor),'rgb(255, 255, 255)');
  assert.match(await receipt.locator('body').innerText(),/3 Box 6 Pcs/);assert.equal(await receipt.locator('.invoice-lines tbody tr').count(),2);
  assert.deepEqual(errors,[]);await context.close();console.log(`Built lazy receipt, CSS/font loading and print call passed: ${theme}`);
 }}finally{await browser.close();await new Promise(resolve=>server.httpServer.close(resolve));}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
