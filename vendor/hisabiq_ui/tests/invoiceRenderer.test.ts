import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "vite";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { invoiceDesignDefaults } from "../src/documents/profile.ts";
test("designed invoice preserves payment accounts, change, warranty terms and price-free package contents", async () => {
  const server = await createServer({ server: { middlewareMode: true } });
  try {
    const { ReceiptPreview } = await server.ssrLoadModule(
      "/src/components/brand/ReceiptPreview.tsx",
    );
    const html = renderToStaticMarkup(
      createElement(ReceiptPreview, {
        invoice: "INV-DOC",
        lines: [
          {
            name: "Package",
            qty: "1 Set",
            price: 100,
            total: 100,
            warranty: {
              duration: 12,
              durationUnit: "Months",
              type: "Replacement",
              terms: "Terms preserved",
            },
            bundleSnapshot: {
              bundleRevision: 1,
              components: [
                {
                  name: "Included bulb",
                  totalBaseQty: 2,
                  unit: "Pcs",
                  unitCost: 9876,
                },
              ],
            },
          },
        ],
        subtotal: 100,
        discount: 0,
        rounding: 0,
        total: 100,
        paid: 100,
        due: 0,
        method: "Bank",
        payments: [
          { method: "Bank", account: "Bank account 123", amount: 120 },
        ],
        change: 20,
        branding: {
          name: "Shop",
          nameBn: "দোকান",
          logo: "",
          address: "",
          phone: "",
          showLogo: false,
          footer: "",
          design: { ...invoiceDesignDefaults(), language: "English" },
        },
      }),
    );
    for (const text of [
      "Bank account 123",
      "Change returned",
      "Terms preserved",
      "Included bulb",
      "2 Pcs",
    ])
      assert.ok(html.includes(text), text + " survives designed output");
    assert.ok(
      !html.includes("9876"),
      "internal component cost is never rendered",
    );
  } finally {
    await server.close();
  }
});
