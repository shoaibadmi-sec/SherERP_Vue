import test from "node:test";
import assert from "node:assert/strict";
import { reportHtml } from "../src/utils/reportOutput.ts";
import { outputProfileDefaults } from "../src/documents/outputProfile.ts";
test("report profile changes actual page orientation, safe branding and language without changing rows", () => {
  const report = {
    title: "Stock statement",
    headers: ["Quantity", "Total"],
    rows: [[4, 2000]],
    profile: {
      ...outputProfileDefaults("report"),
      orientation: "Portrait" as const,
      language: "Bangla" as const,
      margin: 18,
      footer: "<script>unsafe()</script>",
    },
    businessName: "Business <name>",
  };
  const html = reportHtml(report);
  assert.match(html, /A4 portrait/);
  assert.match(html, /margin:18mm/);
  assert.match(html, /lang="bn"/);
  assert.match(html, /Business &lt;name&gt;/);
  assert(!html.includes("<script>"));
  assert.deepEqual(report.rows, [[4, 2000]]);
});
