import type { SaasState, Actor, SaasCommand } from "../types.ts";
import { find, text, number, requirePermission } from "../guards.ts";
export function smsBalance(s: SaasState, tenant: string, now: string) {
  return s.credits
    .filter(
      (x) =>
        x.tenantId === tenant && (!x.expires || x.expires >= now.slice(0, 10)),
    )
    .reduce((v, x) => v + x.units, 0);
}
export function segments(value: string) {
  const unicode = Array.from(value).some(character => character.charCodeAt(0) > 127);
  const limit = unicode ? 70 : 160;
  return value.length <= limit
    ? 1
    : Math.ceil(value.length / (unicode ? 67 : 153));
}
function reserveCredits(
  s: SaasState,
  tenant: string,
  units: number,
  messageId: string,
  id: string,
  now: string,
) {
  const expiries = [
    ...new Set(
      s.credits
        .filter(
          (c) =>
            c.tenantId === tenant &&
            (!c.expires || c.expires >= now.slice(0, 10)),
        )
        .map((c) => c.expires),
    ),
  ].sort((a, b) => (a || "9999").localeCompare(b || "9999"));
  let remaining = units;
  for (const expires of expiries) {
    const available = s.credits
      .filter((c) => c.tenantId === tenant && c.expires === expires)
      .reduce((n, c) => n + c.units, 0);
    const take = Math.min(remaining, Math.max(0, available));
    if (take) {
      s.credits.push({
        id: `${id}-${expires}`,
        tenantId: tenant,
        units: -take,
        source: "Reservation",
        expires,
        messageId,
      });
      remaining -= take;
    }
  }
  if (remaining) throw Error("Not enough available credits.");
}
export function smsTransition(
  s: SaasState,
  a: Actor,
  c: SaasCommand,
  now: string,
) {
  const d = c.data;
  if (c.type === "sms.templateSave") {
    requirePermission(s, a, "sms.configure");
    const old = s.templates.find((t) => t.id === c.target);
    if (old) find(s.templates, old.id, c.expectedVersion);
    const template = {
      id: old?.id || c.id,
      name: text(d.name),
      text: text(d.text, "Template text"),
      version: (old?.version || 0) + 1,
    };
    if (old) Object.assign(old, template);
    else s.templates.push(template);
    return;
  }
  if (c.type === "sms.packageSave") {
    requirePermission(s, a, "sms.configure");
    const old = s.packages.find((x) => x.id === c.target);
    if (old) find(s.packages, old.id, c.expectedVersion);
    const p = {
      id: old?.id || c.id,
      name: text(d.name),
      units: number(d.units, "Units"),
      price: number(d.price),
      days: number(d.days, "Validity days"),
      version: (old?.version || 0) + 1,
    };
    if (old) Object.assign(old, p);
    else s.packages.push(p);
    return;
  }
  if (c.type === "sms.packageOrder") {
    const tenant = text(d.tenantId);
    requirePermission(s, a, "sms.edit", tenant);
    find(s.tenants, tenant);
    const p = find(s.packages, String(d.packageId));
    s.invoices.push({
      id: `invoice-${c.id}`,
      tenantId: tenant,
      description: `SMS package · ${p.name} · ${p.units} credits`,
      amount: p.price,
      due: now.slice(0, 10),
      status: "Issued",
      purpose: "sms",
      units: p.units,
      validDays: p.days,
      sourceId: p.id,
      fulfilled: false,
      version: 1,
    });
    return;
  }
  if (c.type === "sms.reserve") {
    const tenant = text(d.tenantId);
    requirePermission(s, a, "sms.edit", tenant);
    const recipient = text(d.recipient);
    if (!/^\+?\d{10,15}$/.test(recipient))
      throw Error("Enter a valid recipient phone number.");
    const body = text(d.text, "Message");
    const units = segments(body);
    if (units > smsBalance(s, tenant, now))
      throw Error("Not enough available SMS credits.");
    s.sms.push({
      id: c.id,
      tenantId: tenant,
      recipient,
      text: body,
      units,
      status: "Queued",
      version: 1,
    });
    reserveCredits(s, tenant, units, c.id, c.id, now);
    return;
  }
  const m = find(s.sms, c.target, c.expectedVersion);
  requirePermission(s, a, "sms.edit", m.tenantId);
  if (c.type === "sms.complete") {
    if (a.kind !== "staff")
      throw Error("Only staff can simulate provider delivery.");
    if (m.status !== "Queued") throw Error("Message already completed.");
    if (!["Delivered", "Failed"].includes(String(d.status)))
      throw Error("Choose a delivery result.");
    m.status = String(d.status);
    if (m.status === "Failed" && s.settings.releaseFailed) {
      const expiries = [
        ...new Set(
          s.credits.filter((x) => x.messageId === m.id).map((x) => x.expires),
        ),
      ];
      for (const expires of expiries) {
        const net = s.credits
          .filter((x) => x.messageId === m.id && x.expires === expires)
          .reduce((n, x) => n + x.units, 0);
        if (net < 0)
          s.credits.push({
            id: `${c.id}-${expires}`,
            tenantId: m.tenantId,
            units: -net,
            source: "Failed delivery release",
            expires,
            messageId: m.id,
          });
      }
    }
  } else if (c.type === "sms.retry") {
    if (m.status !== "Failed")
      throw Error("Only failed messages can be retried.");
    const net = s.credits
      .filter((x) => x.messageId === m.id)
      .reduce((v, x) => v + x.units, 0);
    if (net === 0) {
      if (m.units > smsBalance(s, m.tenantId, now))
        throw Error("Not enough credits to retry.");
      reserveCredits(s, m.tenantId, m.units, m.id, c.id, now);
    }
    m.status = "Queued";
  } else throw Error("Unknown SMS action.");
  m.version++;
}
