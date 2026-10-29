import {scheduleDifferencePaisa,validateScheduleRows,type InstallmentScheduleRow} from './schedule.ts';

export type InstallmentDraftReview={
  customerId?:string;
  customerName:string;
  phone:string;
  totalPaisa:number;
  downPaymentPaisa:number;
  schedule:readonly InstallmentScheduleRow[];
};

/** No price/customer/payment source mutation: return actionable errors for the POS review gate. */
export function validateInstallmentDraft(input:InstallmentDraftReview):string[]{
  const problems:string[]=[];
  if(!input.customerId?.trim())problems.push('Select or create a saved customer before selling on installments.');
  if(!input.customerName.trim())problems.push('Customer name is required.');
  if(!Number.isSafeInteger(input.totalPaisa)||input.totalPaisa<=0)
    problems.push('Enter a valid positive selling price.');
  if(!Number.isSafeInteger(input.downPaymentPaisa)||input.downPaymentPaisa<0)
    problems.push('Down payment must be a valid nonnegative amount.');
  if(problems.some(x=>x.includes('selling price')||x.includes('Down payment')))return problems;
  if(input.downPaymentPaisa>input.totalPaisa)
    problems.push('Down payment exceeds selling price.');
  if(input.downPaymentPaisa===input.totalPaisa)
    problems.push('No remaining installment balance; use Regular Sale for a fully paid sale.');
  if(input.downPaymentPaisa>=input.totalPaisa)return problems;
  problems.push(...validateScheduleRows(input.schedule));
  if(scheduleDifferencePaisa(input.schedule,input.totalPaisa-input.downPaymentPaisa)!==0)
    problems.push('Scheduled installment total does not match the remaining balance.');
  return problems;
}
