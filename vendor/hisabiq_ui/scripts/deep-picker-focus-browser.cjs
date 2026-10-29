/* Shared picker focus transitions; all mutations remain frontend preview state. */
const {chromium}=require('playwright');
const {expect}=require('playwright/test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const sizes=process.env.DEEP_AUDIT_SMOKE?[[390,844]]:[[320,700],[360,800],[390,844],[430,932],[768,1024],[1024,768],[1280,800],[1440,900]];
const output=process.env.DEEP_AUDIT_OUTPUT||'.superpowers/deep-audit/picker-focus';
const port=Number(process.env.DEEP_AUDIT_PORT||4462);
const results=[];
async function main(){
 const {createServer}=await import('vite');
 const server=await createServer({cacheDir:'.superpowers/picker-focus-cache-'+port,server:{host:'127.0.0.1',port,strictPort:true}});await server.listen();
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});fs.mkdirSync(output,{recursive:true});
 try{for(const [width,height] of sizes)for(const theme of ['light','dark']){
  const context=await browser.newContext({viewport:{width,height},hasTouch:width<=1024,colorScheme:theme,reducedMotion:'reduce'});
  await context.addInitScript(t=>localStorage.setItem('hisabiq-theme',t),theme);
  await context.tracing.start({screenshots:true,snapshots:true,sources:true});
  const page=await context.newPage();page.setDefaultNavigationTimeout(60000);await page.route('https://fonts.googleapis.com/**',r=>r.abort());
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const [route,label,rows,open] of [
   ['pos','Add product','[data-cart-row]'],
   ['purchases/new','Search product to add to purchase','[data-testid="purchase-cart-row"]'],
   ['quotations','Add product to quotation','[data-testid="transaction-cart-row"]','New quotation'],
   ['online-sales','Add online order product','[data-testid="transaction-cart-row"]','New online order']
  ]){
   if(process.env.DEEP_AUDIT_ROUTE&&process.env.DEEP_AUDIT_ROUTE!==route)continue;
   const id=width+'-'+theme+'-'+route.replace('/','-');
   try{
    await page.goto(`http://127.0.0.1:${port}/#/app/${route}`,{waitUntil:'domcontentloaded'});
    if(open)await page.getByRole('button',{name:new RegExp(open)}).click();
    const search=page.getByRole('combobox',{name:label,exact:true});
    await search.fill('LED');await expect(page.getByRole('listbox')).toBeVisible();
    const cartState=()=>page.locator(rows).evaluateAll(elements=>elements.map(e=>({text:e.textContent,values:[...e.querySelectorAll('input')].map(i=>i.value)})));
    const before=await page.locator(rows).count();
    const stateBefore=await cartState();
    await search.press('Escape');await expect(search).toHaveAttribute('aria-expanded','false');
    if(!process.env.DEEP_AUDIT_BLUR_ONLY){
     await search.press('Enter');
     await expect(page.locator(rows),'closed suggestions must not add a hidden product').toHaveCount(before);
     assert.equal(await search.inputValue(),'LED');
     assert.deepEqual(await cartState(),stateBefore,'closed Enter preserves existing cart quantities and prices');
    }
    await search.press('ArrowDown');await expect(page.getByRole('listbox')).toBeVisible();
    await search.press('Escape');
    // At compact desktop widths Clear overlaps the input's geometric centre.
    // Target the editable text area without bypassing Playwright actionability.
    if(width<=1024)await search.tap({position:{x:36,y:20}});else await search.click({position:{x:36,y:20}});
    await expect(search,'clicking the still-focused input reopens suggestions').toHaveAttribute('aria-expanded','true');
    await search.press('Tab');
    await expect(page.getByRole('button',{name:'Clear product search',exact:true})).toBeFocused();
    await expect(search).toHaveAttribute('aria-expanded','true');
    await page.keyboard.press('Tab');
    // The next actual form control is outside the picker, without clicking to dismiss it.
    await expect.poll(()=>page.evaluate(()=>!!document.activeElement?.closest('[role=listbox]'))).toBe(false);
    await expect(search,'leaving picker closes suggestions').toHaveAttribute('aria-expanded','false');
    await search.focus();await expect(search).toHaveAttribute('aria-expanded','true');
    if(width<=1024)await page.getByRole('option').first().tap();else await page.getByRole('option').first().click();
    await expect.poll(cartState,{message:'selecting visible product updates the cart'}).not.toEqual(stateBefore);
    const after=await page.locator(rows).count();
    assert.ok(after>=before);assert.equal(await search.inputValue(),'');
    if(route!=='pos'){
     await search.fill('MissingForQuickAdd987');
     const create=page.getByRole('button',{name:/Create new product/});
     await create.focus();await expect(create).toBeFocused();
     await expect(search,'focus in owned portal keeps it open').toHaveAttribute('aria-expanded','true');
     await create.press('Enter');
     const dialog=page.getByRole('dialog',{name:/Add product/});await expect(dialog).toBeVisible();
     await dialog.getByRole('button',{name:'Cancel',exact:true}).click();
     await expect(dialog).toBeHidden();await expect(page.locator(rows)).toHaveCount(after);
    }
    assert.deepEqual(errors,[]);results.push({id,status:'passed'});
   }catch(e){results.push({id,status:'failed',error:e.message});await page.screenshot({path:path.join(output,id+'.png'),fullPage:true});console.error(id,e.message);}
  }
  await context.tracing.stop(results.some(r=>r.id.startsWith(width+'-'+theme)&&r.status==='failed')?{path:path.join(output,width+'-'+theme+'-trace.zip')}:{});await context.close();
  console.log(width,theme,results.filter(r=>r.id.startsWith(width+'-'+theme)).map(r=>r.status).join(','));
 }}finally{fs.writeFileSync(path.join(output,'results.json'),JSON.stringify(results,null,2));await browser.close();await server.close();}
 console.log(results.length+' journeys; '+results.filter(r=>r.status==='failed').length+' failed');assert.equal(results.filter(r=>r.status==='failed').length,0);
}
main().catch(e=>{console.error(e);process.exitCode=1;});
