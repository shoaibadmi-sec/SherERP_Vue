const {chromium}=require('playwright');
const assert=require('node:assert/strict');
async function main(){
 const {createServer}=await import('vite');
 const server=await createServer({server:{host:'127.0.0.1',port:4247,strictPort:true}});
 await server.listen();
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1270,height:850},reducedMotion:'reduce'});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto('http://127.0.0.1:4247/#/app/vendors?partyId=v1&tab=given');
  const vendor=page.getByRole('region',{name:'Selected Vendor work'});
  await vendor.getByRole('button',{name:'Give Products'}).click();
  await page.getByRole('form',{name:'Give products editor'}).waitFor();
  assert.equal(await page.getByRole('dialog',{name:'Give products to Vendor'}).count(),0);
  await vendor.getByRole('tab',{name:/Purchases/}).click();
  assert.equal(await vendor.getByRole('button',{name:'Buy Products'}).count(),0,'Purchase editor opens when tab is selected');
  await vendor.getByText('Purchase details').waitFor();
  assert.ok(await vendor.getByText(/Supplier memo/).count()>=1);
  const memo=vendor.getByRole('textbox',{name:/Supplier memo no/});
  await memo.fill('PO-KEEP-001');
  await vendor.getByRole('tab',{name:/Given/}).click();
  await vendor.getByRole('tab',{name:/Purchases/}).click();
  assert.equal(await vendor.getByRole('textbox',{name:/Supplier memo no/}).inputValue(),'PO-KEEP-001','Purchases tab retains its draft');
  assert.equal(await page.getByRole('dialog',{name:'Buy products from Vendor'}).count(),0);
  await vendor.getByRole('button',{name:'Cancel'}).last().click();
  await vendor.getByText(/Previous Purchases/).click();
  await vendor.getByText('No purchases from this Vendor yet.').waitFor();
  assert.deepEqual(errors,[]);
  console.log('Vendor inline Given cart and full-width Purchase editor verified');
 }finally{await browser.close();await server.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
