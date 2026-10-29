/* Desktop sidebar resize target size and responsive navigation visibility. */
const {chromium}=require('playwright');
const {expect}=require('playwright/test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const allSizes=[[320,700],[360,800],[390,844],[430,932],[768,1024],[1024,768],[1280,800],[1440,900]];
const sizes=process.env.DEEP_AUDIT_ONLY_WIDTH?allSizes.filter(([width])=>width===Number(process.env.DEEP_AUDIT_ONLY_WIDTH)):allSizes;
const allLanguages=['English','English + Bangla','Bangla'];
const languages=process.env.DEEP_AUDIT_ONLY_LANGUAGE?[process.env.DEEP_AUDIT_ONLY_LANGUAGE]:allLanguages;
const themes=process.env.DEEP_AUDIT_ONLY_THEME?[process.env.DEEP_AUDIT_ONLY_THEME]:['light','dark'];
const output=process.env.DEEP_AUDIT_OUTPUT||'.superpowers/deep-audit/sidebar-target-size';
const results=[];

async function main(){
  const {createServer}=await import('vite');
  const port=Number(process.env.DEEP_AUDIT_PORT||4499);
  const server=await createServer({cacheDir:`.superpowers/sidebar-target-size-cache-${port}`,server:{host:'127.0.0.1',port,strictPort:true}});
  await server.listen();
  const executablePath=process.env.PLAYWRIGHT_EXECUTABLE_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined);
  const browser=await chromium.launch({executablePath,args:['--no-sandbox']});
  fs.mkdirSync(output,{recursive:true});
  try {
    for(const [width,height] of sizes) for(const theme of themes) for(const language of languages){
      const id=[width,theme,language.replaceAll(' ','')].join('-');
      const context=await browser.newContext({viewport:{width,height},hasTouch:width<=1024,reducedMotion:'reduce',colorScheme:theme});
      await context.addInitScript(({theme,language})=>{
        localStorage.setItem('hisabiq-theme',theme);
        localStorage.setItem('hisabiq-erp-personal-v1',JSON.stringify({mode:'Simple',language,density:'Compact',terminology:'simple',dateView:'transaction'}));
        localStorage.removeItem('hisabIQ:sidebar-collapsed');
        localStorage.removeItem('hisabiq:sidebar-collapsed');
      },{theme,language});
      const page=await context.newPage();
      page.setDefaultTimeout(12000);
      page.setDefaultNavigationTimeout(60000);
      await page.route('https://fonts.googleapis.com/**',route=>route.abort());
      const errors=[];
      page.on('pageerror',error=>errors.push(error.message));
      const text=(en,bn)=>language==='Bangla'?bn:en;
      const act=element=>width<=1024?element.tap():element.click();
      try {
        await page.goto(`http://127.0.0.1:${port}/?case=${encodeURIComponent(id)}#/app/dashboard`,{waitUntil:'domcontentloaded'});
        const resize=page.getByRole('button',{name:text('Toggle sidebar width','সাইডবারের আকার বদলান'),exact:true});
        if(width>=1024){
          await expect(resize).toBeVisible();
          const box=await resize.boundingBox();
          assert.ok(box,'desktop sidebar resize button has a rendered target');
          assert.ok(box.width>=24,`sidebar resize target is ${box.width}px wide (minimum is 24px)`);
          const sidebar=page.locator('aside[data-sidebar="sidebar"]');
          await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
          const violations=await page.evaluate(async()=>{
            const root=document.querySelector('aside[data-sidebar="sidebar"]');
            const result=await axe.run(root,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}});
            return result.violations.map(item=>({id:item.id,nodes:item.nodes.map(node=>node.target)}));
          });
          assert.deepEqual(violations,[],'desktop sidebar axe');
          const before=await sidebar.boundingBox();
          await act(resize);
          await expect(sidebar).toHaveAttribute('data-collapsible','icon');
          const collapsed=await sidebar.boundingBox();
          assert.ok(collapsed.width<before.width,'resize button collapses the sidebar');
          await act(page.getByRole('button',{name:text('Expand sidebar','সাইডবার খুলুন'),exact:true}));
          await expect(sidebar).toHaveAttribute('data-collapsible','none');
          await expect(sidebar).toHaveCSS('width',`${before.width}px`);
          await resize.focus();
          await page.keyboard.press('Enter');
          await expect(sidebar).toHaveAttribute('data-collapsible','icon');
          await page.keyboard.press('Enter');
          await expect(sidebar).toHaveAttribute('data-collapsible','none');
        } else {
          await expect(resize).toHaveCount(0);
          await expect(page.getByRole('button',{name:text('Open ERP navigation','ERP মেনু খুলুন'),exact:true})).toBeVisible();
        }
        assert.deepEqual(errors,[],'browser runtime errors');
        results.push({id,status:'passed'});
      } catch(error) {
        results.push({id,status:'failed',error:error.message});
        console.error(id,error.message);
        await page.screenshot({path:path.join(output,id+'.png'),fullPage:false});
      } finally {
        await context.close();
      }
      console.log(id,results.at(-1).status);
    }
  } finally {
    fs.writeFileSync(path.join(output,'results.json'),JSON.stringify(results,null,2));
    await browser.close();
    await server.close();
  }
  console.log(`${results.length} journeys; ${results.filter(result=>result.status==='failed').length} failed`);
  assert.equal(results.filter(result=>result.status==='failed').length,0);
}

main().catch(error=>{console.error(error);process.exitCode=1;});
