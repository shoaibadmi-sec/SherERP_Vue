const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
async function main() {
  const { createServer } = await import("vite");
  const server = await createServer({
    server: { host: "127.0.0.1", port: 4288, strictPort: true },
  });
  await server.listen();
  const browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || undefined,
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("dialog", (d) => d.accept());
  const base = "http://127.0.0.1:4288/#/app/";
  const go = async (path) => {
    await page.goto(base + path);
    await page.locator("#erp-main").waitFor();
  };
  const select = async (label, value) => {
    if(label==='Settings section'){await page.locator(`[data-settings-directory] a[href$="/app/settings/${value}"]:visible, [data-settings-section="${value}"]:visible`).first().click();return;}
    await page.getByRole("combobox", { name: label, exact: true }).click();
    await page.locator(`[role=option][data-value="${value}"]`).click();
  };
  const save = async () => {
    await page
      .getByRole("button", { name: "Save changes", exact: true })
      .click();
    await page
      .getByRole("status")
      .filter({ hasText: "Business settings saved." })
      .waitFor();
  };
  try {
    await go("settings/financialTerminology");
    await page
      .getByRole("heading", { name: "Names & Khata", exact: true })
      .waitFor();
    await select("Naming preset", "Local party Khata");
    await page
      .getByRole("textbox", { name: "Credit Bangla", exact: true })
      .fill("জমা");
    await page
      .getByRole("textbox", { name: "Money to receive English", exact: true })
      .fill("Collect from customer");
    await save();
    await go("parties?id=c1&role=Customer");
    await page.getByRole("table").first().waitFor();
    await page
      .getByText("Collect from customer", { exact: true })
      .first()
      .waitFor();
    const headers = await page
      .getByRole("table")
      .first()
      .getByRole("columnheader")
      .allTextContents();
    assert(
      headers.findIndex((s) => s.includes("Credit")) <
        headers.findIndex((s) => s.includes("Debit")),
      "Whole ledger columns use the saved order",
    );
    await page
      .locator("#erp-main")
      .getByRole("button", { name: "Settings", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "Names & Khata", exact: true })
      .waitFor();
    assert.equal(
      await page
        .getByRole("combobox", { name: "Column order", exact: true })
        .getAttribute("data-value"),
      "credit-first",
    );
    await page.getByRole("button", { name: /Back to/ }).click();
    assert(page.url().includes("id=c1"));
    await go("settings/financialTerminology");
    await select("Account / relationship", "Cash & bank");
    await select("Naming preset", "Money movement");
    await save();
    await go("accounts?tab=ledger");
    await page.getByRole("columnheader", { name: /Money in/ }).waitFor();
    await select("Ledger account", "Sales Revenue");
    await page.getByRole("columnheader", { name: /Credit/ }).waitFor();
    assert.equal(
      await page.getByRole("columnheader", { name: /Money out/ }).count(),
      0,
    );
    await go("settings/invoices");
    await page
      .getByRole("combobox", { name: "Invoice template", exact: true })
      .waitFor();
    await select("Document language", "Bangla");
    await select("Paper mode", "Business Pad");
    await page
      .getByLabel("Content starts below header (mm)", { exact: true })
      .fill("35");
    await save();
    const popupPromise = page.waitForEvent("popup");
    await page
      .getByRole("button", { name: "Print preview", exact: true })
      .click();
    const popup = await popupPromise;
    await popup.waitForLoadState("domcontentloaded");
    assert.match(await popup.content(), /35mm/);
    assert.match(await popup.locator("body").innerText(), /বিক্রয় চালান/);
    assert.equal(await popup.locator("html").getAttribute("lang"), "bn");
    await popup.close();
    await page.reload();
    assert.equal(
      await page
        .getByRole("combobox", { name: "Paper mode", exact: true })
        .getAttribute("data-value"),
      "Business Pad",
    );
    await go("sales");
    await page
      .getByRole("button", { name: /Print|Actions/ })
      .first()
      .count();
    await go("settings/team");
    await page.getByRole("tab", { name: /Roles & permissions/ }).click();
    await page
      .getByRole("button", { name: "Create role", exact: true })
      .click();
    const role = page.getByRole("dialog", { name: "Create role", exact: true });
    await role.getByLabel("Role name", { exact: true }).fill("Stock assistant");
    await role.getByLabel(/See settings/).check();
    await role.getByLabel(/I reviewed who is affected/).check();
    await role.getByRole("button", { name: "Keep role draft" }).click();
    await save();
    await page.reload();
    await page.getByRole("tab", { name: /Roles & permissions/ }).click();
    await page
      .getByRole("heading", { name: "Stock assistant", exact: true })
      .waitFor();
    await select("Demo employee access", "rafiq");
    await page.getByText(/Read-only access/).waitFor();
    assert.equal(
      await page
        .getByRole("button", { name: "Create role", exact: true })
        .count(),
      0,
    );
    await select("Demo employee access", "mahmud");
    await go("settings/interface");
    await page.getByLabel("Items", { exact: true }).uncheck();
    assert.equal(await page.getByLabel("InvoiceRequired").isDisabled(), true);
    await go("sales");
    assert.equal(
      await page
        .getByRole("columnheader", { name: "Items", exact: true })
        .count(),
      0,
    );
    await page.getByRole("button", { name: "Columns", exact: true }).click();
    await page
      .getByRole("menuitemcheckbox", { name: "Items", exact: true })
      .click();
    await page.keyboard.press("Escape");
    await go("settings/interface");
    assert.equal(
      await page.getByLabel("Items", { exact: true }).isChecked(),
      true,
    );
    await select("Apply to", "business");
    await page.getByLabel("Payment", { exact: true }).uncheck();
    await save();
    await select("Apply to", "mine");
    await page
      .getByRole("button", { name: "Use inherited defaults", exact: true })
      .click();
    await go("sales");
    assert.equal(
      await page
        .getByRole("columnheader", { name: "Payment", exact: true })
        .count(),
      0,
    );
    await page
      .getByRole("button", { name: /Actions for INV-/ })
      .first()
      .click();
    await page
      .getByRole("button", { name: "View invoice", exact: true })
      .click();
    const invoice = page.getByRole("dialog").first();
    await invoice
      .getByText("Invoice display only · প্রিন্টের নাম ও নোট", { exact: true })
      .click();
    await invoice
      .getByLabel("Customer display name", { exact: true })
      .fill("Printed customer alias");
    await invoice
      .getByLabel("Additional printed note", { exact: true })
      .fill("Deliver Friday");
    await invoice
      .getByRole("button", { name: "Save presentation revision", exact: true })
      .click();
    await invoice
      .getByText(/Presentation revision saved in this session/)
      .waitFor();
    assert.match(await invoice.innerText(), /1 previous copies retained/);
    await invoice
      .getByRole("button", { name: "Close", exact: true })
      .first()
      .click();
    await page.getByRole("tab", { name: /Drafts & templates/ }).click();
    await page
      .getByRole("button", { name: "Actions", exact: true })
      .first()
      .click();
    await page.getByRole("button", { name: "Archive", exact: true }).click();
    await go("settings/data");
    await page
      .getByRole("button", { name: "Restore draft", exact: true })
      .click();
    await page
      .getByText(
        "Draft restored with its original identity. No money or stock posted.",
        { exact: true },
      )
      .waitFor();
    assert.equal(
      await page
        .getByRole("button", { name: "Restore draft", exact: true })
        .count(),
      0,
    );
    await go("settings/invoices");
    await page.getByRole('tab',{name:/Ledger & report designs/}).click();
    await select("Output language", "Bangla");
    await select("Output orientation", "Landscape");
    await page
      .getByRole("textbox", { name: /^Output footer/ })
      .fill("Sample ledger footer");
    await save();
    const ledgerPrint = page.waitForEvent("popup");
    await page
      .getByRole("button", { name: "Preview ledger design", exact: true })
      .click();
    const ledger = await ledgerPrint;
    await ledger.waitForLoadState("domcontentloaded");
    assert.match(await ledger.content(), /A4 landscape/);
    assert.match(
      await ledger.locator("body").innerText(),
      /Sample ledger footer/,
    );
    await ledger.close();
    await go("settings/business");
    await page
      .getByLabel("Business name", { exact: true })
      .fill("Unsaved browser-back edit");
    await page.goBack();
    await page
      .getByRole("dialog", { name: "Discard unsaved changes?", exact: true })
      .waitFor();
    await page
      .getByRole("button", { name: "Keep editing", exact: true })
      .click();
    assert.equal(
      await page.getByLabel("Business name", { exact: true }).inputValue(),
      "Unsaved browser-back edit",
    );
    await page.getByRole("button", { name: "Discard", exact: true }).click();
    // Both entries are created by the router; external hashes are covered above.
    await go("settings/business");
    await select("Settings section", "invoices");
    await select("Settings section", "business");
    await page
      .getByLabel("Business name", { exact: true })
      .fill("Router back draft");
    await page.getByText("Unsaved changes", { exact: true }).waitFor();
    await page.goBack();
    await page
      .getByRole("dialog", { name: "Discard unsaved changes?", exact: true })
      .waitFor();
    await page
      .getByRole("button", { name: "Keep editing", exact: true })
      .click();
    assert.equal(
      await page.getByLabel("Business name", { exact: true }).inputValue(),
      "Router back draft",
    );
    await page.goBack();
    await page
      .getByRole("dialog", { name: "Discard unsaved changes?", exact: true })
      .waitFor();
    await page
      .getByRole("button", { name: "Discard and continue", exact: true })
      .click();
    await page.waitForURL("**/settings/invoices");
    await page.goForward();
    await page.waitForURL("**/settings/business");
    assert.notEqual(
      await page.getByLabel("Business name", { exact: true }).inputValue(),
      "Router back draft",
    );
    fs.mkdirSync(".superpowers/sdd/final-settings/screens", {
      recursive: true,
    });
    for (const width of [390, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const section of [
        "business",
        "financialTerminology",
        "invoices",
        "team",
      ]) {
        await go("settings/" + section);
        await page
          .getByTestId("settings-title")
          .waitFor();
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth + 1,
        );
        assert.equal(overflow, false, `${width} ${section} reflows`);
        await page.screenshot({
          path: `.superpowers/sdd/final-settings/screens/${section}-${width}.png`,
          fullPage: true,
        });
      }
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await go("settings/invoices");
    await page.getByRole('tab',{name:/Invoice design/}).click();
    await select("Paper mode", "58 mm");
    await page.evaluate(() => {
      window.__originalSettingsWrite = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) {
        if (key === "hisabiq-erp-settings-v1:t1")
          throw new DOMException("Full", "QuotaExceededError");
        return window.__originalSettingsWrite.call(this, key, value);
      };
    });
    await page
      .getByRole("button", { name: "Save changes", exact: true })
      .click();
    await page
      .getByRole("status")
      .filter({ hasText: "Changes are in memory only" })
      .first()
      .waitFor();
    await go("sales");
    await page
      .getByRole("button", { name: /Actions for INV-/ })
      .nth(1)
      .click();
    const memoryPrintPromise = page.waitForEvent("popup");
    await page.getByRole("button", { name: "Print", exact: true }).click();
    const memoryPrint = await memoryPrintPromise;
    await memoryPrint.waitForLoadState("domcontentloaded");
    assert.match(await memoryPrint.content(), /58mm/);
    await memoryPrint.close();
    await page.evaluate(() => {
      Storage.prototype.setItem = window.__originalSettingsWrite;
    });
    await page.evaluate(() => {
      const key = "hisabiq-erp-settings-v1:t1";
      const state = JSON.parse(localStorage.getItem(key));
      state.sections.team.roles.push({
        id: "settings-only",
        name: "Settings only",
        permissions: ["settings.setting.view"],
      });
      state.sections.team.employees.find((e) => e.id === "rafiq").roleIds = [
        "settings-only",
      ];
      localStorage.setItem(key, JSON.stringify(state));
    });
    await page.reload();
    await go("settings/team");
    await select("Demo employee access", "rafiq");
    assert.equal(
      await page
        .getByRole("tablist", {name:"Employee settings views"})
        .count(),
      0,
    );
    await page
      .getByText(
        "User and role lists require their separate view permissions.",
        { exact: true },
      )
      .waitFor();
    await go("settings/data");
    assert.equal(
      await page
        .getByRole("heading", { name: "Settings activity", exact: true })
        .count(),
      0,
    );
    assert.deepEqual(errors, []);
    console.log(
      "Settings redesign: names/order, real Party consumer, local/central parity, Bangla Business Pad print, role mutation/denial, columns, presentation revision, draft recovery, output profiles, browser Back and 12 responsive screens passed.",
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
