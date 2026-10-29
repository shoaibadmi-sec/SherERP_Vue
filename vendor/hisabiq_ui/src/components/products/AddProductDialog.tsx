import { useEffect, useMemo, useRef } from 'react';
import { ArrowLeftIcon, ChevronRightIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '../Dialog';
import { Button } from '../Button';
import { AddProductForm } from './form/AddProductForm';
import { DiscardDialog } from './form/DiscardDialog';
import { ErrorSummary } from './form/ErrorSummary';
import { useAddProductForm } from './form/useAddProductForm';
import { useFormCopy } from '../../hooks/useFormCopy';
import { useTenantSettings } from '../../settings/TenantSettingsProvider';
import { availableStockLots } from '../../data/erpDemoStore';
import { initialProductDraft } from '../../utils/productFormInitial';
import type { Product } from '../../types/erp';
import type { OpeningMeta } from '../../types/productForm';

export type ProductOpeningMeta = OpeningMeta;
type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (product: Product, opening?: ProductOpeningMeta) => void;
  initialProduct?: Product | null;
  existingSerials?: string[];
  presentation?: 'page' | 'context';
};

/** Products uses the page; transaction quick-add keeps the same editor over its unchanged parent. */
export function AddProductDialog(props: Props) {
  return props.open ? <ProductEditor key={props.initialProduct?.id ?? 'new'} {...props} /> : null;
}

function ProductEditor({ onOpenChange, onSave, initialProduct, existingSerials = [], presentation = 'context' }: Props) {
  const { t, showHelper } = useFormCopy();
  const { state } = useTenantSettings();
  const initialDraft = useRef(initialProductDraft(state.sections.products, initialProduct));
  const pendingLeave = useRef<(() => void) | null>(null);
  const close = () => {
    const next = pendingLeave.current;
    pendingLeave.current = null;
    onOpenChange(false);
    next?.();
  };
  const knownSerials = useMemo(() => [...new Set([...existingSerials, ...availableStockLots().flatMap((lot) => lot.serials ?? [])])], [existingSerials]);
  const form = useAddProductForm({
    initialDraft: initialDraft.current, isEdit: Boolean(initialProduct), existing: initialProduct ?? undefined,
    existingSerials: knownSerials, onExit: close,
    onSave: ({ product, opening }) => { onSave(product, opening); onOpenChange(false); }
  });
  const live = useRef({ close, form });
  live.current = { close, form };

  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const scroll = window.scrollY;
    const token = `product-${Date.now()}`;
    window.history.pushState({ ...window.history.state, hisabiqProductEditor: token }, '');
    window.scrollTo({ top: 0 });
    const back = () => {
      if (live.current.form.blockLeave.current) {
        window.history.forward();
        live.current.form.setDiscardOpen(true);
      } else live.current.close();
    };
    const unload = (event: BeforeUnloadEvent) => {
      if (!live.current.form.blockLeave.current) return;
      event.preventDefault(); event.returnValue = '';
    };
    const link = (event: MouseEvent) => {
      const anchor = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href]') : null;
      if (!anchor || !live.current.form.blockLeave.current || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || anchor.target === '_blank') return;
      const next = new URL(anchor.href, location.href);
      if (next.href === location.href || next.hash === '#erp-main') return;
      event.preventDefault(); event.stopPropagation();
      pendingLeave.current = () => { live.current.form.blockLeave.current = false; anchor.click(); };
      live.current.form.setDiscardOpen(true);
    };
    window.addEventListener('popstate', back);
    window.addEventListener('beforeunload', unload);
    document.addEventListener('click', link, true);
    return () => {
      window.removeEventListener('popstate', back);
      window.removeEventListener('beforeunload', unload);
      document.removeEventListener('click', link, true);
      if (window.history.state?.hisabiqProductEditor === token) window.history.back();
      requestAnimationFrame(() => { window.scrollTo({ top: scroll }); if (opener?.isConnected) opener.focus({ preventScroll: true }); });
    };
  }, []);

  const title = form.isEdit ? t('Edit product', 'পণ্য সম্পাদনা') : t('Add product', 'নতুন পণ্য');
  const content = (
    <div data-product-editor data-presentation={presentation} className={`product-form mx-auto w-full pb-5 ${presentation === 'page' ? 'max-w-[1440px]' : 'max-w-[920px] md:py-6'}`}>
      <header className={presentation === 'page' ? 'pb-4' : 'px-4 pb-4 pt-3 md:px-0 md:pt-0'}>
        <div className="mb-3 flex items-center gap-1.5 text-[13px] text-ink-500">
          <Button type="button" variant="ghost" onClick={form.requestExit} className="-ml-2 h-9 gap-1 px-2 text-ink-600">
            <ArrowLeftIcon className="size-4" aria-hidden="true" />{t('Back', 'ফিরুন')}
          </Button>
          <span>{t('Products', 'পণ্য')}</span><ChevronRightIcon className="size-3.5" aria-hidden="true" /><span className="text-ink">{title}</span>
        </div>
        <h1 id="pf-title" className="text-[22px] font-semibold tracking-tight text-ink">{title}
          {showHelper && <span className="ml-2 font-bn text-[14px] font-normal text-ink-500">· {form.isEdit ? 'পণ্য সম্পাদনা' : 'নতুন পণ্য'}</span>}
        </h1>
        <p className="mt-1 text-[14px] text-ink-500">{form.isEdit
          ? t('Update details here. Stock quantity changes stay in Adjust stock.', 'এখানে তথ্য বদলান। স্টকের পরিমাণ বদলাতে Adjust stock ব্যবহার করুন।')
          : t('Fill the top part and save. Everything else can wait.', 'উপরের অংশ পূরণ করে সংরক্ষণ করুন। বাকিগুলো পরে দিলেও চলবে।')}</p>
      </header>
      <div className={presentation === 'context' ? 'px-4 md:px-0' : undefined}><ErrorSummary form={form} />
        {form.saveError && <p role="alert" className="mb-4 rounded-lg bg-danger-bg p-3 text-sm text-danger">{form.saveError}</p>}
      </div>
      <AddProductForm form={form} />
      <DiscardDialog open={form.discardOpen} onKeep={() => { pendingLeave.current = null; form.setDiscardOpen(false); }} onDiscard={form.confirmDiscard} />
    </div>
  );
  if (presentation === 'page') return content;
  return <Dialog open onOpenChange={(open) => { if (!open) form.requestExit(); }}>
    <DialogContent showCloseButton={false} aria-label={title}
      className="!fixed !inset-0 !block !h-[100dvh] !max-h-none !w-screen !max-w-none !translate-x-0 !translate-y-0 overflow-y-auto !rounded-none !border-0 bg-background !p-0">
      <DialogTitle className="sr-only">{title}</DialogTitle>{content}
    </DialogContent>
  </Dialog>;
}
