import { useState } from "react";
import { useSaas, command } from "../SaasProvider";
import type { Invoice, Payment, Attachment } from "../types";
import { Field, Input, Select, Area, Actions, Button } from "../components";
import { due } from "./selectors";
export function PaymentForm({
  invoice,
  payment,
  close,
}: {
  invoice: Invoice;
  payment?: Payment;
  close: () => void;
}) {
  const { state: s, dispatch } = useSaas();
  const [evidence, setEvidence] = useState<Attachment | undefined>(
    payment?.evidence,
  );
  const [error, setError] = useState("");
  const [reading, setReading] = useState(false);
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (reading || error) return;
        const f = Object.fromEntries(new FormData(e.currentTarget));
        if (
          dispatch(
            command(
              "payment.submit",
              payment?.id,
              {
                ...f,
                amount: Math.round(Number(f.amount) * 100),
                invoiceId: invoice.id,
                tenantId: invoice.tenantId,
                evidence,
              },
              payment?.version,
            ),
          )
        )
          close();
      }}
    >
      <Field label="Amount (BDT)">
        <Input
          name="amount"
          type="number"
          min="0.01"
          step="0.01"
          defaultValue={(payment?.amount || due(s, invoice)) / 100}
          required
        />
      </Field>
      <Field label="Payment method">
        <Select name="method" defaultValue={payment?.method}>
          {["bKash", "Nagad", "Rocket", "Bank transfer", "Cash"].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </Select>
      </Field>
      <Field label="Collection account">
        <Input name="account" value={s.settings.collectionAccount} readOnly />
      </Field>
      <Field label="Transaction reference">
        <Input name="reference" defaultValue={payment?.reference} required />
      </Field>
      <Field label="Evidence (PNG, JPEG or PDF, up to 1 MB)">
        <input
          type="file"
          accept="image/png,image/jpeg,application/pdf"
          onChange={(e) => {
            const f = e.target.files?.[0];
            setError("");
            if (!f) return;
            if (
              f.size > 1000000 ||
              !["image/png", "image/jpeg", "application/pdf"].includes(f.type)
            ) {
              setError("Choose a supported file no larger than 1 MB.");
              return;
            }
            setReading(true);
            const reader = new FileReader();
            reader.onload = () => {
              setEvidence({
                name: f.name,
                type: f.type,
                data: String(reader.result),
              });
              setReading(false);
            };
            reader.onerror = () => {
              setError("The file could not be read.");
              setReading(false);
            };
            reader.readAsDataURL(f);
          }}
        />
        {evidence && (
          <span className="block text-xs text-ink-500">
            Attached: {evidence.name}
          </span>
        )}
      </Field>
      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
      <Field label="Note">
        <Area name="reason" defaultValue={payment?.reason} />
      </Field>
      <p className="text-xs text-ink-500">
        Submission is evidence, not a confirmed receipt. No actual money is
        transferred.
      </p>
      <Actions>
        <Button type="submit" disabled={reading || !!error}>
          {payment ? "Resubmit proof" : "Submit proof"}
        </Button>
      </Actions>
    </form>
  );
}
