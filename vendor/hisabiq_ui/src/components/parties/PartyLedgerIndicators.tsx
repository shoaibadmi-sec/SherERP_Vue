import { Paperclip } from 'lucide-react';
import { StatusBadge, type StatusTone } from '../StatusBadge';
import type { PartyLedgerRow, PartyLedgerSource } from '../../types/partyLedger';
import { useUiCopy } from '../../i18n/useUiCopy';

/** Subtle, source-based colors; never infer transaction type from debit/credit. */
const sourceTone: Record<PartyLedgerSource, StatusTone> = {
  opening: 'neutral',
  purchase: 'info',
  sale: 'teal',
  'customer-payment': 'success',
  'supplier-payment': 'success',
  'purchase-return': 'warning',
  'sale-return': 'warning',
  'customer-credit-refund': 'warning',
  'supplier-credit-refund': 'warning',
  'customer-credit-apply': 'teal',
  finance: 'info',
  expense: 'danger',
  note: 'neutral'
};

export function PartyLedgerSourceBadge({ source, label }: { source: PartyLedgerSource; label: string }) {
  const { text } = useUiCopy();
  const displayLabel = source === 'sale' ? text('Sale','বিক্রি') : label;
  return <span data-testid="party-ledger-source-badge" data-source={source} className="inline-flex shrink-0">
    <StatusBadge tone={sourceTone[source]}>{displayLabel}</StatusBadge>
  </span>;
}

/** Ledger rows currently have a single optional attachment, so the count is one. */
export function PartyLedgerAttachment({
  attachment, label, onClick
}: {
  attachment: NonNullable<PartyLedgerRow['attachment']>;
  label: string;
  onClick: () => void;
}) {
  return <button type="button" data-testid="party-ledger-attachment"
    aria-label={label + ' ' + attachment.name}
    title={attachment.name} onClick={onClick}
    className="inline-flex shrink-0 items-center gap-0.5 rounded px-1 py-0.5 text-[11px] font-medium text-teal-700 hover:bg-teal-50 focus-visible:outline-2 focus-visible:outline-teal-500">
    <Paperclip className="size-3.5" aria-hidden="true" />
    <span aria-hidden="true">1</span>
  </button>;
}
