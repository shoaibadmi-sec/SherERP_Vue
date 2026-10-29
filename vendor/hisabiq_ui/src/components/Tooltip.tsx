import React, {useEffect,useId,useLayoutEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import { Info } from 'lucide-react';

export function Tooltip({
  content,
  label = 'More information',
  align = 'center',
  triggerClassName = '',
  interactive = false
}: {
  content: React.ReactNode;
  label?: string;
  align?: 'start' | 'center' | 'end';
  triggerClassName?: string;
  /** Opt-in help for touch/keyboard users; portals escape clipped tables and panels. */
  interactive?: boolean;
}) {
  const contentId = useId();
  const [open,setOpen]=useState(false);
  const [position,setPosition]=useState<{top:number;left:number}|null>(null);
  const trigger=useRef<HTMLButtonElement>(null),popup=useRef<HTMLSpanElement>(null);
  const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const cancelClose=()=>{if(timer.current)clearTimeout(timer.current);timer.current=null;};
  const show=()=>{cancelClose();setOpen(true);};
  const scheduleClose=()=>{cancelClose();timer.current=setTimeout(()=>setOpen(false),120);};
  useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current);},[]);
  useLayoutEffect(()=>{
    if(!interactive||!open)return;
    const place=()=>{
      const anchor=trigger.current?.getBoundingClientRect(),panel=popup.current;
      if(!anchor||!panel)return;
      const width=panel.offsetWidth,height=panel.offsetHeight;
      const left=Math.max(8,Math.min(anchor.left+(anchor.width-width)/2,window.innerWidth-width-8));
      const below=anchor.bottom+6;
      setPosition({left,top:below+height<=window.innerHeight-8?below:Math.max(8,anchor.top-height-6)});
    };
    place();window.addEventListener('resize',place);window.addEventListener('scroll',place,true);
    return ()=>{window.removeEventListener('resize',place);window.removeEventListener('scroll',place,true);};
  },[interactive,open,content]);
  useEffect(()=>{
    if(!interactive||!open)return;
    const outside=(event:PointerEvent)=>{const node=event.target as Node;if(!trigger.current?.contains(node)&&!popup.current?.contains(node)){cancelClose();setOpen(false);}};
    const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();cancelClose();setOpen(false);}};
    document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape,true);
    return ()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape,true);};
  },[interactive,open]);
  if(interactive)return <span className="inline-flex shrink-0 align-middle">
    <button ref={trigger} type="button" aria-label={label} aria-expanded={open}
      aria-controls={open?contentId:undefined} aria-describedby={open?contentId:undefined}
      onClick={show} onFocus={show} onBlur={scheduleClose}
      onPointerEnter={event=>{if(event.pointerType!=='touch')show();}}
      onPointerLeave={event=>{if(event.pointerType!=='touch')scheduleClose();}}
      className={'inline-flex size-9 items-center justify-center rounded-md text-ink-500 outline-none hover:bg-ink-50 hover:text-ink focus-visible:ring-2 focus-visible:ring-ring '+triggerClassName}>
      <Info className="size-3.5" aria-hidden="true"/>
    </button>
    {open&&typeof document!=='undefined'&&createPortal(<span ref={popup} id={contentId} role="tooltip"
      onPointerEnter={cancelClose} onPointerLeave={scheduleClose}
      className="fixed z-[220] w-72 max-w-[calc(100vw-16px)] overflow-y-auto rounded-lg border border-border bg-popover px-3 py-2.5 text-left text-xs font-normal leading-relaxed text-popover-foreground shadow-pop"
      style={{top:position?.top??0,left:position?.left??8,maxHeight:'calc(100vh - 16px)',visibility:position?'visible':'hidden'}}>{content}</span>,document.body)}
  </span>;
  const alignClass = align === 'start' ? 'left-0' : align === 'end' ? 'right-0' : 'left-1/2 -translate-x-1/2';
  return (
    <span className="group relative inline-flex align-middle">
      <button
        type="button"
        aria-label={label}
        aria-describedby={contentId}
        className={`inline-flex size-4 items-center justify-center rounded text-helper outline-none hover:text-ink-500 focus-visible:ring-2 focus-visible:ring-teal-500/30 ${triggerClassName}`}>
        <Info className="size-3.5" />
      </button>
      <span
        id={contentId}
        role="tooltip"
        className={`pointer-events-none absolute top-full z-[130] mt-1.5 hidden w-64 max-w-[calc(100vw-2rem)] rounded-lg border border-border bg-inverse px-2.5 py-2 text-left text-[11px] font-normal leading-relaxed text-white shadow-pop group-hover:block group-focus-within:block ${alignClass}`}>
        {content}
      </span>
    </span>
  );
}
