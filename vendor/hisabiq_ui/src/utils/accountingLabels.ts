import type { AccountingAccount } from '../types/accounting';
import type { TerminologyMode } from '../types/transactions';

export function accountingAccountLabel(account: AccountingAccount, mode: TerminologyMode) {
  if (mode === 'accounting') return account.name;
  if (account.id === 'asset-ar') return 'Customer Due';
  if (account.id === 'liability-ap') return 'Supplier Due';
  if (account.id === 'asset-borrower') return 'Money Given';
  if (account.id === 'liability-loan') return 'Loan Due';
  return account.name;
}
