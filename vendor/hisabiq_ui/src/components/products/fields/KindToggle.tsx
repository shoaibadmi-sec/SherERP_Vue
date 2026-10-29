import { LockIcon, PackageIcon, WrenchIcon } from 'lucide-react';
import type { ProductKind } from '../../../types/erp';
import { useFormCopy } from '../../../hooks/useFormCopy';
import { LabelText } from './LabelText';
import { SegmentedControl } from './SegmentedControl';

export function KindToggle({ value, onChange, locked }: { value: ProductKind; onChange: (kind: ProductKind) => void; locked: boolean }) {
  const { t } = useFormCopy();
  return (
    <div className="max-w-[440px]">
      <p id="pf-kind-label" className="mb-2 text-[length:var(--label-fs)] font-medium text-ink">
        <LabelText en="What are you adding?" bn="কী যোগ করছেন?" />
      </p>
      <SegmentedControl<ProductKind>
        size="lg"
        labelledBy="pf-kind-label"
        value={value}
        onChange={onChange}
        disabled={locked}
        options={[
          { value: 'Stock', label: t('Product', 'পণ্য'), sub: t('Has stock', 'স্টক থাকে'), icon: PackageIcon },
          { value: 'Service', label: t('Service', 'সেবা'), sub: t('No stock', 'স্টক থাকে না'), icon: WrenchIcon }
        ]}
      />
      {locked && (
        <p className="mt-2 flex items-center gap-1.5 text-[13px] text-ink-500">
          <LockIcon className="size-3.5 shrink-0" aria-hidden="true" />
          {t('Type can’t change after the item is created.', 'তৈরির পর ধরন বদলানো যায় না।')}
        </p>
      )}
    </div>
  );
}
