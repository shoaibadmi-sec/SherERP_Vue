/* Confirmed draft findings: POS identity/credit/input/draft/receipt, Supplier bill allocation,
 * and a discounted bundle return whose historical allocation is unavailable. Preview only. */
const {chromium}=require('playwright');
const {expect}=require('playwright/test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const sizes=[[320,700],[360,800],[390,844],[430,932],[768,1024],[1024,768],[1280,800],[1440,900]];
async function main(){
 const {createServer}=await import('vite');
 const port=Number(process.env.AUDIT_PORT||4861);
 const server=await createServer({server:{host:'127.0.0.1',port,strictPort:true}});await server.listen();
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
 const axeSource=fs.readFileSync(require.resolve('axe-core/axe.min.js'),'utf8');
 const output=process.env.AUDIT_OUTPUT||'/tmp/hisabiq-remaining-audit';fs.mkdirSync(output,{recursive:true});
 const smoke=Boolean(process.env.AUDIT_SMOKE),cases=[],violations=[];let journeys=0,scans=0;
 for(const language of (process.env.AUDIT_LANGUAGE?[process.env.AUDIT_LANGUAGE]:smoke?['English']:['English','English + Bangla','Bangla']))
 for(const theme of (smoke?['light']:['light','dark']))
 for(const [width,height] of (smoke?[[390,844]]:sizes))cases.push({language,theme,width,height});
 async function run({language,theme,width,height}){
  const ctx=await browser.newContext({viewport:{width,height},hasTouch:width<=1024,colorScheme:theme,reducedMotion:'reduce'}),page=await ctx.newPage();
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.route('https://fonts.googleapis.com/**',route=>route.abort());
  await page.addInitScript(({language,theme})=>{localStorage.setItem('hisabiq-theme',theme);localStorage.setItem('hisabiq-erp-personal-v1',JSON.stringify({mode:'Simple',language,density:'Compact',terminology:'simple',dateView:'transaction'}));},{language,theme});
  const text=(en,bn)=>language==='Bangla'?bn:en;
  const act=locator=>width<=1024?locator.tap():locator.click();
  // Hash navigation retains the actual preview session; a full reload intentionally starts a new one.
  const go=async path=>{await page.evaluate(path=>{location.hash=path;},path);await page.waitForURL(url=>url.hash===`#${path}`);};
  const choose=async(locator,value)=>{await act(locator);await act(page.locator(`[role="option"][data-value="${value}"]`));};
  const axe=async name=>{await page.addScriptTag({content:axeSource});const found=await page.evaluate(async()=> (await window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})));violations.push(...found.map(v=>({...v,language,theme,width,name})));scans++;assert.deepEqual(found,[],`${name} axe violations`);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${name} page overflow`);};
  try{
   await page.goto(`http://127.0.0.1:${port}/#/app/pos`,{waitUntil:'domcontentloaded'});
   const checkout=page.locator('[data-pos-checkout]');await checkout.waitFor();
   // New/inactive/customer fixtures use the same source command boundary as the Party editor.
   const customerId=await page.evaluate(async()=>{const {dispatchPartyPreview}=await import('/src/data/partyPreviewStore.ts');
    let state=dispatchPartyPreview({type:'create-party',party:{name:'QA Live Customer',phone:'01912345678',area:'Dhaka',roles:['Customer']}});
    const id=state.parties.find(p=>p.name==='QA Live Customer').id;
    state=dispatchPartyPreview({type:'create-party',party:{name:'QA Inactive Customer',phone:'01912345679',area:'Dhaka',roles:['Customer']}});
    dispatchPartyPreview({type:'deactivate-party',id:state.parties.find(p=>p.name==='QA Inactive Customer').id});return id;});
   const preview=()=>checkout.getByRole('button',{name:new RegExp(text('^Preview sale','^বিক্রির হিসাব দেখুন'))});
   const method=index=>checkout.getByRole('combobox',{name:text(`Payment method ${index}`,`পেমেন্টের মাধ্যম ${index}`),exact:true});
   const amount=index=>checkout.getByRole('textbox',{name:text(`Payment amount ${index}`,`পেমেন্টের পরিমাণ ${index}`),exact:true});
   await choose(method(1),'Customer Credit');await act(checkout.getByRole('button',{name:text('Exact','পুরো টাকা'),exact:true}));
   assert.ok(await preview().isDisabled(),'walk-in credit is blocked');await checkout.getByRole('alert').waitFor();
   assert.ok(await method(1).getAttribute('aria-label'),'method keeps stable accessible name');
   await axe('unverified credit');
   await choose(method(1),'Cash');
   const price=page.getByRole('textbox',{name:/Price for PVC Pipe|দাম: PVC Pipe/});const originalPrice=await price.inputValue();
   const discount=checkout.getByRole('textbox',{name:text('Discount','ছাড়'),exact:true});
   for(const [field,raw,restore] of [[price,'100..50',originalPrice],[discount,'10..50',''],[amount(1),'1..2','5870']]){
    await field.fill(raw);assert.equal(await field.inputValue(),raw);assert.ok(await preview().isDisabled(),'malformed complete value rejected');await field.fill(restore);
   }
   const firstQty=page.getByTestId('pos-cart-row').first().locator('[data-testid="compound-quantity"] input, [data-testid="single-quantity"] input').first();
   const originalQty=await firstQty.inputValue();await firstQty.fill('0');assert.ok(await preview().isDisabled(),'zero line denied');await firstQty.fill(originalQty);
   await act(checkout.getByRole('button').filter({hasText:/Walk-in|সাধারণ ক্রেতা/}).first());
   const picker=page.getByRole('dialog',{name:text('Choose customer','ক্রেতা বাছুন')});await picker.waitFor();
   const search=picker.getByRole('textbox');await search.fill('Rafiq');assert.equal(await picker.getByRole('button').filter({hasText:'Rafiq Mia'}).count(),0,'Borrower-only not Customer');
   await search.fill('QA Inactive');assert.equal(await picker.getByRole('button').filter({hasText:'QA Inactive Customer'}).count(),0,'inactive excluded');
   await search.fill('QA Live');await act(picker.getByRole('button').filter({hasText:'QA Live Customer'}));await picker.waitFor({state:'hidden'});
   await choose(method(1),'Customer Credit');await amount(1).fill('1');assert.ok(await preview().isDisabled(),'customer without verified credit denied');
   await page.evaluate(async id=>{const {dispatchPartyPreview}=await import('/src/data/partyPreviewStore.ts');const {businessToday}=await import('/src/utils/dateRange.ts');dispatchPartyPreview({type:'record-payment',payload:{partyId:id,relationship:'Customer',date:businessToday(),amount:100,operationId:'qa-credit',splits:[{id:'qa-cash',method:'Cash',accountId:'acc-cash',amount:100}]}});},customerId);
   await amount(1).fill('101');assert.ok(await preview().isDisabled(),'credit balance limit enforced');
   await choose(method(1),'Cash');await discount.fill('100');await act(checkout.getByRole('button',{name:text('Exact','পুরো টাকা'),exact:true}));
   const beforeHold=await amount(1).inputValue();
   await act(page.getByRole('button',{name:new RegExp('^'+text('Drafts','খসড়া'))}));
   let drafts=page.getByRole('dialog',{name:text('Drafts','খসড়া'),exact:true});await act(drafts.getByRole('button',{name:text('Hold current','এই বিক্রি রাখুন'),exact:true}));
   const saved=await page.evaluate(async()=>{const {getSalesPreviewSnapshot}=await import('/src/data/salesPreviewStore.ts');return getSalesPreviewSnapshot().drafts.at(-1);});
   assert.equal(saved.discount,'100');assert.equal(saved.discountMode,'amount');assert.equal(saved.customerId,customerId);
   await go('/app/products');await page.getByRole('heading',{name:/Products|পণ্য/}).first().waitFor();await go('/app/pos');await checkout.waitFor();
   await act(page.getByRole('button',{name:new RegExp('^'+text('Drafts','খসড়া'))}));drafts=page.getByRole('dialog',{name:text('Drafts','খসড়া'),exact:true});
   await act(drafts.getByRole('button').filter({hasText:saved.label}).first());await page.waitForURL(url=>url.hash.includes('continue-draft'));
   await page.waitForFunction(()=>document.querySelectorAll('[data-testid="pos-cart-row"]').length===3);
   await expect(discount,'hold/resume restores the saved discount').toHaveValue('100');await expect(amount(1),'hold/resume restores paid total').toHaveValue(beforeHold);
   // Percent mode also round-trips through save, Sales and POS in the same preview session.
   await act(checkout.getByRole('radio',{name:'%',exact:true}));await discount.fill('10');await act(checkout.getByRole('button',{name:text('Exact','পুরো টাকা'),exact:true}));
   const percentPaid=await amount(1).inputValue();
   await act(page.getByRole('button',{name:new RegExp('^'+text('Drafts','খসড়া'))}));drafts=page.getByRole('dialog',{name:text('Drafts','খসড়া'),exact:true});await act(drafts.getByRole('button',{name:text('Hold current','এই বিক্রি রাখুন'),exact:true}));
   await page.waitForURL(url=>url.hash.includes('/app/sales'));await go('/app/pos');await checkout.waitFor();
   await act(page.getByRole('button',{name:new RegExp('^'+text('Drafts','খসড়া'))}));drafts=page.getByRole('dialog',{name:text('Drafts','খসড়া'),exact:true});await act(drafts.getByRole('button').filter({hasText:saved.label}).first());
   await page.waitForURL(url=>url.hash.includes('continue-draft'));await page.waitForFunction(()=>document.querySelectorAll('[data-testid="pos-cart-row"]').length===3);
   await expect(checkout.getByRole('radio',{name:'%',exact:true})).toHaveAttribute('aria-checked','true');await expect(discount).toHaveValue('10');await expect(amount(1)).toHaveValue(percentPaid);
   await choose(method(1),'Customer Credit');await amount(1).fill('100');
   await act(checkout.getByRole('button',{name:text('Add','যোগ করুন'),exact:true}));await amount(2).fill('1000');
   await act(checkout.getByRole('button',{name:text('Add','যোগ করুন'),exact:true}));await choose(method(3),'Bank');await amount(3).fill(String(Number(percentPaid)-1100));
   const sourcesBefore=await page.evaluate(async()=>{const {getPartyPreviewSnapshot}=await import('/src/data/partyPreviewStore.ts');return JSON.stringify(getPartyPreviewSnapshot());});
   assert.ok(await preview().isEnabled());await act(preview());
   const review=page.getByRole('dialog',{name:text('Review sale','বিক্রির হিসাব যাচাই'),exact:true});await review.waitFor();
   assert.match(await review.innerText(),/Dutch-Bangla Bank/);assert.match(await review.innerText(),/Customer credit/);assert.match(await review.innerText(),/Cash counter/);
   const expectedSplits=[['Customer credit',100],['Cash counter',1000],['Dutch-Bangla Bank · 4582',Number(percentPaid)-1100]];
   for(const [index,[account,value]] of expectedSplits.entries()){
    const detail=review.locator('dl > div').filter({hasText:text(`Payment source ${index+1}`,`পেমেন্টের মাধ্যম ${index+1}`)}).locator('dd');
    assert.ok((await detail.innerText()).includes(account));assert.ok((await detail.innerText()).endsWith('৳'+value.toLocaleString('en-IN')),'review preserves exact source amount');
   }
   await axe('sale split review');
   await act(review.getByRole('button',{name:text('Confirm sale preview','বিক্রির প্রিভিউ নিশ্চিত করুন'),exact:true}));
   const receipt=page.getByRole('dialog',{name:'Sale preview · Not posted',exact:true});await receipt.waitFor();
   for(const account of ['Customer credit','Cash counter','Dutch-Bangla Bank'])assert.ok((await receipt.innerText()).includes(account),'receipt retains every split account');
   const receiptSources=receipt.locator(`[aria-label="${text('Payment sources','পেমেন্টের মাধ্যম')}"] > div`);
   assert.equal(await receiptSources.count(),expectedSplits.length);
   for(const [index,[account,value]] of expectedSplits.entries()){
    assert.ok((await receiptSources.nth(index).innerText()).includes(account));
    assert.equal(await receiptSources.nth(index).locator('span').last().innerText(),value.toLocaleString('en-IN'),'receipt retains exact source amount');
   }
   assert.equal(await page.evaluate(async()=>{const {getPartyPreviewSnapshot}=await import('/src/data/partyPreviewStore.ts');return JSON.stringify(getPartyPreviewSnapshot());}),sourcesBefore,'sale preview does not debit credit or post');await axe('sale split receipt');
   await act(receipt.getByRole('button',{name:'New sale',exact:true}));await receipt.waitFor({state:'hidden'});
   // Supplier chooses a source bill; review and saved record retain the immutable source ID.
   await go('/app/finance');await act(page.getByRole('tab',{name:/^Counter|^কাউন্টার/}));await act(page.locator('button[aria-pressed]').filter({hasText:/Supplier Pay|সরবরাহকারীকে টাকা দিন/}));
   await page.getByRole('textbox',{name:/Search supplier|সরবরাহকারী খুঁজুন/}).fill('Karim Traders');await act(page.getByRole('option',{name:/Karim Traders/}));
   const bills=await page.evaluate(async()=>{const {getPartyPreviewSnapshot}=await import('/src/data/partyPreviewStore.ts');const {counterOpenInvoices}=await import('/src/utils/counterAllocation.ts');const {businessToday}=await import('/src/utils/dateRange.ts');return counterOpenInvoices(getPartyPreviewSnapshot().sources,'s1',businessToday(),'Supplier');});
   const bill=bills.find(b=>!b.opening);assert.ok(bill);await choose(page.getByRole('combobox',{name:text('Invoice allocation','বিল বাছুন'),exact:true}),bill.id);
   await act(page.getByRole('button',{name:text('Full due','পুরো বাকি'),exact:true}));const supplierAmount=page.getByRole('textbox',{name:/Payment source amount|পেমেন্টের টাকা/});assert.equal(Number(await supplierAmount.inputValue()),bill.due);
   await supplierAmount.fill(String(bill.due+1));const payReview=page.getByRole('button',{name:/Review pay supplier|যাচাই করুন: সরবরাহকারীকে টাকা দিন/});await act(payReview);await page.getByRole('alert').first().waitFor();assert.equal(await page.getByRole('dialog',{name:/Confirm pay supplier|নিশ্চিত করুন: সরবরাহকারীকে টাকা দিন/}).count(),0);
   await supplierAmount.fill('100');await act(payReview);const payDialog=page.getByRole('dialog',{name:/Confirm pay supplier|নিশ্চিত করুন: সরবরাহকারীকে টাকা দিন/});await payDialog.waitFor();assert.ok((await payDialog.innerText()).includes(bill.reference));await axe('supplier bill review');
   await act(payDialog.getByRole('button',{name:/Confirm & record|নিশ্চিত করে লিখুন/}));await payDialog.waitFor({state:'hidden'});
   const after=await page.evaluate(async()=>{const {getPartyPreviewSnapshot}=await import('/src/data/partyPreviewStore.ts');const {counterOpenInvoices}=await import('/src/utils/counterAllocation.ts');const {businessToday}=await import('/src/utils/dateRange.ts');const state=getPartyPreviewSnapshot();return {source:state.sources.at(-1),bills:counterOpenInvoices(state.sources,'s1',businessToday(),'Supplier')};});
   assert.equal(after.source.invoiceId,bill.id);assert.equal(after.bills.find(b=>b.id===bill.id).due,bill.due-100);assert.equal(after.bills.find(b=>b.id===bills[0].id).due,bills[0].due);
   // Missing historical net allocation must still open a non-posting bundle preview.
   await page.evaluate(async()=>{const {updateSalesPreview}=await import('/src/data/salesPreviewStore.ts');updateSalesPreview('invoices',rows=>rows.map(invoice=>invoice.invoice==='INV-DEMO-BUNDLE'?{...invoice,lines:invoice.lines.map(line=>{const copy={...line};delete copy.netSaleTotal;return copy;})}:invoice));});
   await go('/app/sales?tab=return');
   const customer=page.locator('.rounded-xl').filter({has:page.getByText(text('Choose customer','ক্রেতা বাছুন'),{exact:true})}).first().getByRole('combobox').first();await choose(customer,'Package Demo Customer');
   await page.getByRole('checkbox').first().check();const returnQty=page.getByRole('textbox',{name:/Whole Sets to return for Tubewell Package/});await returnQty.fill('1');
   const snapshotBefore=await page.evaluate(async()=>{const {getSalesPreviewSnapshot}=await import('/src/data/salesPreviewStore.ts');return JSON.stringify(getSalesPreviewSnapshot());});
   await act(page.getByRole('button',{name:/Preview return only|শুধু ফেরত প্রিভিউ/}));const bundle=page.getByRole('dialog',{name:/Bundle return preview/});await bundle.waitFor();await bundle.getByRole('alert').filter({hasText:'Historical net parent refund allocation is missing'}).waitFor();await axe('pending bundle allocation');
   assert.equal(await page.evaluate(async()=>{const {getSalesPreviewSnapshot}=await import('/src/data/salesPreviewStore.ts');return JSON.stringify(getSalesPreviewSnapshot());}),snapshotBefore,'bundle preview creates no return or credit');await page.keyboard.press('Escape');await bundle.waitFor({state:'hidden'});
   assert.deepEqual(errors,[]);journeys++;console.log(`Draft findings passed ${language} ${theme} ${width}x${height}`);
  }catch(error){await page.screenshot({path:`${output}/failure-${width}-${theme}-${language.replaceAll(' ','_')}.png`,fullPage:true});console.error(await page.locator('body').innerText());throw new Error(`${language} ${theme} ${width}x${height}: ${error.stack}`);}
  finally{await ctx.close();}
 }
 try{const queue=[...cases];await Promise.all(Array.from({length:smoke?1:Number(process.env.AUDIT_WORKERS||2)},async()=>{while(queue.length)await run(queue.shift());}));console.log(JSON.stringify({journeys,scans,violations}));assert.deepEqual(violations,[]);}
 finally{await browser.close();await server.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
