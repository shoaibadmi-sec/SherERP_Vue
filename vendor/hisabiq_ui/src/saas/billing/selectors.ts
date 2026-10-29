import type { SaasState, Invoice } from "../types.ts";
export const paid = (s: SaasState, id: string) =>
  s.allocations
    .filter((a) => a.invoiceId === id)
    .reduce((v, a) => v + a.amount, 0);
export const due = (s: SaasState, i: Invoice) =>
  i.status === "Voided" ? 0 : Math.max(0, i.amount - paid(s, i.id));
export const available = (s: SaasState, receiptId: string) => {
  const r = s.receipts.find((r) => r.id === receiptId);
  return r
    ? r.amount -
        s.adjustments
          .filter((a) => a.receiptId === r.id)
          .reduce((v, a) => v + a.amount, 0) -
        s.allocations
          .filter((a) => a.receiptId === r.id)
          .reduce((v, a) => v + a.amount, 0)
    : 0;
};
export const collected = (s: SaasState, tenantId?: string) =>
  s.receipts
    .filter((r) => !tenantId || r.tenantId === tenantId)
    .reduce((v, r) => v + r.amount, 0) -
  s.adjustments
    .filter((r) => !tenantId || r.tenantId === tenantId)
    .reduce((v, r) => v + r.amount, 0);
