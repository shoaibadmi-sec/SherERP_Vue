import type { ReactNode } from 'react';
import type { UiLanguage } from '../i18n/uiCopy';
import { amountInWords } from '../utils/amountInWords';

/** Shared, readable amount-in-words display for ERP screens, dialogs and printed receipts.
 *  Keep Bangla text selectable and fully wrapped; never squeeze it into a single-line badge.
 *  This component has no tenant-settings dependency so printReceipt can render it standalone.
 */
export function AmountInWordsDisplay({
  amount,
  variant = 'default',
  label = 'In words · কথায়',
  className = '',
  language = 'Bangla',
}: {
  amount: number;
  variant?: 'default' | 'compact' | 'inverse' | 'receipt';
  label?: ReactNode;
  language?: UiLanguage;
  className?: string;
}) {
  const styles = {
    default: {
      container: 'rounded-lg border border-teal-200/80 bg-teal-50/70 px-3 py-2.5 dark:border-teal-800/80 dark:bg-teal-950/30',
      label: 'text-[12px] font-medium text-teal-800 dark:text-teal-800',
      value: 'text-[15px] font-semibold leading-[1.65] text-ink sm:text-base',
    },
    compact: {
      // Theme tokens invert teal shades in dark mode. Avoid fixed white/teal-950 surfaces
      // or low-index dark-theme teal text shades, which become low-contrast here.
      container: 'rounded-lg border border-teal-200/80 bg-card/75 px-3 py-2',
      label: 'text-[11px] font-semibold text-teal-800',
      value: 'text-[14px] font-semibold leading-[1.55] text-ink sm:text-[15px]',
    },
    inverse: {
      container: 'rounded-lg border border-white/20 bg-white/10 px-3 py-2.5',
      label: 'text-[12px] font-medium text-white/75',
      value: 'text-[15px] font-semibold leading-[1.65] text-white sm:text-base',
    },
    receipt: {
      container: 'border-l-2 border-ink-300 pl-2 py-1',
      label: 'text-[10.5px] font-medium text-ink-600',
      value: 'text-[12.5px] font-semibold leading-[1.6] text-ink',
    },
  }[variant];

  return (
    <div data-testid="amount-in-words" data-amount-words-variant={variant}
      className={`mt-2 w-full min-w-0 max-w-full text-left ${styles.container} ${className}`}>
      <p className={styles.label}>{label}</p>
      <p lang={language === "Bangla" ? "bn" : "en"} aria-live="polite" aria-atomic="true"
        className={`${language === "Bangla" ? "font-bn" : ""} mt-1 min-w-0 whitespace-normal break-words [overflow-wrap:anywhere] ${styles.value}`}>
        {amountInWords(amount, language === "Bangla" ? "Bangla" : "English")}
      </p>
      {language === 'English + Bangla' && <p lang="bn" className="font-bn mt-1 text-[11px] leading-relaxed text-ink-600">{amountInWords(amount)}</p>}
    </div>
  );
}
