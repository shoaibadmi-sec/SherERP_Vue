import type { TransactionSource } from '../types/transactions.ts';
import type { AuditSourceRecord } from '../types/audit';
type PermissionSource = TransactionSource | AuditSourceRecord['source'];

export type PermissionGroup = 'sales' | 'purchases' | 'expenses' | 'finance' | 'accounts' | 'products';
export type SourceAction = 'view' | 'edit' | 'delete';
export type DaybookAction = 'open' | 'edit' | 'delete';
export type AuditAction = 'view' | 'correct' | 'delete';

export function sourcePermissionGroup(source: PermissionSource): PermissionGroup {
  if (source === 'sale' || source === 'sale-return' || source === 'customer-payment') return 'sales';
  if (source === 'purchase' || source === 'purchase-return' || source === 'supplier-payment') return 'purchases';
  if (source === 'expense') return 'expenses';
  if (source === 'finance' || source === 'transfer' || source === 'cheque') return 'finance';
  if (source === 'stock-adjustment') return 'products';
  return 'accounts';
}

function has(granted: ReadonlySet<string>, permission: string) {
  return granted.has(permission);
}

function sourcePermission(source: PermissionSource, action: SourceAction) {
  return sourcePermissionGroup(source) + '.' + action;
}

export function canDaybookAction(action: DaybookAction, source: TransactionSource, granted: ReadonlySet<string>) {
  if (!has(granted, 'daybook.view')) return false;
  if (action === 'open') return has(granted, sourcePermission(source, 'view'));
  if (action === 'edit') return has(granted, sourcePermission(source, 'edit'));
  return has(granted, sourcePermission(source, 'delete'));
}

export function canAuditAction(action: AuditAction, source: PermissionSource, granted: ReadonlySet<string>) {
  if (!has(granted, 'audit.view')) return false;
  if (action === 'view') return true;
  if (action === 'correct') return has(granted, 'audit.correct') && has(granted, sourcePermission(source, 'edit'));
  return has(granted, 'audit.delete') && has(granted, sourcePermission(source, 'delete'));
}

export const demoPermissions: ReadonlySet<string> = new Set([
  'daybook.view',
  'audit.view',
  'audit.correct',
  'audit.delete',
  'sales.view', 'sales.edit', 'sales.delete',
  'purchases.view', 'purchases.edit', 'purchases.delete',
  'expenses.view', 'expenses.edit', 'expenses.delete',
  'finance.view', 'finance.edit', 'finance.delete',
  'accounts.view', 'accounts.edit', 'accounts.delete',
  'products.view', 'products.edit', 'products.delete'
]);


export function daybookActionAvailability(source: TransactionSource, granted: ReadonlySet<string>) {
  return {
    open: canDaybookAction('open', source, granted),
    edit: canDaybookAction('edit', source, granted),
    delete: canDaybookAction('delete', source, granted)
  };
}

export function auditActionAvailability(source: PermissionSource, granted: ReadonlySet<string>) {
  return {
    view: canAuditAction('view', source, granted),
    correct: canAuditAction('correct', source, granted),
    delete: canAuditAction('delete', source, granted)
  };
}
