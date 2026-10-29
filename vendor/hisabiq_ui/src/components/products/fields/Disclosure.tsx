import type { ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronDownIcon } from 'lucide-react';
import { useFormCopy } from '../../../hooks/useFormCopy';
import { LabelText } from './LabelText';

type DisclosureProps = {
  id: string;
  en: string;
  bn: string;
  summary: ReactNode;
  open: boolean;
  onToggle: () => void;
  errorCount?: number;
  children: ReactNode;
};

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

/** Collapsed section that still tells you what's inside and what's switched on. */
export function Disclosure({ id, en, bn, summary, open, onToggle, errorCount = 0, children }: DisclosureProps) {
  const { t } = useFormCopy();
  const reduce = useReducedMotion();
  return (
    <section className="border-t border-border" aria-labelledby={`${id}-button`}>
      <h2>
        <button
          id={`${id}-button`}
          type="button"
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          onClick={onToggle}
          className="flex min-h-[60px] w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-150 ease-out hover:bg-ink-50 md:px-6"
        >
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-semibold leading-tight text-ink"><LabelText en={en} bn={bn} /></span>
            <span className="mt-1 line-clamp-2 block text-[13px] font-normal leading-snug text-ink-500">{summary}</span>
          </span>
          {errorCount > 0 && (
            <span className="shrink-0 whitespace-nowrap rounded-full bg-danger-bg px-2 py-0.5 text-[12px] font-semibold text-danger">
              {t(`${errorCount} to fix`, `${errorCount}টি ঠিক করুন`)}
            </span>
          )}
          <ChevronDownIcon
            className={'size-5 shrink-0 text-ink-500 transition-transform duration-200 ease-out ' + (open ? 'rotate-180' : '')}
            aria-hidden="true"
          />
        </button>
      </h2>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={`${id}-panel`}
            role="region"
            aria-labelledby={`${id}-button`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.22, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-6 pt-1 md:px-6">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
