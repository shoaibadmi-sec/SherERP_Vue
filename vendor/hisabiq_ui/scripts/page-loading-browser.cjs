/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires -- Playwright CLI uses CommonJS. */
// Test production chunks, not Vite's development modules.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const erp = ['dashboard','search?q=LED','pos','sales','quotations','online-sales','notifications','warranty','reconciliation','finance','daybook','accounts','audit-ledger','products','parties','purchases','purchases/new','vendors','expenses','reports','settings/business','subscription','support'];
const saas = ['overview','tenants','tenants/t1','plans','subscriptions','invoices','invoices/SAAS-1001','payments','payments/PAY-1001','sms','services','services/ORD-1001','support','support/TKT-1001','knowledge','team','announcements','reports','audit','settings'];
async function main() {
  const { preview } = await import('vite');
  const server = await preview({ preview: { host:'127.0.0.1',port:4259,strictPort:true } });
  const browser = await chromium.launch({ executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH || undefined,args:['--no-sandbox'] });
  const base = 'http://127.0.0.1:4259/#';
  try {
    for (const theme of ['light','dark']) {
      const context = await browser.newContext({ viewport:{width:1440,height:1000},reducedMotion:'reduce' });
      await context.addInitScript(value => localStorage.setItem('hisabiq-theme',value),theme);
      const page = await context.newPage(); const errors=[];
      page.on('pageerror',e => errors.push(e.message));
      const requests=[]; page.on('request',r => requests.push(r.url()));
      await page.goto(base+'/app/dashboard');
      await page.locator('main h1').first().waitFor();
      assert(!requests.some(url => /\/assets\/(Pos|Products|Expenses|Reports|GlobalSearch)-/.test(url)), 'dashboard must not download unrelated page code');
      for (const route of [...erp.map(p=>'/app/'+p),...saas.map(p=>'/saas/'+p),'/design-system']) {
        await page.goto(base+route);
        try {
          // The component library intentionally demonstrates busy buttons; wait only for page download boundaries.
          await page.waitForFunction(() => !document.querySelector('[data-page-loading="true"]') && !!document.querySelector('h1,h2'));
        } catch (err) {
          console.error('Failed production route',route,'theme',theme,'browser errors',errors);
          console.error('Document diagnostic',await page.locator('body').innerText().then(t=>t.slice(0,1800)).catch(()=>'<unreadable>'));
          throw err;
        }
        assert.equal(await page.getByRole('button',{name:'Reload page',exact:true}).count(),0,route+' must render without error fallback');
        assert.equal(await page.getAttribute('html','data-theme'),theme);
        if (route !== '/design-system') assert((await page.locator('main').innerText()).trim().length > 30,route+' must render page content');
      }
      assert.deepEqual(errors,[]);
      await context.close();
      console.log('PASS '+theme+': 44 production deep links, page chunks and theme');
      for (const width of [320,390,768,1024,1440]) {
        const c = await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
        await c.addInitScript(value => localStorage.setItem('hisabiq-theme',value),theme);
        const p=await c.newPage();
        let release; const gate = new Promise(resolve=>{release=resolve;});
        await p.route('**/assets/Products-*.js', async route => { await gate; await route.continue(); });
        await p.goto(base+'/app/products',{waitUntil:'domcontentloaded'});
        await p.getByRole('status').filter({hasText:'Loading page'}).waitFor();
        assert(await p.locator('header').first().isVisible(),'workspace header remains available');
        assert(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth+1),'loading state must fit viewport');
        release();
        await p.getByRole('button',{name:'Add product',exact:true}).waitFor();
        await c.close();
        console.log('PASS '+theme+' '+width+': slow page keeps navigation, themed loading and no overflow');
      }
      const c = await browser.newContext();
      await c.addInitScript(value => localStorage.setItem('hisabiq-theme',value),theme);
      const p = await c.newPage();
      await p.route('**/assets/Products-*.js',r=>r.abort());
      await p.goto(base+'/app/products');
      await p.getByRole('heading',{name:'This page could not open'}).waitFor();
      assert(await p.locator('header').first().isVisible());
      // Path change clears the failed boundary while keeping the shell usable.
      await p.evaluate(()=>{location.hash='/app/dashboard';});
      await p.locator('main h1').first().waitFor();
      assert.equal(await p.getByRole('button',{name:'Reload page',exact:true}).count(),0);
      await p.evaluate(()=>{location.hash='/app/products';});
      await p.getByRole('button',{name:'Reload page',exact:true}).waitFor();
      await p.unroute('**/assets/Products-*.js');
      await p.getByRole('button',{name:'Reload page',exact:true}).click();
      await p.getByRole('button',{name:'Add product',exact:true}).waitFor();
      await c.close();
      console.log('PASS '+theme+': failed chunk shows real recovery, navigation and reload');
    }
  } finally { await browser.close(); await new Promise(resolve=>server.httpServer.close(resolve)); }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
