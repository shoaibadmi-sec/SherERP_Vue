import test from "node:test";
import assert from "node:assert/strict";
import * as screens from "../src/reports/screens.ts";
import {
  buildReportData,
  defaultReportFilters,
  runReport,
} from "../src/reports/model.ts";
import { reportColumns } from "../src/reports/catalog.ts";
import { products } from "../src/data/products.ts";
import {
  baseQty,
  baseCost,
  lineAmount,
  makePurchaseLine,
} from "../src/utils/purchaseCart.ts";
import { validatePurchaseSource } from "../src/utils/purchaseSource.ts";

test("an analysis destination owns its report definition even when an incompatible report is supplied", () => {
  assert.equal(typeof screens.reportKeyForScreen, "function");
  assert.equal(screens.reportKeyForScreen("overview", "purchases"), "overview");
  assert.equal(screens.reportKeyForScreen("stock", "receivables"), "stock");
  assert.equal(screens.reportKeyForScreen("library", "purchases"), "purchases");
});
test("expense evidence is explicitly scoped to all accounts when a cash account is selected", () => {
  assert.equal(typeof screens.filtersForAnalysisReport, "function");
  const f = { ...defaultReportFilters, account: "Cash", search: "Rent" };
  assert.equal(screens.filtersForAnalysisReport("expenses", f).account, "");
  assert.equal(
    screens.filtersForAnalysisReport("expense-categories", f).account,
    "",
  );
  assert.equal(
    screens.filtersForAnalysisReport("cash-book", f).account,
    "Cash",
  );
  assert.equal(screens.filtersForAnalysisReport("expenses", f).search, "Rent");
  assert.equal(
    screens.filtersForAnalysisReport(
      "expenses",
      { ...f, category: "Hardware" },
      "profit",
    ).category,
    "",
  );
  assert.equal(
    screens.filtersForAnalysisReport(
      "sales-returns",
      { ...f, product: "p" },
      "sales",
    ).product,
    "",
  );
});
test("frozen purchase stock unit must be the terminal unit of its conversion chain", () => {
  const product = {
    ...products[0],
    unit: "PCS",
    altUnit: undefined,
    unitRelations: [
      { leftUnit: "BOX", quantity: 20, rightUnit: "PCS" },
      { leftUnit: "PCS", quantity: 120, rightUnit: "Feet" },
    ],
  };
  const line = {
    ...makePurchaseLine(product),
    unitQuantities: { PCS: "1", Feet: "1" },
    costUnit: "PCS",
    cost: "10",
  };
  const source = {
    id: "invalid-base",
    ref: "PUR-BASE",
    date: "10 Oct 2026",
    businessDate: "2026-10-10",
    supplierId: "s",
    supplier: "Supplier",
    items: "Product",
    total: lineAmount(line),
    paid: 0,
    payments: [],
    roundingRule: "No rounding" as const,
    cartSnapshot: [line],
    inventoryLines: [
      {
        productId: product.id,
        quantity: baseQty(line),
        unitCost: baseCost(line),
      },
    ],
  };
  assert.throws(
    () => validatePurchaseSource(source),
    /stock unit|terminal|smallest/i,
  );
});
test("expiry evidence labels signed days until expiry rather than stock age", () => {
  const product = { ...products[0], stock: 1 };
  const data = buildReportData({
    asOf: "2026-10-26",
    products: [product],
    invoices: [],
    returns: [],
    purchases: [],
    expenses: [],
    transactions: [],
    movements: [],
    warranty: [],
    lots: [
      {
        id: "lot",
        productId: product.id,
        label: "Batch",
        receivedAt: "2026-10-01",
        quantity: 1,
        available: 1,
        unitCost: 10,
        source: "Purchase",
        expiryDate: "2026-10-24",
      },
    ],
  });
  assert.equal(
    runReport("expiry", data, defaultReportFilters).rows[0].values.expiryDays,
    -2,
  );
  assert.equal(reportColumns.expiryDays.en, "Days until expiry");
  assert.equal(reportColumns.scenarioInflow.en, "Cumulative money in");
  assert.equal(reportColumns.scenarioOutflow.en, "Cumulative money out");
  assert.equal(reportColumns.scenarioBalance.en, "Modeled closing balance");
});

test("invalid and unavailable report overrides cannot replace an analysis screen, including saved views", async () => {
  const { parsePreferences, paramsForReportScreen } =
    await import("../src/reports/preferences.ts");
  assert.equal(
    screens.reportKeyForScreen("buying", "balance-sheet"),
    "reorder",
  );
  assert.equal(screens.reportKeyForScreen("overview", "unknown"), "overview");
  const saved = parsePreferences(
    JSON.stringify({
      views: [
        {
          id: "x",
          name: "X",
          screen: "overview",
          report: "purchases",
          filters: defaultReportFilters,
          columns: ["label", "amount"],
        },
      ],
    }),
  );
  assert.equal(saved.views[0].report, "overview");
  assert.equal(
    paramsForReportScreen(
      "overview",
      "purchases",
      defaultReportFilters,
      [],
    ).get("report"),
    "overview",
  );
});
