import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useSaas, command } from "../SaasProvider";
import { can, allowed } from "../permissions";
import { useScoped } from "../hooks";
import {
  Heading,
  DataTable,
  Badge,
  Button,
  Modal,
  Field,
  Select,
  Input,
  Area,
  Actions,
  Card,
  Tabs,
  Empty,
  money,
} from "../components";
export function ServicesPage() {
  const { state: s, actor, dispatch } = useSaas();
  const rows = useScoped(s.orders, "services.view");
  const [tab, setTab] = useState("Orders");
  const [action, setAction] = useState("");
  return (
    <>
      <Heading
        title="Services"
        bn="অতিরিক্ত সেবা · Onboarding, migration and ongoing help"
      >
        {allowed(s, actor, "services.edit") && (
          <Button onClick={() => setAction("request")}>Request service</Button>
        )}
        {can(s, actor, "services.configure") && (
          <Button variant="outline" onClick={() => setAction("catalogSave")}>
            Add catalog item
          </Button>
        )}
      </Heading>
      <Tabs tabs={["Orders", "Catalog"]} value={tab} onChange={setTab} />
      {tab === "Orders" ? (
        <DataTable
          rows={rows}
          columns={[
            {
              label: "Service",
              render: (o) => (
                <Link
                  className="font-medium text-primary"
                  to={`/saas/services/${o.id}`}
                >
                  {o.name}
                </Link>
              ),
            },
            {
              label: "Tenant",
              render: (o) => s.tenants.find((t) => t.id === o.tenantId)?.name,
            },
            {
              label: "Coordinator",
              render: (o) =>
                s.staff.find((e) => e.id === o.assignee)?.name || "Unassigned",
            },
            { label: "Due", render: (o) => o.due },
            { label: "Price", render: (o) => money(o.price) },
            { label: "Status", render: (o) => <Badge>{o.status}</Badge> },
          ]}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {s.services.map((svc) => (
            <Card key={svc.id} title={svc.name}>
              <p className="text-2xl font-semibold">{money(svc.price)}</p>
              <p className="mt-2 text-xs text-ink-500">
                {svc.recurring
                  ? "Recurring add-on · billing cycle configured during approval"
                  : "One-time service"}
              </p>
            </Card>
          ))}
        </div>
      )}
      {action && (
        <Modal
          title={action === "request" ? "Request service" : "Create service"}
          onClose={() => setAction("")}
        >
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const f = Object.fromEntries(new FormData(e.currentTarget));
              if (
                dispatch(
                  command(`service.${action}`, undefined, {
                    ...f,
                    ...(f.price
                      ? { price: Math.round(Number(f.price) * 100) }
                      : {}),
                    recurring: f.recurring === "on",
                  }),
                )
              )
                setAction("");
            }}
          >
            {action === "request" ? (
              <>
                <Field label="Tenant">
                  <Select name="tenantId">
                    {s.tenants
                      .filter((t) => can(s, actor, "services.edit", t.id))
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                  </Select>
                </Field>
                <Field label="Service">
                  <Select name="serviceId">
                    {s.services.map((svc) => (
                      <option key={svc.id} value={svc.id}>
                        {svc.name} · {money(svc.price)}
                      </option>
                    ))}
                  </Select>
                </Field>
              </>
            ) : (
              <>
                <Field label="Service name">
                  <Input name="name" required />
                </Field>
                <Field label="Price (BDT)">
                  <Input
                    name="price"
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                  />
                </Field>
                <label className="flex gap-2 text-sm">
                  <input type="checkbox" name="recurring" />
                  Recurring add-on
                </label>
              </>
            )}
            <Actions>
              <Button type="submit">Save</Button>
            </Actions>
          </form>
        </Modal>
      )}
    </>
  );
}
export function ServiceOrderPage() {
  const { id } = useParams();
  const { state: s, actor, dispatch } = useSaas();
  const [action, setAction] = useState("");
  const o = s.orders.find((o) => o.id === id);
  if (!o || !can(s, actor, "services.view", o.tenantId))
    return <Empty text="Service order unavailable." />;
  const options: Record<string, string[]> = {
    Requested: ["quote", "assign", "cancel"],
    Quoted: ["quote", "approve", "assign", "cancel"],
    Approved: ["assign", "schedule", "cancel"],
    Scheduled: ["assign", "schedule", "start", "cancel"],
    "In progress": ["assign", "deliver", "complete"],
    Completed: [],
    Cancelled: [],
  };
  return (
    <>
      <Heading
        title={o.name}
        bn={`${s.tenants.find((t) => t.id === o.tenantId)?.name} · ${o.id}`}
      >
        <Badge>{o.status}</Badge>
      </Heading>
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Delivery">
          <p className="text-sm">
            Coordinator:{" "}
            {s.staff.find((e) => e.id === o.assignee)?.name || "Unassigned"}
          </p>
          <p className="mt-3 text-sm">Due: {o.due}</p>
          <p className="mt-3 whitespace-pre-wrap text-sm text-ink-500">
            {o.deliverable || "No deliverable recorded yet."}
          </p>
          {can(s, actor, "services.edit", o.tenantId) && (
            <Actions>
              {options[o.status].map((action) => (
                <Button
                  key={action}
                  variant="outline"
                  onClick={() => setAction(action)}
                >
                  {action[0].toUpperCase() + action.slice(1)}
                </Button>
              ))}
            </Actions>
          )}
        </Card>
        <Card title="Billing">
          <p className="text-2xl font-semibold">{money(o.price)}</p>
          <p className="my-3 text-xs text-ink-500">
            Delivery and payment are separate. Approval creates the linked
            invoice.
          </p>
          {s.invoices
            .filter((i) => i.sourceId === o.id)
            .map((i) => (
              <Link
                key={i.id}
                className="text-primary underline"
                to={`/saas/invoices/${i.id}`}
              >
                {i.id} · {i.status}
              </Link>
            ))}
        </Card>
      </div>
      {action && (
        <Modal title={`${action} service`} onClose={() => setAction("")}>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const f = Object.fromEntries(new FormData(e.currentTarget));
              if (
                dispatch(
                  command(
                    `service.${action}`,
                    o.id,
                    {
                      ...f,
                      ...(f.price
                        ? { price: Math.round(Number(f.price) * 100) }
                        : {}),
                    },
                    o.version,
                  ),
                )
              )
                setAction("");
            }}
          >
            {action === "quote" ? (
              <Field label="Quoted price (BDT)">
                <Input
                  type="number"
                  name="price"
                  min="0.01"
                  step="0.01"
                  defaultValue={o.price / 100}
                  required
                />
              </Field>
            ) : action === "assign" ? (
              <Field label="Coordinator">
                <Select name="assignee">
                  {s.staff
                    .filter((e) => e.status === "Active")
                    .map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name}
                      </option>
                    ))}
                </Select>
              </Field>
            ) : action === "schedule" ? (
              <Field label="Due date">
                <Input type="date" name="due" defaultValue={o.due} required />
              </Field>
            ) : action === "deliver" ? (
              <Field label="Deliverable and tenant-visible update">
                <Area
                  name="deliverable"
                  defaultValue={o.deliverable}
                  required
                />
              </Field>
            ) : action === "cancel" ? (
              <Field label="Cancellation reason">
                <Area name="reason" required />
              </Field>
            ) : (
              <p className="text-sm text-ink-500">
                Confirm {action} for {o.name}.
                {action === "approve" &&
                  ` An invoice for ${money(o.price)} will be issued.`}
              </p>
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
