/* Phase 13: UI language-aware print document bodies. Orders, courier data and payments never post. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');

async function main(){
 const {createServer}=await import('vite');
 const server=await createServer({server:{host:'127.0.0.1',port:4398,strictPort:true}});
 await server.listen();
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
 const docs=[
  ['Order confirmation','অর্ডার নিশ্চিতকরণ','Order confirmation only;','এটি শুধু অর্ডার নিশ্চিত করার কাগজ।',5],
  ['Packing list','প্যাকিং তালিকা','Packing checklist only','এটি শুধু প্যাকিংয়ের তালিকা।',3],
  ['Delivery challan','ডেলিভারি চালান','Delivery challan only','এটি শুধু ডেলিভারি চালান।',3]
 ];
 try {
  for(const language of ['English','English + Bangla','Bangla']){
   for(const width of [390,1440]){
    const context=await browser.newContext({viewport:{width,height:width===390?844:900},hasTouch:width===390,reducedMotion:'reduce'});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.addInitScript(lang=>localStorage.setItem('hisabiq-erp-personal-v1',JSON.stringify({
     mode:'Simple',language:lang,density:'Compact',terminology:'simple',dateView:'transaction'
    })),language);
    const bn=language==='Bangla';
    await page.goto('http://127.0.0.1:4398/#/app/online-sales');
    await page.getByRole('button',{name:'ON-000101',exact:true}).click();
    const detail=page.getByRole('dialog',{name:/Online order ON-000101|অনলাইন অর্ডার ON-000101/});
    await detail.waitFor();
    for(const [kind,banglaTitle,englishFooter,banglaFooter,columns] of docs){
     await detail.getByRole('button',{name:bn?banglaTitle:kind,exact:true}).click();
     const printDlg=page.getByRole('dialog',{name:'Print '+kind});
     const doc=printDlg.locator('#fulfillment-print-document');
     await doc.waitFor();
     const body=await doc.innerText();
     assert.match(body,/ON-000101/);
     assert.match(body,/Rahman Hardware/);
     assert.match(body,/01711482093/);
     assert.match(body,/SF-DEMO-1240/);
     assert.match(body,/LED Bulb 12W/);
     assert.match(body,/\b2 Box\b/);
     assert.match(body,bn?/পথে আছে/:/In transit/);
     assert.ok(body.includes(bn?banglaTitle:kind),'document title in selected language');
     assert.ok(body.includes(bn?banglaFooter:englishFooter),'document-specific disclaimer');
     assert.ok(body.includes(bn?'শুধু নমুনা। স্টক, টাকা বা কুরিয়ারের হিসাবে এন্ট্রি হয়নি।':'UI preview only — no stock, payment or courier posting.'));
     assert.equal(await doc.locator('th').count(),columns,'correct document money column separation');
     if(kind==='Order confirmation'){
      assert.match(body,/3,100/,'original order monetary amounts preserved');
      assert.match(body,bn?/বাকি \/ কুরিয়ার নেবে/:/Balance \/ COD planned:/);
     }else{
      assert.doesNotMatch(body,/Balance \/ COD planned:|বাকি \/ কুরিয়ার নেবে|Unit price|একক দাম/,'no money summary/columns for shipping-only document');
     }
     if(kind==='Packing list')assert.match(body,bn?/প্যাক করেছেন:/:/Packed by:/);
     if(kind==='Delivery challan')assert.match(body,bn?/পণ্য গ্রহণকারীর নাম:/:/Receiver name:/);
     await page.emulateMedia({media:'print'});
     assert.equal(await doc.evaluate(el=>getComputedStyle(el).visibility),'visible','document visible for A4 print');
     // React may hoist the style element to <head>, so validate the shipped CSS source.
     assert.ok(require('node:fs').readFileSync('src/components/online/FulfillmentDocumentPreview.tsx','utf8').includes('@page {size:A4;margin:0;}'),'A4 scoped print CSS');
     await page.emulateMedia({media:'screen'});
     await printDlg.getByRole('button',{name:bn?'বন্ধ':'Close',exact:true}).first().click();
     await printDlg.waitFor({state:'hidden'});
    }
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no horizontal page overflow');
    assert.deepEqual(errors,[],language+' '+width+'px browser errors');
    await context.close();
    console.log('Fulfillment documents Phase 13 '+language+' @ '+width+'px passed');
   }
  }
 }finally{await browser.close();await server.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
