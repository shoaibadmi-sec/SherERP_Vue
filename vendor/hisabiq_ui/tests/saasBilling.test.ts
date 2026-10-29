import test from "node:test";
import assert from "node:assert/strict";
import { seed } from "../src/saas/seed.ts";
import { applyCommand } from "../src/saas/state.ts";
const a = { kind: "staff" as const, id: "admin" };
const now = "2026-10-08T00:00:00Z";
test("verification allocates once and activates only full settlement", () => {
  const s = seed();
  s.payments[0].amount = 40000;
  const r = applyCommand(
    s,
    a,
    { id: "v", type: "payment.verify", target: "PAY-1001", data: {} },
    now,
  );
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.equal(r.state.receipts.length, 1);
  assert.equal(r.state.allocations[0].amount, 40000);
  assert.equal(r.state.invoices[0].status, "Part paid");
  assert.equal(r.state.invoices[0].fulfilled, false);
  let again = applyCommand(
    r.state,
    a,
    { id: "v2", type: "payment.verify", target: "PAY-1001", data: {} },
    now,
  );
  assert.equal(again.ok, false);
  again = applyCommand(
    r.state,
    a,
    { id: "v", type: "payment.verify", target: "PAY-1001", data: {} },
    now,
  );
  assert.equal(again.ok, true);
  if (again.ok) assert.equal(again.state.receipts.length, 1);
});
test("excess receipt remains unapplied and full invoice activates subscription", () => {
  const s = seed();
  s.payments[0].amount = 150000;
  const r = applyCommand(
    s,
    a,
    { id: "v", type: "payment.verify", target: "PAY-1001", data: {} },
    now,
  );
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.state.receipts[0].amount, 150000);
    assert.equal(r.state.allocations[0].amount, 100000);
    assert.equal(r.state.invoices[0].fulfilled, true);
  }
});
test("self approval, duplicate reference and invalid submissions are rejected", () => {
  const s = seed();
  s.payments[0].createdBy = "admin";
  assert.equal(
    applyCommand(
      s,
      a,
      { id: "v", type: "payment.verify", target: "PAY-1001", data: {} },
      now,
    ).ok,
    false,
  );
  s.payments[0].createdBy = "owner-t1";
  s.payments[1].reference = s.payments[0].reference;
  s.payments[1].method = s.payments[0].method;
  const r = applyCommand(
    s,
    a,
    { id: "v", type: "payment.verify", target: "PAY-1001", data: {} },
    now,
  );
  assert.equal(r.ok, false);
  for (const amount of [-1, 0, 1.5, NaN])
    assert.equal(
      applyCommand(
        seed(),
        a,
        {
          id: "p" + amount,
          type: "payment.submit",
          data: {
            tenantId: "t1",
            invoiceId: "SAAS-1001",
            amount,
            method: "bKash",
            reference: "NEW",
            account: "HisabIQ collection",
          },
        },
        now,
      ).ok,
      false,
    );
});
test("refund retains receipt and reduces allocations without double refund", () => {
  let r = applyCommand(
    seed(),
    a,
    { id: "v", type: "payment.verify", target: "PAY-1001", data: {} },
    now,
  );
  assert.equal(r.ok, true);
  if (!r.ok) return;
  r = applyCommand(
    r.state,
    a,
    {
      id: "r",
      type: "payment.refund",
      target: "receipt-v",
      data: { amount: 40000, reason: "Customer request" },
    },
    now,
  );
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.state.receipts[0].amount, 100000);
    assert.equal(r.state.adjustments[0].amount, 40000);
    assert.equal(r.state.invoices[0].status, "Part paid");
    assert.equal(
      applyCommand(
        r.state,
        a,
        {
          id: "r2",
          type: "payment.refund",
          target: "receipt-v",
          data: { amount: 70000, reason: "too much" },
        },
        now,
      ).ok,
      false,
    );
  }
});

test("repayment after refund restores access without extending renewal twice", () => {
  const admin = { kind: "staff" as const, id: "admin" };
  const now = "2026-10-08T00:00:00Z";
  let r = applyCommand(
    seed(),
    admin,
    { id: "first", type: "payment.verify", target: "PAY-1001", data: {} },
    now,
  );
  assert.equal(r.ok, true);
  if (!r.ok) return;
  const renewal = r.state.subscriptions[0].renewal;
  r = applyCommand(
    r.state,
    admin,
    {
      id: "refund",
      type: "payment.refund",
      target: "receipt-first",
      data: { amount: 40000, reason: "Correction" },
    },
    now,
  );
  assert.equal(r.ok, true);
  if (!r.ok) return;
  r.state.payments.push({
    ...r.state.payments[0],
    id: "newproof",
    status: "Pending",
    reference: "NEW-REPAY",
    amount: 40000,
    reviewer: "",
    version: 1,
  });
  r = applyCommand(
    r.state,
    admin,
    { id: "second", type: "payment.verify", target: "newproof", data: {} },
    now,
  );
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.state.subscriptions[0].status, "Active");
    assert.equal(r.state.subscriptions[0].renewal, renewal);
  }
});
test("claimed payment decisions belong to the claimed reviewer", () => {
  const s = seed();
  s.payments[0].reviewer = "admin";
  for (const type of ["payment.reject", "payment.requestInfo"])
    assert.equal(
      applyCommand(
        s,
        { kind: "staff", id: "amina" },
        {
          id: type,
          type,
          target: "PAY-1001",
          data: { reason: "Attempt override" },
        },
        "2026-10-08T00:00:00Z",
      ).ok,
      false,
    );
});
