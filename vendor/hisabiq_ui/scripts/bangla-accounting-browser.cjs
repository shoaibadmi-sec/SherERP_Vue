/* Phase 4: browser coverage of audit/accounts/party localization. No postings. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
async function main(){
 const {createServer}=await import('vite');
 const server=await createServer({server:{host:'127.0.0.1',port:4389,strictPort:true}});
 await server.listen();
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
 try{
  for(const language of ['English','English + Bangla','Bangla']){
   for(const width of [390,1440]){
    const context=await browser.newContext({viewport:{width,height:width===390?844:900},reducedMotion:'reduce'});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.addInitScript(lang=>localStorage.setItem('hisabiq-erp-personal-v1',JSON.stringify({
      mode:'Simple',language:lang,density:'Compact',terminology:'simple',dateView:'transaction'
    })),language);
    const bn=language==='Bangla';
    await page.goto('http://127.0.0.1:4389/#/app/audit-ledger');
    await page.getByRole('heading',{name:bn?'হিসাব যাচাই':'Audit Ledger',exact:true}).waitFor();
    await page.getByRole('columnheader',{name:bn?'টাকা':'Amount',exact:true}).waitFor();
    await page.goto('http://127.0.0.1:4389/#/app/accounts');
    await page.getByRole('heading',{name:bn?'হিসাব':'Accounts',exact:true}).waitFor();
    const tab=page.getByRole('tab',{name:bn?/হিসাবের প্রতিবেদন/:/Statements/});
    await tab.click();
    await page.getByText(bn?'লাভ-ক্ষতি':'Profit & Loss',{exact:true}).first().waitFor();
    await page.goto('http://127.0.0.1:4389/#/app/parties');
    await page.getByRole('heading',{name:bn?'পার্টি ও খাতা':'Parties & Ledger',exact:true}).waitFor();
    const report=await page.evaluate(async lang=>{
     const {reportHtml,reportCsv}=await import('/src/utils/reportOutput.ts');
     return {html:reportHtml({title:'INV-01',language:lang,headers:['Debit','Credit'],rows:[[100,0]]}),csv:reportCsv(['Debit','Credit'],[[100,0]])};
    },language);
    assert.ok(report.html.includes(bn?'lang="bn"':'lang="en"'));
    assert.ok(report.html.includes('<td>100</td><td>0</td>'));
    assert.ok(report.csv.includes('"Debit","Credit"'));
    assert.deepEqual(errors,[],language+' '+width+' errors');
    await context.close();
    console.log('Phase 4 '+language+' '+width+'px passed');
   }
  }
 }finally{await browser.close();await server.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
