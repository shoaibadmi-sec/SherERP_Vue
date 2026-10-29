const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
async function main(){
 const {createServer}=await import('vite');
 const server=await createServer({server:{host:'127.0.0.1',port:4207,strictPort:true}});
 await server.listen();
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1280,height:850},acceptDownloads:true,reducedMotion:'reduce'});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto('http://127.0.0.1:4207/#/app/products');
  await page.getByRole('button',{name:'Import',exact:true}).click();
  const dlg=page.getByRole('dialog',{name:'Import products'});
  await dlg.waitFor();
  assert.ok(await dlg.getByText('UI preview only').count()>0);
  const [csvDownload]=await Promise.all([
    page.waitForEvent('download'),
    dlg.getByRole('button',{name:'Download CSV template'}).click()
  ]);
  assert.match(csvDownload.suggestedFilename(),/products.*\.csv$/);
  const [excelDownload]=await Promise.all([
    page.waitForEvent('download'),
    dlg.getByRole('button',{name:'Download Excel template'}).click()
  ]);
  assert.match(excelDownload.suggestedFilename(),/products.*\.xlsx$/);
  await dlg.getByLabel('Select Excel or CSV file').setInputFiles({
   name:'products.csv',mimeType:'text/csv',
   buffer:Buffer.from('Product Name,SKU,Selling Price,Base Unit,Opening Stock,Opening Stock Unit,Opening Date\n' +
    'LED Bulb 12W,000120,165,Pcs,2,Pcs,2026-10-01\n' +
    'পাইপ,0009,420,Pcs,0,Pcs,\n' +
    ',0030,70,Pcs,0,Pcs,\n','utf8')
  });
  await dlg.getByText('3 data rows',{exact:false}).waitFor({state:'visible'});
  await dlg.getByRole('button',{name:'Next: Map columns'}).click();
  assert.ok(await dlg.getByText('Map columns').count()>0);
  await dlg.getByRole('button',{name:'Next: Review'}).click();
  assert.ok(await dlg.getByText('LED Bulb 12W').count()>0);
  assert.ok(await dlg.getByText('000120').count()>0);
  assert.ok(await dlg.getByText('পাইপ').count()>0);
  await dlg.getByRole('button',{name:'Errors (1)'}).click();
  await dlg.getByRole('button',{name:'Edit mapped row 4'}).click();
  await dlg.getByLabel('Edit name row 4').fill('Test Spare');
  await dlg.getByRole('button',{name:'Save row 4'}).click();
  await dlg.getByRole('button',{name:'Ready (3)'}).waitFor({state:'visible'});
  await dlg.getByRole('button',{name:'Ready (3)'}).click();
  await dlg.getByText('Test Spare',{exact:false}).first().waitFor();
  assert.equal(await dlg.getByRole('button',{name:/Confirm import/i}).isEnabled(),true,
   'The Product import adapter must be available without backend posting');
  await dlg.getByRole('button',{name:'Back'}).click();
  await dlg.getByRole('button',{name:'Back'}).click();
  await dlg.getByText('3 data rows',{exact:false}).waitFor({state:'visible'});
  // An XLSX downloaded from our template must round-trip through the same wizard.
  await dlg.getByLabel('Select Excel or CSV file').setInputFiles({
   name:'hisabiq-products-template.xlsx',
   mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
   buffer:fs.readFileSync(await excelDownload.path())
  });
  await dlg.getByText('1 data rows',{exact:false}).waitFor({state:'visible'});
  await dlg.getByRole('button',{name:'Next: Map columns'}).click();
  await dlg.getByRole('button',{name:'Next: Review'}).click();
  await dlg.getByText('LED Bulb 12W',{exact:false}).first().waitFor();
  await page.setViewportSize({width:375,height:812});
  assert.ok(await dlg.isVisible());
  await dlg.getByRole('button',{name:'Cancel'}).click();
  await dlg.waitFor({state:'hidden'});
  assert.deepEqual(errors,[]);
  console.log('Shared import wizard CSV mapping, downloads, disabled commit and mobile browser smoke passed');
 } finally {await browser.close();await server.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
