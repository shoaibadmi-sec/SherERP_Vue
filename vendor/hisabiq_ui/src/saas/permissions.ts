import type { Actor, Permission, SaasState } from "./types.ts";
export const catalog: Record<string, string[]> = {
  tenants: ["view", "edit"],
  plans: ["view", "edit"],
  subscriptions: ["view", "edit"],
  billing: ["view", "edit"],
  payments: ["view", "submit", "verify", "refund"],
  sms: ["view", "edit", "configure"],
  services: ["view", "edit", "configure"],
  support: ["view", "edit", "assign"],
  knowledge: ["view", "edit"],
  team: ["view", "edit"],
  announcements: ["view", "edit"],
  reports: ["view", "export"],
  audit: ["view"],
  settings: ["view", "edit"],
};
export const allPermissions = Object.entries(catalog).flatMap(([m, a]) =>
  a.map((x) => `${m}.${x}` as Permission),
);
export function withViews(p: Permission[]): Permission[] {
  return [
    ...new Set(p.flatMap((x) => [x, `${x.split(".")[0]}.view` as Permission])),
  ];
}
export function can(
  s: SaasState,
  a: Actor,
  p: Permission,
  tenantId?: string,
): boolean {
  if (a.kind === "tenant")
    return (
      !!tenantId &&
      tenantId === a.tenantId &&
      s.tenants.some(
        (t) =>
          t.id === tenantId &&
          a.id === `owner-${t.id}` &&
          t.status !== "Archived",
      ) &&
      [
        "tenants.view",
        "subscriptions.view",
        "billing.view",
        "payments.view",
        "payments.submit",
        "sms.view",
        "sms.edit",
        "services.view",
        "services.edit",
        "support.view",
        "support.edit",
        "knowledge.view",
      ].includes(p)
    );
  const staff = s.staff.find((x) => x.id === a.id);
  if (!staff || staff.status !== "Active") return false;
  return s.assignments.some(
    (g) =>
      g.staffId === a.id &&
      (g.tenantIds === "all" ||
        (!!tenantId && g.tenantIds.includes(tenantId))) &&
      s.roles.some((r) => r.id === g.roleId && r.permissions.includes(p)),
  );
}
export function allowed(s: SaasState, a: Actor, p: Permission) {
  if (["team", "plans", "settings", "announcements"].includes(p.split(".")[0]))
    return can(s, a, p);
  return can(s, a, p) || s.tenants.some((t) => can(s, a, p, t.id));
}
export function visibleTenantIds(s: SaasState, a: Actor) {
  return s.tenants
    .filter((t) => can(s, a, "tenants.view", t.id))
    .map((t) => t.id);
}
