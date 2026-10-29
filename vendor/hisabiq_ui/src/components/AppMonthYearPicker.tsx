import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useUiCopy } from '../i18n/useUiCopy';
import { datePickerMonthLabel } from '../i18n/datePickerCopy';

type Props={
 mode:'month'|'year';
 value:string;
 maxDate:string;
 label:string;
 onChange:(value:string)=>void;
 className?:string;
};
const months=Array.from({length:12},(_,i)=>i);
const pad=(n:number)=>String(n).padStart(2,'0');
const startYearPage=(year:number)=>2000+Math.floor((year-2000)/12)*12;
const monthKey=(year:number,monthIndex:number)=>year+'-'+pad(monthIndex+1);

/** A calendar-popup period selector for audit month and year, independent of native month-input support. */
export function AppMonthYearPicker({mode,value,maxDate,label,onChange,className=''}:Props){
 const {language,text}=useUiCopy();
 const t=(en:string,bn:string)=>text(en,bn);
 const initialYear=Number(value.slice(0,4))||Number(maxDate.slice(0,4));
 const [open,setOpen]=useState(false);
 const [visibleYear,setVisibleYear]=useState(initialYear);
 const [position,setPosition]=useState<{top:number;left:number;width:number;maxHeight:number}|null>(null);
 const anchor=useRef<HTMLButtonElement>(null);
 const popup=useRef<HTMLDivElement>(null);
 const popupId=useId().replace(/:/g,'');
 const maxYear=Number(maxDate.slice(0,4));
 const maxMonth=maxDate.slice(0,7);
 const pageStart=mode==='year'?startYearPage(visibleYear):visibleYear;
 const visibleLabel=mode==='month'&&/^\d{4}-\d{2}$/.test(value)
  ?datePickerMonthLabel(language,value+'-01')
  :mode==='year'&&/^\d{4}$/.test(value)
  ?new Intl.NumberFormat(language==='Bangla'?'bn-BD':'en-GB',{useGrouping:false}).format(Number(value))
  :t('Select period','সময়কাল বাছুন');
 const close=()=>{setOpen(false);anchor.current?.focus();};
 const show=()=>{setVisibleYear(initialYear);setOpen(true);};
 const choose=(selection:string)=>{onChange(selection);close();};
 const previous=()=>setVisibleYear(year=>Math.max(2000,year-(mode==='year'?12:1)));
 const next=()=>setVisibleYear(year=>Math.min(maxYear,year+(mode==='year'?12:1)));
 const canGoPrev=mode==='month'?visibleYear>2000:pageStart>2000;
 const canGoNext=mode==='month'?visibleYear<maxYear:pageStart+12<=maxYear;

 useLayoutEffect(()=>{
  if(!open){setPosition(null);return;}
  const place=()=>{
   const rect=anchor.current?.getBoundingClientRect();
   if(!rect)return;
   const width=Math.min(316,window.innerWidth-16);
   const left=Math.max(8,Math.min(rect.left,window.innerWidth-width-8));
   const below=window.innerHeight-rect.bottom-8,above=rect.top-8;
   const height=Math.min(348,Math.max(120,window.innerHeight-16));
   const abovePreferred=below<height&&above>below;
   const available=abovePreferred?above:below;
   const maxHeight=Math.max(120,Math.min(height,available-4));
   const top=abovePreferred?Math.max(8,rect.top-maxHeight-4):Math.max(8,Math.min(rect.bottom+4,window.innerHeight-maxHeight-8));
   setPosition({top,left,width,maxHeight});
  };
  place();
  window.addEventListener('resize',place);
  window.addEventListener('scroll',place,true);
  return ()=>{window.removeEventListener('resize',place);window.removeEventListener('scroll',place,true);};
 },[open]);

 useEffect(()=>{
  if(!open)return;
  const outside=(event:PointerEvent)=>{
   if(!anchor.current?.contains(event.target as Node)&&!popup.current?.contains(event.target as Node))close();
  };
  const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();close();}};
  document.addEventListener('pointerdown',outside);
  document.addEventListener('keydown',escape);
  return ()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);};
 },[open]);

 const moveFocus=(event:React.KeyboardEvent<HTMLButtonElement>,current:number)=>{
  const offsets:Record<string,number>={ArrowLeft:-1,ArrowRight:1,ArrowUp:-3,ArrowDown:3,Home:-current,End:11-current};
  const offset=offsets[event.key];
  if(offset===undefined)return;
  event.preventDefault();
  const target=Math.max(0,Math.min(11,current+offset));
  popup.current?.querySelectorAll<HTMLButtonElement>('[data-period-option]')[target]?.focus();
 };
 return <div className={'min-w-0 '+className}>
  <button type="button" ref={anchor} aria-label={label} aria-haspopup="dialog" aria-expanded={open}
   aria-controls={open?popupId:undefined}
   onClick={()=>open?close():show()}
   className="flex h-9 w-full min-w-0 items-center gap-2 rounded-md border border-input bg-card px-3 text-left text-[12px] text-ink shadow-xs outline-none hover:bg-ink-50/40 focus-visible:ring-2 focus-visible:ring-teal-500/20">
   <CalendarDays className="size-4 shrink-0 text-teal-600" aria-hidden="true"/>
   <span className="min-w-0 flex-1 truncate">{visibleLabel}</span>
  </button>
  {open&&typeof document!=='undefined'&&createPortal(
   <div ref={popup} id={popupId} role="dialog" aria-label={label+' '+t('calendar','ক্যালেন্ডার')}
    className="fixed z-[155] overflow-y-auto rounded-xl border border-border bg-popover p-3 text-ink shadow-xl scrollbar-thin"
    style={{top:position?.top??0,left:position?.left??0,width:position?.width??316,maxHeight:position?.maxHeight??348,visibility:position?'visible':'hidden'}}>
    <div className="mb-3 flex items-center justify-between gap-2">
     <span className="text-[13px] font-semibold">{mode==='month'?t('Choose month','মাস বাছুন'):t('Choose year','বছর বাছুন')}</span>
     <div className="flex items-center gap-1">
      <button type="button" aria-label={mode==='month'?t('Previous year','আগের বছর'):t('Previous years','আগের বছরগুলো')}
       onClick={previous} disabled={!canGoPrev} className="rounded-md p-1.5 text-ink-500 hover:bg-ink-50 disabled:opacity-40">
       <ChevronLeft className="size-4"/>
      </button>
      <span className="min-w-20 text-center text-[12px] font-semibold text-ink">
       {mode==='month'?visibleYear:pageStart+'–'+(pageStart+11)}
      </span>
      <button type="button" aria-label={mode==='month'?t('Next year','পরের বছর'):t('Next years','পরের বছরগুলো')}
       onClick={next} disabled={!canGoNext} className="rounded-md p-1.5 text-ink-500 hover:bg-ink-50 disabled:opacity-40">
       <ChevronRight className="size-4"/>
      </button>
     </div>
    </div>
    <div role="group" aria-label={mode==='month'?t('Months','মাসগুলো'):t('Years','বছরগুলো')}
     className="grid grid-cols-3 gap-2">
     {months.map((index)=>{
      const year=mode==='month'?visibleYear:pageStart+index;
      const key=monthKey(year,index);
      const optionValue=mode==='month'?key:String(year);
      const disabled=year>maxYear||year<2000||(mode==='month'&&key>maxMonth);
      const monthName=new Intl.DateTimeFormat(language==='Bangla'?'bn-BD-u-ca-gregory':'en-GB',
       {month:'long',timeZone:'UTC'}).format(new Date(Date.UTC(visibleYear,index,1)));
      const selected=value===optionValue;
      return <button type="button" key={optionValue} data-period-option=""
       data-month-value={mode==='month'?optionValue:undefined}
       data-year-value={mode==='year'?optionValue:undefined}
       aria-pressed={selected} disabled={disabled}
       onKeyDown={event=>moveFocus(event,index)}
       onClick={()=>choose(optionValue)}
       className={'h-10 min-w-0 rounded-md border px-1 text-[12px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-35 '+
        (selected?'border-primary bg-primary text-primary-foreground font-semibold':'border-border bg-card text-ink hover:bg-teal-50 hover:text-teal-700')}>
       {mode==='month'?monthName:language==='Bangla'?new Intl.NumberFormat('bn-BD',{useGrouping:false}).format(year):year}
      </button>;
     })}
    </div>
    <div className="mt-3 flex justify-end border-t border-border pt-3">
     <button type="button" className="rounded-md border border-border px-3 py-1.5 text-xs text-ink hover:bg-ink-50" onClick={close}>{t('Close','বন্ধ করুন')}</button>
    </div>
   </div>,document.body)}
 </div>;
}
