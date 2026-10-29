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
  Empty,
  money,
  Metric,
} from "../components";
import { paid, due, available } from "./selectors";
import { PaymentForm } from "./PaymentForm";
export function InvoicesPage() {
  const { state: s, actor, dispatch } = useSaas();
  const rows = useScoped(s.invoices, "billing.view");
  const [open, setOpen] = useState(false);
  return (
    <>
      <Heading
        title="SaaS invoices"
        bn="সাবস্ক্রিপশন ও সেবার বিল · Separate from business sales"
      >
        {allowed(s, actor, "billing.edit") && (
          <Button onClick={() => setOpen(true)}>Issue invoice</Button>
        )}
      </Heading>
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Metric
          label="Invoiced"
          value={money(
            rows
              .filter((i) => i.status !== "Voided")
              .reduce((v, i) => v + i.amount, 0),
          )}
          detail="Visible invoices"
        />
        <Metric
          label="Allocated payments"
          value={money(rows.reduce((v, i) => v + paid(s, i.id), 0))}
          detail="Confirmed receipts applied to bills"
        />
        <Metric
          label="Outstanding"
          value={money(rows.reduce((v, i) => v + due(s, i), 0))}
          detail="Remaining invoice balances"
        />
      </div>
      <DataTable
        rows={rows}
        columns={[
          {
            label: "Invoice",
            render: (i) => (
              <Link
                className="font-medium text-primary"
                to={`/saas/invoices/${i.id}`}
              >
                {i.id}
                <p className="max-w-xs text-xs text-ink-500">{i.description}</p>
              </Link>
            ),
          },
          {
            label: "Tenant",
            render: (i) => s.tenants.find((t) => t.id === i.tenantId)?.name,
          },
          { label: "Due date", render: (i) => i.due },
          {
            label: "Total",
            render: (i) => (
              <span className="block text-right">{money(i.amount)}</span>
            ),
          },
          {
            label: "Remaining",
            render: (i) => (
              <span className="block text-right">{money(due(s, i))}</span>
            ),
          },
          { label: "Status", render: (i) => <Badge>{i.status}</Badge> },
        ]}
      />
      {open && (
        <Modal title="Issue SaaS invoice" onClose={() => setOpen(false)}>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const f = Object.fromEntries(new FormData(e.currentTarget));
              if (
                dispatch(
                  command("invoice.issue", undefined, {
                    ...f,
                    amount: Math.round(Number(f.amount) * 100),
                  }),
                )
              )
                setOpen(false);
            }}
          >
            <Field label="Tenant">
              <Select name="tenantId">
                {s.tenants
                  .filter((t) => can(s, actor, "billing.edit", t.id))
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
              </Select>
            </Field>
            <Field label="Description">
              <Input name="description" required />
            </Field>
            <Field label="Amount (BDT)">
              <Input
                name="amount"
                type="number"
                min="0.01"
                step="0.01"
                required
              />
            </Field>
            <Field label="Due date">
              <Input name="due" type="date" required />
            </Field>
            <Actions>
              <Button type="submit">Issue invoice</Button>
            </Actions>
          </form>
        </Modal>
      )}
    </>
  );
}
export function InvoicePage() {
  const { id } = useParams();
  const { state: s, actor, dispatch } = useSaas();
  const [action, setAction] = useState("");
  const i = s.invoices.find((i) => i.id === id);
  if (!i || !can(s, actor, "billing.view", i.tenantId))
    return <Empty text="Invoice unavailable." />;
  const receipts = s.receipts.filter(
    (r) => r.tenantId === i.tenantId && available(s, r.id) > 0,
  );
  return (
    <>
      <Heading
        title={i.id}
        bn={s.tenants.find((t) => t.id === i.tenantId)?.name || ""}
      >
        <Badge>{i.status}</Badge>
        <Button variant="outline" onClick={() => window.print()}>
          Print / save PDF
        </Button>
        {can(s, actor, "payments.submit", i.tenantId) &&
          i.status !== "Voided" && (
            <Button onClick={() => setAction("proof")}>
              Submit payment proof
            </Button>
          )}
      </Heading>
      <Card title="Invoice detail">
        <div className="flex flex-wrap justify-between gap-4 text-sm">
          <div>
            <p className="font-medium">{i.description}</p>
            <p className="mt-2 text-ink-500">Due {i.due} · BDT</p>
          </div>
          <div className="space-y-2 text-right">
            <p>Total: {money(i.amount)}</p>
            <p>Paid: {money(paid(s, i.id))}</p>
            <p className="font-semibold">Remaining: {money(due(s, i))}</p>
          </div>
        </div>
        {can(s, actor, "billing.edit", i.tenantId) && (
          <Actions>
            {receipts.length > 0 && due(s, i) > 0 && (
              <Button variant="outline" onClick={() => setAction("allocate")}>
                Apply credit
              </Button>
            )}
            <Button
              variant="outline"
              disabled={i.status === "Voided" || paid(s, i.id) > 0}
              onClick={() => setAction("void")}
            >
              Void invoice
            </Button>
          </Actions>
        )}
      </Card>
      <div className="mt-4">
        <Card title="Payment submissions">
          {s.payments
            .filter((p) => p.invoiceId === i.id)
            .map((p) => (
              <Link
                key={p.id}
                className="mb-3 flex justify-between text-sm text-primary"
                to={`/saas/payments/${p.id}`}
              >
                {p.reference} · {money(p.amount)} <Badge>{p.status}</Badge>
              </Link>
            ))}
          {!s.payments.some((p) => p.invoiceId === i.id) && (
            <Empty text="No payment evidence submitted yet." />
          )}
        </Card>
      </div>
      {action && (
        <Modal
          title={
            action === "proof"
              ? "Submit payment proof"
              : action === "allocate"
                ? "Apply available credit"
                : "Void invoice"
          }
          onClose={() => setAction("")}
        >
          {action === "proof" ? (
            <PaymentForm invoice={i} close={() => setAction("")} />
          ) : (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                const f = Object.fromEntries(new FormData(e.currentTarget));
                const c =
                  action === "allocate"
                    ? command("payment.allocate", String(f.receiptId), {
                        invoiceId: i.id,
                        amount: Math.round(Number(f.amount) * 100),
                      })
                    : command("invoice.void", i.id, f, i.version);
                if (dispatch(c)) setAction("");
              }}
            >
              {action === "allocate" ? (
                <>
                  <Field label="Receipt credit">
                    <Select name="receiptId">
                      {receipts.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.id} · {money(available(s, r.id))} available
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Amount (BDT)">
                    <Input
                      type="number"
                      name="amount"
                      min="0.01"
                      step="0.01"
                      defaultValue={due(s, i) / 100}
                    />
                  </Field>
                </>
              ) : (
                <Field label="Reason">
                  <Area name="reason" required />
                </Field>
              )}
              <Actions>
                <Button type="submit">Confirm</Button>
              </Actions>
            </form>
          )}
        </Modal>
      )}
    </>
  );
}
