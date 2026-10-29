import test from "node:test";
import assert from "node:assert/strict";
import { accountFinancialContext } from "../src/financial-display/model.ts";
test("cash presets never apply to revenue, liabilities or noncash assets", () => {
  for (const id of ["asset-cash", "asset-bank", "asset-mfs"])
    assert.equal(accountFinancialContext(id), "Cash & bank");
  assert.equal(accountFinancialContext("asset-ar"), "Customer");
  assert.equal(accountFinancialContext("liability-ap"), "Supplier");
  assert.equal(accountFinancialContext("liability-loan"), "Lender");
  assert.equal(accountFinancialContext("equity-capital"), "Owner");
  for (const id of [
    "income-sales",
    "asset-inventory",
    "expense-rent",
    "unknown",
  ])
    assert.equal(accountFinancialContext(id), "Reports");
});
