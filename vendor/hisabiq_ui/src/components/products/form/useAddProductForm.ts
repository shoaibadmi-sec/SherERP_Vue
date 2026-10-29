import { useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import {
  availableProductBrands, availableProductCategories, availableProductUnits,
  createPreviewProductBrand, createPreviewProductCategory, createPreviewProductUnit
} from '../../../data/erpDemoStore';
import type { ProductKind } from '../../../types/erp';
import type { Copy, ErrorKey, ExistingProduct, ProductDraft, SaveResult } from '../../../types/productForm';
import {
  buildProduct, convertPrice, convertQty, deriveDraft, errorSection, fieldOrder, factorsOf, pickUnit, removeDraftLevel, validateDraft
} from '../../../utils/productDraft';
import { focusField } from '../../../utils/focusField';

type Options = {
  initialDraft: ProductDraft;
  isEdit: boolean;
  existing?: ExistingProduct;
  existingSerials: string[];
  onExit: () => void;
  onSave: (result: SaveResult) => void;
};

const DISCLOSURE_MS = 240;

const hasOtherOptions = (d: ProductDraft) =>
  d.warrantyEnabled || d.serialTracking !== 'Off' || d.expiryEnabled || Boolean(d.barcode) || d.photos.length > 0;

export function useAddProductForm({ initialDraft, isEdit, existing, existingSerials, onExit, onSave }: Options) {
  const reduceMotion = useReducedMotion();
  const unitsLocked = isEdit;
  const [unitNotice, setUnitNotice] = useState<Copy | null>(null);
  const [draft, setDraft] = useState(initialDraft);
  const [baseline] = useState(() => JSON.stringify(initialDraft));
  const [submitted, setSubmitted] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(initialDraft.multiUnit);
  const [otherOpen, setOtherOpen] = useState(() => hasOtherOptions(initialDraft));
  const [categories, setCategories] = useState(availableProductCategories);
  const [brands, setBrands] = useState(availableProductBrands);
  const [units, setUnits] = useState(availableProductUnits);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [discardOpen, setDiscardOpen] = useState(false);

  const derived = useMemo(() => deriveDraft(draft, isEdit, existingSerials), [draft, isEdit, existingSerials]);
  const errors = useMemo(() => (submitted ? validateDraft(draft, isEdit, derived) : {}), [submitted, draft, isEdit, derived]);
  const errorList = fieldOrder(draft).filter((key) => errors[key]);
  const dirty = JSON.stringify(draft) !== baseline;
  const blockLeave = useRef(false);
  blockLeave.current = dirty;

  const set = <K extends keyof ProductDraft>(key: K, value: ProductDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const changeKind = (next: ProductKind) => setDraft((d) => {
    if (next === d.kind || next === 'Bundle') return d;
    if (next === 'Service') {
      return {
        ...d, kind: next, category: 'Service', unit: 'Service', sellUnit: 'Service', buyUnit: 'Service',
        openingUnit: 'Service', minUnit: 'Service', stockViewUnit: 'Service', multiUnit: false,
        serialTracking: 'Off', expiryEnabled: false
      };
    }
    if (d.unit !== 'Service') return { ...d, kind: next };
    return {
      ...d, kind: next, category: d.category === 'Service' ? 'Hardware' : d.category, unit: 'Pcs',
      sellUnit: 'Pcs', buyUnit: 'Pcs', openingUnit: 'Pcs', minUnit: 'Pcs', stockViewUnit: 'Pcs'
    };
  });

  const changeUnit = (next: string) => setDraft((d) => {
    if (unitsLocked || d.multiUnit) return d;
    const swap = (u: string) => (u === d.unit ? next : u);
    return {
      ...d, unit: next, sellUnit: swap(d.sellUnit), buyUnit: swap(d.buyUnit), openingUnit: swap(d.openingUnit),
      minUnit: swap(d.minUnit), stockViewUnit: swap(d.stockViewUnit)
    };
  });

  const setMultiUnit = (on: boolean) => {
    if (unitsLocked) return;
    setUnitNotice(null);
    if (on) {
      setDraft((d) => ({ ...d, multiUnit: true, unitLevels: d.unitLevels.length ? d.unitLevels : [{ id: `u${Date.now()}`, unit: '', factor: '', price: '' }] }));
      return;
    }
    const factors = factorsOf(draft);
    if ([draft.sellUnit, draft.buyUnit, draft.openingUnit, draft.minUnit].some((unit) => !factors[unit])) {
      setUnitNotice({ en: 'Complete the conversion before turning multiple units off, so entered amounts can be kept.', bn: 'দেওয়া দাম ও স্টক ঠিক রাখতে আগে রূপান্তর সম্পূর্ণ করুন।' });
      return;
    }
    setDraft((d) => ({
      ...d, multiUnit: false, unitLevels: [], basePrice: '', basePurchasePrice: '',
      sell: d.basePrice?.trim() ? d.basePrice : convertPrice(d, d.sell, d.sellUnit, d.unit), sellUnit: d.unit,
      buy: d.basePurchasePrice?.trim() ? d.basePurchasePrice : convertPrice(d, d.buy, d.buyUnit, d.unit), buyUnit: d.unit,
      openingQty: convertQty(d, d.openingQty, d.openingUnit, d.unit), openingUnit: d.unit,
      minQty: convertQty(d, d.minQty, d.minUnit, d.unit), minUnit: d.unit,
      stockViewUnit: d.unit
    }));
    setUnitNotice({ en: 'Multiple units turned off. Entered prices and quantities were converted to the smallest unit.', bn: 'একাধিক একক বন্ধ। দেওয়া দাম ও পরিমাণ সবচেয়ে ছোট এককে রূপান্তর হয়েছে।' });
  };

  const addUnitLevel = () => {
    if (unitsLocked) return;
    const last = draft.unitLevels[draft.unitLevels.length - 1];
    if (last && !derived.factors[last.unit]) {
      setUnitNotice({ en: 'Complete the last conversion before adding another unit.', bn: 'আরেকটি একক যোগ করার আগে শেষ রূপান্তরটি পূরণ করুন।' });
      return;
    }
    setUnitNotice(null);
    setDraft((d) => ({ ...d, unitLevels: [...d.unitLevels, { id: `u${Date.now()}`, unit: '', factor: '', price: '' }] }));
  };

  const updateUnitLevel = (id: string, key: 'unit' | 'factor' | 'price' | 'purchasePrice', value: string) => {
    if (unitsLocked && key !== 'price' && key !== 'purchasePrice') return;
    if (key === 'unit' && [draft.unit, ...draft.unitLevels.filter((level) => level.id !== id).map((level) => level.unit)]
      .some((unit) => unit.trim().toLowerCase() === value.trim().toLowerCase())) {
      setUnitNotice({ en: 'This unit is already in the chain. Choose a different larger unit.', bn: 'এই এককটি আগেই আছে। অন্য একটি বড় একক বাছুন।' });
      return;
    }
    setUnitNotice(null);
    setDraft((d) => {
      const oldUnit = d.unitLevels.find((level) => level.id === id)?.unit;
      const rename = (unit: string) => key === 'unit' && oldUnit && unit === oldUnit ? value : unit;
      return { ...d,
        unitLevels: d.unitLevels.map((level) => level.id === id ? { ...level, [key]: value } : level),
        sellUnit: rename(d.sellUnit), buyUnit: rename(d.buyUnit), openingUnit: rename(d.openingUnit),
        minUnit: rename(d.minUnit), stockViewUnit: rename(d.stockViewUnit)
      };
    });
  };

  const removeUnitLevel = (id: string) => {
    if (unitsLocked) return;
    const next = removeDraftLevel(draft, id);
    if (!next) {
      setUnitNotice({ en: 'Enter valid conversions before removing this level, so stock and prices keep their value.', bn: 'স্টক ও দামের মান ঠিক রাখতে ধাপ মুছার আগে সঠিক রূপান্তর দিন।' });
      return;
    }
    setDraft(next);
    setUnitNotice({ en: 'Unit removed. Remaining conversions and entered quantities keep the same value.', bn: 'একক মুছেছে। বাকি রূপান্তর ও দেওয়া পরিমাণের মান একই আছে।' });
  };

  const changePriceUnit = (field: 'sell' | 'buy', next: string) => setDraft((d) => {
    if (!derived.units.includes(next)) return d;
    if (field === 'sell') return { ...d, sell: convertPrice(d, d.sell, pickUnit(d, d.sellUnit), next), sellUnit: next };
    return { ...d, buy: convertPrice(d, d.buy, pickUnit(d, d.buyUnit), next), buyUnit: next };
  });

  const changeStockUnit = (field: 'opening' | 'min', next: string) => setDraft((d) => {
    if (field === 'opening') return { ...d, openingQty: convertQty(d, d.openingQty, pickUnit(d, d.openingUnit), next), openingUnit: next };
    return { ...d, minQty: convertQty(d, d.minQty, pickUnit(d, d.minUnit), next), minUnit: next };
  });

  const createCategory = (name: string) => {
    createPreviewProductCategory(name);
    setCategories(availableProductCategories());
    return name;
  };
  const createBrand = (name: string) => {
    createPreviewProductBrand(name);
    setBrands(availableProductBrands());
    return name;
  };
  const createUnit = (name: string, symbol: string) => {
    const code = symbol.trim() || name.trim();
    const found = units.find((unit) => unit.symbol.toLowerCase() === code.toLowerCase() || unit.name.toLowerCase() === name.trim().toLowerCase());
    if (found) return found.symbol;
    createPreviewProductUnit(name.trim(), code);
    setUnits(availableProductUnits());
    return code;
  };

  /** Opens the collapsed section that holds a field, then moves focus to it. */
  const revealError = (key: ErrorKey, openAlso: ErrorKey[] = []) => {
    const sections = new Set([key, ...openAlso].map(errorSection));
    let wait = 0;
    if (sections.has('advanced') && !advancedOpen) { setAdvancedOpen(true); wait = DISCLOSURE_MS; }
    if (sections.has('other') && !otherOpen) { setOtherOpen(true); wait = DISCLOSURE_MS; }
    window.setTimeout(() => focusField(`pf-${key}`), reduceMotion ? 0 : wait);
  };

  const save = () => {
    setSubmitted(true);
    const found = validateDraft(draft, isEdit, derived);
    const keys = fieldOrder(draft).filter((key) => found[key]);
    if (keys.length) {
      revealError(keys[0], keys);
      return;
    }
    setSaveError(null);
    try { onSave(buildProduct(draft, derived, isEdit, existing)); }
    catch (cause) { setSaveError(cause instanceof Error ? cause.message : 'Could not save the product.'); }

  };

  const requestExit = () => (blockLeave.current ? setDiscardOpen(true) : onExit());
  const confirmDiscard = () => {
    setDiscardOpen(false);
    onExit();
  };

  return {
    draft, set, derived, errors, errorList, isEdit, existing, dirty, blockLeave, unitsLocked, unitNotice,
    advancedOpen, setAdvancedOpen, otherOpen, setOtherOpen,
    categories, brands, units, createCategory, createBrand, createUnit,
    changeKind, changeUnit, setMultiUnit, addUnitLevel, updateUnitLevel, removeUnitLevel, changePriceUnit, changeStockUnit,
    save, revealError, saveError, discardOpen, setDiscardOpen, requestExit, confirmDiscard
  };
}

export type AddProductForm = ReturnType<typeof useAddProductForm>;
