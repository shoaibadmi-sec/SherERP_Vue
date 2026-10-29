import type {
  SerialTrackingMode, StockAllocationMethod, WarrantyDurationUnit, WarrantyType
} from '../types/erp';

export const warrantyUnitOptions: { value: WarrantyDurationUnit; en: string; bn: string }[] = [
  { value: 'Days', en: 'Days', bn: 'দিন' },
  { value: 'Months', en: 'Months', bn: 'মাস' },
  { value: 'Years', en: 'Years', bn: 'বছর' }
];

export const warrantyTypeOptions: { value: WarrantyType; en: string; bn: string }[] = [
  { value: 'Seller', en: 'Seller (our shop)', bn: 'বিক্রেতা (আমাদের দোকান)' },
  { value: 'Manufacturer', en: 'Manufacturer', bn: 'প্রস্তুতকারক' },
  { value: 'Service', en: 'Service', bn: 'সার্ভিস' },
  { value: 'Replacement', en: 'Replacement', bn: 'বদলি' }
];

export const serialModeOptions: { value: SerialTrackingMode; en: string; bn: string; hintEn: string; hintBn: string }[] = [
  { value: 'Off', en: 'Off', bn: 'বন্ধ', hintEn: 'No serial numbers for this product.', hintBn: 'এই পণ্যে সিরিয়াল নম্বর লাগবে না।' },
  { value: 'Optional', en: 'Optional', bn: 'ঐচ্ছিক', hintEn: 'Add serials when you have them.', hintBn: 'থাকলে সিরিয়াল যোগ করুন।' },
  { value: 'Required', en: 'Required', bn: 'আবশ্যক', hintEn: 'Every unit needs its own serial when bought or sold.', hintBn: 'কেনা-বেচায় প্রতিটির সিরিয়াল লাগবে।' }
];

export const allocationOptions: { value: StockAllocationMethod; en: string; bn: string; hintEn: string; hintBn: string }[] = [
  { value: 'FIFO', en: 'Oldest first', bn: 'আগে আসা আগে', hintEn: 'FIFO: stock that came in first is sold first.', hintBn: 'FIFO: আগে আসা স্টক আগে বিক্রি হবে।' },
  { value: 'FEFO', en: 'Expiry first', bn: 'মেয়াদ আগে', hintEn: 'FEFO: stock that expires soonest is sold first.', hintBn: 'FEFO: যার মেয়াদ আগে শেষ, সেটি আগে বিক্রি হবে।' }
];
