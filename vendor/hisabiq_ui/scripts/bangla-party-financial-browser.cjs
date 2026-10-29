/* Phase 22: payment / finance confirmation and printable Party statement translation. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');

async function main(){
 const {createServer}=await import('vite');
 const server=await createServer({server:{host:'127.0.0.1',port:4407,strictPort:true}});
 await server.listen();
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
 try{
  for(const language of ['English','English + Bangla','Bangla']){
   const bn=language==='Bangla';
   const label=(en,bd)=>bn?bd:en;
   for(const width of [390,768,1440]){
    const context=await browser.newContext({viewport:{width,height:width===390?844:900},hasTouch:width===390,reducedMotion:'reduce'});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.addInitScript(lang=>localStorage.setItem('hisabiq-erp-personal-v1',JSON.stringify({
     mode:'Simple',language:lang,density:'Compact',terminology:'simple',dateView:'transaction'
    })),language);
    await page.goto('http://127.0.0.1:4407/#/app/parties?id=c1&role=Customer');
    await page.getByRole('button',{name:label('Receive payment','টাকা নিন'),exact:true}).click();
    const payment=page.getByRole('dialog',{name:label('Party payment','পক্ষের পেমেন্ট')});
    await payment.getByRole('textbox',{name:label('Payment amount','পেমেন্টের টাকা')}).fill('50');
    await payment.getByRole('button',{name:label('Review payment','পেমেন্ট যাচাই করুন')}).click();
    await payment.getByRole('status').getByText(label('Receive payment','ক্রেতার টাকা নিন'),{exact:false}).waitFor();
    await payment.getByRole('button',{name:label('Cancel','বাতিল')}).click();
    await payment.waitFor({state:'hidden'});

    if(width<768)await page.getByRole('button',{name:label('Filters','ফিল্টার')}).click();
    await page.getByRole('button',{name:label('Print statement','হিসাব প্রিন্ট')}).click();
    const statement=page.getByRole('dialog',{name:label('Party ledger statement','পক্ষের হিসাবের বিবরণ')});
    await statement.getByText(label('Opening balance (brought forward)','আগের জের'),{exact:true}).first().waitFor();
    await statement.getByRole('button',{name:label('Close','বন্ধ করুন'),exact:true}).last().click();

    await page.goto('http://127.0.0.1:4407/#/app/parties?id=o1&role=Owner');
    await page.getByRole('button',{name:label('Record owner finance','টাকা লেনদেন লিখুন')}).click();
    const finance=page.getByRole('dialog',{name:label('Party finance transaction','ঋণ বা মূলধনের লেনদেন')});
    await finance.getByRole('button',{name:label('Review finance transaction','লেনদেন যাচাই করুন')}).click();
    await finance.getByRole('alert').getByText(label('Finance amount must be greater than zero.','টাকার পরিমাণ শূন্যের বেশি হতে হবে।')).waitFor();
    await finance.getByRole('textbox',{name:label('Finance amount','টাকার পরিমাণ')}).fill('100');
    await finance.getByRole('button',{name:label('Review finance transaction','লেনদেন যাচাই করুন')}).click();
    await finance.getByRole('status').getByText(label('Records one auditable preview source only; no real money is moved.','শুধু প্রিভিউতে লেনদেনের ইতিহাসসহ একটি রেকর্ড যোগ হবে। আসল টাকা সরবে না।')).waitFor();
    await finance.getByRole('button',{name:label('Cancel','বাতিল')}).click();
    assert.deepEqual(errors,[],language+' '+width+'px browser errors');
    await context.close();
    console.log('Phase 22 Party finance + statement '+language+' @ '+width+'px passed');
   }
  }
 }finally{await browser.close();await server.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
