/* Shared import: Product and Party preview-only journeys at mobile/tablet/desktop. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
async function main(){
 const {createServer}=await import('vite');
 const server=await createServer({server:{host:'127.0.0.1',port:4410,strictPort:true}});
 await server.listen();
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
 try{
  for(const language of ['English','English + Bangla','Bangla']){
   const bn=language==='Bangla',t=(english,bangla)=>bn?bangla:english;
   for(const width of [390,768,1440]){
    const context=await browser.newContext({viewport:{width,height:width===390?844:900},hasTouch:width===390,reducedMotion:'reduce'});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.addInitScript(lang=>localStorage.setItem('hisabiq-erp-personal-v1',JSON.stringify({mode:'Simple',language:lang,density:'Compact',terminology:'simple',dateView:'transaction'})),language);

    await page.goto('http://127.0.0.1:4410/#/app/products');
    await page.getByRole('button',{name:t('Import','ফাইল থেকে আনুন'),exact:true}).click();
    const product=page.getByRole('dialog',{name:t('Import products','পণ্য আনুন')});
    await product.getByText(t('Excel (.xlsx) and CSV (.csv) · UI preview only — no server records are posted.','Excel (.xlsx) বা CSV (.csv) ফাইল আনুন। শুধু নমুনা তালিকায় যোগ হবে; সার্ভারে কোনো তথ্য জমা হবে না।')).waitFor();
    const productCsv='Product Name,SKU,Product Type,Base Unit,Larger Unit,Unit Conversion,Purchase Price,Purchase Price Unit,Selling Price,Selling Price Unit,Opening Stock,Opening Stock Unit,Opening Date\n'+
     'Phase24 Light,IMP-P24-'+width+'-'+(bn?'BN':'EN')+',Stock,Pcs,Box,10,1200,Box,1500,Box,2,Box,2026-10-01\n';
    await product.getByLabel(t('Select Excel or CSV file','Excel বা CSV ফাইল বাছুন')).setInputFiles({name:'products.csv',mimeType:'text/csv',buffer:Buffer.from(productCsv)});
    await product.getByRole('button',{name:t('Next: Map columns','পরের ধাপ: কলাম মেলান')}).click();
    await product.getByRole('button',{name:t('Next: Review','পরের ধাপ: যাচাই')}).click();
    await product.getByText(t('Opening: 2 Box → 20 Pcs','শুরুর স্টক: 2 Box → 20 Pcs'),{exact:false}).waitFor();
    assert.equal(await product.getByRole('button',{name:t('Confirm import','আনা নিশ্চিত করুন')}).isEnabled(),true);
    await product.getByRole('button',{name:t('Confirm import','আনা নিশ্চিত করুন')}).click();
    await product.getByRole('heading',{name:t('Added to UI preview','নমুনা তালিকায় যোগ হয়েছে'),exact:true}).waitFor();
    await product.getByRole('button',{name:t('View records','তালিকা দেখুন')}).click();

    await page.goto('http://127.0.0.1:4410/#/app/parties');
    await page.getByRole('button',{name:t('Import Excel / CSV','এক্সেল / CSV থেকে আনুন')}).click();
    const choose=page.getByRole('dialog',{name:t('Choose Party import type','কোন পার্টির তথ্য আনবেন?')});
    await choose.getByRole('combobox',{name:t('Relationship to import','কোন সম্পর্কের তথ্য আনবেন')}).click();
    await page.getByRole('listbox',{name:t('Relationship to import','কোন সম্পর্কের তথ্য আনবেন')+' options'})
      .getByRole('option',{name:bn?'ক্রেতা':/Customers/}).click();
    const party=page.getByRole('dialog',{name:t('Import customers','ক্রেতার তথ্য আনুন')});
    const partyCsv='Name,Phone,Area,Opening Amount,Opening Direction,Opening Date\n'+
      'Phase 24 Client,01712340024,Natore,500,Dr,2026-10-01\n';
    await party.getByLabel(t('Select Excel or CSV file','Excel বা CSV ফাইল বাছুন')).setInputFiles({name:'clients.csv',mimeType:'text/csv',buffer:Buffer.from(partyCsv)});
    await party.getByRole('button',{name:t('Next: Map columns','পরের ধাপ: কলাম মেলান')}).click();
    await party.getByRole('button',{name:t('Next: Review','পরের ধাপ: যাচাই')}).click();
    await party.getByText(t('Customer owes us','ক্রেতার কাছে পাওনা'),{exact:false}).first().waitFor();
    const note=t('Confirming will create Opening Ledger balances for the selected rows. Party opening balances are unverified historical entries; no payment account is changed.','নিশ্চিত করলে শুরুর জের যোগ হবে। পুরোনো হিসাব যাচাই করা নয়; ক্যাশ, ব্যাংক বা মোবাইল হিসাব বদলাবে না।');
    await party.getByRole('note').filter({hasText:note}).waitFor();
    await party.getByRole('button',{name:t('Confirm import','আনা নিশ্চিত করুন')}).click();
    await party.getByRole('button',{name:t('View records','তালিকা দেখুন')}).click();
    assert.deepEqual(errors,[],language+' at '+width+'px');
    console.log('Phase 24 Product and Party imports '+language+' @ '+width+'px passed');
    await context.close();
   }
  }
 }finally{await browser.close();await server.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
