import React from 'react';
import { useUiCopy } from '../i18n/useUiCopy';

type PageHeaderProps = {
  title: string;
  titleBn?: string;
  description?: string;
  /** Optional formatted description; plain text remains the fallback for all existing pages. */
  descriptionContent?: React.ReactNode;
  descriptionBn?: string;
  actions?: React.ReactNode;
  /** Keep the title and action buttons on one row; used by the Party workspace on tablets. */
  compact?: boolean;
};

export function PageHeader({ title, titleBn, description, descriptionContent, descriptionBn, actions, compact = false }: PageHeaderProps) {
  const { language, text, showHelper } = useUiCopy();
  return (
    <div className={compact ? "flex min-w-0 flex-nowrap items-start justify-between gap-2" : "flex flex-wrap items-end justify-between gap-3"}>
      <div className="min-w-0">
        <div className={compact ? "flex flex-wrap items-baseline gap-x-2 gap-y-0.5" : "flex items-baseline gap-2"}>
          <h1 className={compact ? "whitespace-nowrap text-lg font-semibold tracking-tight text-ink xl:text-xl" : "text-xl font-semibold tracking-tight text-ink"}>{titleBn ? text(title, titleBn) : title}</h1>
          {showHelper && titleBn && <span className="font-bn text-sm text-ink-500">{titleBn}</span>}
        </div>
        {(descriptionContent ?? description) && <p className={compact ? "mt-0.5 text-xs text-ink-500 xl:text-sm" : "mt-0.5 text-sm text-ink-500"}>{descriptionContent ?? (descriptionBn && language === "Bangla" ? descriptionBn : description)}</p>}
      </div>
      {actions && <div className={compact ? "flex shrink-0 flex-nowrap items-center justify-end gap-1.5 xl:gap-2" : "flex flex-wrap items-center gap-2"}>{actions}</div>}
    </div>);

}