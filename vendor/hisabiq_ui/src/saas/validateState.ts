import type { SaasState } from "./types.ts";
import { seed } from "./seed.ts";
import { allPermissions } from "./permissions.ts";
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const fields = (v: unknown, shape: Record<string, string>) =>
  object(v) &&
  Object.entries(shape).every(
    ([key, type]) =>
      typeof v[key] === type && (type !== "number" || Number.isFinite(v[key])),
  );
const shapes: Record<string, Record<string, string>> = {
  receipts: {
    id: "string",
    paymentId: "string",
    tenantId: "string",
    amount: "number",
    date: "string",
  },
  allocations: {
    id: "string",
    receiptId: "string",
    invoiceId: "string",
    tenantId: "string",
    amount: "number",
  },
  adjustments: {
    id: "string",
    receiptId: "string",
    tenantId: "string",
    amount: "number",
    reason: "string",
    kind: "string",
    date: "string",
  },
  sms: {
    id: "string",
    tenantId: "string",
    recipient: "string",
    text: "string",
    units: "number",
    status: "string",
    version: "number",
  },
  grants: {
    id: "string",
    tenantId: "string",
    staffId: "string",
    reason: "string",
    scope: "string",
    expires: "string",
    status: "string",
    version: "number",
  },
  announcements: {
    id: "string",
    title: "string",
    body: "string",
    channel: "string",
    scheduled: "string",
    status: "string",
    version: "number",
  },
  audit: {
    id: "string",
    actor: "string",
    action: "string",
    target: "string",
    tenantId: "string",
    date: "string",
    reason: "string",
    before: "string",
    after: "string",
  },
};
export function validState(value: unknown): value is SaasState {
  if (!object(value) || value.version !== 1) return false;
  const base = seed();
  for (const [key, sample] of Object.entries(base)) {
    if (!Array.isArray(sample)) continue;
    const rows = value[key];
    if (!Array.isArray(rows)) return false;
    if (key === "completed") {
      if (!rows.every((x) => typeof x === "string")) return false;
      continue;
    }
    const shape =
      shapes[key] ||
      (sample[0] &&
        Object.fromEntries(
          Object.entries(sample[0])
            .filter(([field, v]) => !Array.isArray(v) && !(key === "assignments" && field === "tenantIds"))
            .map(([k, v]) => [k, typeof v]),
        ));
    if (shape && !rows.every((row) => fields(row, shape))) return false;
    if (
      key !== "assignments" &&
      new Set(rows.map((r) => r.id)).size !== rows.length
    )
      return false;
  }
  const s = value as unknown as SaasState;
  if (
    !fields(s.settings, {
      timezone: "string",
      currency: "string",
      grace: "number",
      releaseFailed: "boolean",
      collectionAccount: "string",
    }) ||
    !s.staff.length ||
    !s.roles.length
  )
    return false;
  if (
    !s.roles.every(
      (r) =>
        Array.isArray(r.permissions) &&
        r.permissions.every((p) => allPermissions.includes(p)),
    )
  )
    return false;
  if (
    !s.assignments.every(
      (g) =>
        s.staff.some((x) => x.id === g.staffId) &&
        s.roles.some((x) => x.id === g.roleId) &&
        (g.tenantIds === "all" ||
          (Array.isArray(g.tenantIds) &&
            g.tenantIds.every(
              (t) => typeof t === "string" && s.tenants.some((x) => x.id === t),
            ))),
    )
  )
    return false;
  if (
    !s.staff.some(
      (e) =>
        e.owner &&
        e.status === "Active" &&
        s.assignments.some(
          (g) =>
            g.staffId === e.id && g.roleId === "owner" && g.tenantIds === "all",
        ),
    )
  )
    return false;
  const enums: Record<string, string[]> = {
    tenants: ["Active", "Suspended", "Archived", "Provisioning"],
    staff: ["Active", "Pending", "Disabled", "Expired", "Revoked"],
    plans: ["Draft", "Published", "Retired"],
    subscriptions: ["Trial", "Active", "Grace", "Expired", "Cancelled"],
    invoices: ["Issued", "Part paid", "Paid", "Voided"],
    payments: ["Pending", "Needs information", "Verified", "Rejected"],
    sms: ["Queued", "Delivered", "Failed"],
    orders: [
      "Requested",
      "Quoted",
      "Approved",
      "Scheduled",
      "In progress",
      "Completed",
      "Cancelled",
    ],
    tickets: [
      "Open",
      "In progress",
      "Waiting for tenant",
      "Waiting internally",
      "Resolved",
      "Closed",
    ],
    announcements: ["Draft", "Scheduled", "Cancelled", "Delivered"],
  };
  for (const [key, statuses] of Object.entries(enums)) {
    if (
      !(value[key] as { status: string }[]).every((r) =>
        statuses.includes(r.status),
      )
    )
      return false;
  }
  for (const rows of Object.values(value).filter(Array.isArray)) {
    for (const row of rows) {
      if (!object(row)) continue;
      if (
        typeof row.tenantId === "string" &&
        row.tenantId &&
        !s.tenants.some((t) => t.id === row.tenantId)
      )
        return false;
      for (const key of ["date", "due", "renewal", "expires", "scheduled"]) {
        const v = row[key];
        if (
          typeof v === "string" &&
          v &&
          key !== "scheduled" &&
          !Number.isFinite(Date.parse(v))
        )
          return false;
      }
      if (row.evidence) {
        const e = row.evidence;
        if (!fields(e, { name: "string", type: "string", data: "string" }))
          return false;
        const attachment = e as { type: string; data: string };
        if (
          !["image/png", "image/jpeg", "application/pdf"].includes(
            attachment.type,
          ) ||
          !attachment.data.startsWith(`data:${attachment.type};base64,`)
        )
          return false;
      }
    }
  }
  if (
    !s.payments.every((p) =>
      s.invoices.some((i) => i.id === p.invoiceId && i.tenantId === p.tenantId),
    )
  )
    return false;
  if (!s.subscriptions.every((x) => s.plans.some((p) => p.id === x.planId)))
    return false;
  if (
    !s.receipts.every((r) =>
      s.payments.some((p) => p.id === r.paymentId && p.tenantId === r.tenantId),
    )
  )
    return false;
  if (
    !s.allocations.every(
      (a) =>
        s.receipts.some(
          (r) => r.id === a.receiptId && r.tenantId === a.tenantId,
        ) &&
        s.invoices.some(
          (i) => i.id === a.invoiceId && i.tenantId === a.tenantId,
        ),
    )
  )
    return false;
  if (
    !s.adjustments.every((a) =>
      s.receipts.some((r) => r.id === a.receiptId && r.tenantId === a.tenantId),
    )
  )
    return false;
  if (
    !s.replies.every((r) =>
      s.tickets.some((t) => t.id === r.ticketId && t.tenantId === r.tenantId),
    )
  )
    return false;
  if (
    !s.announcements.every(
      (a) =>
        Array.isArray(a.tenantIds) &&
        a.tenantIds.every((id) => s.tenants.some((t) => t.id === id)) &&
        Number.isFinite(Date.parse(a.scheduled)),
    )
  )
    return false;
  return true;
}
