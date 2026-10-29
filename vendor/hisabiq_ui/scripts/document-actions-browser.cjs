/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires -- Playwright CLI scripts use CommonJS. */
const {chromium}=require('playwright');const assert=require('node:assert/strict');const fs=require('node:fs/promises');
async function main(){
 const{createServer}=await import('vite');const server=await createServer({server:{host:'127.0.0.1',port:4306,strictPort:true}});await server.listen();
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
 try{for(const theme of ['light','dark'])for(const width of [320,390,768,1024,1440]){
  const context=await browser.newContext({viewport:{width,height:960},hasTouch:width<1024,reducedMotion:'reduce',acceptDownloads:true});
  await context.addInitScript(theme=>{localStorage.setItem('hisabiq-theme',theme);window.print=()=>{window.__printed=true;};},theme);
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));const root='http://127.0.0.1:4306/#/app/';
  const csvFor=async(button)=>{const event=page.waitForEvent('download');await button.click();const download=await event;assert.match(download.suggestedFilename(),/\.csv$/);return fs.readFile(await download.path(),'utf8');};
  const popupFor=async(button,text)=>{const event=page.waitForEvent('popup');await button.click();const popup=await event;await popup.getByText(text,{exact:true}).first().waitFor();return popup;};
  await page.goto(root+'sales');await page.getByRole('textbox',{name:'Search sales'}).fill('INV-000241');
  let csv=await csvFor(page.getByRole('button',{name:'Export',exact:true}));assert.match(csv,/INV-000241/);assert.doesNotMatch(csv,/INV-000240/);assert.match(csv,/3 Box 6 Pcs/);
  await page.getByRole('button',{name:'Actions for INV-000241',exact:true}).click();let popup=await popupFor(page.getByRole('button',{name:'Print',exact:true}),'INV-000241');
  await popup.waitForFunction(()=>window.__printed===true);
  assert.equal(await popup.locator('#document-receipt li').count(),2);
  assert.match(await popup.locator('#document-receipt li').first().innerText(),/MS Angle/);assert.match(await popup.locator('#document-receipt li').last().innerText(),/3 Box 6 Pcs/);
  assert.match(await popup.locator('body').innerText(),/Rahman Hardware/);assert.doesNotMatch(await popup.locator('body').innerText(),/INV-000240|Gross profit|Open ERP navigation/);
  assert.equal(await popup.locator('html').getAttribute('data-theme'),'light');assert.equal(await popup.evaluate(()=>window.opener),null);
  await popup.emulateMedia({media:'print'});assert.equal(await popup.locator('#document-receipt').evaluate(n=>getComputedStyle(n).visibility),'visible');
  if(process.env.DOCUMENT_SCREENSHOTS&&width===390)await popup.screenshot({path:process.env.DOCUMENT_SCREENSHOTS+`/sales-receipt-${theme}.png`,fullPage:true});await popup.close();
  await page.getByRole('button',{name:'Actions for INV-000241',exact:true}).click();await page.getByRole('button',{name:'View invoice',exact:true}).click();
  const invoiceDialog=page.locator('[data-slot="dialog-content"]').last();popup=await popupFor(invoiceDialog.getByRole('button',{name:'Print',exact:true}),'INV-000241');await popup.waitForFunction(()=>window.__printed===true);await popup.close();await invoiceDialog.getByRole('button',{name:'Close',exact:true}).last().click();
  // Check source text escaping through the real shared receipt renderer.
  const html=await page.evaluate(async()=>{const{receiptPrintHtml}=await import('/src/components/brand/printReceipt.tsx');const{invoiceReceipt}=await import('/src/utils/salesDocuments.ts');const{salesInvoices}=await import('/src/data/sales.ts');return receiptPrintHtml({...invoiceReceipt(salesInvoices[0]),customer:'<script>alert(1)</script>'});});assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script>/);
  await page.goto(root+'sales?tab=returns');await page.getByRole('button',{name:'Actions for RTN-000014',exact:true}).click();await page.getByRole('button',{name:'View return',exact:true}).click();
  const returned=page.getByRole('dialog',{name:'Sales return details'});assert.match(await returned.innerText(),/Original invoices|Settlement/);popup=await popupFor(returned.getByRole('button',{name:'Print return',exact:true}),'RTN-000014');assert.match(await popup.locator('body').innerText(),/Sales return source preview/);await popup.close();await returned.getByRole('button',{name:'Close',exact:true}).first().click();
  await page.goto(root+'products');await page.getByRole('textbox',{name:'Search products'}).fill('LED Bulb');csv=await csvFor(page.getByRole('button',{name:'Export',exact:true}));assert.match(csv,/LED Bulb/);assert.doesNotMatch(csv,/PVC Pipe/);assert.match(csv,/Selling price \(base unit\)/);
  await page.goto(root+'warranty');await page.getByRole('textbox',{name:'Search warranty cases'}).fill('WRN-000021');csv=await csvFor(page.getByRole('button',{name:'Export',exact:true}));assert.match(csv,/WRN-000021/);assert.doesNotMatch(csv,/WRN-000020/);assert.match(csv,/LB12-3001/);
  await page.getByRole('button',{name:'Actions for WRN-000021',exact:true}).click();popup=await popupFor(page.getByRole('button',{name:'Print receipt',exact:true}),'WRN-000021');assert.match(await popup.locator('body').innerText(),/LB12-3001|Temporary replacement given/);await popup.close();await page.getByRole('button',{name:'Actions for WRN-000021',exact:true}).click();await page.getByRole('button',{name:'View case',exact:true}).click();const warranty=page.locator('[data-slot="dialog-content"]').last();popup=await popupFor(warranty.getByRole('button',{name:'Print',exact:true}),'WRN-000021');assert.match(await popup.locator('body').innerText(),/LB12-3001/);await popup.close();await warranty.getByRole('button',{name:'Close',exact:true}).last().click();
  await page.goto(root+'reports');assert.ok(await page.getByRole('radio',{name:'Today',exact:true}).isDisabled());csv=await csvFor(page.getByRole('button',{name:'Export for accountant',exact:true}));assert.match(csv,/not live accounting/);assert.match(csv,/Monthly gross \/ net/);assert.match(csv,/Receivable \/ payable aging/);
  await page.getByRole('button',{name:/Profit & Loss.*Statement for any period/}).click();assert.match(page.url(),/accounts\?tab=statements/);assert.equal(await page.getByRole('tab',{name:/^Statements/}).getAttribute('aria-selected'),'true');await page.reload();assert.equal(await page.getByRole('tab',{name:/^Statements/}).getAttribute('aria-selected'),'true');await page.goBack();await page.getByRole('heading',{name:'Reports',exact:true}).waitFor();await page.goForward();assert.equal(await page.getByRole('tab',{name:/^Statements/}).getAttribute('aria-selected'),'true');
  await page.goto(root+'reports');await page.getByRole('button',{name:/Stock valuation.*Value at cost/}).click();assert.match(page.url(),/products\?view=lots/);assert.equal(await page.getByRole('tab',{name:/Stock lots/}).getAttribute('aria-selected'),'true');
  // Popup rejection must give an actionable error, without changing the source.
  await page.goto(root+'sales');await page.evaluate(()=>{window.open=()=>null;});await page.getByRole('button',{name:'Actions for INV-000241',exact:true}).click();await page.getByRole('button',{name:'Print',exact:true}).click();await page.getByText('Allow the print popup and try again.',{exact:true}).waitFor();
  assert.deepEqual(errors,[]);await context.close();console.log(`Real receipts, filtered CSVs, return preview, report links and blocked-popup handling passed: ${width}px ${theme}`);
 }}finally{await browser.close();await server.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
