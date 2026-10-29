import test from "node:test";
import assert from "node:assert/strict";
import {
  canManage,
  defaults,
  parseSettings,
  personalDefaults,
  roundInvoice,
  saveSection,
  settingsKey,
  validPersonal,
  validateSection,
} from "../src/settings/model.ts";
import { compoundLineTotal } from "../src/utils/posQuantity.ts";
const now = "2026-10-08T06:00:00Z";
test("settings backups belong to one business and cannot replace another business", () => {
  const a = defaults("t1"),
    b = defaults("t2");
  a.sections.business.name = "Updated business";
  assert.notEqual(settingsKey(a.tenantId), settingsKey(b.tenantId));
  assert.equal(parseSettings(JSON.stringify(a), "t2").recovered, true);
  assert.equal(
    parseSettings(JSON.stringify(a), "t1").state.sections.business.name,
    "Updated business",
  );
});
test("cashier and accountant roles combine without granting sales policy access", () => {
  const state = defaults();
  assert.equal(canManage(state, "rafiq", "view"), true);
  assert.equal(canManage(state, "rafiq", "money"), true);
  assert.equal(canManage(state, "rafiq", "sales"), false);
  assert.equal(canManage(state, "nusrat", "sales"), true);
  assert.equal(canManage(state, "nusrat", "team"), false);
});
test("disabled employees have no settings authority", () => {
  const state = defaults();
  state.sections.team.employees[0].active = false;
  assert.equal(canManage(state, "mahmud", "business"), false);
});
test("restore authority remains owner-only even with a delegated import permission", () => {
  const state = defaults();
  state.sections.team.roles
    .find((r) => r.id === "manager")!
    .permissions.push("import");
  assert.equal(canManage(state, "nusrat", "import"), false);
  assert.equal(canManage(state, "mahmud", "import"), true);
});
test("posting lock dates reject nonexistent calendar days", () => {
  const money = defaults().sections.money;
  assert.equal(
    validateSection("money", { ...money, lockDate: "2024-02-29" }),
    null,
  );
  assert.match(
    validateSection("money", { ...money, lockDate: "2025-02-29" }) || "",
    /valid.*date/,
  );
});
test("unauthorized changes fail atomically and preserve saved policy", () => {
  const state = defaults(),
    before = structuredClone(state);
  const result = saveSection(
    state,
    "rafiq",
    "sales",
    { ...state.sections.sales, discountLimit: 10 },
    0,
    now,
  );
  assert.equal(result.ok, false);
  assert.deepEqual(state, before);
});
test("stale forms cannot overwrite a newer business settings revision", () => {
  const state = defaults();
  const saved = saveSection(
    state,
    "mahmud",
    "business",
    { ...state.sections.business, name: "New shop" },
    0,
    now,
  );
  assert.equal(saved.ok, true);
  if (!saved.ok) return;
  const stale = saveSection(
    saved.state,
    "mahmud",
    "sales",
    { ...state.sections.sales, rounding: "No rounding" },
    0,
    now,
  );
  assert.equal(stale.ok, false);
  assert.equal(saved.state.sections.business.name, "New shop");
});
test("saving a section records attribution and preserves all other sections", () => {
  const state = defaults();
  const result = saveSection(
    state,
    "mahmud",
    "invoices",
    { ...state.sections.invoices, footer: "Thank you" },
    0,
    now,
  );
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.state.revision, 1);
  assert.deepEqual(result.state.sections.products, state.sections.products);
  assert.deepEqual(result.state.events[0].changes, ["footer"]);
  assert.equal(result.state.events[0].actor, "Mahmud Hasan");
  assert.equal(state.sections.invoices.footer, "Thank you for your business.");
});
test("the last owner cannot be disabled or reassigned out of ownership", () => {
  const state = defaults(),
    team = structuredClone(state.sections.team);
  team.employees[0].active = false;
  assert.match(validateSection("team", team) || "", /owner/);
  team.employees[0].active = true;
  team.employees[0].roleIds = ["manager"];
  assert.match(validateSection("team", team) || "", /owner/);
});
test("delegated team management cannot assign owner authority", () => {
  const state = defaults();
  state.sections.team.roles
    .find((r) => r.id === "manager")!
    .permissions.push("team");
  const team = structuredClone(state.sections.team);
  team.employees.find((e) => e.id === "nusrat")!.roleIds.push("owner");
  assert.equal(saveSection(state, "nusrat", "team", team, 0, now).ok, false);
});
test("used role IDs must still exist and owner role remains protected", () => {
  const team = defaults().sections.team;
  team.roles = team.roles.filter((r) => r.id !== "cashier");
  assert.match(validateSection("team", team) || "", /existing role/);
  const owner = defaults().sections.team;
  owner.roles[0].permissions = ["view"];
  assert.match(validateSection("team", owner) || "", /protected/);
});
test("invalid imported field types and enum values recover safely", () => {
  const saved = defaults();
  (saved.sections.products as unknown as Record<string, unknown>).allocation =
    "LIFO";
  assert.equal(parseSettings(JSON.stringify(saved), "t1").recovered, true);
  const bad = defaults();
  (bad.sections.business as unknown as Record<string, unknown>).name = {
    unexpected: "object",
  };
  assert.equal(parseSettings(JSON.stringify(bad), "t1").recovered, true);
  assert.equal(parseSettings("{broken", "t1").recovered, true);
});
test("invalid values cannot be saved through direct commands", () => {
  const state = defaults();
  assert.equal(
    saveSection(
      state,
      "mahmud",
      "sales",
      { ...state.sections.sales, discountLimit: 101 },
      0,
      now,
    ).ok,
    false,
  );
  assert.equal(
    saveSection(
      state,
      "mahmud",
      "invoices",
      { ...state.sections.invoices, prefix: "<invalid>" },
      0,
      now,
    ).ok,
    false,
  );
  assert.equal(
    saveSection(
      state,
      "mahmud",
      "business",
      { ...state.sections.business, logo: "javascript:alert(1)" },
      0,
      now,
    ).ok,
    false,
  );
});
test("personal display mode is independently validated", () => {
  assert.equal(validPersonal({ ...personalDefaults, mode: "Advanced" }), true);
  assert.equal(
    validPersonal({ ...personalDefaults, language: "unsupported" }),
    false,
  );
  assert.equal(
    validPersonal({ ...personalDefaults, dateView: "created" }),
    true,
  );
});
test("rounding preferences preserve compound quantity arithmetic", () => {
  const box = compoundLineTotal("2", "5", 12, 120),
    fabric = compoundLineTotal("1", "12", 16, 160);
  assert.equal(box, 290);
  assert.equal(fabric, 280);
  assert.equal(roundInvoice(box + fabric + 2.35, "Nearest ৳5"), 570);
  assert.equal(roundInvoice(box + fabric + 2.35, "Nearest ৳1"), 572);
  assert.equal(roundInvoice(box + fabric + 2.35, "No rounding"), 572.35);
});
