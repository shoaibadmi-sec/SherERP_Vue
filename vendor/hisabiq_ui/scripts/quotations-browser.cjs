const {chromium}=require('playwright');
const assert=require('node:assert/strict');
async function main(){
 const {createServer}=await import('vite');
 const server=await createServer({server:{host:'127.0.0.1',port:4210,strictPort:true}});
 await server.listen();
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--no-zygote','--disable-gpu','--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:{width:process.env.TEST_MOBILE==='1'?390:1280,height:850},reducedMotion:'reduce'});
 await page.route('https://fonts.googleapis.com/**',r=>r.fulfill({contentType:'text/css',body:''}));
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto('http://127.0.0.1:4210/#/app/quotations',{waitUntil:'domcontentloaded',timeout:120000});
  await page.getByRole('button',{name:'New quotation'}).click();
  const dlg=page.getByRole('dialog',{name:'New quotation'});
  await dlg.getByLabel('Quotation customer name').fill('Quotation Browser Customer');
  await dlg.getByRole('combobox',{name:'Add product to quotation'}).click();
  await page.getByRole('listbox',{name:'Add product to quotation options'})
   .getByRole('option',{name:/LED Bulb 12W/}).click();
  await dlg.getByRole('radiogroup',{name:'Unit row 1'}).getByRole('radio',{name:'Box'}).click();
  await dlg.getByLabel('Quantity row 1',{exact:true}).fill('2');
  const pcs=dlg.getByLabel('Pcs quantity row 1',{exact:true});
  await pcs.fill('5');
  // Both number fields must stay within ONE POS-style quantity cell, not cross into the unit buttons.
  const qty=dlg.getByTestId('compound-quantity');
  const unit=dlg.getByRole('radiogroup',{name:'Unit row 1'});
  const geometry=await Promise.all([qty.boundingBox(),unit.boundingBox(),pcs.boundingBox()]);
  assert.ok(geometry.every(Boolean),'compound quantity and unit must be rendered');
  assert.ok(geometry[0].x+geometry[0].width<=geometry[1].x-1 || geometry[0].y+geometry[0].height<=geometry[1].y || geometry[1].y+geometry[1].height<=geometry[0].y,'quantity input must not overlap unit switch');
  assert.ok(geometry[2].x+geometry[2].width<=geometry[0].x+geometry[0].width,'small-unit input must be contained');
  await dlg.getByText('3,875',{exact:false}).first().waitFor();
  await pcs.press('Enter');
  assert.equal(await dlg.getByRole('combobox',{name:'Add product to quotation'}).evaluate(el=>document.activeElement===el),true);
  await pcs.fill('0');
  await pcs.press('Enter');
  await dlg.getByLabel('Quotation discount', {exact:true}).fill('50');
  await dlg.getByText('3,050',{exact:false}).first().waitFor();
  await dlg.getByRole('button',{name:'Save draft'}).click();
  await dlg.waitFor({state:'hidden'});
  await page.getByText('Quotation Browser Customer',{exact:true}).first().waitFor();
  const row=process.env.TEST_MOBILE==='1'?page.locator('.sales-mobile-record').filter({hasText:'Quotation Browser Customer'}):page.getByRole('row').filter({hasText:'Quotation Browser Customer'});
  await row.getByRole('button',{name:process.env.TEST_MOBILE==='1'?/QT-000043/:'QT-000043',exact:process.env.TEST_MOBILE!=='1'}).first().click();
  const details=page.getByRole('dialog',{name:'Quotation QT-000043'});
  await details.getByText('LED Bulb 12W',{exact:true}).waitFor();
  await details.getByRole('button',{name:'Mark sent'}).click();
  await details.getByText('Sent',{exact:true}).first().waitFor();
  await details.getByRole('button',{name:'Duplicate'}).click();
  const copied=page.getByRole('dialog',{name:'Quotation QT-000044'});
  await copied.getByText('Draft',{exact:true}).first().waitFor();
  await copied.getByRole('button',{name:'Delete draft'}).click();
  const confirm=page.getByRole('dialog',{name:'Confirm delete quotation'});
  await confirm.getByRole('button',{name:'Delete draft'}).click();
  await confirm.waitFor({state:'hidden'});
  await page.setViewportSize({width:375,height:812});
  assert.equal(await page.getByRole('button',{name:'New quotation'}).isVisible(),true);
  assert.deepEqual(errors,[]);
  console.log('Quotations browser: create, compound-unit price, discount, status, duplicate, delete and mobile passed');
 }finally{await browser.close();await server.close();}
}
main().catch(err=>{console.error(err);process.exitCode=1;});
