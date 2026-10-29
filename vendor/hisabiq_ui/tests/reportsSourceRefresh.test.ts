import test from "node:test";
import assert from "node:assert/strict";
import * as store from "../src/data/erpDemoStore.ts";
import { products } from "../src/data/products.ts";
import {
  makePurchaseLine,
  baseQty,
  baseCost,
  lineAmount,
} from "../src/utils/purchaseCart.ts";
import { validatePurchaseSource } from "../src/utils/purchaseSource.ts";
import type { Purchase } from "../src/types/erp.ts";
const product = {
  ...products[0],
  unit: "Feet",
  altUnit: undefined,
  unitRelations: [
    { leftUnit: "CT", quantity: 12, rightUnit: "BOX" },
    { leftUnit: "BOX", quantity: 20, rightUnit: "PCS" },
    { leftUnit: "PCS", quantity: 120, rightUnit: "Feet" },
  ],
};
const line = {
  ...makePurchaseLine(product),
  unitQuantities: { CT: "1", BOX: "2", PCS: "3", Feet: "0.25" },
  cost: "2400",
  costUnit: "BOX",
};
const purchase: Purchase = {
  id: "refresh-test",
  ref: "PUR-REFRESH",
  date: "10 Oct 2026",
  businessDate: "2026-10-10",
  supplierId: "supplier",
  supplier: "Supplier",
  items: "Product",
  total: lineAmount(line),
  paid: 0,
  payments: [],
  roundingRule: "No rounding",
  cartSnapshot: [line],
  inventoryLines: [
    {
      productId: product.id,
      quantity: baseQty(line),
      unitCost: baseCost(line),
    },
  ],
};
test("full frozen purchase chain accepts intermediate cost unit and fractional stock quantity", () => {
  assert.doesNotThrow(() => validatePurchaseSource(purchase));
  for (const patch of [
    { costUnit: "unknown" },
    { unitQuantities: { UNKNOWN: "1" } },
    { unitQuantities: { BOX: "-1" } },
    {
      product: {
        ...product,
        unitRelations: [{ leftUnit: "BOX", quantity: 20, rightUnit: "BOX" }],
      },
    },
  ])
    assert.throws(() =>
      validatePurchaseSource({
        ...purchase,
        cartSnapshot: [{ ...line, ...patch }],
      }),
    );
});
test("purchase publication is observable once, idempotent and includes stock evidence", () => {
  assert.equal(typeof store.subscribePurchasesPreview, "function");
  const seen: number[] = [];
  const stop = store.subscribePurchasesPreview(() =>
    seen.push(store.getPurchasesPreviewRevision()),
  );
  store.createPreviewPurchase(purchase);
  store.createPreviewPurchase(purchase);
  assert.equal(seen.length, 1);
  const moves = store
    .availableStockMovements()
    .filter((m) => m.reference === purchase.ref);
  assert.equal(moves.length, 1);
  assert.equal(moves[0].quantity, baseQty(line));
  const saved = store.availablePurchases().find((p) => p.id === purchase.id)!;
  assert.equal(saved.cartSnapshot![0].costUnit, "BOX");
  stop();
});
