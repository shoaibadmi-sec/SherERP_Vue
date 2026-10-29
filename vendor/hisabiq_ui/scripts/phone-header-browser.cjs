/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires -- Playwright CLI scripts use CommonJS. */
const{chromium}=require('playwright');const assert=require('node:assert/strict');
async function main(){const{createServer}=await import('vite');const server=await createServer({server:{host:'127.0.0.1',port:4304,strictPort:true}});await server.listen();const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
try{for(const theme of ['light','dark'])for(const width of [320,360,390,640,768,1024,1440]){
const context=await browser.newContext({viewport:{width,height:960},hasTouch:width<1024,reducedMotion:'reduce'});await context.addInitScript(theme=>localStorage.setItem('hisabiq-theme',theme),theme);const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:4304/#/app/purchases');await page.getByRole('heading',{name:'Purchases',exact:true}).waitFor();const header=page.locator('header').filter({has:page.getByRole('combobox',{name:'Global search'})});
assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
const search=header.getByRole('combobox',{name:'Global search'});await search.fill('LED Bulb');assert.equal(await search.inputValue(),'LED Bulb');
if(width<640){assert.ok((await search.boundingBox()).width>=width-32,'Search has its own usable row');assert.ok((await search.boundingBox()).y>(await header.getByRole('button',{name:'Calculator',exact:true}).boundingBox()).y);}
for(const name of ['Calculator','Notifications','User menu']){
const button=header.getByRole('button',{name:name==='User menu'?/User menu MH Mahmud Hasan/:name,exact:name!=='User menu'});const rect=await button.boundingBox();assert.ok(rect.x>=0&&rect.x+rect.width<=width+1,name+' remains in viewport');await button.click();await page.getByRole('dialog',{name,exact:true}).waitFor();await page.keyboard.press('Escape');}
if(width<1024){await header.getByRole('button',{name:'Open ERP navigation'}).click();const nav=page.getByRole('dialog',{name:'ERP navigation'});await nav.waitFor();await nav.getByRole('button',{name:'Close navigation'}).click();await nav.waitFor({state:'hidden'});}
for(const route of ['pos','parties','reports']){await page.goto('http://127.0.0.1:4304/#/app/'+route);await page.locator('main').waitFor();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),route+' has no page overflow');}
assert.deepEqual(errors,[]);await context.close();console.log(`Header geometry and controls passed: ${width}px ${theme}`);
}}finally{await browser.close();await server.close();}}
main().catch(e=>{console.error(e);process.exitCode=1;});
