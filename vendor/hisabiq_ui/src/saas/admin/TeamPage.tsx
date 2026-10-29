import React, { useState } from "react";
import { useSaas, command } from "../SaasProvider";
import { can, catalog, withViews } from "../permissions";
import type { Role, Staff, Assignment, Permission } from "../types";
import {
  Heading,
  Button,
  Input,
  Card,
  DataTable,
  Badge,
  Modal,
  Field,
  Select,
  Actions,
  Tabs,
} from "../components";
export function TeamPage() {
  const { state: s, actor, dispatch } = useSaas();
  const [tab, setTab] = useState("Employees");
  const [edit, setEdit] = useState<{ kind: string; id?: string } | null>(null);
  const editable = can(s, actor, "team.edit");
  return (
    <>
      <Heading
        title="Team & roles"
        bn="কর্মী ও দায়িত্ব · One account, multiple responsibilities"
      >
        {editable && (
          <Button
            onClick={() =>
              setEdit({ kind: tab === "Employees" ? "invite" : "role" })
            }
          >
            {tab === "Employees" ? "Invite employee" : "Create role"}
          </Button>
        )}
      </Heading>
      <Tabs tabs={["Employees", "Roles"]} value={tab} onChange={setTab} />
      {tab === "Employees" ? (
        <DataTable
          rows={s.staff}
          columns={[
            {
              label: "Employee",
              render: (x) => (
                <div className="font-medium">
                  {x.name}
                  <p className="text-xs font-normal text-ink-500">{x.email}</p>
                </div>
              ),
            },
            {
              label: "Roles",
              render: (x) => (
                <div className="flex max-w-xs flex-wrap gap-1">
                  {s.assignments
                    .filter((g) => g.staffId === x.id)
                    .map((g, i) => (
                      <Badge key={i}>
                        {s.roles.find((r) => r.id === g.roleId)?.name}
                      </Badge>
                    ))}
                </div>
              ),
            },
            { label: "Status", render: (x) => <Badge>{x.status}</Badge> },
            {
              label: "Actions",
              render: (x) => (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEdit({ kind: "staff", id: x.id })}
                >
                  View employee
                </Button>
              ),
            },
          ]}
        />
      ) : (
        <DataTable
          rows={s.roles}
          columns={[
            { label: "Role", render: (x) => <strong>{x.name}</strong> },
            {
              label: "Permissions",
              render: (x) => `${x.permissions.length} actions`,
            },
            {
              label: "Employees",
              render: (x) =>
                s.assignments.filter((g) => g.roleId === x.id).length,
            },
            {
              label: "Actions",
              render: (x) => (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEdit({ kind: "role", id: x.id })}
                  >
                    View role
                  </Button>
                  {editable && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEdit({ kind: "duplicate", id: x.id })}
                    >
                      Duplicate
                    </Button>
                  )}
                </div>
              ),
            },
          ]}
        />
      )}
      {edit && (
        <Modal
          title={
            edit.kind === "invite"
              ? "Invite employee"
              : edit.kind === "staff"
                ? "Employee access"
                : "Configure role"
          }
          onClose={() => setEdit(null)}
        >
          {edit.kind === "invite" ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                if (
                  dispatch(
                    command("staff.invite", undefined, Object.fromEntries(f)),
                  )
                )
                  setEdit(null);
              }}
              className="space-y-4"
            >
              <Field label="Full name">
                <Input name="name" required />
              </Field>
              <Field label="Email">
                <Input name="email" type="email" required />
              </Field>
              <p className="text-xs text-ink-500">
                Creates a pending demo invitation. Open the employee to assign
                roles and simulate acceptance.
              </p>
              <Actions>
                <Button type="submit">Create invitation</Button>
              </Actions>
            </form>
          ) : edit.kind === "staff" ? (
            <StaffEditor
              employee={s.staff.find((x) => x.id === edit.id)!}
              close={() => setEdit(null)}
              editable={editable}
            />
          ) : (
            <RoleEditor
              role={s.roles.find((x) => x.id === edit.id)}
              duplicate={edit.kind === "duplicate"}
              close={() => setEdit(null)}
              editable={editable}
            />
          )}
        </Modal>
      )}
    </>
  );
}
function StaffEditor({
  employee: e,
  close,
  editable,
}: {
  employee: Staff;
  close: () => void;
  editable: boolean;
}) {
  const { state: s, actor, dispatch } = useSaas();
  const [roleSearch, setRoleSearch] = useState("");
  const [grants, setGrants] = useState<Assignment[]>(
    s.assignments.filter((x) => x.staffId === e.id),
  );
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold">{e.name}</h3>
        <p className="text-xs text-ink-500">
          {e.email} · Session version {e.sessionVersion}
        </p>
      </div>
      <p className="text-xs text-ink-500">
        Combine roles below. Each role retains its own tenant scope.
      </p>
      <Field label="Find roles">
        <Input
          value={roleSearch}
          onChange={(e) => setRoleSearch(e.target.value)}
          placeholder="Search responsibilities…"
        />
      </Field>
      {s.roles
        .filter((r) => r.name.toLowerCase().includes(roleSearch.toLowerCase()))
        .map((r) => {
          const g = grants.find((x) => x.roleId === r.id);
          return (
            <div key={r.id} className="rounded-lg border border-border p-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  disabled={
                    !editable ||
                    (r.id === "owner" &&
                      !s.staff.find((x) => x.id === actor.id)?.owner)
                  }
                  checked={!!g}
                  onChange={(ev) =>
                    setGrants(
                      ev.target.checked
                        ? [
                            ...grants,
                            { staffId: e.id, roleId: r.id, tenantIds: "all" },
                          ]
                        : grants.filter((x) => x.roleId !== r.id),
                    )
                  }
                />
                {r.name}
              </label>
              {g && r.id !== "owner" && (
                <div className="mt-3 space-y-2">
                  <Select
                    aria-label={`${r.name} scope`}
                    disabled={!editable}
                    value={g.tenantIds === "all" ? "all" : "selected"}
                    onChange={(ev) =>
                      setGrants(
                        grants.map((x) =>
                          x.roleId === r.id
                            ? {
                                ...x,
                                tenantIds:
                                  ev.target.value === "all"
                                    ? "all"
                                    : [s.tenants[0].id],
                              }
                            : x,
                        ),
                      )
                    }
                  >
                    <option value="all">All tenants</option>
                    <option value="selected">Selected tenants</option>
                  </Select>
                  {g.tenantIds !== "all" &&
                    s.tenants.map((t) => (
                      <label
                        key={t.id}
                        className="flex items-center gap-2 text-xs"
                      >
                        <input
                          type="checkbox"
                          disabled={!editable}
                          checked={g.tenantIds.includes(t.id)}
                          onChange={(ev) =>
                            setGrants(
                              grants.map((x) =>
                                x.roleId === r.id
                                  ? {
                                      ...x,
                                      tenantIds: ev.target.checked
                                        ? [...(g.tenantIds as string[]), t.id]
                                        : (g.tenantIds as string[]).filter(
                                            (id) => id !== t.id,
                                          ),
                                    }
                                  : x,
                              ),
                            )
                          }
                        />
                        {t.name}
                      </label>
                    ))}
                </div>
              )}
            </div>
          );
        })}
      <details className="rounded border border-border p-3 text-xs">
        <summary className="cursor-pointer font-medium">
          Effective permissions and sources
        </summary>
        {grants.map((g) => (
          <p key={g.roleId} className="mt-2 leading-relaxed">
            <strong>{s.roles.find((r) => r.id === g.roleId)?.name}</strong> ·{" "}
            {g.tenantIds === "all"
              ? "All tenants"
              : g.tenantIds
                  .map((id) => s.tenants.find((t) => t.id === id)?.name)
                  .join(", ")}
            <br />
            {s.roles.find((r) => r.id === g.roleId)?.permissions.join(", ")}
          </p>
        ))}
      </details>
      {editable && (
        <>
          <p className="text-xs text-ink-500">
            Saving affects {e.name}. Access granted by another selected role
            remains available.
          </p>
          <Actions>
            {!e.owner && (
              <Button
                variant="outline"
                onClick={() => {
                  if (
                    window.confirm(
                      `Disable ${e.name}? Their sessions will be revoked.`,
                    ) &&
                    dispatch(command("staff.disable", e.id, {}, e.version))
                  )
                    close();
                }}
              >
                Disable
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => {
                if (
                  dispatch(command("staff.revokeSessions", e.id, {}, e.version))
                )
                  close();
              }}
            >
              Revoke sessions
            </Button>
            {e.status !== "Active" && (
              <Button
                variant="outline"
                onClick={() => {
                  if (
                    dispatch(
                      command(
                        "staff.update",
                        e.id,
                        { status: "Active" },
                        e.version,
                      ),
                    )
                  )
                    close();
                }}
              >
                Simulate acceptance
              </Button>
            )}
            <Button
              onClick={() => {
                if (
                  dispatch(
                    command(
                      "assignment.save",
                      e.id,
                      { assignments: grants },
                      e.version,
                    ),
                  )
                )
                  close();
              }}
            >
              Save access
            </Button>
          </Actions>
        </>
      )}
    </div>
  );
}
function RoleEditor({
  role,
  duplicate,
  close,
  editable,
}: {
  role?: Role;
  duplicate: boolean;
  close: () => void;
  editable: boolean;
}) {
  const { state: s, dispatch } = useSaas();
  const [ps, setPs] = useState<Permission[]>(role?.permissions || []);
  const [name, setName] = useState(
    role ? `${role.name}${duplicate ? " copy" : ""}` : "",
  );
  const affected = s.assignments
    .filter((g) => g.roleId === role?.id)
    .map((g) => s.staff.find((e) => e.id === g.staffId)?.name);
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (
          dispatch(
            command(
              "role.save",
              duplicate ? undefined : role?.id,
              { name, permissions: ps },
              duplicate ? undefined : role?.version,
            ),
          )
        )
          close();
      }}
    >
      <Field label="Role name">
        <Input
          value={name}
          disabled={!editable}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setName(e.target.value)
          }
          required
        />
      </Field>
      <p className="text-xs text-ink-500">
        Selecting an action also grants the view permission needed to use it.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {Object.entries(catalog).map(([group, actions]) => (
          <fieldset key={group} className="rounded-lg border border-border p-3">
            <legend className="px-1 text-xs font-semibold capitalize">
              {group}
            </legend>
            <div className="flex flex-wrap gap-3">
              {actions.map((action) => {
                const p = `${group}.${action}` as Permission;
                return (
                  <label key={p} className="flex items-center gap-1.5 text-xs">
                    <input
                      type="checkbox"
                      disabled={!editable}
                      checked={ps.includes(p)}
                      onChange={(e) =>
                        setPs(
                          e.target.checked
                            ? withViews([...ps, p])
                            : ps.filter(
                                (x) =>
                                  x !== p &&
                                  !(
                                    action === "view" &&
                                    x.startsWith(`${group}.`)
                                  ),
                              ),
                        )
                      }
                    />
                    {action}
                  </label>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>
      <Card title="Change preview">
        <p className="text-xs">
          {ps.length} permissions · Affects{" "}
          {duplicate
            ? "no existing employees"
            : affected.join(", ") || "no employees"}
          .
        </p>
        {role && !duplicate && (
          <p className="mt-2 text-xs text-ink-500">
            Added:{" "}
            {ps.filter((p) => !role.permissions.includes(p)).join(", ") ||
              "none"}
            <br />
            Removed:{" "}
            {role.permissions.filter((p) => !ps.includes(p)).join(", ") ||
              "none"}
          </p>
        )}
      </Card>
      {editable && (
        <Actions>
          {role && !duplicate && role.id !== "owner" && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (
                  window.confirm(
                    `Delete ${role.name}? Assigned roles must first be removed from employees.`,
                  ) &&
                  dispatch(command("role.delete", role.id))
                )
                  close();
              }}
            >
              Delete role
            </Button>
          )}
          <Button type="submit">Save role</Button>
        </Actions>
      )}
    </form>
  );
}
