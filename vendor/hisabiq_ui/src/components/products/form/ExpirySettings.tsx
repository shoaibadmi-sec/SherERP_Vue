import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { AppDatePicker } from '../../AppDateRangePicker';
import { Input } from '../../Input';
import { FormField } from '../fields/FormField';
import { SegmentedControl } from '../fields/SegmentedControl';
import { ToggleRow } from '../fields/ToggleRow';
import { useFormCopy } from '../../../hooks/useFormCopy';
import { allocationOptions } from '../../../data/productFormOptions';
import type { StockAllocationMethod } from '../../../types/erp';
import { fmtQty } from '../../../utils/productDraft';
import type { AddProductForm } from './useAddProductForm';

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];
const pickerSize = '[&>button]:h-[var(--ctl-h)] [&>button]:text-[length:var(--ctl-fs)]';

export function ExpirySettings({ form }: { form: AddProductForm }) {
  const { t } = useFormCopy();
  const reduce = useReducedMotion();
  const { draft, set, errors, derived: x, isEdit } = form;
  const allocation = allocationOptions.find((o) => o.value === draft.allocationMethod) ?? allocationOptions[0];

  return (
    <div>
      <ToggleRow
        id="pf-expiry"
        en="Expiry date tracking"
        bn="মেয়াদ ট্র্যাকিং"
        hint={t('Keep batch and expiry date for each stock lot.', 'প্রতিটি লটের ব্যাচ ও মেয়াদের তারিখ রাখুন।')}
        checked={draft.expiryEnabled}
        onChange={(on) => set('expiryEnabled', on)}
      />
      <AnimatePresence initial={false}>
        {draft.expiryEnabled && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.2, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="space-y-5 pt-4">
              <div className="rounded-lg border border-border px-3 py-3">
                <ToggleRow
                  id="pf-expiryRequired"
                  en="Expiry date required"
                  bn="মেয়াদের তারিখ আবশ্যক"
                  hint={t('Stock can’t come in without an expiry date.', 'মেয়াদের তারিখ ছাড়া স্টক ঢোকানো যাবে না।')}
                  checked={draft.expiryDateRequired}
                  onChange={(on) => set('expiryDateRequired', on)}
                />
              </div>
              <div className="pf-grid-2">
                <FormField
                  id="pf-warningDays"
                  en="Warn before expiry"
                  bn="মেয়াদের আগে সতর্কতা"
                  hint={t('Shows a warning this many days before.', 'এত দিন আগে সতর্ক করবে।')}
                >
                  <div className="flex items-center gap-2">
                    <Input
                      id="pf-warningDays"
                      inputMode="numeric"
                      value={draft.expiryWarningDays}
                      onChange={(event) => set('expiryWarningDays', event.target.value.replace(/[^\d]/g, ''))}
                      aria-describedby="pf-warningDays-msg"
                      className="w-24 text-right"
                    />
                    <span className="text-[length:var(--ctl-fs)] text-ink-600">{t('days', 'দিন')}</span>
                  </div>
                </FormField>
                <FormField id="pf-allocation" labelAs="span" en="Sell which stock first" bn="কোন স্টক আগে বিক্রি" hint={t(allocation.hintEn, allocation.hintBn)}>
                  <SegmentedControl<StockAllocationMethod>
                    labelledBy="pf-allocation-label"
                    value={draft.allocationMethod}
                    options={allocationOptions.map((o) => ({ value: o.value, label: t(o.en, o.bn) }))}
                    onChange={(next) => set('allocationMethod', next)}
                  />
                </FormField>
              </div>

              {!isEdit && (x.openingBase > 0 ? (
                <div className="border-t border-border pt-5">
                  <p className="mb-3 text-[length:var(--label-fs)] font-medium text-ink">
                    {t(`Opening stock batch · ${fmtQty(x.openingBase)} ${draft.unit}`, `শুরুর স্টকের ব্যাচ · ${fmtQty(x.openingBase)} ${draft.unit}`)}
                  </p>
                  <div className="pf-grid-3">
                    <FormField id="pf-batch" en="Batch no." bn="ব্যাচ নং" hint={t('Optional', 'ঐচ্ছিক')}>
                      <Input
                        id="pf-batch"
                        value={draft.batchNumber}
                        onChange={(event) => set('batchNumber', event.target.value)}
                        autoComplete="off"
                        aria-describedby="pf-batch-msg"
                        className="h-[var(--ctl-h)] text-[length:var(--ctl-fs)]"
                      />
                    </FormField>
                    <FormField id="pf-mfg" labelAs="span" en="Manufacture date" bn="উৎপাদনের তারিখ" hint={t('Optional', 'ঐচ্ছিক')}>
                      <div id="pf-mfg">
                        <AppDatePicker label={t('Manufacture date', 'উৎপাদনের তারিখ')} value={draft.manufactureDate} onChange={(next) => set('manufactureDate', next)} className={pickerSize} />
                      </div>
                    </FormField>
                    <FormField
                      id="pf-expiryDate"
                      labelAs="span"
                      en="Expiry date"
                      bn="মেয়াদ শেষের তারিখ"
                      required={draft.expiryDateRequired}
                      error={errors.expiryDate}
                    >
                      <div id="pf-expiryDate">
                        <AppDatePicker
                          label={t('Expiry date', 'মেয়াদ শেষের তারিখ')}
                          value={draft.expiryDate}
                          onChange={(next) => set('expiryDate', next)}
                          className={pickerSize + (errors.expiryDate ? ' [&>button]:!border-danger' : '')}
                        />
                      </div>
                    </FormField>
                  </div>
                </div>
              ) : (
                <p className="rounded-lg bg-ink-100 px-3 py-2.5 text-[13px] text-ink-700">
                  {t('Batch and dates are asked when stock comes in.', 'স্টক ঢোকার সময় ব্যাচ ও তারিখ চাওয়া হবে।')}
                </p>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
