const { chromium } = require("playwright");
const assert = require("node:assert/strict");
async function main() {
  const { createServer } = await import("vite");
  const server = await createServer({
    server: { host: "127.0.0.1", port: 4239, strictPort: true },
  });
  await server.listen();
  let browser;
  try {
    browser = await chromium.launch({
      executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || undefined,
      args: ["--no-sandbox"],
    });
    const page = await browser.newPage({
      viewport: { width: 1365, height: 860 },
      reducedMotion: "reduce",
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const base = "http://127.0.0.1:4239/#";
    const section = async (value) => {
      await page.locator(`[data-settings-section="${value}"]`).click();
    };
    await page.goto(base + "/app/settings/business");
    await page.getByTestId("settings-title").waitFor();
    assert.equal(
      await page.getByRole("region", { name: "Settings shortcuts" }).count(),
      0,
      "Repeated shortcut hub was removed",
    );
    const categories = page.getByRole("tablist", {
      name: "Settings categories",
    });
    for (const label of [
      "Business profile",
      "Employees & access",
      "Notifications",
      "Data & activity",
      "My preferences",
      "Account & security",
      "Names & Khata",
      "Invoices & printing",
    ]) {
      assert.equal(
        await categories
          .getByRole("tab", {
            name: new RegExp(
              "^" + label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
            ),
          })
          .count(),
        1,
      );
    }
    await page
      .getByLabel("Business name", { exact: true })
      .fill("Unsaved Navigation Shop");
    await section("notifications");
    const confirm = page.getByRole("dialog", {
      name: "Discard unsaved changes?",
    });
    await confirm.waitFor();
    assert.match(page.url(), /settings\/business/);
    await confirm.getByRole("button", { name: "Keep editing" }).click();
    assert.equal(
      await page.getByLabel("Business name", { exact: true }).inputValue(),
      "Unsaved Navigation Shop",
    );
    await section("notifications");
    await confirm.getByRole("button", { name: "Discard and continue" }).click();
    assert.match(page.url(), /settings\/notifications/);
    await section("data");
    await page
      .getByRole("heading", { name: "Recycle Bin · রিসাইকেল বিন", exact: true })
      .waitFor();
    await page.goto(base + "/app/settings/business");
    await page
      .getByRole("link", { name: /Subscription/ })
      .last()
      .click();
    assert.match(
      page.url(),
      /app\/subscription/,
      "Billing stays in tenant portal",
    );
    await page.goto(base + "/app/settings/business");
    await page.setViewportSize({ width: 375, height: 812 });
    await section("personal");
    assert.match(page.url(), /settings\/personal/);
    await section("security");
    await page.getByTestId("account-security-settings").waitFor();
    assert.equal(
      await page.getByRole("button", { name: "Save changes" }).count(),
      0,
    );
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    assert.deepEqual(errors, []);
    console.log(
      "Underline Settings navigation, selected heading, draft guard, data, billing and mobile preferences/security passed.",
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
