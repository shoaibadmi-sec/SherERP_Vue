import { StatusBadge, type StatusTone } from '../StatusBadge';
import type { PartyRole } from '../../types/erp';
import {useUiCopy} from '../../i18n/useUiCopy';
import {partyRoleLabel} from '../../i18n/partyCopy';

const roleTone: Record<PartyRole, StatusTone> = {
  Customer: 'teal',
  Supplier: 'info',
  Vendor: 'neutral',
  Lender: 'warning',
  Borrower: 'warning',
  Payee: 'neutral',
  Owner: 'ink'
};

export function RoleBadge({ role }: {role: PartyRole;}) {
  const {language}=useUiCopy();
  return (
    <StatusBadge tone={roleTone[role]} className="h-[18px] px-1 text-[10.5px]">
      {partyRoleLabel(role,language)}
    </StatusBadge>);

}