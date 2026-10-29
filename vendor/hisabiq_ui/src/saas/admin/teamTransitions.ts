import type {
  Actor,
  SaasCommand,
  SaasState,
  Permission,
  Assignment,
} from "../types.ts";
import { can, allPermissions, withViews } from "../permissions.ts";
import { find, text, email, requirePermission } from "../guards.ts";
export function teamTransition(s: SaasState, a: Actor, c: SaasCommand) {
  requirePermission(s, a, "team.edit");
  const me = find(s.staff, a.id);
  const d = c.data;
  if (c.type.startsWith("role.")) {
    const old = s.roles.find((x) => x.id === c.target);
    if (old?.id === "owner" && !me.owner)
      throw Error("Only an owner can change owner authority.");
    if (c.type === "role.delete") {
      if (old?.id === "owner") throw Error("The owner role cannot be deleted.");
      if (s.assignments.some((x) => x.roleId === c.target))
        throw Error("Reassign employees before deleting this role.");
      s.roles = s.roles.filter((x) => x.id !== c.target);
      return;
    }
    if (old?.id === "owner")
      throw Error(
        "Owner authority is protected. Duplicate this role to create a configurable admin role.",
      );
    const ps = withViews(
      (Array.isArray(d.permissions) ? d.permissions : []) as Permission[],
    );
    if (
      ps.some(
        (x) => !allPermissions.includes(x) || (!me.owner && !can(s, a, x)),
      )
    )
      throw Error("You cannot delegate these permissions.");
    if (old) find(s.roles, c.target, c.expectedVersion);
    const row = {
      id: old?.id || c.id,
      name: text(d.name, "Role name"),
      permissions: ps,
      version: (old?.version || 0) + 1,
    };
    if (old) Object.assign(old, row);
    else s.roles.push(row);
    return;
  }
  const old = s.staff.find((x) => x.id === c.target);
  if (old) find(s.staff, c.target, c.expectedVersion);
  if (c.type === "staff.invite") {
    const mail = email(d.email);
    if (s.staff.some((x) => x.email.toLowerCase() === mail.toLowerCase()))
      throw Error("This email already has an invitation or account.");
    s.staff.push({
      id: c.id,
      name: text(d.name, "Name"),
      email: mail,
      status: "Pending",
      owner: false,
      version: 1,
      sessionVersion: 1,
    });
    return;
  }
  if (!old) throw Error("Employee not found.");
  if (old.owner && !me.owner)
    throw Error("Only an owner can manage another owner.");
  if (c.type === "assignment.save") {
    if (!Array.isArray(d.assignments)) throw Error("Choose roles.");
    const grants = d.assignments as Assignment[];
    for (const g of grants) {
      const role = find(s.roles, g.roleId);
      if (role.id === "owner" && !me.owner)
        throw Error("Owner assignment is owner-only.");
      if (role.permissions.some((p) => !me.owner && !can(s, a, p)))
        throw Error("You cannot delegate these permissions.");
      if (
        g.tenantIds !== "all" &&
        (!Array.isArray(g.tenantIds) ||
          !g.tenantIds.length ||
          g.tenantIds.some((t) => !s.tenants.some((x) => x.id === t)))
      )
        throw Error("Select a valid tenant scope.");
    }
    if (
      old.owner &&
      !grants.some((g) => g.roleId === "owner" && g.tenantIds === "all")
    )
      throw Error("Owner accounts must retain owner authority.");
    s.assignments = s.assignments
      .filter((g) => g.staffId !== old.id)
      .concat(grants.map((g) => ({ ...g, staffId: old.id })));
    old.owner = grants.some(
      (g) => g.roleId === "owner" && g.tenantIds === "all",
    );
    old.version++;
    return;
  }
  if (c.type === "staff.disable") {
    if (
      old.owner &&
      s.staff.filter((x) => x.owner && x.status === "Active").length <= 1
    )
      throw Error("The last active owner cannot be disabled.");
    old.status = "Disabled";
    old.sessionVersion++;
  } else if (c.type === "staff.revokeSessions") old.sessionVersion++;
  else if (c.type === "staff.update") {
    old.name = text(d.name || old.name);
    old.email = email(d.email || old.email);
    if (d.status) {
      if (
        !["Active", "Pending", "Expired", "Revoked"].includes(String(d.status))
      )
        throw Error("Invalid staff status.");
      if (
        old.owner &&
        d.status !== "Active" &&
        s.staff.filter((x) => x.owner && x.status === "Active").length <= 1
      )
        throw Error("The last active owner cannot be deactivated.");
      old.status = String(d.status);
    }
  } else throw Error("Unknown staff action.");
  old.version++;
}
