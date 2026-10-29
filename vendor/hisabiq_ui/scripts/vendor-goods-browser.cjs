const {chromium}=require('playwright');
const assert=require('node:assert/strict');
async function main(){
 const {createServer}=await import('vite');
 const server=await createServer({server:{host:'127.0.0.1',port:4272,strictPort:true}});
 await server.listen();
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1250,height:900},reducedMotion:'reduce'});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto('http://127.0.0.1:4272/#/app/vendors?partyId=v1&tab=given');
  const work=page.getByRole('region',{name:'Selected Vendor work'});
  await work.waitFor();
  await work.getByRole('button',{name:/Give Products/}).first().click();
  const editor=page.getByRole('form',{name:'Give products editor'});
  await editor.waitFor();
  assert.equal(await page.getByRole('dialog',{name:/Give products/}).count(),0,'full cart must be inline, not modal');
  await editor.getByRole('combobox',{name:'Search products to add to Vendor memo'}).fill('LED Bulb');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await editor.getByRole('textbox',{name:/Quantity for/}).first().waitFor();
  await editor.getByRole('button',{name:/Save Given Products/}).click();
  await editor.getByRole('alert').getByText(/price/i).waitFor();
  assert.deepEqual(errors,[]);
  console.log('Vendor Give product cart is inline, searchable and validates agreed price');
 }finally{await browser.close();await server.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
