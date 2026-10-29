/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires -- Playwright CLI scripts use CommonJS. */
/* Print the current filtered report and recover from a blocked popup. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
async function main() {
  const { createServer } = await import('vite');
  const server = await createServer({server:{host:'127.0.0.1',port:4393,strictPort:true}});
  await server.listen();
  const browser = await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
  try {
    const cases=[
      {width:320,height:700,theme:'light',language:'English'},
      {width:390,height:844,theme:'dark',language:'Bangla'},
      {width:1024,height:768,theme:'light',language:'English + Bangla'},
      {width:1440,height:900,theme:'dark',language:'English'},
    ];
    for(const profile of cases) {
      const context=await browser.newContext({viewport:{width:profile.width,height:profile.height},colorScheme:profile.theme,hasTouch:profile.width<1024,reducedMotion:'reduce'});
      const page=await context.newPage();
      const errors=[];page.on('pageerror',error=>errors.push(error.message));
      await page.addInitScript(value=>{
        localStorage.setItem('hisabiq-theme',value.theme);
        localStorage.setItem('hisabiq-erp-personal-v1',JSON.stringify({mode:'Simple',language:value.language,density:'Compact',terminology:'simple',dateView:'transaction'}));
        window.__printCalls=0;window.__printedText='';
        const open=window.open.bind(window);
        window.open=(...args)=>{const popup=open(...args);if(popup)popup.print=()=>{window.__printCalls++;window.__printedText=popup.document.body.innerText;};return popup;};
      },profile);
      await page.goto('http://127.0.0.1:4393/#/app/reports');
      await page.getByRole('heading',{name:profile.language==='Bangla'?'রিপোর্ট':'Reports',exact:true}).waitFor();
      await page.getByRole('heading',{name:profile.language==='Bangla'?'ব্যবসার সারাংশ':'Business overview',exact:true}).waitFor();
      const expectedRows=await page.locator('[data-report-row]').count();assert.ok(expectedRows>0);
      const button=page.getByRole('button',{name:/Print report|রিপোর্ট প্রিন্ট/});
      const popupEvent=page.waitForEvent('popup',{timeout:10000});
      if(profile.width===320) {
        await button.focus();
        await button.press('Enter');
      } else if(profile.width===390) {
        await button.tap();
      } else {
        await button.click();
      }
      const popup=await popupEvent;
      await popup.getByRole('heading',{name:profile.language==='Bangla'?'ব্যবসার সারাংশ':'Business overview',exact:true}).waitFor();
      await page.waitForFunction(()=>window.__printCalls===1);
      const body=await popup.locator('body').innerText();
      assert.match(body,profile.language==='Bangla'?/প্রিভিউ/:/preview/);
      assert.match(body,profile.language==='Bangla'?/নির্বাচিত সময়কালের মূল রেকর্ড/:/Source records in the selected period/);
      assert.equal(await popup.locator('tbody tr').count(),expectedRows,'print the same complete filtered rows');
      assert.match(body,/INV|1,?\d{3}|\d{4,}/);
      assert.equal(await popup.evaluate(()=>window.opener),null);
      assert.deepEqual(errors,[],`runtime errors ${profile.language} ${profile.width}px ${profile.theme}`);
      await popup.close();

      await page.evaluate(()=>{window.open=()=>null;});
      await button.click();
      const blocked=profile.language==='Bangla'?'প্রিন্ট উইন্ডো খুলে আবার চেষ্টা করুন।':'Allow the print popup and try again.';
      await page.getByText(blocked,{exact:true}).waitFor();
      assert.equal(await page.evaluate(()=>window.__printCalls),1,'blocked popup must not claim to have printed');
      await context.close();
    }
  } finally { await browser.close();await server.close(); }
  console.log('Filtered Reports print and blocked-popup recovery passed in 4 responsive, theme and language profiles.');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
