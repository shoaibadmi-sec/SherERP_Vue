import {forwardRef,useRef,type InputHTMLAttributes} from 'react';
import {X} from 'lucide-react';
import {Input as DesignInput} from '../_designSystem/ds-6551b66a-cfd3-4df9-a9b1-9ead8d7fe7e9';
import {NumericInput} from './NumericInput';

export type InputProps=InputHTMLAttributes<HTMLInputElement>&{
 /** Explicitly show a quick-clear button for a controlled text input. */
 clearable?:boolean;
 /** Override standard onChange-based clearing when multiple related fields must reset. */
 onClear?:()=>void;
};
/** Search/find/filter inputs across the ERP have one consistent quick-clear action.
 * Numeric fields retain the NumericInput layout and never receive a clear overlay.
 */
export const Input=forwardRef<HTMLInputElement,InputProps>(function Input({
 clearable,onClear,...props
},ref){
 const internalRef=useRef<HTMLInputElement|null>(null);
 const setRef=(node:HTMLInputElement|null)=>{
  internalRef.current=node;
  if(typeof ref==='function')ref(node);else if(ref)ref.current=node;
 };
 // Mobile numbers and 6-digit authentication codes are identifiers, not quantities.
 const numeric=props.type==='number'||(props.type!=='tel'&&props.type!=='password'&&(props.inputMode==='decimal'||props.inputMode==='numeric'));
 if(numeric)return <NumericInput {...props} ref={setRef}/>;
 // The exported design-system Input starts at 32px, but ERP selects, numeric
 // editors and date controls default to 36px. Match that baseline unless a
 // caller explicitly chose a compact/large height (cart rows, POS, dialogs).
 const suppliedClass=props.className??'';
 const alignedClass=/(?:^|\s)!?h-\S+/.test(suppliedClass)
  ? suppliedClass
  : ('h-9 '+suppliedClass).trim();
 const value=props.value;
 const searchLike=props.type==='search'||/(?:\b(?:search|find|filter|lookup)\b|খুঁজ|খোঁজ|অনুসন্ধান|সার্চ|ফিল্টার)/i.test(
  [props['aria-label'],props.placeholder,props.name,props.id].filter(Boolean).join(' '));
 const supportsClear=(clearable??searchLike)&&
  !props.disabled&&!props.readOnly&&(!!onClear||!!props.onChange);
 // Preserve a stable input node while typing or clearing, so focus never jumps.
 if(!supportsClear)return <DesignInput {...props} data-hisabiq-input="" className={alignedClass} ref={setRef}/>;
 const canClear=typeof value==='string'&&value.length>0;
 const clear=()=>{
  const input=internalRef.current;
  if(onClear)onClear();
  else if(input){
   // Use the native value setter so React's controlled input tracker
   // observes the input event and invokes the original onChange handler.
   const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')?.set;
   setter?.call(input,'');
   input.dispatchEvent(new Event('input',{bubbles:true}));
  }
  input?.focus();
 };
 return <span className="relative block min-w-0 flex-1">
  <DesignInput {...props} data-hisabiq-input="" ref={setRef}
   className={alignedClass+' pr-10 [&::-webkit-search-cancel-button]:hidden'}/>
  {canClear&&<button type="button" aria-label={'Clear '+(props['aria-label']||props.placeholder||'input')}
   title="Clear" onMouseDown={event=>event.preventDefault()} onClick={clear}
   className="absolute right-1.5 top-1/2 z-10 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40">
   <X className="size-4" aria-hidden="true"/>
  </button>}
 </span>;
});
