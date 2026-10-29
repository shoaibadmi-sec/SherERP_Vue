import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useSaas, command } from "../SaasProvider";
import { can } from "../permissions";
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
  Area,
  Empty,
} from "../components";
export function TenantsPage() {
  const { state: s, actor, dispatch } = useSaas();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Heading
        title="Tenants"
        bn="ব্যবসা প্রতিষ্ঠান · Onboard and manage your customers"
      >
        {can(s, actor, "tenants.edit") && (
          <Button onClick={() => setOpen(true)}>Create tenant</Button>
        )}
      </Heading>
      <DataTable
        rows={s.tenants.filter((t) => can(s, actor, "tenants.view", t.id))}
        columns={[
          {
            label: "Business",
            render: (t) => (
              <Link
                className="font-medium text-primary"
                to={`/saas/tenants/${t.id}`}
              >
                {t.name}
                <p className="text-xs text-ink-500">{t.id}</p>
              </Link>
            ),
          },
          {
            label: "Owner",
            render: (t) => (
              <div>
                {t.owner}
                <p className="text-xs text-ink-500">{t.email}</p>
              </div>
            ),
          },
          {
            label: "Plan",
            render: (t) =>
              s.subscriptions.find((x) => x.tenantId === t.id)?.planName || "—",
          },
          { label: "Tenant status", render: (t) => <Badge>{t.status}</Badge> },
          {
            label: "Subscription",
            render: (t) => (
              <Badge>
                {s.subscriptions.find((x) => x.tenantId === t.id)?.status ||
                  "None"}
              </Badge>
            ),
          },
          {
            label: "Actions",
            render: (t) => (
              <Link
                className="text-primary underline"
                to={`/saas/tenants/${t.id}`}
              >
                View details
              </Link>
            ),
          },
        ]}
      />
      {open && (
        <Modal title="Create tenant" onClose={() => setOpen(false)}>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const data = Object.fromEntries(new FormData(e.currentTarget));
              if (dispatch(command("tenant.create", undefined, data)))
                setOpen(false);
            }}
          >
            <div className="rounded-lg bg-ink-50 p-3 text-xs text-ink-500">
              1. Business and owner → 2. Plan → 3. Create with a 14-day demo
              trial
            </div>
            {[
              ["name", "Business name"],
              ["owner", "Owner name"],
              ["email", "Owner email"],
              ["phone", "Phone"],
            ].map(([name, label]) => (
              <Field key={name} label={label}>
                <Input
                  name={name}
                  type={name === "email" ? "email" : "text"}
                  required
                />
              </Field>
            ))}
            <Field label="Trial plan">
              <Select name="planId">
                {s.plans
                  .filter((p) => p.status === "Published")
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} · {p.users} users · {p.sms} SMS allowance
                    </option>
                  ))}
              </Select>
            </Field>
            <p className="text-xs text-ink-500">
              Owner invitation will be pending in this demo. No email is sent.
            </p>
            <Actions>
              <Button type="submit">Create tenant</Button>
            </Actions>
          </form>
        </Modal>
      )}
    </>
  );
}
export function TenantPage() {
  const { id } = useParams();
  const { state: s, actor, dispatch } = useSaas();
  const t = s.tenants.find((t) => t.id === id);
  const [tab, setTab] = useState("Overview");
  const [action, setAction] = useState("");
  if (!t || !can(s, actor, "tenants.view", t.id))
    return <Empty text="Tenant not found or outside your access." />;
  const edit = can(s, actor, "tenants.edit", t.id);
  const links: Record<string, [string, string]> = {
    Subscription: ["subscriptions", "subscriptions"],
    Billing: ["invoices", "billing"],
    SMS: ["sms", "sms"],
    Services: ["services", "services"],
    Support: ["support", "support"],
  };
  return (
    <>
      <Heading title={t.name} bn={`${t.id} · ${t.owner}`}>
        <Badge>{t.status}</Badge>
        {edit && (
          <>
            <Button variant="outline" onClick={() => setAction("update")}>
              Edit business
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                setAction(t.status === "Suspended" ? "reactivate" : "suspend")
              }
            >
              {t.status === "Suspended" ? "Reactivate" : "Suspend"}
            </Button>
          </>
        )}
      </Heading>
      <Tabs
        tabs={[
          "Overview",
          "Members",
          ...Object.keys(links).filter((k) =>
            can(s, actor, `${links[k][1]}.view`, t.id),
          ),
          "Activity",
        ]}
        value={tab}
        onChange={setTab}
      />
      {tab === "Overview" ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Card title="Business details">
            <dl className="space-y-3 text-sm">
              {[
                ["Owner", t.owner],
                ["Email", t.email],
                ["Phone", t.phone],
                ["Status", t.status],
              ].map(([a, b]) => (
                <div key={a} className="flex justify-between gap-4">
                  <dt className="text-ink-500">{a}</dt>
                  <dd>{b}</dd>
                </div>
              ))}
            </dl>
          </Card>
          <Card title="Lifecycle">
            <p className="text-xs leading-relaxed text-ink-500">
              Tenant access and subscription billing are tracked separately.
              Suspension blocks business access without deleting billing
              history.
            </p>
            {edit && (
              <Actions>
                <Button variant="outline" onClick={() => setAction("archive")}>
                  Archive tenant
                </Button>
              </Actions>
            )}
          </Card>
        </div>
      ) : tab === "Members" ? (
        <Card title="Tenant owner">
          <p className="text-sm">
            {t.owner} · {t.email}
          </p>
          <div className="mt-3">
            <Badge>{t.invitation}</Badge>
          </div>
          {edit && (
            <Actions>
              <Button
                onClick={() =>
                  dispatch(command("tenant.inviteOwner", t.id, {}, t.version))
                }
              >
                Renew demo invitation
              </Button>
            </Actions>
          )}
        </Card>
      ) : tab === "Activity" ? (
        <Card title="Tenant activity">
          {s.audit
            .filter((a) => a.tenantId === t.id || a.target === t.id)
            .map((a) => (
              <p key={a.id} className="border-b border-border py-2 text-xs">
                {a.action} · {a.actor} · {a.date}
              </p>
            ))}
          {!s.audit.some((a) => a.tenantId === t.id || a.target === t.id) && (
            <Empty text="No recorded actions yet." />
          )}
        </Card>
      ) : (
        <Card title={`${tab} for ${t.name}`}>
          <Link
            className="text-primary underline"
            to={`/saas/${links[tab][0]}?tenant=${t.id}`}
          >
            Open {tab.toLowerCase()} records →
          </Link>
        </Card>
      )}
      {action && (
        <Modal
          title={`${action === "update" ? "Edit" : action} ${t.name}`}
          onClose={() => setAction("")}
        >
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (
                dispatch(
                  command(
                    `tenant.${action}`,
                    t.id,
                    Object.fromEntries(new FormData(e.currentTarget)),
                    t.version,
                  ),
                )
              )
                setAction("");
            }}
          >
            {action === "update" ? (
              ["name", "owner", "email", "phone"].map((key) => (
                <Field label={key} key={key}>
                  <Input name={key} defaultValue={t[key as "name"]} required />
                </Field>
              ))
            ) : (
              <>
                <p className="text-sm text-ink-500">
                  {action === "archive"
                    ? "Unpaid invoices, unresolved tickets and open services block archival. History is retained."
                    : action === "suspend"
                      ? "Business access will be suspended. The subscription and billing history remain unchanged."
                      : "Business access will be restored. Subscription status remains unchanged."}
                </p>
                <Field label="Reason">
                  <Area name="reason" required />
                </Field>
              </>
            )}
            <Actions>
              <Button type="submit">Confirm {action}</Button>
            </Actions>
          </form>
        </Modal>
      )}
    </>
  );
}
