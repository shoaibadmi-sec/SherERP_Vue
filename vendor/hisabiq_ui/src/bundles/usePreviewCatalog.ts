import { useSyncExternalStore } from 'react';
import type { Product } from '../types/erp';
import {
  getProductImportPreviewSnapshot,
  subscribeProductImportPreview
} from '../data/productImportPreviewStore';

/** React read-through for the single product + version preview snapshot. */
export function usePreviewCatalog(): readonly Product[] {
  const snapshot = useSyncExternalStore(
    subscribeProductImportPreview,
    getProductImportPreviewSnapshot,
    getProductImportPreviewSnapshot
  );
  return snapshot.products;
}
