const {chromium}=require('playwright');
const assert=require('node:assert/strict');
async function main(){
 const {createServer}=await import('vite');
 const server=await createServer({server:{host:'127.0.0.1',port:4246,strictPort:true}});
 await server.listen();
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1280,height:900},reducedMotion:'reduce'});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto('http://127.0.0.1:4246/#/app/vendors?partyId=v1&tab=taken');
  const vendor=page.getByRole('region',{name:'Selected Vendor work'});
  const work=vendor.getByRole('region',{name:'Taken product workplace'});
  const price=work.getByRole('form',{name:'Set Vendor price'});
  await price.getByRole('textbox',{name:'Agreed cost per Pcs'}).fill('110');
  await price.getByRole('button',{name:'Confirm Vendor Price'}).click();
  await vendor.getByText('৳330').first().waitFor();
  const clear=page.getByRole('form',{name:'Clear Vendor due'});
  await clear.getByRole('textbox',{name:'Money from account 1'}).fill('200');
  await clear.getByRole('button',{name:'Save Settlement'}).click();
  await vendor.getByText('৳130').first().waitFor();
  await clear.getByRole('textbox',{name:'Products to return'}).fill('1');
  await clear.getByRole('button',{name:'Save Settlement'}).click();
  // The settlement editor stays open beside the invoice list after saving.
  await vendor.getByText('৳20').first().waitFor();
  assert.deepEqual(errors,[]);
  console.log('Vendor set price, partial money payment and product return verified');
 }finally{await browser.close();await server.close();}
}
main().catch(err=>{console.error(err);process.exitCode=1;});
