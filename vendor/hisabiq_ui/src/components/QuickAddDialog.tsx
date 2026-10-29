import { useState, type FormEvent } from 'react';
import { PlusIcon } from 'lucide-react';
import { Button } from './Button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './Dialog';
import { Input } from './Input';
import { useFormCopy } from '../hooks/useFormCopy';
import type { Copy } from '../types/productForm';

type QuickAddOption = { value: string; label: string };

type QuickAddDialogProps = {
  noun: Copy;
  initialName: string;
  placeholder?: string;
  nameLabel?: string;
  withSymbol?: boolean;
  showContact?: boolean;
  existing: QuickAddOption[];
  onClose: () => void;
  onCreate: (name: string, symbol: string, phone?: string, area?: string) => void;
  onSelectExisting: (value: string) => void;
};

/** Creates a brand/category/unit without leaving the product form; the main draft is untouched. */
export function QuickAddDialog({ noun, initialName, placeholder, nameLabel, withSymbol = false, showContact = false, existing, onClose, onCreate, onSelectExisting }: QuickAddDialogProps) {
  const { t } = useFormCopy();
  const [name, setName] = useState(initialName);
  const [symbol, setSymbol] = useState('');
  const [phone, setPhone] = useState('');
  const [area, setArea] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [match, setMatch] = useState<QuickAddOption | null>(null);
  const control = 'h-[var(--ctl-h)] text-[length:var(--ctl-fs)]';

  const submit = (event: FormEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const trimmed = name.trim();
    if (!trimmed) {
      setMatch(null);
      setError(withSymbol ? t('Enter the unit name.', 'এককের নাম লিখুন।') : t(`Enter the ${noun.en} name.`, `${noun.bn}-এর নাম লিখুন।`));
      return;
    }
    const code = withSymbol ? symbol.trim() || trimmed : trimmed;
    const found = existing.find((option) => [trimmed, code].some((entry) =>
      option.value.toLowerCase() === entry.toLowerCase() || option.label.toLowerCase() === entry.toLowerCase()));
    if (found) {
      setMatch(found);
      setError(t(`“${found.label}” is already in the list.`, `“${found.label}” তালিকায় আগেই আছে।`));
      return;
    }
    try { onCreate(trimmed, withSymbol ? symbol.trim() : '', phone.trim(), area.trim()); }
    catch (cause) { setError(cause instanceof Error ? cause.message : t('Could not create this item.', 'যোগ করা যায়নি।')); }
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="pr-8 text-left">
          <DialogTitle className="text-[17px]">{t(`New ${noun.en}`, `নতুন ${noun.bn}`)}</DialogTitle>
          <DialogDescription>
            {t('The new item will be selected. What you typed in the form stays as it is.',
              'নতুন তথ্যটি বেছে নেওয়া হবে। ফর্মে যা লিখেছেন তা যেমন আছে থাকবে।')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} noValidate className="product-form space-y-4">
          <div>
            <label htmlFor="qa-name" className="mb-1.5 block text-[length:var(--label-fs)] font-medium text-ink">
              {nameLabel ?? (withSymbol ? t('Unit name', 'এককের নাম') : t('Name', 'নাম'))}
            </label>
            <Input
              id="qa-name"
              autoFocus
              data-autofocus
              autoComplete="off"
              value={name}
              onChange={(event) => { setName(event.target.value); setError(null); setMatch(null); }}
              placeholder={placeholder ?? (withSymbol ? t('e.g. Dozen', 'যেমন ডজন') : t(`e.g. ${noun.en === 'brand' ? 'Energypac' : 'Plumbing'}`, 'নাম লিখুন'))}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? 'qa-error' : undefined}
              className={control + (error ? ' !border-danger' : '')}
            />
          </div>
          {withSymbol && (
            <div>
              <label htmlFor="qa-symbol" className="mb-1.5 block text-[length:var(--label-fs)] font-medium text-ink">
                {t('Short name', 'সংক্ষিপ্ত নাম')}
              </label>
              <Input
                id="qa-symbol"
                autoComplete="off"
                value={symbol}
                onChange={(event) => { setSymbol(event.target.value); setError(null); setMatch(null); }}
                placeholder={t('e.g. Dz', 'যেমন Dz')}
                aria-describedby="qa-symbol-hint"
                className={control}
              />
              <p id="qa-symbol-hint" className="mt-1.5 text-[13px] text-ink-500">
                {t('Shown on receipts and stock. Leave empty to use the unit name.', 'রসিদ ও স্টকে দেখাবে। খালি রাখলে এককের নাম ব্যবহার হবে।')}
              </p>
            </div>
          )}
          {showContact && (
            <>
              <div><label htmlFor="qa-phone" className="mb-1.5 block text-sm font-medium text-ink">{t('Phone', 'ফোন')}</label>
                <Input id="qa-phone" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="01XXXXXXXXX" className={control} /></div>
              <div><label htmlFor="qa-area" className="mb-1.5 block text-sm font-medium text-ink">{t('Address / area', 'ঠিকানা / এলাকা')}</label>
                <Input id="qa-area" value={area} onChange={(event) => setArea(event.target.value)} placeholder={t('Optional', 'ঐচ্ছিক')} className={control} /></div>
            </>
          )}
          {error && (
            <div id="qa-error" role="alert" className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] font-medium text-danger">
              <span>{error}</span>
              {match && (
                <button type="button" onClick={() => onSelectExisting(match.value)} className="font-semibold text-primary underline underline-offset-2">
                  {t('Use it', 'এটি ব্যবহার করুন')}
                </button>
              )}
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} className="h-[var(--ctl-h)]">{t('Cancel', 'বাতিল')}</Button>
            <Button type="submit" className="h-[var(--ctl-h)]">
              <PlusIcon className="size-4" aria-hidden="true" />
              {t(`Add ${noun.en}`, `${noun.bn} যোগ করুন`)}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
