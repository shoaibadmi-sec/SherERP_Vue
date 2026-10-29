/* Phase 20 — Party directory actions and source-safe preview feedback. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');

async function main(){
 const {createServer}=await import('vite');
 const server=await createServer({server:{host:'127.0.0.1',port:4405,strictPort:true}});
 await server.listen();
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
 try{
  for(const language of ['English','English + Bangla','Bangla']){
   for(const width of [390,1440]){
    const context=await browser.newContext({viewport:{width,height:width===390?844:900},hasTouch:width===390,reducedMotion:'reduce'});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.addInitScript(lang=>localStorage.setItem('hisabiq-erp-personal-v1',JSON.stringify({
     mode:'Simple',language:lang,density:'Compact',terminology:'simple',dateView:'transaction'
    })),language);
    const bn=language==='Bangla';
    await page.goto('http://127.0.0.1:4405/#/app/parties');
    await page.getByRole('heading',{name:bn?'পার্টি ও খাতা':'Parties & Ledger',exact:true}).waitFor();
    if(width<768)await page.getByRole('button',{name:bn?'পার্টি বদলান':'Change party'}).click();
    await page.getByRole('button',{name:bn?'এক্সেল / CSV থেকে আনুন':'Import Excel / CSV',exact:true}).waitFor();
    await page.getByRole('button',{name:bn?'নতুন পার্টি যোগ করুন':'Add party',exact:true}).click();
    const editor=page.getByRole('dialog',{name:bn?'নতুন পার্টি যোগ করুন':'Add party'});
    await editor.waitFor();
    await editor.getByRole('button',{name:bn?'বাতিল':'Cancel',exact:true}).click();
    await editor.waitFor({state:'hidden'});
    assert.deepEqual(errors,[],language+' '+width+'px page errors');
    await context.close();
    console.log('Phase 20 Party directory '+language+' @ '+width+'px passed');
   }
  }
 }finally{await browser.close();await server.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
