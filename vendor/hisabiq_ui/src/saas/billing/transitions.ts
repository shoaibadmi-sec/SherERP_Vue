import type {
  SaasState,
  Actor,
  SaasCommand,
  Invoice,
  Attachment,
} from "../types.ts";
import { find, text, number, date, requirePermission } from "../guards.ts";
import { due, paid, available } from "./selectors.ts";
function attachment(value: unknown): Attachment | undefined {
  if (!value) return undefined;
  const v = value as Attachment;
  if (
    !["image/png", "image/jpeg", "application/pdf"].includes(v.type) ||
    typeof v.data !== "string" ||
    !v.data.startsWith(`data:${v.type};base64,`) ||
    v.data.length > 1400000
  )
    throw Error("Use a PNG, JPEG or PDF smaller than 1 MB.");
  return { name: text(v.name), data: v.data, type: v.type };
}
export function settle(s: SaasState, i: Invoice, now: string) {
  const amount = paid(s, i.id);
  i.status = amount >= i.amount ? "Paid" : amount > 0 ? "Part paid" : "Issued";
  if (i.status === "Paid" && !i.fulfilled) {
    i.fulfilled = true;
    if (i.purpose === "subscription") {
      const sub = find(s.subscriptions, i.sourceId);
      sub.status = "Active";
      sub.renewal = new Date(
        Math.max(Date.parse(sub.renewal), Date.parse(now)) + 30 * 86400000,
      )
        .toISOString()
        .slice(0, 10);
      sub.version++;
    }
    if (i.purpose === "sms") {
      const validity = i.validDays ?? find(s.packages, i.sourceId).days;
      s.credits.push({
        id: `settlement-${i.id}`,
        tenantId: i.tenantId,
        units: i.units,
        source: i.id,
        expires: new Date(Date.parse(now) + validity * 86400000)
          .toISOString()
          .slice(0, 10),
      });
    }
  }
  if (i.purpose === "subscription" && i.status === "Paid") {
    const sub = find(s.subscriptions, i.sourceId);
    if (sub.status === "Grace") {
      sub.status = "Active";
      sub.version++;
    }
  }
  i.version++;
}
export function billingTransition(
  s: SaasState,
  a: Actor,
  c: SaasCommand,
  now: string,
) {
  const d = c.data;
  if (c.type.startsWith("plan.")) {
    requirePermission(s, a, "plans.edit");
    const old = s.plans.find((p) => p.id === c.target);
    if (old) find(s.plans, old.id, c.expectedVersion);
    if (c.type === "plan.publish" || c.type === "plan.retire") {
      if (!old) throw Error("Plan not found.");
      old.status = c.type === "plan.publish" ? "Published" : "Retired";
      old.version++;
      return;
    }
    const p = {
      id: old?.id || c.id,
      name: text(d.name),
      price: number(d.price),
      yearly: number(d.yearly),
      sms: number(d.sms, "SMS allowance", true),
      users: number(d.users, "Users"),
      features: text(d.features),
      status: "Draft",
      version: (old?.version || 0) + 1,
    };
    if (old) Object.assign(old, p);
    else s.plans.push(p);
    return;
  }
  if (c.type.startsWith("subscription.")) {
    const sub = find(s.subscriptions, c.target, c.expectedVersion);
    requirePermission(s, a, "subscriptions.edit", sub.tenantId);
    if (c.type === "subscription.extendTrial") {
      sub.renewal = date(d.date);
      if (sub.status !== "Trial")
        throw Error("Only trial subscriptions can be extended.");
    } else if (c.type === "subscription.cancel")
      sub.scheduled = `Cancel on ${sub.renewal}`;
    else if (c.type === "subscription.undoCancellation") sub.scheduled = "";
    else if (c.type === "subscription.change") {
      const plan = find(s.plans, String(d.planId));
      if (plan.status !== "Published") throw Error("Choose a published plan.");
      sub.scheduled = `${plan.name} · ${plan.price / 100} BDT/month from ${sub.renewal}`;
    } else throw Error("Unknown subscription action.");
    sub.version++;
    return;
  }
  if (c.type === "invoice.issue") {
    const tenant = text(d.tenantId);
    requirePermission(s, a, "billing.edit", tenant);
    find(s.tenants, tenant);
    s.invoices.push({
      id: c.id,
      tenantId: tenant,
      description: text(d.description),
      amount: number(d.amount),
      due: date(d.due),
      status: "Issued",
      purpose: "other",
      units: 0,
      sourceId: "",
      fulfilled: false,
      version: 1,
    });
    return;
  }
  if (c.type === "invoice.void") {
    const i = find(s.invoices, c.target, c.expectedVersion);
    requirePermission(s, a, "billing.edit", i.tenantId);
    text(d.reason);
    if (paid(s, i.id) > 0)
      throw Error("Reverse or refund the payment before voiding.");
    i.status = "Voided";
    i.version++;
    return;
  }
  if (c.type === "payment.submit") {
    const i = find(s.invoices, String(d.invoiceId));
    requirePermission(s, a, "payments.submit", i.tenantId);
    if (i.status === "Voided" || (d.tenantId && d.tenantId !== i.tenantId))
      throw Error("Invalid invoice.");
    const old = s.payments.find((p) => p.id === c.target);
    if (old) {
      if (old.createdBy !== a.id || old.status !== "Needs information")
        throw Error("Only the submitter can resubmit requested information.");
      find(s.payments, old.id, c.expectedVersion);
    }
    const p = {
      id: old?.id || c.id,
      tenantId: i.tenantId,
      invoiceId: i.id,
      amount: number(d.amount),
      method: text(d.method),
      account: text(d.account),
      reference: text(d.reference),
      status: "Pending",
      createdBy: a.id,
      reviewer: "",
      reason: String(d.reason || ""),
      evidence: attachment(d.evidence) || old?.evidence,
      version: (old?.version || 0) + 1,
    };
    if (old) Object.assign(old, p);
    else s.payments.push(p);
    return;
  }
  if (c.type === "payment.allocate") {
    const r = find(s.receipts, c.target);
    const i = find(s.invoices, String(d.invoiceId));
    requirePermission(s, a, "billing.edit", r.tenantId);
    const amount = number(d.amount);
    if (
      r.tenantId !== i.tenantId ||
      i.status === "Voided" ||
      amount > available(s, r.id) ||
      amount > due(s, i)
    )
      throw Error("Allocation exceeds available credit or invoice due.");
    s.allocations.push({
      id: c.id,
      receiptId: r.id,
      invoiceId: i.id,
      tenantId: i.tenantId,
      amount,
    });
    settle(s, i, now);
    return;
  }
  if (c.type === "payment.refund" || c.type === "payment.reverse") {
    const r = find(s.receipts, c.target);
    requirePermission(s, a, "payments.refund", r.tenantId);
    const remaining =
      r.amount -
      s.adjustments
        .filter((x) => x.receiptId === r.id)
        .reduce((v, x) => v + x.amount, 0);
    const amount = c.type === "payment.reverse" ? remaining : number(d.amount);
    if (amount <= 0 || amount > remaining)
      throw Error("Adjustment exceeds remaining receipt.");
    const reason = text(d.reason, "Reason");
    let release = Math.max(0, amount - available(s, r.id));
    const allocations = s.allocations.filter(
      (x) => x.receiptId === r.id && x.amount > 0,
    );
    for (const alloc of allocations) {
      if (!release) break;
      const i = find(s.invoices, alloc.invoiceId);
      const net = s.allocations
        .filter((x) => x.receiptId === r.id && x.invoiceId === i.id)
        .reduce((v, x) => v + x.amount, 0);
      const take = Math.min(release, net);
      if (!take) continue;
      if (i.purpose === "sms" && i.fulfilled)
        throw Error(
          "SMS package refunds require unused-credit reconciliation before adjustment.",
        );
      s.allocations.push({
        id: `${c.id}-${i.id}`,
        receiptId: r.id,
        invoiceId: i.id,
        tenantId: r.tenantId,
        amount: -take,
      });
      release -= take;
      settle(s, i, now);
      if (i.purpose === "subscription" && i.fulfilled && i.status !== "Paid") {
        find(s.subscriptions, i.sourceId).status = "Grace";
      }
    }
    s.adjustments.push({
      id: c.id,
      receiptId: r.id,
      tenantId: r.tenantId,
      amount,
      reason,
      kind: c.type === "payment.refund" ? "Refund" : "Reversal",
      date: now,
    });
    return;
  }
  const p = find(s.payments, c.target, c.expectedVersion);
  requirePermission(s, a, "payments.verify", p.tenantId);
  if (!["Pending", "Needs information"].includes(p.status))
    throw Error("This payment is already reviewed.");
  if (p.reviewer && p.reviewer !== a.id)
    throw Error("This submission belongs to another reviewer.");
  if (c.type === "payment.claim") {
    if (p.reviewer && p.reviewer !== a.id)
      throw Error("Another reviewer has claimed this submission.");
    p.reviewer = a.id;
  } else if (c.type === "payment.requestInfo" || c.type === "payment.reject") {
    p.reason = text(d.reason, "Reason");
    p.status = c.type === "payment.reject" ? "Rejected" : "Needs information";
  } else if (c.type === "payment.verify") {
    if (p.createdBy === a.id)
      throw Error("You cannot approve your own payment submission.");
    if (p.reviewer && p.reviewer !== a.id)
      throw Error("This submission belongs to another reviewer.");
    const norm = (v: string) => v.replace(/\s/g, "").toLowerCase();
    if (
      s.payments.some(
        (x) =>
          x.id !== p.id &&
          x.status !== "Rejected" &&
          norm(x.reference) === norm(p.reference) &&
          norm(x.method) === norm(p.method) &&
          norm(x.account) === norm(p.account),
      )
    )
      throw Error(
        "Possible duplicate payment reference. Resolve the duplicate before verification.",
      );
    const i = find(s.invoices, p.invoiceId);
    if (i.status === "Voided") throw Error("Invoice is voided.");
    p.status = "Verified";
    p.reviewer = a.id;
    const r = {
      id: `receipt-${c.id}`,
      paymentId: p.id,
      tenantId: p.tenantId,
      amount: p.amount,
      date: now,
    };
    s.receipts.push(r);
    const amount = Math.min(due(s, i), p.amount);
    if (amount)
      s.allocations.push({
        id: c.id,
        receiptId: r.id,
        invoiceId: i.id,
        tenantId: i.tenantId,
        amount,
      });
    settle(s, i, now);
  } else throw Error("Unknown payment action.");
  p.version++;
}
