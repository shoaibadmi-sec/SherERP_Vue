import { AttachmentField } from "../AttachmentField";
import type { Attachment } from "../types";
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
  when,
} from "../components";
import { ticketReplies } from "./transitions";
export function TicketsPage() {
  const { state: s, actor, dispatch } = useSaas();
  const rows = useScoped(s.tickets, "support.view");
  const [view, setView] = useState("All tickets");
  const [open, setOpen] = useState(false);
  const portal = actor.kind === "tenant";
  const base = portal ? "/app/support" : "/saas/support";
  return (
    <>
      <Heading
        title={portal ? "My support tickets" : "Support inbox"}
        bn="সহায়তা · Keep every customer conversation connected"
      >
        {allowed(s, actor, "support.edit") && (
          <Button onClick={() => setOpen(true)}>New ticket</Button>
        )}
      </Heading>
      {!portal && (
        <Tabs
          tabs={["All tickets", "My tickets", "Unassigned"]}
          value={view}
          onChange={setView}
        />
      )}
      <DataTable
        rows={rows.filter((t) =>
          view === "My tickets"
            ? t.assignee === actor.id
            : view === "Unassigned"
              ? !t.assignee
              : true,
        )}
        columns={[
          {
            label: "Ticket",
            render: (t) => (
              <Link className="font-medium text-primary" to={`${base}/${t.id}`}>
                {t.subject}
                <p className="text-xs text-ink-500">{t.id}</p>
              </Link>
            ),
          },
          {
            label: "Tenant",
            render: (t) => s.tenants.find((x) => x.id === t.tenantId)?.name,
          },
          { label: "Priority", render: (t) => <Badge>{t.priority}</Badge> },
          {
            label: "Assignee",
            render: (t) =>
              s.staff.find((x) => x.id === t.assignee)?.name || "Unassigned",
          },
          { label: "Due", render: (t) => t.due },
          { label: "Status", render: (t) => <Badge>{t.status}</Badge> },
        ]}
      />
      {open && (
        <Modal title="New support ticket" onClose={() => setOpen(false)}>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (
                dispatch(
                  command(
                    "ticket.create",
                    undefined,
                    Object.fromEntries(new FormData(e.currentTarget)),
                  ),
                )
              )
                setOpen(false);
            }}
          >
            <Field label="Tenant">
              <Select name="tenantId">
                {s.tenants
                  .filter((t) => can(s, actor, "support.edit", t.id))
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
              </Select>
            </Field>
            <Field label="Subject">
              <Input name="subject" required />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Category">
                <Select name="category">
                  {["General", "Products", "Billing", "SMS", "Services"].map(
                    (x) => (
                      <option key={x}>{x}</option>
                    ),
                  )}
                </Select>
              </Field>
              <Field label="Priority">
                <Select name="priority">
                  <option>Normal</option>
                  <option>High</option>
                </Select>
              </Field>
            </div>
            <Field label="How can we help?">
              <Area name="text" required />
            </Field>
            <Actions>
              <Button type="submit">Create ticket</Button>
            </Actions>
          </form>
        </Modal>
      )}
    </>
  );
}
export function TicketPage() {
  const { id } = useParams();
  const { state: s, actor, dispatch } = useSaas();
  const [mode, setMode] = useState("Public reply");
  const [body, setBody] = useState("");
  const [attachment, setAttachment] = useState<Attachment | undefined>();
  const [reading, setReading] = useState(false);
  const [action, setAction] = useState("");
  const t = s.tickets.find((x) => x.id === id);
  if (!t || !can(s, actor, "support.view", t.tenantId))
    return <Empty text="Ticket unavailable." />;
  const portal = actor.kind === "tenant";
  const editable = can(s, actor, "support.edit", t.tenantId);
  const messages = ticketReplies(s, actor, t.id);
  return (
    <>
      <Heading
        title={t.subject}
        bn={`${t.id} · ${s.tenants.find((x) => x.id === t.tenantId)?.name}`}
      >
        <Badge>{t.status}</Badge>
        {editable && (
          <Button variant="outline" onClick={() => setAction("status")}>
            Change status
          </Button>
        )}
      </Heading>
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Card title="Conversation">
            <div className="space-y-4">
              {messages.map((m) => (
                <article
                  key={m.id}
                  className={`rounded-lg border p-4 ${m.internal ? "border-warning bg-warning-bg" : "border-border bg-ink-50"}`}
                >
                  <div className="mb-2 flex flex-wrap justify-between gap-2 text-xs">
                    <strong>
                      {s.staff.find((x) => x.id === m.author)?.name || m.author}
                    </strong>
                    <span className="text-ink-500">{when(m.date)}</span>
                  </div>
                  {m.internal && (
                    <p className="mb-2 text-xs font-semibold text-warning">
                      Internal note · Staff only
                    </p>
                  )}
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {m.text}
                  </p>
                  {m.attachment && (
                    <a
                      className="mt-3 block text-xs text-primary underline"
                      href={m.attachment.data}
                      download={m.attachment.name}
                    >
                      Download {m.attachment.name}
                    </a>
                  )}
                </article>
              ))}
            </div>
          </Card>
          {editable && (
            <Card title={mode}>
              {!portal && (
                <Tabs
                  tabs={["Public reply", "Internal note"]}
                  value={mode}
                  onChange={setMode}
                />
              )}
              <p
                className={`mb-3 text-xs ${mode === "Internal note" ? "text-warning" : "text-ink-500"}`}
              >
                {mode === "Internal note"
                  ? "Visible only to authorized staff."
                  : "Visible to the tenant and authorized support staff."}
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (
                    dispatch(
                      command(
                        mode === "Internal note"
                          ? "ticket.note"
                          : "ticket.reply",
                        t.id,
                        { text: body, attachment },
                        t.version,
                      ),
                    )
                  ) {
                    setBody("");
                    setAttachment(undefined);
                  }
                }}
              >
                <Field
                  label={
                    mode === "Internal note"
                      ? "Internal note text"
                      : "Reply message"
                  }
                >
                  <Area
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    required
                  />
                </Field>
                <AttachmentField
                  value={attachment}
                  onChange={setAttachment}
                  onReading={setReading}
                />
                <Actions>
                  <Button type="submit" disabled={reading}>
                    {mode === "Internal note"
                      ? "Add internal note"
                      : "Send public reply"}
                  </Button>
                </Actions>
              </form>
            </Card>
          )}
        </div>
        <div className="space-y-4">
          <Card title="Ticket context">
            <p className="text-sm">
              {t.category} · <Badge>{t.priority}</Badge>
            </p>
            <p className="mt-3 text-xs text-ink-500">
              Assigned to{" "}
              {s.staff.find((x) => x.id === t.assignee)?.name || "no one"}
              <br />
              Due {t.due} · Asia/Dhaka
            </p>
            {t.linked && (
              <p className="mt-3 text-xs">Linked reference: {t.linked}</p>
            )}
            {!portal && can(s, actor, "support.assign", t.tenantId) && (
              <Actions>
                <Button variant="outline" onClick={() => setAction("assign")}>
                  Assign / escalate
                </Button>
              </Actions>
            )}
          </Card>
          <Card title="Support access">
            <p className="text-xs leading-relaxed text-ink-500">
              Temporary access requires the tenant's explicit consent. This
              prototype records the request only; it does not impersonate an
              account.
            </p>
            {s.grants
              .filter((g) => g.tenantId === t.tenantId)
              .map((g) => (
                <div
                  key={g.id}
                  className="mt-3 rounded border border-border p-3 text-xs"
                >
                  <Badge>
                    {Date.parse(g.expires) < Date.now() ? "Expired" : g.status}
                  </Badge>
                  <p className="mt-2">
                    {g.reason} · {g.scope}
                  </p>
                  <p className="mt-2 text-ink-500">Until {when(g.expires)}</p>
                  {portal &&
                    g.status === "Requested" &&
                    Date.parse(g.expires) > Date.now() && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          dispatch(
                            command("access.consent", g.id, {}, g.version),
                          )
                        }
                      >
                        Consent
                      </Button>
                    )}
                  {g.status !== "Revoked" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        dispatch(command("access.revoke", g.id, {}, g.version))
                      }
                    >
                      Revoke
                    </Button>
                  )}
                </div>
              ))}
            {!portal && editable && (
              <Actions>
                <Button variant="outline" onClick={() => setAction("access")}>
                  Request access
                </Button>
              </Actions>
            )}
          </Card>
        </div>
      </div>
      {action && (
        <Modal
          title={
            action === "assign"
              ? "Assign or escalate ticket"
              : action === "access"
                ? "Request temporary access"
                : "Change ticket status"
          }
          onClose={() => setAction("")}
        >
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const f = Object.fromEntries(new FormData(e.currentTarget));
              const c =
                action === "access"
                  ? command("access.request", undefined, {
                      ...f,
                      tenantId: t.tenantId,
                      expires: new Date(String(f.expires)).toISOString(),
                    })
                  : command(
                      action === "assign"
                        ? "ticket.assign"
                        : "ticket.transition",
                      t.id,
                      f,
                      t.version,
                    );
              if (dispatch(c)) setAction("");
            }}
          >
            {action === "status" ? (
              <Field label="Status">
                <Select name="status" defaultValue={t.status}>
                  {(portal
                    ? ["Open", "Resolved"]
                    : [
                        "Open",
                        "In progress",
                        "Waiting for tenant",
                        "Waiting internally",
                        "Resolved",
                        "Closed",
                      ]
                  ).map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </Select>
              </Field>
            ) : action === "assign" ? (
              <>
                <Field label="Assignee">
                  <Select name="assignee" defaultValue={t.assignee}>
                    {s.staff
                      .filter((x) =>
                        can(
                          s,
                          { kind: "staff", id: x.id },
                          "support.edit",
                          t.tenantId,
                        ),
                      )
                      .map((x) => (
                        <option key={x.id} value={x.id}>
                          {x.name}
                        </option>
                      ))}
                  </Select>
                </Field>
                <Field label="Priority">
                  <Select name="priority" defaultValue={t.priority}>
                    <option>Normal</option>
                    <option>High</option>
                  </Select>
                </Field>
                <Field label="Linked invoice/payment/SMS reference">
                  <Input name="linked" defaultValue={t.linked} />
                </Field>
              </>
            ) : (
              <>
                <Field label="Reason">
                  <Area name="reason" required />
                </Field>
                <Field label="Requested scope">
                  <Input
                    name="scope"
                    required
                    placeholder="Read product settings"
                  />
                </Field>
                <Field label="Expires (within 24 hours)">
                  <Input type="datetime-local" name="expires" required />
                </Field>
              </>
            )}
            <Actions>
              <Button type="submit">Confirm</Button>
            </Actions>
          </form>
        </Modal>
      )}
    </>
  );
}
