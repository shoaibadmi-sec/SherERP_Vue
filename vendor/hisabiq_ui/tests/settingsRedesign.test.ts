import test from "node:test";
import assert from "node:assert/strict";
import {
  defaults,
  parseSettings,
  saveSection,
  validateSection,
} from "../src/settings/model.ts";
import {
  permissionCatalogue,
  effectivePermissions,
  roleImpact,
  validateRoleChange,
} from "../src/settings/rbac.ts";
import {
  invoiceDesignDefaults,
  validateInvoiceDesign,
  invoicePageCss,
  presentationRevision,
} from "../src/documents/profile.ts";
import {
  financialDefaults,
  financialColumns,
  financialLabel,
  validateFinancialDisplay,
} from "../src/financial-display/model.ts";
const now = "2026-10-27T12:00:00Z";
test("NestSherERP catalogue ports every implemented authority as separate capability", () => {
  assert.deepEqual(
    permissionCatalogue.slice(0, 10).map((p) => p.code),
    [
      "user.account.view",
      "user.account.create",
      "user.account.edit",
      "user.account.disable",
      "user.role.view",
      "user.role.manage",
      "settings.setting.view",
      "settings.setting.edit",
      "settings.module.toggle",
      "audit.event.view",
    ],
  );
  const s = defaults();
  assert(
    effectivePermissions(s.sections.team, "mahmud").includes(
      "user.role.manage",
    ),
  );
  assert(
    !effectivePermissions(s.sections.team, "rafiq").includes(
      "user.role.manage",
    ),
  );
});
test("role mutation protects owner, built-in identity and current assigned members", () => {
  const team = defaults().sections.team;
  const owner = { ...team.roles[0], permissions: ["view"] };
  assert.match(
    validateRoleChange(team, owner, "mahmud") || "",
    /owner|protected/i,
  );
  assert.match(
    validateRoleChange(team, null, "mahmud", "cashier") || "",
    /built|system/i,
  );
  const custom = {
    id: "custom",
    name: "Accounts helper",
    permissions: ["view"],
  };
  team.roles.push(custom);
  team.employees[1].roleIds.push("custom");
  assert.match(
    validateRoleChange(team, null, "mahmud", "custom") || "",
    /assigned|reassign/i,
  );
  const impact = roleImpact(team, {
    ...custom,
    permissions: ["view", "money"],
  });
  assert.deepEqual(impact.affectedMembers, ["Rafiq Islam"]);
  assert.deepEqual(impact.added, ["money"]);
});
test("legacy settings migrate document fields without losing old grants, values or assignments", () => {
  const old = defaults();
  delete (old.sections.invoices as any).design;
  const parsed = parseSettings(JSON.stringify(old), "t1");
  assert.equal(parsed.recovered, false);
  assert.deepEqual(
    parsed.state.sections.team.employees,
    old.sections.team.employees,
  );
  assert.equal(
    parsed.state.sections.invoices.design?.language,
    "English + Bangla",
  );
});
test("all NestSherERP invoice design controls validate and page mode affects real print CSS", () => {
  const d = invoiceDesignDefaults();
  assert.equal(validateInvoiceDesign(d), null);
  assert.match(invoicePageCss({ ...d, paper: "58 mm" }), /58mm/);
  assert.match(
    invoicePageCss({ ...d, paper: "A4", orientation: "Landscape" }),
    /A4 landscape/,
  );
  assert.match(
    invoicePageCss({ ...d, paper: "Business Pad", topOffset: 35 }),
    /35mm/,
  );
  assert.match(
    validateInvoiceDesign({ ...d, sections: ["header", "header"] }) || "",
    /section/i,
  );
  assert.match(
    validateInvoiceDesign({ ...d, topOffset: 400 }) || "",
    /margin|offset/i,
  );
});
test("cosmetic invoice revision cannot edit accounting and never mutates source", () => {
  const source = { invoice: "INV-1", total: 2000, paid: 1500, due: 500 };
  const result = presentationRevision(
    source,
    { customerName: "New display name", note: "Deliver Friday" },
    "mahmud",
    now,
  );
  assert.equal(result.source.total, 2000);
  assert.deepEqual(source, {
    invoice: "INV-1",
    total: 2000,
    paid: 1500,
    due: 500,
  });
  assert.throws(
    () => presentationRevision(source, { total: 1 } as any, "mahmud", now),
    /presentation|allowed/i,
  );
});
test("financial order moves actual asymmetric values and naming never changes canonical meaning", () => {
  const d = financialDefaults();
  const p = {
    ...d,
    contexts: {
      ...d.contexts,
      Customer: { ...d.contexts.Customer, order: "credit-first" as const },
    },
  };
  assert.deepEqual(financialColumns(p, "Customer"), ["credit", "debit"]);
  const row = { debit: 1250, credit: 430 };
  assert.deepEqual(
    financialColumns(p, "Customer").map((k) => row[k]),
    [430, 1250],
  );
  assert.equal(financialLabel(p, "Customer", "debit", "English"), "Debit");
  p.contexts.Customer.terms.debit.bn = "খরচ";
  assert.equal(financialLabel(p, "Customer", "debit", "Bangla"), "খরচ");
  assert.equal(row.debit, 1250);
  assert.match(
    validateFinancialDisplay({
      ...p,
      contexts: {
        ...p.contexts,
        Customer: { ...p.contexts.Customer, order: "arbitrary" },
      },
    }) || "",
    /order/i,
  );
});
test("new shared settings are owner-only, revision checked, no-op does not add audit", () => {
  const s = defaults();
  const draft = structuredClone(s.sections.financialTerminology);
  assert.equal(
    saveSection(s, "rafiq", "financialTerminology", draft, 0, now).ok,
    false,
  );
  draft.contexts.Customer.order = "credit-first";
  assert.equal(
    saveSection(s, "mahmud", "financialTerminology", draft, 3, now).ok,
    false,
  );
  const saved = saveSection(s, "mahmud", "financialTerminology", draft, 0, now);
  assert(saved.ok);
  assert.equal(saved.state.events.length, 1);
  const noop = saveSection(
    saved.state,
    "mahmud",
    "financialTerminology",
    draft,
    1,
    now,
  );
  assert(noop.ok);
  assert.equal(noop.state.revision, 1);
  assert.match(
    validateSection("invoices", {
      ...s.sections.invoices,
      design: { ...invoiceDesignDefaults(), footer: "x".repeat(2001) },
    }) || "",
    /footer|long/i,
  );
});
test("actual legacy owner arrays gain only new owner authority without resetting saved business data", () => {
  const old = defaults();
  old.sections.business.name = "Existing real shop";
  old.sections.team.roles[0].permissions = [
    "view",
    "business",
    "sales",
    "products",
    "purchases",
    "money",
    "invoices",
    "team",
    "notifications",
    "export",
    "import",
  ];
  delete (old.sections as any).financialTerminology;
  delete old.sections.invoices.design;
  const parsed = parseSettings(JSON.stringify(old), "t1");
  assert.equal(parsed.recovered, false);
  assert.equal(parsed.state.sections.business.name, "Existing real shop");
  assert(
    parsed.state.sections.team.roles[0].permissions.includes(
      "user.role.manage",
    ),
  );
  assert.deepEqual(parsed.state.sections.team.employees[1].roleIds, [
    "cashier",
    "accountant",
  ]);
});
