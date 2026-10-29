/* The cheque attachment field stores a displayed filename in this UI preview; it does not upload file bytes. */
const { chromium } = require('playwright');
const { expect } = require('playwright/test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const sizes = [[320,700],[360,800],[390,844],[430,932],[768,1024],[1024,768],[1280,800],[1440,900]];
const languages = ['English','English + Bangla','Bangla'];
const output = process.env.DEEP_AUDIT_OUTPUT || '.superpowers/deep-audit/cheque-output';
const results = [];

async function main() {
  const { createServer } = await import('vite');
  const port = Number(process.env.DEEP_AUDIT_PORT || 49222);
  const server = await createServer({ cacheDir: `.superpowers/cheque-output-cache-${port}`, server: { host:'127.0.0.1', port, strictPort:true } });
  await server.listen();
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || undefined, args:['--no-sandbox'] });
  fs.mkdirSync(output, { recursive:true });
  try {
    for (const [width,height] of sizes.filter(([w]) => !process.env.DEEP_AUDIT_WIDTH || w === Number(process.env.DEEP_AUDIT_WIDTH))) {
      for (const theme of ['light','dark']) for (const language of languages) {
        const id = `${width}-${theme}-${language.replaceAll(' ','')}`;
        const isBangla = language === 'Bangla';
        const context = await browser.newContext({ viewport:{width,height}, hasTouch:width <= 1024, colorScheme:theme, reducedMotion:'reduce' });
        await context.addInitScript(({theme,language}) => {
          localStorage.setItem('hisabiq-theme',theme);
          localStorage.setItem('hisabiq-erp-personal-v1',JSON.stringify({mode:'Simple',language,density:'Compact',terminology:'simple',dateView:'transaction'}));
        },{theme,language});
        const page = await context.newPage();
        page.setDefaultTimeout(60000);
        page.setDefaultNavigationTimeout(60000);
        await page.route('https://fonts.googleapis.com/**',route=>route.abort());
        const errors=[]; page.on('pageerror',error=>errors.push(error.message));
        const word=(en,bn)=>isBangla?bn:en;
        const act=locator=>width<=1024?locator.tap():locator.click();
        try {
          await page.goto(`http://127.0.0.1:${port}/?chequeAudit=${id}#/app/finance`,{waitUntil:'domcontentloaded'});
          await act(page.getByRole('tab',{name:word('Cheques','চেক'),exact:true}));
          await act(page.getByRole('button',{name:word('New cheque','নতুন চেক'),exact:true}).first());
          const form=page.getByRole('dialog',{name:new RegExp(word('New cheque','নতুন চেক'))});
          await expect(form).toBeVisible();
          const field=(en,bn)=>form.locator('label').filter({hasText:new RegExp('^'+word(en,bn))}).getByRole('textbox');
          await field('Cheque number','চেক নম্বর').fill(`AUDIT-${id}`);
          await field('Bank','ব্যাংক').fill('Audit Bank');
          await field('Received from','কার কাছ থেকে পেয়েছি').fill('Audit Person');
          await field('Amount','টাকা').fill('245.50');
          const filename=`cheque-${id}.pdf`;
          const input=form.locator('input[type=file]');
          await input.setInputFiles({name:filename,mimeType:'application/pdf',buffer:Buffer.from('%PDF-1.7\nattachment bytes are deliberately not persisted')});
          await expect(form.getByText(word('Filename only; this preview does not upload or store the file.','শুধু ফাইলের নাম দেখা যায়; এই নমুনায় ফাইল আপলোড বা সংরক্ষণ হয় না।'),{exact:true})).toBeVisible();
          await expect(form.getByText(filename,{exact:true})).toBeVisible();
          await act(form.getByRole('button',{name:word('Save cheque','চেক সংরক্ষণ'),exact:true}));
          await expect(form).toBeHidden();
          const row=page.locator('main tbody tr').filter({hasText:`AUDIT-${id}`});
          await expect(row).toContainText('৳245.50');
          await act(row.getByRole('button').last());
          const detail=page.getByRole('dialog').filter({hasText:`AUDIT-${id}`});
          await expect(detail).toContainText(filename);
          await expect(detail).toContainText(word('Attachment filename (not uploaded)','ফাইলের নাম (আপলোড হয়নি)'));
          assert.equal(await detail.locator('a[href],button').filter({hasText:filename}).count(),0,'filename must not imply a downloadable attachment');
          await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
          const violations=await page.evaluate(async()=>{
            const root=document.querySelector('[role="dialog"]');
            const result=await axe.run(root,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}});
            return result.violations.map(item=>({id:item.id,impact:item.impact,targets:item.nodes.map(node=>node.target)}));
          });
          assert.deepEqual(violations,[],'cheque detail dialog axe scan');
          const box=await detail.boundingBox();
          assert.ok(box.x>=-1 && box.y>=-1 && box.x+box.width<=width+1 && box.y+box.height<=height+1,'detail dialog fits viewport');
          const popupEvent=page.waitForEvent('popup');
          await act(detail.getByRole('button',{name:word('Print','প্রিন্ট'),exact:true}));
          const printPage=await popupEvent;
          await printPage.waitForLoadState('domcontentloaded');
          const printed=await printPage.locator('body').innerText();
          assert.ok(printed.includes('Audit Bank'));
          assert.ok(printed.includes('245.50'));
          assert.ok(printed.includes(filename),'print report should retain the selected filename metadata');
          assert.ok(printed.includes(word('Attachment filename (not uploaded)','ফাইলের নাম (আপলোড হয়নি)')));
          await expect(detail).toBeVisible();
          assert.deepEqual(errors,[],'browser console page errors');
          results.push({id,status:'passed',axe:violations.length===0,attachment:'filename only disclosed',print:'metadata retained'});
        } catch(error) {
          results.push({id,status:'failed',error:error.message});
          console.error(id,error.message);
          await page.screenshot({path:path.join(output,`${id}.png`),fullPage:true});
        }
        await context.close(); console.log(id,results.at(-1).status);
      }
    }
  } finally { fs.writeFileSync(path.join(output,'results.json'),JSON.stringify(results,null,2)); await browser.close(); await server.close(); }
  console.log(`${results.length} profiles; ${results.filter(item=>item.status==='failed').length} failed`);
  assert.equal(results.filter(item=>item.status==='failed').length,0);
}
main().catch(error=>{console.error(error);process.exitCode=1;});
