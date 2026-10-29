/* Stable Finance account identity and inactive historical source regressions. */
const { chromium } = require('playwright');
const { expect } = require('playwright/test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const allSizes = [[320,700],[360,800],[390,844],[430,932],[768,1024],[1024,768],[1280,800],[1440,900]];
const sizes = process.env.DEEP_AUDIT_SMOKE ? [[390,844]] : process.env.DEEP_AUDIT_WIDTH
  ? allSizes.filter(([width]) => width === Number(process.env.DEEP_AUDIT_WIDTH))
  : allSizes;
const languages = process.env.DEEP_AUDIT_SMOKE ? ['English'] : ['English','English + Bangla','Bangla'];
const output = process.env.DEEP_AUDIT_OUTPUT || '.superpowers/deep-audit/account-identity';
const results = [];
const copy = (language, en, bn) => language === 'Bangla' ? bn : en;
const selectedProfiles = process.env.DEEP_AUDIT_PROFILE ? process.env.DEEP_AUDIT_PROFILE.split(',') : undefined;

async function main() {
  const { createServer } = await import('vite');
  process.chdir(__dirname + '/..');
  const port = Number(process.env.DEEP_AUDIT_PORT || 4513);
  const server = await createServer({ server: { host: '127.0.0.1', port, strictPort: true } });
  await server.listen();
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || undefined, args: ['--no-sandbox'] });
  fs.mkdirSync(output, { recursive: true });
  try {
    for (const [width,height] of sizes) for (const theme of ['light','dark']) for (const language of languages) {
      const profile = `${width}-${theme}-${language.replaceAll(' ','')}`;
      if (selectedProfiles && !selectedProfiles.includes(profile)) continue;
      const context = await browser.newContext({ viewport: { width,height }, hasTouch: width <= 1024, reducedMotion: 'reduce', colorScheme: theme });
      await context.addInitScript(({theme,language}) => {
        localStorage.setItem('hisabiq-theme',theme);
        localStorage.setItem('hisabiq-erp-personal-v1',JSON.stringify({mode:'Simple',language,density:'Compact',terminology:'simple',dateView:'transaction'}));
      }, {theme,language});
      const page = await context.newPage(); page.setDefaultTimeout(12000); page.setDefaultNavigationTimeout(60000);
      await page.route('https://fonts.googleapis.com/**', route => route.abort());
      const errors=[]; page.on('pageerror', error => errors.push(error.message));
      const action = locator => width <= 1024 ? locator.tap() : locator.click();
      const text = (en,bn) => copy(language,en,bn);
      const button = (root,en,bn) => root.getByRole('button',{name:text(en,bn),exact:true});
      const topDialog = () => page.getByRole('dialog').filter({visible:true}).last();
      const closeDialog = async dialog => { const footer=dialog.locator('[data-slot="dialog-footer"]'); await action(button(footer,'Close','বন্ধ করুন').last()); await expect(dialog).toBeHidden(); };
      const tab = (en,bn) => page.getByRole('tab',{name:text(en,bn),exact:true});
      const fresh = async () => {
        await page.goto(`http://127.0.0.1:${port}/?audit=${profile}-${results.length}#/app/finance`,{waitUntil:'domcontentloaded'});
      };
      const record = async (name,run) => {
        try { await fresh(); await run(); assert.deepEqual(errors,[]); results.push({profile,name,status:'passed'}); }
        catch (error) { results.push({profile,name,status:'failed',error:error.message}); await page.screenshot({path:path.join(output,`${profile}-${name}.png`),fullPage:true}); console.error(profile,name,error.message); }
      };
      await record('duplicate-transfer-rename-reverse',async()=>{
        await action(tab('Money Accounts','টাকার হিসাব'));
        await action(button(page,'Add account','হিসাব যোগ করুন'));
        let dialog=topDialog();
        await dialog.getByRole('textbox',{name:/Account name|হিসাবের নাম/}).fill('Dutch-Bangla Bank · 4582');
        await dialog.getByRole('textbox',{name:/Opening balance|শুরুর জের/}).fill('1000');
        await action(button(dialog,'Save account','হিসাব সংরক্ষণ'));
        const cards=()=>page.locator('div.grid').filter({has:page.getByRole('button',{name:/Ledger|খাতা/})}).locator('> div');
        const duplicate=cards().filter({hasText:'৳1,000'});
        await expect(duplicate).toHaveCount(1);
        await action(button(page,'New transfer','নতুন ট্রান্সফার'));
        dialog=topDialog(); const combos=dialog.getByRole('combobox');
        await action(combos.nth(0));
        // The shared dropdown shows a short unique ID suffix, not the internal acc- prefix.
        const duplicateOption=page.getByRole('option',{name:/Dutch-Bangla Bank · 4582 · \d{4}$/});
        await expect(duplicateOption).toHaveCount(1); await action(duplicateOption);
        await action(combos.nth(1)); await action(page.getByRole('option',{name:/Main Cash Counter|মেইন ক্যাশ কাউন্টার/}));
        await dialog.getByRole('textbox',{name:/Amount|টাকা/}).fill('100');
        await action(button(dialog,'Review transfer','ট্রান্সফার যাচাই করুন'));
        await action(button(dialog,'Confirm transfer','টাকা সরানো নিশ্চিত করুন'));
        await expect(cards().filter({hasText:'৳2,14,650'})).toHaveCount(1);
        await expect(cards().filter({hasText:'৳900'})).toHaveCount(1);
        await expect(cards().filter({hasText:'৳48,350'})).toHaveCount(1);
        const dupAfter=cards().filter({hasText:'৳900'});
        await action(button(dupAfter,'Ledger','খাতা'));
        dialog=topDialog();
        await expect(dialog).toContainText('TRF-000042');
        await expect(dialog).not.toContainText('TRF-000039');
        await closeDialog(dialog);
        const transferRow=page.locator('tbody tr').filter({hasText:'TRF-000042'});
        await action(button(transferRow,'Actions for TRF-000042','কাজ TRF-000042'));
        dialog=topDialog(); await closeDialog(dialog);
        await action(button(dupAfter,'Ledger','খাতা')); dialog=topDialog();
        await action(button(dialog,'Edit','সংশোধন'));
        await dialog.getByRole('textbox',{name:/Account name|হিসাবের নাম/}).fill('Renamed duplicate');
        await action(button(dialog,'Save changes','সংশোধন সংরক্ষণ'));
        await closeDialog(dialog);
        await expect(transferRow).toContainText('Renamed duplicate');
        await action(button(transferRow,'Actions for TRF-000042','কাজ TRF-000042'));
        dialog=topDialog(); await action(button(dialog,'Reverse','উল্টো করুন'));
        await action(button(dialog,'Confirm reverse','উল্টো করা নিশ্চিত করুন'));
        await expect(cards().filter({hasText:'৳2,14,650'})).toHaveCount(1);
        await expect(cards().filter({hasText:'৳1,000'})).toHaveCount(1);
        await expect(cards().filter({hasText:'৳48,250'})).toHaveCount(1);
        await expect(page.locator('tbody tr').filter({hasText:'TRF-000042'})).toContainText(text('Reversed','উল্টো হিসাব'));
      });
      await record('inactive-historical-correction-source',async()=>{
        await action(tab('Money Accounts','টাকার হিসাব'));
        const accountCard=page.locator('div.grid').filter({has:page.getByRole('button',{name:/Ledger|খাতা/})}).locator('> div').filter({hasText:'Dutch-Bangla Bank · 4582'}).first();
        await action(button(accountCard,'Actions for Dutch-Bangla Bank · 4582','কাজ Dutch-Bangla Bank · 4582'));
        let dialog=topDialog(); await action(button(dialog,'Deactivate','নিষ্ক্রিয় করুন').first());
        await action(button(dialog,'Confirm deactivate','বন্ধ করা নিশ্চিত করুন'));
        await closeDialog(dialog);
        await action(tab('Loans & Owners','ঋণ ও মালিক'));
        const row=page.locator('tbody tr').filter({hasText:'FIN-000188'});
        await action(button(row,'Actions for FIN-000188','কাজ FIN-000188'));
        dialog=topDialog(); await action(button(dialog,'Edit','সংশোধন'));
        const sources=dialog.getByText(text('Payment sources','টাকার মাধ্যম'),{exact:true}).locator('xpath=ancestor::div[contains(@class,"rounded-xl")][1]');
        const sourceSelect=sources.getByRole('combobox').nth(1);
        await expect(sourceSelect).toContainText(text('Dutch-Bangla Bank · 4582','Dutch-Bangla Bank · 4582'));
        await expect(sourceSelect).toContainText(text('Inactive','বন্ধ'));
        await expect(sourceSelect).toHaveAttribute('data-value','acc-dbl');
        await expect(sourceSelect).toHaveAttribute('aria-label',/Dutch-Bangla Bank.*(Inactive|বন্ধ)/);
        await expect(sourceSelect).not.toContainText('BRAC Bank · 7714');
        await dialog.getByRole('textbox',{name:/Amount|টাকা/}).fill('51000');
        await sources.getByRole('textbox').fill('51000');
        await action(button(dialog,'Save changes','সংশোধন সংরক্ষণ'));
        await expect(row).toContainText('৳51,000');
        await closeDialog(dialog);
        await action(button(row,'Actions for FIN-000188','কাজ FIN-000188'));
        await expect(topDialog()).toContainText('Dutch-Bangla Bank · 4582');
        await expect(topDialog()).not.toContainText('BRAC Bank · 7714');
      });
      await context.close();
      console.log(profile,results.filter(item=>item.profile===profile).map(item=>`${item.name}:${item.status}`).join(', '));
    }
  } finally { fs.writeFileSync(path.join(output,'results.json'),JSON.stringify(results,null,2)); await browser.close(); await server.close(); }
  const failed=results.filter(item=>item.status==='failed');
  console.log(`${results.length} workflows; ${failed.length} failed`);
  assert.equal(failed.length,0);
}
main().catch(error=>{console.error(error);process.exitCode=1;});
