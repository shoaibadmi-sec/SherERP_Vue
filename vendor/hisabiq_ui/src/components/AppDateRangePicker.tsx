import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {useUiCopy} from '../i18n/useUiCopy';
import type {UiLanguage} from '../i18n/uiCopy';
import {datePresetBn,weekdaysBn,datePickerDayLabel,datePickerMonthLabel,datePickerRangeLabel,datePickerWord} from '../i18n/datePickerCopy';
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react';
import {
  addDays, addMonths, businessToday, datePreset, isoDay, utcDate, type IsoRange
} from '../utils/dateRange';

type Props = {
  value: IsoRange;
  onChange: (next: IsoRange) => void;
  label?: string;
  className?: string;
  single?: boolean;
};
const empty: IsoRange = { from: '', to: '' };
const presets = ['Today', 'Yesterday', 'Last 7 days', 'This week', 'This month', 'Last month'];
const weekdays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
function Month({
  first, selected, today, choose, focusDay, language
}: { first: string; selected: IsoRange; today: string; choose: (day: string) => void; focusDay: (day: string) => void; language:UiLanguage }) {
  const month = utcDate(first);
  const year = month.getUTCFullYear(), m = month.getUTCMonth();
  const offset = (month.getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(year, m + 1, 0)).getUTCDate();
  const cells = Array.from({ length: Math.ceil((offset + days) / 7) * 7 }, (_, index) => {
    const day = index - offset + 1;
    return day > 0 && day <= days ? isoDay(year, m, day) : '';
  });
  return <div className="min-w-0 flex-1" aria-label={datePickerMonthLabel(language,first)}>
    <p className="mb-2 text-center text-[13px] font-semibold text-ink">{datePickerMonthLabel(language,first)}</p>
    <div role="grid" aria-label={datePickerWord(language,'Choose dates in ','তারিখ বাছুন: ')+datePickerMonthLabel(language,first)} className="space-y-0.5 text-center" style={{ visibility: "visible" }}>
      <div role="row" className="grid grid-cols-7 gap-0.5">
        {weekdays.map((day,index) => <span key={day} role="columnheader" className="py-1 text-[11px] font-medium text-ink-400">{language==='Bangla'?weekdaysBn[index]:day}</span>)}
      </div>
      {Array.from({ length: cells.length / 7 }, (_, week) => (
        <div role="row" key={week} className="grid grid-cols-7 gap-0.5">
          {cells.slice(week * 7, week * 7 + 7).map((day, index) => {
        if (!day) return <span key={'blank-' + index} aria-hidden="true" />;
        const start = selected.from === day, end = selected.to === day;
        const between = Boolean(selected.from && selected.to && day > selected.from && day < selected.to);
        return <button type="button" key={day} role="gridcell"
          aria-label={datePickerDayLabel(language,day)} aria-selected={start || end || between} aria-current={day === today ? 'date' : undefined}
          data-calendar-date={day}
          onClick={() => choose(day)}
          onKeyDown={(event) => {
            const movement: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
            if (!(event.key in movement)) return;
            event.preventDefault();
            focusDay(addDays(day, movement[event.key]));
          }}
          className={'h-8 rounded-md text-[12px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-teal-500 ' +
            (start || end ? 'bg-primary font-semibold text-primary-foreground' : between ? 'bg-teal-50 text-teal-700'
              : 'text-ink hover:bg-ink-50') +
            (day === today && !start && !end ? ' ring-1 ring-teal-500' : '')}
        >{Number(day.slice(-2))}</button>;
          })}
        </div>
      ))}
    </div>
  </div>;
}

