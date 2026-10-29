import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useSaas, command } from "../SaasProvider";
import { can } from "../permissions";
import { useScoped } from "../hooks";
import {
  Heading,
  DataTable,
  Badge,
  Button,
  Modal,
  Field,
  Input,
  Area,
  Actions,
  Card,
  Empty,
  money,
} from "../components";
import { due, available } from "./selectors";
import { PaymentForm } from "./PaymentForm";
export function PaymentsPage() {
  const { state: s } = useSaas();
  const rows = useScoped(s.payments, "payments.view");
  return (
    <>
      <Heading
        title="Payment verification"
        bn="পেমেন্ট যাচাই · Evidence, review and confirmed receipts"
      />
      <DataTable
        rows={rows}
        columns={[
          {
            label: "Reference",
            render: (p) => (
              <Link
                className="font-medium text-primary"
                to={`/saas/payments/${p.id}`}
              >
                {p.reference}
                <p className="text-xs text-ink-500">{p.id}</p>
              </Link>
            ),
          },
          {
            label: "Tenant",
            render: (p) => s.tenants.find((t) => t.id === p.tenantId)?.name,
          },
          { label: "Method", render: (p) => p.method },
          {
            label: "Amount",
            render: (p) => (
              <span className="block text-right">{money(p.amount)}</span>
            ),
          },
          {
            label: "Reviewer",
            render: (p) =>
              s.staff.find((x) => x.id === p.reviewer)?.name || "Unassigned",
          },
          { label: "Status", render: (p) => <Badge>{p.status}</Badge> },
          {
            label: "Actions",
            render: (p) => (
              <Link
                className="text-primary underline"
                to={`/saas/payments/${p.id}`}
              >
                Review payment
              </Link>
            ),
          },
        ]}
      />
    </>
  );
}
export function PaymentReview() {
  const { id } = useParams();
  const { state: s, actor, dispatch } = useSaas();
  const [action, setAction] = useState("");
  const p = s.payments.find((p) => p.id === id);
  if (!p || !can(s, actor, "payments.view", p.tenantId))
    return <Empty text="Payment unavailable." />;
  const invoice = s.invoices.find((i) => i.id === p.invoiceId)!;
  const receipt = s.receipts.find((r) => r.paymentId === p.id);
  const review =
    can(s, actor, "payments.verify", p.tenantId) &&
    ["Pending", "Needs information"].includes(p.status);
  return (
    <>
      <Heading
        title={p.reference}
        bn={`${p.id} · ${s.tenants.find((t) => t.id === p.tenantId)?.name}`}
      >
        <Badge>{p.status}</Badge>
        {review && (
          <Button
            variant="outline"
            onClick={() =>
              dispatch(command("payment.claim", p.id, {}, p.version))
            }
          >
            Claim review
          </Button>
        )}
      </Heading>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Payment evidence">
          {p.evidence ? (
            <>
              <a
                href={p.evidence.data}
                download={p.evidence.name}
                className="text-sm text-primary underline"
              >
                Download {p.evidence.name}
              </a>
              {p.evidence.type.startsWith("image/") && (
                <img
                  src={p.evidence.data}
                  alt="Submitted payment evidence"
                  className="mt-3 max-h-96 rounded-lg object-contain"
                />
              )}
              {p.evidence.type === "application/pdf" && (
                <p className="mt-3 text-xs text-ink-500">
                  Download the PDF to inspect the payment evidence.
                </p>
              )}
            </>
          ) : (
            <Empty text="No attachment. This seeded demo uses a text reference; confirm receipt against your collection records." />
          )}
          <p className="mt-4 text-sm text-ink-500">{p.reason}</p>
        </Card>
        <Card title="Review details">
          <dl className="space-y-4 text-sm">
            {[
              ["Tenant", s.tenants.find((t) => t.id === p.tenantId)?.name],
              ["Amount", money(p.amount)],
              ["Channel", p.method],
              ["Collection account", p.account],
              ["Invoice due", money(due(s, invoice))],
              ["Submitted by", p.createdBy],
              ["Reviewer", p.reviewer || "Unassigned"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3">
                <dt className="text-ink-500">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          <Link
            className="mt-4 block text-xs text-primary underline"
            to={`/saas/invoices/${invoice.id}`}
          >
            Open linked invoice
          </Link>
          {review && (
            <Actions>
              <Button
                variant="outline"
                onClick={() => setAction("requestInfo")}
              >
                Request information
              </Button>
              <Button variant="outline" onClick={() => setAction("reject")}>
                Reject
              </Button>
              <Button
                disabled={p.createdBy === actor.id}
                onClick={() => setAction("verify")}
              >
                Verify payment
              </Button>
            </Actions>
          )}
          {p.createdBy === actor.id && (
            <p className="mt-3 text-xs text-warning">
              A different employee must verify your submission.
            </p>
          )}
          {receipt && (
            <>
              <p className="mt-4 text-sm">
                Unapplied credit: {money(available(s, receipt.id))}
              </p>
              {can(s, actor, "payments.refund", p.tenantId) && (
                <Actions>
                  <Button variant="outline" onClick={() => setAction("refund")}>
                    Refund
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setAction("reverse")}
                  >
                    Reverse receipt
                  </Button>
                </Actions>
              )}
            </>
          )}
          {p.status === "Needs information" && p.createdBy === actor.id && (
            <Actions>
              <Button onClick={() => setAction("resubmit")}>
                Resubmit proof
              </Button>
            </Actions>
          )}
        </Card>
      </div>
      {receipt && (
        <div className="mt-4">
          <Card title="Receipt adjustments">
            {s.adjustments
              .filter((x) => x.receiptId === receipt.id)
              .map((x) => (
                <p key={x.id} className="border-b border-border py-2 text-sm">
                  {x.kind} · {money(x.amount)} · {x.reason}
                </p>
              ))}
          </Card>
        </div>
      )}
      {action && (
        <Modal
          title={
            action === "verify"
              ? "Verify payment — impact preview"
              : `${action} payment`
          }
          onClose={() => setAction("")}
        >
          {action === "resubmit" ? (
            <PaymentForm
              invoice={invoice}
              payment={p}
              close={() => setAction("")}
            />
          ) : (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                const f = Object.fromEntries(new FormData(e.currentTarget));
                if (
                  dispatch(
                    command(
                      `payment.${action}`,
                      ["refund", "reverse"].includes(action)
                        ? receipt!.id
                        : p.id,
                      {
                        ...f,
                        ...(f.amount
                          ? { amount: Math.round(Number(f.amount) * 100) }
                          : {}),
                      },
                      ["refund", "reverse"].includes(action)
                        ? undefined
                        : p.version,
                    ),
                  )
                )
                  setAction("");
              }}
            >
              {action === "verify" ? (
                <>
                  <p className="text-sm">
                    Receipt: <strong>{money(p.amount)}</strong>
                  </p>
                  <p className="text-sm">
                    Allocate to {invoice.id}:{" "}
                    {money(Math.min(p.amount, due(s, invoice)))}
                  </p>
                  <p className="text-sm">
                    Unapplied credit:{" "}
                    {money(Math.max(0, p.amount - due(s, invoice)))}
                  </p>
                  <p className="rounded-lg bg-warning-bg p-3 text-xs text-warning">
                    Verify only after checking the actual collection record.
                    Full settlement activates the linked purchase once.
                  </p>
                  <label className="flex gap-2 text-sm">
                    <input type="checkbox" required />I checked the collection
                    record.
                  </label>
                </>
              ) : (
                <>
                  {action === "refund" && (
                    <Field label="Refund amount (BDT)">
                      <Input
                        name="amount"
                        type="number"
                        min="0.01"
                        step="0.01"
                        required
                      />
                    </Field>
                  )}
                  <Field label="Reason visible in history">
                    <Area name="reason" required />
                  </Field>
                  {["refund", "reverse"].includes(action) && (
                    <p className="text-xs text-warning">
                      This records a demo financial adjustment, reopens affected
                      invoice dues and may place the subscription in grace. No
                      money is sent.
                    </p>
                  )}
                </>
              )}
              <Actions>
                <Button type="submit">Confirm {action}</Button>
              </Actions>
            </form>
          )}
        </Modal>
      )}
    </>
  );
}
