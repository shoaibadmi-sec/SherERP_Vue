import test from "node:test";
import assert from "node:assert/strict";
import {
  businessFieldGroup,
  settingsSubsections,
} from "../src/settings/subsections.ts";
import { settingsFields } from "../src/settings/fields.ts";
test("business fields stay in a reachable sub-page, including Advanced and branding", () => {
  const ids = settingsSubsections.business.map((group) => group.id);
  for (const field of settingsFields.business ?? [])
    assert.ok(ids.includes(businessFieldGroup(field.key)));
  assert.equal(businessFieldGroup("logo"), "branding");
  assert.equal(businessFieldGroup("phone"), "contact");
  assert.equal(businessFieldGroup("website"), "contact");
  assert.equal(businessFieldGroup("registration"), "general");
});
test("invoice design and output profiles stay separate within one saved section", () => {
  assert.deepEqual(
    settingsSubsections.invoices.map((group) => group.id),
    ["invoice", "output"],
  );
});
