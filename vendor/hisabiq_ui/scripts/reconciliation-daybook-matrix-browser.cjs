const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const viewports = [[320,700],[360,800],[390,844],[430,932],[768,1024],[1024,768],[1280,800],[1440,900]];
const languages = ['English','English + Bangla','Bangla'];
const themes = ['light','dark'];
async function main() {
  const {createServer}=await import('vite');
  const server=await createServer({server:{host:'127.0.0.1',port:4399,strictPort:true}}); await server.listen();
  const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
  let scans=0;
  try {
    for (const [width,height] of viewports) for (const language of languages) for (const theme of themes) {
      const context=await browser.newContext({viewport:{width,height},colorScheme:theme,hasTouch:width<=1024});
      await context.addInitScript(({language,theme})=>{localStorage.setItem('hisabiq-erp-personal-v1',JSON.stringify({mode:'Simple',language,density:'Compact',terminology:'simple',dateView:'transaction',searchMode:'Default'}));localStorage.setItem('hisabiq-theme',theme);}, {language,theme});
      const page=await context.newPage(); const errors=[]; page.on('pageerror',error=>errors.push(error.message));
      for(const route of ['reconciliation','daybook']) {
        await page.goto(`http://127.0.0.1:4399/#/app/${route}`); await page.locator('main').waitFor();
        await page.addScriptTag({path:require.resolve('axe-core')});
        const result=await page.evaluate(async()=>await window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']} }));
        scans++;
        assert.deepEqual(result.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.length,summary:v.help})),[],`${route} axe violations at ${width}px, ${language}, ${theme}`);
        const widthInfo=await page.evaluate(()=>({width:document.documentElement.scrollWidth,inner:innerWidth}));
        assert.ok(widthInfo.width<=widthInfo.inner+2,`${route} page overflow ${width}: ${JSON.stringify(widthInfo)}`);
      }
      assert.deepEqual(errors,[],`${width} ${language} ${theme} browser errors`); await context.close();
    }
  } finally { await browser.close(); await server.close(); }
  console.log(`Completed ${scans} whole-page axe scans across 8 required viewports × 3 languages × 2 themes for Reconciliation and Daybook.`);
}
main().catch(error=>{console.error(error);process.exitCode=1;});
