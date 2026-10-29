import { MOTION_MS, MOTION_EASE } from '../motion/tokens';
import { motion, useReducedMotion } from 'framer-motion';
import {forwardRef,useRef,useEffect,useState,useCallback,type CSSProperties,type InputHTMLAttributes} from 'react';
import {ChevronDown,ChevronUp} from 'lucide-react';
import {Input as DesignInput} from '../_designSystem/ds-6551b66a-cfd3-4df9-a9b1-9ead8d7fe7e9';
import {wholeNumberStep,isZeroNumberText,wheelStepDirection} from '../utils/numericStep';

/** Existing HisabIQ input with focus/hover steppers; all changes use the original React onChange path. */
type NumericProps=InputHTMLAttributes<HTMLInputElement>&{stepperInset?:number;stepperCompact?:boolean};
export const NumericInput=forwardRef<HTMLInputElement,NumericProps>(function NumericInput({className='',onKeyDown,disabled,readOnly,min=0,max,type='text',stepperInset=0,stepperCompact=false,style,...props},forwardedRef){
 const input=useRef<HTMLInputElement|null>(null);
 const editable=!disabled&&!readOnly;
 const layout=(/(?:^|\s)h-/.test(className)?'':'h-9 ')+(/(?:^|\s)(?:w-|flex-1)/.test(className)?'':'w-full ')+className;
 const [inferredLabel,setInferredLabel]=useState('value');
 const [clearedZero,setClearedZero]=useState(false);
 const [showStepper,setShowStepper]=useState(false);
 const reducedMotion=useReducedMotion();
 const fineHover=()=>typeof window!=='undefined'&&window.matchMedia('(hover: hover) and (pointer: fine)').matches;
 const explicitLabel=props['aria-label']??props.title??props.name;
 const label=explicitLabel??inferredLabel;
 useEffect(()=>{if(!explicitLabel)setInferredLabel(input.current?.labels?.[0]?.textContent?.replace(/\s+/g,' ').trim()||'value');},[explicitLabel]);
 const writeValue=useCallback((next:string)=>{
  const node=input.current;if(!node)return;
  // Bypass React's value tracker, then deliver a real bubbling input event.
  // This preserves existing parsers, totals, controlled state and validation.
  const prototype=node.ownerDocument.defaultView?.HTMLInputElement.prototype;
  const setter=prototype&&Object.getOwnPropertyDescriptor(prototype,'value')?.set;
  setter?.call(node,next);node.dispatchEvent(new Event('input',{bubbles:true}));
 },[]);
 const step=useCallback((direction:1|-1)=>{
  const node=input.current;if(!node||!editable)return;
  const next=wholeNumberStep(node.value,direction,min,max);if(next===null||next===node.value)return;
  node.focus();writeValue(next);
 },[editable,min,max,writeValue]);
 useEffect(()=>{
  const node=input.current;if(!node)return;
  const wheel=(event:WheelEvent)=>{
   if(!editable||event.defaultPrevented||node.ownerDocument.activeElement!==node)return;
   const direction=wheelStepDirection(event);if(direction===null)return;
   // A non-passive native listener prevents native number stepping and page scrolling
   // from running alongside the shared, precision-safe whole-unit step.
   event.preventDefault();step(direction);
  };
  node.addEventListener('wheel',wheel,{passive:false});
  return ()=>node.removeEventListener('wheel',wheel);
 },[editable,step]);
 return <span onMouseEnter={()=>{if(editable&&fineHover())setShowStepper(true);}} onMouseLeave={()=>{if(input.current!==document.activeElement)setShowStepper(false);}} style={{...style,'--numeric-inset':stepperInset+'px'} as CSSProperties} data-numeric-input data-hisabiq-numeric="" data-stepper-size={stepperCompact?'compact':'standard'} data-editable={editable?'true':'false'} className={'relative inline-flex min-w-0 items-stretch rounded-md border border-input bg-card text-sm text-ink '+(layout+(className?'':' px-3 py-1')).replace(/\bfocus:/g,'focus-within:')}>
  <DesignInput {...props} value={clearedZero&&props.value!==undefined&&isZeroNumberText(String(props.value))?'':props.value} type={type} min={min} max={max} disabled={disabled} readOnly={readOnly}
   ref={node=>{input.current=node;if(typeof forwardedRef==='function')forwardedRef(node);else if(forwardedRef)forwardedRef.current=node;}}
   className={className.replace(/(?:^|\s)(?:mt|mb|my)-\S+/g, "")+" numeric-input-control !h-full !min-h-0 !w-full !min-w-0 !flex-1 !rounded-none !border-0 !bg-transparent !py-0 !text-inherit !shadow-none !outline-none !ring-0 !ring-offset-0"}
   onFocus={event=>{setShowStepper(editable);props.onFocus?.(event);if(editable&&!event.defaultPrevented&&isZeroNumberText(event.currentTarget.value)){setClearedZero(true);writeValue('');}}}
   onChange={event=>{setClearedZero(event.currentTarget.value==='');props.onChange?.(event);}}
   onBlur={event=>{setClearedZero(false);setShowStepper(fineHover()&&Boolean(input.current?.parentElement?.matches(':hover')));props.onBlur?.(event);}}
   onKeyDown={event=>{onKeyDown?.(event);if(event.defaultPrevented||event.altKey||event.ctrlKey||event.metaKey||event.nativeEvent.isComposing||!editable)return;if(event.key==='ArrowUp'||event.key==='ArrowDown'){event.preventDefault();event.stopPropagation();step(event.key==='ArrowUp'?1:-1);}}}/>
  {editable&&<motion.span data-number-stepper
    initial={false}
    animate={{ opacity: showStepper ? 1 : 0 }}
    transition={{ duration: showStepper && !reducedMotion ? MOTION_MS.stepper / 1000 : 0, ease: MOTION_EASE }}
    className="absolute flex flex-col justify-center" aria-label={'Adjust '+label}>
   <button type="button" tabIndex={-1} aria-label={'Increase '+label} title="Increase by 1" onPointerDown={event=>{event.preventDefault();input.current?.focus();}} onClick={()=>step(1)} className="flex min-h-0 flex-1 items-center justify-center rounded-sm text-ink-500 hover:bg-ink-50 hover:text-ink"><ChevronUp className="size-3"/></button>
   <button type="button" tabIndex={-1} aria-label={'Decrease '+label} title="Decrease by 1" onPointerDown={event=>{event.preventDefault();input.current?.focus();}} onClick={()=>step(-1)} className="flex min-h-0 flex-1 items-center justify-center rounded-sm text-ink-500 hover:bg-ink-50 hover:text-ink"><ChevronDown className="size-3"/></button>
  </motion.span>}
 </span>;
});

