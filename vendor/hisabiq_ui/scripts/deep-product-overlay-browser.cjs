/* Shared product picker interaction regressions. All writes stay in the UI preview. */
const {chromium}=require('playwright');
const {expect}=require('playwright/test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const sizes=[[320,700],[360,800],[390,844],[430,932],[768,1024],[1024,768],[1280,800],[1440,900]];
const output=process.env.DEEP_AUDIT_OUTPUT||'.superpowers/deep-audit/product-overlays';
const results=[];
const base='http://127.0.0.1:'+(process.env.DEEP_AUDIT_PORT||4451);
async function main(){
 const {createServer}=await import('vite');
 const server=await createServer({server:{host:'127.0.0.1',port:Number(process.env.DEEP_AUDIT_PORT||4451),strictPort:true}});await server.listen();
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
 fs.mkdirSync(output,{recursive:true});
 try{
  const matrix=process.env.DEEP_AUDIT_SMOKE?[[390,844]]:sizes;
  for(const [width,height] of matrix)for(const theme of ['light','dark']){
   const id=width+'-'+theme;
   const context=await browser.newContext({viewport:{width,height},colorScheme:theme,hasTouch:width<=1024,reducedMotion:'reduce'});
   await context.addInitScript(t=>{if(location.protocol==='http:')localStorage.setItem('hisabiq-theme',t);},theme);
   await context.tracing.start({screenshots:true,snapshots:true,sources:true});
   const page=await context.newPage();page.setDefaultTimeout(30000);
   await page.route('https://fonts.googleapis.com/**',route=>route.abort());
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   const act=locator=>width<=1024?locator.tap():locator.click();
   const check=async(name,run)=>{
    if(process.env.DEEP_AUDIT_CASE&&process.env.DEEP_AUDIT_CASE!==name)return;
    try{await run();results.push({id,name,status:'passed'});}
    catch(e){results.push({id,name,status:'failed',error:e.message});console.error(id,name,e.message);await page.screenshot({path:path.join(output,id+'-'+name+'-failure.png'),fullPage:true});}
   };
   async function fits(locator){
    await locator.waitFor({state:'visible'});
    await expect.poll(async()=>{const r=await locator.boundingBox();
     return !!r&&r.x>=-1&&r.y>=-1&&r.x+r.width<=width+1&&r.y+r.height<=page.viewportSize().height+1;
    },{message:'popup fits the current viewport after repositioning'}).toBe(true);
   }
   await check('empty-search-quick-add',async()=>{
    await page.goto(base+'/#/app/purchases/new',{waitUntil:'domcontentloaded'});
    const search=page.getByRole('combobox',{name:'Search product to add to purchase',exact:true});
    await search.fill('AuditMissingProduct987');
    const list=page.getByRole('listbox',{name:'Purchase product suggestions'});
    await fits(list);
    assert.match(await list.innerText(),/No matching products/);
    await act(list.getByRole('button',{name:/Create new product/}));
    const product=page.getByRole('dialog',{name:/Add product/});await product.waitFor({state:'visible'});
    const name=product.getByPlaceholder('e.g. LED Bulb 12W',{exact:true});await name.fill('Preserved product draft');
    await act(product.locator('#pf-category'));await act(page.getByText('Add new category',{exact:true}));
    const child=page.getByRole('dialog',{name:'New category',exact:true});await child.waitFor({state:'visible'});
    await act(child.getByRole('button',{name:'Add category',exact:true}));
    await child.getByRole('alert').waitFor({state:'visible'});
    await child.locator('#qa-name').fill('Overlay audit category');
    await act(child.getByRole('button',{name:'Add category',exact:true}));
    await child.waitFor({state:'hidden'});
    assert.equal(await name.inputValue(),'Preserved product draft');
    assert.match(await product.locator('#pf-category').innerText(),/Overlay audit category/);
    await act(product.getByRole('button',{name:'Cancel',exact:true}));await act(page.getByRole('button',{name:'Discard',exact:true}));await product.waitFor({state:'hidden'});
    assert.equal(await search.isVisible(),true);assert.equal(await page.getByRole('dialog').count(),0);
    assert.notEqual(await page.evaluate(()=>document.body.style.overflow),'hidden');
   });
   await check('quotation-escape-preserves-draft',async()=>{
    await page.goto(base+'/#/app/quotations',{waitUntil:'domcontentloaded'});
    const opener=page.getByRole('button',{name:/New quotation/});await act(opener);
    const parent=page.getByRole('dialog',{name:'New quotation',exact:true});
    const customer=parent.getByRole('textbox',{name:'Quotation customer name',exact:true});await customer.fill('Keep this draft');
    const search=parent.getByRole('combobox',{name:'Add product to quotation',exact:true});await search.fill('LED');
    await fits(page.getByRole('listbox'));
    await search.press('Escape');
    await expect(parent,'first Escape closes only product suggestions').toBeVisible();
    assert.equal(await search.getAttribute('aria-expanded'),'false');assert.equal(await customer.inputValue(),'Keep this draft');
    assert.equal(await search.evaluate(e=>document.activeElement===e),true);
    await search.press('Escape');await parent.waitFor({state:'hidden'});
    assert.equal(await opener.evaluate(e=>document.activeElement===e),true);
   });
   for(const [route,label,rows] of [['pos','Add product','[data-cart-row]'],['purchases/new','Search product to add to purchase','[data-testid="purchase-cart-row"]'],['quotations','Add product to quotation','[data-testid="transaction-cart-row"]'],['online-sales','Add online order product','[data-testid="transaction-cart-row"]']])await check('keyboard-cart-'+route.replace('/','-'),async()=>{
     await page.goto(base+'/#/app/'+route,{waitUntil:'domcontentloaded'});
     if(route==='quotations')await act(page.getByRole('button',{name:/New quotation/}));
     if(route==='online-sales')await act(page.getByRole('button',{name:/New online order/}));
     const search=page.getByRole('combobox',{name:label,exact:true});await search.fill('a');
     const list=page.getByRole('listbox');await fits(list);
     await search.press('ArrowDown');
     const selectedId=await search.getAttribute('aria-activedescendant');assert.ok(selectedId);
     const selected=page.locator('[id="'+selectedId+'"]');
     assert.equal(await selected.getAttribute('aria-selected'),'true');
     const productName=(await selected.locator('p').first().innerText()).trim();
     const before=await page.locator(rows).count();await search.press('Enter');
     await expect(page.locator(rows),route+': first Enter adds exactly one product').toHaveCount(before+1);
     assert.match(await page.locator(rows).last().innerText(),new RegExp(productName.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
     if(route!=='pos'){
      await search.fill('LED');await act(page.getByRole('option').first());
      await expect(page.locator(rows)).toHaveCount(before+2);
     }
     await search.fill('বাংলা');await act(page.getByRole('button',{name:/Clear product search/}));assert.equal(await search.inputValue(),'');
     await search.press('Escape');await search.press('Tab');assert.equal(await search.getAttribute('aria-expanded'),'false');
     await search.fill('LED');await page.setViewportSize({width,height:Math.min(height,430)});await fits(list);
     await page.setViewportSize({width,height});await search.press('Escape');
    assert.deepEqual(errors,[]);
   });
   const failed=results.some(r=>r.id===id&&r.status==='failed');
   await context.tracing.stop(failed?{path:path.join(output,id+'-failure-trace.zip')}:{});
   await context.close();console.log(id,results.filter(r=>r.id===id).map(r=>r.name+': '+r.status).join('; '));
  }
 }finally{
  fs.writeFileSync(path.join(output,'results.json'),JSON.stringify(results,null,2));await browser.close();await server.close();
 }
 const failed=results.filter(r=>r.status==='failed');
 console.log(results.length+' journeys; '+failed.length+' failed');for(const r of failed)console.error(r.id,r.name,r.error);
 assert.equal(failed.length,0,'Shared product overlay interaction failures');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
