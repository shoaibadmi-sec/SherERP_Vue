import {rankSearch} from '../../utils/fuzzySearch';
import React, { forwardRef, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Search, X } from 'lucide-react';
import { ProductThumb } from '../ProductThumb';
import { products as seedProducts } from '../../data/products';
import { stockLots } from '../../data/productInventory';
import { productOffers } from '../../data/productOffers';
import { formatStock, stockStatus, unitsFor } from '../../utils/units';
import { taka } from '../../utils/currency';
import type { Product } from '../../types/erp';
import { activeOfferFor, effectivePriceForUnit, productStockBreakdown } from '../../utils/productFeatures';
import { useUiCopy } from '../../i18n/useUiCopy';
import { getBundleVersion } from '../../data/productImportPreviewStore';
import { availableStockLots } from '../../data/erpDemoStore';
import { getBundleProjection } from '../../bundles/bundleProjection';

export type ProductPickerMode = 'sale' | 'purchase' | 'quotation' | 'online';
type ProductComboboxProps = {
  onSelect: (product: Product) => void;
  products?: readonly Product[];
  mode?: ProductPickerMode;
  onCreate?: (query: string) => void;
  ariaLabel?: string;
  disabled?: boolean;
};

type ListPosition = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  opensUp: boolean;
};

const VIEWPORT_PADDING = 8;
const GAP = 6;
const DESIRED_WIDTH = 560;

