import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { LayersIcon, LockKeyholeIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { Button } from '../../Button';
import { MoneyUnitInput, QuantityUnitInput } from '../../MoneyUnitInput';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../Dialog';
import { Disclosure } from '../fields/Disclosure';
import { FormField } from '../fields/FormField';
import { SearchSelect } from '../../SearchSelect';
import { ToggleRow } from '../fields/ToggleRow';
import { useFormCopy } from '../../../hooks/useFormCopy';
import { taka } from '../../../utils/currency';
import { errorSection, fmtQty } from '../../../utils/productDraft';
import type { AddProductForm } from './useAddProductForm';

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

export function AdvancedStockPanel({ form }: { form: AddProductForm }) {
  const { t } = useFormCopy();
  const reduce = useReducedMotion();
  const [confirmSingle, setConfirmSingle] = useState(false);
  const { draft, set, errors, derived: x, unitsLocked } = form;
  const largest = x.units[x.units.length - 1];
  const summary = draft.multiUnit
    ? [...x.units].reverse().join(' → ')
    : t(`Single unit (${draft.unit}). Add larger units only when you need them.`, `একটি একক (${draft.unit})। দরকার হলে বড় একক যোগ করুন।`);
  const errorCount = form.errorList.filter((key) => errorSection(key) === 'advanced').length;
  const usedUnits = new Set([draft.unit, ...draft.unitLevels.map((level) => level.unit)].map((unit) => unit.toLowerCase()));
  const priceErrors = form.errorList.some((key) => key.startsWith('levelPrice-') || key.startsWith('levelPurchase-') || key === 'basePrice' || key === 'basePurchasePrice');

  return (
    <Disclosure id="pf-advanced" en="Advanced stock" bn="উন্নত স্টক" summary={summary}
      open={form.advancedOpen} onToggle={() => form.setAdvancedOpen(!form.advancedOpen)} errorCount={errorCount}>
      {unitsLocked && (
        <p className="mb-4 flex items-start gap-2 rounded-lg bg-ink-100 p-3 text-[13px] text-ink-700">
          <LockKeyholeIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {t('Unit setup is locked because this product has stock or transaction history. Prices and the preferred display unit can still change.',
            'এই পণ্যে স্টক বা লেনদেন আছে, তাই এককের সম্পর্ক বদলানো যাবে না। দাম ও দেখানোর একক বদলাতে পারবেন।')}
        </p>
      )}
      <fieldset disabled={unitsLocked} className="min-w-0 disabled:opacity-70">
        <ToggleRow id="pf-multi" en="Use multiple units" bn="একাধিক একক ব্যবহার"
          hint={t('Like Carton, Box, Pcs and Feet. Add only the units this product needs.', 'যেমন Carton, Box, Pcs ও Feet। এই পণ্যের দরকারি এককগুলো দিন।')}
          checked={draft.multiUnit} onChange={(on) => on ? form.setMultiUnit(true) : setConfirmSingle(true)} />
      </fieldset>
      {form.unitNotice && <p role="status" className="mt-3 rounded-lg bg-info-bg px-3 py-2.5 text-[13px] text-info">{t(form.unitNotice.en, form.unitNotice.bn)}</p>}
      <AnimatePresence initial={false}>
        {draft.multiUnit && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.2, ease: EASE }} className="overflow-hidden">
            <div className="pt-5">
              <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-ink-600">
                <LayersIcon className="size-4 text-primary" aria-hidden="true" />
                <span>{t('Smallest stock unit', 'সবচেয়ে ছোট স্টক একক')}</span>
                <strong className="rounded-md border border-teal-200 bg-accent px-2.5 py-1 font-semibold text-primary">{draft.unit}</strong>
                <span>{t('Add larger units below.', 'নিচে বড় একক যোগ করুন।')}</span>
              </div>
              <div id="pf-unitChain" className="space-y-3" aria-label={t('Unit conversions', 'এককের রূপান্তর')}>
                {draft.unitLevels.map((level, index) => {
                  const smaller = index ? draft.unitLevels[index - 1].unit : draft.unit;
                  const unitKey = `levelUnit-${level.id}` as const;
                  const factorKey = `levelFactor-${level.id}` as const;
                  return (
                    <fieldset data-product-unit-relationship key={level.id} disabled={unitsLocked} className="min-w-0 rounded-xl border border-border bg-card p-3.5 disabled:opacity-75">
                      <legend className="sr-only">{t(`Conversion for ${level.unit || 'larger unit'}`, `${level.unit || 'বড় একক'}-এর রূপান্তর`)}</legend>
                      <div className="pf-unit-row">
                        <FormField className="pf-unit-select" id={`pf-${unitKey}`} en="1 larger unit" bn="১টি বড় একক" error={errors[unitKey]}>
                          <SearchSelect id={`pf-${unitKey}`} noun={{ en: 'larger unit', bn: 'বড় একক' }} labelledBy={`pf-${unitKey}-label`}
                            describedBy={`pf-${unitKey}-msg`} invalid={Boolean(errors[unitKey])} disabled={unitsLocked}
                            value={level.unit} options={form.units.filter((unit) => unit.symbol === level.unit || !usedUnits.has(unit.symbol.toLowerCase()))
                              .map((unit) => ({ value: unit.symbol, label: unit.symbol, meta: unit.name !== unit.symbol ? unit.name : undefined }))}
                            onChange={(value) => form.updateUnitLevel(level.id, 'unit', value)} onCreate={form.createUnit} withSymbol />
                        </FormField>
                        <FormField className="pf-unit-ratio" id={`pf-${factorKey}`} en="Contains" bn="যার মধ্যে আছে" error={errors[factorKey]}>
                          <QuantityUnitInput id={`pf-${factorKey}`} label={t(`Number of ${smaller || 'smaller units'} in 1 ${level.unit || 'larger unit'}`, `১ ${level.unit || 'বড় একক'}-এ কত ${smaller || 'ছোট একক'}`)}
                            describedBy={`pf-${factorKey}-msg`} invalid={Boolean(errors[factorKey])} value={level.factor}
                            onChange={(value) => form.updateUnitLevel(level.id, 'factor', value)} staticUnit={smaller || '—'} disabled={unitsLocked} />
                        </FormField>
                        <button type="button" disabled={unitsLocked} onClick={() => form.removeUnitLevel(level.id)}
                          aria-label={t(`Remove ${level.unit || 'unit'} level`, `${level.unit || 'একক'} ধাপ মুছুন`)}
                          title={t('Remove this unit', 'এই একক মুছুন')} className="pf-unit-remove flex size-11 items-center justify-center rounded-md border border-border text-ink-500 transition-colors hover:border-danger/30 hover:bg-danger-bg hover:text-danger disabled:cursor-not-allowed">
                          <Trash2Icon className="size-[18px]" aria-hidden="true" />
                        </button>
                      </div>
                    </fieldset>
                  );
                })}
                {errors.unitChain && <p role="alert" className="text-[13px] text-danger">{t(errors.unitChain.en, errors.unitChain.bn)}</p>}
              </div>
              <button type="button" disabled={unitsLocked} onClick={form.addUnitLevel}
                className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-teal-300 px-3 py-2.5 text-[14px] font-semibold text-primary transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50">
                <PlusIcon className="size-4" aria-hidden="true" />{t('Add another unit', 'আরেকটি একক যোগ করুন')}
              </button>
              {x.units.length > 1 && (
                <div className="mt-4 rounded-xl border border-teal-200 bg-accent p-4" aria-live="polite">
                  <p className="text-[13px] font-medium text-ink-600">{t('Calculated automatically', 'নিজে থেকে হিসাব হবে')}</p>
                  <div className="mt-2 space-y-1 text-[14px] text-ink">
                    {draft.unitLevels.filter((level) => x.factors[level.unit]).map((level) => (
                      <p key={level.id}>1 {level.unit} = <strong className="font-semibold">{fmtQty(x.factors[level.unit])} {draft.unit}</strong></p>
                    ))}
                  </div>
                  {x.units.length > 2 && <p className="mt-2 border-t border-teal-200 pt-2 text-[13px] text-ink-600">1 {largest} = {fmtQty(x.factors[largest] / x.factors[x.units[1]])} {x.units[1]}</p>}
                  <p className="mt-2 text-[12px] text-ink-500">{t(`Stock is counted in ${draft.unit}. Prices and quantities can use any configured unit.`, `স্টক ${draft.unit}-এ গোনা হবে। দাম ও পরিমাণে সব একক বাছতে পারবেন।`)}</p>
                </div>
              )}
              <FormField id="pf-view" en="Preferred stock unit" bn="স্টক দেখানোর একক" className="mt-5"
                hint={t('Used for stock display and the default unit in POS.', 'স্টক দেখাতে ও POS-এর ডিফল্ট একক।')}>
                <SearchSelect id="pf-view" noun={{ en: 'stock display unit', bn: 'স্টক দেখানোর একক' }} labelledBy="pf-view-label"
                  value={x.viewUnit} options={x.units.map((unit) => ({ value: unit, label: unit }))} onChange={(next) => set('stockViewUnit', next)} />
              </FormField>
              {draft.unitLevels.length > 0 && (
                <details className="mt-5 rounded-lg border border-border" open={priceErrors || undefined}>
                  <summary className="cursor-pointer px-3.5 py-3 text-[14px] font-medium text-ink">{t('Custom unit prices', 'একক অনুযায়ী আলাদা দাম')} <span className="font-normal text-ink-500">· {t('optional', 'ঐচ্ছিক')}</span></summary>
                  <div className="space-y-4 border-t border-border p-3.5">
                    <p className="text-[13px] text-ink-500">{t('Leave empty to convert the regular selling price. A custom price replaces the automatic price for that unit.', 'খালি রাখলে সাধারণ বিক্রয় মূল্য থেকে হিসাব হবে। আলাদা দাম দিলে সেই এককে সেটিই প্রযোজ্য হবে।')}</p>
                    {[{ id: 'base', unit: draft.unit, price: draft.basePrice ?? '', purchasePrice: draft.basePurchasePrice ?? '' }, ...draft.unitLevels]
                      .filter((level) => x.factors[level.unit]).map((level) => {
                      const base = level.id === 'base';
                      const priceKey = base ? 'basePrice' : `levelPrice-${level.id}` as const;
                      const purchaseKey = base ? 'basePurchasePrice' : `levelPurchase-${level.id}` as const;
                      const autoSell = x.sellBase * x.factors[level.unit];
                      const autoBuy = x.buyBase * x.factors[level.unit];
                      return <div key={level.id} className="pf-pair-money">
                        <FormField id={`pf-${purchaseKey}`} en={`Unit cost per ${level.unit}`} bn={`প্রতি ${level.unit} কেনা দাম`} error={errors[purchaseKey]}
                          hint={level.purchasePrice ? t(`Custom cost · automatic ${taka(autoBuy)}`, `আলাদা কেনা দাম · স্বয়ংক্রিয় ${taka(autoBuy)}`) : t(`Automatic: ${taka(autoBuy)} / ${level.unit}`, `স্বয়ংক্রিয়: ${taka(autoBuy)} / ${level.unit}`)}>
                          <MoneyUnitInput id={`pf-${purchaseKey}`} label={t(`Purchase price per ${level.unit}`, `প্রতি ${level.unit} কেনা দাম`)}
                            invalid={Boolean(errors[purchaseKey])} describedBy={`pf-${purchaseKey}-msg`} value={level.purchasePrice ?? ''}
                            onChange={(value) => base ? set('basePurchasePrice', value) : form.updateUnitLevel(level.id, 'purchasePrice', value)}
                            placeholder={autoBuy > 0 ? String(Number(autoBuy.toFixed(4))) : '0'} staticUnit={`/ ${level.unit}`} />
                        </FormField>
                        <FormField id={`pf-${priceKey}`} en={`Selling price per ${level.unit}`} bn={`প্রতি ${level.unit} বিক্রয় মূল্য`} error={errors[priceKey]}
                          hint={level.price ? t(`Custom price · automatic ${taka(autoSell)}`, `আলাদা দাম · স্বয়ংক্রিয় ${taka(autoSell)}`) : t(`Automatic: ${taka(autoSell)} / ${level.unit}`, `স্বয়ংক্রিয়: ${taka(autoSell)} / ${level.unit}`)}>
                          <MoneyUnitInput id={`pf-${priceKey}`} label={t(`Selling price per ${level.unit}`, `প্রতি ${level.unit} বিক্রয় মূল্য`)}
                            invalid={Boolean(errors[priceKey])} describedBy={`pf-${priceKey}-msg`} value={level.price}
                            onChange={(value) => base ? set('basePrice', value) : form.updateUnitLevel(level.id, 'price', value)}
                            placeholder={autoSell > 0 ? String(Number(autoSell.toFixed(4))) : '0'} staticUnit={`/ ${level.unit}`} />
                        </FormField>
                      </div>;
                    })}
                  </div>
                </details>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <Dialog open={confirmSingle} onOpenChange={setConfirmSingle}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('Use a single unit?', 'একটি একক ব্যবহার করবেন?')}</DialogTitle>
            <DialogDescription>{t(`Prices and quantities will be converted to ${draft.unit}. Larger units and their custom prices will be removed. Review all amounts before changing the smallest unit.`, `দাম ও পরিমাণ ${draft.unit}-এ রূপান্তর হবে। বড় একক ও তাদের আলাদা দাম মুছে যাবে। সবচেয়ে ছোট একক বদলানোর আগে সব পরিমাণ যাচাই করুন।`)}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmSingle(false)}>{t('Keep multiple units', 'একাধিক একক রাখুন')}</Button>
            <Button onClick={() => { form.setMultiUnit(false); setConfirmSingle(false); }}>{t('Use single unit', 'একটি একক ব্যবহার')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Disclosure>
  );
}
