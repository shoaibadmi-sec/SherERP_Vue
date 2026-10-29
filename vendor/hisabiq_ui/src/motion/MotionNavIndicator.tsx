import { MOTION_MS, MOTION_EASE } from './tokens';
import { motion, useReducedMotion } from 'framer-motion';

/** Shared decorative background for navigation selection and pointer hover. */
export function MotionNavIndicator({ active, layoutId, variant = 'selection' }: { active: boolean; layoutId: string; variant?: 'selection' | 'hover' }) {
  const reduceMotion = useReducedMotion();
  if (!active) return null;
  return <motion.span
    aria-hidden="true"
    data-motion-nav-indicator={variant === 'selection' ? '' : undefined}
    data-motion-nav-hover={variant === 'hover' ? '' : undefined}
    className={'pointer-events-none absolute inset-0 -z-10 rounded-lg ' + (variant === 'hover' ? 'bg-sidebar-accent/60' : 'bg-sidebar-accent')}
    layoutId={reduceMotion ? undefined : layoutId}
    initial={false}
    transition={reduceMotion ? { duration: 0 } : variant === 'hover'
      ? { type: 'spring', stiffness: 600, damping: 44, mass: 0.65 }
      : { duration: MOTION_MS.navActive / 1000, ease: MOTION_EASE }}
  />;
}
