import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';

export type SelectOption = string | { value: string; label: string };
const optionValue = (item: SelectOption) => typeof item === 'string' ? item : item.value;
const optionLabel = (item: SelectOption) => typeof item === 'string' ? item : item.label;

type Props = {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  compact?: boolean;
  /** Roomier ledger page-size popup, keeping the same keyboard and onChange behavior. */
  menuStyle?: 'default' | 'rows';
  id?: string;
  describedBy?: string;
};

/** Theme-token select. Unlike a native option popup, the menu matches both ERP themes. */
export function AppSelect({
  label, value, options, onChange, className = '', disabled = false, placeholder = 'Select…', compact = false, menuStyle = 'default', id: triggerId, describedBy
}: Props) {
  const [open, setOpen] = useState(false);
  const rowsStyle = menuStyle === 'rows';
  const [active, setActiveState] = useState(0);
  const activeRef = useRef(0);
  const setActive = (next: React.SetStateAction<number>) => {
    const index = typeof next === 'function' ? next(activeRef.current) : next;
    activeRef.current = index;
    setActiveState(index);
  };
  const [rect, setRect] = useState<{ left: number; top: number; width: number; maxHeight: number } | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const id = useId().replace(/:/g, '');
  const chosen = options.findIndex((option) => optionValue(option) === value);
  const currentLabel = options.find((option) => optionValue(option) === value);

  const choose = (option: SelectOption) => {
    onChange(optionValue(option));
    setOpen(false);
    trigger.current?.focus();
  };
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const anchor = trigger.current?.getBoundingClientRect();
      if (!anchor) return;
      const availableBelow = window.innerHeight - anchor.bottom - 12;
      const availableAbove = anchor.top - 12;
      const height = Math.min(options.length * (rowsStyle ? 52 : 36) + 12, rowsStyle ? 284 : 264);
      const up = availableBelow < Math.min(160, height) && availableAbove > availableBelow;
      const maxHeight = Math.max(100, Math.min(height, up ? availableAbove : availableBelow));
      const top = up ? Math.max(8, anchor.top - maxHeight - 4) : anchor.bottom + 4;
      const width = Math.max(anchor.width, rowsStyle ? 206 : 120);
      const left = Math.min(Math.max(8, anchor.left), window.innerWidth - Math.min(width, window.innerWidth - 16) - 8);
      setRect({ top, left, width: Math.min(width, window.innerWidth - 16), maxHeight });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => { window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true); };
  }, [open, options.length, rowsStyle]);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!trigger.current?.contains(event.target as Node) && !menu.current?.contains(event.target as Node))
        setOpen(false);
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const item = menu.current?.querySelector('[data-active="true"]');
    item?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  const onKeyboard = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (event.key === 'Escape' && open) { event.preventDefault(); event.stopPropagation(); setOpen(false); return; }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!open) { setActive(Math.max(0, chosen)); setOpen(true); }
      else if (options[activeRef.current]) choose(options[activeRef.current]);
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      if (!open) {
        const start = Math.max(0, chosen);
        setActive(event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1
          : Math.max(0, Math.min(options.length - 1, start + (event.key === 'ArrowDown' ? 1 : -1))));
        setOpen(true);
        return;
      }
      setActive((current) => event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1
        : Math.max(0, Math.min(options.length - 1, current + (event.key === 'ArrowDown' ? 1 : -1))));
      return;
    }
    if (event.key.length === 1 && !event.ctrlKey && !event.altKey && !event.metaKey) {
      const found = options.findIndex((item) => optionLabel(item).toLowerCase().startsWith(event.key.toLowerCase()));
      if (found >= 0) { setActive(found); if (!open) setOpen(true); }
    }
  };

  return (
    <div className={'min-w-0 ' + className}>
      <button
        ref={trigger} type="button" role="combobox" data-hisabiq-select="" data-hisabiq-compact={compact ? "" : undefined} id={triggerId} data-value={value} aria-label={label} aria-describedby={describedBy}
        aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? id : undefined}
        aria-activedescendant={open ? id + '-opt-' + active : undefined}
        disabled={disabled}
        onKeyDown={onKeyboard}
        onClick={(event) => {
          // Enter/Space are handled in onKeyDown; don't allow their synthetic click
          // to re-open or reset selection after a keyboard choice.
          if (event.detail === 0) return;
          if (!open) setActive(Math.max(0, chosen));
          setOpen((v) => !v);
        }}
        className={'flex h-9 w-full min-w-0 items-center justify-between gap-2 border border-input bg-card px-3 text-left text-sm text-ink shadow-xs outline-none hover:bg-ink-50/40 focus-visible:border-teal-500 focus-visible:ring-2 focus-visible:ring-teal-500/20 disabled:opacity-50 ' +
          (rowsStyle
            ? 'min-w-[88px] rounded-lg border-border bg-white dark:bg-card ' + (open ? 'border-teal-600 ring-2 ring-teal-500/15 ' : '')
            : 'rounded-md ' + (compact ? 'border-0 bg-transparent px-2 shadow-none ' : ''))}
      >
        <span className="truncate">{currentLabel ? optionLabel(currentLabel) : value || placeholder}</span>
        <ChevronDown className={'size-4 shrink-0 text-ink-400 transition-transform ' + (rowsStyle && open ? 'rotate-180' : '')} aria-hidden="true" />
      </button>
      {open && typeof document !== 'undefined' && createPortal(
        <div ref={menu} id={id} role="listbox" aria-label={label + ' options'}
          data-menu-style={menuStyle}
          className={'fixed z-[160] overflow-auto border border-border bg-popover text-ink shadow-xl scrollbar-thin ' +
            (rowsStyle ? 'rounded-2xl p-1.5 shadow-[0_12px_28px_rgba(14,31,51,0.15)]' : 'rounded-lg p-1')}
          style={{ top: rect?.top ?? 0, left: rect?.left ?? 0, width: rect?.width ?? 160,
            maxHeight: rect?.maxHeight ?? 260, visibility: rect ? 'visible' : 'hidden' }}
        >
          {options.map((option, index) => (
            <button key={optionValue(option) + index} type="button" role="option" id={id + '-opt-' + index}
              aria-selected={value === optionValue(option)} data-value={optionValue(option)} data-active={active === index}
              onPointerDown={(event) => event.preventDefault()}
              onPointerMove={() => setActive(index)}
              onClick={() => choose(option)}
              className={'flex w-full items-center gap-2 text-left outline-none ' +
                (rowsStyle
                  ? 'min-h-[48px] rounded-xl px-3 text-[15px] hover:bg-ink-50 dark:hover:bg-ink-100/10 ' +
                    (active === index ? 'bg-ink-50 dark:bg-ink-100/10 ' : '') +
                    (value === optionValue(option) ? 'font-medium text-teal-800 dark:text-teal-400 ' : 'text-ink ')
                  : 'min-h-9 rounded-md px-2 py-1.5 text-[13px] hover:bg-teal-50 hover:text-teal-700 ' +
                    (active === index ? 'bg-teal-50 text-teal-700' : ''))}
            >
              <span className="min-w-0 flex-1 truncate">{optionLabel(option)}</span>
              {value === optionValue(option) && <Check className={rowsStyle ? 'size-[18px] shrink-0 text-teal-700' : 'size-3.5 shrink-0 text-teal-600'} aria-hidden="true" />}
            </button>
          ))}
          {options.length === 0 && <div className="p-2 text-xs text-ink-400">No options</div>}
        </div>, document.body
      )}
    </div>
  );
}
