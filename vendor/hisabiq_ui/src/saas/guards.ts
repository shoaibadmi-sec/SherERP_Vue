import type { Attachment, Actor, Permission, SaasState } from "./types.ts";
import { can } from "./permissions.ts";
export function requirePermission(
  s: SaasState,
  a: Actor,
  p: Permission,
  tenant?: string,
) {
  if (!can(s, a, p, tenant))
    throw Error("You do not have permission for this action.");
}
export function find<T extends { id: string; version?: number }>(
  rows: T[],
  id?: string,
  version?: number,
): T {
  const row = rows.find((x) => x.id === id);
  if (!row) throw Error("Record not found.");
  if (version !== undefined && row.version !== version)
    throw Error(
      "This record changed. Close and reopen it before trying again.",
    );
  return row;
}
export function text(value: unknown, label = "Value") {
  if (typeof value !== "string" || !value.trim())
    throw Error(`${label} is required.`);
  return value.trim();
}
export function number(value: unknown, label = "Amount", zero = false) {
  const n = Number(value);
  if (!Number.isSafeInteger(n) || (zero ? n < 0 : n <= 0))
    throw Error(
      `${label} must be a ${zero ? "non-negative" : "positive"} whole number.`,
    );
  return n;
}
export function email(v: unknown) {
  const e = text(v, "Email");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
    throw Error("Enter a valid email.");
  return e;
}
export function date(v: unknown) {
  const d = text(v, "Date");
  if (!/^\d{4}-\d{2}-\d{2}(T.*)?$/.test(d) || !Number.isFinite(Date.parse(d)))
    throw Error("Enter a valid date.");
  return d;
}

export function validAttachment(value: unknown): Attachment | undefined {
  if (!value) return undefined;
  const a = value as Attachment;
  if (
    !["image/png", "image/jpeg", "application/pdf"].includes(a.type) ||
    typeof a.data !== "string" ||
    !a.data.startsWith(`data:${a.type};base64,`) ||
    a.data.length > 1400000
  )
    throw Error("Use a PNG, JPEG or PDF smaller than 1 MB.");
  return { name: text(a.name), type: a.type, data: a.data };
}
