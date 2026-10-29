import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { Copy, Delete, X } from 'lucide-react';
import { toast } from 'sonner';
import { useUiCopy } from '../../i18n/useUiCopy';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import {
  CALCULATOR_STORAGE_KEY,
  MAX_CALCULATOR_LINES,
  evaluateCalculatorExpression,
  formatCalculatorNumber,
  sanitizeCalculatorLines,
  summarizeCalculatorLines
} from '../../utils/calculatorScratchpad';

type CalcKey = { label: string; value?: string; action?: 'back' | 'clearLine' | 'next'; kind?: 'op' | 'fn' | 'next' };

const KEYS: CalcKey[] = [
  { label: 'AC', action: 'clearLine', kind: 'fn' },
  { label: '%', value: '%', kind: 'fn' },
  { label: '⌫', action: 'back', kind: 'fn' },
  { label: '÷', value: '÷', kind: 'op' },
  { label: '7', value: '7' }, { label: '8', value: '8' },
  { label: '9', value: '9' }, { label: '×', value: '×', kind: 'op' },
  { label: '4', value: '4' }, { label: '5', value: '5' },
  { label: '6', value: '6' }, { label: '−', value: '-', kind: 'op' },
  { label: '1', value: '1' }, { label: '2', value: '2' },
  { label: '3', value: '3' }, { label: '+', value: '+', kind: 'op' },
  { label: '00', value: '00' }, { label: '0', value: '0' },
  { label: '.', value: '.' }, { label: 'Enter', action: 'next', kind: 'next' }
];

function loadLines(): string[] {
  if (typeof window === 'undefined') return [''];
  try { return sanitizeCalculatorLines(JSON.parse(window.localStorage.getItem(CALCULATOR_STORAGE_KEY) ?? 'null')); }
  catch { return ['']; }
}

