import type { SalesInvoice } from "../types/erp.ts";
import type { TenantSettings } from "../settings/model.ts";
import { canManage } from "../settings/model.ts";
import { invoiceReceipt } from "../utils/salesDocuments.ts";
import { presentationRevision, type PresentationPatch } from "./profile.ts";
import { reconstructInvoiceCopy } from "./previewSettings.ts";
export function reviseInvoicePresentation(
  invoice: SalesInvoice,
  patch: PresentationPatch,
  state: TenantSettings,
  actor: string,
  at: string,
): SalesInvoice {
  if (!canManage(state, actor, "invoices"))
    throw Error("You do not have invoice-presentation permission.");
  const base =
    invoice.documentSnapshot ??
    reconstructInvoiceCopy(invoiceReceipt(invoice), state);
  const revision = presentationRevision(base, patch, actor, at);
  const copy = structuredClone(revision.source);
  if (patch.customerName !== undefined) copy.customer = patch.customerName;
  if (patch.productLabels) {
    const ids = invoice.lines.map((l) => l.id);
    if (Object.keys(patch.productLabels).some((id) => !ids.includes(id)))
      throw Error("Unknown source line.");
    copy.lines = copy.lines.map((line, i) => ({
      ...line,
      name: patch.productLabels?.[invoice.lines[i].id] ?? line.name,
    }));
  }
  if (copy.branding?.design)
    copy.branding.design = {
      ...copy.branding.design,
      note: patch.note ?? copy.branding.design.note,
      message:
        [patch.delivery, patch.warrantyNote, patch.message]
          .filter(Boolean)
          .join("\n") || copy.branding.design.message,
    };
  return {
    ...structuredClone(invoice),
    documentSnapshot: copy,
    documentHistory: [
      ...(invoice.documentHistory ?? []),
      structuredClone(base),
    ],
    presentationAudit: [
      ...(invoice.presentationAudit ?? []),
      { actor, at, fields: Object.keys(patch) },
    ],
  };
}
