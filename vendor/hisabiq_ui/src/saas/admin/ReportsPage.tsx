import React, { useState } from "react";
import { useSaas } from "../SaasProvider";
import { can } from "../permissions";
import {
  Heading,
  Card,
  Metric,
  Button,
  Field,
  Input,
  DataTable,
  money,
} from "../components";
import { due } from "../billing/selectors";
export function ReportsPage() {
  const { state: s, actor } = useSaas();
  const [from, setFrom] = useState("2026-01-01");
  const [to, setTo] = useState("2026-12-31");
  const rows = s.tenants
    .filter((t) => can(s, actor, "reports.view", t.id))
    .map((t) => {
      const receipts = s.receipts.filter(
        (r) =>
          r.tenantId === t.id &&
          r.date.slice(0, 10) >= from &&
          r.date.slice(0, 10) <= to,
      );
      const adjustments = s.adjustments.filter(
        (r) =>
          r.tenantId === t.id &&
          r.date.slice(0, 10) >= from &&
          r.date.slice(0, 10) <= to,
      );
      return {
        ...t,
        collected:
          receipts.reduce((v, r) => v + r.amount, 0) -
          adjustments.reduce((v, r) => v + r.amount, 0),
        due: s.invoices
          .filter((i) => i.tenantId === t.id)
          .reduce((v, i) => v + due(s, i), 0),
        mrr: s.subscriptions
          .filter((x) => x.tenantId === t.id && x.status === "Active")
          .reduce((v, x) => v + x.price, 0),
        tickets: s.tickets.filter(
          (x) =>
            x.tenantId === t.id && !["Resolved", "Closed"].includes(x.status),
        ).length,
      };
    });
  const csv = () => {
    const safe = (v: unknown) =>
      `"${String(v)
        .replace(/^[=+@-]/, "'$&")
        .replace(/"/g, '""')}"`;
    const contents = [
      [
        "Tenant",
        "Cash collected BDT",
        "Outstanding BDT",
        "MRR BDT",
        "Open tickets",
      ],
      ...rows
        .filter((r) => can(s, actor, "reports.export", r.id))
        .map((r) => [
          r.name,
          r.collected / 100,
          r.due / 100,
          r.mrr / 100,
          r.tickets,
        ]),
    ]
      .map((r) => r.map(safe).join(","))
      .join("\n");
    const url = URL.createObjectURL(
      new Blob([contents], { type: "text/csv;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "hisabiq-saas-report.csv";
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <>
      <Heading
        title="Reports"
        bn="রিপোর্ট · Clear definitions, traceable totals"
      >
        {rows.some((r) => can(s, actor, "reports.export", r.id)) && (
          <Button onClick={csv}>Export CSV</Button>
        )}
      </Heading>
      <div className="mb-4 flex flex-wrap gap-3">
        <Field label="Cash collection from">
          <Input
            type="date"
            value={from}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFrom(e.target.value)
            }
          />
        </Field>
        <Field label="Through">
          <Input
            type="date"
            value={to}
            min={from}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setTo(e.target.value)
            }
          />
        </Field>
      </div>
      <div className="mb-5 grid gap-3 md:grid-cols-3">
        <Metric
          label="Net cash collected"
          value={money(rows.reduce((v, r) => v + r.collected, 0))}
          detail="Verified receipts less adjustments in selected period"
        />
        <Metric
          label="Outstanding today"
          value={money(rows.reduce((v, r) => v + r.due, 0))}
          detail="Current invoice balances, all dates"
        />
        <Metric
          label="Monthly recurring revenue"
          value={money(rows.reduce((v, r) => v + r.mrr, 0))}
          detail="Active monthly plan snapshots, not cash receipts"
        />
      </div>
      <DataTable
        rows={rows}
        columns={[
          { label: "Tenant", render: (r) => r.name },
          { label: "Net cash", render: (r) => money(r.collected) },
          { label: "Outstanding", render: (r) => money(r.due) },
          { label: "MRR", render: (r) => money(r.mrr) },
          { label: "Open support", render: (r) => r.tickets },
        ]}
      />
      <div className="mt-4">
        <Card title="How to read these figures">
          <p className="text-xs leading-relaxed text-ink-500">
            Cash uses the selected date range. Outstanding balances and monthly
            recurring revenue are current snapshots. Trial, grace, expired and
            cancelled subscriptions do not count toward active MRR. These are
            demonstration management figures, not accounting or tax statements.
          </p>
        </Card>
      </div>
    </>
  );
}
