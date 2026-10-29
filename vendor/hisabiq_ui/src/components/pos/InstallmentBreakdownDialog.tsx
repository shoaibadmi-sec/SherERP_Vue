import {useEffect,useMemo,useState} from 'react';
import {Plus,RotateCcw,Scale,Trash2} from 'lucide-react';
import {Button} from '../Button';
import {NumericInput} from '../NumericInput';
import {AppDateRangePicker} from '../AppDateRangePicker';
import {Dialog,DialogContent,DialogDescription,DialogFooter,DialogHeader,DialogTitle} from '../Dialog';
import {Table,TableBody,TableCell,TableHead,TableHeader,TableRow} from '../Table';
import {useUiCopy} from '../../i18n/useUiCopy';
import {taka} from '../../utils/currency';
import {takaInputToPaisa} from '../../installments/pricing';
import {
  generateInstallmentSchedule,rebalanceUneditedInstallments,
  scheduleDifferencePaisa,validateScheduleRows,type InstallmentScheduleRow
} from '../../installments/schedule';

type Props={
  open:boolean;
  onClose:()=>void;
  rows:readonly InstallmentScheduleRow[];
  onApply:(next:InstallmentScheduleRow[])=>void;
  requiredRemainingPaisa:number;
};
const amountText=(paisa:number)=>String(paisa/100);
const asText=(rows:readonly InstallmentScheduleRow[])=>
  Object.fromEntries(rows.map(row=>[row.id,amountText(row.amountPaisa)]));

