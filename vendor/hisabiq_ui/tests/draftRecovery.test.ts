import test from "node:test";
import assert from "node:assert/strict";
import {
  getSalesPreviewSnapshot,
  deleteSalesDraft,
  restoreSalesDraft,
  listDeletedSalesDrafts,
} from "../src/data/salesPreviewStore.ts";
test("draft recovery preserves identity, is retry-safe and never posts invoices", () => {
  const before = getSalesPreviewSnapshot();
  const draft = before.drafts[0];
  const n = before.invoices.length;
  const ctx = { tenantId: "t1", actorId: "mahmud", allowed: true };
  deleteSalesDraft(draft.id, ctx, "2026-10-01T00:00:00Z");
  assert(!getSalesPreviewSnapshot().drafts.some((d) => d.id === draft.id));
  assert.equal(listDeletedSalesDrafts({ ...ctx, tenantId: "t2" }).length, 0);
  assert.throws(
    () => restoreSalesDraft(draft.id, ctx, "2026-10-31T00:00:00Z"),
    /expired/i,
  );
  restoreSalesDraft(draft.id, ctx, "2026-10-20T00:00:00Z");
  restoreSalesDraft(draft.id, ctx, "2026-10-20T00:00:00Z");
  assert.equal(
    getSalesPreviewSnapshot().drafts.filter((d) => d.id === draft.id).length,
    1,
  );
  assert.equal(getSalesPreviewSnapshot().invoices.length, n);
});
