const {chromium}=require('playwright');
const assert=require('node:assert/strict');
async function main(){
 const {createServer}=await import('vite');
 const server=await createServer({server:{host:'127.0.0.1',port:4244,strictPort:true}});
 await server.listen();
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1250,height:850},reducedMotion:'reduce',acceptDownloads:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto('http://127.0.0.1:4244/#/app/vendors?partyId=v1&tab=taken');
  const vendor=page.getByRole('region',{name:'Selected Vendor work'});
  await vendor.waitFor();
  await vendor.getByRole('tab',{name:/Taken/}).waitFor();
  await vendor.getByRole('form',{name:'Set Vendor price'}).waitFor();
  const nav=page.getByRole('navigation',{name:'Main'});
  await nav.getByRole('link',{name:'Vendor'}).waitFor();
  await vendor.getByRole('tab',{name:/Ledger/}).click();
  await vendor.getByRole('button',{name:'Print Ledger'}).click();
  const dialog=page.getByRole('dialog',{name:'Vendor ledger statement'});
  await dialog.waitFor();
  const downloaded=page.waitForEvent('download');
  await dialog.getByRole('button',{name:/Export CSV/}).click();
  assert.match((await downloaded).suggestedFilename(),/vendor-ledger-/);
  await dialog.getByRole('button',{name:'Close'}).first().click();
  await page.setViewportSize({width:390,height:800});
  assert.deepEqual(errors,[]);
  console.log('Vendor top-level ledger and CSV statement preview verified');
 }finally{await browser.close();await server.close();}
}
main().catch(err=>{console.error(err);process.exitCode=1;});
