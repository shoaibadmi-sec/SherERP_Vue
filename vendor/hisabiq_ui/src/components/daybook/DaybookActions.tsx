import { Copy, ExternalLink, Eye, MoreHorizontal, Pencil, Printer, Trash2 } from 'lucide-react';
import { FloatingPanel } from '../layout/FloatingPanel';
import type { UnifiedTransaction } from '../../types/transactions';
import { daybookActionAvailability, demoPermissions } from '../../utils/permissions';
import { daybookContextActions } from '../../utils/moduleUiActions';

export function DaybookActions({
  transaction,
  onOpen,
  onEdit,
  onDelete,
  onGoToSource,
  onPrint,
  onDuplicate
}: {
  transaction: UnifiedTransaction;
  onOpen: (transaction: UnifiedTransaction) => void;
  onEdit: (transaction: UnifiedTransaction) => void;
  onDelete: (transaction: UnifiedTransaction) => void;
  onGoToSource: (transaction: UnifiedTransaction) => void;
  onPrint: (transaction: UnifiedTransaction) => void;
  onDuplicate: (transaction: UnifiedTransaction) => void;
}) {
  const availability = daybookActionAvailability(transaction.source, demoPermissions);
  const extra = daybookContextActions(transaction.source);
  const canOpen = availability.open;

  const itemClass = 'flex w-full items-center gap-2 px-3 py-2 text-left text-[12.5px] text-ink-700 hover:bg-ink-50';

  return (
    <FloatingPanel
      label={`Actions for ${transaction.reference}`}
      width={190}
      trigger={({ toggle }) => (
        <button onClick={toggle} className="rounded-md p-1.5 text-ink-400 hover:bg-ink-50 hover:text-ink" aria-label={`Actions for ${transaction.reference}`}>
          <MoreHorizontal className="size-4" />
        </button>
      )}>
      {(close) => (
        <div className="py-1">
          {canOpen && <button className={itemClass} onClick={() => { close(); onOpen(transaction); }}><Eye className="size-3.5" /> Open</button>}
          {availability.edit && transaction.status !== 'Deleted' && <button className={itemClass} onClick={() => { close(); onEdit(transaction); }}><Pencil className="size-3.5" /> Edit</button>}
          {extra.includes('print') && <button className={itemClass} onClick={() => { close(); onPrint(transaction); }}><Printer className="size-3.5" /> Print</button>}
          {extra.includes('duplicate') && transaction.status !== 'Deleted' && <button className={itemClass} onClick={() => { close(); onDuplicate(transaction); }}><Copy className="size-3.5" /> Duplicate</button>}
          {extra.includes('go-source') && canOpen && <button className={itemClass} onClick={() => { close(); onGoToSource(transaction); }}><ExternalLink className="size-3.5" /> Go to source</button>}
          {availability.delete && transaction.status !== 'Deleted' && <button className={`${itemClass} text-danger`} onClick={() => { close(); onDelete(transaction); }}><Trash2 className="size-3.5" /> Review reversal</button>}
        </div>
      )}
    </FloatingPanel>
  );
}
