const {chromium}=require('playwright');
const assert=require('node:assert/strict');
async function main(){
 const {createServer}=await import('vite');
 const server=await createServer({server:{host:'127.0.0.1',port:4270,strictPort:true}});
 await server.listen();
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1280,height:900},reducedMotion:'reduce'});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto('http://127.0.0.1:4270/#/app/vendors');
  await page.getByRole('region',{name:'Vendor module'}).waitFor();
  const nav=page.getByRole('navigation',{name:'Main'});
  await nav.getByRole('link',{name:/Vendor/}).first().waitFor();
  await page.getByRole('textbox',{name:'Search Vendors'}).fill('Shapla');
  await page.getByRole('listbox',{name:'Vendors'}).getByRole('option',{name:/Shapla Transport/}).click();
  const tabs=page.getByRole('tablist',{name:'Vendor work tabs'});
  assert.equal(await tabs.getByRole('tab').count(),5);
  await tabs.getByRole('tab',{name:/Taken/}).click();
  await page.getByRole('region',{name:'Taken product workplace'}).waitFor();
  assert.equal(await page.getByRole('form',{name:'Set Vendor price'}).count(),1,'unpriced source editable inside Vendor workplace');
  assert.ok(page.url().includes('tab=taken'));
  await page.reload();
  assert.equal(await tabs.getByRole('tab',{name:/Taken/}).getAttribute('aria-selected'),'true');
  await page.setViewportSize({width:390,height:840});
  assert.deepEqual(errors,[]);
  console.log('Top-level Vendor route, five tabs and responsive selection verified');
 }finally{await browser.close();await server.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
