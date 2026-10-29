/* Phase 23 Party directory, role labels and legacy CSV chooser in all language modes. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
async function main(){
 const {createServer}=await import('vite');
 const server=await createServer({server:{host:'127.0.0.1',port:4409,strictPort:true}});
 await server.listen();
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
 try {
  for(const language of ['English','English + Bangla','Bangla']){
   const bn=language==='Bangla', label=(en,bd)=>bn?bd:en;
   for(const width of [390,768,1440]){
    const context=await browser.newContext({viewport:{width,height:width===390?844:900},hasTouch:width===390,reducedMotion:'reduce'});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.addInitScript(lang=>localStorage.setItem('hisabiq-erp-personal-v1',JSON.stringify({
      mode:'Simple',language:lang,density:'Compact',terminology:'simple',dateView:'transaction'
    })),language);
    await page.goto('http://127.0.0.1:4409/#/app/parties');
    if(width<1024)await page.getByRole('button',{name:label('Change party','পার্টি বদলান')}).click();
    const search=page.getByRole('textbox',{name:label('Search parties','পার্টি খুঁজুন')});
    await search.waitFor();
    await page.getByRole('tab',{name:label('Customer','ক্রেতা'),exact:true}).click();
    assert.equal(await page.getByRole('tab',{name:label('Customer','ক্রেতা'),exact:true}).getAttribute('aria-selected'),'true');
    await page.getByRole('tab',{name:label('All','সব'),exact:true}).click();
    await search.fill('zz-no-such-party-23');
    await page.getByText(label('No parties found.','কোনো পার্টি পাওয়া যায়নি।')).waitFor();
    await search.fill('');
    if(width<1024){await page.keyboard.press('Escape');await page.getByRole('dialog',{name:label('Change party','পার্টি বদলান')}).waitFor({state:'hidden'});}
    if(width<768)await page.getByRole('button',{name:label('Change party','পার্টি বদলান')}).click();
    await page.getByRole('button',{name:label('Import Excel / CSV','এক্সেল / CSV থেকে আনুন')}).click();
    const chooser=page.getByRole('dialog',{name:label('Choose Party import type','কোন পার্টির তথ্য আনবেন?')});
    await chooser.getByText(label('Imported opening balances never move Cash, Bank or Mobile Banking accounts.','আনা শুরুর জের ক্যাশ, ব্যাংক বা মোবাইল ব্যাংকিংয়ের টাকা বদলায় না।')).waitFor();
    await chooser.getByRole('button',{name:label('Legacy multi-role CSV','আগের ধরনের CSV')}).click();
    const csv=page.getByRole('dialog',{name:label('Import parties from CSV','CSV থেকে পার্টি আনুন')});
    await csv.getByLabel(label('Select CSV file','CSV ফাইল বাছুন')).setInputFiles({
      name:'parties-phase23.csv',mimeType:'text/csv',
      buffer:Buffer.from('name,nameBn,phone,area,roles\nPhase 23 Customer,পরীক্ষার ক্রেতা,01711000220,Natore,Customer|Supplier\n,ভুল,01711000999,Natore,UnknownRole\n','utf8')
    });
    await csv.getByText(bn?/1\s*প্রস্তুত/:/1\s*ready/).waitFor();
    await csv.getByText(bn?/1\s*বাদ পড়েছে/:/1\s*rejected/).waitFor();
    await csv.getByText(label('Customer, Supplier','ক্রেতা, সরবরাহকারী'),{exact:false}).waitFor();
    await csv.getByText(label('Party name is required.','পার্টির নাম লিখুন।'),{exact:false}).waitFor();
    await csv.getByRole('button',{name:label('Cancel','বাতিল')}).click();
    assert.deepEqual(errors,[],language+' @ '+width+' page errors');
    console.log('Phase 23 directory + CSV '+language+' @ '+width+'px passed');
    await context.close();
   }
  }
 } finally {await browser.close();await server.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
