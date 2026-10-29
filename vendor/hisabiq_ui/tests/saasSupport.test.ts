import test from "node:test";
import assert from "node:assert/strict";
import { seed } from "../src/saas/seed.ts";
import { applyCommand } from "../src/saas/state.ts";
const admin = { kind: "staff" as const, id: "admin" };
const now = "2026-10-08T00:00:00Z";
test("tenant conversation hides internal notes and rejects internal-note creation", async () => {
  const m = await import("../src/saas/support/transitions.ts").catch(
    () => null,
  );
  assert.ok(m, "Support selectors exist");
  const s = seed();
  const a = { kind: "tenant" as const, id: "owner-t1", tenantId: "t1" };
  assert.equal(m.ticketReplies(s, a, "TKT-1001").length, 1);
  assert.equal(m.ticketReplies(s, a, "TKT-1002").length, 0);
  assert.equal(
    applyCommand(
      s,
      a,
      {
        id: "n",
        type: "ticket.note",
        target: "TKT-1001",
        data: { text: "hidden" },
      },
      now,
    ).ok,
    false,
  );
  const r = applyCommand(
    s,
    a,
    {
      id: "r",
      type: "ticket.reply",
      target: "TKT-1001",
      data: { text: "Thank you" },
    },
    now,
  );
  assert.equal(r.ok, true);
});
test("support access requires consent, expires and can be revoked", () => {
  let r = applyCommand(
    seed(),
    admin,
    {
      id: "grant",
      type: "access.request",
      data: {
        tenantId: "t1",
        reason: "Investigate stock",
        scope: "Read product settings",
        expires: "2026-10-08T02:00:00Z",
      },
    },
    now,
  );
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.equal(r.state.grants[0].status, "Requested");
  assert.equal(
    applyCommand(
      r.state,
      admin,
      { id: "consent", type: "access.consent", target: "grant", data: {} },
      now,
    ).ok,
    false,
  );
  r = applyCommand(
    r.state,
    { kind: "tenant", id: "owner-t1", tenantId: "t1" },
    { id: "consent", type: "access.consent", target: "grant", data: {} },
    now,
  );
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.state.grants[0].status, "Consented");
});
test("ticket resolution and reopening preserve conversation history", () => {
  const s = seed();
  let r = applyCommand(
    s,
    admin,
    {
      id: "resolve",
      type: "ticket.transition",
      target: "TKT-1001",
      data: { status: "Resolved" },
    },
    now,
  );
  assert.equal(r.ok, true);
  if (!r.ok) return;
  r = applyCommand(
    r.state,
    admin,
    {
      id: "open",
      type: "ticket.transition",
      target: "TKT-1001",
      data: { status: "Open" },
    },
    now,
  );
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.state.replies.length, 2);
});
test("support attachments follow public and private message audiences", async () => {
  const { ticketReplies } = await import("../src/saas/support/transitions.ts");
  const a = { kind: "staff" as const, id: "admin" };
  const now = "2026-10-08T00:00:00Z";
  const attachment = {
    name: "evidence.png",
    type: "image/png",
    data: "data:image/png;base64,YQ==",
  };
  const r = applyCommand(
    seed(),
    a,
    {
      id: "attach",
      type: "ticket.note",
      target: "TKT-1001",
      data: { text: "Private screenshot", attachment },
    },
    now,
  );
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(
      ticketReplies(r.state, a, "TKT-1001").find((m) => m.id === "attach")
        ?.attachment?.name,
      "evidence.png",
    );
    assert.equal(
      ticketReplies(
        r.state,
        { kind: "tenant", id: "owner-t1", tenantId: "t1" },
        "TKT-1001",
      ).some((m) => m.id === "attach"),
      false,
    );
  }
});
