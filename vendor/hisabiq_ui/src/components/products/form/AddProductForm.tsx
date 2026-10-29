import { ActionBar } from './ActionBar';
import { AdvancedStockPanel } from './AdvancedStockPanel';
import { OtherOptionsPanel } from './OtherOptionsPanel';
import { PriceStockSection } from './PriceStockSection';
import { ProductDetailsSection } from './ProductDetailsSection';
import type { AddProductForm as AddProductFormState } from './useAddProductForm';

/** One full-page form in the agreed reading order. Not a wizard: everything is on one page. */
export function AddProductForm({ form }: { form: AddProductFormState }) {
  return (
    <form
      noValidate
      aria-labelledby="pf-title"
      onSubmit={(event) => { event.preventDefault(); form.save(); }}
      className="pf-container border-y border-border bg-card md:rounded-xl md:border md:shadow-card"
    >
      <ProductDetailsSection form={form} />
      <PriceStockSection form={form} />
      {form.draft.kind === 'Stock' && <AdvancedStockPanel form={form} />}
      <OtherOptionsPanel form={form} />
      <ActionBar isEdit={form.isEdit} errorCount={form.errorList.length} onCancel={form.requestExit} />
    </form>
  );
}
