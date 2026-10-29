const {chromium}=require('playwright');
const assert=require('node:assert/strict');
async function main(){
 const {createServer}=await import('vite');
 const server=await createServer({server:{host:'127.0.0.1',port:4297,strictPort:true}});
 await server.listen();
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
 try{
  for(const width of [390,768,1024,1440])for(const theme of ['light','dark']){
   const page=await browser.newPage({viewport:{width,height:900},colorScheme:theme,reducedMotion:'reduce'});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:4297/#/app/vendors');
   if(width<640){
    await page.getByRole('button',{name:'Choose Vendor'}).click();
    const picker=page.getByRole('dialog',{name:'Choose Vendor'});
    await picker.getByRole('button',{name:/Needs price/}).click();
    await picker.getByRole('listbox',{name:'Vendors'}).getByRole('option',{name:/Shapla Transport/}).click();
    await picker.waitFor({state:'hidden'});
   }else{
    await page.getByRole('button',{name:/Needs price/}).click();
    await page.getByRole('listbox',{name:'Vendors'}).getByRole('option',{name:/Shapla Transport/}).click();
   }
   const tabs=page.getByRole('tablist',{name:'Vendor work tabs'});
   const work=page.getByRole('region',{name:'Taken product workplace'});
   const price=work.getByRole('form',{name:'Set Vendor price'});
   await price.waitFor();
   assert.equal(await work.evaluate(el=>getComputedStyle(el).display),'block');
   const unit=await price.getByRole('combobox',{name:'Vendor price unit'}).boundingBox();
   const amount=await price.locator('[data-numeric-input]').boundingBox();
   assert.ok(unit&&amount,'Both price controls must be visible');
   assert.ok(Math.abs(unit.y-amount.y)<=1&&Math.abs(unit.height-amount.height)<=1,
    'Vendor price unit and cost input must align exactly at '+width+': '+JSON.stringify({unit,amount}));
   await work.getByRole('button',{name:'Browse memos'}).click();
   const dialog=page.getByRole('dialog',{name:'Select Vendor memo'});
   await dialog.waitFor();
   const search=dialog.getByRole('textbox',{name:'Search Vendor memos'});
   await search.fill('PVC Pipe');
   assert.equal(await dialog.getByRole('listbox',{name:'Vendor memo choices'}).getByRole('option').count(),1);
   await page.keyboard.press('Escape');
   await dialog.waitFor({state:'hidden'});
   await work.getByRole('button',{name:'Browse memos'}).click();
   await dialog.getByRole('textbox',{name:'Search Vendor memos'}).fill('DEMO-INV');
   await page.keyboard.press('Enter');
   await dialog.waitFor({state:'hidden'});
   await price.waitFor();

   await tabs.getByRole('tab',{name:/Given/}).click();
   const given=page.getByRole('region',{name:'Given product workplace'});
   await given.getByRole('region',{name:'Vendor settlement workspace'}).waitFor();
   await given.getByRole('button',{name:'Browse memos'}).click();
   await dialog.waitFor();
   await dialog.getByRole('listbox',{name:'Vendor memo choices'}).getByRole('option').first().click();
   await dialog.waitFor({state:'hidden'});
   await given.getByRole('region',{name:'Vendor settlement workspace'}).waitFor();

   await tabs.getByRole('tab',{name:/Payments/}).click();
   const payments=page.getByRole('region',{name:'Vendor payments workspace'});
   await payments.waitFor();
   await payments.getByRole('button',{name:'Browse memos'}).click();
   await dialog.waitFor();
   await dialog.getByRole('listbox',{name:'Vendor memo choices'}).getByRole('option').first().click();
   await dialog.waitFor({state:'hidden'});
   await payments.getByRole('region',{name:'Vendor settlement workspace'}).waitFor();
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'no page overflow at '+width);
   assert.deepEqual(errors,[]);
   await page.close();
  }
  console.log('Vendor modal memo picker, keyboard and price-field alignment passed in 8 light/dark viewport combinations');
 }finally{await browser.close();await server.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
