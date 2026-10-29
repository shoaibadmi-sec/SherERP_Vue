const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
async function main() {
  const { createServer } = await import("vite");
  const server = await createServer({
    server: { host: "127.0.0.1", port: 4176, strictPort: true },
  });
  await server.listen();
  const browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || undefined,
    args: ["--no-sandbox"],
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("dialog", (d) => d.accept());
  const base = "http://127.0.0.1:4176";
  const go = async (section) => {
    await page.goto(`${base}/#/app/settings/${section}`);
    await page
      .getByTestId("settings-title")
      .waitFor();
  };
  const sectionNav = id => page.locator(`[data-settings-directory] a[href$="/app/settings/${id}"]:visible, [data-settings-section="${id}"]:visible`).first();
  const chooseOption = async (label, value) => {
    await page.getByLabel(label, { exact: true }).click();
    await page.locator('[role="option"][data-value=' + JSON.stringify(value) + ']').click();
  };
  const mode = async (value) =>
    page.getByRole("radio", { name: value, exact: true }).check();
  const save = async () => {
    await page
      .getByRole("button", { name: "Save changes", exact: true })
      .click();
    if (
      await page
        .getByRole("dialog", { name: "Review settings changes" })
        .count()
    )
      await page
        .getByRole("button", { name: "Confirm save", exact: true })
        .click();
    await page
      .getByRole("status")
      .filter({ hasText: /settings saved|preferences saved|Changes are in memory only/ })
      .waitFor();
  };
  const read = () =>
    page.evaluate(() =>
      JSON.parse(localStorage.getItem("hisabiq-erp-settings-v1:t1")),
    );
  const shotDir =
    process.env.SETTINGS_SCREENSHOT_DIR || ".superpowers/settings-preview";
  fs.mkdirSync(shotDir, { recursive: true });
  try {
    await go("business");
    await page
      .getByLabel("Business name", { exact: true })
      .fill("Browser Hardware Shop");
    await save();
    await page.reload();
    await page.getByLabel("Business name", { exact: true }).waitFor();
    assert.equal(
      await page.getByLabel("Business name", { exact: true }).inputValue(),
      "Browser Hardware Shop",
    );
    await page
      .getByLabel("Business name", { exact: true })
      .fill("Unsaved shop");
    await sectionNav("sales").click();
    await page
      .getByRole("dialog", { name: "Discard unsaved changes?" })
      .waitFor();
    await page
      .getByRole("button", { name: "Keep editing", exact: true })
      .click();
    assert.equal(
      await page.getByLabel("Business name", { exact: true }).inputValue(),
      "Unsaved shop",
    );
    await sectionNav("sales").click();
    await page
      .getByRole("button", { name: "Discard and continue", exact: true })
      .click();
    await page.getByLabel("Default payment method", { exact: true }).waitFor();
    await mode("Simple");
    assert.equal(
      await page.getByLabel("Maximum discount (%)", { exact: true }).count(),
      0,
    );
    await mode("Advanced");
    await page.getByLabel("Maximum discount (%)", { exact: true }).fill("15");
    await mode("Simple");
    await mode("Advanced");
    assert.equal(
      await page
        .getByLabel("Maximum discount (%)", { exact: true })
        .inputValue(),
      "15",
    );
    await chooseOption("Default payment method", "bKash");
    await chooseOption("Invoice rounding", "No rounding");
    await save();
    await page.goto(`${base}/#/app/pos`);
    await page.getByText("Rounding (off)", { exact: true }).waitFor();
    assert.equal(
      (await page.locator('input[value="12"]').count()) > 0,
      true,
      "Compound Gira quantity retained",
    );
    assert.equal(
      (await page.locator('input[value="5"]').count()) > 0,
      true,
      "Compound Pcs quantity retained",
    );
    await page.getByText("Rounding (off)", { exact: true }).waitFor();
    assert.equal(
      await page.locator('[role="combobox"][data-value="bKash"]').count() > 0,
      true,
      "First payment uses saved method",
    );
    await go("sales");
    await chooseOption("Demo employee access", "rafiq");
    await page.getByText(/Read-only access/).waitFor();
    assert.equal(
      await page.getByLabel("Invoice rounding", { exact: true }).isDisabled(),
      true,
    );
    assert.equal(
      await page
        .getByRole("button", { name: "Save changes", exact: true })
        .isDisabled(),
      true,
    );
    await chooseOption("Demo employee access", "mahmud");
    await mode("Simple");
    await page.getByLabel("Search settings").fill("FIFO");
    await page
      .getByRole("region", { name: "Settings search results" })
      .getByRole("button", { name: /Default lot allocation/ })
      .click();
    await page.getByLabel("Default base unit", { exact: true }).waitFor();
    assert.equal(
      await page
        .getByRole("radio", { name: "Advanced", exact: true })
        .isChecked(),
      true,
    );
    await chooseOption("Default base unit", "Pcs");
    await chooseOption("Default serial tracking", "Required");
    await page
      .getByRole("switch", { name: "Warranty by default", exact: true })
      .locator("..")
      .click();
    assert.equal(
      await page
        .getByRole("switch", { name: "Warranty by default", exact: true })
        .isChecked(),
      true,
    );
    await save();
    await page.getByRole("link", { name: "Manage units", exact: true }).click();
    await page.getByRole("tab", { name: /Units/ }).waitFor();
    assert.equal(
      await page
        .getByRole("tab", { name: /Units/ })
        .getAttribute("aria-selected"),
      "true",
    );
    await page.getByRole("tab", { name: /^Product list/ }).click();
    await page
      .getByRole("button", { name: "Add product", exact: true })
      .click();
    const productEditor=page.locator('[data-product-editor]');await productEditor.waitFor();
    assert.equal(await productEditor.locator('#pf-unit').getAttribute('data-value'),'Pcs','saved tenant default unit');
    if(await productEditor.locator('#pf-other-button').getAttribute('aria-expanded')==='false')await productEditor.locator('#pf-other-button').click();
    assert.equal(await productEditor.getByRole('radio',{name:'Required',exact:true}).getAttribute('aria-checked'),'true');
    await productEditor.getByRole('button',{name:'Cancel',exact:true}).click();
    await go("team");
    await mode("Advanced");
    await page.getByRole("tab", { name: /Roles & permissions/ }).click();
    await page
      .getByRole("button", { name: "Create role", exact: true })
      .click();
    await page.getByLabel("Role name").fill("Sales settings assistant");
    await page.getByText("Module-specific settings access", {exact:true}).click();
    await page
      .getByRole("checkbox", { name: "Sales & POS", exact: true })
      .check();
    await page.getByRole("checkbox", {name:/I reviewed who is affected/}).check();
    await page
      .getByRole("button", { name: "Keep role draft", exact: true })
      .click();
    await save();
    await page.getByRole("tablist", {name:"Employee settings views"}).getByRole("tab", { name: /Employees/ }).click();
    await page
      .getByRole("button", { name: "Edit employee Rafiq Islam", exact: true })
      .click();
    await page
      .getByRole("checkbox", { name: "Sales settings assistant", exact: true })
      .check();
    await page
      .getByRole("button", { name: "Keep employee draft", exact: true })
      .click();
    await save();
    await chooseOption("Demo employee access", "rafiq");
    await go("sales");
    // A hard navigation reopens the owner demo actor; use the selector to inspect the saved combined role.
    await chooseOption("Demo employee access", "rafiq");
    assert.equal(
      await page.getByLabel("Invoice rounding", { exact: true }).isDisabled(),
      false,
    );
    await chooseOption("Demo employee access", "mahmud");
    await go("team");
    await mode("Advanced");
    await page
      .getByRole("button", { name: "Edit employee Mahmud Hasan", exact: true })
      .click();
    await page
      .getByRole("checkbox", { name: "Active employee", exact: true })
      .uncheck();
    await page
      .getByRole("button", { name: "Keep employee draft", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Save changes", exact: true })
      .click();
    await page
      .getByRole("alert")
      .filter({ hasText: /at least one active business owner/ })
      .waitFor();
    await page.getByRole("button", { name: "Discard", exact: true }).click();
    await go("personal");
    await mode("Advanced");
    await chooseOption("Appearance", "dark");
    await chooseOption("Financial terminology", "accounting");
    await chooseOption("Transaction date display", "created");
    await save();
    await page.waitForFunction(
      () => document.documentElement.dataset.theme === "dark",
    );
    assert.equal(
      await page.evaluate(() =>
        localStorage.getItem("hisabiq-terminology-mode"),
      ),
      "accounting",
    );
    assert.equal(
      await page.evaluate(() =>
        localStorage.getItem("hisabiq-entry-date-view"),
      ),
      "created",
    );
    await go("data");
    const backup = await read();
    const invalid = { ...backup, tenantId: "t2" };
    await page
      .getByLabel("Restore settings backup", { exact: true })
      .setInputFiles({
        name: "other-business.json",
        mimeType: "application/json",
        buffer: Buffer.from(JSON.stringify(invalid)),
      });
    await page
      .getByRole("alert")
      .filter({ hasText: /another business/ })
      .waitFor();
    const restored = structuredClone(backup);
    restored.sections.invoices.footer = "Restored footer";
    await page
      .getByLabel("Restore settings backup", { exact: true })
      .setInputFiles({
        name: "same-business.json",
        mimeType: "application/json",
        buffer: Buffer.from(JSON.stringify(restored)),
      });
    await page
      .getByRole("dialog", { name: "Review settings restore" })
      .waitFor();
    await page
      .getByRole("button", { name: "Restore settings", exact: true })
      .click();
    await page
      .getByRole("status")
      .filter({ hasText: /Business settings restored/ })
      .waitFor();
    assert.equal((await read()).sections.invoices.footer, "Restored footer");
    await page
      .getByLabel("Product CSV preview", { exact: true })
      .setInputFiles({
        name: "products.csv",
        mimeType: "text/csv",
        buffer: Buffer.from(
          "Name,Category,Unit\nPVC elbow,Hardware,Pcs\nPipe,Plumbing,Ft",
        ),
      });
    await chooseOption("Map Product name", "0");
    await page
      .getByRole("button", { name: "Preview import", exact: true })
      .click();
    await page
      .getByRole("status")
      .filter({ hasText: /2 rows ready for review/ })
      .waitFor();
    await go("business");
    await page
      .getByLabel("Business name", { exact: true })
      .fill("Stale local draft");
    const other = await context.newPage();
    await other.goto(base);
    await other.evaluate(() => {
      const key = "hisabiq-erp-settings-v1:t1";
      const state = JSON.parse(localStorage.getItem(key));
      state.revision++;
      state.sections.business.name = "Other tab shop";
      localStorage.setItem(key, JSON.stringify(state));
    });
    await other.close();
    await page
      .getByRole("button", { name: "Save changes", exact: true })
      .click();
    await page
      .getByRole("alert")
      .filter({ hasText: /changed since you opened/ })
      .waitFor();
    await page.getByRole("button", { name: "Discard", exact: true }).click();
    assert.equal(
      await page.getByLabel("Business name", { exact: true }).inputValue(),
      "Other tab shop",
    );
    await page.evaluate(() => {
      window.__setItem = Storage.prototype.setItem;
      Storage.prototype.setItem = () => {
        throw Error("Test quota");
      };
    });
    await page
      .getByLabel("Business name", { exact: true })
      .fill("In-memory business");
    await save();
    await page
      .getByRole("alert")
      .filter({ hasText: /Changes are in memory only/ })
      .waitFor();
    await page.evaluate(() => (Storage.prototype.setItem = window.__setItem));
    await page.evaluate(() =>
      localStorage.setItem("hisabiq-erp-personal-v1", "{broken"),
    );
    await page.reload();
    await page.getByLabel("Business name", { exact: true }).waitFor();
    assert.equal(
      await page.getByLabel("Business name", { exact: true }).inputValue(),
      "Other tab shop",
      "Invalid personal preferences do not erase valid business settings",
    );
    await page.evaluate(() =>
      localStorage.setItem(
        "hisabiq-erp-settings-v1:t1",
        '{"schema":1,"sections":null}',
      ),
    );
    await page.reload();
    await page
      .getByRole("alert")
      .filter({ hasText: /invalid.*defaults/ })
      .waitFor();
    assert.equal(
      await page.getByLabel("Business name", { exact: true }).inputValue(),
      "Nawabpur Hardware House",
    );
    await page.evaluate(() => {
      localStorage.removeItem("hisabiq-erp-settings-v1:t1");
      localStorage.removeItem("hisabiq-erp-personal-v1");
    });
    await page.reload();
    const axe = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
    let checked = 0;
    const check = async (label) => {
      await page.addScriptTag({ content: axe });
      const failures = await page.evaluate(async () => {
        const audit = await axe.run(document, {
          runOnly: ["color-contrast", "label"],
        });
        return audit.violations.flatMap((v) =>
          v.nodes.map((n) => ({
            rule: v.id,
            target: n.target,
            summary: n.failureSummary,
          })),
        );
      });
      assert.deepEqual(failures, [], `${label}: ${JSON.stringify(failures)}`);
      checked++;
    };
    const sections = [
      "business",
      "sales",
      "products",
      "purchases",
      "money",
      "invoices",
      "team",
      "notifications",
      "personal",
      "data",
    ];
    for (const theme of ["Light", "Dark"]) {
      await page.getByRole("button", { name: /^Appearance:/ }).click();
      await page.getByRole("radio", { name: theme, exact: true }).click();
      await page.waitForFunction(
        (value) => document.documentElement.dataset.theme === value,
        theme.toLowerCase(),
      );
      for (const section of sections) {
        await go(section);
        await page.waitForURL(`**/#/app/settings/${section}`);
        await mode("Simple");
        await check(`${theme} Simple ${section}`);
        await mode("Advanced");
        await check(`${theme} Advanced ${section}`);
      }
      await go("business");
      await page
        .getByLabel("Business name", { exact: true })
        .fill("Unsaved preview");
      await sectionNav("sales").click();
      await page
        .getByRole("dialog", { name: "Discard unsaved changes?" })
        .waitFor();
      await check(`${theme} unsaved dialog`);
      await page
        .getByRole("button", { name: "Keep editing", exact: true })
        .click();
      await page.getByRole("button", { name: "Discard", exact: true }).click();
      await page
        .getByRole("button", { name: "Restore defaults", exact: true })
        .click();
      await check(`${theme} defaults dialog`);
      await page.keyboard.press("Escape");
      await go("team");
      await mode("Advanced");
      await page
        .getByRole("button", { name: "Add demo employee", exact: true })
        .click();
      await check(`${theme} employee dialog`);
      await page.keyboard.press("Escape");
      await page.getByRole("tab", { name: /Roles & permissions/ }).click();
      await page
        .getByRole("button", { name: "Create role", exact: true })
        .click();
      await check(`${theme} role dialog`);
      await page.keyboard.press("Escape");
      await go("products");
      await page.evaluate(() =>
        document.fonts.load('12px "Hind Siliguri"', "বাংলা"),
      );
      await page.screenshot({
        path: `${shotDir}/${theme.toLowerCase()}.png`,
        fullPage: true,
      });
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await go("business");
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
      "No mobile page overflow",
    );
    await check("Mobile business");
    await page.screenshot({ path: `${shotDir}/mobile.png`, fullPage: true });
    await page
      .getByLabel("Business name", { exact: true })
      .fill("Mobile draft");
    await sectionNav("sales").click();
    await page
      .getByRole("dialog", { name: "Discard unsaved changes?" })
      .waitFor();
    await page.keyboard.press("Escape");
    assert.equal(await page.getByRole("dialog").count(), 0);
    assert.equal(
      await page
        .getByRole("tablist", { name: "Settings categories" })
        .getByRole("tab", { name: /^Sales & POS/ })
        .evaluate((el) => el === document.activeElement),
      true,
      "Escape restores focus to the navigation trigger",
    );
    assert.deepEqual(errors, []);
    console.log(
      `PASS ${checked} rendered settings states in Light/Dark, labels and mobile; persistence, combined roles, owner guard, product defaults, POS units/payments, restore, import preview, stale tabs and storage recovery.`,
    );
  } catch (error) {
    console.error("Page errors:", errors);
    console.error((await page.locator("body").innerText()).slice(-4500));
    await page.screenshot({ path: `${shotDir}/failure.png`, fullPage: true });
    throw error;
  } finally {
    await browser.close();
    await server.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
