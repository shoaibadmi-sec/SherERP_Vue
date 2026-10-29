import {
  currentBusinessId,
  parseSettings,
  settingsKey,
  type TenantSettings,
} from "../settings/model.ts";
import type { ReceiptPreviewProps } from "../components/brand/ReceiptPreview";
let current: TenantSettings | undefined;
/** The Settings provider publishes its canonical state, including memory-only saves. */
export function publishPreviewSettings(state: TenantSettings | undefined) {
  current = state;
}
/** UI-preview adapter only; production passes authenticated settings and immutable issued snapshots. */
export function readPreviewSettings(): TenantSettings | undefined {
  if (typeof window === "undefined") return undefined;
  if (current) return structuredClone(current);
  try {
    return parseSettings(
      window.localStorage.getItem(settingsKey(currentBusinessId)),
      currentBusinessId,
    ).state;
  } catch {
    return undefined;
  }
}
export function reconstructInvoiceCopy(
  props: ReceiptPreviewProps,
  state: TenantSettings,
): ReceiptPreviewProps {
  if (props.branding?.design) return props;
  const invoice = state.sections.invoices;
  return {
    ...props,
    reconstructed: true,
    branding: {
      ...state.sections.business,
      showLogo: invoice.showLogo,
      footer: invoice.footer,
      design: structuredClone(invoice.design),
    },
  };
}
