import React from 'react';

type PanelProps = {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
};

export function Panel({ title, subtitle, actions, children, className = '', bodyClassName = 'p-4' }: PanelProps) {
  return (
    <section className={`min-w-0 rounded-xl border border-border bg-card shadow-card ${className}`}>
      {(title || actions) &&
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="min-w-0">
            {title && <h2 className="truncate text-sm font-semibold text-ink">{title}</h2>}
            {subtitle && <p className="truncate text-xs text-ink-500">{subtitle}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-1.5">{actions}</div>}
        </header>
      }
      <div className={bodyClassName}>{children}</div>
    </section>);

}
