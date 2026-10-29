/* Installment collection preview — native POS, source splits, mobile dialog. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
async function main(){
 const {createServer}=await import('vite');
 const server=await createServer({server:{host:'127.0.0.1',port:4193,strictPort:true}});
 await server.listen();
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
   await page.goto('http://127.0.0.1:4193/#/app/pos');
   await page.getByTestId('pos-cart-row').first().waitFor();
   const checkout=page.locator('[data-pos-checkout]');
   await checkout.getByRole('button',{name:/Installment sale/i}).click();
   await checkout.getByRole('textbox',{name:/Payment amount 1/i}).fill('3000');
   await checkout.getByRole('button',{name:/Add customer/i}).click();
   const add=page.getByRole('dialog',{name:/Quick add customer/i});
   await add.getByRole('textbox',{name:/Customer name/i}).fill('Collection Demo Customer');
   await add.getByRole('textbox',{name:/Phone/i}).fill('01711777111');
   await add.getByRole('button',{name:/Save customer/i}).click();
   await checkout.getByRole('button',{name:/Preview sale/i}).click();
   await page.getByRole('dialog',{name:/Review sale/i}).getByRole('button',{name:/Confirm sale preview/i}).click();
   await page.getByRole('button',{name:/Receive payment/i}).click();
   let modal=page.getByRole('dialog',{name:/Receive installment payment/i});
   await modal.waitFor();
   await modal.getByRole('textbox',{name:/Payment amount/i}).fill('500');
   await modal.getByRole('button',{name:/Review payment/i}).click();
   await modal.getByRole('button',{name:/Confirm receipt preview/i}).click();
   await page.getByText(/Installment schedule/i).first().click();
   await page.getByText(/Receipt history/i).first().waitFor();
   assert.equal(await page.getByText(/Receipt #1/i).count(),1,'one receipt visible');
   await page.getByRole('button',{name:/Receive payment/i}).click();
   modal=page.getByRole('dialog',{name:/Receive installment payment/i});
   await modal.getByRole('textbox',{name:/Payment amount/i}).fill('999999');
   await modal.getByRole('button',{name:/Review payment/i}).click();
   await modal.getByRole('alert').first().waitFor();
   assert.match((await modal.getByRole('alert').first().textContent())||'',/exceed|advance|change/i,
     'excess money needs a clear advance or change explanation');
   await modal.getByRole('button',{name:/Cancel/i}).click();
   assert.equal(await page.getByText(/Receipt #2/i).count(),0,'invalid/cancelled payment creates no receipt');
   await page.setViewportSize({width:390,height:740});
   await page.getByRole('button',{name:/Receive payment/i}).click();
   modal=page.getByRole('dialog',{name:/Receive installment payment/i});
   const rect=await modal.boundingBox();
   assert.ok(rect&&rect.x>=-1&&rect.x+rect.width<=392,'collection dialog stays inside phone width');
   await modal.getByRole('button',{name:/Cancel/i}).scrollIntoViewIfNeeded();
   await modal.getByRole('button',{name:/Cancel/i}).click();
   // A saved preview remains accessible even after closing the sale success dialog.
   await page.getByRole('button',{name:/New sale/i}).click();
   await page.getByRole('button',{name:/Installment previews/i}).click();
   const history=page.getByRole('dialog',{name:/Installment previews/i});
   await history.waitFor();
   await history.getByRole('button',{name:/Collection Demo Customer/i}).click();
   await history.getByText(/Installment schedule/i).first().click();
   await history.getByText(/Receipt #1/i).first().waitFor();
   assert.deepEqual(errors,[]);
   console.log('Installment receipt preview, cancel and mobile dialog passed.');
 }finally{await browser.close();await server.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
