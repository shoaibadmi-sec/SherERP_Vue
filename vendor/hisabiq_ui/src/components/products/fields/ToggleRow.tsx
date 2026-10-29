import type { ReactNode } from 'react';
import { Switch } from '../../Switch';
import { LabelText } from './LabelText';

type ToggleRowProps = {
  id: string;
  en: string;
  bn: string;
  hint?: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

/** Switch with a tappable label: the whole title area toggles, not just the small switch. */
export function ToggleRow({ id, en, bn, hint, checked, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <label id={`${id}-label`} htmlFor={id} className="block cursor-pointer text-[length:var(--label-fs)] font-medium leading-tight text-ink">
          <LabelText en={en} bn={bn} />
        </label>
        {hint && <p id={`${id}-hint`} className="mt-1 text-[13px] leading-snug text-ink-500">{hint}</p>}
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        aria-labelledby={`${id}-label`}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className="mt-0.5 shrink-0"
      />
    </div>
  );
}
