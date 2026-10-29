import { useState } from "react";
import type { SalesInvoice } from "../types/erp";
import { useTenantSettings } from "./TenantSettingsProvider";
import { canManage } from "./model";
import { Input, Button } from "./ui";
import { reviseInvoicePresentation } from "../documents/reviseInvoice";
import {
  getSalesPreviewSnapshot,
  updateSalesPreview,
} from "../data/salesPreviewStore";
export function InvoicePresentationEditor({
  invoice,
  onSaved,
}: {
  invoice: SalesInvoice;
  onSaved: (invoice: SalesInvoice) => void;
}) {
  const { state, actorId } = useTenantSettings();
  const [name, setName] = useState(
      invoice.documentSnapshot?.customer ?? invoice.party,
    ),
    [note, setNote] = useState(
      invoice.documentSnapshot?.branding?.design?.note ?? "",
    ),
    [labels, setLabels] = useState<Record<string, string>>({}),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  if (!canManage(state, actorId, "invoices")) return null;
  return (
    <details className="rounded-lg border border-border bg-card p-3">
      <summary className="cursor-pointer text-[13px] font-medium">
        Invoice display only · প্রিন্টের নাম ও নোট
      </summary>
      <div className="mt-3 space-y-3">
        <p className="text-xs text-helper">
          Change display wording without changing customer/product records,
          amounts or stock. Each change preserves the previous copy and records
          who changed it.
        </p>
        <label className="block text-xs">
          Customer display name
          <Input
            aria-label="Customer display name"
            maxLength={2000}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        {invoice.lines.map((line) => (
          <label key={line.id} className="block text-xs">
            {line.name}
            <Input
              aria-label={`Display label ${line.id}`}
              maxLength={2000}
              value={
                labels[line.id] ??
                invoice.documentSnapshot?.lines[invoice.lines.indexOf(line)]
                  ?.name ??
                line.name
              }
              onChange={(e) =>
                setLabels({ ...labels, [line.id]: e.target.value })
              }
            />
          </label>
        ))}
        <label className="block text-xs">
          Additional printed note
          <Input
            aria-label="Additional printed note"
            maxLength={2000}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
        {error && (
          <p role="alert" className="text-xs text-danger">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="text-xs text-success">
            {notice}
          </p>
        )}
        <Button
          variant="outline"
          onClick={() => {
            try {
              const current = getSalesPreviewSnapshot().invoices.find(
                (i) => i.id === invoice.id,
              );
              if (
                !current ||
                JSON.stringify(current) !== JSON.stringify(invoice)
              )
                throw Error(
                  "Invoice changed. Reopen it before changing its presentation.",
                );
              const next = reviseInvoicePresentation(
                current,
                { customerName: name, productLabels: labels, note },
                state,
                actorId,
                new Date().toISOString(),
              );
              updateSalesPreview("invoices", (rows) =>
                rows.map((i) => (i.id === invoice.id ? next : i)),
              );
              onSaved(next);
              setNotice(
                "Presentation revision saved in this session. Financial records are unchanged.",
              );
              setError("");
            } catch (e) {
              setError(
                e instanceof Error ? e.message : "Could not save presentation.",
              );
            }
          }}
        >
          Save presentation revision
        </Button>
        {invoice.documentHistory?.length ? (
          <p className="text-xs text-helper">
            {invoice.documentHistory.length} previous copies retained.
          </p>
        ) : null}
      </div>
    </details>
  );
}