export function Calculator() {
  const { text } = useUiCopy();
  const touch = useMediaQuery('(pointer: coarse)');
  const [lines, setLines] = useState<string[]>(loadLines);
  const linesRef = useRef(lines);
  const [activeIndex, setActiveIndex] = useState(lines.length - 1);
  const activeRef = useRef(activeIndex);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const { results, total, errors } = summarizeCalculatorLines(lines);

  const store = useCallback((next: string[]) => {
    const safe = sanitizeCalculatorLines(next);
    linesRef.current = safe;
    setLines(safe);
    try { window.localStorage.setItem(CALCULATOR_STORAGE_KEY, JSON.stringify(safe)); }
    catch { /* local-only scratchpad still works when storage is unavailable */ }
  }, []);

  const activate = useCallback((idx: number) => {
    const next = Math.max(0, Math.min(idx, linesRef.current.length - 1));
    activeRef.current = next;
    setActiveIndex(next);
    return next;
  }, []);

  const reveal = useCallback((idx: number) => {
    const container = listRef.current;
    const item = inputs.current[idx]?.closest<HTMLElement>('[data-calculator-line]');
    if (!container || !item) return;
    // Until the fifth line exists, keep every calculation line visible.
    if (linesRef.current.length <= 4) {
      container.scrollTop = 0;
      return;
    }
    const outer = container.getBoundingClientRect();
    const inner = item.getBoundingClientRect();
    if (inner.bottom > outer.bottom - 6) container.scrollTop += inner.bottom - outer.bottom + 8;
    else if (inner.top < outer.top + 6) container.scrollTop -= outer.top - inner.top + 8;
  }, []);

  const focusLine = useCallback((idx: number) => {
    const next = activate(idx); // update destination synchronously for rapid Enter/digit sequences
    window.requestAnimationFrame(() => {
      const field = inputs.current[next];
      field?.focus({ preventScroll: true });
      if (field) field.setSelectionRange(field.value.length, field.value.length);
      reveal(next); // scroll only our list; never the ERP page behind the popover
    });
  }, [activate, reveal]);

  // Rapid Enter taps can commit a new row before the focus animation frame runs.
  // Keep the active line within the scratchpad scroll viewport in the same
  // layout commit; the later focus frame still preserves the caret position.
  useLayoutEffect(() => {
    reveal(activeIndex);
  }, [activeIndex, lines.length, reveal]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => focusLine(activeRef.current));
    return () => window.cancelAnimationFrame(frame);
  }, [focusLine]);

  const editLine = (idx: number, value: string) => {
    if (idx < 0 || idx >= linesRef.current.length) return;
    const next = [...linesRef.current];
    next[idx] = value.slice(0, 256);
    store(next);
  };

  const nextLine = () => {
    const idx = activeRef.current;
    if (idx < linesRef.current.length - 1) { focusLine(idx + 1); return; }
    if (linesRef.current.length >= MAX_CALCULATOR_LINES) return;
    store([...linesRef.current, '']);
    focusLine(idx + 1);
  };

  const removeLine = (idx: number) => {
    const next = [...linesRef.current];
    if (next.length === 1) next[0] = '';
    else next.splice(idx, 1);
    store(next);
    focusLine(Math.max(0, Math.min(idx - 1, next.length - 1)));
  };

  const clearAll = () => { store(['']); focusLine(0); };

  const replaceSelection = (value: string, back = false, clear = false) => {
    const idx = activeRef.current;
    const field = inputs.current[idx];
    const original = linesRef.current[idx] ?? '';
    const start = field?.selectionStart ?? original.length;
    const end = field?.selectionEnd ?? original.length;
    let result = original;
    let cursor = start;
    if (clear) { result = ''; cursor = 0; }
    else if (back) {
      if (start !== end) result = original.slice(0, start) + original.slice(end);
      else if (start > 0) { result = original.slice(0, start - 1) + original.slice(end); cursor = start - 1; }
    } else {
      result = original.slice(0, start) + value + original.slice(end);
      cursor = start + value.length;
    }
    if (result.length > 256) return;
    editLine(idx, result);
    // React updates controlled input without replacing the row or losing its caret.
    if (field) {
      field.focus({ preventScroll: true });
      window.requestAnimationFrame(() => {
        field.setSelectionRange(cursor, cursor);
        reveal(idx);
      });
    }
  };

  const press = (key: CalcKey) => {
    if (key.action === 'next') { nextLine(); return; }
    if (key.action === 'clearLine') { clearAll(); return; }
    if (key.action === 'back') {
      if (!linesRef.current[activeRef.current] && activeRef.current > 0) removeLine(activeRef.current);
      else replaceSelection('', true);
      return;
    }
    if (key.value) replaceSelection(key.value);
  };

  const onKeyboard = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.altKey || event.metaKey || event.ctrlKey || event.nativeEvent.isComposing) return;
    const target = event.target;
    if (target instanceof HTMLButtonElement) return;
    const field = target instanceof HTMLInputElement;
    const idx = activeRef.current;
    if (event.key === 'Enter' || event.key === '=') {
      event.preventDefault();
      nextLine();
      return;
    }
    if (event.key === 'Backspace' && !linesRef.current[idx] && idx > 0) {
      event.preventDefault();
      removeLine(idx);
      return;
    }
    // Desktop fields use native typing/selection; coarse-pointer devices use
    // readonly inputs and physical-key input here to avoid the virtual keyboard.
    if (field && !touch) return;
    if (event.key === 'Backspace') { event.preventDefault(); press({ label: '', action: 'back' }); return; }
    if (event.key === 'Delete') { event.preventDefault(); press({ label: '', action: 'clearLine' }); return; }
    const keys: Record<string, string> = {
      '*': '×', x: '×', X: '×', '/': '÷', '+': '+', '-': '-', '.': '.', ',': '.',
      '(': '(', ')': ')', '%': '%'
    };
    const numeric = /^[0-9০-৯]$/.test(event.key);
    if (numeric || Object.prototype.hasOwnProperty.call(keys, event.key)) {
      event.preventDefault();
      replaceSelection(numeric ? event.key : keys[event.key]);
    }
  };

  const onTouchLine = (event: PointerEvent<HTMLInputElement>, idx: number) => {
    if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;
    event.preventDefault();
    focusLine(idx);
  };

  const copyTotal = () => {
    if (!navigator.clipboard?.writeText) {
      toast.error(text('Copy is unavailable', 'কপি করা যাচ্ছে না'));
      return;
    }
    void navigator.clipboard.writeText(formatCalculatorNumber(total))
      .then(() => toast.success(text('Total copied', 'মোট কপি হয়েছে')))
      .catch(() => toast.error(text('Copy is unavailable', 'কপি করা যাচ্ছে না')));
  };

  // Preserve the classic result-first layout; only the working area is new.
  const preview = lines[activeIndex]?.trim() || [...lines].reverse().find(line => line.trim()) || '';
  const visibleRowCount = Math.min(lines.length, 4);

  return (
    <div ref={rootRef} data-calculator="scratchpad"
      onKeyDown={onKeyboard}
      className="flex min-h-0 w-full flex-col overflow-hidden p-3 text-ink"
      style={{ height: `min(${386 + 40 * visibleRowCount}px, calc(100dvh - 24px))` }}>
      <div className="mb-2 shrink-0 rounded-lg bg-ink-50 px-3 py-2.5 text-right" data-calculator-display>
        <div className="mb-1 flex min-w-0 items-center justify-between gap-2 text-xs text-ink-500">
          <span>{text('Total', 'মোট')}</span>
          <span className="min-w-0 truncate" title={preview}>
            {preview ? preview + ' =' : text('Calculation', 'হিসাব')}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <button type="button" onClick={copyTotal}
            className="flex size-7 shrink-0 items-center justify-center rounded text-ink-400 hover:bg-card hover:text-ink"
            aria-label={text('Copy calculator total', 'মোট হিসাব কপি করুন')}>
            <Copy className="size-3.5" aria-hidden="true"/>
          </button>
          <output data-calculator-total
            className="min-w-0 max-w-full overflow-x-auto whitespace-nowrap text-right text-2xl font-semibold tracking-tight text-ink">
            {formatCalculatorNumber(total)}
          </output>
        </div>
        {errors > 0 && <div role="status" className="pt-1 text-right text-[11px] text-danger">
          {errors} {text('invalid line(s) excluded', 'টি ভুল লাইন বাদ')}
        </div>}
      </div>
      <div ref={listRef} data-calculator-lines
        style={{ height: 8 + 40 * visibleRowCount, flexShrink: 0 }}
        className="min-h-0 shrink-0 space-y-1 overflow-y-auto overscroll-contain px-1 py-1 scrollbar-thin">
        {lines.map((line, idx) => {
          const result = results[idx] ?? evaluateCalculatorExpression(line);
          const hasError = Boolean(line.trim() && result.error);
          return (
            <div data-calculator-line data-active={idx === activeIndex ? 'true' : 'false'}
              key={idx}
              className={'flex min-h-9 items-center gap-1 rounded-md px-1 py-0.5 ' +
                (idx === activeIndex ? 'bg-teal-50' : 'hover:bg-ink-50')}>
              <span className="w-4 shrink-0 text-right text-[11px] text-ink-400" aria-hidden="true">{idx + 1}</span>
              <input
                ref={node => { inputs.current[idx] = node; }}
                data-calculator-input
                type="text" inputMode={touch ? 'none' : 'decimal'} readOnly={touch}
                style={{ outline: 'none', outlineWidth: 0, boxShadow: 'none' }}
                autoComplete="off" spellCheck={false}
                aria-label={text('Calculation line ', 'হিসাবের লাইন ') + (idx + 1)}
                aria-invalid={hasError} value={line}
                onChange={event => editLine(idx, event.target.value)}
                onFocus={() => { activate(idx); reveal(idx); }}
                onPointerDown={event => onTouchLine(event, idx)}
                className={'h-7 min-w-0 flex-1 border-0 bg-transparent px-1 text-[13px] text-ink outline-none ' +
                  (hasError ? 'text-danger' : '')}
                placeholder={text('0 + 0', '০ + ০')} />
              <output aria-label={text('Line result', 'লাইনের ফলাফল')}
                title={hasError ? text('Invalid expression', 'ভুল হিসাব') : formatCalculatorNumber(result.value)}
                className={'max-w-[88px] min-w-[40px] shrink-0 overflow-x-auto whitespace-nowrap text-right text-[12px] font-semibold ' +
                  (hasError ? 'text-danger' : 'text-teal-700')}>
                {line.trim() ? (hasError ? text('Error', 'ভুল') : '= ' + formatCalculatorNumber(result.value)) : ''}
              </output>
              <button type="button" aria-label={text('Remove line ', 'লাইন মুছুন ') + (idx + 1)}
                onClick={() => removeLine(idx)}
                className="flex size-6 shrink-0 items-center justify-center rounded text-ink-400 hover:bg-ink-50 hover:text-danger focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-500">
                <X className="size-3" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
      <div data-calculator-keypad
        className="grid min-h-0 shrink grid-cols-4 gap-1.5 overflow-y-auto overscroll-contain pt-2 scrollbar-thin"
        aria-label={text('Calculator keys', 'ক্যালকুলেটর বাটন')}>
        <div data-calculator-parentheses className="col-span-4 flex items-center justify-end gap-1.5">
          <button type="button" onMouseDown={event => event.preventDefault()}
            onClick={() => replaceSelection('(')} aria-label={text('Open parenthesis', 'বাম বন্ধনী')}
            className="flex h-8 min-w-10 items-center justify-center rounded-lg bg-ink-50 px-2 text-[14px] font-medium text-ink-600 hover:bg-ink-100">(
          </button>
          <button type="button" onMouseDown={event => event.preventDefault()}
            onClick={() => replaceSelection(')')} aria-label={text('Close parenthesis', 'ডান বন্ধনী')}
            className="flex h-8 min-w-10 items-center justify-center rounded-lg bg-ink-50 px-2 text-[14px] font-medium text-ink-600 hover:bg-ink-100">)
          </button>
        </div>
        {KEYS.map((key, idx) => (
          <button key={idx} type="button"
            aria-label={key.action === 'back' ? text('Backspace', 'আগের সংখ্যা মুছুন')
              : key.action === 'clearLine' ? text('Clear all calculator lines', 'সব হিসাব মুছুন')
              : key.action === 'next' ? text('Next calculation line', 'পরের হিসাবের লাইন')
              : key.label}
            onMouseDown={event => event.preventDefault()}
            onClick={() => press(key)}
            className={'flex h-10 min-w-0 shrink-0 items-center justify-center rounded-lg text-[15px] font-medium transition-colors active:scale-[0.97] ' +
              (key.kind === 'next' ? 'bg-teal-600 text-white hover:bg-teal-700' :
                key.kind === 'op' ? 'bg-teal-50 text-teal-700 hover:bg-teal-100' :
                key.kind === 'fn' ? 'bg-ink-50 text-ink-600 hover:bg-ink-100' :
                'border border-border bg-card text-ink hover:bg-ink-50')}>
            {key.action === 'back' ? <Delete className="size-4" aria-hidden="true"/> : key.action === 'next' ? text('Enter', 'এন্টার') : key.label}
          </button>
        ))}
      </div>
    </div>
  );
}
