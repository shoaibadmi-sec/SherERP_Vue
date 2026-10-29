import { AppDatePicker } from "../components/AppDateRangePicker";
import { businessToday } from "../utils/dateRange";
import { EmployeeDirectory } from "./EmployeeDirectory";
import { useState, useId } from "react";
import { Plus, ShieldCheck, LockKeyhole } from "lucide-react";
import { Button, Input, SettingsDialog, SettingsField } from "./ui";
import { SettingsTabs } from "./SettingsTabs";
import {
  permissions,
  canManage,
  type BusinessRole,
  type BusinessEmployee,
  type TeamSettings as TeamData,
  type TenantSettings,
} from "./model";
import {
  permissionCatalogue,
  effectivePermissions,
  roleImpact,
  validateRoleChange,
  systemRoleIds,
} from "./rbac";
import { sectionNames } from "./fields";
const permissionLabel = (code: string) =>
  permissionCatalogue.find((p) => p.code === code)?.label ??
  (code === "view"
    ? "View settings"
    : code === "export"
      ? "Download settings backup"
      : code === "import"
        ? "Restore settings backup"
        : (sectionNames[code as keyof typeof sectionNames]?.label ?? code));
export function TeamSettings({
  value,
  onChange,
  disabled,
  state,
  actorId,
  language = "English + Bangla",
}: {
  value: TeamData;
  onChange: (value: TeamData) => void;
  disabled: boolean;
  advanced: boolean;
  state: TenantSettings;
  actorId: string;
  language?: string;
}) {
  const [tab, setTab] = useState("employees"),
    [role, setRole] = useState<BusinessRole | null>(null),
    [employee, setEmployee] = useState<BusinessEmployee | null>(null),
    [access, setAccess] = useState<BusinessEmployee | null>(null),
    [error, setError] = useState(""),
    [ack, setAck] = useState(false);
  const tabsId = "team-" + useId().replace(/:/g, "");
  const authority = effectivePermissions(state.sections.team, actorId);
  const canSeeUsers = authority.includes("user.account.view");
  const canSeeRoles = authority.includes("user.role.view");
  const activeTab = (tab === "employees" ? canSeeUsers : canSeeRoles)
    ? tab
    : canSeeUsers
      ? "employees"
      : canSeeRoles
        ? "roles"
        : null;
  const canRoles = !disabled && authority.includes("user.role.manage");
  const canCreate = !disabled && authority.includes("user.account.create");
  const close = () => {
    setRole(null);
    setEmployee(null);
    setError("");
    setAck(false);
  };
  const openRole = (r?: BusinessRole) => {
    setRole(
      r
        ? structuredClone(r)
        : { id: crypto.randomUUID(), name: "", permissions: [] },
    );
    setError("");
    setAck(false);
  };
  const openEmployee = (e?: BusinessEmployee) => {
    setEmployee(
      e
        ? structuredClone(e)
        : {
            id: crypto.randomUUID(),
            name: "",
            email: "",
            joinedDate: businessToday(),
            roleIds: ["cashier"],
            active: true,
          },
    );
    setError("");
  };
  const preview = { ...state, sections: { ...state.sections, team: value } };
  const groups = [...new Set(permissionCatalogue.map((p) => p.group))];
  const tabs = ["employees", "roles"].filter((t) =>
    t === "employees" ? canSeeUsers : canSeeRoles,
  );
  const impact = role ? roleImpact(value, role) : null;
  return (
    <div className="space-y-4">
      <div className="min-w-0 space-y-4">
        <SettingsTabs
          id={tabsId}
          panelId={`${tabsId}-panel`}
          label="Employee settings views"
          libraryTitle={language === "Bangla" ? "কর্মীর সেটিংস" : "Employee settings"}
          libraryGroup={language === "Bangla" ? "প্রবেশাধিকার" : "Access management"}
          secondary={false}
          language={language}
          items={tabs.map((id) => ({
            id,
            label: id === "employees" ? "Employees" : "Roles & permissions",
            bn: id === "employees" ? "কর্মী" : "ভূমিকা",
          }))}
          value={activeTab ?? ""}
          onChange={setTab}
        />
        <div className="min-w-0 space-y-4">
          {activeTab === "roles" && (<div className="flex justify-end">
            {activeTab && (activeTab === "roles" ? canRoles : canCreate) && (
              <Button
                onClick={() =>
                  activeTab === "roles" ? openRole() : openEmployee()
                }
              >
                <Plus className="size-4" />
                {activeTab === "roles" ? "Create role" : "Add demo employee"}
              </Button>
            )}
          </div>)}
          <div
            role="tabpanel"
            id={`${tabsId}-panel`}
            aria-labelledby={activeTab ? `${tabsId}-${activeTab}` : undefined}
          >
            {!activeTab ? (
              <p role="status" className="text-xs text-helper">
                User and role lists require their separate view permissions.
              </p>
            ) : activeTab === "employees" ? (
              <EmployeeDirectory value={value} canEdit={!disabled && authority.includes("user.account.edit")} onAccess={setAccess} onEdit={openEmployee} language={language}
                actions={canCreate ? <Button onClick={() => openEmployee()}><Plus className="size-4" />Add demo employee</Button> : null} />
            ) : (
              <>
                <p className="text-xs text-helper">
                  {value.roles.length} roles ·{" "}
                  {value.employees.filter((e) => e.active).length} active people
                  ·{" "}
                  {
                    value.roles.filter((r) => !systemRoleIds.includes(r.id))
                      .length
                  }{" "}
                  custom roles
                </p>
                <div className="mt-3 grid gap-3 lg:grid-cols-2">
                  {value.roles.map((r) => (
                    <section
                      key={r.id}
                      className="rounded-xl border border-border bg-card p-4"
                    >
                      <header className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <ShieldCheck className="size-5 text-primary" />
                          <div>
                            <h4 className="text-sm font-semibold">{r.name}</h4>
                            <p className="text-xs text-helper">
                              {
                                value.employees.filter(
                                  (e) => e.active && e.roleIds.includes(r.id),
                                ).length
                              }{" "}
                              people hold this
                            </p>
                          </div>
                        </div>
                        <span className="text-[11px] text-helper">
                          {r.id === "owner"
                            ? "Always full access"
                            : systemRoleIds.includes(r.id)
                              ? "Built in"
                              : "Custom"}
                        </span>
                      </header>
                      <ul className="mt-3 space-y-1 text-xs">
                        {r.permissions.slice(0, 6).map((p) => (
                          <li key={p}>✓ {permissionLabel(p)}</li>
                        ))}
                      </ul>
                      {r.permissions.length > 6 && (
                        <p className="mt-1 text-xs text-helper">
                          + {r.permissions.length - 6} more permissions
                        </p>
                      )}
                      {!r.permissions.length && (
                        <p className="mt-3 text-xs text-helper">
                          No permissions assigned.
                        </p>
                      )}
                      {canRoles && (
                        <div className="mt-3 flex gap-2">
                          <Button variant="outline" onClick={() => openRole(r)}>
                            {r.id === "owner" ? "Rename" : "Edit role"}
                          </Button>
                          {!systemRoleIds.includes(r.id) && (
                            <Button
                              variant="ghost"
                              onClick={() => {
                                const reason = validateRoleChange(
                                  value,
                                  null,
                                  actorId,
                                  r.id,
                                );
                                if (reason) {
                                  setError(reason);
                                  return;
                                }
                                onChange({
                                  ...value,
                                  roles: value.roles.filter(
                                    (x) => x.id !== r.id,
                                  ),
                                });
                              }}
                            >
                              Delete unused role
                            </Button>
                          )}
                        </div>
                      )}
                    </section>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <p className="text-xs text-helper">{language === "Bangla" ? "সংরক্ষণ করুন চাপার আগে পরিবর্তন খসড়ায় থাকে। ভূমিকার অনুমতি এই ব্যবসার জন্য প্রযোজ্য।" : "Changes stay in your draft until you choose Save changes. Role permissions apply to this business."}</p>
      {error && !role && !employee && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <SettingsDialog
        title={
          role
            ? value.roles.some((r) => r.id === role.id)
              ? "Configure role"
              : "Create role"
            : "Configure role"
        }
        description="Protected owner, separate capabilities and affected-member review. Save the section to apply this draft."
        open={!!role}
        onClose={close}
      >
        {role && (
          <div className="space-y-4">
            <SettingsField label="Role name" bn="ভূমিকার নাম">
              {(id) => (
                <Input
                  id={id}
                  aria-label="Role name"
                  value={role.name}
                  maxLength={60}
                  onChange={(e) => setRole({ ...role, name: e.target.value })}
                />
              )}
            </SettingsField>
            {role.id === "owner" ? (
              <p className="flex items-center gap-2 text-xs text-helper">
                <LockKeyhole className="size-4" />
                Owner can be renamed, never deleted or deprived of permissions.
              </p>
            ) : (
              <>
                {groups.map((group) => (
                  <fieldset
                    key={group}
                    className="space-y-2 border-t border-border pt-3"
                  >
                    <legend className="text-sm font-medium">{group}</legend>
                    {permissionCatalogue
                      .filter((p) => p.group === group)
                      .map((p) => (
                        <label
                          key={p.code}
                          className="flex items-start gap-2 text-[13px]"
                        >
                          <input
                            type="checkbox"
                            checked={role.permissions.includes(p.code)}
                            disabled={!authority.includes(p.code)}
                            onChange={(e) =>
                              setRole({
                                ...role,
                                permissions: e.target.checked
                                  ? [...role.permissions, p.code]
                                  : role.permissions.filter(
                                      (x) => x !== p.code,
                                    ),
                              })
                            }
                          />
                          <span>
                            {p.label}
                            <span className="block text-xs text-helper">
                              {p.detail}
                            </span>
                          </span>
                        </label>
                      ))}
                  </fieldset>
                ))}
                <details>
                  <summary className="cursor-pointer text-sm font-medium">
                    Module-specific settings access
                  </summary>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {permissions
                      .filter(
                        (p) => !permissionCatalogue.some((c) => c.code === p),
                      )
                      .map((p) => (
                        <label
                          key={p}
                          className="flex items-center gap-2 text-xs"
                        >
                          <input
                            type="checkbox"
                            checked={role.permissions.includes(p)}
                            disabled={p === "import" || !authority.includes(p)}
                            onChange={(e) =>
                              setRole({
                                ...role,
                                permissions: e.target.checked
                                  ? [...role.permissions, p]
                                  : role.permissions.filter((x) => x !== p),
                              })
                            }
                          />
                          {permissionLabel(p)}
                        </label>
                      ))}
                  </div>
                </details>
              </>
            )}
            <div className="rounded-lg border border-border p-3 text-xs">
              <p className="font-medium">Change impact</p>
              <p>
                {impact?.affectedMembers.length
                  ? impact.affectedMembers.join(", ")
                  : "No current members"}
              </p>
              <p>
                Added: {impact?.added.map(permissionLabel).join(", ") || "None"}
              </p>
              <p>
                Removed:{" "}
                {impact?.removed.map(permissionLabel).join(", ") || "None"}
              </p>
            </div>
            <label className="flex items-start gap-2 text-xs">
              <input
                type="checkbox"
                checked={ack}
                onChange={(e) => setAck(e.target.checked)}
              />
              I reviewed who is affected. Apply only to the local UI preview.
            </label>
            {error && (
              <p role="alert" className="text-sm text-danger">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={close}>
                Cancel
              </Button>
              <Button
                disabled={!ack || !canRoles}
                onClick={() => {
                  const reason = validateRoleChange(value, role, actorId);
                  if (reason) {
                    setError(reason);
                    return;
                  }
                  onChange({
                    ...value,
                    roles: [
                      ...value.roles.filter((r) => r.id !== role.id),
                      { ...role, name: role.name.trim() },
                    ],
                  });
                  close();
                }}
              >
                Keep role draft
              </Button>
            </div>
          </div>
        )}
      </SettingsDialog>
      <SettingsDialog
        title={
          employee && value.employees.some((e) => e.id === employee.id)
            ? "Edit employee"
            : "Add demo employee"
        }
        description="Assign one or more existing roles. No invitation is sent from this preview."
        open={!!employee}
        onClose={close}
      >
        {employee && (
          <div className="space-y-4">
            <SettingsField label="Employee name" bn="কর্মীর নাম">
              {(id) => (
                <Input
                  id={id}
                  value={employee.name}
                  onChange={(e) =>
                    setEmployee({ ...employee, name: e.target.value })
                  }
                />
              )}
            </SettingsField>
            <SettingsField label="Employee email" bn="কর্মীর ইমেইল">
              {(id) => (
                <Input
                  id={id}
                  type="email"
                  value={employee.email}
                  onChange={(e) =>
                    setEmployee({ ...employee, email: e.target.value })
                  }
                />
              )}
            </SettingsField>
            <SettingsField label="Joined date" bn="যোগদানের তারিখ">
              {() => <AppDatePicker label="Joined date" value={employee.joinedDate ?? ""} onChange={joinedDate => setEmployee({ ...employee, joinedDate })} />}
            </SettingsField>
            <p className="text-xs text-helper">Leave blank when the original joining date is unknown.</p>
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Assigned roles</legend>
              {value.roles.map((r) => (
                <label
                  key={r.id}
                  className="flex items-center gap-2 text-[13px]"
                >
                  <input
                    type="checkbox"
                    disabled={
                      r.id === "owner" &&
                      !state.sections.team.employees
                        .find((e) => e.id === actorId)
                        ?.roleIds.includes("owner")
                    }
                    checked={employee.roleIds.includes(r.id)}
                    onChange={(e) =>
                      setEmployee({
                        ...employee,
                        roleIds: e.target.checked
                          ? [...employee.roleIds, r.id]
                          : employee.roleIds.filter((x) => x !== r.id),
                      })
                    }
                  />
                  {r.name}
                </label>
              ))}
            </fieldset>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={employee.active}
                disabled={!authority.includes("user.account.disable")}
                onChange={(e) =>
                  setEmployee({ ...employee, active: e.target.checked })
                }
              />
              Active employee
            </label>
            {error && (
              <p role="alert" className="text-danger">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={close}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (
                    !employee.name.trim() ||
                    !employee.roleIds.length ||
                    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(employee.email)
                  ) {
                    setError(
                      "Enter a name, valid email and at least one role.",
                    );
                    return;
                  }
                  onChange({
                    ...value,
                    employees: [
                      ...value.employees.filter((e) => e.id !== employee.id),
                      employee,
                    ],
                  });
                  close();
                }}
              >
                Keep employee draft
              </Button>
            </div>
          </div>
        )}
      </SettingsDialog>
      <SettingsDialog
        title={`Effective access: ${access?.name || ""}`}
        description="Union of all active assigned roles; paid plans never grant employee permissions."
        open={!!access}
        onClose={() => setAccess(null)}
      >
        {access && (
          <div className="space-y-2">
            {permissions.map((p) => (
              <div
                key={p}
                className="flex justify-between gap-3 border-b border-border py-2 text-xs"
              >
                <span>{permissionLabel(p)}</span>
                <strong
                  className={
                    canManage(preview, access.id, p)
                      ? "text-success"
                      : "text-helper"
                  }
                >
                  {canManage(preview, access.id, p) ? "Allowed" : "Not granted"}
                </strong>
              </div>
            ))}
          </div>
        )}
      </SettingsDialog>
    </div>
  );
}