/** Compact, editable extension of POS V2. Applying is atomic; Cancel never mutates parent state. */
export function InstallmentBreakdownDialog({open,onClose,rows,onApply,requiredRemainingPaisa}:Props){
  const {text}=useUiCopy();
  const [draft,setDraft]=useState<InstallmentScheduleRow[]>([]);
  const [amountTexts,setAmountTexts]=useState<Record<string,string>>({});
  const [message,setMessage]=useState('');
  useEffect(()=>{
    if(!open)return;
    const copy=rows.map(row=>({...row}));
    setDraft(copy);setAmountTexts(asText(copy));setMessage('');
  },[open,rows]);
  const invalidAmounts=useMemo(()=>draft.some(row=>{
    try{return takaInputToPaisa(amountTexts[row.id]??'')<=0;}catch{return true;}
  }),[draft,amountTexts]);
  const errors=useMemo(()=>validateScheduleRows(draft),[draft]);
  const difference=useMemo(()=>{
    try{return scheduleDifferencePaisa(draft,requiredRemainingPaisa);}catch{return NaN;}
  },[draft,requiredRemainingPaisa]);
  const canSave=!invalidAmounts&&!errors.length&&difference===0;
  const allocated=Number.isFinite(difference)?(requiredRemainingPaisa+difference)/100:0;
  const update=(id:string,patch:Partial<InstallmentScheduleRow>)=>
    setDraft(previous=>previous.map(row=>row.id===id?{...row,...patch}:row));
  const editAmount=(id:string,value:string)=>{
    setAmountTexts(previous=>({...previous,[id]:value}));
    let parsed=0;
    try{parsed=takaInputToPaisa(value);}catch{/* Show invalid amount inline. */}
    update(id,{amountPaisa:parsed,editedAmount:true});
    setMessage('');
  };
  const applyRows=(next:InstallmentScheduleRow[])=>{
    setDraft(next);
    setAmountTexts(asText(next));
    setMessage('');
  };
  const rebalance=()=>{
    try{
      if(invalidAmounts)throw new Error('Correct invalid installment amounts first.');
      applyRows(rebalanceUneditedInstallments(draft,requiredRemainingPaisa));
    }catch(error){setMessage(error instanceof Error?error.message:'Unable to rebalance installments.');}
  };
  const equally=()=>{
    if(!draft.length||requiredRemainingPaisa<draft.length){setMessage('Choose fewer installments.');return;}
    const each=Math.floor(requiredRemainingPaisa/draft.length);
    applyRows(draft.map((row,index)=>({...row,amountPaisa:each+(index===draft.length-1?requiredRemainingPaisa-each*draft.length:0),editedAmount:false})));
  };
  const reset=()=>{
    if(!draft.length)return;
    try{applyRows(generateInstallmentSchedule({remainingPaisa:requiredRemainingPaisa,count:draft.length,firstDueDate:draft[0].dueDate,frequency:'Monthly'}));}
    catch(error){setMessage(error instanceof Error?error.message:'Unable to reset schedule.');}
  };
  const add=()=>{
    if(!draft.length||draft.length>=120){setMessage('At least one and at most 120 installments are supported.');return;}
    try{
      const dates=generateInstallmentSchedule({remainingPaisa:(draft.length+1)*100,count:draft.length+1,firstDueDate:draft[0].dueDate,frequency:'Monthly'});
      const max=Math.max(...draft.map(row=>Number(row.id.match(/\d+$/)?.[0]??0)));
      const row={...dates[dates.length-1],id:'inst-'+(max+1),amountPaisa:100};
      applyRows([...draft,row]);
    }catch(error){setMessage(error instanceof Error?error.message:'Unable to add installment.');}
  };
  const remove=(id:string)=>{
    if(draft.length<=1)return;
    applyRows(draft.filter(row=>row.id!==id));
  };
  const save=()=>{if(!canSave)return;onApply(draft.map(row=>({...row})));onClose();};
  return <Dialog open={open} onOpenChange={isOpen=>{if(!isOpen)onClose();}}>
    <DialogContent className="max-h-[92dvh] w-[calc(100vw-1rem)] overflow-y-auto sm:max-w-3xl scrollbar-thin">
      <DialogHeader>
        <DialogTitle>{text('Installment breakdown','কিস্তির বিস্তারিত')}</DialogTitle>
        <DialogDescription>{text('Edit any due date or amount. The total must match the remaining balance.','প্রতিটি কিস্তির তারিখ ও টাকা বদলাতে পারবেন। মোট বাকি টাকার সঙ্গে মিলতে হবে।')}</DialogDescription>
      </DialogHeader>
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-medium text-ink-500">{text('Remaining to schedule','কিস্তিতে বাকি')} · <span className="text-sm font-semibold text-ink">{taka(requiredRemainingPaisa/100)}</span></span>
          <div className="flex flex-wrap gap-1.5">
            <Button size="sm" variant="outline" onClick={equally}><Scale className="size-3.5"/>{text('Equal amounts','সমান ভাগ')}</Button>
            <Button size="sm" variant="outline" onClick={rebalance}>{text('Rebalance','বাকি মেলান')}</Button>
            <Button size="sm" variant="outline" onClick={reset}><RotateCcw className="size-3.5"/>{text('Reset','রিসেট')}</Button>
          </div>
        </div>
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table scrollRegionLabel={text('Editable installment schedule','সম্পাদনাযোগ্য কিস্তির তালিকা')}>
            <TableHeader><TableRow>
              <TableHead className="w-9">#</TableHead>
              <TableHead>{text('Due date','তারিখ')}</TableHead>
              <TableHead className="min-w-[125px] text-right">{text('Amount (৳)','টাকা')}</TableHead>
              <TableHead className="w-9"><span className="sr-only">{text('Remove','মুছুন')}</span></TableHead>
            </TableRow></TableHeader>
            <TableBody>{draft.map((row,index)=><TableRow key={row.id}>
              <TableCell className="text-xs text-ink-500">{index+1}</TableCell>
              <TableCell className="min-w-[150px] py-1.5">
                <AppDateRangePicker single label={text('Due date '+(index+1),'কিস্তি '+(index+1)+' এর তারিখ')}
                  value={{from:row.dueDate,to:row.dueDate}}
                  onChange={range=>update(row.id,{dueDate:range.from,editedDate:true})}/>
              </TableCell>
              <TableCell className="py-1.5">
                <NumericInput aria-label={text('Installment '+(index+1)+' amount','কিস্তি '+(index+1)+' টাকা')}
                  inputMode="decimal" value={amountTexts[row.id]??''}
                  onChange={event=>editAmount(row.id,event.target.value)}
                  className="h-9 w-full min-w-[110px] text-right"/>
              </TableCell>
              <TableCell className="py-1.5">
                <button type="button" disabled={draft.length<=1} onClick={()=>remove(row.id)}
                  className="flex size-8 items-center justify-center rounded-md text-ink-400 hover:bg-danger-bg hover:text-danger disabled:opacity-30"
                  aria-label={text('Remove installment '+(index+1),'কিস্তি '+(index+1)+' সরান')}><Trash2 className="size-4"/></button>
              </TableCell>
            </TableRow>)}</TableBody>
          </Table>
        </div>
        <button type="button" onClick={add} className="flex h-9 w-full items-center justify-center gap-2 rounded-md border border-dashed border-border text-xs font-medium text-teal-700 hover:bg-teal-50">
          <Plus className="size-3.5"/>{text('Add installment','কিস্তি যোগ করুন')}
        </button>
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-ink-50 p-3 text-sm">
          <span>{text('Scheduled total','কিস্তির মোট')} <strong>{taka(allocated)}</strong></span>
          <span className={canSave?'font-medium text-success':'font-medium text-danger'}>
            {canSave?text('Schedule balanced','মোট মিলে গেছে'):text('Difference','অমিল')+' '+(Number.isFinite(difference)?taka(Math.abs(difference)/100):'—')}
          </span>
        </div>
        {(message||errors.length>0||invalidAmounts)&&<p role="alert" className="text-xs text-danger">
          {message||errors[0]||(invalidAmounts?text('Enter a valid positive installment amount.','সঠিক কিস্তির টাকা দিন।'):'')}
        </p>}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>{text('Cancel','বাতিল')}</Button>
        <Button disabled={!canSave} onClick={save}>{text('Apply breakdown','কিস্তি সংরক্ষণ')}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}
