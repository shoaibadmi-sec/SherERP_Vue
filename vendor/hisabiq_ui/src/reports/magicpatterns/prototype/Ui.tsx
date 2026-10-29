import type { ComponentProps } from 'react';
import { Button as HisabButton } from '../../../components/Button';
import { MotionTabList, MotionTabIndicator } from '../../../motion/MotionTabList';
import { downloadReport } from '../../../utils/reportOutput';
type Kind='outline'|'ghost'|'default'|'primary';
export function Button({kind='default',...rest}:{kind?:Kind}&ComponentProps<typeof HisabButton>){
 return <HisabButton {...rest} variant={kind==='primary'?'default':kind}/>;
}
export function Tabs({label,items,value,onChange}:{label:string;items:{id:string;label:string;count?:number}[];value:string;onChange:(v:string)=>void}){
 return <MotionTabList aria-label={label} className="flex w-full min-w-0 max-w-full gap-1 overflow-x-auto border-b border-border">
 {items.map((item,i)=><button type="button" key={item.id} role="tab" aria-selected={value===item.id} tabIndex={value===item.id?0:-1}
 onClick={()=>onChange(item.id)} onKeyDown={e=>{if(['ArrowRight','ArrowLeft','Home','End'].includes(e.key)){e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?items.length-1:(i+(e.key==='ArrowRight'?1:-1)+items.length)%items.length;onChange(items[next].id);e.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();}}}
 className={'relative flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap px-3 text-[13px] font-medium '+(value===item.id?'text-primary':'text-ink-500 hover:text-ink')}>
 {item.label}{item.count!==undefined&&<span className="text-[11px] text-ink-500">{item.count}</span>}<MotionTabIndicator active={value===item.id}/>
 </button>)}</MotionTabList>;
}
export function downloadCsv(name:string,rows:(string|number)[][]){downloadReport(name,rows[0].map(String),rows.slice(1));}
