const {chromium}=require('playwright');
const assert=require('node:assert/strict');
async function main(){
 const {createServer}=await import('vite');
 const server=await createServer({server:{host:'127.0.0.1',port:4198,strictPort:true}});
 await server.listen();
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1280,height:920},reducedMotion:'reduce'});
 const errors=[];page.on('pageerror',err=>errors.push(err.message));
 try{
  await page.goto('http://127.0.0.1:4198/#/app/parties?id=c4&role=Customer');
  await page.getByRole('button',{name:'Receive payment'}).click();
  const pay=page.getByRole('dialog',{name:'Party payment'});
  await pay.getByRole('textbox',{name:'Payment amount'}).fill('100');
  await pay.getByRole('button',{name:'Review payment'}).click();
  await pay.getByRole('button',{name:/Confirm receive payment/i}).click();
  await pay.waitFor({state:'hidden'});
  const menuButton=page.getByRole('button',{name:/Actions for PAYMENT:/i}).last();
  await menuButton.click();
  await page.getByRole('button',{name:'Edit',exact:true}).click();
  const editor=page.getByRole('dialog',{name:'Party transaction editor'});
  await editor.getByRole('textbox',{name:'Corrected payment amount'}).fill('80');
  await editor.getByRole('textbox',{name:'Correction reason'}).fill('Amount entered incorrectly');
  await editor.getByRole('button',{name:'Review correction'}).click();
  await editor.getByRole('button',{name:'Confirm correction'}).click();
  await editor.waitFor({state:'hidden'});
  await page.getByRole('button',{name:/Actions for PAYMENT:/i}).last().click();
  await page.getByRole('button',{name:'Delete / reverse'}).click();
  const reverse=page.getByRole('dialog',{name:'Party transaction editor'});
  await reverse.getByRole('textbox',{name:'Correction reason'}).fill('Payment was a duplicate');
  await reverse.getByRole('button',{name:'Review reversal'}).click();
  await reverse.getByRole('button',{name:'Confirm reversal'}).click();
  await reverse.waitFor({state:'hidden'});
  assert.equal(await page.getByRole('button',{name:/Actions for PAYMENT:/i}).count(),0);
  assert.deepEqual(errors,[]);
  console.log('Party settlement payment, source edit and reversal browser flow passed');
 }finally{await browser.close();await server.close();}
}
main().catch(err=>{console.error(err);process.exitCode=1;});
