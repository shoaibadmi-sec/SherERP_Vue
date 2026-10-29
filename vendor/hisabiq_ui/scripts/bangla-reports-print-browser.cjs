/* Phase 3 print/document localization: no posting or payment actions. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
async function main() {
  const {createServer} = await import('vite');
  const server = await createServer({server:{host:'127.0.0.1',port:4388,strictPort:true}});
  await server.listen();
  const browser = await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
  try {
    for (const language of ['English','English + Bangla','Bangla']) {
      for (const width of [390,1440]) {
        const context=await browser.newContext({viewport:{width,height:width===390?844:900},reducedMotion:'reduce'});
        const page=await context.newPage(),errors=[];
        page.on('pageerror',e=>errors.push(e.message));
        await page.addInitScript(lang => localStorage.setItem('hisabiq-erp-personal-v1',JSON.stringify({
          mode:'Simple',language:lang,density:'Compact',terminology:'simple',dateView:'transaction'
        })), language);
        const bn=language==='Bangla';
        await page.goto('http://127.0.0.1:4388/#/app/reports');
        await page.getByRole('heading',{name:bn?'রিপোর্ট':'Reports',exact:true}).waitFor();
        await page.getByText(bn?/ইউআই প্রিভিউ · বর্তমান ব্রাউজারের রেকর্ড/:/UI preview · current in-browser records/).first().waitFor();
        await page.goto('http://127.0.0.1:4388/#/app/daybook');
        await page.getByRole('heading',{name:bn?'দৈনিক লেনদেন':'Daybook',exact:true}).waitFor();
        await page.getByRole('columnheader',{name:bn?'টাকা এসেছে':'Money In',exact:true}).waitFor();
        const content=await page.evaluate(async (lang)=>{
          const {reportHtml,reportCsv}=await import('/src/utils/reportOutput.ts');
          const doc=reportHtml({title:'Invoice <script>alert(1)</script>',language:lang,subtitle:'Sample',
            headers:['Invoice','Due'],rows:[['INV-000001',127.5]]});
          const csv=reportCsv(['Invoice','Due'],[['INV-000001',127.5]]);
          return {doc,csv};
        }, language);
        assert.ok(content.doc.includes(bn?'lang="bn"':'lang="en"'));
        assert.ok(content.doc.includes(bn?'HisabIQ শুধু প্রিভিউ':'HisabIQ UI preview'));
        assert.ok(!content.doc.includes('<script>alert(1)</script>'));
        assert.ok(content.doc.includes('&lt;script&gt;'));
        assert.ok(content.csv.includes('"Invoice","Due"'));
        assert.ok(content.csv.includes('"INV-000001","127.5"'));
        await page.goto('http://127.0.0.1:4388/#/app/sales');
        await page.getByRole('heading',{name:bn?'বিক্রয়':'Sales',exact:true}).waitFor();
        if(width===390)await page.locator('.sales-mobile-record').first().getByRole('button',{name:/View details|বিস্তারিত দেখুন/}).click();
        else await page.locator('tbody tr').first().click();
        const dialog=page.getByRole('dialog').first();
        await dialog.waitFor();
        const receipt=dialog.locator('.theme-light').first();
        await receipt.waitFor();
        assert.match(await receipt.innerText(),bn?/পণ্যের মোট/:/Subtotal/);
        assert.deepEqual(errors,[],language+' '+width+'px page errors');
        await context.close();
        console.log('Phase 3 reports/print '+language+' @ '+width+'px passed');
      }
    }
  } finally {
    await browser.close();await server.close();
  }
}
main().catch(e=>{console.error(e);process.exitCode=1;});
