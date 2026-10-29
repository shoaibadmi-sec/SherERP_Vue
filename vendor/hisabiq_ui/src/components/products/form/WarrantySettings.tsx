import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { AppSelect } from '../../AppSelect';
import { Input } from '../../Input';
import { FormField } from '../fields/FormField';
import { ToggleRow } from '../fields/ToggleRow';
import { useFormCopy } from '../../../hooks/useFormCopy';
import { warrantyTypeOptions, warrantyUnitOptions } from '../../../data/productFormOptions';
import type { WarrantyDurationUnit, WarrantyType } from '../../../types/erp';
import type { AddProductForm } from './useAddProductForm';

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];
const selectSize = '[&>button]:h-[var(--ctl-h)] [&>button]:text-[length:var(--ctl-fs)]';

export function WarrantySettings({ form }: { form: AddProductForm }) {
  const { t } = useFormCopy();
  const reduce = useReducedMotion();
  const { draft, set, errors } = form;

  return (
    <div>
      <ToggleRow
        id="pf-warranty"
        en="Warranty"
        bn="ওয়ারেন্টি"
        hint={t('Separate from serial numbers. Claims are handled on the Warranty page.', 'সিরিয়াল নম্বর থেকে আলাদা। দাবি ওয়ারেন্টি পেজে দেখা হয়।')}
        checked={draft.warrantyEnabled}
        onChange={(on) => set('warrantyEnabled', on)}
      />
      <AnimatePresence initial={false}>
        {draft.warrantyEnabled && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.2, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="pf-grid-2 pt-4">
              <FormField id="pf-warrantyDuration" en="How long" bn="সময়কাল" error={errors.warrantyDuration}>
                <div className="flex gap-2">
                  <Input
                    id="pf-warrantyDuration"
                    inputMode="numeric"
                    value={draft.warrantyDuration}
                    onChange={(event) => set('warrantyDuration', event.target.value.replace(/[^\d.]/g, ''))}
                    aria-invalid={errors.warrantyDuration ? true : undefined}
                    aria-describedby="pf-warrantyDuration-msg"
                    className={'w-24 text-right' + (errors.warrantyDuration ? ' !border-danger' : '')}
                  />
                  <AppSelect
                    label={t('Warranty duration unit', 'ওয়ারেন্টির সময়ের একক')}
                    value={draft.warrantyDurationUnit}
                    onChange={(next) => set('warrantyDurationUnit', next as WarrantyDurationUnit)}
                    options={warrantyUnitOptions.map((o) => ({ value: o.value, label: t(o.en, o.bn) }))}
                    className={'flex-1 ' + selectSize}
                  />
                </div>
              </FormField>
              <FormField id="pf-warrantyType" en="Who gives the warranty" bn="কে ওয়ারেন্টি দেবে">
                <AppSelect
                  id="pf-warrantyType"
                  label={t('Who gives the warranty', 'কে ওয়ারেন্টি দেবে')}
                  value={draft.warrantyType}
                  onChange={(next) => set('warrantyType', next as WarrantyType)}
                  options={warrantyTypeOptions.map((o) => ({ value: o.value, label: t(o.en, o.bn) }))}
                  className={selectSize}
                />
              </FormField>
              <FormField
                id="pf-warrantyTerms"
                en="Terms"
                bn="শর্তাবলি"
                className="pf-span-2"
                hint={t('Optional. Printed on the invoice for this item.', 'ঐচ্ছিক। এই পণ্যের বিলে ছাপা হবে।')}
              >
                <textarea
                  id="pf-warrantyTerms"
                  rows={3}
                  value={draft.warrantyTerms}
                  onChange={(event) => set('warrantyTerms', event.target.value)}
                  placeholder={t('What is covered, what is not, papers needed…', 'কী কভার হবে, কী হবে না, কী কাগজ লাগবে…')}
                  aria-describedby="pf-warrantyTerms-msg"
                  className="block w-full rounded-md border border-input bg-card px-3 py-2.5 text-ink placeholder:text-ink-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </FormField>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
