import test from "node:test";
import assert from "node:assert/strict";
import {
  moduleViewCatalog,
  resolveModuleColumns,
  validModuleViews,
} from "../src/settings/moduleViews.ts";
test("personal module choices override business defaults while essential identity/totals remain", () => {
  const d = resolveModuleColumns(
    "sales",
    { items: true, profit: true },
    { items: false, profit: false },
    { profit: true, invoice: false, total: false },
  );
  assert.equal(d.items, false);
  assert.equal(d.profit, true);
  assert.equal(d.invoice, true);
  assert.equal(d.total, true);
  assert.equal(
    validModuleViews({ sales: { profit: "yes" }, products: {} }),
    false,
  );
});
test("incomplete imported module preferences cannot crash a consuming table", () => {
  assert.equal(validModuleViews({}), false);
  assert.equal(validModuleViews({ sales: {} }), false);
});

test("existing browser preference keys retain their source identities", () => {
  assert.equal(moduleViewCatalog.sales.key, "hisabiq-sales-visible-columns");
  assert.equal(
    moduleViewCatalog.products.key,
    "hisabiq-products-visible-columns",
  );
});
