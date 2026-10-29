import type { ReactNode } from 'react';
import { LabelText } from './LabelText';

export function SectionHeading({ id, en, bn, aside }: { id: string; en: string; bn: string; aside?: ReactNode }) {
  return (
    <div className="mb-4 flex items-baseline justify-between gap-3">
      <h2 id={id} className="text-[15px] font-semibold text-ink">
        <LabelText en={en} bn={bn} />
      </h2>
      {aside}
    </div>
  );
}
