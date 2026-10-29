/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires -- Playwright CLI uses CommonJS. */
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
async function main() {
  const { createServer } = await import("vite");
  const server = await createServer({
    server: { host: "127.0.0.1", port: 4291, strictPort: true },
  });
  await server.listen();
  let browser;
  try {
    browser = await chromium.launch({
      executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || undefined,
      args: ["--no-sandbox"],
    });
    const page = await browser.newPage({
      viewport: { width: 800, height: 1000 },
      reducedMotion: "reduce",
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("http://127.0.0.1:4291/#/app/settings/business");
    await page
      .getByRole("heading", { level: 1, name: "Business profile", exact: true })
      .waitFor();
    assert.equal(
      await page
        .getByRole("combobox", { name: "Settings section", exact: true })
        .count(),
      0,
    );
    assert.equal(
      await page
        .getByText("Browse all settings · সব সেটিংস", { exact: true })
        .count(),
      0,
    );
    const header = page.locator(".erp-settings > header");
    assert.equal(await header.getByRole("searchbox", { name: "Search settings", exact: true }).count(), 1, "Global Settings search is in the annotated header position");
    assert.equal(await page.locator("[data-settings-subpanel]").getByRole("searchbox", { name: "Search settings", exact: true }).count(), 0, "Position 2 contains no duplicate global search");
    const main = page.locator('[data-settings-navigation="sections"] [aria-label="Settings categories"]');
    const navigateSection = (section) => page.locator(`[data-settings-directory] a[href$="/app/settings/${section}"]:visible, [data-settings-section="${section}"]:visible`).first().click();
    const sub = page.getByRole("tablist", {
      name: "Business profile sub-settings",
      exact: true,
    });
    const search = header.getByRole("searchbox", { name: "Search settings", exact: true });
    await search.fill("logo");
    const searchResults = header.getByRole("region", { name: "Settings search results" });
    await searchResults.waitFor();
    await page.keyboard.press("Tab");
    assert.equal(await header.getByRole("button", { name: "Clear Search settings", exact: true }).evaluate(el => el === document.activeElement), true, "Shared quick-clear action stays keyboard accessible");
    await page.keyboard.press("Tab");
    assert.equal(await searchResults.getByRole("button").first().evaluate(el => el === document.activeElement), true, "Tab reaches header search results");
    await page.keyboard.press("Escape");
    assert.equal(await search.inputValue(), "");
    assert.equal(await search.evaluate(el => el === document.activeElement), true, "Escape returns focus to header search");
    await search.fill("logo");
    await header.getByRole("combobox", { name: "Demo employee access" }).focus();
    assert.equal(await searchResults.count(), 0, "Outside focus closes header results");
    const scrollLeft = page.getByRole("button", { name: "Scroll Settings categories left", exact: true });
    const scrollRight = page.getByRole("button", { name: "Scroll Settings categories right", exact: true });
    await scrollRight.waitFor({ timeout: 5000 });
    assert.equal(await scrollLeft.isDisabled(), true, "First tab boundary disables left control");
    await page
      .getByLabel("Business name", { exact: true })
      .fill("Responsive draft shop");
    await scrollRight.click();
    await page.waitForFunction(() => document.querySelector('[data-settings-navigation="sections"]').scrollLeft > 0);
    assert.equal(await main.getByRole("tab", { name: /Business profile/ }).getAttribute("aria-selected"), "true", "Scrolling does not activate another category");
    assert.equal(await page.getByRole("dialog", { name: "Discard unsaved changes?" }).count(), 0, "Tab scrolling does not trigger draft guard");
    const waitForScrollControls = () => page.waitForFunction(() => {
      const viewport = document.querySelector('[data-settings-navigation="sections"]');
      const row = viewport.parentElement;
      const [left, right] = row.querySelectorAll(':scope > button[aria-controls]');
      return left.disabled === (viewport.scrollLeft <= 1) && right.disabled === (viewport.scrollLeft + viewport.clientWidth >= viewport.scrollWidth - 1);
    });
    await waitForScrollControls();
    for (let i = 0; i < 20 && !(await scrollRight.isDisabled()); i++) {
      await scrollRight.click();
      await waitForScrollControls();
    }
    assert.equal(await scrollRight.isDisabled(), true, "Last tab boundary disables right control");
    for (let i = 0; i < 20 && !(await scrollLeft.isDisabled()); i++) {
      await scrollLeft.click();
      await waitForScrollControls();
    }
    assert.equal(await scrollLeft.isDisabled(), true);
    for (const width of [320, 767, 768, 799, 800, 1023, 1024, 1280, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.waitForFunction(
        () => document.querySelector('[aria-label="Business profile sub-settings"]').getAttribute("aria-orientation") === "horizontal",
      );
      assert.equal(await main.getAttribute("aria-orientation"), "horizontal");
      assert.equal(
        await page.getByLabel("Business name", { exact: true }).inputValue(),
        "Responsive draft shop",
      );
      await page.waitForFunction(desktop => {
        if (desktop) return !!document.querySelector('[data-settings-directory] [role="tab"][aria-selected="true"]');
        const nav = document.querySelector('[data-settings-navigation="sections"]');
        const tab = nav.querySelector('[aria-selected="true"]');
        const a = nav.getBoundingClientRect(), b = tab.getBoundingClientRect();
        return b.left >= a.left - 1 && b.right <= a.right + 1;
      }, width >= 1024);
      const geometry = await page.evaluate(() => {
        const nav = document.querySelector(
            '[data-settings-navigation="subsections"]',
          ),
          panel = document.querySelector("[data-settings-subpanel]");
        const a = nav.getBoundingClientRect(),
          b = panel.getBoundingClientRect();
        const inputs = [
          ...document.querySelectorAll(
            "[data-settings-subpanel] [data-field-key] input",
          ),
        ]
          .filter((el) => el.getClientRects().length)
          .map((el) => el.getBoundingClientRect());
        const main = document.querySelector(
            '[data-settings-navigation="sections"]',
          ),
          selected = main.querySelector('[aria-selected="true"]');
        const mainBox = main.getBoundingClientRect(),
          selectedBox = selected.getBoundingClientRect();
        return {
          selectedVisible: mainBox.width > 0
            ? selectedBox.left >= mainBox.left - 1 && selectedBox.right <= mainBox.right + 1
            : !!document.querySelector('[data-settings-directory] [role="tab"][aria-selected="true"]'),
          overflow: document.documentElement.scrollWidth > innerWidth + 1,
          left: a.right <= b.left + 1,
          above: a.bottom <= b.top + 1,
          fieldColumns:
            inputs.length > 1 && inputs[1].left > inputs[0].left + 20,
          fieldRoom: document
            .querySelector('[data-field-key="name"]')
            .parentElement.getBoundingClientRect().width,
        };
      });
      assert.equal(await header.getByRole("searchbox", { name: "Search settings", exact: true }).count(), 1, width + " keeps search in header");
      assert.equal(await page.locator('[data-settings-directory]').isVisible(), width >= 1024, width + ' uses the contextual Settings sidebar only on laptop/desktop');
      if (width >= 1024) assert.equal(await page.locator('[data-settings-directory] nav[aria-label="Settings categories"]').isVisible(), true, "Embedded Party directory replaces a second app sidebar");
      assert.equal(geometry.overflow, false, width + " page fits");
      assert.equal(
        geometry.selectedVisible,
        true,
        width + " selected main tab stays visible",
      );
      assert.equal(
        geometry.above,
        true,
        width + " uses Party workspace bands",
      );
      assert.equal(
        geometry.fieldColumns,
        width >= 768 && geometry.fieldRoom >= 504,
        width + " form keeps readable columns within Party workspace bands",
      );
    }
    await page.setViewportSize({ width: 800, height: 1000 });
    await sub.getByRole("tab", { name: /General/ }).focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Enter");
    await page.getByLabel("Phone number", { exact: true }).fill("01711000245");
    await page.setViewportSize({ width: 1024, height: 1000 });
    await sub.getByRole("tab", { name: /Contact & address/ }).focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Enter");
    await page.getByLabel("Business logo", { exact: true }).waitFor();
    await sub.getByRole("tab", { name: /General/ }).click();
    assert.equal(
      await page.getByLabel("Business name", { exact: true }).inputValue(),
      "Responsive draft shop",
    );
    await navigateSection('sales');
    const leave = page.getByRole("dialog", {
      name: "Discard unsaved changes?",
    });
    await leave.waitFor();
    await leave
      .getByRole("button", { name: "Keep editing", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Save changes", exact: true })
      .click();
    await page
      .getByRole("status")
      .filter({ hasText: "Business settings saved." })
      .waitFor();
    await page.reload();
    assert.equal(
      await page.getByLabel("Business name", { exact: true }).inputValue(),
      "Responsive draft shop",
    );
    await sub.getByRole("tab", { name: /Contact & address/ }).click();
    assert.equal(
      await page.getByLabel("Phone number", { exact: true }).inputValue(),
      "01711000245",
    );
    await page
      .getByRole("searchbox", { name: "Search settings", exact: true })
      .fill("logo");
    await page
      .getByRole("region", { name: "Settings search results" })
      .getByRole("button", { name: /Business logo/ })
      .click();
    await page.getByLabel("Business logo", { exact: true }).waitFor();
    assert.equal(
      await sub
        .getByRole("tab", { name: /Logo & branding/ })
        .getAttribute("aria-selected"),
      "true",
    );
    const reviewFailures = [];
    await page.setViewportSize({ width: 768, height: 1000 });
    await main.locator('[data-settings-section="personal"]').focus();
    await page.keyboard.press("Enter");
    await page.waitForURL("**/settings/personal");
    if (
      (await page.evaluate(() =>
        document.activeElement?.getAttribute("data-settings-section"),
      )) !== "personal"
    )
      reviewFailures.push("Main tab activation must preserve keyboard focus");
    const chooseLanguage = async (value) => {
      await page
        .getByRole("combobox", { name: "Language", exact: true })
        .click();
      await page.locator(`[role=option][data-value="${value}"]`).click();
      await page
        .getByRole("button", { name: "Save changes", exact: true })
        .click();
      await page
        .getByRole("status")
        .filter({ hasText: /preferences saved/ })
        .waitFor();
    };
    await chooseLanguage("English");
    await chooseLanguage("English + Bangla");
    await page.waitForFunction(() =>
      document
        .querySelector('[data-settings-navigation="sections"] [data-settings-section="personal"]')
        .textContent.includes("আমার পছন্দ"),
    );
    if (
      !(await page.evaluate(() => {
        const nav = document.querySelector(
            '[data-settings-navigation="sections"]',
          ),
          tab = nav.querySelector('[aria-selected="true"]');
        const a = nav.getBoundingClientRect(),
          b = tab.getBoundingClientRect();
        return b.left >= a.left - 1 && b.right <= a.right + 1;
      }))
    )
      reviewFailures.push(
        "Language changes must keep the selected tab visible",
      );
    await main.locator('[data-settings-section="business"]').click();
    await page
      .getByLabel("Business name", { exact: true })
      .fill("Deferred focus draft");
    await main.locator('[data-settings-section="sales"]').focus();
    await page.keyboard.press("Enter");
    await page
      .getByRole("dialog", { name: "Discard unsaved changes?" })
      .getByRole("button", { name: "Discard and continue", exact: true })
      .click();
    await page.waitForURL("**/settings/sales");
    if (
      (await page.evaluate(() =>
        document.activeElement?.getAttribute("data-settings-section"),
      )) !== "sales"
    )
      reviewFailures.push(
        "Deferred main-tab activation must preserve keyboard focus",
      );
    assert.deepEqual(reviewFailures, []);
    fs.mkdirSync(".superpowers/sdd/final-settings/responsive", {
      recursive: true,
    });
    for (const section of ["business", "invoices", "team"]) {
      await navigateSection(section);
      await page.getByTestId("settings-title").waitFor();
      for (const width of [390, 768, 1024, 1440]) {
        await page.setViewportSize({ width, height: 1000 });
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth + 1,
          ),
          false,
        );
        await page.waitForFunction(() => [...document.querySelectorAll('[data-settings-navigation]')].every(viewport => {
          const row = viewport.parentElement;
          const horizontal = viewport.querySelector('[role=tablist]').getAttribute('aria-orientation') === 'horizontal';
          const expected = horizontal && viewport.scrollWidth > row.clientWidth + 1;
          return row.querySelectorAll(':scope > button[aria-controls]').length === (expected ? 2 : 0);
        }));
        await page.screenshot({
          path: `.superpowers/sdd/final-settings/responsive/${section}-${width}.png`,
          fullPage: true,
        });
        if (section === "business") {
          await search.fill("logo");
          await searchResults.waitFor();
          assert.equal(await searchResults.evaluate(el => {
            const result = el.getBoundingClientRect();
            const input = el.parentElement.querySelector('input').getBoundingClientRect();
            return result.left >= 0 && result.right <= innerWidth && result.top >= input.bottom;
          }), true, width + " search dropdown stays below the header input and within the viewport");
          await page.screenshot({ path: `.superpowers/sdd/final-settings/responsive/header-search-${width}.png`, fullPage: true });
          await page.keyboard.press("Escape");
        }
      }
    }
    await navigateSection('personal');
    await chooseLanguage("Bangla");
    await page.emulateMedia({ reducedMotion: "no-preference" });
    for (const dark of [false, true]) {
      await page.evaluate(dark => document.documentElement.classList.toggle("dark", dark), dark);
      for (const width of [320, 768, 1440]) {
        await page.setViewportSize({ width, height: 1000 });
        if (width >= 1024) await page.locator('[data-settings-directory] [role="tab"][aria-selected="true"]').waitFor();
        else await page.getByRole("button", { name: "আগের সেটিং বিভাগ দেখুন", exact: true }).waitFor();
        assert.equal(await search.getAttribute("placeholder"), "সেটিং খুঁজুন…");
        await search.fill("logo");
        await searchResults.waitFor();
        assert.equal(await searchResults.evaluate(el => {
          const box = el.getBoundingClientRect();
          return box.left >= 0 && box.right <= innerWidth && document.documentElement.scrollWidth <= innerWidth + 1;
        }), true, `Bangla ${width} ${dark ? 'dark' : 'light'} header search fits`);
        await page.screenshot({ path: `.superpowers/sdd/final-settings/responsive/header-bangla-${dark ? 'dark' : 'light'}-${width}.png`, fullPage: true });
        await page.keyboard.press("Escape");
      }
    }
    assert.deepEqual(errors, []);
    console.log(
      "Party-aligned Settings: 768/1024 boundaries, 799/800 parity, header search/dropdown, overflow scroll controls, keyboard, draft/save/search and 22 responsive screens passed.",
    );
  } finally {
    await browser?.close();
    await server.close();
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
