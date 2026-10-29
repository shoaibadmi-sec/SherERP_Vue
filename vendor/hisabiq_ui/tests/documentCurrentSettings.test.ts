import test from "node:test";
import assert from "node:assert/strict";
import { defaults } from "../src/settings/model.ts";
import {
  publishPreviewSettings,
  readPreviewSettings,
} from "../src/documents/previewSettings.ts";
import { invoiceReceipt } from "../src/utils/salesDocuments.ts";
import { salesInvoices } from "../src/data/sales.ts";
test("document consumers use canonical in-memory settings even when browser storage is unavailable", () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      localStorage: {
        getItem() {
          throw Error("Storage unavailable");
        },
      },
    },
  });
  try {
    const state = defaults();
    state.sections.invoices.design!.paper = "58 mm";
    state.sections.business.name = "Memory shop";
    publishPreviewSettings(state);
    assert.equal(readPreviewSettings()?.sections.business.name, "Memory shop");
    assert.equal(
      invoiceReceipt(salesInvoices[0]).branding?.design?.paper,
      "58 mm",
    );
  } finally {
    publishPreviewSettings(undefined);
    if (original) Object.defineProperty(globalThis, "window", original);
    else Reflect.deleteProperty(globalThis, "window");
  }
});
