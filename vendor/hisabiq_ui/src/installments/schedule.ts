/** A dated commitment, tracked in integer paisa; edits do not silently overwrite user input. */
export type InstallmentScheduleRow={id:string;dueDate:string;amountPaisa:number;editedAmount:boolean;editedDate:boolean};
export type ScheduleInput={remainingPaisa:number;count:number;firstDueDate:string;frequency:'Monthly'|'Weekly'};

function paisa(value:number,name:string):number {
  if(!Number.isSafeInteger(value)||value<0)throw new Error(name+' must be nonnegative whole paisa.');
  return value;
}
function dateParts(date:string):{year:number;month:number;day:number}{
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw new Error('Due date must be YYYY-MM-DD.');
  const [year,month,day]=date.split('-').map(Number);
  const d=new Date(Date.UTC(year,month-1,day));
  if(d.getUTCFullYear()!==year||d.getUTCMonth()!==month-1||d.getUTCDate()!==day)
    throw new Error('Choose a valid due date.');
  return {year,month,day};
}
function iso(year:number,month:number,day:number):string {
  return new Date(Date.UTC(year,month-1,day)).toISOString().slice(0,10);
}
function addMonthAnchor(first:{year:number;month:number;day:number},monthOffset:number):string {
  const firstOfMonth=new Date(Date.UTC(first.year,first.month-1+monthOffset,1));
  const year=firstOfMonth.getUTCFullYear(), month=firstOfMonth.getUTCMonth()+1;
  const daysInMonth=new Date(Date.UTC(year,month,0)).getUTCDate();
  return iso(year,month,Math.min(first.day,daysInMonth));
}
function addWeeks(first:{year:number;month:number;day:number},weeks:number):string {
  return iso(first.year,first.month,first.day+7*weeks);
}
function allocateEqual(amount:number,count:number):number[]{
  if(count<1||!Number.isSafeInteger(count))throw new Error('Installment count must be positive.');
  if(amount>0&&amount<count)throw new Error('Too many installments for the remaining amount.');
  const each=Math.floor(amount/count);
  const amounts=Array.from({length:count},()=>each);
  amounts[count-1]+=amount-each*count;
  return amounts;
}

export function generateInstallmentSchedule(input:ScheduleInput):InstallmentScheduleRow[]{
  paisa(input.remainingPaisa,'Remaining balance');
  if(!Number.isSafeInteger(input.count)||input.count<1||input.count>120)throw new Error('Installment count must be between 1 and 120.');
  if(input.frequency!=='Monthly'&&input.frequency!=='Weekly')throw new Error('Unsupported installment frequency.');
  const date=dateParts(input.firstDueDate);
  const amounts=allocateEqual(input.remainingPaisa,input.count);
  const rows=amounts.map((amountPaisa,index)=>({
    id:'inst-'+String(index+1),
    dueDate:input.frequency==='Monthly'?addMonthAnchor(date,index):addWeeks(date,index),
    amountPaisa,editedAmount:false,editedDate:false
  }));
  const errors=validateScheduleRows(rows);
  if(errors.length)throw new Error(errors.join(' '));
  return rows;
}

export function validateScheduleRows(rows:readonly InstallmentScheduleRow[]):string[]{
  const problems:string[]=[];
  if(!rows.length)problems.push('At least one installment is required.');
  const ids=new Set<string>(),dates=new Set<string>();
  for(let i=0;i<rows.length;i++){
    const row=rows[i];
    if(ids.has(row.id)||!row.id.trim())problems.push('Duplicate installment row.');
    ids.add(row.id);
    if(!Number.isSafeInteger(row.amountPaisa)||row.amountPaisa<=0)
      problems.push('Installment '+(i+1)+' amount must be positive whole paisa.');
    try{dateParts(row.dueDate);}catch{problems.push('Installment '+(i+1)+' has an invalid due date.');}
    if(dates.has(row.dueDate)||(i>0&&row.dueDate<=rows[i-1].dueDate))
      problems.push('Due dates must follow strictly increasing sequence.');
    dates.add(row.dueDate);
  }
  return problems;
}

export function scheduleDifferencePaisa(rows:readonly InstallmentScheduleRow[], requiredRemainingPaisa:number):number {
  paisa(requiredRemainingPaisa,'Remaining balance');
  const sum=rows.reduce((n,row)=>n+row.amountPaisa,0);
  if(!Number.isSafeInteger(sum))throw new Error('Scheduled total exceeds supported amount range.');
  return sum-requiredRemainingPaisa;
}

export function rebalanceUneditedInstallments(rows:readonly InstallmentScheduleRow[],requiredRemainingPaisa:number):InstallmentScheduleRow[]{
  paisa(requiredRemainingPaisa,'Remaining balance');
  const errors=validateScheduleRows(rows);
  if(errors.length)throw new Error(errors.join(' '));
  const manuallyAllocated=rows.reduce((n,row)=>n+(row.editedAmount?row.amountPaisa:0),0);
  if(manuallyAllocated>requiredRemainingPaisa)throw new Error('Manually edited installment amounts exceed remaining balance.');
  const editable=rows.filter(row=>!row.editedAmount);
  if(!editable.length){
    if(manuallyAllocated!==requiredRemainingPaisa)throw new Error('All installment amounts are manually edited; unlock a row before rebalancing.');
    return rows.map(row=>({...row}));
  }
  const newAmounts=allocateEqual(requiredRemainingPaisa-manuallyAllocated,editable.length);
  let i=0;
  const updated=rows.map(row=>row.editedAmount?{...row}:{...row,amountPaisa:newAmounts[i++]});
  const laterErrors=validateScheduleRows(updated);
  if(laterErrors.length)throw new Error(laterErrors.join(' '));
  return updated;
}
