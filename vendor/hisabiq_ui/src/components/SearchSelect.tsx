import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeftIcon, CheckIcon, ChevronDownIcon, PlusIcon, SearchIcon } from 'lucide-react';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useFormCopy } from '../hooks/useFormCopy';
import type { Copy } from '../types/productForm';
import { Input } from './Input';
import { QuickAddDialog } from './QuickAddDialog';

export type SearchOption = { value: string; label: string; meta?: string };

type SearchSelectProps = {
  id: string;
  noun: Copy;
  value: string;
  options: SearchOption[];
  onChange: (value: string) => void;
  /** Returns the value to select once created. */
  onCreate?: (name: string, symbol: string, phone?: string, area?: string) => string;
  withSymbol?: boolean;
  showContact?: boolean;
  autoSelectCreated?: boolean;
  createPlaceholder?: string;
  nameLabel?: string;
  ariaLabel?: string;
  labelledBy?: string;
  describedBy?: string;
  invalid?: boolean;
  disabled?: boolean;
};

type PopoverRect = { left: number; width: number; maxHeight: number; top?: number; bottom?: number };

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

/**
 * Searchable picker with Quick Add. Desktop/tablet: anchored popover.
 * Phones: full-height sheet with a large search field and thumb-reachable Add button.
 */
export function SearchSelect({
  id, noun, value, options, onChange, onCreate, withSymbol = false, showContact = false, autoSelectCreated = true, createPlaceholder, nameLabel, ariaLabel, labelledBy, describedBy, invalid = false, disabled = false
}: SearchSelectProps) {
  const { t } = useFormCopy();
  const reduce = useReducedMotion();
  const sheet = useMediaQuery('(max-width: 639px)');
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [quickName, setQuickName] = useState<string | null>(null);
  const [rect, setRect] = useState<PopoverRect | null>(null);
  const groupRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listId = useId().replace(/:/g, '');

  const selected = options.find((option) => option.value === value);
  const q = query.trim().toLowerCase();
  const filtered = useMemo(
    () => (q ? options.filter((o) => [o.label, o.value, o.meta ?? ''].some((s) => s.toLowerCase().includes(q))) : options),
    [options, q]
  );
  const exact = q ? options.some((o) => o.label.toLowerCase() === q || o.value.toLowerCase() === q) : false;
  const inlineAdd = Boolean(onCreate) && !sheet;
  const rowCount = filtered.length + (inlineAdd ? 1 : 0);
  const addText = query.trim() && !exact
    ? t(`Add “${query.trim()}”`, `“${query.trim()}” যোগ করুন`)
    : t(`Add new ${noun.en}`, `নতুন ${noun.bn} যোগ করুন`);

  const show = () => {
    setQuery('');
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    setOpen(true);
  };
  const hide = (restoreFocus = true) => {
    setOpen(false);
    if (restoreFocus) window.requestAnimationFrame(() => triggerRef.current?.focus());
  };
  const choose = (next: string) => {
    onChange(next);
    hide();
  };
  const startQuickAdd = (name: string) => {
    setOpen(false);
    setQuickName(name);
  };
  const closeQuickAdd = () => {
    setQuickName(null);
    window.setTimeout(() => {
      // Preserve focus if the user has already reopened a picker or moved on.
      if (!document.activeElement || document.activeElement === document.body) triggerRef.current?.focus();
    }, 40);
  };
  const activate = (index: number) => {
    if (index < filtered.length) choose(filtered[index].value);
    else if (onCreate) startQuickAdd(query.trim());
  };

  useLayoutEffect(() => {
    if (!open || sheet) return;
    const place = () => {
      const anchor = groupRef.current?.getBoundingClientRect();
      if (!anchor) return;
      const width = Math.min(Math.max(anchor.width, 300), window.innerWidth - 16);
      const left = Math.min(Math.max(8, anchor.left), window.innerWidth - width - 8);
      const below = window.innerHeight - anchor.bottom - 12;
      const above = anchor.top - 12;
      const up = below < 260 && above > below;
      const maxHeight = Math.max(160, Math.min(380, up ? above : below));
      setRect(up
        ? { left, width, maxHeight, bottom: window.innerHeight - anchor.top + 4 }
        : { left, width, maxHeight, top: anchor.bottom + 4 });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, sheet]);

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => searchRef.current?.focus({ preventScroll: true }));
    if (sheet) {
      const previous = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { window.cancelAnimationFrame(frame); document.body.style.overflow = previous; };
    }
    const outside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!groupRef.current?.contains(target) && !panelRef.current?.contains(target)) hide(false);
    };
    document.addEventListener('pointerdown', outside);
    return () => { window.cancelAnimationFrame(frame); document.removeEventListener('pointerdown', outside); };
  }, [open, sheet]);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  const onSearchKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') { event.preventDefault(); setActive((i) => Math.min(rowCount - 1, i + 1)); }
    else if (event.key === 'ArrowUp') { event.preventDefault(); setActive((i) => Math.max(0, i - 1)); }
    else if (event.key === 'Home') { event.preventDefault(); setActive(0); }
    else if (event.key === 'End') { event.preventDefault(); setActive(Math.max(0, rowCount - 1)); }
    else if (event.key === 'Enter') {
      event.preventDefault();
      if (rowCount > 0) activate(active);
      else if (onCreate) startQuickAdd(query.trim());
    } else if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); hide(); }
    else if (event.key === 'Tab' && !sheet) {
      const trigger = triggerRef.current;
      const controls = Array.from((trigger?.closest('form') ?? document).querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex="0"]')).filter((node) => node.getClientRects().length);
      const next = controls[(trigger ? controls.indexOf(trigger) : -1) + (event.shiftKey ? -1 : 1)];
      event.preventDefault();
      hide(false);
      (next ?? trigger)?.focus();
    }
  };

  const onSheetKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); hide(); return; }
    if (event.key !== 'Tab' || !panelRef.current) return;
    const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>('button, input'));
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  };

  const activeId = rowCount === 0 ? undefined : active < filtered.length ? `${listId}-${active}` : `${listId}-add`;

  const searchInput = (big: boolean) => (
    <div className="relative">
      <SearchIcon className={'pointer-events-none absolute top-1/2 -translate-y-1/2 text-ink-400 ' + (big ? 'left-3.5 size-5' : 'left-2.5 size-4')} aria-hidden="true" />
      <Input
        ref={searchRef}
        type="search"
        role="combobox"
        aria-expanded="true"
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={activeId}
        aria-label={t(`Search ${noun.en}`, `${noun.bn} খুঁজুন`)}
        placeholder={t(`Search ${noun.en}…`, `${noun.bn} খুঁজুন…`)}
        autoComplete="off"
        value={query}
        onChange={(event) => { setQuery(event.target.value); setActive(0); }}
        onKeyDown={onSearchKey}
        className={
          'w-full rounded-lg border border-input bg-card text-ink outline-none placeholder:text-ink-400 focus:border-primary focus:ring-2 focus:ring-primary/20 [&::-webkit-search-cancel-button]:hidden ' +
          (big ? 'h-12 pl-11 pr-3 text-[16px]' : 'h-9 pl-8 pr-2 text-[14px]')
        }
      />
    </div>
  );

  const list = (big: boolean) => (
    <>
      {filtered.length === 0 && (
        <p className="px-3 py-5 text-center text-[14px] text-ink-500">
          {t(`No ${noun.en} matches “${query.trim()}”.`, `“${query.trim()}” নামে কোনো ${noun.bn} নেই।`)}
        </p>
      )}
      <div role="listbox" id={listId} aria-label={t(`${noun.en} list`, `${noun.bn} তালিকা`)} className="space-y-0.5">
        {filtered.map((option, index) => {
          const isSelected = option.value === value;
          const isActive = index === active;
          return (
            <div
              key={option.value}
              id={`${listId}-${index}`}
              role="option"
              data-value={option.value}
              aria-selected={isSelected}
              data-active={isActive}
              onPointerDown={(event) => event.preventDefault()}
              onPointerMove={() => setActive(index)}
              onClick={() => choose(option.value)}
              className={
                'flex cursor-pointer items-center gap-3 rounded-md px-3 ' +
                (big ? 'min-h-12 text-[16px] ' : 'min-h-9 text-[14px] ') +
                (isActive ? 'bg-accent text-accent-foreground' : 'text-ink')
              }
            >
              <span className="min-w-0 flex-1 truncate">{option.label}</span>
              {option.meta && <span className="shrink-0 text-[12px] text-ink-500">{option.meta}</span>}
              {isSelected && <CheckIcon className="size-4 shrink-0 text-primary" aria-hidden="true" />}
            </div>
          );
        })}
        {inlineAdd && (
          <div
            id={`${listId}-add`}
            role="option"
            aria-selected={false}
            data-active={active === filtered.length}
            onPointerDown={(event) => event.preventDefault()}
            onPointerMove={() => setActive(filtered.length)}
            onClick={() => startQuickAdd(query.trim())}
            className={
              'mt-1 flex min-h-9 cursor-pointer items-center gap-2 rounded-md px-3 text-[14px] font-medium text-primary ' +
              (active === filtered.length ? 'bg-accent' : '')
            }
          >
            <PlusIcon className="size-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{addText}</span>
          </div>
        )}
      </div>
    </>
  );

  const overlay = sheet ? (
    <motion.div
      key="sheet"
      id={`${listId}-popup`}
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${listId}-title`}
      onKeyDown={onSheetKey}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ duration: reduce ? 0 : 0.22, ease: EASE }}
      className="fixed inset-0 z-[150] flex flex-col bg-card text-ink"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="flex h-14 shrink-0 items-center gap-1 border-b border-border px-1">
        <button type="button" onClick={() => hide()} aria-label={t('Close', 'বন্ধ করুন')}
          className="flex size-11 items-center justify-center rounded-lg text-ink transition-colors duration-150 hover:bg-ink-50">
          <ArrowLeftIcon className="size-5" aria-hidden="true" />
        </button>
        <h2 id={`${listId}-title`} className="text-[17px] font-semibold">{t(`Choose ${noun.en}`, `${noun.bn} বাছুন`)}</h2>
      </div>
      <div className="shrink-0 p-3">{searchInput(true)}</div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">{list(true)}</div>
      {onCreate && (
        <div className="shrink-0 border-t border-border bg-card px-3 pt-3" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
          <button type="button" onClick={() => startQuickAdd(query.trim())}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-primary px-4 text-[15px] font-semibold text-primary transition-colors duration-150 active:bg-accent">
            <PlusIcon className="size-5 shrink-0" aria-hidden="true" />
            <span className="truncate">{addText}</span>
          </button>
        </div>
      )}
    </motion.div>
  ) : (
    <motion.div
      key="popover"
      id={`${listId}-popup`}
      ref={panelRef}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: reduce ? 0 : 0.15, ease: EASE }}
      className="fixed z-[160] flex flex-col overflow-hidden rounded-xl border border-border bg-popover text-ink shadow-pop"
      style={{
        left: rect?.left ?? 0, width: rect?.width ?? 300, maxHeight: rect?.maxHeight ?? 380,
        top: rect?.top, bottom: rect?.bottom, visibility: rect ? 'visible' : 'hidden'
      }}
    >
      <div className="shrink-0 border-b border-border p-2">{searchInput(false)}</div>
      <div className="min-h-0 flex-1 overflow-y-auto p-1 scrollbar-thin">{list(false)}</div>
    </motion.div>
  );

  return (
    <>
      <div ref={groupRef} className="flex min-w-0">
        <button
          ref={triggerRef}
          data-hisabiq-select=""
          id={id}
          data-value={value}
          disabled={disabled}
          type="button"
          role="combobox"
          aria-controls={open ? `${listId}-popup` : undefined}
          aria-haspopup={sheet ? 'dialog' : 'listbox'}
          aria-expanded={open}
          aria-labelledby={labelledBy ? `${labelledBy} ${id}-value` : undefined}
          aria-label={ariaLabel ?? (labelledBy ? undefined : `${t(noun.en, noun.bn)}: ${selected?.label ?? ''}`)}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          onClick={() => (open ? hide() : show())}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); show(); }
            else if (event.key.length === 1 && /\S/.test(event.key) && !event.ctrlKey && !event.metaKey && !event.altKey) {
              show();
              setQuery(event.key);
              setActive(0);
            }
          }}
          className={
            'flex h-[var(--ctl-h,36px)] min-w-0 flex-1 items-center gap-2 border bg-card px-3 text-left text-[length:var(--ctl-fs,14px)] text-ink transition-colors duration-150 ease-out hover:bg-ink-50 ' +
            'rounded-md ' + (invalid ? 'border-danger' : 'border-input')
          }
        >
          <span id={`${id}-value`} className={'min-w-0 flex-1 truncate ' + (selected ? '' : 'text-ink-400')}>
            {selected?.label ?? t('Choose', 'বাছুন')}
          </span>
          <ChevronDownIcon className="size-4 shrink-0 text-ink-500" aria-hidden="true" />
        </button>
      </div>
      {typeof document !== 'undefined' && createPortal(<AnimatePresence>{open && overlay}</AnimatePresence>, document.body)}
      {quickName !== null && onCreate && (
        <QuickAddDialog
          noun={noun}
          initialName={quickName}
          placeholder={createPlaceholder}
          nameLabel={nameLabel}
          withSymbol={withSymbol}
          showContact={showContact}
          existing={options}
          onClose={closeQuickAdd}
          onSelectExisting={(next) => { onChange(next); closeQuickAdd(); }}
          onCreate={(name, symbol, phone, area) => { const value = onCreate(name, symbol, phone, area); if (autoSelectCreated) onChange(value); closeQuickAdd(); }}
        />
      )}
    </>
  );
}
