/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires -- Playwright CLI scripts use CommonJS. */
/* global axe */
/* Whole-page Reports baseline: requested viewports, themes and language modes. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const widths = [[320,700],[360,800],[390,844],[430,932],[768,1024],[1024,768],[1280,800],[1440,900]];
async function main() {
  const { createServer } = await import('vite');
  const server = await createServer({ server:{host:'127.0.0.1',port:4392,strictPort:true} });
  await server.listen();
  const browser = await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
  let scans = 0;
  const violations = new Map();
  const violationProfiles = [];
  try {
    for (const [width,height] of widths) for (const theme of ['light','dark']) for (const language of ['English','English + Bangla','Bangla']) {
      const context = await browser.newContext({viewport:{width,height},colorScheme:theme,reducedMotion:'reduce'});
      const page = await context.newPage();
      const errors=[];
      page.on('pageerror',error=>errors.push(error.message));
      await page.addInitScript(({theme,language})=>{
        localStorage.setItem('hisabiq-theme',theme);
        localStorage.setItem('hisabiq-erp-personal-v1',JSON.stringify({mode:'Simple',language,density:'Compact',terminology:'simple',dateView:'transaction'}));
      },{theme,language});
      await page.goto('http://127.0.0.1:4392/#/app/reports');
      await page.getByRole('heading',{name:language==='Bangla'?'রিপোর্ট':'Reports',exact:true}).waitFor();
      await page.getByRole('heading',{name:language==='Bangla'?'ব্যবসার সারাংশ':'Business overview',exact:true}).waitFor();
      await page.locator('[data-report-row]').first().waitFor();
      assert.equal(await page.getByRole('tablist',{name:/Report groups|রিপোর্টের বিভাগ/}).getByRole('tab').count(),7);
      assert.equal(await page.getByRole('button',{name:/^Report date range:|^রিপোর্টের সময়কাল:/}).isEnabled(),true,'date ranges must work with source records');
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`horizontal document overflow at ${width}px ${theme} ${language}`);
      await page.addScriptTag({path:require.resolve('axe-core')});
      const result=await page.evaluate(async()=>await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}}));
      assert.deepEqual(result.violations.filter(violation=>violation.id==='svg-img-alt').map(violation=>violation.id),[],`expense pie must remain represented by its text legend at ${width}px ${theme} ${language}`);
      assert.deepEqual(result.violations.filter(violation=>violation.id==='aria-hidden-focus').map(violation=>violation.id),[],`decorative pie must not hide focusable content at ${width}px ${theme} ${language}`);
      for(const violation of result.violations) {
        const key=`${violation.id}:${violation.impact}:${violation.nodes.map(node=>node.target.join(' ')).join(',')}`;
        violations.set(key,(violations.get(key)||0)+1);
        violationProfiles.push({id:violation.id,width,theme,language});
      }
      assert.deepEqual(errors,[],`runtime errors at ${width}px ${theme} ${language}`);
      scans++;
      await context.close();
    }
  } finally { await browser.close(); await server.close(); }
  console.log(`Reports whole-page audit completed: ${scans} axe scans; 8 viewports × 2 themes × 3 languages; no overflow/runtime errors.`);
  console.log(`Axe findings across scans: ${JSON.stringify([...violations.entries()])}`);
  console.log(`Axe finding profiles: ${JSON.stringify(violationProfiles)}`);
}
main().catch(error=>{console.error(error);process.exitCode=1;});
