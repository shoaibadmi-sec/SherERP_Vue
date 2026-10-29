import { useUiCopy } from '../i18n/useUiCopy';
import type { Copy } from '../types/productForm';

/** Use the app's live language setting; the product editor owns no second preference state. */
export function useFormCopy() {
  const { language, text: t, showHelper } = useUiCopy();
  return { language, t, tc: (copy: Copy) => t(copy.en, copy.bn), isBangla: language === 'Bangla', showHelper };
}
