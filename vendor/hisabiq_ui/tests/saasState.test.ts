import test from "node:test";
import assert from "node:assert/strict";
const load = async () => {
  const m = await import("../src/saas/state.ts").catch(() => null);
  assert.ok(m, "SaaS state must exist");
  return m;
};
test("owner and assigned-role protections reject atomically", async () => {
  const { applyCommand } = await load();
  const { seed } = await import("../src/saas/seed.ts");
  const s = seed();
  const before = JSON.stringify(s);
  const actor = { kind: "staff" as const, id: "admin" };
  for (const c of [
    { type: "staff.disable", target: "admin" },
    { type: "role.delete", target: "support" },
  ]) {
    const r = applyCommand(
      s,
      actor,
      { id: "test" + c.type, ...c, data: {} },
      "2026-10-08T00:00:00Z",
    );
    assert.equal(r.ok, false);
  }
  assert.equal(JSON.stringify(s), before);
});
test("storage validation rejects corrupt structures and supports blocked storage", async () => {
  const { readState, writeState } = await load();
  for (const value of ["garbage", "{}", '{"version":1,"tenants":[]}']) {
    const r = readState({ getItem: () => value });
    assert.ok(r.error);
    assert.ok(r.state.tenants.length);
  }
  assert.ok(
    readState({
      getItem: () => {
        throw Error("blocked");
      },
    }).error,
  );
  const { seed } = await import("../src/saas/seed.ts");
  assert.ok(
    writeState(
      {
        setItem: () => {
          throw Error("quota");
        },
      },
      seed(),
    ),
  );
});
test("malformed role records are rejected before rendering and owner role cannot be stripped", async () => {
  const { readState, applyCommand } = await load();
  const { seed } = await import("../src/saas/seed.ts");
  const s = seed();
  const corrupt = structuredClone(s);
  (corrupt.roles[0] as any).permissions = null;
  assert.ok(readState({ getItem: () => JSON.stringify(corrupt) }).error);
  assert.equal(
    applyCommand(
      s,
      { kind: "staff", id: "admin" },
      {
        id: "strip",
        type: "role.save",
        target: "owner",
        data: { name: "Owner", permissions: [] },
      },
      "2026-10-08T00:00:00Z",
    ).ok,
    false,
  );
});
test("malformed persisted domain records recover safely", async () => {
  const { readState } = await load();
  const { seed } = await import("../src/saas/seed.ts");
  for (const key of ["sms", "payments", "roles", "settings"]) {
    const s = seed();
    if (key === "sms")
      (s.sms as unknown[]).push({ id: "bad", recipient: null });
    if (key === "payments")
      (s.payments[0] as unknown as { reference: unknown }).reference = null;
    if (key === "roles")
      (s.roles[0] as unknown as { permissions: unknown }).permissions = [null];
    if (key === "settings")
      (s.settings as unknown as { grace: unknown }).grace = "oops";
    assert.ok(readState({ getItem: () => JSON.stringify(s) }).error, key);
  }
});
test("last owner cannot be deactivated through a generic staff edit", async () => {
  const { seed } = await import("../src/saas/seed.ts");
  const { applyCommand } = await load();
  for (const status of ["Pending", "Expired", "Revoked"])
    assert.equal(
      applyCommand(
        seed(),
        { kind: "staff", id: "admin" },
        { id: status, type: "staff.update", target: "admin", data: { status } },
        "2026-10-08",
      ).ok,
      false,
    );
});
test('valid saved roles with mixed all-tenant and selected-tenant scopes reload without data loss',async()=>{const {readState,applyCommand}=await load();const {seed}=await import('../src/saas/seed.ts');const r=applyCommand(seed(),{kind:'staff',id:'admin'},{id:'persisted-tenant',type:'tenant.create',data:{name:'Persisted shop',owner:'Owner',email:'persist@test.com',phone:'01700000000',planId:'pro'}},'2026-10-08T00:00:00Z');assert.equal(r.ok,true);if(r.ok){const loaded=readState({getItem:()=>JSON.stringify(r.state)});assert.equal(loaded.error,'');assert.ok(loaded.state.tenants.some(t=>t.id==='persisted-tenant'));}});
