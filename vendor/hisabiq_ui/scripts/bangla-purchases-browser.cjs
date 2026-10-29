/* Phase 18 Purchases list/return/source preview: localization only, with unchanged raw IDs and exports. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');

async function main(){
  const {createServer}=await import('vite');
  const server=await createServer({server:{host:'127.0.0.1',port:4403,strictPort:true}});
  await server.listen();
  const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
  try{
    for(const language of ['English','English + Bangla','Bangla']){
      for(const width of [390,1440]){
        const context=await browser.newContext({viewport:{width,height:width===390?844:900},hasTouch:width===390,acceptDownloads:true,reducedMotion:'reduce'});
        const page=await context.newPage(),errors=[],bn=language==='Bangla';
        page.on('pageerror',e=>errors.push(e.message));
        await page.addInitScript(lang=>localStorage.setItem('hisabiq-erp-personal-v1',JSON.stringify({
          mode:'Simple',language:lang,density:'Compact',terminology:'simple',dateView:'transaction'
        })),language);
        await page.goto('http://127.0.0.1:4403/#/app/purchases');
        await page.getByRole('heading',{name:bn?'ক্রয়':'Purchases',exact:true}).waitFor();
        await page.getByRole('button',{name:bn?'ফিল্টার মুছুন':'Reset filters',exact:true}).waitFor();
        await page.getByRole('textbox',{name:bn?'কেনাকাটা খুঁজুন':'Search purchases',exact:true}).waitFor();
        const actions=page.getByRole('button',{name:new RegExp(bn?'কাজ:':'Actions for')});
        assert.ok(await actions.count()>0,'purchase source actions exist');
        await actions.first().click();
        await page.getByRole('button',{name:bn?'পরিবর্তনের ইতিহাস':'Source history',exact:true}).click();
        const history=page.getByRole('dialog',{name:bn?'ক্রয়ের পরিবর্তনের ইতিহাস':'Purchase source history'});
        await history.waitFor();
        await history.getByRole('button',{name:bn?'ইতিহাস বন্ধ করুন':'Close history'}).click();
        await history.waitFor({state:'hidden'});
        await page.goto('http://127.0.0.1:4403/#/app/purchases?tab=return');
        await page.getByRole('button',{name:bn?'ক্রয় খুঁজুন':'Find purchase',exact:true}).click();
        await page.getByRole('alert').getByText(bn?'ক্রয় নম্বর বা সরবরাহকারীর নাম লিখুন।':'Enter the purchase reference or supplier name.',{exact:true}).waitFor();
        await page.getByRole('region',{name:bn?'ফেরতের মূল ক্রয়':'Purchase return source'}).waitFor();
        await page.getByRole('textbox',{name:bn?'ক্রয় নম্বর খুঁজুন':'Find purchase reference'}).fill('PUR-000117');
        await page.getByRole('button',{name:bn?'ক্রয় খুঁজুন':'Find purchase',exact:true}).click();
        await page.goto('http://127.0.0.1:4403/#/app/purchases?tab=return-history');
        await page.getByText(bn?'ক্রয় ফেরতের ইতিহাস':'Purchase return history',{exact:true}).waitFor();
        await page.getByRole('columnheader',{name:bn?'ফেরত পণ্য':'Returned items',exact:true}).waitFor();
        await page.getByRole('columnheader',{name:bn?'ফেরতের মাধ্যম':'Refund method',exact:true}).waitFor();
        const exported=page.waitForEvent('download');
        await page.getByRole('button',{name:bn?'ডাউনলোড':'Export',exact:true}).click();
        assert.equal((await exported).suggestedFilename(),'hisabiq-purchase-return-preview.csv');
        assert.deepEqual(errors,[],language+' '+width+'px UI errors');
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no horizontal page overflow');
        await context.close();
        console.log('Purchase list and return Phase 18 '+language+' @ '+width+'px passed');
      }
    }
  }finally{await browser.close();await server.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
