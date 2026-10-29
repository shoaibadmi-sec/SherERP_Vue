import type {
  BusinessRole,
  TeamSettings,
  SettingsPermission,
} from "./model.ts";
// Ported from nestshererp b1bad299, core-contracts/permissions.ts; legacy grants stay explicit.
export const permissionCatalogue = [
  {
    code: "user.account.view",
    group: "People",
    label: "See the user list",
    detail: "Open the Users screen and see who works here.",
  },
  {
    code: "user.account.create",
    group: "People",
    label: "Add users",
    detail: "Create an account for someone new.",
  },
  {
    code: "user.account.edit",
    group: "People",
    label: "Edit users",
    detail: "Change a name, or move someone to a different role.",
  },
  {
    code: "user.account.disable",
    group: "People",
    label: "Disable users",
    detail:
      "Stop an account signing in, and sign it out everywhere when connected.",
  },
  {
    code: "user.role.view",
    group: "Roles",
    label: "See roles",
    detail: "Open the Roles screen and see what each role may do.",
  },
  {
    code: "user.role.manage",
    group: "Roles",
    label: "Change what roles may do",
    detail:
      "Create roles and change their permissions. This changes what other people can do.",
  },
  {
    code: "settings.setting.view",
    group: "Settings",
    label: "See settings",
    detail: "See how the business is set up.",
  },
  {
    code: "settings.setting.edit",
    group: "Settings",
    label: "Change settings",
    detail:
      "Change business preferences. Transaction policy needs its consuming service.",
  },
  {
    code: "settings.module.toggle",
    group: "Settings",
    label: "Turn features on and off",
    detail:
      "Change eligible module availability for everyone; this does not buy a feature.",
  },
  {
    code: "audit.event.view",
    group: "Audit",
    label: "See the audit trail",
    detail:
      "Read who changed settings and what changed. Audit cannot be edited.",
  },
] as const;
export type RbacPermission = (typeof permissionCatalogue)[number]["code"];
export const systemRoleIds = [
  "owner",
  "manager",
  "cashier",
  "storekeeper",
  "accountant",
  "viewer",
];
export function effectivePermissions(
  team: TeamSettings,
  actorId: string,
): SettingsPermission[] {
  const actor = team.employees.find((e) => e.id === actorId && e.active);
  if (!actor) return [];
  const values = new Set<SettingsPermission>();
  for (const role of team.roles.filter((r) => actor.roleIds.includes(r.id))) {
    for (const p of role.permissions) values.add(p);
    if (role.id === "owner")
      permissionCatalogue.forEach((p) => values.add(p.code));
    // Existing named settings grants retain their scope; only explicit team authority maps to user/role management.
    if (role.permissions.includes("view")) {
      values.add("settings.setting.view");
      values.add("user.role.view");
      values.add("user.account.view");
    }
    if (role.permissions.includes("team"))
      for (const p of permissionCatalogue.filter(
        (p) => p.group === "People" || p.group === "Roles",
      ))
        values.add(p.code);
  }
  return [...values];
}
export function roleImpact(team: TeamSettings, next: BusinessRole) {
  const before = team.roles.find((r) => r.id === next.id);
  return {
    added: next.permissions.filter((p) => !before?.permissions.includes(p)),
    removed: (before?.permissions ?? []).filter(
      (p) => !next.permissions.includes(p),
    ),
    affectedMembers: team.employees
      .filter((e) => e.active && e.roleIds.includes(next.id))
      .map((e) => e.name),
  };
}
export function validateRoleChange(
  team: TeamSettings,
  next: BusinessRole | null,
  actorId: string,
  deleteId?: string,
): string | null {
  const held = effectivePermissions(team, actorId);
  if (!held.includes("user.role.manage")) return "You cannot manage roles.";
  if (!next) {
    if (systemRoleIds.includes(deleteId ?? ""))
      return "Built-in system roles cannot be deleted.";
    if (team.employees.some((e) => e.roleIds.includes(deleteId ?? "")))
      return "Reassign assigned members before deleting this role.";
    return null;
  }
  if (!next.name.trim() || next.name.trim().length < 2 || next.name.length > 60)
    return "Role name must be 2–60 characters.";
  if (
    team.roles.some(
      (r) =>
        r.id !== next.id &&
        r.name.trim().toLowerCase() === next.name.trim().toLowerCase(),
    )
  )
    return "Use a unique role name.";
  const before = team.roles.find((r) => r.id === next.id);
  if (
    next.id === "owner" &&
    before?.permissions.some((p) => !next.permissions.includes(p))
  )
    return "The owner role is protected and always retains full access.";
  const isOwner = team.employees
    .find((e) => e.id === actorId)
    ?.roleIds.includes("owner");
  if (
    !isOwner &&
    next.permissions.some(
      (p) => !before?.permissions.includes(p) && !held.includes(p),
    )
  )
    return "You cannot grant permissions beyond your delegated authority.";
  return null;
}
