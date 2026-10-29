import {
  ArrowDownLeft, ArrowUpRight, Banknote, HandCoins, Landmark, PiggyBank, Wallet,
  type LucideIcon
} from 'lucide-react';
import type { FinanceTransactionType } from '../../data/financeAccounts';
import type { PartyRole } from '../../types/erp';

/** Magic Patterns Party-action vocabulary, mapped to the EXISTING accounting workflows.
 * Do not replace transaction posting logic with UI-only handlers.
 */
export type FinanceActionSpec = {
  id: string;
  label: string;
  bangla: string;
  Icon: LucideIcon;
  financeType: FinanceTransactionType;
};
const financeActions: Record<'Owner'|'Lender'|'Borrower', readonly [FinanceActionSpec, FinanceActionSpec]> = {
  Owner: [
    {id:'add-capital',label:'Add capital',bangla:'মূলধন যোগ',Icon:PiggyBank,financeType:'Owner Credit'},
    {id:'owner-drawing',label:'Owner drawing',bangla:'মালিকের উত্তোলন',Icon:Wallet,financeType:'Owner Debit'}
  ],
  Lender: [
    {id:'repay-loan',label:'Repay loan',bangla:'ঋণ পরিশোধ',Icon:Landmark,financeType:'Lender Debit'},
    {id:'loan-received',label:'Loan received',bangla:'ঋণ গ্রহণ',Icon:ArrowDownLeft,financeType:'Lender Credit'}
  ],
  Borrower: [
    {id:'collect-repayment',label:'Collect repayment',bangla:'ঋণ আদায়',Icon:HandCoins,financeType:'Borrower Credit'},
    {id:'lend-money',label:'Lend money',bangla:'ঋণ প্রদান',Icon:ArrowUpRight,financeType:'Borrower Debit'}
  ]
};

export function partyFinanceActions(role: PartyRole): readonly [FinanceActionSpec, FinanceActionSpec] | null {
  if(role==='Owner'||role==='Lender'||role==='Borrower')return financeActions[role];
  return null;
}

/** Distinct business-language icon for each trading relationship. */
export const partyTradingActionIcons: Record<'Customer'|'Supplier'|'Vendor'|'Payee',LucideIcon> = {
  Customer: HandCoins,
  Supplier: Banknote,
  Vendor: Banknote,
  Payee: Banknote
};
