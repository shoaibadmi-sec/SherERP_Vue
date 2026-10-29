import React from 'react';
import { Badge } from './Badge';

export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'teal' | 'ink';

const toneClass: Record<StatusTone, string> = {
  success: 'bg-success-bg text-success border-transparent',
  warning: 'bg-warning-bg text-warning border-transparent',
  danger: 'bg-danger-bg text-danger border-transparent',
  info: 'bg-info-bg text-info border-transparent',
  neutral: 'bg-ink-50 text-ink-600 border-border',
  teal: 'bg-teal-50 text-teal-700 border-transparent',
  ink: 'bg-inverse text-white border-transparent'
};

type StatusBadgeProps = {
  tone?: StatusTone;
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
};

export function StatusBadge({ tone = 'neutral', dot = false, children, className = '' }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={`h-5 gap-1 rounded-md px-1.5 text-[11px] font-medium ${toneClass[tone]} ${className}`}>
      
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />}
      {children}
    </Badge>);

}
