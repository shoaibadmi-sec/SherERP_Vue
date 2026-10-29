import test from "node:test";
import assert from "node:assert/strict";
import * as preferences from "../src/reports/preferences.ts";
import { defaultReportFilters } from "../src/reports/model.ts";
import { reportCatalog } from "../src/reports/catalog.ts";

test("all eleven Reports destinations have stable URL state", () => {
  assert.equal(typeof preferences.reportScreenFromParams, "function");
  for (const screen of [
    "overview",
    "sales",
    "stock",
    "dues",
    "money",
    "advisor",
    "profit",
    "buying",
    "cashflow",
    "customers",
    "library",
  ]) {
    const p = preferences.paramsForReportScreen(
      screen as never,
      "product-sales",
      { ...defaultReportFilters, search: "পাইপ", compare: "previous" },
      ["label", "amount"],
    );
    assert.equal(preferences.reportScreenFromParams(p), screen);
    assert.equal(preferences.filtersFromParams(p).search, "পাইপ");
    assert.equal(p.get("compare"), "previous");
  }
});
test("legacy report links preserve every catalog destination", () => {
  assert.equal(typeof preferences.reportScreenFromParams, "function");
  for (const report of reportCatalog) {
    assert.equal(
      preferences.reportScreenFromParams(
        new URLSearchParams({ report: report.id }),
      ),
      report.id === "overview" ? "overview" : "library",
    );
  }
  assert.equal(
    preferences.reportScreenFromParams(new URLSearchParams()),
    "overview",
  );
  assert.equal(
    preferences.reportScreenFromParams(
      new URLSearchParams({ screen: "bad", report: "bad" }),
    ),
    "overview",
  );
});
test("saved views keep the analysis screen and required label column, capped at twenty", () => {
  const view = {
    id: "one",
    name: "My sales",
    screen: "sales",
    report: "product-sales",
    filters: defaultReportFilters,
    columns: ["amount"],
  };
  const parsed = preferences.parsePreferences(
    JSON.stringify({
      views: Array.from({ length: 25 }, (_, i) => ({ ...view, id: String(i) })),
    }),
  );
  assert.equal(parsed.views.length, 20);
  assert.equal(parsed.views[0].screen, "sales");
  assert.ok(parsed.views[0].columns.includes("label"));
});
