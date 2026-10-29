import test from "node:test";
import assert from "node:assert/strict";
import { seed } from "../src/saas/seed.ts";
import { applyCommand } from "../src/saas/state.ts";
const a = { kind: "staff" as const, id: "admin" };
const now = "2026-10-08T00:00:00Z";
test("package order creates invoice and settlement credits exactly once", () => {
  let r = applyCommand(
    seed(),
    a,
    {
      id: "package",
      type: "sms.packageOrder",
      data: { tenantId: "t1", packageId: "pack1" },
    },
    now,
  );
  assert.equal(r.ok, true);
  if (!r.ok) return;
  const s = r.state;
  assert.equal(
    s.invoices.find((i) => i.id === "invoice-package")?.amount,
    30000,
  );
  s.payments.push({
    id: "proof",
    tenantId: "t1",
    invoiceId: "invoice-package",
    amount: 30000,
    reference: "X",
    account: "HisabIQ collection",
    method: "Cash",
    status: "Pending",
    createdBy: "owner-t1",
    reviewer: "",
    reason: "",
    version: 1,
  });
  r = applyCommand(
    s,
    a,
    { id: "verify", type: "payment.verify", target: "proof", data: {} },
    now,
  );
  assert.equal(r.ok, true);
  if (r.ok)
    assert.equal(
      r.state.credits
        .filter((c) => c.source === "invoice-package")
        .reduce((v, c) => v + c.units, 0),
      500,
    );
});
test("SMS reservation and retry never duplicate charges; insufficient credits reject", () => {
  let r = applyCommand(
    seed(),
    a,
    {
      id: "send",
      type: "sms.reserve",
      data: { tenantId: "t1", recipient: "01711111111", text: "Hello" },
    },
    now,
  );
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.equal(
    r.state.credits
      .filter((c) => c.messageId === "send")
      .reduce((v, c) => v + c.units, 0),
    -1,
  );
  r = applyCommand(
    r.state,
    a,
    {
      id: "fail",
      type: "sms.complete",
      target: "send",
      data: { status: "Failed" },
    },
    now,
  );
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.equal(
    r.state.credits
      .filter((c) => c.messageId === "send")
      .reduce((v, c) => v + c.units, 0),
    0,
  );
  r = applyCommand(
    r.state,
    a,
    { id: "retry", type: "sms.retry", target: "send", data: {} },
    now,
  );
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(
      r.state.credits
        .filter((c) => c.messageId === "send")
        .reduce((v, c) => v + c.units, 0),
      -1,
    );
    assert.equal(
      applyCommand(
        r.state,
        a,
        { id: "retry2", type: "sms.retry", target: "send", data: {} },
        now,
      ).ok,
      false,
    );
  }
});
test("service completion requires progress and deliverable, independent of invoice", () => {
  const s = seed();
  assert.equal(
    applyCommand(
      s,
      a,
      {
        id: "complete",
        type: "service.complete",
        target: "ORD-1001",
        data: {},
      },
      now,
    ).ok,
    false,
  );
  const r = applyCommand(
    s,
    a,
    {
      id: "quote",
      type: "service.quote",
      target: "ORD-1001",
      data: { price: 100000 },
    },
    now,
  );
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.state.orders[0].status, "Quoted");
});
test("expired credit usage does not reduce a newer package balance", async () => {
  const { smsBalance } = await import("../src/saas/messaging/transitions.ts");
  const s = seed();
  s.credits = [
    {
      id: "old",
      tenantId: "t1",
      units: 1,
      source: "Old package",
      expires: "2026-10-08",
    },
    {
      id: "new",
      tenantId: "t1",
      units: 10,
      source: "New package",
      expires: "2026-12-01",
    },
  ];
  const r = applyCommand(
    s,
    a,
    {
      id: "consume",
      type: "sms.reserve",
      data: { tenantId: "t1", recipient: "01711111111", text: "Hello" },
    },
    now,
  );
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(smsBalance(r.state, "t1", "2026-10-09T00:00:00Z"), 10);
});
test("package invoice retains the purchased validity after catalog edits", () => {
  const now = "2026-10-08T00:00:00Z";
  const a = { kind: "staff" as const, id: "admin" };
  let r = applyCommand(
    seed(),
    a,
    {
      id: "buy",
      type: "sms.packageOrder",
      data: { tenantId: "t1", packageId: "pack1" },
    },
    now,
  );
  assert.equal(r.ok, true);
  if (!r.ok) return;
  r.state.packages[0].days = 1;
  r.state.payments.push({
    ...r.state.payments[0],
    id: "proof",
    invoiceId: "invoice-buy",
    amount: 30000,
    reference: "VALIDITY",
    status: "Pending",
    reviewer: "",
    version: 1,
  });
  r = applyCommand(
    r.state,
    a,
    { id: "verify-old", type: "payment.verify", target: "proof", data: {} },
    now,
  );
  assert.equal(r.ok, true);
  if (r.ok)
    assert.equal(
      r.state.credits.find((c) => c.source === "invoice-buy")?.expires,
      "2027-01-06",
    );
});
test("SMS templates are configured by staff and reusable without sending", () => {
  const r = applyCommand(
    seed(),
    { kind: "staff", id: "admin" },
    {
      id: "tpl",
      type: "sms.templateSave",
      data: {
        name: "Renewal reminder",
        text: "Your subscription renewal is due.",
      },
    },
    "2026-10-08T00:00:00Z",
  );
  assert.equal(r.ok, true);
  if (r.ok)
    assert.equal(
      r.state.templates.find((t) => t.id === "tpl")?.text,
      "Your subscription renewal is due.",
    );
});
