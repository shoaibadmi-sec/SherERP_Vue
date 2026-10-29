import React, { useState } from 'react';
import { AppSelect, type SelectOption } from './AppSelect';

type FormSelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  options: SelectOption[];
};

/**
 * Legacy form-select adapter, now rendered through the shared theme-aware menu.
 * Preserve the existing select's value/onChange contract across ERP modules.
 */
export function FormSelect({
  options,
  className = '',
  value,
  defaultValue,
  onChange,
  disabled,
  name,
  title,
  id,
  ...other
}: FormSelectProps) {
  const first = options[0];
  const firstValue = typeof first === 'string' ? first : first?.value ?? '';
  const [local, setLocal] = useState<string>(() => String(defaultValue ?? firstValue));
  const selected = value === undefined ? local : String(value);
  const selectedOption=options.find(option=>(typeof option==='string'?option:option.value)===selected);
  const selectedLabel=typeof selectedOption==='string'?selectedOption:selectedOption?.label;
  const label = String(other['aria-label'] ?? title ?? name ?? selectedLabel ?? 'Select option');
  const update = (next: string) => {
    if (value === undefined) setLocal(next);
    // Existing callers only read event.target.value. The form-select adapter
    // preserves that API; other controls should use AppSelect directly.
    onChange?.({ target: { value: next, name }, currentTarget: { value: next, name } } as React.ChangeEvent<HTMLSelectElement>);
  };
  return (
    <>
      <AppSelect label={label} value={selected} options={options} onChange={update}
        className={className.replaceAll('[&>select]', '[&>button]')} disabled={disabled}
        id={id} describedBy={other['aria-describedby']} />
      {name && <input type="hidden" name={name} value={selected} />}
    </>
  );
}
