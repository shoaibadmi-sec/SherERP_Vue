import test from "node:test";
import assert from "node:assert/strict";
import { seed } from "../src/saas/seed.ts";
import { applyCommand } from "../src/saas/state.ts";
const a = { kind: "staff" as const, id: "admin" };
const now = "2026-10-08T00:00:00Z";
test("tenant creation creates a trial and preserves subscription on suspension", () => {
  let s = seed();
  let r = applyCommand(
    s,
    a,
    {
      id: "new",
      type: "tenant.create",
      data: {
        name: "Test shop",
        owner: "Owner",
        email: "owner@test.com",
        phone: "01711111111",
        planId: "pro",
      },
    },
    now,
  );
  assert.equal(r.ok, true);
  if (!r.ok) return;
  s = r.state;
  assert.equal(
    s.subscriptions.find((x) => x.tenantId === "new")?.status,
    "Trial",
  );
  r = applyCommand(
    s,
    a,
    {
      id: "suspend",
      type: "tenant.suspend",
      target: "new",
      data: { reason: "Requested pause" },
    },
    now,
  );
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(
      r.state.tenants.find((x) => x.id === "new")?.status,
      "Suspended",
    );
    assert.equal(
      r.state.subscriptions.find((x) => x.tenantId === "new")?.status,
      "Trial",
    );
  }
});
test("archive blockers, missing reason, bad tenant and stale version reject atomically", () => {
  const s = seed();
  for (const c of [
    { type: "tenant.archive", target: "t1", data: { reason: "close" } },
    { type: "tenant.suspend", target: "t1", data: {} },
    { type: "tenant.reactivate", target: "missing", data: {} },
    { type: "tenant.reactivate", target: "t1", expectedVersion: 999, data: {} },
  ])
    assert.equal(
      applyCommand(s, a, { id: JSON.stringify(c), ...c }, now).ok,
      false,
    );
  assert.equal(s.tenants[0].status, "Active");
});
