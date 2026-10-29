/* POS customer quick-add and quick-sale template regression: touch, focus and safety. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');

async function main(){
  const {createServer}=await import('vite');
  const port=Number(process.env.POS_TEMPLATE_PORT||49317);
  const server=await createServer({cacheDir:'.superpowers/pos-template-cache',server:{host:'127.0.0.1',port,strictPort:true}});
  await server.listen();
  const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
  let checks=0;
  try{
    for(const [width,height] of [[390,844],[1440,900]])
      for(const theme of ['light','dark'])
        for(const language of ['English','Bangla']){
          const context=await browser.newContext({viewport:{width,height},colorScheme:theme,hasTouch:true,reducedMotion:'reduce'});
          const page=await context.newPage(),errors=[];
          page.on('pageerror',error=>errors.push(error.message));
          await page.route('https://fonts.googleapis.com/**',route=>route.abort());
          await page.addInitScript(({theme,language})=>{
            localStorage.setItem('hisabiq-theme',theme);
            localStorage.setItem('hisabiq-erp-personal-v1',JSON.stringify({mode:'Simple',language,density:'Compact',terminology:'simple',dateView:'transaction'}));
          },{theme,language});
          const suffix=`${width}px ${theme} ${language}`;
          const labels=(en,bn)=>new RegExp(`${en}|${bn}`);
          try{
            await page.goto(`http://127.0.0.1:${port}/#/app/pos`);
            const checkout=page.locator('[data-pos-checkout]');
            await checkout.waitFor();
            const before=await page.getByTestId('pos-cart-row').count();
            assert.ok(before>0,`${suffix} initial POS cart fixture`);
            const customerPicker=page.getByTestId('pos-customer-picker-trigger');
            await customerPicker.click();
            const search=page.getByTestId('pos-customer-picker-search');
            await search.fill('Rahman');
            await search.press('Enter');
            await checkout.getByText('Rahman Hardware',{exact:true}).first().waitFor();

            const add=checkout.getByRole('button',{name:labels('Quick add customer','নতুন ক্রেতা যোগ করুন')});
            await add.click();
            const dialog=page.getByRole('dialog',{name:labels('Quick add customer','নতুন ক্রেতা যোগ করুন')});
            await dialog.waitFor();
            await dialog.getByRole('textbox',{name:labels('Customer name','ক্রেতার নাম')}).fill('POS Template QA');
            await dialog.getByRole('textbox',{name:labels('Phone','ফোন')}).fill('01799001122');
            await dialog.getByRole('textbox',{name:labels('Address','ঠিকানা')}).fill('Rajshahi');
            await dialog.getByRole('button',{name:labels('Save customer','ক্রেতা সংরক্ষণ')}).click();
            await dialog.waitFor({state:'hidden'});
            await checkout.getByText('POS Template QA',{exact:true}).waitFor();
            assert.equal(await page.getByTestId('pos-cart-row').count(),before,`${suffix} quick add preserves cart`);

            const openMenu=async()=>{await page.getByTestId('pos-templates-trigger').click();
              return page.getByRole('dialog',{name:labels('Quick sale templates','দ্রুত বিক্রির নমুনা')});};
            let menu=await openMenu();
            await menu.waitFor();
            assert.ok(await menu.getByTestId('pos-new-template').count(),`${suffix} create shortcut`);
            const template=menu.locator('[data-testid="pos-templates-list"] button').first();
            const name=await template.getAttribute('aria-label');
            assert.ok(name,`${suffix} template is labelled`);
            const expectedItems=Number.parseInt((await template.locator('span').nth(2).textContent()??'').trim(),10);
            assert.ok(Number.isSafeInteger(expectedItems)&&expectedItems>0,`${suffix} template item count visible`);
            const waitForTemplateCart=()=>page.waitForFunction(expected=>
              document.querySelectorAll('[data-testid="pos-cart-row"]').length===expected,expectedItems);
            await template.click();
            const confirm=page.getByRole('dialog',{name:labels('Replace this sale with a template','নমুনা দিয়ে এই বিক্রি বদলাবেন')});
            await confirm.waitFor();
            await confirm.getByRole('button',{name:labels('Cancel','বাতিল')}).click();
            assert.equal(await page.getByTestId('pos-cart-row').count(),before,`${suffix} cancel protects cart`);
            await checkout.getByText('POS Template QA',{exact:true}).waitFor();

            menu=await openMenu();
            await menu.locator('[data-testid="pos-templates-list"] button').first().click();
            await confirm.getByRole('button',{name:labels('Load template','নমুনা আনুন')}).click();
            await page.waitForURL(/mode=template&template=/);
            // The old rows briefly remain in the DOM during their exit animation.
            await waitForTemplateCart();
            assert.equal(await page.getByTestId('pos-cart-row').count(),expectedItems,`${suffix} template populates POS`);
            assert.ok(await page.locator('[data-pos-checkout]').isVisible(),`${suffix} checkout remains mounted`);

            // A second selection of the same template must restore its source cart.
            const firstCartCount=expectedItems;
            menu=await openMenu();
            await menu.locator('[data-testid="pos-templates-list"] button').first().click();
            await confirm.getByRole('button',{name:labels('Load template','নমুনা আনুন')}).click();
            await waitForTemplateCart();
            assert.equal(await page.getByTestId('pos-cart-row').count(),firstCartCount,`${suffix} repeated same template works`);

            menu=await openMenu();
            await menu.getByTestId('pos-new-template').click();
            const editor=page.getByRole('dialog',{name:labels('New sale template','বিক্রির নতুন নমুনা')});
            await editor.waitFor();
            const bounds=await editor.boundingBox();
            assert.ok(bounds&&bounds.x>=-1&&bounds.x+bounds.width<=width+1,`${suffix} editor fits viewport`);
            await editor.getByRole('button',{name:labels('Cancel','বাতিল')}).click();
            assert.equal(await page.getByTestId('pos-cart-row').count(),firstCartCount,`${suffix} closing template editor preserves sale`);
            assert.deepEqual(errors,[],`${suffix} browser errors`);
            checks++;console.log(`PASS ${suffix}`);
          }finally{await context.close();}
        }
    console.log(`POS quick customer/template journeys passed ${checks}/8`);
  }finally{await browser.close();await server.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
