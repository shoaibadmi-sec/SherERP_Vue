/* Blocking POS overlays must own focus; no backend transaction is posted. */
const {chromium}=require('playwright');const {expect}=require('playwright/test');
const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const sizes=process.env.DEEP_AUDIT_SMOKE?[[390,844]]:[[320,700],[360,800],[390,844],[430,932],[768,1024],[1024,768],[1280,800],[1440,900]];
const languages=process.env.DEEP_AUDIT_SMOKE?['English + Bangla']:['English','English + Bangla','Bangla'];
const port=Number(process.env.DEEP_AUDIT_PORT||4466),output=process.env.DEEP_AUDIT_OUTPUT||'.superpowers/deep-audit/pos-shortcuts',results=[];
async function main(){
 const {createServer}=await import('vite');const server=await createServer({cacheDir:'.superpowers/pos-shortcuts-cache-'+port,server:{host:'127.0.0.1',port,strictPort:true}});await server.listen();
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});fs.mkdirSync(output,{recursive:true});
 try{for(const [width,height]of sizes)for(const theme of ['light','dark'])for(const language of languages){
  const id=width+'-'+theme+'-'+language.replaceAll(' ','');const bn=language==='Bangla';
  if(process.env.DEEP_AUDIT_CASE&&process.env.DEEP_AUDIT_CASE!==id)continue;
  const context=await browser.newContext({viewport:{width,height},colorScheme:theme,hasTouch:width<=1024,reducedMotion:'reduce'});
  await context.addInitScript(({theme,language})=>{localStorage.setItem('hisabiq-theme',theme);localStorage.setItem('hisabiq-erp-personal-v1',JSON.stringify({mode:'Simple',language,density:'Compact',terminology:'simple',dateView:'transaction'}));},{theme,language});
  await context.tracing.start({screenshots:true,snapshots:true,sources:true});const page=await context.newPage();await page.route('https://fonts.googleapis.com/**',r=>r.abort());
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
   await page.goto(`http://127.0.0.1:${port}/#/app/pos`,{waitUntil:'domcontentloaded'});
   const act=e=>width<=1024?e.tap():e.click();
   const preview=page.getByRole('button',{name:bn?/বিক্রির হিসাব দেখুন/:/Preview sale/});
   await preview.waitFor({state:'visible'});
   await expect(preview).toBeDisabled();
   await page.keyboard.press('F9');
   await expect(page.locator('[data-dialog-root]'),'F9 respects the disabled preview action').toHaveCount(0);
   await act(page.getByRole('button',{name:bn?'পুরো টাকা':'Exact',exact:true}));
   await act(preview);
   const review=page.getByRole('dialog',{name:bn?'বিক্রির হিসাব যাচাই':'Review sale',exact:true});await expect(review).toBeVisible();
   const cartState=()=>page.getByTestId('pos-cart-row').evaluateAll(rows=>rows.map(e=>({text:e.textContent,values:[...e.querySelectorAll('input')].map(i=>i.value)})));
   const before=await cartState();
   async function ownsShortcuts(dialog){
    const text=await dialog.innerText();
    const focus=dialog.getByRole('button').first();await focus.focus();
    for(const key of ['F2','F8','F9']){
     await page.keyboard.press(key);
     await expect(focus,key+' keeps focus in the active blocking overlay').toBeFocused();
     await expect(page.getByRole('listbox')).toHaveCount(0);
     await expect(page.locator('[data-dialog-root]')).toHaveCount(1);
     assert.equal(await dialog.innerText(),text,key+' preserves review/preview amounts');
     assert.deepEqual(await cartState(),before,key+' preserves underlying cart');
    }
   }
   await ownsShortcuts(review);
   await act(review.getByRole('button',{name:bn?'সংশোধন করুন':'Edit details',exact:true}));await expect(review).toBeHidden();
   // Normal page shortcuts remain available after the overlay closes.
   await page.keyboard.press('F2');const search=page.getByRole('combobox',{name:bn?'পণ্য যোগ করুন':'Add product',exact:true});await expect(search).toBeFocused();
   await search.press('Escape');await page.keyboard.press('F8');
   await expect(page.getByRole('textbox',{name:bn?'পেমেন্টের পরিমাণ 1':'Payment amount 1',exact:true})).toBeFocused();
   await page.keyboard.press('F9');await expect(review).toBeVisible();
   await act(review.getByRole('button',{name:bn?'বিক্রির প্রিভিউ নিশ্চিত করুন':'Confirm sale preview',exact:true}));
   const receipt=page.locator('[data-dialog-root]');await expect(receipt).toContainText('Sale preview');
   await ownsShortcuts(receipt);
   await act(receipt.getByRole('button',{name:'Close',exact:true}));await expect(receipt).toHaveCount(0);
   await expect(preview).toBeDisabled();await page.keyboard.press('F9');await expect(receipt).toHaveCount(0);
   if(width<1024){
    // Open product suggestions must never cover sticky mobile navigation, even after modal focus restoration.
    const navButton=page.getByRole('button',{name:bn?'ERP মেনু খুলুন':'Open ERP navigation',exact:true});
    const navRect=await navButton.boundingBox();
    for(const panel of await page.locator('#pos-product-list:visible').all()){
     const box=await panel.boundingBox();
     assert.ok(!box||!navRect||box.x>=navRect.x+navRect.width||
       box.x+box.width<=navRect.x||box.y>=navRect.y+navRect.height||
       box.y+box.height<=navRect.y,'POS suggestions must not cover the ERP mobile menu');
    }
    await act(navButton);
    const drawer=page.getByRole('dialog',{name:bn?'ERP মেনু':'ERP navigation',exact:true});await expect(drawer).toBeVisible();
    const close=drawer.getByRole('button',{name:bn?'মেনু বন্ধ করুন':'Close navigation',exact:true});await close.focus();
    for(const key of ['F2','F8','F9']){await page.keyboard.press(key);await expect(close).toBeFocused();await expect(page.locator('[data-dialog-root]')).toHaveCount(0);}
    await close.press('Escape');await expect(drawer).toBeHidden();
   }
   assert.deepEqual(errors,[]);results.push({id,status:'passed'});
  }catch(e){results.push({id,status:'failed',error:e.message});console.error(id,e.message);await page.screenshot({path:path.join(output,id+'.png'),fullPage:true});}
  await context.tracing.stop(results.at(-1).status==='failed'?{path:path.join(output,id+'-trace.zip')}:{});await context.close();console.log(id,results.at(-1).status);
 }}finally{fs.writeFileSync(path.join(output,'results.json'),JSON.stringify(results,null,2));await browser.close();await server.close();}
 console.log(results.length+' journeys; '+results.filter(r=>r.status==='failed').length+' failed');assert.equal(results.filter(r=>r.status==='failed').length,0);
}
main().catch(e=>{console.error(e);process.exitCode=1;});
