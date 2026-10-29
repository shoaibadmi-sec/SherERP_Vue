const {chromium}=require('playwright');
const assert=require('node:assert/strict');
async function main(){
 const {createServer}=await import('vite');
 const server=await createServer({server:{host:'127.0.0.1',port:4271,strictPort:true}});
 await server.listen();
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1300,height:870},reducedMotion:'reduce'});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto('http://127.0.0.1:4271/#/app/parties?id=v1&role=Vendor');
  await page.getByRole('tab',{name:'Ledger'}).waitFor();
  assert.equal(await page.getByRole('tab',{name:/Bills & Memos/}).count(),1);
  assert.equal(await page.getByRole('tab',{name:/Payments/}).count(),1);
  assert.equal(await page.getByRole('tab',{name:/Notes/}).count(),1);
  assert.equal(await page.getByRole('tab',{name:/Attachments/}).count(),1);
  await page.getByText('You owe · দেনা').first().waitFor();
  await page.getByText('Vendor owes · পাওনা').first().waitFor();
  await page.getByRole('button',{name:/Open Vendor Work/}).click();
  await page.getByRole('region',{name:'Vendor module'}).waitFor();
  assert.ok(page.url().includes('partyId=v1'));
  await page.goto('http://127.0.0.1:4271/#/app/parties?id=s1&role=Supplier');
  await page.getByRole('tab',{name:'Ledger'}).waitFor();
  assert.equal(await page.getByRole('tab',{name:/Invoices/}).count(),1);
  await page.setViewportSize({width:390,height:830});
  assert.deepEqual(errors,[]);
  console.log('Shared Vendor/Supplier Party shell and Vendor deep link verified');
 }finally{await browser.close();await server.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
