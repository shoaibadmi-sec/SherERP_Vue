import type { ReactNode } from 'react';
import { useFormCopy } from '../../../hooks/useFormCopy';
import type { Copy } from '../../../types/productForm';
import { FieldMessage } from './FieldMessage';
import { LabelText } from './LabelText';

type FormFieldProps = {
  id: string;
  en: string;
  bn: string;
  required?: boolean;
  hint?: ReactNode;
  error?: Copy;
  /** Use "span" when the control is a group (radio, date button) that names itself. */
  labelAs?: 'label' | 'span';
  className?: string;
  children: ReactNode;
};

export function FormField({ id, en, bn, required, hint, error, labelAs = 'label', className = '', children }: FormFieldProps) {
  const { t } = useFormCopy();
  const labelClass = 'mb-1.5 flex flex-wrap items-baseline text-[length:var(--label-fs)] font-medium leading-tight text-ink';
  const content = (
    <>
      <LabelText en={en} bn={bn} />
      {required && (
        <>
          <span className="ml-1 text-danger" aria-hidden="true">*</span>
          <span className="sr-only">({t('required', 'আবশ্যক')})</span>
        </>
      )}
    </>
  );
  return (
    <div className={'min-w-0 ' + className}>
      {labelAs === 'label'
        ? <label id={`${id}-label`} htmlFor={id} className={labelClass}>{content}</label>
        : <span id={`${id}-label`} className={labelClass}>{content}</span>}
      {children}
      <FieldMessage id={`${id}-msg`} error={error} hint={hint} />
    </div>
  );
}
