/* Counter regression: quick-clear, Bangla words, cash+settlement and ledger safety. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
async function main(){
 const {createServer}=await import('vite');
 const server=await createServer({server:{host:'127.0.0.1',port:4378,strictPort:true}});
 await server.listen();
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
 try{
  for(const width of [390,1280]){
   const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
   const page=await context.newPage(),errors=[];
   page.on('pageerror',err=>errors.push(err.message));
   await page.goto('http://127.0.0.1:4378/#/app/counter');
   await page.getByRole('heading',{name:'Transaction summary'}).waitFor();
   const query=page.locator('input[aria-label="Search customer"]');
   await query.fill('Rahman');
   const rahman=page.getByRole('option',{name:/Rahman Hardware/});
   await rahman.click();
   assert.equal(await query.inputValue(),'Rahman Hardware');
   const clear=page.getByRole('button',{name:'Clear Search customer'});
   await clear.click();
   assert.equal(await query.inputValue(),'','the search text is cleared in one tap');
   assert.equal(await page.getByText('Selected customer').count(),0,'clear removes selected party and its balance');
   await query.fill('Rahman');
   await page.getByRole('option',{name:/Rahman Hardware/}).click();
   const read=()=>page.evaluate(async()=>{
    const {getPartyPreviewSnapshot}=await import('/src/data/partyPreviewStore.ts');
    const {customerSettlementAsOf}=await import('/src/utils/partySettlement.ts');
    const {businessToday}=await import('/src/utils/dateRange.ts');
    const s=getPartyPreviewSnapshot();return customerSettlementAsOf(s.sources,'c1',businessToday());
   });
   const before=await read();
   await page.locator('input[aria-label="Payment source amount"]').fill('150');
   await page.locator('input[aria-label="Settlement discount amount"]').fill('50');
   await page.locator('input[aria-label="Settlement reason"]').fill('Agreed cash discount');
   const summary=page.getByText('Transaction summary').locator('xpath=..');
   assert.match(await summary.innerText(),/একশত পঞ্চাশ টাকা মাত্র/,'cash total appears in Bangla words');
   assert.match(await summary.innerText(),/Discount \/ settlement/,'settlement appears in balance projection');
   await page.getByRole('button',{name:'Review receive payment'}).click();
   const review=page.getByRole('dialog',{name:/Confirm receive payment/i});
   await review.waitFor();
   assert.match(await review.innerText(),/Agreed cash discount/);
   assert.match(await review.innerText(),/পঞ্চাশ টাকা মাত্র/);
   await review.getByRole('button',{name:'Confirm & record'}).click();
   const after=await read();
   assert.equal(after.invoiceDue,before.invoiceDue-200,'cash + discount settle due');
   const source=await page.evaluate(async()=>{
    const {getPartyPreviewSnapshot}=await import('/src/data/partyPreviewStore.ts');
    return getPartyPreviewSnapshot().sources.filter(s=>s.kind==='customer-payment'&&s.id.startsWith('party-payment:counter-')).at(-1);
   });
   assert.equal(source.amountPaid,150,'only the real cash changes money accounts');
   assert.equal(source.discount,50);
   assert.equal(source.paymentSplits.reduce((sum,r)=>sum+r.amount,0),150);
   // Discount without cash is also valid, but never invents a cash deposit.
   await page.locator('input[aria-label="Settlement discount amount"]').fill('25');
   await page.getByRole('button',{name:'Review receive payment'}).click();
   assert.match(await page.getByRole('alert').innerText(),/reason/i);
   await page.locator('input[aria-label="Settlement reason"]').fill('Waive rounding debt');
   await page.getByRole('button',{name:'Review receive payment'}).click();
   await review.getByRole('button',{name:'Confirm & record'}).click();
   const pure=await page.evaluate(async()=>{
    const {getPartyPreviewSnapshot}=await import('/src/data/partyPreviewStore.ts');
    return getPartyPreviewSnapshot().sources.filter(s=>s.kind==='customer-payment'&&s.id.startsWith('party-payment:counter-')).at(-1);
   });
   assert.equal(pure.amountPaid,0);
   assert.equal(pure.discount,25);
   assert.deepEqual(pure.paymentSplits,[]);
   assert.equal(pure.method,'Settlement');
   assert.equal((await read()).invoiceDue,after.invoiceDue-25);
   // An ERP-wide native-input search also clears without losing focus.
   await page.goto('http://127.0.0.1:4378/#/app/parties');
   const partyQuery=page.locator('input[aria-label="Search parties"]');
   await partyQuery.fill('Rahman');
   await page.getByRole('button',{name:'Clear Search parties'}).click();
   assert.equal(await partyQuery.inputValue(),'','shared clear button updates React search state');
   assert.equal(await page.locator('input[aria-label="Search parties"]').count(),1,'search input stays mounted');
   await page.goto('http://127.0.0.1:4378/#/app/products');
   const inventoryQuery=page.getByRole('textbox',{name:'Search products'});
   await inventoryQuery.fill('LED');
   const inventoryClear=page.getByRole('button',{name:'Clear Search products'});
   await inventoryClear.click();
   assert.equal(await inventoryQuery.inputValue(),'','Products module search clears from custom input');
   assert.ok(await inventoryQuery.evaluate(input=>document.activeElement===input),'focus remains in Products search after clear');
   const globalSearch=page.getByRole('combobox',{name:'Global search'});
   await globalSearch.fill('Rahman');
   await page.getByRole('button',{name:'Clear global search'}).click();
   assert.equal(await globalSearch.inputValue(),'','global search quick clear resets input');
   await globalSearch.fill('Rahman');
   const suggestions=page.getByRole('listbox',{name:'Global search suggestions'});
   await suggestions.waitFor();
   await suggestions.getByRole('option',{name:/Rahman Hardware/}).first().click();
   await page.waitForFunction(()=>location.hash.includes('/app/parties?id='));
   assert.equal(await globalSearch.inputValue(),'','selection clears global search');
   await page.goto('http://127.0.0.1:4378/#/app/pos');
   const productQuery=page.locator('input[aria-label="Add product"]');
   await productQuery.fill('valve');
   await page.getByRole('button',{name:'Clear product search'}).click();
   assert.equal(await productQuery.inputValue(),'','POS product quick clear preserves keyboard input');
   assert.deepEqual(errors,[],'no browser errors');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no page overflow');
   await context.close();
   console.log('Counter search clear, Bangla words and cash-safe settlement passed: '+width+'px');
  }
 }finally{await browser.close();await server.close();}
}
main().catch(err=>{console.error(err);process.exitCode=1;});
