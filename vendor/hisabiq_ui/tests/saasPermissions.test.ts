import test from "node:test";
import assert from "node:assert/strict";
const load = async () => {
  const m = await import("../src/saas/permissions.ts").catch(() => null);
  assert.ok(m, "SaaS permissions must exist");
  return m;
};
test("combined roles preserve each grant scope", async () => {
  const { can } = await load();
  const { seed } = await import("../src/saas/seed.ts");
  const s = seed();
  assert.equal(
    can(s, { kind: "staff", id: "amina" }, "support.edit", "t2"),
    true,
  );
  assert.equal(
    can(s, { kind: "staff", id: "amina" }, "payments.verify", "t1"),
    true,
  );
  assert.equal(
    can(s, { kind: "staff", id: "amina" }, "payments.verify", "t2"),
    false,
  );
  assert.equal(
    can(s, { kind: "staff", id: "amina" }, "payments.verify"),
    false,
  );
  assert.equal(
    can(s, { kind: "staff", id: "amina" }, "payments.refund", "t1"),
    false,
  );
  s.staff.find((x) => x.id === "amina")!.status = "Disabled";
  assert.equal(
    can(s, { kind: "staff", id: "amina" }, "support.view", "t1"),
    false,
  );
});
test("removing one role does not remove another grant and tenant cannot cross scope", async () => {
  const { can } = await load();
  const { seed } = await import("../src/saas/seed.ts");
  const s = seed();
  s.assignments.push({
    staffId: "amina",
    roleId: "support",
    tenantIds: ["t1"],
  });
  s.assignments.splice(
    s.assignments.findIndex(
      (x) => x.staffId === "amina" && x.roleId === "support",
    ),
    1,
  );
  assert.equal(
    can(s, { kind: "staff", id: "amina" }, "support.edit", "t1"),
    true,
  );
  assert.equal(
    can(s, { kind: "staff", id: "amina" }, "support.edit", "t2"),
    false,
  );
  assert.equal(
    can(
      s,
      { kind: "tenant", id: "owner-t1", tenantId: "t1" },
      "billing.view",
      "t2",
    ),
    false,
  );
});
test("global administration modules reject tenant-scoped view grants", async () => {
  const { allowed } = await load();
  const { seed } = await import("../src/saas/seed.ts");
  const s = seed();
  s.roles.push({
    id: "scoped-global",
    name: "Scoped global",
    permissions: [
      "team.view",
      "plans.view",
      "settings.view",
      "announcements.view",
    ],
    version: 1,
  });
  s.assignments.push({
    staffId: "rahat",
    roleId: "scoped-global",
    tenantIds: ["t2"],
  });
  for (const permission of [
    "team.view",
    "plans.view",
    "settings.view",
    "announcements.view",
  ])
    assert.equal(
      allowed(
        s,
        { kind: "staff", id: "rahat" },
        permission as `${string}.${string}`,
      ),
      false,
    );
});
