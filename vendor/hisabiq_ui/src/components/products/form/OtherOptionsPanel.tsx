import { Input } from '../../Input';
import { PhotoUploader } from '../PhotoUploader';
import { Disclosure } from '../fields/Disclosure';
import { FormField } from '../fields/FormField';
import { useFormCopy } from '../../../hooks/useFormCopy';
import { serialModeOptions, warrantyUnitOptions } from '../../../data/productFormOptions';
import { ExpirySettings } from './ExpirySettings';
import { SerialSettings } from './SerialSettings';
import { WarrantySettings } from './WarrantySettings';
import type { AddProductForm } from './useAddProductForm';

export function OtherOptionsPanel({ form }: { form: AddProductForm }) {
  const { t } = useFormCopy();
  const { draft, set, errors } = form;
  const isStock = draft.kind === 'Stock';
  const errorCount = ['warrantyDuration', 'openingSerials', 'expiryDate'].filter((key) => errors[key as keyof typeof errors]).length;

  const parts: string[] = [];
  if (draft.warrantyEnabled) {
    const unit = warrantyUnitOptions.find((o) => o.value === draft.warrantyDurationUnit);
    parts.push(t(`Warranty ${draft.warrantyDuration || '?'} ${unit?.en.toLowerCase() ?? ''}`, `ওয়ারেন্টি ${draft.warrantyDuration || '?'} ${unit?.bn ?? ''}`));
  }
  if (isStock && draft.serialTracking !== 'Off') {
    const mode = serialModeOptions.find((o) => o.value === draft.serialTracking);
    parts.push(t(`Serial ${mode?.en.toLowerCase()}`, `সিরিয়াল ${mode?.bn}`));
  }
  if (isStock && draft.expiryEnabled) parts.push(t(`Expiry · ${draft.allocationMethod}`, `মেয়াদ · ${draft.allocationMethod}`));
  if (draft.barcode.trim()) parts.push(t('Barcode set', 'বারকোড আছে'));
  if (draft.photos.length) parts.push(t(`${draft.photos.length} photo${draft.photos.length > 1 ? 's' : ''}`, `${draft.photos.length}টি ছবি`));

  const summary = parts.length
    ? parts.join(' · ')
    : isStock
      ? t('Warranty, serial numbers, expiry, barcode, photos', 'ওয়ারেন্টি, সিরিয়াল, মেয়াদ, বারকোড, ছবি')
      : t('Warranty, barcode, photos', 'ওয়ারেন্টি, বারকোড, ছবি');

  return (
    <Disclosure
      id="pf-other"
      en="Other options"
      bn="অন্যান্য অপশন"
      summary={summary}
      open={form.otherOpen}
      onToggle={() => form.setOtherOpen(!form.otherOpen)}
      errorCount={errorCount}
    >
      <div className="divide-y divide-border">
        <div className="pb-5"><WarrantySettings form={form} /></div>
        {isStock && <div className="py-5"><SerialSettings form={form} /></div>}
        {isStock && <div className="py-5"><ExpirySettings form={form} /></div>}
        <div className="py-5">
          <div className="max-w-[420px]">
            <FormField id="pf-barcode" en="Barcode / SKU" bn="বারকোড / SKU" hint={t('Optional. Scan or type. Left empty, one is made for you.', 'ঐচ্ছিক। স্ক্যান করুন বা লিখুন। খালি রাখলে নিজে তৈরি হবে।')}>
              <Input
                id="pf-barcode"
                value={draft.barcode}
                onChange={(event) => set('barcode', event.target.value)}
                autoComplete="off"
                spellCheck={false}
                aria-describedby="pf-barcode-msg"
                className="h-[var(--ctl-h)] text-[length:var(--ctl-fs)]"
              />
            </FormField>
          </div>
        </div>
        <div className="pt-5">
          <FormField id="pf-photos" labelAs="span" en="Photos" bn="ছবি">
            <PhotoUploader
              photos={draft.photos}
              onChange={(photos) => set('photos', photos)}
              label={t('Add photo', 'ছবি দিন')}
              hint={t('Optional. Up to 4. The first photo shows in POS and lists.', 'ঐচ্ছিক। সর্বোচ্চ ৪টি। প্রথম ছবি POS ও তালিকায় দেখাবে।')}
            />
          </FormField>
        </div>
      </div>
    </Disclosure>
  );
}
