import test from "node:test";
import assert from "node:assert/strict";
import {
  financialDefaults,
  resolveFinancialText,
  applyFinancialPreset,
  financialPreview,
} from "../src/financial-display/model.ts";
test("shared financial copy changes only whole semantic labels in the selected context", () => {
  const d = financialDefaults();
  d.contexts["Cash & bank"].terms.moneyIn.en = "Money deposited";
  assert.equal(
    resolveFinancialText(d, "Cash & bank", "Money in", "জমা", "English"),
    "Money deposited",
  );
  assert.equal(
    resolveFinancialText(d, "Customer", "Money in", "টাকা এসেছে", "English"),
    "Money in",
  );
  assert.equal(
    resolveFinancialText(
      d,
      "Cash & bank",
      "Money in transit",
      "পথে টাকা",
      "English",
    ),
    "Money in transit",
  );
  assert.equal(
    resolveFinancialText(d, "Cash & bank", "Debit", "ডেবিট", "English"),
    "Debit",
  );
});

test("cash movement preset preserves cash debit as money in and credit as money out", () => {
  const p = applyFinancialPreset(
    financialDefaults().contexts["Cash & bank"],
    "Money movement",
    "Cash & bank",
  );
  assert.equal(p.terms.debit.en, "Money in");
  assert.equal(p.terms.credit.en, "Money out");
  assert.equal(p.order, "debit-first");
  assert.throws(
    () =>
      applyFinancialPreset(
        financialDefaults().contexts.Customer,
        "Money movement",
        "Customer",
      ),
    /cash/i,
  );
});
test("context previews distinguish cash, customer receivable and supplier payable", () => {
  assert.deepEqual(
    financialPreview("Customer").rows.map((r) => [r.debit, r.credit]),
    [
      [1250, 0],
      [0, 430],
    ],
  );
  assert.deepEqual(
    financialPreview("Cash & bank").rows.map((r) => [r.debit, r.credit]),
    [
      [1250, 0],
      [0, 430],
    ],
  );
  assert.deepEqual(
    financialPreview("Supplier").rows.map((r) => [r.debit, r.credit]),
    [
      [0, 1250],
      [430, 0],
    ],
  );
  assert.match(financialPreview("Supplier").balanceLabel, /payable/);
});
test("receivable/payable labels reach exact relationship captions without replacing user descriptions", () => {
  const d = financialDefaults();
  d.contexts.Customer.terms.receivable.en = "Collect from customer";
  d.contexts.Supplier.terms.payable.en = "Pay supplier";
  for (const key of ["Receivable", "Customer receivable"])
    assert.equal(
      resolveFinancialText(d, "Customer", key, "পাওনা", "English"),
      "Collect from customer",
    );
  assert.equal(
    resolveFinancialText(d, "Supplier", "Supplier payable", "দেনা", "English"),
    "Pay supplier",
  );
  assert.equal(
    resolveFinancialText(
      d,
      "Customer",
      "Customer receivable adjustment for Rahim",
      "বিবরণ",
      "English",
    ),
    "Customer receivable adjustment for Rahim",
  );
});
