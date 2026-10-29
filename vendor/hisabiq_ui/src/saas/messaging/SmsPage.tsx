import { useState } from "react";
import { Link } from "react-router-dom";
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
  Metric,
  money,
} from "../components";
import { smsBalance, segments } from "./transitions";
export function SmsPage() {
  const { state: s, actor, dispatch } = useSaas();
  const messages = useScoped(s.sms, "sms.view");
  const credits = useScoped(s.credits, "sms.view");
  const [tab, setTab] = useState("Delivery logs");
  const [action, setAction] = useState("");
  const [body, setBody] = useState("");
  const [pack, setPack] = useState("");
  const [templateId, setTemplateId] = useState("");
  const template = s.templates.find((t) => t.id === templateId);
  const tenants = s.tenants.filter((t) => can(s, actor, "sms.view", t.id));
  const current = s.packages.find((p) => p.id === pack);
  return (
    <>
      <Heading
        title="SMS operations"
        bn="বার্তা সেবা · Packages, balances and delivery"
      >
        <Badge>Provider disconnected</Badge>
        {allowed(s, actor, "sms.edit") && (
          <Button onClick={() => setAction("send")}>Compose demo SMS</Button>
        )}
      </Heading>
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Metric
          label="Available credits"
          value={tenants.reduce(
            (v, t) => v + smsBalance(s, t.id, new Date().toISOString()),
            0,
          )}
          detail="Unexpired balance · selected role scope"
        />
        <Metric
          label="Queued messages"
          value={messages.filter((x) => x.status === "Queued").length}
          detail="Reserved credits, no real delivery"
        />
        <Metric
          label="Failed messages"
          value={messages.filter((x) => x.status === "Failed").length}
          detail="Retry with explicit charge preview"
        />
      </div>
      <Tabs
        tabs={["Delivery logs", "Credit ledger", "Packages", "Templates"]}
        value={tab}
        onChange={setTab}
      />
      {tab === "Templates" ? (
        <>
          <div className="mb-4 flex justify-end">
            {can(s, actor, "sms.configure") && (
              <Button
                onClick={() => {
                  setTemplateId("");
                  setBody("");
                  setAction("template");
                }}
              >
                Create template
              </Button>
            )}
          </div>
          <DataTable
            rows={s.templates}
            columns={[
              { label: "Template", render: (t) => t.name },
              {
                label: "Message",
                render: (t) => <p className="max-w-md text-xs">{t.text}</p>,
              },
              {
                label: "Actions",
                render: (t) =>
                  can(s, actor, "sms.configure") ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setTemplateId(t.id);
                        setBody(t.text);
                        setAction("template");
                      }}
                    >
                      Edit template
                    </Button>
                  ) : null,
              },
            ]}
          />
        </>
      ) : tab === "Delivery logs" ? (
        <DataTable
          rows={messages}
          columns={[
            {
              label: "Tenant",
              render: (m) => s.tenants.find((t) => t.id === m.tenantId)?.name,
            },
            {
              label: "Recipient",
              render: (m) =>
                `${m.recipient.slice(0, 3)}••••${m.recipient.slice(-3)}`,
            },
            {
              label: "Message",
              render: (m) => <p className="max-w-xs truncate">{m.text}</p>,
            },
            { label: "Credits", render: (m) => m.units },
            { label: "Status", render: (m) => <Badge>{m.status}</Badge> },
            {
              label: "Actions",
              render: (m) =>
                can(s, actor, "sms.edit", m.tenantId) ? (
                  <div className="flex gap-2">
                    {m.status === "Queued" &&
                      actor.kind === "staff" &&
                      ["Delivered", "Failed"].map((status) => (
                        <Button
                          key={status}
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            dispatch(
                              command(
                                "sms.complete",
                                m.id,
                                { status },
                                m.version,
                              ),
                            )
                          }
                        >
                          Simulate {status.toLowerCase()}
                        </Button>
                      ))}
                    {m.status === "Failed" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (
                            window.confirm(
                              `Retry this message? Up to ${m.units} credits will be reserved if the previous charge was released.`,
                            )
                          )
                            dispatch(command("sms.retry", m.id, {}, m.version));
                        }}
                      >
                        Retry
                      </Button>
                    )}
                  </div>
                ) : null,
            },
          ]}
        />
      ) : tab === "Credit ledger" ? (
        <DataTable
          rows={credits}
          columns={[
            {
              label: "Tenant",
              render: (c) => s.tenants.find((t) => t.id === c.tenantId)?.name,
            },
            { label: "Source", render: (c) => c.source },
            {
              label: "Credits",
              render: (c) => (
                <span className={c.units < 0 ? "text-danger" : "text-success"}>
                  {c.units > 0 ? "+" : ""}
                  {c.units}
                </span>
              ),
            },
            {
              label: "Expiry",
              render: (c) => c.expires || "Linked to original charge",
            },
          ]}
        />
      ) : (
        <>
          <div className="mb-4 flex justify-end">
            {can(s, actor, "sms.configure") && (
              <Button
                onClick={() => {
                  setPack("");
                  setAction("package");
                }}
              >
                Create package
              </Button>
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {s.packages.map((p) => (
              <Card key={p.id} title={p.name}>
                <p className="text-2xl font-semibold">
                  {p.units.toLocaleString()}{" "}
                  <span className="text-sm font-normal">credits</span>
                </p>
                <p className="my-3 text-sm text-ink-500">
                  {money(p.price)} · valid {p.days} days
                </p>
                <Actions>
                  {can(s, actor, "sms.configure") && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setPack(p.id);
                        setAction("package");
                      }}
                    >
                      Edit
                    </Button>
                  )}
                  <Button
                    onClick={() => {
                      setPack(p.id);
                      setAction("order");
                    }}
                  >
                    Buy package
                  </Button>
                </Actions>
              </Card>
            ))}
          </div>
        </>
      )}
      {action && (
        <Modal
          title={
            action === "template"
              ? "SMS template"
              : action === "send"
                ? "Compose demo SMS"
                : action === "package"
                  ? "SMS package"
                  : "Order SMS package"
          }
          onClose={() => setAction("")}
        >
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const f = Object.fromEntries(new FormData(e.currentTarget));
              const c =
                action === "template"
                  ? command(
                      "sms.templateSave",
                      template?.id,
                      { ...f, text: body },
                      template?.version,
                    )
                  : action === "send"
                    ? command("sms.reserve", undefined, { ...f, text: body })
                    : action === "package"
                      ? command(
                          "sms.packageSave",
                          current?.id,
                          { ...f, price: Math.round(Number(f.price) * 100) },
                          current?.version,
                        )
                      : command("sms.packageOrder", undefined, {
                          ...f,
                          packageId: pack,
                        });
              if (dispatch(c)) setAction("");
            }}
          >
            {action !== "package" && action !== "template" && (
              <Field label="Tenant">
                <Select name="tenantId">
                  {tenants
                    .filter((t) => can(s, actor, "sms.edit", t.id))
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                </Select>
              </Field>
            )}
            {action === "template" ? (
              <>
                <Field label="Template name">
                  <Input name="name" defaultValue={template?.name} required />
                </Field>
                <Field label="Template text">
                  <Area
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    required
                  />
                </Field>
              </>
            ) : action === "send" ? (
              <>
                <Field label="Use template">
                  <Select
                    defaultValue=""
                    onChange={(e) => {
                      const text = s.templates.find(
                        (t) => t.id === e.target.value,
                      )?.text;
                      if (text) setBody(text);
                    }}
                  >
                    <option value="">Write a new message</option>
                    {s.templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Recipient phone">
                  <Input name="recipient" required />
                </Field>
                <Field label="Message">
                  <Area
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    required
                  />
                </Field>
                <p className="text-xs text-ink-500">
                  Estimate: {segments(body)} credits. Unicode estimate uses
                  70/67-character segments; final charging depends on the
                  provider. This only queues a demo message.
                </p>
              </>
            ) : action === "package" ? (
              <>
                {[
                  ["name", "Package name", current?.name || ""],
                  ["units", "Credits", current?.units || 500],
                  ["price", "Price (BDT)", current ? current.price / 100 : 300],
                  ["days", "Validity days", current?.days || 90],
                ].map(([name, label, value]) => (
                  <Field key={name} label={String(label)}>
                    <Input
                      name={String(name)}
                      type={name === "name" ? "text" : "number"}
                      min="1"
                      defaultValue={value}
                      required
                    />
                  </Field>
                ))}
              </>
            ) : (
              <>
                <p className="text-sm">
                  {current?.name} · {current?.units} credits ·{" "}
                  {money(current?.price || 0)}
                </p>
                <p className="text-xs text-ink-500">
                  Creates an invoice. Credits become available after full
                  verified payment.
                </p>
                <Link
                  to="/saas/invoices"
                  className="text-xs text-primary underline"
                >
                  Open invoices after ordering
                </Link>
              </>
            )}
            <Actions>
              <Button type="submit">
                {action === "template"
                  ? "Save template"
                  : action === "send"
                    ? "Queue demo message"
                    : action === "package"
                      ? "Save package"
                      : "Create package invoice"}
              </Button>
            </Actions>
          </form>
        </Modal>
      )}
    </>
  );
}