/** Compact, themed shadcn-style calendar/popover. Only Apply commits a draft range. */
export function AppDateRangePicker({ value, onChange, label = 'Date range', className = '', single = false }: Props) {
  const {language}=useUiCopy();
  const t=(en:string,bn:string)=>datePickerWord(language,en,bn);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<IsoRange>(value);
  const [first, setFirst] = useState(isoDay(utcDate(value.from || businessToday()).getUTCFullYear(), utcDate(value.from || businessToday()).getUTCMonth(), 1));
  const [position, setPosition] = useState<{ top: number; left: number; width: number; maxHeight: number } | null>(null);
  const anchor = useRef<HTMLButtonElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  const id = useId().replace(/:/g, '');
  const today = businessToday();

  const close = () => { setOpen(false); anchor.current?.focus(); };
  const show = () => {
    const date = utcDate(value.from || today);
    setDraft(value);
    setFirst(isoDay(date.getUTCFullYear(), date.getUTCMonth(), 1));
    setOpen(true);
  };
  const choose = (day: string) => setDraft((current) => {
    if (single) return { from: day, to: day };
    if (!current.from || current.to) return { from: day, to: '' };
    return day < current.from ? { from: day, to: current.from } : { from: current.from, to: day };
  });
  const commit = (next: IsoRange) => { onChange(next); close(); };
  const focusDay = (day: string) => {
    if (day.slice(0, 7) !== first.slice(0, 7) && day.slice(0, 7) !== addMonths(first, 1).slice(0, 7)) {
      setFirst(isoDay(utcDate(day).getUTCFullYear(), utcDate(day).getUTCMonth(), 1));
      requestAnimationFrame(() => popup.current?.querySelector<HTMLButtonElement>(`[data-calendar-date="${day}"]`)?.focus());
    } else popup.current?.querySelector<HTMLButtonElement>(`[data-calendar-date="${day}"]`)?.focus();
  };
  useLayoutEffect(() => {
    if (!open) { setPosition(null); return; }
    const place = () => {
      const rect = anchor.current?.getBoundingClientRect();
      if (!rect) return;
      const width = Math.min(single ? 350 : 655, window.innerWidth - 16);
      const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
      const below = window.innerHeight - rect.bottom - 8, above = rect.top - 8;
      const openAbove = below < 340 && above > below;
      // Measure the side actually chosen. Using max(below,above) while opening
      // below could put the calendar's footer outside the viewport on phones.
      const space = Math.max(0, openAbove ? above : below);
      const height = Math.min(480, Math.max(120, space - 4), window.innerHeight - 16);
      const top = openAbove ? Math.max(8, rect.top - height - 4)
        : Math.max(8, Math.min(rect.bottom + 4, window.innerHeight - height - 8));
      setPosition({ left, top, width, maxHeight: height });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => { window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true); };
  }, [open, single]);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!anchor.current?.contains(event.target as Node) && !popup.current?.contains(event.target as Node)) close();
    };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.preventDefault(); close(); } };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, [open]);
  const shownDate = single ? (value.from ? datePickerDayLabel(language,value.from) : t('Select date','তারিখ বাছুন')) : datePickerRangeLabel(language,value);
  return <div className={'min-w-0 ' + className}>
    <button ref={anchor} type="button" data-hisabiq-select="" aria-label={label + ': ' + shownDate} aria-haspopup="dialog" aria-expanded={open}
      aria-controls={open ? id : undefined} onClick={() => open ? close() : show()}
      className="flex h-9 w-full min-w-0 items-center gap-2 rounded-md border border-input bg-card px-3 text-left text-[12px] text-ink shadow-xs outline-none hover:bg-ink-50/40 focus-visible:ring-2 focus-visible:ring-teal-500/20">
      <CalendarDays className="size-4 shrink-0 text-teal-600" aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate">{shownDate}</span>
    </button>
    {open && typeof document !== 'undefined' && createPortal(
      <div ref={popup} id={id} role="dialog" aria-label={label + t(' calendar',' ক্যালেন্ডার')}
        className="fixed z-[155] overflow-y-auto rounded-xl border border-border bg-popover p-3 text-ink shadow-xl scrollbar-thin"
        style={{ top: position?.top ?? 0, left: position?.left ?? 0, width: position?.width ?? 350,
          maxHeight: position?.maxHeight ?? 480, visibility: position ? 'visible' : 'hidden' }}
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="text-[13px] font-semibold">{single ? t('Select date','তারিখ বাছুন') : t('Select date range','তারিখের সময় বাছুন')}</span>
          <div className="flex gap-1">
            <button type="button" aria-label={t('Previous month','আগের মাস')} onClick={() => setFirst(addMonths(first, -1))}
              className="rounded-md p-1.5 text-ink-500 hover:bg-ink-50"><ChevronLeft className="size-4" /></button>
            <button type="button" aria-label={t('Next month','পরের মাস')} onClick={() => setFirst(addMonths(first, 1))}
              className="rounded-md p-1.5 text-ink-500 hover:bg-ink-50"><ChevronRight className="size-4" /></button>
          </div>
        </div>
        <div className="flex gap-3">
          <Month first={first} selected={draft} choose={choose} today={today} focusDay={focusDay} language={language} />
          {!single && <div className="hidden flex-1 sm:block">
            <Month first={addMonths(first, 1)} selected={draft} choose={choose} today={today} focusDay={focusDay} language={language} />
          </div>}
        </div>
        {!single && <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border pt-3">
          {presets.map((preset) => <button key={preset} type="button" onClick={() => {
            const range = datePreset(preset, today);
            setDraft(range);
            const date = utcDate(range.from);
            setFirst(isoDay(date.getUTCFullYear(), date.getUTCMonth(), 1));
          }} className="rounded-md border border-border bg-card px-2 py-1.5 text-[11px] text-ink-600 hover:bg-teal-50 hover:text-teal-700" >{language==='Bangla'?datePresetBn[preset]:preset}</button>)}
        </div>}
        <div className="sticky bottom-0 z-10 -mx-3 -mb-3 mt-3 flex items-center justify-between border-t border-border bg-popover px-3 pb-3 pt-3">
          <button type="button" onClick={() => commit(empty)}
            className="inline-flex items-center gap-1 text-[12px] text-ink-500 hover:text-ink"><X className="size-3" /> {t('Clear','মুছুন')}</button>
          <div className="flex gap-2">
            <button type="button" onClick={close} className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-ink-50">{t('Cancel','বাতিল')}</button>
            <button type="button" onClick={() => commit(draft)} disabled={!draft.from || !draft.to}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-40">{t('Apply','প্রয়োগ করুন')}</button>
          </div>
        </div>
      </div>, anchor.current?.closest("dialog") ?? document.body)}
  </div>;
}

export function AppDatePicker({ value, onChange, label = 'Date', className = '' }: {
  value: string; onChange: (date: string) => void; label?: string; className?: string;
}) {
  return <AppDateRangePicker single label={label} className={className}
    value={{ from: value, to: value }} onChange={(range) => onChange(range.from)} />;
}
