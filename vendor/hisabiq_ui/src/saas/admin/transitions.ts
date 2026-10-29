import type { SaasState, Actor, SaasCommand } from "../types.ts";
import { find, text, number, date, requirePermission } from "../guards.ts";
export function adminTransition(
  s: SaasState,
  a: Actor,
  c: SaasCommand,
  now: string,
) {
  const d = c.data;
  if (c.type === "settings.update") {
    requirePermission(s, a, "settings.edit");
    const grace = number(d.grace, "Grace days", true);
    if (grace > 90) throw Error("Grace period must be between 0 and 90 days.");
    s.settings = {
      ...s.settings,
      grace,
      releaseFailed: d.releaseFailed === true,
      collectionAccount: text(d.collectionAccount),
    };
    return;
  }
  requirePermission(s, a, "announcements.edit");
  if (c.type === "announcement.save") {
    const ids = Array.isArray(d.tenantIds) ? (d.tenantIds as string[]) : [];
    if (!ids.length || ids.some((id) => !s.tenants.some((t) => t.id === id)))
      throw Error("Choose at least one valid tenant.");
    const old = s.announcements.find((x) => x.id === c.target);
    if (old) {
      find(s.announcements, old.id, c.expectedVersion);
      if (old.status === "Delivered")
        throw Error("Delivered announcements cannot be edited.");
    }
    const channel = text(d.channel);
    if (!["In-app", "Email", "SMS"].includes(channel))
      throw Error("Choose a supported channel.");
    const row = {
      id: old?.id || c.id,
      title: text(d.title),
      body: text(d.body),
      tenantIds: [...new Set(ids)],
      channel,
      scheduled: date(d.scheduled),
      status: "Draft",
      version: (old?.version || 0) + 1,
    };
    if (old) Object.assign(old, row);
    else s.announcements.push(row);
    return;
  }
  const ann = find(s.announcements, c.target, c.expectedVersion);
  if (c.type === "announcement.cancel") {
    if (ann.status === "Delivered")
      throw Error("Delivered announcements cannot be cancelled.");
    text(d.reason);
    ann.status = "Cancelled";
  } else if (c.type === "announcement.schedule") {
    if (ann.status !== "Draft") throw Error("Only a draft can be scheduled.");
    if (Date.parse(ann.scheduled) <= Date.parse(now))
      throw Error("Choose a future delivery time.");
    ann.status = "Scheduled";
  } else if (c.type === "announcement.simulateDelivery") {
    if (!["Draft", "Scheduled"].includes(ann.status))
      throw Error("This announcement cannot be delivered.");
    ann.status = "Delivered";
  } else throw Error("Unknown announcement action.");
  ann.version++;
}