export const ProductCombobox = forwardRef<HTMLInputElement, ProductComboboxProps>(function ProductCombobox(
{ onSelect, products: suppliedProducts, mode = 'sale', onCreate, ariaLabel, disabled = false },
ref)
{
  const {text} = useUiCopy();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [position, setPosition] = useState<ListPosition | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);

  const setInputRef = useCallback((node: HTMLInputElement | null) => {
    inputRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  }, [ref]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = (suppliedProducts ?? seedProducts).filter((p) => p.active && (mode !== 'purchase' || (p.kind !== 'Service' && p.kind !== 'Bundle')));
    return rankSearch(list,q,p=>[p.name,p.nameBn,p.sku,p.category,p.brand]).slice(0,8);
  }, [query, suppliedProducts, mode]);

  const updatePosition = useCallback(() => {
    if (!open || !inputRef.current) return;

    const triggerRect = inputRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    // Keep the floating list below the sticky ERP toolbar on phones/tablets.
    // Without this safe top inset, an upward-opening list intercepts menu taps.
    // The bilingual header can wrap to two rows on some phones; measure it rather than assume 64px.
    const headerBottom = document.querySelector<HTMLElement>('.erp-workspace > div > header')?.getBoundingClientRect().bottom ?? 0;
    // Mobile menu is the real no-overlap boundary even when the bilingual header wraps.
    const menuBottom = document.querySelector<HTMLElement>('[aria-controls="erp-mobile-drawer"]')?.getBoundingClientRect().bottom ?? 0;
    const topBoundary = viewportWidth < 1024 ? Math.max(64, headerBottom + GAP, menuBottom + GAP) : VIEWPORT_PADDING;
    const naturalHeight = listRef.current?.scrollHeight ?? 0;
    const maxViewportHeight = Math.max(80, viewportHeight - topBoundary - VIEWPORT_PADDING);
    const spaceBelow = Math.max(0, viewportHeight - triggerRect.bottom - GAP - VIEWPORT_PADDING);
    const spaceAbove = Math.max(0, triggerRect.top - GAP - topBoundary);

    const opensUp = naturalHeight > 0 && naturalHeight > spaceBelow && spaceAbove > spaceBelow;
    const availableSpace = opensUp ? spaceAbove : spaceBelow;
    const maxHeight = Math.max(72, Math.min(maxViewportHeight, availableSpace));
    const panelHeight = Math.min(naturalHeight || maxHeight, maxHeight);
    const width = Math.min(
      Math.max(triggerRect.width, DESIRED_WIDTH),
      Math.max(0, viewportWidth - VIEWPORT_PADDING * 2)
    );
    const left = Math.min(
      Math.max(VIEWPORT_PADDING, triggerRect.left),
      Math.max(VIEWPORT_PADDING, viewportWidth - width - VIEWPORT_PADDING)
    );

    const preferredTop = opensUp
      ? triggerRect.top - GAP - panelHeight
      : triggerRect.bottom + GAP;

    const top = Math.min(
      Math.max(topBoundary, preferredTop),
      Math.max(topBoundary, viewportHeight - panelHeight - VIEWPORT_PADDING)
    );

    setPosition((current) => {
      const next = { top, left, width, maxHeight, opensUp };
      if (
        current &&
        current.top === next.top &&
        current.left === next.left &&
        current.width === next.width &&
        current.maxHeight === next.maxHeight &&
        current.opensUp === next.opensUp
      ) {
        return current;
      }
      return next;
    });
  }, [open]);

  useLayoutEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }
    updatePosition();
    const frame = window.requestAnimationFrame(updatePosition);
    return () => window.cancelAnimationFrame(frame);
  }, [open, results.length, updatePosition]);

  useEffect(() => {
    if (!open) return;

    const onOutsideInteraction = (event: MouseEvent | FocusEvent | PointerEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || listRef.current?.contains(target)) return;
      setOpen(false);
    };

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.defaultPrevented) {
        const dialogs = document.querySelectorAll('[data-dialog-root]');
        if (dialogs.length && dialogs[dialogs.length - 1] !== rootRef.current?.closest('[data-dialog-root]')) return;
        event.preventDefault();
        event.stopPropagation();
        setOpen(false);
      }
    };

    const onViewportChange = () => updatePosition();

    document.addEventListener('pointerdown', onOutsideInteraction);
    document.addEventListener('mousedown', onOutsideInteraction);
    document.addEventListener('focusin', onOutsideInteraction);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onViewportChange);
    window.addEventListener('scroll', onViewportChange, true);

    return () => {
      document.removeEventListener('pointerdown', onOutsideInteraction);
      document.removeEventListener('mousedown', onOutsideInteraction);
      document.removeEventListener('focusin', onOutsideInteraction);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onViewportChange);
      window.removeEventListener('scroll', onViewportChange, true);
    };
  }, [open, updatePosition]);

  const choose = (p: Product) => {
    if (disabled) return;
    onSelect(p);
    setQuery('');
    setActive(0);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (!open) return; // Never select a suggestion the user has dismissed.
      if (results[active]) choose(results[active]);
      else if (onCreate && query.trim()) {setOpen(false); onCreate(query.trim());}
    } else if (e.key === 'Escape' && open) {
      // Consume the popup dismissal before the parent dialog sees Escape.
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
    }
  };

  const listbox = typeof document !== 'undefined' && open && !disabled
    ? createPortal(
        <ul
          ref={listRef}
          id="pos-product-list"
          role="listbox"
          aria-label={mode === 'purchase' ? 'Purchase product suggestions' : (ariaLabel ? ariaLabel + ' options' : 'POS product suggestions')}
          className="fixed z-[110] overflow-y-auto rounded-xl border border-border bg-card p-1 shadow-pop scrollbar-thin"
          style={{
            top: position?.top ?? 0,
            left: position?.left ?? 0,
            width: position?.width ?? Math.min(DESIRED_WIDTH, window.innerWidth - VIEWPORT_PADDING * 2),
            maxHeight: position?.maxHeight ?? `calc(100vh - ${VIEWPORT_PADDING * 2}px)`,
            visibility: position ? 'visible' : 'hidden'
          }}>
          {results.map((p, i) => {
            const status = stockStatus(p);
            const activeOffer = activeOfferFor(p.id, productOffers);
            const preferredUnit = mode === 'purchase' ? p.unit : (p.stockViewUnit ?? p.altUnit?.unit ?? p.unit);
            const displayUnit = unitsFor(p).includes(preferredUnit) ? preferredUnit : p.unit;
            const normalPrice = mode === 'purchase' ? p.purchasePrice : effectivePriceForUnit(p, undefined, displayUnit);
            const effectivePrice = mode === 'purchase' ? p.purchasePrice : effectivePriceForUnit(p, activeOffer, displayUnit);
            const recipe=p.kind==='Bundle'?getBundleVersion(p.id):undefined;
            const bundleAvailable=recipe?getBundleProjection(recipe,suppliedProducts??seedProducts,availableStockLots()).availableSets:0;
            const breakdown = p.kind === 'Service'||p.kind==='Bundle' ? null : productStockBreakdown(p, stockLots);
            const sellableStatus = p.kind === 'Bundle' ? bundleAvailable>0?'in':'out' : p.kind === 'Service'
              ? 'service'
              : p.expiry?.enabled
                ? (breakdown?.sellable ?? 0) <= 0
                  ? 'out'
                  : (breakdown?.sellable ?? 0) <= p.minStock
                    ? 'low'
                    : 'in'
                : status;
            return (
              <li
                key={p.id}
                role="option"
                id={'pos-product-option-' + p.id}
                aria-selected={i === active}
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(p);
                }}
                onMouseEnter={() => setActive(i)}
                className={`flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 ${i === active ? 'bg-teal-50' : ''}`}>
                <ProductThumb src={p.image} size={32} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-ink">{p.name}</p>
                  <p className="truncate text-[11px] text-ink-500">
                    <span className="font-bn">{p.nameBn}</span>{p.nameBn ? ' · ' : ''}{p.category}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[13px] font-medium text-ink">
                    {mode !== 'purchase' && activeOffer && <span className="mr-1 text-[10px] font-normal text-ink-400 line-through">{taka(normalPrice)}</span>}
                    {taka(effectivePrice, effectivePrice % 1 ? 2 : 0)}
                    <span className="font-normal text-ink-400">/{displayUnit}</span>
                  </p>
                  <p className={`text-[11px] ${sellableStatus === 'low' || sellableStatus === 'out' ? 'text-danger' : 'text-ink-500'}`}>
                    {p.kind === 'Bundle'
                      ? 'Package · '+bundleAvailable+' Set available'
                      : p.kind === 'Service'
                      ? 'Service'
                      : p.expiry?.enabled
                        ? `${sellableStatus === 'out' ? 'Out of sellable stock' : 'Sellable'} · ${formatStock({ ...p, stock: breakdown?.sellable ?? 0 })}`
                        : status === 'out'
                          ? 'Out of stock'
                          : formatStock(p)}
                  </p>
                </div>
              </li>
            );
          })}
          {results.length === 0 && <li className="px-3 py-3 text-xs text-ink-500">{text('No matching products.','কোনো পণ্য পাওয়া যায়নি।')} {onCreate ? text('Use Create new product below.','নিচ থেকে নতুন পণ্য যোগ করুন।') : text('Try another search.','অন্য নামে খুঁজুন।')}</li>}
          {onCreate && <li><button type="button" onMouseDown={event => event.preventDefault()} onClick={() => {setOpen(false);onCreate(query.trim());}} className="mt-1 flex w-full items-center gap-2 rounded-lg border-t border-border px-3 py-2 text-left text-sm font-medium text-teal-700 hover:bg-teal-50"><Plus className="size-4"/>{text('Create new product','নতুন পণ্য যোগ করুন')} {query.trim() ? '· '+query.trim() : ''}</button></li>}
        </ul>,
        document.body
      )
    : null;

  return (
    <div ref={rootRef} className="relative">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-teal-600" aria-hidden="true" />
      <input
        ref={setInputRef}
        role="combobox"
        disabled={disabled}
        aria-expanded={open}
        aria-activedescendant={open && results[active] ? 'pos-product-option-' + results[active].id : undefined}
        aria-controls="pos-product-list"
        aria-autocomplete="list"
        aria-label={ariaLabel ?? text('Add product','পণ্য যোগ করুন')}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={text("Add product… name, SKU or বাংলা","পণ্য খুঁজুন বা যোগ করুন… নাম, SKU বা বাংলা")}
        className={`h-9 w-full rounded-lg border border-dashed border-teal-400 bg-teal-50/40 pl-8 text-sm text-ink placeholder:text-ink-500 focus:border-solid focus:border-teal-500 focus:bg-card focus:outline-none focus:ring-2 focus:ring-teal-500/20 ${query ? 'pr-20' : 'pr-12'}`} />
      {query&&<button type="button" aria-label={text("Clear product search","পণ্যের খোঁজ খালি করুন")} title={text("Clear product search","পণ্যের খোঁজ খালি করুন")}
        onMouseDown={event=>event.preventDefault()}
        onClick={()=>{setQuery('');setActive(0);setOpen(true);inputRef.current?.focus();}}
        className="absolute right-11 top-1/2 z-10 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-ink-400 hover:bg-ink-100 hover:text-ink focus-visible:ring-2 focus-visible:ring-teal-500/30">
        <X className="size-4" aria-hidden="true"/>
      </button>}
      <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-ink-200 bg-card px-1.5 text-[10px] text-ink-500">
        F2
      </kbd>
      {listbox}
    </div>
  );
});

