import { CircleAlert, LoaderCircle, LockKeyhole, PackageSearch, SearchX } from 'lucide-react';
import { Button } from './Button';

export type FeedbackKind = 'empty' | 'no-results' | 'error' | 'permission' | 'loading';
const icons = { empty: PackageSearch, 'no-results': SearchX, error: CircleAlert, permission: LockKeyhole, loading: LoaderCircle };

/** Prepared KISS composition for future screens; callers own the real operation. */
export function FeedbackState({ kind, title, description, action }: {
  kind: FeedbackKind; title: string; description: string;
  action?: { label: string; onClick: () => void };
}) {
  const Icon = icons[kind];
  return <div data-feedback-state={kind} className="rounded-xl border border-border bg-card p-6 text-center" role={kind === 'error' ? 'alert' : kind === 'loading' ? 'status' : undefined} aria-busy={kind === 'loading' || undefined}>
    <Icon className={'mx-auto size-7 ' + (kind === 'error' ? 'text-danger' : 'text-ink-400') + (kind === 'loading' ? ' animate-spin motion-reduce:animate-none' : '')} aria-hidden="true" />
    <p className="mt-3 text-sm font-medium text-ink">{title}</p>
    <p className="mt-1 text-sm leading-6 text-ink-500">{description}</p>
    {action && kind !== 'loading' && <Button variant="outline" className="mt-4" onClick={action.onClick}>{action.label}</Button>}
  </div>;
}
