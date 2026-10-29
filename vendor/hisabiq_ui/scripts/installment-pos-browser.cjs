/* HisabIQ installment POS V2 interaction / mobile overlay regression. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');

async function main(){
  const {createServer}=await import('vite');
  const server=await createServer({server:{host:'127.0.0.1',port:4187,strictPort:true}});
  await server.listen();
  const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:1460,height:950},reducedMotion:'reduce'});
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  try{
    await page.goto('http://127.0.0.1:4187/#/app/pos');
    await page.getByTestId('pos-cart-row').first().waitFor();
    const beforeCart=await page.getByTestId('pos-cart-row').count();
    assert.ok(beforeCart>=1,'original POS V2 cart remains mounted');
    await page.getByRole('button',{name:/Installment sale/i}).click();
    const checkout=page.locator('[data-pos-checkout]');
    const initialInvoice=(await checkout.getByText(/^INV-\d{6}$/).first().textContent())?.trim();
    assert.ok(initialInvoice,'capture initial invoice reference for navigation reuse test');
    await checkout.getByText('Installment terms').waitFor();
    assert.equal(await checkout.locator('input[aria-label="Installment selling price"]').count(),0,
      'installment price is edited in the original cart, not duplicated at checkout');
    const splitInput=checkout.getByRole('textbox',{name:/Payment amount 1/i});
    await splitInput.fill('3000');
    await checkout.getByText(/Future balance/).waitFor();
    await checkout.getByRole('button',{name:/View \/ Edit/i}).click();
    let dialog=page.getByRole('dialog',{name:/Installment breakdown/i});
    await dialog.waitFor();
    assert.equal(await dialog.getByRole('textbox',{name:/Installment \d+ amount/i}).count(),6);
    const first=dialog.getByRole('textbox',{name:/Installment 1 amount/i});
    const original=await first.inputValue();
    await first.fill('1');
    assert.equal(await dialog.getByRole('button',{name:/Apply breakdown/i}).isDisabled(),true,
      'imbalanced schedule cannot be applied');
    await dialog.getByRole('button',{name:/Cancel/i}).click();
    await checkout.getByRole('button',{name:/View \/ Edit/i}).click();
    dialog=page.getByRole('dialog',{name:/Installment breakdown/i});
    await dialog.waitFor();
    assert.equal(await dialog.getByRole('textbox',{name:/Installment 1 amount/i}).inputValue(),original,
      'Cancel never changes the parent schedule');
    await dialog.getByRole('button',{name:/Due date 1:/i}).click();
    await page.getByRole('dialog',{name:/calendar/i}).waitFor();
    await page.keyboard.press('Escape');
    assert.equal(await dialog.isVisible(),true,'closing date popup does not close parent dialog');
    await dialog.getByRole('button',{name:/Cancel/i}).click();
    // Previously the parent treated every row as manually locked on Apply,
    // making Rebalance Remaining unusable after the down payment changed.
    await checkout.getByRole('button',{name:/View \/ Edit/i}).click();
    dialog=page.getByRole('dialog',{name:/Installment breakdown/i});
    await dialog.waitFor();
    const negotiated=String(Math.round(Number(original)*0.8*100)/100);
    await dialog.getByRole('textbox',{name:/Installment 1 amount/i}).fill(negotiated);
    await dialog.getByRole('button',{name:/Rebalance/i}).click();
    assert.equal(await dialog.getByRole('button',{name:/Apply breakdown/i}).isEnabled(),true);
    await dialog.getByRole('button',{name:/Apply breakdown/i}).click();
    await splitInput.fill('3001');
    await checkout.getByRole('button',{name:/View \/ Edit/i}).click();
    dialog=page.getByRole('dialog',{name:/Installment breakdown/i});
    await dialog.waitFor();
    assert.equal(await dialog.getByRole('button',{name:/Apply breakdown/i}).isDisabled(),true);
    await dialog.getByRole('button',{name:/Rebalance/i}).click();
    assert.equal(await dialog.getByRole('button',{name:/Apply breakdown/i}).isEnabled(),true,
      'a manually edited row stays fixed but other rows can rebalance after down payment changes');
    assert.equal(await dialog.getByRole('textbox',{name:/Installment 1 amount/i}).inputValue(),negotiated,
      'custom installment remains unchanged during partial rebalance');
    await dialog.getByRole('button',{name:/Apply breakdown/i}).click();

    await page.setViewportSize({width:390,height:740});
    await checkout.getByRole('button',{name:/View \/ Edit/i}).click();
    dialog=page.getByRole('dialog',{name:/Installment breakdown/i});
    await dialog.waitFor();
    const rect=await dialog.boundingBox();
    assert.ok(rect&&rect.x>=-1&&rect.x+rect.width<=392,
      'mobile modal must remain inside 390px viewport');
    await dialog.getByRole('button',{name:/Apply breakdown/i}).scrollIntoViewIfNeeded();
    await dialog.getByRole('button',{name:/Cancel/i}).click();
    await page.evaluate(()=>document.documentElement.classList.add('dark'));
    await checkout.getByRole('button',{name:/View \/ Edit/i}).click();
    dialog=page.getByRole('dialog',{name:/Installment breakdown/i});
    await dialog.getByRole('button',{name:/Cancel/i}).click();
    await page.evaluate(()=>document.documentElement.classList.remove('dark'));

    // Quick-add must reuse the existing Party preview store, not a shadow customer list.
    await checkout.getByRole('button',{name:/Add customer/i}).click();
    const quickAdd=page.getByRole('dialog',{name:/Quick add customer/i});
    await quickAdd.waitFor();
    await quickAdd.getByRole('textbox',{name:/Customer name/i}).fill('Installment Demo New Customer');
    await quickAdd.getByRole('textbox',{name:/Phone/i}).fill('01712345678');
    await quickAdd.getByRole('textbox',{name:/Address/i}).fill('Rajshahi');
    await quickAdd.getByRole('button',{name:/Save customer/i}).click();
    await checkout.getByText('Installment Demo New Customer').first().waitFor();
    assert.equal(await quickAdd.count(),0,'quick add closes after saving and selecting customer');
    await checkout.getByRole('button',{name:/Preview sale/i}).click();
    const review=page.getByRole('dialog',{name:/Review sale/i});
    await review.waitFor();
    await review.getByRole('button',{name:/Confirm sale preview/i}).click();
    await page.getByText(/Sale preview · Not posted/i).waitFor();
    assert.ok(await page.getByText(/Installment schedule/i).count()>0,
      'sale preview includes the agreement breakdown');
    await page.getByRole('button',{name:/New sale/i}).click();
    await page.evaluate(()=>{window.location.hash='#/app/dashboard';});
    await page.waitForURL(url=>url.hash==='#/app/dashboard');
    await page.evaluate(()=>{window.location.hash='#/app/pos';});
    await page.getByTestId('pos-cart-row').first().waitFor();
    const reopenedInvoice=(await page.locator('[data-pos-checkout]')
      .getByText(/^INV-\d{6}$/).first().textContent())?.trim();
    assert.notEqual(reopenedInvoice,initialInvoice,
      'reopening POS must never reuse a preview invoice reference already linked to an agreement');
    assert.deepEqual(errors,[],'no uncaught browser runtime errors');
    console.log('Installment POS desktop/mobile, modal, date popup, review tests passed.');
  }finally{await browser.close();await server.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
