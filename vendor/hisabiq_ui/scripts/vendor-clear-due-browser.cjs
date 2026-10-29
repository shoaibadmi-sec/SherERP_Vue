const {chromium}=require('playwright');
const assert=require('node:assert/strict');
async function main(){
 const {createServer}=await import('vite');
 const server=await createServer({server:{host:'127.0.0.1',port:4273,strictPort:true}});
 await server.listen();
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1280,height:900},reducedMotion:'reduce'});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto('http://127.0.0.1:4273/#/app/vendors?partyId=v1&tab=taken');
  const vendor=page.getByRole('region',{name:'Selected Vendor work'});
  const work=vendor.getByRole('region',{name:'Taken product workplace'});
  const price=work.getByRole('form',{name:'Set Vendor price'});
  await price.getByRole('textbox',{name:'Agreed cost per Pcs'}).fill('110');
  await price.getByRole('button',{name:'Confirm Vendor Price'}).click();
  const form=page.getByRole('form',{name:'Clear Vendor due'});
  await form.getByRole('textbox',{name:'Money from account 1'}).fill('110');
  await form.getByRole('textbox',{name:'Products to return'}).fill('1');
  await form.getByRole('button',{name:'Save Settlement'}).click();
  await work.getByRole('form',{name:'Clear Vendor due'}).waitFor();
  await vendor.getByText('৳110').first().waitFor();
  await vendor.getByRole('tab',{name:/Ledger/}).click();
  assert.match(await vendor.innerText(),/Money paid and products returned/i);
  assert.deepEqual(errors,[]);
  console.log('Combined money + products Clear Due committed in one demo operation');
 }finally{await browser.close();await server.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
