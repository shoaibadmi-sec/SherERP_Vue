import {useFinancialDisplay} from '../../financial-display/useFinancialDisplay';
import {financialContexts,type FinancialContext} from '../../financial-display/model';
import type { ReactNode } from 'react';
import type { PartyRole } from '../../types/erp';
import { taka } from '../../utils/currency';
import { useUiCopy } from '../../i18n/useUiCopy';

type Tone = 'receivable' | 'payable' | 'neutral';
type Copy = {
  title: [english: string, bangla: string];
  hint: [english: string, bangla: string];
  tone: Tone;
};

const receivableText: Record<PartyRole, Copy['hint']> = {
  Customer: ['They owe you', 'ক্রেতার কাছে পাওনা'],
  Supplier: ['Supplier owes you', 'সরবরাহকারীর কাছে পাওনা'],
  Vendor: ['Vendor owes you', 'ভেন্ডরের কাছে পাওনা'],
  Lender: ['Lender owes you', 'ঋণদাতার কাছে পাওনা'],
  Borrower: ['Borrower owes you', 'ঋণগ্রহীতার কাছে পাওনা'],
  Payee: ['They owe you', 'তাদের কাছে পাওনা'],
  Owner: ['Owner capital balance', 'মালিকের মূলধনের হিসাব']
};

const payableText: Record<PartyRole, Copy['hint']> = {
  Customer: ['Customer has credit', 'ক্রেতার জমা টাকা'],
  Supplier: ['You owe them', 'সরবরাহকারীকে দেনা'],
  Vendor: ['You owe vendor', 'ভেন্ডরকে দেনা'],
  Lender: ['You owe lender', 'ঋণদাতাকে দেনা'],
  Borrower: ['You owe borrower', 'ঋণগ্রহীতাকে দেনা'],
  Payee: ['You owe payee', 'পাওনাদারকে দেনা'],
  Owner: ['Owner capital balance', 'মালিকের মূলধনের হিসাব']
};

const labels: Record<PartyRole, { receivable: Copy['title']; payable: Copy['title'] }> = {
  Customer: { receivable: ['Customer receivable', 'ক্রেতার কাছে পাওনা'], payable: ['Customer credit', 'ক্রেতার জমা টাকা'] },
  Supplier: { receivable: ['Supplier receivable', 'সরবরাহকারীর কাছে পাওনা'], payable: ['Supplier payable', 'সরবরাহকারীকে দেনা'] },
  Vendor: { receivable: ['Vendor receivable', 'ভেন্ডরের কাছে পাওনা'], payable: ['Vendor payable', 'ভেন্ডরকে দেনা'] },
  Lender: { receivable: ['Lender receivable', 'ঋণদাতার কাছে পাওনা'], payable: ['Lender payable', 'ঋণদাতাকে দেনা'] },
  Borrower: { receivable: ['Borrower receivable', 'ঋণগ্রহীতার কাছে পাওনা'], payable: ['Borrower payable', 'ঋণগ্রহীতাকে দেনা'] },
  Payee: { receivable: ['Payee receivable', 'পাওনাদারের কাছে পাওনা'], payable: ['Payee payable', 'পাওনাদারকে দেনা'] },
  Owner: { receivable: ['Owner capital', 'মালিকের মূলধন'], payable: ['Owner capital', 'মালিকের মূলধন'] }
};

export function partyBalanceCopy(relationship: PartyRole, amount: number): Copy {
  const owing = amount < 0;
  const kind = owing ? 'payable' : 'receivable';
  const tone: Tone = amount === 0 ? 'neutral' : owing ? 'payable' : 'receivable';
  return {
    title: labels[relationship][kind],
    hint: (owing ? payableText : receivableText)[relationship],
    tone
  };
}

export function PartyBalanceCard({
  amount, relationship, copy, compact = false, mobileHorizontal = false, extra
}: {
  amount: number;
  relationship?: PartyRole;
  copy?: Copy;
  compact?: boolean;
  /** Keep the Magic Patterns label + helper left / amount right layout on phones only. */
  mobileHorizontal?: boolean;
  extra?: ReactNode;
}) {
  const {showHelper}=useUiCopy();
  const {text}=useFinancialDisplay(financialContexts.includes(relationship as FinancialContext)?relationship as FinancialContext:"Customer");
  const data = copy ?? partyBalanceCopy(relationship ?? 'Customer', amount);
  const colors = data.tone === 'receivable'
    ? { background: 'bg-teal-50 dark:bg-teal-950/30', foreground: 'text-teal-800 dark:text-emerald-400' }
    : data.tone === 'payable'
    ? { background: 'bg-danger-bg dark:bg-rose-950/25', foreground: 'text-danger' }
    : { background: 'bg-ink-50 dark:bg-card', foreground: 'text-ink-700' };
  const helper = text(data.hint[0], data.hint[1]);
  const helperColor = mobileHorizontal
    ? data.tone === 'payable' ? 'text-ink-500 md:text-danger'
      : data.tone === 'receivable' ? 'text-ink-500 md:text-teal-800 dark:md:text-emerald-400'
        : 'text-ink-500 md:text-ink-700'
    : colors.foreground;

  return <div data-testid="party-balance-card"
      className={`min-w-0 rounded-xl px-4 py-3 ${mobileHorizontal
        ? 'grid grid-cols-[minmax(0,1fr)_auto] grid-rows-2 items-center gap-x-2 text-left md:block md:text-right'
        : 'text-right'} ${colors.background}`}>
    <p className={`min-w-0 font-semibold leading-snug ${mobileHorizontal
      ? 'col-start-1 row-start-1 self-end text-[15px] md:text-[13px]' : 'text-[13px]'} ${colors.foreground}`}>
      {text(data.title[0], data.title[1])}
    </p>
    <p className={`min-w-0 break-words font-semibold leading-tight tracking-tight ${mobileHorizontal
      ? `col-start-2 row-span-2 self-center whitespace-nowrap text-[clamp(18px,5.4vw,27px)] md:mt-1 ${compact ? 'md:text-[22px]' : 'md:text-[26px]'}`
      : `mt-1 ${compact ? 'text-[22px]' : 'text-[26px]'}`} ${colors.foreground}`}>
      {taka(Math.abs(amount))}
    </p>
    <p data-testid={relationship === 'Customer' && amount > 0 ? 'party-receivable-helper' : 'party-balance-helper'}
      className={`min-w-0 leading-snug ${mobileHorizontal
        ? 'col-start-1 row-start-2 self-start text-[12px] md:mt-1 md:text-[11px]'
        : 'mt-1 text-[11px]'} ${helperColor}`}>
      {helper}
      {showHelper && <> · <span lang="bn" className="font-bn"
        data-testid={(relationship === 'Supplier' || relationship === 'Lender') && amount < 0
          ? 'party-payable-bangla' : undefined}>{data.hint[1]}</span></>}
    </p>
    {extra}
  </div>;
}

export type { Copy as PartyBalanceCopy };
