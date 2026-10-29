import { FileText, Plus } from 'lucide-react';
import { Button } from '../Button';
import { FloatingPanel } from '../layout/FloatingPanel';
import { taka } from '../../utils/currency';
import { useUiCopy } from '../../i18n/useUiCopy';
import type { SaleTemplate } from '../../types/erp';

type SaleTemplatesMenuProps = {
  templates: SaleTemplate[];
  onUse: (template: SaleTemplate) => void;
  onCreate: () => void;
};

/** An entry point to existing Sales templates; loading a template never posts a sale. */
export function SaleTemplatesMenu({ templates, onUse, onCreate }: SaleTemplatesMenuProps) {
  const { text } = useUiCopy();
  return (
    <FloatingPanel label={text('Quick sale templates', 'দ্রুত বিক্রির নমুনা')} width={340}
      trigger={({ toggle, open }) => (
        <Button type="button" size="sm" variant="outline" onClick={toggle} aria-expanded={open}
          data-testid="pos-templates-trigger">
          <FileText className="size-4" />
          {text('Templates', 'নমুনা')}
          <span className="ml-0.5 rounded bg-teal-50 px-1.5 text-[11px] font-semibold text-teal-700">{templates.length}</span>
        </Button>
      )}>
      {(close) => (
        <div>
          <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2.5">
            <div>
              <p className="text-sm font-semibold text-ink">{text('Quick sale templates', 'দ্রুত বিক্রির নমুনা')}</p>
              <p className="text-[11px] text-ink-500">{text('Select a saved cart to start a sale.', 'রাখা পণ্যগুলো দিয়ে বিক্রি শুরু করুন।')}</p>
            </div>
            <Button type="button" size="sm" variant="outline" data-testid="pos-new-template"
              onClick={() => { close(); onCreate(); }} aria-label={text('New template', 'নতুন নমুনা')}>
              <Plus className="size-3.5" /> {text('New', 'নতুন')}
            </Button>
          </div>
          {templates.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-ink-500">
              {text('No templates yet. Create one for common sales.', 'কোনো নমুনা নেই। নিয়মিত বিক্রির জন্য একটি তৈরি করুন।')}
            </p>
          ) : (
            <ul className="max-h-72 divide-y divide-border overflow-auto" data-testid="pos-templates-list">
              {templates.map(template => (
                <li key={template.id}>
                  <button type="button" onClick={() => { close(); onUse(template); }}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-ink-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-500"
                    aria-label={text(`Use template ${template.name}`, `${template.name} নমুনা ব্যবহার করুন`)}>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-ink">{template.name}</span>
                      <span className="block truncate text-[11px] text-ink-500">
                        {template.items} {text('items', 'টি পণ্য')} · {template.customer ?? text('Any customer', 'যেকোনো ক্রেতা')}
                      </span>
                    </span>
                    <span className="shrink-0 text-[13px] font-semibold text-ink">{taka(template.total)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="border-t border-border px-3 py-2 text-[11px] text-ink-500">
            {text('Review price, stock and payment before confirming.', 'বিক্রি নিশ্চিত করার আগে দাম, স্টক ও পেমেন্ট দেখুন।')}
          </p>
        </div>
      )}
    </FloatingPanel>
  );
}
