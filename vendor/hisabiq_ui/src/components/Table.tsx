import { forwardRef, useEffect, useRef, type TableHTMLAttributes } from 'react';
import {
  Table as DesignTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../_designSystem/ds-6551b66a-cfd3-4df9-a9b1-9ead8d7fe7e9';

export { TableBody, TableCell, TableHead, TableHeader, TableRow };

type TableProps = TableHTMLAttributes<HTMLTableElement> & {
  /** Accessible name for the keyboard-scrollable wrapper when the table overflows. */
  scrollRegionLabel?: string;
};

export const Table = forwardRef<HTMLTableElement, TableProps>(function Table({ scrollRegionLabel, ...props }, forwardedRef) {
  const tableRef = useRef<HTMLTableElement | null>(null);

  useEffect(() => {
    const table = tableRef.current;
    const region = table?.parentElement;
    if (!table || !region) return;

    const updateScrollRegion = () => {
      const overflowing = region.scrollWidth > region.clientWidth + 1;
      if (overflowing) {
        const caption = table.querySelector('caption')?.textContent?.trim();
        const label = scrollRegionLabel || caption;
        region.tabIndex = 0;
        region.classList.add('focus-visible:outline-none', 'focus-visible:ring-2', 'focus-visible:ring-ring', 'focus-visible:ring-offset-2', 'rounded-sm');
        if (label) {
          region.setAttribute('role', 'region');
          region.setAttribute('aria-label', label);
        } else {
          region.removeAttribute('role');
          region.removeAttribute('aria-label');
        }
      } else {
        region.tabIndex = -1;
        region.removeAttribute('role');
        region.removeAttribute('aria-label');
        region.classList.remove('focus-visible:outline-none', 'focus-visible:ring-2', 'focus-visible:ring-ring', 'focus-visible:ring-offset-2', 'rounded-sm');
      }
    };
    const scrollWithArrowKeys = (event: KeyboardEvent) => {
      if (event.target !== region || region.tabIndex !== 0 || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return;
      event.preventDefault();
      region.scrollBy({ left: event.key === 'ArrowRight' ? 48 : -48 });
    };

    updateScrollRegion();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(updateScrollRegion);
    observer?.observe(region);
    observer?.observe(table);
    region.addEventListener('keydown', scrollWithArrowKeys);
    window.addEventListener('resize', updateScrollRegion);
    return () => {
      observer?.disconnect();
      region.removeEventListener('keydown', scrollWithArrowKeys);
      window.removeEventListener('resize', updateScrollRegion);
    };
  }, [scrollRegionLabel]);

  return (
    <DesignTable
      {...props}
      data-erp-table=""
      ref={(node) => {
        tableRef.current = node;
        if (typeof forwardedRef === 'function') forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      }}
    />
  );
});
