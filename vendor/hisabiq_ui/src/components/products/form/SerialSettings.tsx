import { Button } from '../../Button';
import { CheckIcon } from 'lucide-react';
import { FormField } from '../fields/FormField';
import { LabelText } from '../fields/LabelText';
import { SegmentedControl } from '../fields/SegmentedControl';
import { useFormCopy } from '../../../hooks/useFormCopy';
import { serialModeOptions } from '../../../data/productFormOptions';
import type { SerialTrackingMode } from '../../../types/erp';
import { fmtQty } from '../../../utils/productDraft';
import type { AddProductForm } from './useAddProductForm';

export function SerialSettings({ form }: { form: AddProductForm }) {
  const { t } = useFormCopy();
  const { draft, set, errors, derived: x, isEdit } = form;
  const mode = serialModeOptions.find((o) => o.value === draft.serialTracking) ?? serialModeOptions[0];
  const count = x.serials.length;
  const required = draft.serialTracking === 'Required';
  const complete = required ? count === x.requiredSerials && !x.duplicates.length : count <= x.openingBase && !x.duplicates.length;
  const error = errors.openingSerials;

  if (!x.serialCompatible) return (
    <div>
      <p className="text-[length:var(--label-fs)] font-medium text-ink"><LabelText en="Serial numbers" bn="সিরিয়াল নম্বর" /></p>
      <p className="mt-2 rounded-lg bg-ink-100 p-3 text-[13px] text-ink-600">{t(`Serial numbers need a countable smallest unit, such as Pcs. They are unavailable when stock is counted in ${draft.unit}.`, `সিরিয়ালের জন্য সবচেয়ে ছোট এককটি গণনাযোগ্য হতে হবে, যেমন Pcs। ${draft.unit}-এ স্টক গুনলে সিরিয়াল ব্যবহার করা যাবে না।`)}</p>
      {draft.serialTracking !== 'Off' && (
        <Button id="pf-openingSerials" variant="outline" onClick={() => set('serialTracking', 'Off')} className="mt-3">{t('Turn serials off', 'সিরিয়াল বন্ধ করুন')}</Button>
      )}
    </div>
  );

  return (
    <div>
      <p id="pf-serial-label" className="text-[length:var(--label-fs)] font-medium leading-tight text-ink">
        <LabelText en="Serial numbers" bn="সিরিয়াল নম্বর" />
      </p>
      <p className="mt-1 text-[13px] text-ink-500">{t('Choose this separately from warranty.', 'ওয়ারেন্টি থেকে আলাদা ভাবে বাছুন।')}</p>
      <div className="mt-3 max-w-[420px]">
        <SegmentedControl<SerialTrackingMode>
          labelledBy="pf-serial-label"
          value={draft.serialTracking}
          options={serialModeOptions.map((o) => ({ value: o.value, label: t(o.en, o.bn) }))}
          onChange={(next) => set('serialTracking', next)}
        />
      </div>
      <p className="mt-2 text-[13px] text-ink-600">{t(mode.hintEn, mode.hintBn)}</p>

      {!isEdit && draft.serialTracking !== 'Off' && (x.openingBase > 0 ? (
        <FormField
          id="pf-openingSerials"
          en="Serials for opening stock"
          bn="শুরুর স্টকের সিরিয়াল"
          className="mt-4"
          error={error}
          hint={t('Type, scan or paste. One per line, or separate with commas.', 'লিখুন, স্ক্যান বা পেস্ট করুন। প্রতি লাইনে একটি, বা কমা দিয়ে আলাদা করুন।')}
        >
          <textarea
            id="pf-openingSerials"
            rows={4}
            value={draft.openingSerialText}
            onChange={(event) => set('openingSerialText', event.target.value)}
            placeholder={'GV34-1001\nGV34-1002'}
            spellCheck={false}
            autoCapitalize="characters"
            aria-invalid={error ? true : undefined}
            aria-describedby="pf-openingSerials-count pf-openingSerials-msg"
            className={
              'block w-full rounded-md border bg-card px-3 py-2.5 text-ink placeholder:text-ink-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ' +
              (error ? '!border-danger' : 'border-input')
            }
          />
          <div id="pf-openingSerials-count" aria-live="polite" className="mt-2 flex flex-wrap items-center gap-2 text-[13px]">
            <span
              className={
                'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-semibold ' +
                (count === 0 && !required ? 'bg-ink-100 text-ink-600' : complete ? 'bg-success-bg text-success' : 'bg-warning-bg text-warning')
              }
            >
              {complete && count > 0 && <CheckIcon className="size-3.5" aria-hidden="true" />}
              {required
                ? t(`${count} of ${x.requiredSerials} entered`, `${x.requiredSerials}টির মধ্যে ${count}টি দেওয়া হয়েছে`)
                : t(`${count} entered · up to ${fmtQty(x.openingBase)}`, `${count}টি দেওয়া · সর্বোচ্চ ${fmtQty(x.openingBase)}`)}
            </span>
            {x.duplicates.length > 0 && (
              <span className="rounded-full bg-danger-bg px-2.5 py-0.5 font-semibold text-danger">
                {t(`Duplicate: ${x.duplicates[0]}`, `একই সিরিয়াল: ${x.duplicates[0]}`)}
              </span>
            )}
          </div>
        </FormField>
      ) : (
        <p className="mt-4 rounded-lg bg-ink-100 px-3 py-2.5 text-[13px] text-ink-700">
          {t('Add opening stock above to enter serials now. Otherwise, add them when you buy stock.',
            'এখনই সিরিয়াল দিতে উপরে শুরুর স্টক দিন। নইলে মাল কেনার সময় দেবেন।')}
        </p>
      ))}
    </div>
  );
}
