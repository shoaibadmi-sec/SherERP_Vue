const {chromium}=require('playwright');
const assert=require('node:assert/strict');

async function main(){
 const {createServer}=await import('vite');
 const server=await createServer({server:{host:'127.0.0.1',port:4292,strictPort:true}});
 await server.listen();
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1280,height:900},reducedMotion:'reduce'});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto('http://127.0.0.1:4292/#/app/vendors?partyId=v1&tab=given');
  const work=page.getByRole('region',{name:'Given product workplace'});
  const receipt=work.getByRole('region',{name:'Vendor settlement workspace'});
  await receipt.waitFor();
  assert.equal(await receipt.getByRole('textbox',{name:'Receive amount'}).count(),0,
   'Do not ask for the amount in a second field');
  const first=receipt.getByRole('textbox',{name:'Split amount 1'});
  await first.waitFor();
  assert.equal(await first.inputValue(),'128','Default suggestion is full source due');
  await first.fill('50');
  await receipt.getByRole('button',{name:/Add account/}).click();
  await receipt.getByRole('textbox',{name:'Split amount 2'}).fill('28');
  await receipt.getByText('৳78').first().waitFor();
  await receipt.getByRole('button',{name:'Save Receipt'}).click();
  await work.getByText('৳50').first().waitFor();
  assert.deepEqual(errors,[]);
  console.log('Single-entry Vendor receipt amount and two-account split verified');
 }finally{await browser.close();await server.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
