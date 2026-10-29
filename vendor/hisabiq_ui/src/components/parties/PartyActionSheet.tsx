import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import { lockBodyScroll } from '../../utils/bodyScrollLock';
import { useUiCopy } from '../../i18n/useUiCopy';

/**
 * Party-local adaptation of the Magic Patterns Sheet: animated, portal-based,
 * focus-managed bottom drawer on phones and a right drawer on tablets.
 * Keeps the existing HisabIQ actions and dialogs; no prototype state/data.
 */
export function PartyActionSheet({
  open, onClose, title, titleBn, children, footer, side = 'bottom'
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  titleBn: string;
  children: ReactNode;
  footer?: ReactNode;
  side?: 'bottom' | 'right';
}) {
  const { text, showHelper } = useUiCopy();
  const panel = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const id = useId();
  const reduce = useReducedMotion();
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const releaseScrollLock = lockBodyScroll();
    const frame = requestAnimationFrame(() => panel.current?.querySelector<HTMLElement>('[data-sheet-first]')?.focus());
    const keydown = (event: KeyboardEvent) => {
      if (!panel.current) return;
      // A nested form/dialog owns its own focus and Escape handling.
      const dialogs = document.querySelectorAll('[data-dialog-root]');
      if (dialogs.length) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        closeRef.current();
      } else if (event.key === 'Tab') {
        const items = Array.from(panel.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]),a[href],input:not([disabled]),[tabindex]:not([tabindex="-1"])'
        )).filter(item => item.getClientRects().length);
        if (!items.length) return;
        const first = items[0], last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault(); last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault(); first.focus();
        }
      }
    };
    document.addEventListener('keydown', keydown);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', keydown);
      releaseScrollLock();
      opener.current?.focus({ preventScroll: true });
    };
  }, [open]);

  if (typeof document === 'undefined') return null;
  const isBottom = side === 'bottom';
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div key="party-actions-sheet" className="fixed inset-0 z-[90]"
          initial={false} exit={{ opacity: 1 }}>
          <motion.div aria-hidden="true" className="absolute inset-0 bg-ink/40"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.2 }} onClick={onClose} />
          <motion.div ref={panel} role="dialog" aria-modal="true"
            aria-labelledby={id + '-title'} tabIndex={-1}
            initial={reduce ? { opacity: 0 } : (isBottom ? { y: '100%' } : { x: '100%' })}
            animate={reduce ? { opacity: 1 } : { x: 0, y: 0 }}
            exit={reduce ? { opacity: 0 } : (isBottom ? { y: '100%' } : { x: '100%' })}
            transition={reduce ? { duration: 0 } : { type: 'tween', ease: [0.32, 0.72, 0, 1], duration: 0.28 }}
            className={'absolute flex flex-col border-border bg-card shadow-[0_-8px_40px_rgba(11,26,44,0.16)] outline-none ' +
              (isBottom
                ? 'inset-x-0 bottom-0 max-h-[88dvh] w-full rounded-t-xl border-t'
                : 'inset-y-0 right-0 h-full w-full max-w-[440px] border-l')}>
            {isBottom && <div aria-hidden="true" className="flex justify-center pt-2">
              <span className="h-1 w-10 rounded-full bg-border" />
            </div>}
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
              <div className="min-w-0">
                <h2 id={id + '-title'} className="text-base font-semibold leading-snug text-ink">{title}</h2>
                {showHelper && titleBn !== title && <p lang="bn" className="font-bn text-[13px] leading-snug text-ink-500">{titleBn}</p>}
              </div>
              <button type="button" aria-label={text('Close', 'বন্ধ করুন')} onClick={onClose} data-sheet-first
                className="flex size-9 shrink-0 items-center justify-center rounded-lg text-ink-600 transition-colors hover:bg-ink-50 focus-visible:outline-2 focus-visible:outline-teal-500">
                <X className="size-5" aria-hidden="true"/>
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-2">{children}</div>
            {footer && <div className="shrink-0 border-t border-border px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
