const {chromium}=require('playwright');
const assert=require('node:assert/strict');
async function main(){
 const {createServer}=await import('vite');
 const server=await createServer({server:{host:'127.0.0.1',port:4199,strictPort:true}});
 await server.listen();
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1280,height:900},reducedMotion:'reduce'});
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 try{
  await page.goto('http://127.0.0.1:4199/#/app/parties?id=o1&role=Owner');
  await page.getByRole('button',{name:'Record owner finance'}).click();
  const d=page.getByRole('dialog',{name:'Party finance transaction'});
  await d.getByRole('combobox',{name:'Finance transaction type'}).click();
  await page.getByRole('listbox',{name:'Finance transaction type options'})
   .getByRole('option',{name:'Owner Debit',exact:true}).click();
  await d.getByRole('textbox',{name:'Finance amount'}).fill('120');
  await d.getByRole('button',{name:'Review finance transaction'}).click();
  await d.getByRole('button',{name:'Confirm finance transaction'}).click();
  await d.waitFor({state:'hidden'});
  await page.getByRole('button',{name:/Actions for FIN-PREVIEW-/i}).last().click();
  await page.getByRole('button',{name:'Reverse'}).click();
  const correction=page.getByRole('dialog',{name:'Party transaction editor'});
  await correction.getByRole('textbox',{name:'Correction reason'}).fill('Mistaken withdrawal');
  await correction.getByRole('button',{name:'Review reversal'}).click();
  await correction.getByRole('button',{name:'Confirm reversal'}).click();
  await correction.waitFor({state:'hidden'});
  await page.getByRole('button',{name:/Actions for FIN-PREVIEW-/i}).count().then(n=>assert.equal(n,0));
  assert.deepEqual(errors,[]);
  console.log('Party owner finance, account movement, and audit reversal browser check passed.');
 }finally{await browser.close();await server.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
