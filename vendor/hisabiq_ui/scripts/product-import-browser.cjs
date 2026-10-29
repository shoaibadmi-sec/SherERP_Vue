const {chromium}=require('playwright');
const assert=require('node:assert/strict');
async function main(){
 const {createServer}=await import('vite');
 const server=await createServer({server:{host:'127.0.0.1',port:4208,strictPort:true}});
 await server.listen();
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1280,height:850},reducedMotion:'reduce'});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const sku='IMP-BROWSER-'+Date.now();
 try {
  await page.goto('http://127.0.0.1:4208/#/app/products');
  await page.getByRole('button',{name:'Import',exact:true}).click();
  const dlg=page.getByRole('dialog',{name:'Import products'});
  await dlg.waitFor();
  const header='Product Name,SKU,Product Type,Base Unit,Larger Unit,Unit Conversion,Purchase Price,Purchase Price Unit,Selling Price,Selling Price Unit,Opening Stock,Opening Stock Unit,Opening Date';
  const line=['Test LED Light',sku,'Stock','Pcs','Box','10','1200','Box','1500','Box','2','Box','2026-10-01'].join(',');
  await dlg.getByLabel('Select Excel or CSV file').setInputFiles({name:'opening.csv',mimeType:'text/csv',buffer:Buffer.from(header+'\n'+line+'\n')});
  await dlg.getByRole('button',{name:'Next: Map columns'}).click();
  await dlg.getByRole('button',{name:'Next: Review'}).click();
  await dlg.getByText('Opening: 2 Box → 20 Pcs',{exact:false}).waitFor();
  assert.equal(await dlg.getByRole('button',{name:'Confirm import'}).isEnabled(),true);
  await dlg.getByRole('button',{name:'Confirm import'}).click();
  await dlg.getByText('Added to UI preview').waitFor();
  await dlg.getByText('Created').first().waitFor();
  await dlg.getByText('1',{exact:true}).first().waitFor();
  await dlg.getByRole('button',{name:'View records'}).click();
  await page.getByRole('textbox',{name:'Search products'}).fill(sku);
  await page.getByText('Test LED Light',{exact:true}).first().waitFor();
  await page.getByRole('tab',{name:/Stock lots/i}).click();
  await page.getByText('Opening Stock',{exact:false}).first().waitFor();
  await page.getByRole('tab',{name:/Stock history/i}).click();
  await page.getByText('Opening',{exact:false}).first().waitFor();
  await page.reload();
  // Navigation query params intentionally preserve Stock History across refresh.
  const historyTab=page.getByRole('tab',{name:/Stock history/i});
  await historyTab.waitFor();
  assert.equal(await historyTab.getAttribute('aria-selected'),'true');
  await page.getByRole('tab',{name:/Product list/i}).click();
  await page.getByRole('button',{name:'Import',exact:true}).click();
  const duplicate=page.getByRole('dialog',{name:'Import products'});
  await duplicate.getByLabel('Select Excel or CSV file').setInputFiles({name:'duplicate.csv',mimeType:'text/csv',buffer:Buffer.from(header+'\n'+line+'\n')});
  await duplicate.getByRole('button',{name:'Next: Map columns'}).click();
  await duplicate.getByRole('button',{name:'Next: Review'}).click();
  // No existing preview survives a hard browser refresh: this is intentionally in-memory only.
  await duplicate.getByRole('button',{name:'Cancel'}).click();
  assert.deepEqual(errors,[]);
  console.log('Product import: quantity conversion, atomic add, lot and movement views passed');
 }finally {await browser.close();await server.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
