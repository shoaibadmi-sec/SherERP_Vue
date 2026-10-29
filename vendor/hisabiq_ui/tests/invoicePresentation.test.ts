import test from "node:test";
import assert from "node:assert/strict";
import { salesInvoices } from "../src/data/sales.ts";
import { defaults } from "../src/settings/model.ts";
import { reviseInvoicePresentation } from "../src/documents/reviseInvoice.ts";
test("invoice display revision preserves financial source, original snapshot and audit", () => {
  const invoice = structuredClone(salesInvoices[0]);
  const original = JSON.stringify(invoice);
  const next = reviseInvoicePresentation(
    invoice,
    { customerName: "Display only", note: "Deliver Friday" },
    defaults(),
    "mahmud",
    "2026-10-27T12:00:00Z",
  );
  assert.equal(next.party, invoice.party);
  assert.deepEqual(next.lines, invoice.lines);
  assert.equal(next.total, 25550);
  assert.equal(next.documentSnapshot?.customer, "Display only");
  assert.equal(next.documentHistory?.length, 1);
  assert.equal(next.presentationAudit?.[0].actor, "mahmud");
  assert.equal(JSON.stringify(invoice), original);
  assert.throws(
    () =>
      reviseInvoicePresentation(
        invoice,
        { customerName: "Other" },
        defaults(),
        "rafiq",
        "2026-10-27T12:00:00Z",
      ),
    /permission/i,
  );
});
