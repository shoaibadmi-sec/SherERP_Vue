/* The same editor serves Products and transaction quick-add; only preview stores change. */
const {chromium}=require('playwright');const assert=require('node:assert/strict');
const {pick,quickAdd,fillChain}=require('./product-form-browser-helpers.cjs');
async function main(){
 const {createServer}=await import('vite');const server=await createServer({server:{host:'127.0.0.1',port:4181,strictPort:true}});await server.listen();
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
 try{for(const width of [320,390,768,1024,1440])for(const theme of ['light','dark']){
  const context=await browser.newContext({viewport:{width,height:900},hasTouch:width<1024,reducedMotion:'reduce'});
  await context.addInitScript(theme=>localStorage.setItem('hisabiq-theme',theme),theme);
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4181/#/app/products');
  const workspace=await page.getByRole('heading',{name:'Products',exact:true}).evaluate(el=>el.closest('.mx-auto').getBoundingClientRect().toJSON());
  await page.getByRole('button',{name:'Add product',exact:true}).click();
  const editor=page.locator('[data-product-editor]');await editor.waitFor();
  assert.equal(await editor.getAttribute('data-presentation'),'page');
  const bounds=await editor.boundingBox(),header=await editor.locator('header').boundingBox();
  assert.ok(Math.abs(bounds.x-workspace.x)<1&&Math.abs(bounds.width-workspace.width)<1,'editor uses Products workspace width and alignment');
  assert.ok(Math.abs(bounds.y-workspace.y)<1&&Math.abs(header.x-workspace.x)<1,'editor uses the standard workspace top and heading inset');
  assert.equal(await editor.locator('#pf-advanced-button').getAttribute('aria-expanded'),'false');
  assert.equal(await editor.locator('#pf-other-button').getAttribute('aria-expanded'),'false');
  assert.equal(await editor.locator('[aria-label^="Quick add "]').count(),0);
  if(width===390&&theme==='light'){
   await editor.getByRole('button',{name:'Save product',exact:true}).click();
   await page.waitForFunction(()=>document.activeElement?.id==='pf-name');
  }
  await editor.locator('#pf-name').fill('Preserved draft');await editor.locator('#pf-sell').fill('185000');
  await quickAdd(page,editor.locator('#pf-category'),'category','QA Components');
  await quickAdd(page,editor.locator('#pf-brand'),'brand','QA Manufacturer');
  assert.equal(await editor.locator('#pf-name').inputValue(),'Preserved draft');assert.equal(await editor.locator('#pf-sell').inputValue(),'185000');
  await editor.locator('#pf-sell').fill('');
  const name='Unit chain QA '+width+' '+theme;await fillChain(page,editor,name);
  if(width===390&&theme==='light'){
   const factor=editor.locator('[data-product-unit-relationship]').first().locator('input');await factor.fill('');
   await editor.locator('#pf-advanced-button').click();await editor.getByRole('button',{name:'Save product',exact:true}).click();
   await page.waitForFunction(()=>document.querySelector('#pf-advanced-button')?.getAttribute('aria-expanded')==='true');
   assert.equal(await factor.getAttribute('aria-invalid'),'true');await factor.fill('120');
   await page.goBack();const confirm=page.getByRole('dialog',{name:'Leave without saving?',exact:true});await confirm.waitFor();
   await confirm.getByRole('button',{name:'Keep editing',exact:true}).click();assert.equal(await editor.locator('#pf-name').inputValue(),name);
  }
  await pick(page,editor.locator('#pf-sell-unit'),'Carton');assert.equal(await editor.locator('#pf-sell').inputValue(),'57600');
  await pick(page,editor.locator('#pf-sell-unit'),'Pcs');assert.equal(await editor.locator('#pf-sell').inputValue(),'240');
  await editor.locator('details summary').click();await editor.getByRole('textbox',{name:'Selling price per Box',exact:true}).fill('4500');
  await editor.getByRole('textbox',{name:'Purchase price per Box',exact:true}).fill('3000');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no horizontal overflow');
  await editor.getByRole('button',{name:'Save product',exact:true}).click();await editor.waitFor({state:'hidden'});
  await page.getByText(name,{exact:true}).first().waitFor();
  await page.getByRole('button',{name:'Actions for '+name,exact:true}).click();
  await page.getByRole('button',{name:'Edit product',exact:true}).click();await editor.waitFor();
  assert.equal(await editor.locator('#pf-unit').isDisabled(),true,'saved unit setup cannot reinterpret history');
  if(await editor.locator('#pf-advanced-button').getAttribute('aria-expanded')==='false')await editor.locator('#pf-advanced-button').click();
  await editor.locator('details summary').click();
  assert.equal(await editor.getByRole('textbox',{name:'Selling price per Box',exact:true}).inputValue(),'4500');
  assert.equal(await editor.getByRole('textbox',{name:'Purchase price per Box',exact:true}).inputValue(),'3000');
  await editor.getByRole('button',{name:'Save changes',exact:true}).click();await editor.waitFor({state:'hidden'});
  await page.evaluate(()=>{location.hash='#/app/purchases/new';});
  const search=page.getByRole('combobox',{name:'Search product to add to purchase'});
  await search.fill(name);await page.getByRole('option').filter({hasText:name}).first().click();
  assert.equal(await page.getByTestId('purchase-cart-row').count(),1,'saved product is usable in Purchase');
  await search.fill('Missing product QA');await page.getByRole('button',{name:/Create new product/}).click();await editor.waitFor();
  assert.equal(await editor.getAttribute('data-presentation'),'context');
  await editor.locator('#pf-name').fill('Context product '+width+theme);await editor.locator('#pf-sell').fill('125');
  await editor.getByRole('button',{name:'Save product',exact:true}).click();await editor.waitFor({state:'hidden'});
  assert.equal(await page.getByTestId('purchase-cart-row').count(),2,'creating a product preserves the parent cart');
  assert.deepEqual(errors,[]);await context.close();console.log('Product form, nested quick-add, save/reopen and Purchase context:',width,theme);
 }}finally{await browser.close();await server.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
