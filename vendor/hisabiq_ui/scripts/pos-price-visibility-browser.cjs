/* Regression: POS pricing must show at least Tk 100,000 without clipping or covering the eye button. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const sizes = [[320,760],[390,844],[768,1024],[1024,768],[1366,768],[1440,900]];
async function main(){
 const {createServer}=await import('vite');
 const server=await createServer({server:{host:'127.0.0.1',port:4497,strictPort:true}});
 await server.listen();
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
 try{
  for(const theme of ['light','dark']){
   for(const [width,height] of sizes){
    const ctx=await browser.newContext({viewport:{width,height},reducedMotion:'reduce',hasTouch:width<=1024});
    await ctx.addInitScript(t=>localStorage.setItem('hisabiq-theme',t),theme);
    const page=await ctx.newPage();
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto('http://127.0.0.1:4497/#/app/pos');
    const row=page.locator('[data-cart-kind="sale"] [data-cart-row]').first();
    await row.waitFor();
    const field=row.locator('[data-pos-price-field]');
    const input=field.locator('input.numeric-input-control');
    const eye=field.getByRole('button',{name:/Show purchase price|কেনা দাম/});
    await input.fill('100000');
    await input.press('Tab');
    assert.equal(await input.inputValue(),'100000',width+' '+theme+': entered price is preserved');
    const result=await field.evaluate((element)=>{
     const input=element.querySelector('input.numeric-input-control');
     const eye=element.querySelector('button[data-pos-cost-eye]');
     const style=getComputedStyle(input);
     const canvas=document.createElement('canvas');
     const measure=canvas.getContext('2d');
     measure.font=style.font;
     const textWidth=measure.measureText(input.value).width;
     const readableWidth=input.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight);
     const box=input.getBoundingClientRect(),eyeBox=eye.getBoundingClientRect();
     const cart=element.closest('[data-cart-kind="sale"]');
     return {textWidth,readableWidth,priceBox:{left:box.left,right:box.right},
       eyeBox:{left:eyeBox.left,right:eyeBox.right},
       cartOverflow:cart.scrollWidth-cart.clientWidth};
    });
    assert.ok(result.readableWidth>=result.textWidth+2,
      width+' '+theme+': Tk100000 must be fully visible; '+JSON.stringify(result));
    assert.ok(result.eyeBox.left>=result.priceBox.right+1,
      width+' '+theme+': eye icon must be outside the editable input');
    assert.ok(result.cartOverflow<=2,width+' '+theme+': cart must not scroll sideways');
    if(width>=768){
     await input.fill('100000.00');
     const decimals=await field.evaluate(element=>{
      const input=element.querySelector('input.numeric-input-control');
      const style=getComputedStyle(input);
      const canvas=document.createElement('canvas'),m=canvas.getContext('2d');m.font=style.font;
      return {available:input.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight),
       text:m.measureText(input.value).width};
     });
     assert.ok(decimals.available>=decimals.text+2,width+' '+theme+': Tk100000.00 visible');
    }
    await eye.click();
    await field.locator('.shadow-pop').waitFor({state:'visible',timeout:5000});
    assert.deepEqual(errors,[],width+' '+theme+': no runtime errors');
    await ctx.close();
   }
  }
  console.log('PASS: Tk100000 POS price, decimal desktop price, eye icon, and no overflow across 6 sizes x 2 themes');
 }finally{await browser.close();await server.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
