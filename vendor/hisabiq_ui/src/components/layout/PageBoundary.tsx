import { Component, Suspense, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '../Button';

class PageErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <section role="alert" className="rounded-xl border border-border bg-card p-4">
          <h1 className="text-lg font-semibold">This page could not open</h1>
          <p className="my-3 text-sm text-ink-500">Check your connection and reload. You can still use the menu to open another page.</p>
          <p lang="bn" className="mb-3 text-sm text-ink-500">সংযোগ পরীক্ষা করে আবার খুলুন। অন্য পেজ খুলতে মেনু ব্যবহার করুন।</p>
          <Button onClick={() => window.location.reload()}>Reload page</Button>
        </section>
      );
    }
    return this.props.children;
  }
}

/** Keep navigation and workspace providers mounted while a page downloads. */
export function PageBoundary({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  return (
    <PageErrorBoundary key={pathname}>
      <Suspense fallback={
        <div role="status" aria-live="polite" aria-busy="true" data-page-loading="true" className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-ink-500">Loading page… <span lang="bn">পেজ খুলছে…</span></p>
          <div aria-hidden="true" className="mt-4 space-y-3">
            <div className="h-6 w-1/3 rounded bg-muted" />
            <div className="h-12 rounded bg-muted" />
            <div className="h-12 rounded bg-muted" />
          </div>
        </div>
      }>{children}</Suspense>
    </PageErrorBoundary>
  );
}
