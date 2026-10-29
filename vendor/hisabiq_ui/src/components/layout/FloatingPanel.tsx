import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';

type FloatingPanelProps = {
  trigger: (state: {open: boolean;toggle: () => void;}) => React.ReactNode;
  children: (close: () => void) => React.ReactNode;
  align?: 'left' | 'right';
  width?: number;
  label: string;
  className?: string;
  panelClassName?: string;
};

type PanelPosition = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  opensUp: boolean;
};

const VIEWPORT_PADDING = 8;
const GAP = 8;

export function FloatingPanel({ trigger, children, align = 'right', width = 320, label, className = 'inline-block', panelClassName = '' }: FloatingPanelProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<PanelPosition | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    if (!open || !triggerRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const safeWidth = Math.min(width, Math.max(0, viewportWidth - VIEWPORT_PADDING * 2));
    const measuredHeight = panelRef.current?.scrollHeight ?? 0;
    const maxHeight = Math.max(120, viewportHeight - VIEWPORT_PADDING * 2);
    const panelHeight = Math.min(measuredHeight || maxHeight, maxHeight);
    const spaceBelow = viewportHeight - triggerRect.bottom - GAP - VIEWPORT_PADDING;
    const spaceAbove = triggerRect.top - GAP - VIEWPORT_PADDING;
    const opensUp = measuredHeight > 0 && measuredHeight > spaceBelow && spaceAbove > spaceBelow;

    const preferredLeft = align === 'right'
      ? triggerRect.right - safeWidth
      : triggerRect.left;
    const left = Math.min(
      Math.max(VIEWPORT_PADDING, preferredLeft),
      Math.max(VIEWPORT_PADDING, viewportWidth - safeWidth - VIEWPORT_PADDING)
    );

    const top = opensUp
      ? Math.max(VIEWPORT_PADDING, triggerRect.top - GAP - panelHeight)
      : Math.min(
          triggerRect.bottom + GAP,
          Math.max(VIEWPORT_PADDING, viewportHeight - panelHeight - VIEWPORT_PADDING)
        );

    setPosition((current) => {
      const next = { top, left, width: safeWidth, maxHeight, opensUp };
      if (
        current &&
        current.top === next.top &&
        current.left === next.left &&
        current.width === next.width &&
        current.maxHeight === next.maxHeight &&
        current.opensUp === next.opensUp
      ) {
        return current;
      }
      return next;
    });
  }, [align, open, width]);

  useLayoutEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }

    updatePosition();
    const frame = window.requestAnimationFrame(updatePosition);
    return () => window.cancelAnimationFrame(frame);
  }, [open, updatePosition, children]);

  useEffect(() => {
    if (!open) return;

    const onDown = (event: MouseEvent) => {
      const target = event.target as Node;
      const insideTrigger = triggerRef.current?.contains(target);
      const insidePanel = panelRef.current?.contains(target);
      if (!insideTrigger && !insidePanel) setOpen(false);
    };

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.querySelector<HTMLElement>('button, a')?.focus();
      }
    };

    const onViewportChange = () => updatePosition();

    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onViewportChange);
    window.addEventListener('scroll', onViewportChange, true);

    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onViewportChange);
      window.removeEventListener('scroll', onViewportChange, true);
    };
  }, [open, updatePosition]);

  const panel = typeof document !== 'undefined'
    ? createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              ref={panelRef}
              role="dialog"
              data-dialog-owner={triggerRef.current?.closest<HTMLElement>('[data-dialog-id]')?.dataset.dialogId}
              aria-label={label}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.14, ease: 'easeOut' }}
              className={'fixed z-[100] overflow-y-auto rounded-xl border border-border bg-card shadow-pop scrollbar-thin ' + panelClassName}
              style={{
                top: position?.top ?? 0,
                left: position?.left ?? 0,
                width: position?.width ?? Math.min(width, 320),
                maxHeight: position?.maxHeight ?? 'calc(100vh - 16px)',
                visibility: position ? 'visible' : 'hidden',
                transformOrigin: position?.opensUp
                  ? align === 'right' ? 'bottom right' : 'bottom left'
                  : align === 'right' ? 'top right' : 'top left'
              }}>
              {children(() => {
                setOpen(false);
                triggerRef.current?.querySelector<HTMLElement>('button, a')?.focus();
              })}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )
    : null;

  return (
    <div ref={triggerRef} className={'relative '+className}>
      {trigger({ open, toggle: () => setOpen((value) => !value) })}
      {panel}
    </div>
  );
}

