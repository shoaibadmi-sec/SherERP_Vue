import { AlertCircleIcon } from 'lucide-react';
import { useFormCopy } from '../../../hooks/useFormCopy';
import type { AddProductForm } from './useAddProductForm';

/** Listed in form order; each item jumps to (and opens) the field it describes. */
export function ErrorSummary({ form }: { form: AddProductForm }) {
  const { t, tc } = useFormCopy();
  const count = form.errorList.length;
  if (!count) return null;
  return (
    <div role="alert" className="mb-4 rounded-xl border border-danger/30 bg-danger-bg px-4 py-3">
      <p className="flex items-center gap-2 text-[14px] font-semibold text-danger">
        <AlertCircleIcon className="size-4 shrink-0" aria-hidden="true" />
        {t(`Fix ${count} ${count === 1 ? 'thing' : 'things'} to save`, `সংরক্ষণের আগে ${count}টি ঠিক করুন`)}
      </p>
      <ul className="mt-1.5 space-y-1 pl-6">
        {form.errorList.map((key) => {
          const error = form.errors[key];
          if (!error) return null;
          return (
            <li key={key}>
              <button
                type="button"
                onClick={() => form.revealError(key)}
                className="py-0.5 text-left text-[13px] text-danger underline decoration-danger/40 underline-offset-2 hover:decoration-danger"
              >
                {tc(error)}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
