import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSaas, command } from "./SaasProvider";
import {
  Heading,
  Card,
  Tabs,
  Badge,
  Button,
  Modal,
  Select,
  Actions,
  Empty,
  money,
} from "./components";
import { PaymentForm } from "./billing/PaymentForm";
import { due } from "./billing/selectors";
import { smsBalance } from "./messaging/transitions";
import { TicketsPage, TicketPage } from "./support/TicketsPage";
import { KnowledgePage } from "./support/KnowledgePage";
export function TenantSession({ children }: { children: React.ReactNode }) {
  const { state: s, actor, setActor, persistenceError } = useSaas();
  useEffect(() => {
    if (actor.kind !== "tenant")
      setActor({ kind: "tenant", id: "owner-t1", tenantId: "t1" });
  }, [actor.kind]);
  if (actor.kind !== "tenant") return null;
  return (
    <div key={actor.tenantId}>
      {persistenceError && (
        <div
          role="alert"
          className="mb-4 rounded-lg bg-warning-bg p-3 text-xs text-warning"
        >
          {persistenceError}
        </div>
      )}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-3">
        <span className="text-xs text-ink-500">
          Tenant portal · Demo owner account
        </span>
        <label className="flex items-center gap-2 text-xs">
          Business
          <Select
            aria-label="Demo tenant"
            value={actor.tenantId}
            onChange={(e) => {
              if (
                document.querySelector("dialog[open]") &&
                !window.confirm("Switch tenant and discard the open form?")
              )
                return;
              setActor({
                kind: "tenant",
                id: `owner-${e.target.value}`,
                tenantId: e.target.value,
              });
            }}
          >
            {s.tenants
              .filter((t) => t.status !== "Archived")
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
          </Select>
        </label>
      </div>
      {children}
    </div>
  );
}
export function TenantSupport({ detail = false }: { detail?: boolean }) {
  return (
    <TenantSession>{detail ? <TicketPage /> : <TicketsPage />}</TenantSession>
  );
}
export function TenantSubscription() {
  return (
    <TenantSession>
      <SubscriptionContent />
    </TenantSession>
  );
}
function SubscriptionContent() {
  const { state: s, actor, dispatch } = useSaas();
  const [tab, setTab] = useState("Invoices");
  const [proof, setProof] = useState<{
    invoiceId: string;
    paymentId?: string;
  } | null>(null);
  const [order, setOrder] = useState<{ kind: string; id: string } | null>(null);
  const tenant = actor.tenantId!;
  const sub = s.subscriptions.find((x) => x.tenantId === tenant);
  const invoices = s.invoices.filter((i) => i.tenantId === tenant);
  const payments = s.payments.filter((p) => p.tenantId === tenant);
  const invoice = invoices.find((i) => i.id === proof?.invoiceId);
  return (
    <>
      <Heading
        title="My subscription"
        bn="আমার সাবস্ক্রিপশন · Billing, usage and support"
      >
        <Link className="text-sm text-primary underline" to="/app/support">
          Contact support
        </Link>
      </Heading>
      <div className="mb-5 grid gap-4 md:grid-cols-3">
        <Card title="Current plan">
          <p className="text-2xl font-semibold">{sub?.planName || "No plan"}</p>
          <div className="mt-2">
            <Badge>{sub?.status || "None"}</Badge>
          </div>
          <p className="mt-3 text-xs text-ink-500">
            Next renewal: {sub?.renewal}
          </p>
        </Card>
        <Card title="Outstanding">
          <p className="text-2xl font-semibold">
            {money(invoices.reduce((v, i) => v + due(s, i), 0))}
          </p>
          <p className="mt-3 text-xs text-ink-500">
            Payment evidence is reviewed before activation.
          </p>
        </Card>
        <Card title="SMS balance">
          <p className="text-2xl font-semibold">
            {smsBalance(s, tenant, new Date().toISOString())} credits
          </p>
          <p className="mt-3 text-xs text-ink-500">
            Unexpired and available to use.
          </p>
        </Card>
      </div>
      <Tabs
        tabs={[
          "Invoices",
          "Payment submissions",
          "SMS packages",
          "Services",
          "Help",
        ]}
        value={tab}
        onChange={setTab}
      />
      {tab === "Invoices" ? (
        <div className="space-y-3">
          {invoices.map((i) => (
            <Card key={i.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{i.description}</p>
                  <p className="mt-1 text-xs text-ink-500">
                    {i.id} · Due {i.due} · Remaining {money(due(s, i))}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge>{i.status}</Badge>
                  {due(s, i) > 0 && (
                    <Button onClick={() => setProof({ invoiceId: i.id })}>
                      Submit proof
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
          {!invoices.length && <Empty text="No invoices yet." />}
        </div>
      ) : tab === "Payment submissions" ? (
        <div className="space-y-3">
          {payments.map((p) => (
            <Card
              key={p.id}
              title={p.reference}
              aside={<Badge>{p.status}</Badge>}
            >
              <p className="text-sm">
                {money(p.amount)} · {p.method}
              </p>
              <p className="mt-2 text-xs text-ink-500">{p.reason}</p>
              {p.status === "Needs information" && (
                <Actions>
                  <Button
                    onClick={() =>
                      setProof({ invoiceId: p.invoiceId, paymentId: p.id })
                    }
                  >
                    Resubmit proof
                  </Button>
                </Actions>
              )}
            </Card>
          ))}
        </div>
      ) : tab === "SMS packages" ? (
        <div className="grid gap-3 md:grid-cols-3">
          {s.packages.map((p) => (
            <Card key={p.id} title={p.name}>
              <p>
                {p.units} credits · {money(p.price)}
              </p>
              <p className="mt-2 text-xs text-ink-500">
                {p.days} days after settlement
              </p>
              <Actions>
                <Button onClick={() => setOrder({ kind: "sms", id: p.id })}>
                  Buy package
                </Button>
              </Actions>
            </Card>
          ))}
        </div>
      ) : tab === "Help" ? (
        <KnowledgePage />
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            {s.services.map((v) => (
              <Card key={v.id} title={v.name}>
                <p>{money(v.price)}</p>
                <Actions>
                  <Button
                    onClick={() => setOrder({ kind: "service", id: v.id })}
                  >
                    Request service
                  </Button>
                </Actions>
              </Card>
            ))}
          </div>
          {s.orders
            .filter((o) => o.tenantId === tenant)
            .map((o) => (
              <Card key={o.id} title={o.name} aside={<Badge>{o.status}</Badge>}>
                <p className="text-sm">
                  Due {o.due} · {money(o.price)}
                </p>
                <p className="mt-2 text-xs text-ink-500">
                  {o.deliverable || "Updates will appear here."}
                </p>
                {o.status === "Quoted" && (
                  <Actions>
                    <Button
                      onClick={() => {
                        if (
                          window.confirm(
                            `Approve the ${money(o.price)} quote? An invoice will be issued.`,
                          )
                        )
                          dispatch(
                            command("service.approve", o.id, {}, o.version),
                          );
                      }}
                    >
                      Approve quote
                    </Button>
                  </Actions>
                )}
              </Card>
            ))}
        </div>
      )}
      {invoice && proof && (
        <Modal title="Submit payment evidence" onClose={() => setProof(null)}>
          <PaymentForm
            invoice={invoice}
            payment={payments.find((p) => p.id === proof.paymentId)}
            close={() => setProof(null)}
          />
        </Modal>
      )}
      {order && (
        <Modal title="Confirm request" onClose={() => setOrder(null)}>
          <p className="text-sm text-ink-500">
            {order.kind === "sms"
              ? "Creates an invoice; credits arrive after verified payment."
              : "Creates a service request for the team to quote and schedule."}
          </p>
          <Actions>
            <Button
              onClick={() => {
                if (
                  dispatch(
                    command(
                      order.kind === "sms"
                        ? "sms.packageOrder"
                        : "service.request",
                      undefined,
                      {
                        tenantId: tenant,
                        ...(order.kind === "sms"
                          ? { packageId: order.id }
                          : { serviceId: order.id }),
                      },
                    ),
                  )
                )
                  setOrder(null);
              }}
            >
              Confirm request
            </Button>
          </Actions>
        </Modal>
      )}
    </>
  );
}
