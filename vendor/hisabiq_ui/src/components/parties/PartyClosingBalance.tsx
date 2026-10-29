import {useFinancialDisplay} from '../../financial-display/useFinancialDisplay';
import {financialContexts,type FinancialContext} from '../../financial-display/model';
import { taka } from '../../utils/currency';
import type { PartyRole } from '../../types/erp';

export type ClosingBalanceMeaning = 'receivable' | 'payable' | 'credit' | 'capital' | 'settled';

/** Dr/Cr remain the ledger's accounting sign; labels describe the party relationship. */
export function closingBalanceMeaning(relationship: PartyRole, balance: number): ClosingBalanceMeaning {
  if (Math.abs(balance) < 0.00001) return 'settled';
  if (relationship === 'Owner') return 'capital';
  if (balance > 0) return 'receivable';
  return relationship === 'Customer' ? 'credit' : 'payable';
}

export function PartyClosingBalance({
  balance, relationship, compact = false, language
}: {
  balance: number;
  relationship: PartyRole;
  compact?: boolean;
  language?: string;
}) {
  const {text}=useFinancialDisplay(financialContexts.includes(relationship as FinancialContext)?relationship as FinancialContext:"Customer",language);
  const meaning = closingBalanceMeaning(relationship, balance);
  const term = meaning === 'receivable' ? text('Receivable', 'পাওনা')
    : meaning === 'payable' ? text('Payable', 'দেনা')
    : meaning === 'credit' ? text('Customer credit', 'ক্রেতার জমা')
    : meaning === 'capital' ? text('Capital balance', 'মূলধনের জের')
    : text('Settled', 'হিসাব সমান');
  const foreground = meaning === 'payable' || meaning === 'credit'
    ? 'text-danger'
    : meaning === 'receivable' ? 'text-teal-800 dark:text-teal-400' : 'text-ink-800';
  const surface = meaning === 'payable' || meaning === 'credit'
    ? 'bg-danger-bg/55'
    : meaning === 'receivable' ? 'bg-teal-50/60' : 'bg-ink-50';
  const sign = balance < 0 ? 'Cr' : 'Dr';
  return <div data-testid="party-closing-balance"
    data-balance-meaning={meaning}
    className={`flex min-w-0 items-center justify-between gap-3 border-t border-border px-4 ${compact ? 'py-2' : 'py-3'} ${surface}`}>
    <strong className={compact ? 'text-xs font-semibold text-ink' : 'text-[13px] font-semibold text-ink'}>
      {text('Closing balance', 'শেষ জের')}
    </strong>
    <strong className={`min-w-0 break-words text-right ${compact ? 'text-sm' : 'text-base'} ${foreground}`}
      title={text('Accounting balance', 'হিসাবের জের') + ' · ' + sign}>
      {taka(Math.abs(balance))} <span className="font-semibold">{term}</span>
      <span className="sr-only"> {sign}</span>
    </strong>
  </div>;
}
