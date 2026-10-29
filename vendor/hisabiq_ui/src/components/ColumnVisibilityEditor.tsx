import type { ReactNode } from 'react';
import { useUiCopy } from '../i18n/useUiCopy';

/** The Reports column chooser, shared with other tables and the visual library. */
export function ColumnVisibilityEditor({ label, columns, value, required = [], onChange }: {
  label: string;
  columns: { id: string; label: ReactNode }[];
  value: string[];
  required?: string[];
  onChange: (columns: string[]) => void;
}) {
  const { text } = useUiCopy();
  return <fieldset><legend className="sr-only">{label}</legend>
    <div className="grid grid-cols-2 gap-3">{columns.map((column) => <label key={column.id} className="flex min-w-0 items-center gap-2 text-sm text-ink">
      <input type="checkbox" checked={value.includes(column.id)} disabled={required.includes(column.id)}
        onChange={(event) => onChange(event.target.checked ? [...value, column.id] : value.filter((item) => item !== column.id))}
        className="size-4 shrink-0 accent-primary" />
      <span>{column.label}</span>
    </label>)}</div>
    {required.length > 0 && <p className="mt-3 text-xs text-ink-500">{text('Essential identity columns stay visible.', 'পরিচয়ের দরকারি কলাম সবসময় দেখা যাবে।')}</p>}
  </fieldset>;
}
