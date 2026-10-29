/* Verify Party profile → POS customer context across responsive, theme and language profiles. */
/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires -- Playwright CLI scripts use CommonJS. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const axePath = require.resolve('axe-core');

async function audit(page, label) {
  const violations = await page.evaluate(async () => (await window.axe.run(document)).violations.map(item => ({ id: item.id, nodes: item.nodes.map(node => ({ target:node.target, html:node.html, failureSummary:node.failureSummary })) })));
  assert.deepEqual(violations, [], `${label} axe violations: ${JSON.stringify(violations)}`);
}

async function main() {
  const { createServer } = await import('vite');
  const server = await createServer({ cacheDir:'.superpowers/party-context-cache',server: { host: '127.0.0.1', port: 49262, strictPort: true } });
  await server.listen();
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || undefined, args: ['--no-sandbox'] });
  const allProfiles = [[320,700],[360,800],[390,844],[430,932],[768,1024],[1024,768],[1280,800],[1440,900]];
  const profiles = process.env.PARTY_CONTEXT_WIDTH ? allProfiles.filter(([width]) => width === Number(process.env.PARTY_CONTEXT_WIDTH)) : allProfiles;
  let journeys = 0;
  try {
    for (const [width,height] of profiles) for (const theme of ['light','dark']) for (const language of ['English','English + Bangla','Bangla']) {
      const context = await browser.newContext({ viewport: { width, height }, hasTouch: true, colorScheme: theme, reducedMotion: 'reduce' });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => {errors.push(error.message);console.error(error.message);});
      await page.route('https://fonts.googleapis.com/**',route=>route.abort());
      await page.addInitScript(({ theme, language }) => {
        localStorage.setItem('hisabiq-theme', theme);
        localStorage.setItem('hisabiq-erp-personal-v1', JSON.stringify({ mode:'Simple', language, density:'Compact', terminology:'simple', dateView:'transaction' }));
      }, { theme, language });
      const act = element => width <= 1024 ? element.tap() : element.click();
      const suffix = `${width}px ${theme} ${language}`;
      try {
        await page.goto('http://127.0.0.1:49262/#/app/parties?id=c1&role=Customer');
        await page.getByRole('heading', { name: /Rahman Hardware/ }).waitFor();
        const ledgerSearch=page.getByRole('textbox',{name:/Search ledger transactions|খাতার লেনদেন খুঁজুন/});
        await ledgerSearch.fill('INV-000241');
        if(width<1024)await act(page.getByRole('button',{name:/Change party|পার্টি বদলান/}));
        await page.getByRole('textbox',{name:/Search parties|পার্টি খুঁজুন/}).fill('Rahman');
        if(width<1024)await page.keyboard.press('Escape');
        if(width<768)await act(page.getByRole('button',{name:/Filters|ফিল্টার/}));
        const range=page.getByRole('button',{name:/Party ledger date range|পক্ষের খাতার তারিখ/});
        await act(range);
        const calendar=page.getByRole('dialog',{name:/Party ledger date range|পক্ষের খাতার তারিখ/});
        await act(calendar.getByRole('button',{name:/^This month$|^এই মাস$/}));
        await act(calendar.getByRole('button',{name:/^Apply$|^প্রয়োগ করুন$/}));
        const savedRange=await range.getAttribute('aria-label');
        await page.addScriptTag({ path: axePath });
        await audit(page, `${suffix} Party profile`);

        const startSale = page.getByRole('button', { name: /New invoice|নতুন বিল/ });
        await startSale.waitFor();
        assert.equal(await startSale.isEnabled(), true, `${suffix} active customer can start a sale`);
        await startSale.scrollIntoViewIfNeeded();
        const savedScroll=await page.evaluate(()=>window.scrollY);
        await act(startSale);
        await page.getByRole('heading', { name: /New sale|নতুন বিক্রি/ }).waitFor();
        assert.match(page.url(), /\/app\/pos\?partyId=c1/);
        // Fast Counter keeps invoice-only details collapsed; inspect the prefilled state by opening it.
        await act(page.getByTestId('pos-invoice-details-toggle'));
        const customerName = page.locator('input[aria-label="Customer name"],input[aria-label="ক্রেতার নাম"]');
        await customerName.waitFor();
        assert.equal(await customerName.inputValue(), 'Rahman Hardware', `${suffix} customer draft is prefilled`);
        assert.equal(await page.getByTestId('pos-customer-picker-trigger').filter({ hasText: 'Rahman Hardware' }).count(), 1, `${suffix} source party identity stays selected`);
        const contextText=page.getByText(language==='Bangla'?'Rahman Hardware এর নামে বিক্রি':'Sale for Rahman Hardware',{exact:true});
        assert.ok(await contextText.count(), `${suffix} context follows the selected language`);
        const backToParty=page.getByRole('button',{name:language==='Bangla'?'পার্টিতে ফিরুন':'Back to party',exact:true});
        await audit(page, `${suffix} POS`);

        await act(backToParty);
        await page.getByRole('button', { name: /New invoice|নতুন বিল/ }).waitFor();
        assert.match(page.url(), /\/app\/parties\?id=c1&role=Customer/);
        assert.equal(await ledgerSearch.inputValue(),'INV-000241',`${suffix} ledger search is restored`);
        if(width<1024)await act(page.getByRole('button',{name:/Change party|পার্টি বদলান/}));
        assert.equal(await page.getByRole('textbox',{name:/Search parties|পার্টি খুঁজুন/}).inputValue(),'Rahman',`${suffix} directory search is restored`);
        if(width<1024)await page.keyboard.press('Escape');
        assert.equal(await range.getAttribute('aria-label'),savedRange,`${suffix} ledger range is restored`);
        await page.waitForFunction(scroll=>Math.abs(window.scrollY-scroll)<2,savedScroll);
        await act(startSale);
        const picker=page.getByRole('combobox',{name:/Add product|পণ্য যোগ করুন/}).first();
        await picker.fill('SRV-1401');
        await picker.press('ArrowDown');await picker.press('Enter');
        await page.getByTestId('pos-cart-row').filter({hasText:'Ceiling Fan Installation'}).waitFor();
        await act(page.getByRole('button',{name:/^Preview sale|^বিক্রির হিসাব দেখুন/}));
        const review=page.getByRole('dialog',{name:/^Review sale$|^বিক্রির হিসাব যাচাই$/});
        await act(review.getByRole('button',{name:/^Confirm sale preview$|^বিক্রির প্রিভিউ নিশ্চিত করুন$/}));
        const receipt=page.getByRole('dialog',{name:'Sale preview · Not posted',exact:true});
        await receipt.waitFor();
        await receipt.press('Escape');
        await startSale.waitFor();
        assert.match(page.url(),/\/app\/parties\?id=c1&role=Customer/,'closing the completed preview returns to its Party');
        assert.equal(await ledgerSearch.inputValue(),'INV-000241',`${suffix} completed sale restores ledger search`);
        assert.equal(await range.getAttribute('aria-label'),savedRange,`${suffix} completed sale restores range`);
        assert.deepEqual(errors, [], `${suffix} browser errors`);
        journeys++;
        console.log(`Passed ${journeys}/${profiles.length * 6}: ${suffix}`);
      } finally {
        await context.close();
      }
    }
    console.log(`Party profile to POS context passed: ${journeys}/${profiles.length * 6} journeys, ${journeys*2} whole-page axe scans`);
  } finally {
    await browser.close();
    await server.close();
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
