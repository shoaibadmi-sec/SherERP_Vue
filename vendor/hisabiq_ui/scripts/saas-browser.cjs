const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
async function main() {
  const { createServer } = await import("vite");
  const server = await createServer({
    server: { host: "127.0.0.1", port: 4175, strictPort: true },
  });
  await server.listen();
  const browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH,
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  fs.mkdirSync(process.env.SAAS_SCREENSHOT_DIR || ".superpowers/saas-preview", {
    recursive: true,
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("dialog", (d) => d.accept());
  const go = async (p) => {
    await page.goto("http://127.0.0.1:4175/#" + p);
    await page.waitForTimeout(200);
  };
  try {
    await go("/saas/overview");
    await page
      .getByRole("heading", { name: "Good to see you, Shoaib" })
      .waitFor();
    await go("/saas/team");
    await page.getByRole("button", { name: "Create role" }).count();
    await page.getByRole("button", { name: "Roles", exact: true }).click();
    await page
      .getByRole("button", { name: "Create role", exact: true })
      .click();
    await page.getByLabel("Role name").fill("Combined test role");
    await page
      .getByRole("dialog")
      .getByText("support", { exact: true })
      .locator("..")
      .getByLabel("edit", { exact: true })
      .check();
    await page.getByRole("button", { name: "Save role", exact: true }).click();
    await page.getByRole("dialog").waitFor({ state: "hidden" });
    await page.getByLabel("Search records").fill("Combined test role");
    await page.getByText("Combined test role", { exact: true }).waitFor();
    await go("/saas/overview");
    await page.getByLabel("Demo staff account").selectOption("amina");
    await page
      .getByRole("heading", { name: "Good to see you, Amina" })
      .waitFor();
    await go("/saas/team");
    await page.getByRole("heading", { name: "Access denied" }).waitFor();
    await page.getByLabel("Demo staff account").selectOption("admin");
    await go("/saas/tenants");
    await page
      .getByRole("button", { name: "Create tenant", exact: true })
      .click();
    for (const [label, value] of [
      ["Business name", "Browser Demo Shop"],
      ["Owner name", "Demo Owner"],
      ["Owner email", "browser@example.com"],
      ["Phone", "01700000000"],
    ])
      await page.getByLabel(label, { exact: true }).fill(value);
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Create tenant", exact: true })
      .click();
    await page.getByRole("link", { name: /Browser Demo Shop/ }).waitFor();
    await page.reload();
    await page.getByRole("link", { name: /Browser Demo Shop/ }).waitFor();
    await go("/saas/overview");
    await page.screenshot({
      path: `${process.env.SAAS_SCREENSHOT_DIR || ".superpowers/saas-preview"}/overview.png`,
      fullPage: true,
    });
    await go("/saas/payments/PAY-1001");
    await page
      .getByRole("button", { name: "Verify payment", exact: true })
      .click();
    await page
      .getByRole("checkbox", { name: "I checked the collection record." })
      .check();
    await page
      .getByRole("button", { name: "Confirm verify", exact: true })
      .click();
    await page.getByRole("dialog").waitFor({ state: "hidden" });
    await page.getByText("Verified", { exact: true }).waitFor();
    await go("/saas/invoices/SAAS-1001");
    await page.getByText("Paid", { exact: true }).waitFor();
    await go("/saas/support/TKT-1001");
    await page
      .getByRole("button", { name: "Internal note", exact: true })
      .click();
    await page
      .getByLabel("Internal note text", { exact: true })
      .fill("STAFF_PRIVATE_BROWSER_MARKER");
    await page
      .getByRole("button", { name: "Add internal note", exact: true })
      .click();
    await page
      .getByText("STAFF_PRIVATE_BROWSER_MARKER", { exact: true })
      .waitFor();
    await go("/app/support/TKT-1001");
    await page
      .getByRole("heading", { name: "Help with opening stock import" })
      .waitFor();
    assert.equal(
      await page
        .getByText("STAFF_PRIVATE_BROWSER_MARKER", { exact: true })
        .count(),
      0,
    );
    await page
      .getByLabel("Reply message", { exact: true })
      .fill("PUBLIC_BROWSER_REPLY");
    await page
      .getByRole("button", { name: "Send public reply", exact: true })
      .click();
    await page.getByText("PUBLIC_BROWSER_REPLY", { exact: true }).waitFor();
    await go("/saas/overview");
    await page.getByLabel("Demo staff account").selectOption("admin");
    await go('/saas/sms');
    await page.getByRole('button',{name:'Templates',exact:true}).click();
    await page.getByRole('button',{name:'Create template',exact:true}).click();
    await page.getByLabel('Template name').fill('Browser renewal template');
    await page.getByLabel('Template text').fill('Renew your subscription through My subscription.');
    await page.getByRole('button',{name:'Save template',exact:true}).click();
    await page.getByText('Browser renewal template',{exact:true}).waitFor();
    await page.getByRole('button',{name:'Compose demo SMS',exact:true}).click();
    await page.getByLabel('Recipient phone').fill('01700000000');
    await page.getByLabel('Message',{exact:true}).fill('Demo message');
    await page.getByRole('button',{name:'Queue demo message',exact:true}).click();
    await page.getByRole('button',{name:'Delivery logs',exact:true}).click();
    await page.getByText('Queued',{exact:true}).waitFor();
    await page.getByRole('button',{name:'Simulate failed',exact:true}).click();
    await page.getByRole('button',{name:'Retry',exact:true}).click();
    await page.getByText('Queued',{exact:true}).waitFor();
    await go('/saas/services/ORD-1001');
    await page.getByRole('button',{name:'Quote',exact:true}).click();
    await page.getByLabel('Quoted price (BDT)', {exact:true}).fill('1500');
    await page.getByRole('button',{name:'Confirm quote',exact:true}).click();
    await page.getByRole('button',{name:'Approve',exact:true}).click();
    await page.getByRole('button',{name:'Confirm approve',exact:true}).click();
    await page.getByRole('link',{name:/invoice-ORD-1001/}).waitFor();
    await go('/app/support/TKT-1001');
    await page.evaluate(()=>{window.__originalSetItem=Storage.prototype.setItem;Storage.prototype.setItem=()=>{throw Error('Test quota');};});
    await page.getByLabel('Reply message',{exact:true}).fill('Quota test reply');
    await page.getByRole('button',{name:'Send public reply',exact:true}).click();
    await page.getByRole('alert').filter({hasText:'Changes are in memory only'}).waitFor();
    await page.evaluate(()=>{Storage.prototype.setItem=window.__originalSetItem;});
    await page.reload();
    await go('/saas/overview');await page.getByLabel('Demo staff account').selectOption('admin');
    const axe = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
    const routes = [
      "overview",
      "tenants",
      "tenants/t1",
      "plans",
      "subscriptions",
      "invoices",
      "invoices/SAAS-1001",
      "payments",
      "payments/PAY-1001",
      "sms",
      "services",
      "services/ORD-1001",
      "support",
      "support/TKT-1001",
      "knowledge",
      "team",
      "announcements",
      "reports",
      "audit",
      "settings",
    ];
    for (const theme of ["Light", "Dark"]) {
      await page.getByRole("button", { name: /^Appearance:/ }).click();
      await page.getByRole("radio", { name: theme, exact: true }).click();
      for (const route of routes) {
        await go("/saas/" + route);
        await page.addScriptTag({ content: axe });
        const violations = await page.evaluate(async () =>
          (
            await axe.run(document, { runOnly: ["color-contrast"] })
          ).violations.map((v) => ({
            id: v.id,
            nodes: v.nodes.map((n) => ({
              target: n.target,
              summary: n.failureSummary,
            })),
          })),
        );
        assert.deepEqual(
          violations,
          [],
          `${theme} ${route}: ${JSON.stringify(violations)}`,
        );
      }
      for(const [route,button] of [['plans','Create plan'],['invoices','Issue invoice'],['sms','Compose demo SMS'],['support','New ticket'],['team','Invite employee'],['announcements','New announcement']]){
        await go('/saas/'+route);await page.getByRole('button',{name:button,exact:true}).click();await page.addScriptTag({content:axe});
        const violations=await page.evaluate(async()=> (await axe.run(document,{runOnly:['color-contrast']})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})));
        assert.deepEqual(violations,[],`${theme} ${route} dialog`);await page.keyboard.press('Escape');await page.getByRole('dialog').waitFor({state:'hidden'});
      }
      for(const route of ['/app/subscription','/app/support','/app/support/TKT-1001']){
        await go(route);await page.addScriptTag({content:axe});const violations=await page.evaluate(async()=> (await axe.run(document,{runOnly:['color-contrast']})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})));assert.deepEqual(violations,[],`${theme} ${route}`);
      }
      await go('/saas/overview');await page.getByLabel('Demo staff account').selectOption('admin');
      await page.evaluate(()=>document.fonts.load('12px "Hind Siliguri"','বাংলা'));
      await go("/saas/overview");
      await page.screenshot({
        path: `${process.env.SAAS_SCREENSHOT_DIR || ".superpowers/saas-preview"}/${theme.toLowerCase()}.png`,
        fullPage: true,
      });
      console.log(`PASS ${theme}: ${routes.length} routes, 6 dialogs and 3 tenant pages contrast checks`);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await go("/saas/overview");
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
      "No mobile page overflow",
    );
    await page
      .getByRole("button", { name: "Open navigation", exact: true })
      .click();
    await page
      .getByRole("navigation", { name: "Platform navigation" })
      .getByRole("link", { name: /Team & roles/ })
      .click();
    await page
      .getByRole("button", { name: "Invite employee", exact: true })
      .click();
    await page.keyboard.press("Escape");
    await page.getByRole("dialog").waitFor({ state: "hidden" });
    await page.screenshot({
      path: `${process.env.SAAS_SCREENSHOT_DIR || ".superpowers/saas-preview"}/mobile.png`,
      fullPage: true,
    });
    console.log(
      "PASS payment settlement, tenant conversation privacy, mobile navigation and Escape",
    );
    assert.deepEqual(errors, []);
    console.log(
      "PASS role editor, scoped routes, tenant creation, persistence and overview",
    );
  } finally {
    await browser.close();
    await server.close();
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
