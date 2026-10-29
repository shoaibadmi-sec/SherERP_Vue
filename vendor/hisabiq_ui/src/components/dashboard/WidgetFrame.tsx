import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, EyeOff } from 'lucide-react';

type WidgetFrameProps = {
  editing: boolean;
  label: string;
  onHide: () => void;
  onMove: (dir: -1 | 1) => void;
  className?: string;
  children: React.ReactNode;
};

export function WidgetFrame({ editing, label, onHide, onMove, className = '', children }: WidgetFrameProps) {
  return (
    <motion.div
      layout
      transition={{ type: 'spring', stiffness: 500, damping: 40 }}
      className={`relative min-w-0 ${className}`}>
      
      <div className={editing ? 'pointer-events-none select-none opacity-90' : ''}>{children}</div>
      {editing &&
      <div className="absolute inset-0 rounded-xl border-2 border-dashed border-teal-400 bg-teal-50/30">
          <div className="absolute right-2 top-2 flex items-center gap-0.5 rounded-lg border border-border bg-card p-0.5 shadow-pop">
            <button onClick={() => onMove(-1)} aria-label={`Move ${label} earlier`} className="rounded-md p-1 text-ink-500 hover:bg-ink-50 hover:text-ink">
              <ArrowLeft className="size-3.5" />
            </button>
            <button onClick={() => onMove(1)} aria-label={`Move ${label} later`} className="rounded-md p-1 text-ink-500 hover:bg-ink-50 hover:text-ink">
              <ArrowRight className="size-3.5" />
            </button>
            <span className="mx-0.5 h-4 w-px bg-ink-100" />
            <button onClick={onHide} aria-label={`Hide ${label}`} className="rounded-md p-1 text-ink-500 hover:bg-danger-bg hover:text-danger">
              <EyeOff className="size-3.5" />
            </button>
          </div>
        </div>
      }
    </motion.div>);

}
