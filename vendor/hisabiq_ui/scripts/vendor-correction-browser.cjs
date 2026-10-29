const {chromium}=require('playwright');
const assert=require('node:assert/strict');
async function main(){
 const {createServer}=await import('vite');
 const server=await createServer({server:{host:'127.0.0.1',port:4252,strictPort:true}});
 await server.listen();
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1200,height:850},reducedMotion:'reduce'});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto('http://127.0.0.1:4252/#/app/vendors?partyId=v1&tab=taken');
  const vendor=page.getByRole('region',{name:'Selected Vendor work'});
  await vendor.getByRole('region',{name:'Taken product workplace'}).getByRole('button',{name:'Correct'}).click();
  const review=page.getByRole('dialog',{name:'Review Vendor correction'});
  await review.waitFor();
  const save=review.getByRole('button',{name:'Save corrected demo source'});
  await save.click();
  await review.getByRole('alert').getByText(/reason/i).waitFor();
  await review.getByRole('textbox',{name:'Corrected source quantity'}).fill('2');
  await review.getByRole('textbox',{name:'Vendor correction reason'}).fill('Vendor verified two pieces, not three');
  await save.click();
  await review.waitFor({state:'hidden'});
  await vendor.getByText('2 Pcs').first().waitFor();
  await vendor.getByRole('tab',{name:/Ledger/}).click();
  assert.match(await vendor.innerText(),/Reversal of sourcing/i);
  assert.deepEqual(errors,[]);
  console.log('Vendor guarded source correction and compensating audit entry verified');
 }finally{await browser.close();await server.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
