const {chromium}=require('playwright');
const assert=require('node:assert/strict');
async function main(){
 const {createServer}=await import('vite');
 const server=await createServer({server:{host:'127.0.0.1',port:4209,strictPort:true}});
 await server.listen();
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1280,height:850},reducedMotion:'reduce'});
 const errors=[];page.on('pageerror',err=>errors.push(err.message));
 const phone='01777009008';
 async function choose(kind){
  await page.getByRole('button',{name:/Import Excel \/ CSV/}).click();
  const chooser=page.getByRole('dialog',{name:'Choose Party import type'});
  await chooser.getByRole('combobox',{name:'Relationship to import'}).click();
  await page.getByRole('listbox',{name:'Relationship to import options'})
   .getByRole('option',{name:kind==='customer'?/Customers/:/Suppliers/}).click();
  const label=kind==='customer'?'Import customers':'Import suppliers';
  return page.getByRole('dialog',{name:label});
 }
 async function upload(dlg,name,amount,direction){
  const csv='Name,Phone,Area,Opening Amount,Opening Direction,Opening Date\n'+
   name+','+phone+',Dhaka,'+amount+','+direction+',2026-10-01\n';
  await dlg.getByLabel('Select Excel or CSV file').setInputFiles({
   name:'parties.csv',mimeType:'text/csv',buffer:Buffer.from(csv,'utf8')
  });
  await dlg.getByRole('button',{name:'Next: Map columns'}).click();
  await dlg.getByRole('button',{name:'Next: Review'}).click();
 }
 try{
  await page.goto('http://127.0.0.1:4209/#/app/parties');
  const customer=await choose('customer');
  await upload(customer,'Excel Imported Customer',500,'Dr');
  await customer.getByText('Customer owes us',{exact:false}).first().waitFor();
  assert.equal(await customer.getByRole('button',{name:'Confirm import'}).isEnabled(),true);
  await customer.getByRole('button',{name:'Confirm import'}).click();
  await customer.getByText('Added to UI preview').waitFor();
  await customer.getByRole('button',{name:'View records'}).click();
  await page.getByText('Excel Imported Customer',{exact:true}).first().waitFor();
  // Importing the same identity as a Supplier cannot silently create a second person.
  const supplier=await choose('supplier');
  await upload(supplier,'Excel Imported Customer',750,'Cr');
  await supplier.getByText('Potential Party match:',{exact:false}).first().waitFor();
  assert.equal(await supplier.getByRole('button',{name:'Confirm import'}).isDisabled(),true);
  await supplier.getByRole('combobox',{name:'Party identity action for row 2'}).click();
  await page.getByRole('listbox',{name:'Party identity action for row 2 options'})
   .getByRole('option',{name:'Add missing relationship'}).click();
  await supplier.getByText('We owe supplier',{exact:false}).first().waitFor();
  assert.equal(await supplier.getByRole('button',{name:'Confirm import'}).isEnabled(),true);
  await supplier.getByRole('button',{name:'Confirm import'}).click();
  await supplier.getByText('Added to UI preview').waitFor();
  await supplier.getByRole('button',{name:'View records'}).click();
  await page.getByText('Excel Imported Customer',{exact:true}).first().waitFor();
  await page.setViewportSize({width:375,height:812});
  assert.ok(await page.getByRole('button',{name:/Import Excel \/ CSV/}).isVisible());
  assert.deepEqual(errors,[]);
  console.log('Party Excel CSV import, identity matching, Customer Dr and Supplier Cr browser journey passed');
 }finally{await browser.close();await server.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
