import test from "node:test";
import assert from "node:assert/strict";
import { seed } from "../src/saas/seed.ts";
import { applyCommand } from "../src/saas/state.ts";
const admin = { kind: "staff" as const, id: "admin" };
const now = "2026-10-08T00:00:00Z";
test("announcement cancellation prevents simulated delivery and keeps audit reason", () => {
  let r = applyCommand(
    seed(),
    admin,
    {
      id: "ann",
      type: "announcement.save",
      data: {
        title: "Maintenance",
        body: "Short pause",
        tenantIds: ["t1"],
        channel: "In-app",
        scheduled: "2026-10-09T00:00:00Z",
      },
    },
    now,
  );
  assert.equal(r.ok, true);
  if (!r.ok) return;
  r = applyCommand(
    r.state,
    admin,
    {
      id: "cancel",
      type: "announcement.cancel",
      target: "ann",
      data: { reason: "Postponed" },
    },
    now,
  );
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.state.audit[0].reason, "Postponed");
    assert.equal(
      applyCommand(
        r.state,
        admin,
        {
          id: "send",
          type: "announcement.simulateDelivery",
          target: "ann",
          data: {},
        },
        now,
      ).ok,
      false,
    );
  }
});
test("settings updates validate bounds and prohibit support-only changes", () => {
  const c = {
    id: "settings",
    type: "settings.update",
    data: {
      grace: 3,
      releaseFailed: false,
      collectionAccount: "New collection",
    },
  };
  const r = applyCommand(seed(), admin, c, now);
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.state.settings.grace, 3);
    assert.equal(r.state.settings.collectionAccount, "New collection");
  }
  assert.equal(
    applyCommand(seed(), { kind: "staff", id: "amina" }, c, now).ok,
    false,
  );
});
test("scoped audit views hide other tenants and private module snapshots", async () => {
  const m = await import("../src/saas/admin/auditSelectors.ts").catch(
    () => null,
  );
  assert.ok(m, "Audit scope selector exists");
  const s = seed();
  s.roles.push({
    id: "limited-audit",
    name: "Limited auditor",
    permissions: ["audit.view"],
    version: 1,
  });
  s.assignments.push({
    staffId: "rahat",
    roleId: "limited-audit",
    tenantIds: ["t1"],
  });
  s.audit = [
    {
      id: "t1-event",
      actor: "admin",
      action: "payment.submit",
      target: "p1",
      tenantId: "t1",
      date: "2026-10-08",
      reason: "",
      before: "secret",
      after: "evidence",
    },
    {
      id: "t2-event",
      actor: "admin",
      action: "ticket.note",
      target: "t2",
      tenantId: "t2",
      date: "2026-10-08",
      reason: "private",
      before: "secret",
      after: "secret",
    },
  ];
  const rows = m.auditEvents(s, { kind: "staff", id: "rahat" });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].id, "t1-event");
  assert.equal(rows[0].after, "Details restricted by module permissions.");
});
test("local datetime input retains the same UTC schedule when saved unchanged", async () => {
  const m = await import("../src/saas/admin/schedule.ts").catch(() => null);
  assert.ok(m, "Schedule formatter exists");
  const originalTZ = process.env.TZ;
  process.env.TZ = "Asia/Dhaka";
  try {
    const input = m.localDateTime("2026-10-08T12:00:00.000Z");
    assert.equal(input, "2026-10-08T18:00");
    assert.equal(new Date(input).toISOString(), "2026-10-08T12:00:00.000Z");
  } finally {
    if (originalTZ) process.env.TZ = originalTZ;
    else delete process.env.TZ;
  }
});
