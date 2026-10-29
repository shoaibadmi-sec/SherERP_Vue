import type { SaasState, Actor, SaasCommand } from "../types.ts";
import { can } from "../permissions.ts";
import {
  find,
  text,
  date,
  requirePermission,
  validAttachment,
} from "../guards.ts";
export function ticketReplies(s: SaasState, a: Actor, id: string) {
  const t = s.tickets.find((x) => x.id === id);
  return t && can(s, a, "support.view", t.tenantId)
    ? s.replies.filter(
        (r) => r.ticketId === id && (a.kind === "staff" || !r.internal),
      )
    : [];
}
export function publicArticles(s: SaasState, a: Actor) {
  return s.articles.filter(
    (x) =>
      a.kind === "staff" ||
      (x.audience === "Public" && x.status === "Published"),
  );
}
export function supportTransition(
  s: SaasState,
  a: Actor,
  c: SaasCommand,
  now: string,
) {
  const d = c.data;
  if (c.type.startsWith("article.")) {
    requirePermission(s, a, "knowledge.edit");
    const old = s.articles.find((x) => x.id === c.target);
    if (old) find(s.articles, old.id, c.expectedVersion);
    if (c.type === "article.publish") {
      if (!old) throw Error("Article not found.");
      old.status = "Published";
      old.version++;
      return;
    }
    const v = {
      id: old?.id || c.id,
      title: text(d.title),
      body: text(d.body),
      audience: d.audience === "Internal" ? "Internal" : "Public",
      status: "Draft",
      version: (old?.version || 0) + 1,
    };
    if (old) Object.assign(old, v);
    else s.articles.push(v);
    return;
  }
  if (c.type === "access.request") {
    const tenant = text(d.tenantId);
    requirePermission(s, a, "support.edit", tenant);
    if (a.kind !== "staff") throw Error("Only staff can request access.");
    const expires = date(d.expires);
    if (
      Date.parse(expires) <= Date.parse(now) ||
      Date.parse(expires) > Date.parse(now) + 86400000
    )
      throw Error("Access must expire within 24 hours.");
    s.grants.push({
      id: c.id,
      tenantId: tenant,
      staffId: a.id,
      reason: text(d.reason),
      scope: text(d.scope),
      expires,
      status: "Requested",
      version: 1,
    });
    return;
  }
  if (c.type.startsWith("access.")) {
    const g = find(s.grants, c.target, c.expectedVersion);
    requirePermission(s, a, "support.edit", g.tenantId);
    if (c.type === "access.consent") {
      if (
        a.kind !== "tenant" ||
        g.status !== "Requested" ||
        Date.parse(g.expires) <= Date.parse(now)
      )
        throw Error("Only the tenant can consent to an unexpired request.");
      g.status = "Consented";
    } else if (c.type === "access.revoke") g.status = "Revoked";
    else throw Error("Unknown access action.");
    g.version++;
    return;
  }
  if (c.type === "ticket.create") {
    const tenant = text(d.tenantId);
    requirePermission(s, a, "support.edit", tenant);
    s.tickets.push({
      id: c.id,
      tenantId: tenant,
      subject: text(d.subject),
      category: text(d.category),
      priority: d.priority === "High" ? "High" : "Normal",
      status: "Open",
      assignee: "",
      due: new Date(Date.parse(now) + 86400000).toISOString().slice(0, 10),
      linked: "",
      version: 1,
    });
    s.replies.push({
      id: `reply-${c.id}`,
      ticketId: c.id,
      tenantId: tenant,
      author: a.id,
      text: text(d.text, "Message"),
      internal: false,
      date: now,
    });
    return;
  }
  const t = find(s.tickets, c.target, c.expectedVersion);
  requirePermission(s, a, "support.edit", t.tenantId);
  if (c.type === "ticket.reply" || c.type === "ticket.note") {
    if (c.type === "ticket.note" && a.kind !== "staff")
      throw Error("Internal notes are staff only.");
    s.replies.push({
      id: c.id,
      ticketId: t.id,
      tenantId: t.tenantId,
      author: a.id,
      text: text(d.text, "Message"),
      attachment: validAttachment(d.attachment),
      internal: c.type === "ticket.note",
      date: now,
    });
  } else if (c.type === "ticket.assign") {
    requirePermission(s, a, "support.assign", t.tenantId);
    const person = find(s.staff, String(d.assignee));
    if (!can(s, { kind: "staff", id: person.id }, "support.edit", t.tenantId))
      throw Error("Choose an employee with support access for this tenant.");
    t.assignee = person.id;
    t.priority = d.priority === "High" ? "High" : "Normal";
    t.linked = String(d.linked || "");
  } else if (c.type === "ticket.transition") {
    const status = text(d.status);
    if (
      ![
        "Open",
        "In progress",
        "Waiting for tenant",
        "Waiting internally",
        "Resolved",
        "Closed",
      ].includes(status)
    )
      throw Error("Invalid ticket status.");
    if (a.kind === "tenant" && !["Open", "Resolved"].includes(status))
      throw Error("Tenants may reopen or resolve their tickets.");
    t.status = status;
  } else throw Error("Unknown support action.");
  t.version++;
}
