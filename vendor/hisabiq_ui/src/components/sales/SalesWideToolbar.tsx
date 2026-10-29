import { useId, useState, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { SlidersHorizontal } from 'lucide-react';
import { Button } from '../Button';
import { useUiCopy } from '../../i18n/useUiCopy';

/** Tablet/desktop filters keep the page's existing controlled values and handlers. */
export function SalesWideToolbar({ search, filters, actions, activeCount, className = 'border-b border-border p-3' }: {
  search: ReactNode; filters: ReactNode; actions?: ReactNode; activeCount: number; className?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  const { text } = useUiCopy();
  const reduceMotion = useReducedMotion();
  const label = text('Filters', 'ফিল্টার');
  return <div className={className}>
    <div className="flex min-w-0 items-center gap-2">
      {search}
      <Button type="button" variant="outline" size="sm" aria-label={label} title={label}
        aria-expanded={expanded} aria-controls={id} onClick={() => setExpanded(value => !value)} className="shrink-0 gap-1 px-2">
        <SlidersHorizontal className="size-4" aria-hidden="true" />
        {activeCount > 0 && <span className="text-xs">{activeCount}<span className="sr-only"> {text('active filters', 'চালু ফিল্টার')}</span></span>}
      </Button>
      {actions}
    </div>
    <AnimatePresence initial={false}>{expanded && <motion.div id={id}
      initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.16 }} className="overflow-hidden">
      <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-border pt-2">{filters}</div>
    </motion.div>}</AnimatePresence>
  </div>;
}
