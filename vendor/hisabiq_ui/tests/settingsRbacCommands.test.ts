import test from "node:test";
import assert from "node:assert/strict";
import { defaults, saveSection } from "../src/settings/model.ts";
const at = "2026-10-27T12:00:00Z";
test("delegated user edit cannot change role permissions through a team batch", () => {
  const s = defaults();
  s.sections.team.roles.push({
    id: "people-editor",
    name: "People editor",
    permissions: ["view", "user.account.edit"],
  });
  s.sections.team.employees[1].roleIds = ["people-editor"];
  const v = structuredClone(s.sections.team);
  v.roles
    .find((r) => r.id === "people-editor")!
    .permissions.push("user.role.manage");
  assert.equal(saveSection(s, "rafiq", "team", v, 0, at).ok, false);
});
test("role management alone cannot disable an employee through a team batch", () => {
  const s = defaults();
  s.sections.team.roles.push({
    id: "role-editor",
    name: "Role editor",
    permissions: ["view", "user.role.manage"],
  });
  s.sections.team.employees[1].roleIds = ["role-editor"];
  const v = structuredClone(s.sections.team);
  v.employees[2].active = false;
  assert.equal(saveSection(s, "rafiq", "team", v, 0, at).ok, false);
});
test("explicit setting edit capability reaches ordinary settings but not role administration", () => {
  const s = defaults();
  s.sections.team.roles.push({
    id: "settings-editor",
    name: "Settings editor",
    permissions: ["view", "settings.setting.edit"],
  });
  s.sections.team.employees[1].roleIds = ["settings-editor"];
  assert.equal(
    saveSection(
      s,
      "rafiq",
      "sales",
      { ...s.sections.sales, barcode: false },
      0,
      at,
    ).ok,
    true,
  );
  const v = structuredClone(s.sections.team);
  v.roles[1].name = "Changed";
  assert.equal(saveSection(s, "rafiq", "team", v, 0, at).ok, false);
});
