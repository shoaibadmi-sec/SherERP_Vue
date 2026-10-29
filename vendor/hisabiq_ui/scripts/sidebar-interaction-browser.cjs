/* Pointer feedback and keyboard/touch navigation share the existing ERP menu. */
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { expect } = require('playwright/test');

async function main() {
  const { createServer } = await import('vite');
  const server = await createServer({ server: { host: '127.0.0.1', port: 4363, strictPort: true } });
  await server.listen();
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || undefined, args: ['--no-sandbox'] });
  const errors = [];
  const cases = [];
  for (const width of [1280, 1440]) for (const theme of ['light', 'dark']) for (const reducedMotion of ['no-preference', 'reduce'])
    cases.push({ width, theme, reducedMotion, hasTouch: false });
  for (const width of [390, 768, 1024]) for (const theme of ['light', 'dark'])
    cases.push({ width, theme, reducedMotion: 'no-preference', hasTouch: true });
  try {
    for (const config of cases) {
      const context = await browser.newContext({ viewport: { width: config.width, height: 900 }, reducedMotion: config.reducedMotion, hasTouch: config.hasTouch });
      await context.addInitScript(theme => {
        localStorage.setItem('hisabiq-theme', theme);
        localStorage.setItem('hisabiq-erp-personal-v1', JSON.stringify({ mode: 'Simple', language: 'English', density: 'Compact', terminology: 'simple', dateView: 'transaction' }));
      }, config.theme);
      const page = await context.newPage();
      page.on('pageerror', error => errors.push(error.message));
      await page.goto('http://127.0.0.1:4363/#/app/dashboard');
      const drawer = config.width < 1024;
      if (drawer) await page.getByRole('button', { name: 'Open ERP navigation', exact: true }).tap();
      const root = drawer ? page.getByRole('dialog', { name: 'ERP navigation', exact: true }) : page.locator('aside[data-sidebar="sidebar"]');
      const nav = root.getByRole('navigation');
      await nav.waitFor();
      const sales = nav.locator('button[aria-controls$="-erp-sales"]');
      const panel = nav.locator('[id$="-erp-sales"]');
      const counter = nav.getByRole('link', { name: 'Counter', exact: true });
      if (!config.hasTouch) {
        await counter.hover();
        await expect(counter.locator('[data-motion-nav-hover]')).toHaveCount(1);
        await sales.hover();
        await expect(sales.locator('[data-motion-nav-hover]')).toHaveCount(1);
        await expect(nav.locator('[data-motion-nav-hover]')).toHaveCount(1);
        await expect.poll(async () => {
          const row = await sales.boundingBox(), highlight = await sales.locator('[data-motion-nav-hover]').boundingBox();
          return Math.abs(row.y - highlight.y);
        }).toBeLessThan(1);
        for(let pass=0;pass<3;pass++){await counter.hover();await sales.hover();}
        await expect(nav.locator('[data-motion-nav-hover]')).toHaveCount(1);
        const selection = nav.getByRole('link', { name: 'Dashboard', exact: true });
        await expect(selection).toHaveAttribute('aria-current', 'page');
        const bounds = await counter.boundingBox();
        await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
        await page.mouse.down();
        await page.waitForTimeout(140); // Sample the held press after its 110ms transition.
        const scale = await counter.evaluate(el => new DOMMatrix(getComputedStyle(el).transform).a);
        assert.ok(config.reducedMotion === 'reduce' ? Math.abs(scale - 1) < 0.001 : scale < 0.995, 'press feedback respects reduced motion');
        await page.mouse.up();
        await expect(page).toHaveURL(/\/app\/counter$/);
        await page.mouse.move(900, 70);
        await expect(nav.locator('[data-motion-nav-hover]')).toHaveCount(0);
        await expect(counter).toHaveAttribute('aria-current', 'page');
      }
      const before = page.url();
      if (config.hasTouch) await sales.tap(); else await sales.click();
      await expect(sales).toHaveAttribute('aria-expanded', 'true');
      await expect.poll(async () => (await panel.boundingBox()).height).toBeGreaterThan(60);
      assert.equal(page.url(), before, 'opening a group does not navigate');
      await sales.focus();
      await page.keyboard.press('Enter');
      await expect(sales).toHaveAttribute('aria-expanded', 'false');
      await expect(panel).toHaveAttribute('aria-hidden', 'true');
      await expect(panel.locator('a').first()).toHaveAttribute('tabindex', '-1');
      await expect.poll(async () => (await panel.boundingBox()).height).toBeLessThan(0.5);
      await page.keyboard.press('Space');
      await expect(sales).toHaveAttribute('aria-expanded', 'true');
      if(!config.hasTouch){
        const child=nav.getByRole('link',{name:'Sales History',exact:true});await child.hover();
        await expect(child.locator('[data-motion-nav-hover]')).toHaveCount(1);
        await expect(nav.locator('[data-motion-nav-hover]')).toHaveCount(1);
        for(let pass=0;pass<4;pass++)await sales.click();
        await expect(sales).toHaveAttribute('aria-expanded','true');
      }
      const history = nav.getByRole('link', { name: 'Sales History', exact: true });
      if (config.hasTouch) await history.tap(); else await history.click();
      await expect(page).toHaveURL(/\/app\/sales$/);
      if (drawer) await expect(root).toHaveCount(0);
      if (!config.hasTouch) {
        await root.getByRole('button', { name: 'Collapse sidebar', exact: true }).click();
        await expect(root).toHaveCSS('width', '64px');
        await nav.getByRole('button', { name: 'Expand sidebar to open Products & Stock', exact: true }).click();
        await expect(root).toHaveCSS('width', '256px');
        await expect(nav.locator('button[aria-controls$="-erp-products"]')).toHaveAttribute('aria-expanded', 'true');
        await page.keyboard.press('Control+b');
        await expect(root).toHaveAttribute('data-collapsible', 'icon');
        await page.keyboard.press('Control+b');
        await expect(root).toHaveCSS('width', '256px');
        await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
        const violations=await root.evaluate(async el=>(await axe.run(el,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}})).violations.map(item=>({id:item.id,nodes:item.nodes.map(node=>node.target)})));
        assert.deepEqual(violations,[],'sidebar accessibility');
      } else if (!drawer) await expect(nav.locator('[data-motion-nav-hover]')).toHaveCount(0);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'no horizontal overflow');
      await context.close();
      console.log('Sidebar hover, click, submenu and navigation:', config);
    }
    assert.deepEqual(errors, []);
    console.log(cases.length + ' sidebar interaction cases passed');
  } finally { await browser.close(); await server.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
