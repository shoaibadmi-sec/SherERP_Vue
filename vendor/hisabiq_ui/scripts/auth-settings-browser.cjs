const {chromium}=require('playwright');
const {mkdirSync}=require('node:fs');
const assert=require('node:assert/strict');
async function main(){
 const {createServer}=await import('vite');
 const server=await createServer({server:{host:'127.0.0.1',port:4246,strictPort:true}});
 await server.listen();let browser;
 try {
  browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:1365,height:900},reducedMotion:'reduce'});
  const errors=[],writes=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('request',req=>{if(req.method()!=='GET')writes.push(req.url());});
  const root='http://127.0.0.1:4246/#';
  await page.goto(root+'/app/settings/business');
  await page.locator('[data-settings-section="security"]:visible').click();
  assert.match(page.url(),/#\/app\/settings\/security/);
  const section=page.getByTestId('account-security-settings');
  await section.waitFor();
  assert.equal(await page.getByRole('button',{name:'Save changes'}).count(),0,'Security may not write tenant settings');
  await section.getByText('Authentication UI preview',{exact:true}).waitFor();
  const screenshotDir=process.env.AUTH_SCREENSHOT_DIR;
  if(screenshotDir){mkdirSync(screenshotDir,{recursive:true});await page.screenshot({path:screenshotDir+'/security-desktop.png',fullPage:true});}
  const lock=page.getByRole('switch',{name:'Preview auto-lock after 30 minutes'});
  assert.equal(await lock.getAttribute('aria-checked'),'true');
  const lockSurface=section.locator('label[data-slot="switch"]');
  await lockSurface.click();await section.getByText(/Preview: Off/).waitFor();
  await lockSurface.click();await section.getByText(/Preview: On/).waitFor();

  await section.getByRole('button',{name:'Preview setup'}).click();
  const dialog=page.getByRole('dialog',{name:'Set a 6-digit PIN (preview)'});
  await dialog.waitFor();
  const newPin=dialog.getByLabel('New 6-digit PIN'),confirmation=dialog.getByLabel('Confirm PIN');
  await newPin.fill('১২৩৪৫৬');
  assert.equal(await newPin.inputValue(),'123456');
  await confirmation.fill('111111');
  await dialog.getByRole('button',{name:'Complete preview'}).click();
  await dialog.getByRole('alert').getByText('The PINs do not match.').waitFor();
  await confirmation.fill('123456');
  await dialog.getByRole('button',{name:'Complete preview'}).click();
  await dialog.waitFor({state:'hidden'});
  await section.getByText(/PIN setup walkthrough complete/).waitFor();
  await section.getByRole('button',{name:'Preview setup'}).click();
  assert.equal(await page.getByRole('dialog',{name:'Set a 6-digit PIN (preview)'}).getByLabel('New 6-digit PIN').inputValue(),'');
  await page.getByRole('dialog',{name:'Set a 6-digit PIN (preview)'}).getByRole('button',{name:'Cancel'}).click();

  await section.getByRole('button',{name:'Change',exact:true}).first().click();
  const phoneDialog=page.getByRole('dialog',{name:'Change mobile number'});
  await phoneDialog.waitFor();
  await phoneDialog.getByLabel('New mobile number').fill('১২৩');
  await phoneDialog.getByRole('button',{name:'Review number'}).click();
  await phoneDialog.getByRole('alert').getByText(/valid Bangladesh mobile/).waitFor();
  await phoneDialog.getByLabel('New mobile number').fill('০১৭১১-০০০২৪৫');
  await phoneDialog.getByRole('button',{name:'Review number'}).click();
  await phoneDialog.getByRole('status').getByText(/No account phone was changed/).waitFor();
  await phoneDialog.getByRole('button',{name:'Close',exact:true}).last().click();
  await section.getByRole('button',{name:'View devices'}).click();
  await page.getByRole('dialog',{name:'Manage trusted devices'}).getByText(/None can be removed or authorized/).waitFor();
  await page.getByRole('dialog',{name:'Manage trusted devices'}).getByRole('button',{name:'Close',exact:true}).last().click();
  const stored=await page.evaluate(()=>JSON.stringify([Object.entries(localStorage),Object.entries(sessionStorage)]));
  assert.ok(!stored.includes('123456')&&!stored.includes('01711000245'));
  assert.deepEqual(writes,[],'Security preview must not post identity changes');
  for(const [width,height] of [[390,844],[320,700],[900,1000],[1365,900]]){
   await page.setViewportSize({width,height});await page.goto(root+'/app/settings/security');await section.waitFor();
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),width+'px security route must not overflow');
   if(screenshotDir && width===390)await page.screenshot({path:screenshotDir+'/security-mobile.png',fullPage:true});
  }
  await page.getByRole('link',{name:/Account picker/}).click();
  assert.match(page.url(),/#\/login\/accounts/);
  assert.deepEqual(errors,[]);
  console.log('Security settings preview verified: navigation, PIN validation/no persistence, mobile check, lock preview, device dialog and no account writes.');
 } finally {await browser?.close();await server.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
