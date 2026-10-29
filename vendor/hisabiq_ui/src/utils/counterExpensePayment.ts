import {financeAccountOptionLabel,type FinanceAccount} from '../data/financeAccounts.ts';
import type {PartyMoneySplit} from '../types/partyLedger';
import type {PaymentSplit} from '../types/erp';

/** Adapt a validated Finance split without guessing the provider from its display name. */
export function counterExpensePayment(split:PartyMoneySplit,accounts:FinanceAccount[]):PaymentSplit{
  const account=accounts.find(item=>item.id===split.accountId);
  if(!account)throw new Error('Expense payment account not found.');
  const provider=account.institution?.trim().toLowerCase();
  const method=split.method==='Mobile Banking'
    ?provider==='bkash'?'bKash':provider==='nagad'?'Nagad':'Mobile Banking'
    :split.method;
  return {...split,method,account:financeAccountOptionLabel(account,accounts)};
}
