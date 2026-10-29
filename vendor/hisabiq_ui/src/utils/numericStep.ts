/** Exact decimal text ± one whole unit; never introduces floating-point tails. */
export function wholeNumberStep(value:string,direction:1|-1,min:string|number=0,max?:string|number):string|null {
 const text=value.trim()||'0';
 const parsed=/^([+-]?)(\d*)(?:\.(\d*))?$/.exec(text);
 if(!parsed||(!parsed[2]&&!parsed[3])||text.length>1000)return null;
 const decimals=parsed[3]??'';const scale=10n**BigInt(decimals.length);
 const negative=parsed[1]==='-';
 const coefficient=(BigInt(parsed[2]||'0')*scale+BigInt(decimals||'0'))*(negative?-1n:1n)+BigInt(direction)*scale;
 const magnitude=coefficient<0n?-coefficient:coefficient;
 let next=(coefficient<0n?'-':'')+String(magnitude/scale)+(parsed[3]!==undefined?'.'+String(magnitude%scale).padStart(decimals.length,'0'):'');
 if(!decimals.length&&next.endsWith('.0'))next=next.slice(0,-1);
 const amount=Number(next),minimum=Number(min),maximum=max===undefined?undefined:Number(max);
 if(!Number.isFinite(amount))return null;
 if(Number.isFinite(minimum)&&amount<minimum)return String(min);
 if(maximum!==undefined&&Number.isFinite(maximum)&&amount>maximum)return String(max);
 return next;
}

/** Clear only a complete zero, never malformed input or a meaningful decimal. */
export function isZeroNumberText(value:string):boolean {
 return /^[+-]?(?:0+(?:\.0*)?|\.0+)$/.test(value.trim());
}
/** One wheel event is one whole unit; horizontal scrolling and zoom retain native behavior. */
export function wheelStepDirection(event:{deltaY:number;deltaX:number;ctrlKey?:boolean;metaKey?:boolean;altKey?:boolean;shiftKey?:boolean}):1|-1|null {
 if(event.ctrlKey||event.metaKey||event.altKey||event.shiftKey||!Number.isFinite(event.deltaY)||
   event.deltaY===0||Math.abs(event.deltaX)>=Math.abs(event.deltaY))return null;
 return event.deltaY<0?1:-1;
}
