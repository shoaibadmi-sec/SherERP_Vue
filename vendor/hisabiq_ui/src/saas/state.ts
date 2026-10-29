import type { Actor, SaasCommand, SaasState, CommandResult } from "./types.ts";
import { validState } from "./validateState.ts";
import { seed } from "./seed.ts";
import { adminTransition } from "./admin/transitions.ts";
import { supportTransition } from "./support/transitions.ts";
import { smsTransition } from "./messaging/transitions.ts";
import { serviceTransition } from "./services/transitions.ts";
import { billingTransition } from "./billing/transitions.ts";
import { tenantTransition } from "./tenants/transitions.ts";
import { teamTransition } from "./admin/teamTransitions.ts";
export const STORAGE_KEY = "hisabiq-saas-v1";
export function applyCommand(
  state: SaasState,
  actor: Actor,
  c: SaasCommand,
  now: string,
): CommandResult {
  try {
    if (state.completed.includes(c.id)) return { ok: true, state };
    const s = structuredClone(state);
    const beforeRow = record(state, c.target, c.type);
    const before = JSON.stringify(beforeRow);
    if (/^(staff|role|assignment)\./.test(c.type)) teamTransition(s, actor, c);
    else if (c.type.startsWith("tenant.")) tenantTransition(s, actor, c, now);
    else if (/^(plan|subscription|invoice|payment)\./.test(c.type))
      billingTransition(s, actor, c, now);
    else if (c.type.startsWith("sms.")) smsTransition(s, actor, c, now);
    else if (c.type.startsWith("service.")) serviceTransition(s, actor, c, now);
    else if (/^(ticket|article|access)\./.test(c.type))
      supportTransition(s, actor, c, now);
    else if (/^(announcement|settings)\./.test(c.type))
      adminTransition(s, actor, c, now);
    else throw Error("Unknown action.");
    s.completed.push(c.id);
    s.audit.unshift({
      id: c.id,
      actor: actor.id,
      action: c.type,
      target: c.target || c.id,
      tenantId: tenantOf(s, c, beforeRow),
      date: now,
      reason: String(c.data.reason || ""),
      before,
      after: JSON.stringify(
        record(s, c.target || c.id, c.type) || sanitize(c.data),
      ),
    });
    return { ok: true, state: s };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Unable to save.",
    };
  }
}
export function readState(storage: Pick<Storage, "getItem">): {
  state: SaasState;
  error: string;
} {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return { state: seed(), error: "" };
    const s = JSON.parse(raw);
    if (s && s.version === 1 && !s.templates) s.templates = seed().templates;
    if (!validState(s)) throw Error();
    return { state: s, error: "" };
  } catch {
    return {
      state: seed(),
      error:
        "Saved demo data could not be read. Demo defaults loaded; the next successful save replaces invalid data.",
    };
  }
}
export function writeState(
  storage: Pick<Storage, "setItem">,
  state: SaasState,
): string {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
    return "";
  } catch {
    return "Changes are in memory only: browser storage is unavailable or full. Download evidence elsewhere before resetting.";
  }
}

function sanitize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitize);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => key !== "evidence" && key !== "attachment")
        .map(([key, v]) => [key, sanitize(v)]),
    );
  return value;
}
function record(
  s: SaasState,
  id: string | undefined,
  type: string,
): Record<string, unknown> | null {
  if (type === "settings.update") return { ...s.settings };
  const row = Object.values(s)
    .filter(Array.isArray)
    .flat()
    .find(
      (r: unknown) => r && typeof r === "object" && "id" in r && r.id === id,
    );
  return row ? (sanitize(row) as Record<string, unknown>) : null;
}
function tenantOf(
  s: SaasState,
  c: SaasCommand,
  before: Record<string, unknown> | null,
): string {
  if (c.type.startsWith("tenant.")) return c.target || c.id;
  const row = record(s, c.target || c.id, c.type) || before;
  return String(row?.tenantId || c.data.tenantId || "");
}
