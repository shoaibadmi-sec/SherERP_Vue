import type { Actor, SaasState } from "../types.ts";
import { can } from "../permissions.ts";
const modules: Record<string, string> = {
  tenant: "tenants",
  plan: "plans",
  subscription: "subscriptions",
  invoice: "billing",
  payment: "payments",
  ticket: "support",
  article: "knowledge",
  access: "support",
  staff: "team",
  role: "team",
  assignment: "team",
  announcement: "announcements",
  service: "services",
};
export function auditEvents(s: SaasState, actor: Actor) {
  return s.audit
    .filter((e) => can(s, actor, "audit.view", e.tenantId || undefined))
    .map((e) => {
      const module = modules[e.action.split(".")[0]] || e.action.split(".")[0];
      return can(s, actor, `${module}.view`, e.tenantId || undefined)
        ? e
        : {
            ...e,
            reason: "",
            before: "Details restricted by module permissions.",
            after: "Details restricted by module permissions.",
          };
    });
}
