import type { SaasState, Actor, SaasCommand } from "../types.ts";
import { find, text, number, date, requirePermission } from "../guards.ts";
export function serviceTransition(
  s: SaasState,
  a: Actor,
  c: SaasCommand,
  now: string,
) {
  const d = c.data;
  if (c.type === "service.catalogSave") {
    requirePermission(s, a, "services.configure");
    const old = s.services.find((x) => x.id === c.target);
    if (old) find(s.services, old.id, c.expectedVersion);
    const p = {
      id: old?.id || c.id,
      name: text(d.name),
      price: number(d.price),
      recurring: d.recurring === true,
      version: (old?.version || 0) + 1,
    };
    if (old) Object.assign(old, p);
    else s.services.push(p);
    return;
  }
  if (c.type === "service.request") {
    const tenant = text(d.tenantId);
    requirePermission(s, a, "services.edit", tenant);
    const svc = find(s.services, String(d.serviceId));
    s.orders.push({
      id: c.id,
      tenantId: tenant,
      serviceId: svc.id,
      name: svc.name,
      price: svc.price,
      status: "Requested",
      assignee: "",
      due: now.slice(0, 10),
      deliverable: "",
      version: 1,
    });
    return;
  }
  const o = find(s.orders, c.target, c.expectedVersion);
  requirePermission(s, a, "services.edit", o.tenantId);
  if (
    a.kind === "tenant" &&
    !["service.approve", "service.cancel"].includes(c.type)
  )
    throw Error("This action requires service staff.");
  const requireStatus = (statuses: string[]) => {
    if (!statuses.includes(o.status))
      throw Error(
        `This action is not available while the order is ${o.status}.`,
      );
  };
  if (c.type === "service.quote") {
    requireStatus(["Requested", "Quoted"]);
    o.price = number(d.price);
    o.status = "Quoted";
  } else if (c.type === "service.approve") {
    requireStatus(["Quoted"]);
    o.status = "Approved";
    s.invoices.push({
      id: `invoice-${o.id}`,
      tenantId: o.tenantId,
      description: `Service · ${o.name}`,
      amount: o.price,
      due: now.slice(0, 10),
      status: "Issued",
      purpose: "service",
      units: 0,
      sourceId: o.id,
      fulfilled: false,
      version: 1,
    });
  } else if (c.type === "service.assign") {
    const staff = find(s.staff, String(d.assignee));
    if (staff.status !== "Active") throw Error("Choose active staff.");
    o.assignee = staff.id;
  } else if (c.type === "service.schedule") {
    requireStatus(["Approved", "Scheduled"]);
    if (!o.assignee) throw Error("Assign a coordinator first.");
    o.due = date(d.due);
    o.status = "Scheduled";
  } else if (c.type === "service.start") {
    requireStatus(["Scheduled"]);
    o.status = "In progress";
  } else if (c.type === "service.deliver") {
    requireStatus(["In progress"]);
    o.deliverable = text(d.deliverable, "Deliverable");
  } else if (c.type === "service.complete") {
    requireStatus(["In progress"]);
    if (!o.deliverable) throw Error("Record a deliverable before completion.");
    o.status = "Completed";
  } else if (c.type === "service.cancel") {
    requireStatus(["Requested", "Quoted", "Approved", "Scheduled"]);
    text(d.reason);
    o.status = "Cancelled";
  } else throw Error("Unknown service action.");
  o.version++;
}
