/* HisabIQ Phase 3: native POS agreement lifecycle, modal, browser-only previews. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
async function main(){
 const {createServer}=await import('vite');
 const server=await createServer({server:{host:'127.0.0.1',port:4199,strictPort:true}});
 await server.listen();
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto('http://127.0.0.1:4199/#/app/pos');
  await page.getByTestId('pos-cart-row').first().waitFor();
  const checkout=page.locator('[data-pos-checkout]');
  await checkout.getByRole('button',{name:/Installment sale/i}).click();
  await checkout.getByRole('button',{name:/Add customer/i}).click();
  const customer=page.getByRole('dialog',{name:/Quick add customer/i});
  await customer.getByRole('textbox',{name:/Customer name/i}).fill('Lifecycle Demo Customer');
  await customer.getByRole('textbox',{name:/Phone/i}).fill('01711777112');
  await customer.getByRole('button',{name:/Save customer/i}).click();
  await checkout.getByRole('button',{name:/Preview sale/i}).click();
  await page.getByRole('dialog',{name:/Review sale/i}).getByRole('button',{name:/Confirm sale preview/i}).click();
  await page.getByRole('button',{name:/Edit schedule/i}).click();
  let modal=page.getByRole('dialog',{name:/Edit installment schedule/i});
  await modal.waitFor();
  await modal.getByRole('button',{name:/Cancel/i}).click();
  await page.getByRole('button',{name:/Return item/i}).click();
  modal=page.getByRole('dialog',{name:/Installment return preview/i});
  await modal.waitFor();
  await modal.getByRole('button',{name:/Cancel/i}).click();
  await page.getByRole('button',{name:/Settlement/i}).click();
  modal=page.getByRole('dialog',{name:/Installment settlement/i});
  await modal.waitFor();
  await modal.getByRole('textbox',{name:/Settlement amount/i}).fill('50');
  await modal.getByRole('textbox',{name:/Reason/i}).fill('Manager-approved settlement preview');
  await modal.getByRole('button',{name:/Review adjustment/i}).click();
  await modal.getByRole('button',{name:/Confirm preview/i}).click();
  await page.getByText(/Installment schedule/i).first().click();
  await page.getByText(/Lifecycle history/i).first().waitFor();
  // Regression: a lifecycle reduction must not disable subsequent collections.
  await page.getByRole('button',{name:/Receive payment/i}).click();
  const payment=page.getByRole('dialog',{name:/Receive installment payment/i});
  await payment.waitFor();
  await payment.getByRole('textbox',{name:/Payment amount/i}).fill('10');
  await payment.getByRole('button',{name:/Review payment/i}).click();
  await payment.getByRole('button',{name:/Confirm receipt preview/i}).click();
  await page.getByText(/Receipt #1/i).first().waitFor();
  await page.setViewportSize({width:390,height:740});
  await page.getByRole('button',{name:/Edit schedule/i}).click();
  modal=page.getByRole('dialog',{name:/Edit installment schedule/i});
  await modal.waitFor();
  const rect=await modal.boundingBox();
  assert.ok(rect&&rect.x>=-1&&rect.x+rect.width<=392,'mobile lifecycle dialog fits viewport');
  await modal.getByRole('button',{name:/Cancel/i}).scrollIntoViewIfNeeded();
  await modal.getByRole('button',{name:/Cancel/i}).click();
  assert.deepEqual(errors,[]);
  console.log('Installment lifecycle preview dialogs, settlement, mobile and cancel passed.');
 }finally{await browser.close();await server.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
