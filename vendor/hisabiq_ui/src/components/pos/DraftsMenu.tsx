import { FileClock, Save, Trash2 } from 'lucide-react';
import { FloatingPanel } from '../layout/FloatingPanel';
import { Button } from '../Button';
import type { SalesDraft } from '../../data/sales';
import { taka } from '../../utils/currency';
import {useUiCopy} from '../../i18n/useUiCopy';

type DraftsMenuProps = {
  drafts: SalesDraft[];
  canSave: boolean;
  onSave: () => void;
  onResume: (d: SalesDraft) => void;
  onDelete: (id: string) => void;
};

export function DraftsMenu({ drafts, canSave, onSave, onResume, onDelete }: DraftsMenuProps) {
  const {text}=useUiCopy();
  return (
    <FloatingPanel
      label={text('Drafts','খসড়া')}
      width={320}
      trigger={({ toggle, open }) =>
      <Button variant="outline" size="sm" onClick={toggle} aria-expanded={open}>
          <FileClock className="size-4" /> {text('Drafts','খসড়া')}
          <span className="ml-0.5 rounded bg-teal-50 px-1.5 text-[11px] font-semibold text-teal-700">{drafts.length}</span>
        </Button>
      }>
      
      {(close) =>
      <div>
          <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
            <p className="text-sm font-semibold">{text('Held sales','রাখা বিক্রির খসড়া')}</p>
            <button
            disabled={!canSave}
            onClick={() => {
              onSave();
              close();
            }}
            className="flex items-center gap-1 text-xs font-medium text-teal-700 hover:underline disabled:cursor-not-allowed disabled:text-helper disabled:no-underline">
            
              <Save className="size-3.5" /> {text('Hold current','এই বিক্রি রাখুন')}
            </button>
          </div>
          {drafts.length === 0 ?
        <p className="px-3 py-6 text-center text-sm text-ink-500">{text('No held sales.','কোনো বিক্রির খসড়া নেই।')}</p> :

        <ul className="max-h-72 divide-y divide-border overflow-auto">
              {drafts.map((d) =>
          <li key={d.id} className="flex items-center gap-2 px-3 py-2.5 hover:bg-ink-50">
                  <button
              className="min-w-0 flex-1 text-left"
              onClick={() => {
                onResume(d);
                close();
              }}>
              
                    <p className="text-[13px] font-medium text-ink">
                      {d.label} <span className="font-normal text-ink-500">· {d.customer ?? text('Walk-in','সাধারণ ক্রেতা')}</span>
                    </p>
                    <p className="text-[11px] text-ink-500">
                      {d.items} {text('items · saved','টি পণ্য · রাখা হয়েছে')} {d.savedAt}
                    </p>
                  </button>
                  <span className="text-[13px] font-semibold tabular-nums">{taka(d.total)}</span>
                  <button onClick={() => onDelete(d.id)} aria-label={text(`Delete ${d.label}`,`মুছুন: ${d.label}`)} className="rounded p-1 text-helper hover:bg-danger-bg hover:text-danger">
                    <Trash2 className="size-3.5" />
                  </button>
                </li>
          )}
            </ul>
        }
        </div>
      }
    </FloatingPanel>);

}
