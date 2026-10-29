import {useState} from 'react';
import {CalendarRange,Pencil} from 'lucide-react';
import {Button} from '../Button';
import {NumericInput} from '../NumericInput';
import {AppDateRangePicker} from '../AppDateRangePicker';
import {taka} from '../../utils/currency';
import {useUiCopy} from '../../i18n/useUiCopy';
import {scheduleDifferencePaisa,type InstallmentScheduleRow} from '../../installments/schedule';

export type InstallmentTerms={
  mode:'Regular'|'Installment';
  onModeChange:(mode:'Regular'|'Installment')=>void;
  count:number;
  onCountChange:(count:number)=>void;
  firstDueDate:string;
  onFirstDueDateChange:(date:string)=>void;
  schedule:readonly InstallmentScheduleRow[];
  onEditSchedule:()=>void;
  onPriceAdjustment?:(mode:'amount'|'percent',value:string)=>boolean;
};

/** Display-only sums; cart sets price and the existing POS payment splits set down payment. */
export function InstallmentTermsPanel({terms,invoiceTotalPaisa,paidPaisa}:{
  terms:InstallmentTerms;invoiceTotalPaisa:number;paidPaisa:number;
}){
  const {text}=useUiCopy();
  const [adjustMode,setAdjustMode]=useState<'amount'|'percent'>('amount');
  const [adjustValue,setAdjustValue]=useState('');
  const remaining=Math.max(0,invoiceTotalPaisa-paidPaisa);
  const difference=terms.schedule.length?scheduleDifferencePaisa(terms.schedule,remaining):remaining;
  const equal=terms.schedule.length>0&&terms.schedule.every(x=>x.amountPaisa===terms.schedule[0].amountPaisa);
  const per=equal?terms.schedule[0].amountPaisa:null;
  return <div className="space-y-2.5 rounded-lg border border-teal-200 bg-teal-50/40 p-3">
    <div className="flex items-center justify-between gap-2">
      <p className="flex items-center gap-1.5 text-[13px] font-semibold text-ink">
        <CalendarRange className="size-4 text-teal-700"/>{text('Installment terms','কিস্তির হিসাব')}
      </p>
      <span className="text-[11px] text-teal-700">{text('Editable','সম্পাদনাযোগ্য')}</span>
    </div>
    <div className="grid grid-cols-2 gap-2">
      <label className="min-w-0 space-y-1 text-[11px] text-ink-500">
        <span>{text('Installments','কিস্তির সংখ্যা')}</span>
        <NumericInput type="number" min={1} max={120} step={1} aria-label={text('Number of installments','কিস্তির সংখ্যা')}
          value={Number.isFinite(terms.count)?terms.count:''} onChange={event=>terms.onCountChange(Number(event.target.value))}
          className="h-9 w-full text-right"/>
      </label>
      <div className="min-w-0 space-y-1">
        <p className="text-[11px] text-ink-500">{text('First due date','প্রথম কিস্তির তারিখ')}</p>
        <AppDateRangePicker single value={{from:terms.firstDueDate,to:terms.firstDueDate}}
          label={text('First installment due date','প্রথম কিস্তির তারিখ')}
          onChange={range=>terms.onFirstDueDateChange(range.from)}/>
      </div>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-teal-200 pt-2 text-[12px]">
      <span className="text-ink-500">{text('Paid today','আজ জমা')} <strong className="text-ink">{taka(paidPaisa/100)}</strong></span>
      <span className="text-ink-500">{text('Future balance','কিস্তিতে বাকি')} <strong className="text-danger">{taka(remaining/100)}</strong></span>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="text-xs text-ink-500">
        {per!==null ? <>{taka(per/100)} × {terms.schedule.length}</> : text('Custom payment amounts','আলাদা কিস্তির টাকা')}
        {difference!==0&&<span role="status" className="ml-1 text-danger">· {text('Schedule needs review','হিসাব মিলান')}</span>}
      </p>
      <Button size="sm" variant="outline" onClick={terms.onEditSchedule}>
        <Pencil className="size-3.5"/>{text('View / Edit','দেখুন / বদলান')}
      </Button>
    </div>
    {terms.onPriceAdjustment && <details className="border-t border-teal-200 pt-2">
      <summary className="cursor-pointer text-[11px] font-medium text-teal-700">
        {text('Advanced price adjustment','দাম বাড়ানো / কমানো')}
      </summary>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <select aria-label={text('Adjustment type','দাম বদলের ধরন')}
          value={adjustMode} onChange={event=>setAdjustMode(event.target.value as 'amount'|'percent')}
          className="h-9 rounded-md border border-input bg-card px-2 text-xs text-ink">
          <option value="amount">৳</option><option value="percent">%</option>
        </select>
        <NumericInput aria-label={text('Price adjustment','দাম পরিবর্তন')} inputMode="decimal" min={-1000000}
          value={adjustValue} onChange={event=>setAdjustValue(event.target.value)}
          placeholder={adjustMode==='amount'?'Amount (+/−)':'Percent (+/−)'}
          className="h-9 w-[112px] flex-1 text-right"/>
        <Button size="sm" variant="outline" disabled={!adjustValue.trim()}
          onClick={()=>{if(terms.onPriceAdjustment?.(adjustMode,adjustValue))setAdjustValue('');}}>
          {text('Apply','প্রয়োগ করুন')}
        </Button>
      </div>
      <p className="mt-1 text-[10.5px] text-ink-500">
        {text('Updates the existing cart price, not the saved product price.','কার্টের দাম বদলাবে, পণ্যের মূল দাম নয়।')}
      </p>
    </details>}
  </div>;
}
