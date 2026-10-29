/* Readable Bengali amount-in-words regression: Counter, POS, purchase, Finance, print. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');

async function main(){
 const {createServer}=await import('vite');
 const server=await createServer({server:{host:'127.0.0.1',port:4498,strictPort:true}});
 await server.listen();
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
 try {
  for(const [width,height] of [[360,780],[390,844],[768,1024],[1366,900]]){
   for(const theme of ['light','dark']){
    const ctx=await browser.newContext({viewport:{width,height},reducedMotion:'reduce',hasTouch:width<=768});
    await ctx.addInitScript(t=>localStorage.setItem('hisabiq-theme',t),theme);
    const page=await ctx.newPage();
    const errors=[];page.on('pageerror',err=>errors.push(err.message));

    const check=async(locator,variant)=>{
      await locator.waitFor({state:'visible'});
      const data=await locator.evaluate(root=>{
       const value=root.querySelector('[lang="bn"]');
       const s=getComputedStyle(value),outer=root.getBoundingClientRect();
       return {size:parseFloat(s.fontSize),weight:Number(s.fontWeight),
        height:parseFloat(s.lineHeight),words:value.innerText,
        overflow:root.scrollWidth-root.clientWidth,
        box:{left:outer.left,right:outer.right,width:outer.width},
        viewport:window.innerWidth,
        variant:root.getAttribute('data-amount-words-variant')};
      });
      assert.equal(data.variant,variant);
      assert.ok(data.size>=(variant==='receipt'?12:variant==='compact'?14:15),width+' '+theme+' text is too small: '+JSON.stringify(data));
      assert.ok(data.weight>=600,width+' '+theme+' text needs prominence');
      assert.ok(data.height>=19,width+' '+theme+' line height too tight');
      assert.ok(data.overflow<=1,width+' '+theme+' Bangla words must wrap, not clip');
      assert.ok(data.box.left>=-2&&data.box.right<=width+2,width+' '+theme+' panel leaves viewport');
      assert.match(data.words,/টাকা/);
    };
    await page.goto('http://127.0.0.1:4498/#/app/counter');
    await page.getByRole('heading',{name:'Transaction summary'}).waitFor();
    await page.locator('input[aria-label="Search customer"]').fill('Rahman');
    await page.getByRole('option',{name:/Rahman Hardware/}).click();
    await page.locator('input[aria-label="Payment source amount"]').fill('15000');
    await check(page.locator('[data-amount-words-variant="default"]').first(),'default');
    assert.match(await page.locator('[data-amount-words-variant="default"]').first().innerText(),/পনেরো হাজার/);

    await page.goto('http://127.0.0.1:4498/#/app/pos');
    await check(page.locator('[data-amount-words-variant="compact"]').first(),'compact');
    await page.goto('http://127.0.0.1:4498/#/app/purchases/new');
    await check(page.locator('[data-amount-words-variant="inverse"]').first(),'inverse');
    if(width===390 && theme==='light'){
     // A receipt is rendered with standalone SSR (no settings provider).
     const receipt=await page.evaluate(async()=>{
      const mod=await import('/src/components/brand/printReceipt.tsx');
      return mod.receiptPrintHtml({
       invoice:'TEST-001',lines:[],subtotal:18005870,discount:0,rounding:0,total:18005870,
       paid:18005870,due:0,method:'Cash'
      });
     });
     const doc=await page.evaluate(html=>new DOMParser().parseFromString(html,'text/html').body.innerHTML,receipt);
     assert.match(doc,/data-amount-words-variant="receipt"/);
     assert.match(doc,/এক কোটি/);
    }
    assert.deepEqual(errors,[],width+' '+theme+' runtime errors');
    await ctx.close();
   }
  }
  console.log('PASS: responsive Counter, POS, Purchase and printable amount words on phone/tablet/desktop');
 }finally{await browser.close();await server.close();}
}
main().catch(err=>{console.error(err);process.exitCode=1;});
