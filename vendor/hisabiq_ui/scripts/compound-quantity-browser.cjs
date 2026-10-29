const {chromium}=require('playwright');
const assert=require('node:assert/strict');
async function main(){
 const {createServer}=await import('vite');
 const server=await createServer({server:{host:'127.0.0.1',port:4237,strictPort:true}});await server.listen();
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1180,height:850},reducedMotion:'reduce'});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto('http://127.0.0.1:4237/#/app/quotations');
  await page.getByRole('button',{name:'New quotation'}).click();
  const dlg=page.getByRole('dialog',{name:'New quotation'});
  const search=dlg.getByRole('combobox',{name:'Add product to quotation'});
  const add=async (query,match)=>{
   await search.fill(query);
   await page.getByRole('listbox',{name:'Add product to quotation options'}).getByRole('option',{name:match}).click();
  };
  await add('LED Bulb',/LED Bulb 12W/);
  await dlg.getByRole('radiogroup',{name:'Unit row 1'}).getByRole('radio',{name:'Box'}).click();
  await dlg.getByLabel('Quantity row 1',{exact:true}).fill('2');
  const pcs=dlg.getByLabel('Pcs quantity row 1',{exact:true});
  await pcs.fill('5');
  assert.equal(await pcs.inputValue(),'5');
  await dlg.getByText('3,875',{exact:false}).first().waitFor();
  await pcs.press('Enter');
  assert.equal(await search.evaluate(el=>document.activeElement===el),true,'Enter must return to Add product');
  await add('Wire Mesh',/Wire Mesh Net 3 ft/);
  await dlg.getByRole('radiogroup',{name:'Unit row 2'}).getByRole('radio',{name:'Gauge'}).click();
  await dlg.getByLabel('Quantity row 2',{exact:true}).fill('1');
  const gira=dlg.getByLabel('Gira quantity row 2',{exact:true});
  await gira.fill('12');
  await dlg.getByText('4,190',{exact:false}).first().waitFor();
  for(const row of await dlg.getByTestId('transaction-cart-row').all()){
   const q=row.getByTestId('compound-quantity');
   const u=row.getByRole('radiogroup');
   const [qb,ub]=await Promise.all([q.boundingBox(),u.boundingBox()]);
   assert.ok(qb&&ub&&qb.width>=190,'compound editor has a usable width');
   assert.ok(qb.x+qb.width<=ub.x-1,'quantity does not overlap unit switch');
   const inputs=q.locator('input');assert.equal(await inputs.count(),2);
   const [a,b]=await Promise.all([inputs.nth(0).boundingBox(),inputs.nth(1).boundingBox()]);
   assert.ok(a&&b&&a.x+a.width<=b.x,'primary and small-unit fields do not overlap');
   assert.ok(b.x+b.width<=qb.x+qb.width,'small-unit field remains inside quantity border');
  }
  await page.setViewportSize({width:375,height:812});
  await gira.scrollIntoViewIfNeeded();
  assert.equal(await gira.isVisible(),true,'Gira field remains reachable by touch on mobile');
  assert.deepEqual(errors,[]);
  console.log('Shared compound quantity: 2 Box 5 Pcs, 1 Gauge 12 Gira, totals, focus and desktop/mobile geometry passed');
 }finally{await browser.close();await server.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
