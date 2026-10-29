import { ArrowDownLeft, ArrowUpRight, BookOpen, FileText, RefreshCcw } from 'lucide-react';
import type { PartyLedgerRow } from '../../types/partyLedger';
import type { UiLanguage } from '../../i18n/uiCopy';
import { ledgerImpact, type LedgerImpact } from '../../utils/partyLedgerImpact';
import { partyLedgerCaption } from '../../i18n/partyLedgerCopy';
import { partyLedgerImpactText } from '../../i18n/partyFinancialCopy';
import { formatMoneyNumber, taka } from '../../utils/currency';

/** Shared accounting amount presentation across desktop, tablet and phone.
 * Money values and explanations remain neutral. Only meaningful movement icons
 * use semantic colors; a due/opening icon does not imply physical cash movement.
 * This is display-only and never changes the ledger's debit/credit polarity.
 */
const iconTone: Record<LedgerImpact['kind'], string> = {
  in: 'text-emerald-700 dark:text-emerald-400',
  out: 'text-rose-700 dark:text-rose-400',
  adjustment: 'text-amber-700 dark:text-amber-400',
  due: 'text-ink-400',
  opening: 'text-ink-400',
  neutral: 'text-ink-400'
};

export function LedgerImpactAmount({
  row, value, language, currency = false
}: {
  row: PartyLedgerRow;
  value: number;
  language: UiLanguage;
  /** Show the taka prefix in responsive accounting tables only. */
  currency?: boolean;
}) {
  if (!value) return <span className="text-ink-400">—</span>;
  const info = ledgerImpact(row);
  const formatted = currency ? taka(value) : formatMoneyNumber(value);
  if (info.kind === 'neutral') return <span className="font-semibold text-ink">{formatted}</span>;
  const Icon = info.kind === 'in' ? ArrowDownLeft : info.kind === 'out' ? ArrowUpRight :
    info.kind === 'due' ? FileText : info.kind === 'opening' ? BookOpen : RefreshCcw;
  const accessibleImpact = partyLedgerImpactText(language, info.label);
  const caption = partyLedgerCaption(language, row, info.label, info.kind);
  return <div data-testid="ledger-impact-amount" data-impact-kind={info.kind}
    className="flex min-w-0 flex-col items-end gap-0.5 text-right">
    <span data-testid="ledger-money-value" aria-label={accessibleImpact} title={accessibleImpact}
      className="inline-flex max-w-full items-center justify-end gap-1 font-semibold leading-tight text-ink">
      <Icon data-testid="ledger-impact-icon" className={`size-3.5 shrink-0 ${iconTone[info.kind]}`} aria-hidden="true" />
      <span className="break-words">{formatted}</span>
    </span>
    <span data-table-helper="" data-testid="ledger-impact-caption" className="text-right text-[10px] font-normal leading-tight text-ink-500">
      {caption}
    </span>
  </div>;
}
