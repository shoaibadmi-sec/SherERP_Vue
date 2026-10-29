import { useId } from 'react';
import { SearchSelect } from './SearchSelect';

type Props = {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  onCreate: (name: string, phone: string, area: string, symbol?: string) => void;
  showSymbol?: boolean;
  showContact?: boolean;
  placeholder?: string;
};

/** Shared searchable picker and contextual creation. Add new lives inside the menu. */
export function QuickAddSelect({ label, value, options, onChange, onCreate, showContact = false, showSymbol = false, placeholder }: Props) {
  const id = useId();
  return <SearchSelect id={`quick-add-${id}`} noun={{ en: label.toLowerCase(), bn: label }} ariaLabel={label} value={value}
    options={options.map((option) => ({ value: option, label: option }))} onChange={onChange}
    withSymbol={showSymbol} showContact={showContact} createPlaceholder={placeholder ?? label + ' name'} nameLabel={label + ' name'} autoSelectCreated={false}
    onCreate={(name, symbol, phone, area) => {
      onCreate(name, phone ?? '', area ?? '', symbol || name);
      return showSymbol ? symbol || name : name;
    }} />;
}
