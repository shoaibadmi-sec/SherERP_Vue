import type { ReactNode } from 'react';
import { AlertCircleIcon } from 'lucide-react';
import { useFormCopy } from '../../../hooks/useFormCopy';
import type { Copy } from '../../../types/productForm';

/** One slot under a field: an error replaces the hint, never both. */
export function FieldMessage({ id, error, hint }: { id: string; error?: Copy; hint?: ReactNode }) {
  const { tc } = useFormCopy();
  if (error) {
    return (
      <p id={id} className="mt-1.5 flex items-start gap-1.5 text-[13px] font-medium leading-snug text-danger">
        <AlertCircleIcon className="mt-px size-4 shrink-0" aria-hidden="true" />
        <span>{tc(error)}</span>
      </p>
    );
  }
  if (!hint) return <span id={id} hidden />;
  return <p id={id} className="mt-1.5 text-[13px] leading-snug text-ink-500">{hint}</p>;
}
