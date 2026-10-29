/* Sales Return bundle: phone/tablet whole Sets, nested component disposition and preview only. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
async function main(){
 const {createServer}=await import('vite');
 const server=await createServer({server:{host:'127.0.0.1',port:4498,strictPort:true}});
 await server.listen();
 const browser=await chromium.launch({args:['--no-sandbox']});
 try{
  for(const viewport of [{width:390,height:844},{width:1024,height:768}]){
   const page=await browser.newPage({viewport,reducedMotion:'reduce'});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:4498/#/app/sales?tab=return');
   const customer=page.locator('.rounded-xl').filter({has:page.getByText('Choose customer',{exact:true})}).first().getByRole('combobox').first();
   await customer.click();
   await page.getByRole('option',{name:'Package Demo Customer'}).click();
   await page.locator('label').filter({hasText:'INV-DEMO-BUNDLE'}).locator('input[type="checkbox"]').check();
   const qty=page.getByRole('textbox',{name:/Whole Sets to return for Tubewell Package/});
   await qty.fill('1.5');
   await page.getByRole('button',{name:/Preview return only/}).click();
   const dialog=page.getByRole('dialog',{name:'Bundle return preview'});
   await dialog.waitFor();
   await dialog.getByText(/whole Sets within the original remaining quantity/).waitFor();
   await page.keyboard.press('Escape');
   await dialog.waitFor({state:'hidden'});
   await qty.fill('1');
   const pipe=page.getByRole('combobox',{name:/Disposition for PVC Pipe/});
   await pipe.click();
   await page.getByRole('option',{name:/Restock.*inspection required/}).click();
   const valve=page.getByRole('combobox',{name:/Disposition for Gate Valve/});
   await valve.click();
   await page.getByRole('option',{name:/Do not restock.*damaged/}).click();
   await page.getByRole('textbox',{name:/Returned serials for Gate Valve/}).fill('GV34-1001');
   const oldBody=await page.locator('body').innerText();
   assert.match(oldBody,/INV-DEMO-BUNDLE/);
   await page.getByRole('button',{name:/Preview return only/}).click();
   await dialog.waitFor();
   assert.match(await dialog.innerText(),/3,800|3800/);
   assert.match(await dialog.innerText(),/PVC Pipe/);
   assert.match(await dialog.innerText(),/Gate Valve/);
   assert.equal(await dialog.getByRole('alert').count(),0);
   assert.match(await dialog.innerText(),/No stock, refund, credit, invoice or ledger posting/);
   await dialog.getByRole('button',{name:'Close preview'}).click();
   await dialog.waitFor({state:'hidden'});
   assert.deepEqual(errors,[]);
   await page.close();
  }
  console.log('Whole-Set historical return dialogs passed on phone and tablet; preview did not post inventory');
 }finally{await browser.close();await server.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1});
