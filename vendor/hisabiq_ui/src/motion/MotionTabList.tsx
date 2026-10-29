import { MOTION_MS, MOTION_EASE } from './tokens';
import { useId, type ComponentPropsWithoutRef } from 'react';
import { LayoutGroup, motion, useReducedMotion } from 'framer-motion';

/** Presentation-only tab wrapper: module state, handlers and focus remain with existing tabs. */
export function MotionTabList({ children, className, ...props }: ComponentPropsWithoutRef<'div'>) {
  const scopeId = useId();
  return (
    <LayoutGroup id={scopeId}>
      <div {...props} role="tablist" className={`motion-tab-list ${className ?? ""}`}>{children}</div>
    </LayoutGroup>
  );
}

/** Exactly one shared-layout underline per active strip; reduced motion stays static. */
export function MotionTabIndicator({ active }: { active: boolean }) {
  const reducedMotion = useReducedMotion();
  if (!active) return null;
  return (
    <motion.span
      aria-hidden="true"
      data-motion-tab-indicator=""
      className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] rounded-full bg-primary"
      layoutId={reducedMotion ? undefined : 'erp-tab-selection'}
      initial={false}
      transition={reducedMotion ? { duration: 0 } : { duration: MOTION_MS.tab / 1000, ease: MOTION_EASE }}
    />
  );
}
