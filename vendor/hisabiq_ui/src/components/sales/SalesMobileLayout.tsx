import { useId, useState, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronDown, MoreHorizontal, SlidersHorizontal } from 'lucide-react';
import { Button } from '../Button';
import { FloatingPanel } from '../layout/FloatingPanel';
import { useUiCopy } from '../../i18n/useUiCopy';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import './sales-mobile.css';

export type SalesMobileMetric = { label: string; value: ReactNode; helper?: string; tone?: string };

/** Presentation only: figures and all operations stay owned by the existing module. */
export function SalesMobileSummary({ items, primary = [0, 2] }: { items: SalesMobileMetric[]; primary?: number[] }) {
  const { text } = useUiCopy();
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  const metric = (item: SalesMobileMetric) => <div key={item.label} className="min-w-0">
    <dt className="text-xs leading-4 text-ink-500">{item.label}</dt>
    <dd className={`break-words text-[15px] font-semibold leading-5 ${item.tone ?? 'text-ink'}`}>{item.value}</dd>
    {item.helper && <dd className="sr-only">{item.helper}</dd>}
  </div>;
  return <section aria-label={text('Sales summary', 'বিক্রির সারাংশ')} className="sales-mobile-summary border-y border-border py-2">
    <div className="flex items-center gap-2">
      <dl className="grid min-w-0 flex-1 grid-cols-2 gap-3">{items.filter((_, index) => primary.includes(index)).map(metric)}</dl>
      <Button variant="ghost" size="sm" aria-expanded={expanded} aria-controls={id} onClick={() => setExpanded(value => !value)} className="h-9 gap-1 px-1.5 text-xs text-ink-500">
        {text('Summary', 'সারাংশ')}<ChevronDown className={`size-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
      </Button>
    </div>
    <dl id={id} hidden={!expanded} className={expanded ? 'mt-2 grid grid-cols-2 gap-2 border-t border-border pt-2' : 'hidden'}>
      {items.filter((_, index) => !primary.includes(index)).map(metric)}
    </dl>
  </section>;
}

export function SalesMobileMore({ label, children, outlined = false }: { label: string; outlined?: boolean; children: (close: () => void) => ReactNode }) {
  return <FloatingPanel label={label} width={240} trigger={({ toggle, open }) => <Button data-compact-control variant={outlined ? 'outline' : 'ghost'} size="sm" aria-label={label} aria-expanded={open} onClick={toggle} className="size-9 shrink-0 p-0">
    <MoreHorizontal className="size-4" aria-hidden="true" />
  </Button>}>
    {close => <div className="sales-mobile-tools space-y-1 p-2">{children(close)}</div>}
  </FloatingPanel>;
}

export function SalesMobileToolbar({ search, filters, actions, activeCount, onClear, result }: {
  search: ReactNode; filters: ReactNode; actions?: (close: () => void) => ReactNode;
  activeCount: number; onClear: () => void; result: ReactNode;
}) {
  const { text } = useUiCopy();
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  const reduceMotion = useReducedMotion();
  return <div className="sales-mobile-toolbar border-b border-border p-3">
    <div className="flex min-w-0 items-center gap-1.5">
      <div className="min-w-0 flex-1">{search}</div>
      <Button variant="outline" size="sm" className="h-9 gap-1 px-2" aria-expanded={expanded} aria-controls={id} onClick={() => setExpanded(value => !value)}>
        <SlidersHorizontal className="size-3.5" aria-hidden="true" />{text('Filters', 'ফিল্টার')}{activeCount > 0 && <span className="text-teal-700">{activeCount}</span>}
      </Button>
      {actions && <SalesMobileMore outlined label={text('List actions', 'তালিকার অন্যান্য কাজ')}>{actions}</SalesMobileMore>}
    </div>
    <AnimatePresence initial={false}>{expanded && <motion.div id={id} initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: reduceMotion ? 0 : 0.16 }} className="overflow-hidden">
      <div className="sales-mobile-filter-fields mt-2 grid grid-cols-1 gap-2 border-t border-border pt-2">{filters}</div>
    </motion.div>}</AnimatePresence>
    <div className="mt-1 flex min-h-5 flex-wrap items-center justify-between gap-1 text-xs text-ink-500">
      <span aria-live="polite">{result}</span>
      {activeCount > 0 && <Button variant="ghost" size="sm" className="h-9 px-1 text-xs text-teal-700" onClick={onClear}>{text('Clear filters', 'ফিল্টার মুছুন')}</Button>}
    </div>
  </div>;
}

/** Record summary with the existing detail handler and existing action menu. */
export function SalesMobileRecord({ reference, name, date, status, meta, amount, balance, actions, onOpen, details, actionsInFooter = false, onNameOpen }: {
  reference: string; name: string; date?: string; status?: ReactNode; meta?: ReactNode;
  amount: ReactNode; balance?: ReactNode; actions?: ReactNode; onOpen?: () => void; details?: ReactNode; actionsInFooter?: boolean; onNameOpen?: () => void;
}) {
  const { text } = useUiCopy();
  const body = <>
    <span className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1"><span className="text-[13px] font-semibold text-ink">{reference}</span>{status}</span>
    <span className="sales-mobile-customer-row mt-0.5 flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">{onNameOpen ? <button type="button" data-compact-control onClick={onNameOpen} aria-label={text('Customer ledger','ক্রেতার খাতা')+' '+name} className="sales-mobile-customer-name pointer-events-auto relative z-10 min-w-0 break-words rounded-sm text-left text-sm font-medium leading-5 text-teal-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:text-teal-400">{name}</button> : <span className="sales-mobile-customer-name min-w-0 break-words text-sm font-medium text-ink">{name}</span>}{date && <span data-table-helper="" className="text-xs text-ink-500">{date}</span>}</span>
    {meta && <span data-table-helper="" className="mt-0.5 block break-words text-xs text-ink-500">{meta}</span>}
    <span className="sales-mobile-totals mt-1 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-xs text-ink-500"><span>{amount}</span>{balance && <span>{balance}</span>}</span>
  </>;
  return <article data-erp-table-view="" className={`sales-mobile-record ${actionsInFooter ? 'sales-mobile-record-compact' : ''} flex min-w-0 items-start gap-0.5 border-b border-border px-1 py-0.5 last:border-b-0`}>
    <div className="min-w-0 flex-1">
    {onNameOpen && onOpen ? <div className="sales-mobile-record-body relative min-w-0 rounded-md px-2 py-2">
      <button type="button" aria-label={text('View details','বিস্তারিত দেখুন')+' '+reference} onClick={onOpen} className="absolute inset-0 w-full rounded-md hover:bg-ink-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring" />
      <div className="pointer-events-none relative">{body}</div>
    </div> : onOpen ? <button type="button" onClick={onOpen} className="sales-mobile-record-body block w-full min-w-0 rounded-md px-2 py-2 text-left hover:bg-ink-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">{body}</button>
      : <div className="min-w-0 flex-1 px-2 py-2">{body}</div>}
    {(details || actionsInFooter) && <div className="sales-mobile-record-footer flex items-start justify-between gap-2">
    {details && <details className="min-w-0 flex-1 px-2 pb-2 text-xs"><summary className="min-h-8 cursor-pointer py-1 text-ink-500">{text('More details', 'আরও বিস্তারিত')}</summary><div className="mt-1 space-y-1 text-ink-600">{details}</div></details>}
    {actionsInFooter && actions && <div className="sales-mobile-record-actions shrink-0">{actions}</div>}
    </div>}
    </div>
    {!actionsInFooter && actions && <div className="sales-mobile-record-actions shrink-0">{actions}</div>}
  </article>;
}

/** Keeps selected invoice/line input state mounted when the phone chooser is collapsed. */
export function SalesMobileDisclosure({ title, children }: { title: string; children: ReactNode }) {
  const mobile = useMediaQuery('(max-width: 767px)');
  const [expanded, setExpanded] = useState(true);
  const id = useId();
  if (!mobile) return <>{children}</>;
  return <section className="sales-mobile-disclosure min-w-0">
    <Button variant="ghost" className="h-9 min-h-9 w-full justify-between gap-2 whitespace-normal text-left text-[13px]" aria-expanded={expanded} aria-controls={id} onClick={() => setExpanded(value => !value)}>
      {title}<ChevronDown className={`size-4 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
    </Button>
    <div id={id} hidden={!expanded}>{children}</div>
  </section>;
}
