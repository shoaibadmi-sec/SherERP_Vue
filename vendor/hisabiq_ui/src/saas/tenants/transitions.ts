import type { SaasState, Actor, SaasCommand } from "../types.ts";
import { requirePermission, find, text, email } from "../guards.ts";
export function tenantTransition(
  s: SaasState,
  a: Actor,
  c: SaasCommand,
  now: string,
) {
  requirePermission(
    s,
    a,
    "tenants.edit",
    c.type === "tenant.create" ? undefined : c.target,
  );
  const d = c.data;
  if (c.type === "tenant.create") {
    const mail = email(d.email);
    if (s.tenants.some((t) => t.email.toLowerCase() === mail.toLowerCase()))
      throw Error("A tenant already uses this email.");
    const plan = find(s.plans, String(d.planId));
    if (plan.status !== "Published") throw Error("Choose a published plan.");
    s.tenants.push({
      id: c.id,
      name: text(d.name, "Business name"),
      owner: text(d.owner, "Owner"),
      email: mail,
      phone: text(d.phone, "Phone"),
      status: "Active",
      version: 1,
      invitation: "Pending",
    });
    s.subscriptions.push({
      id: `sub-${c.id}`,
      tenantId: c.id,
      planId: plan.id,
      planName: plan.name,
      price: plan.price,
      status: "Trial",
      renewal: new Date(Date.parse(now) + 14 * 86400000)
        .toISOString()
        .slice(0, 10),
      scheduled: "",
      version: 1,
    });
    return;
  }
  const t = find(s.tenants, c.target, c.expectedVersion);
  if (c.type === "tenant.suspend") {
    text(d.reason, "Reason");
    t.status = "Suspended";
  } else if (c.type === "tenant.reactivate") t.status = "Active";
  else if (c.type === "tenant.archive") {
    text(d.reason, "Reason");
    if (
      s.invoices.some(
        (i) => i.tenantId === t.id && !["Paid", "Voided"].includes(i.status),
      ) ||
      s.tickets.some(
        (i) =>
          i.tenantId === t.id && !["Resolved", "Closed"].includes(i.status),
      ) ||
      s.orders.some(
        (i) =>
          i.tenantId === t.id && !["Completed", "Cancelled"].includes(i.status),
      )
    )
      throw Error(
        "Resolve open invoices, support tickets and service orders before archiving.",
      );
    t.status = "Archived";
  } else if (c.type === "tenant.inviteOwner") t.invitation = "Pending";
  else if (c.type === "tenant.update") {
    t.name = text(d.name);
    t.owner = text(d.owner);
    t.email = email(d.email);
    t.phone = text(d.phone);
  } else throw Error("Unknown tenant action.");
  t.version++;
}
