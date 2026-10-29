import { useEffect, useMemo, useState } from 'react';
import { ScanLine, X } from 'lucide-react';
import { Button } from '../Button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../Dialog';
import { Input } from '../Input';
import type { Product } from '../../types/erp';
import { duplicateSerials, normalizeSerials } from '../../utils/productFeatures';

export function SerialPickerDialog({
  product,
  open,
  onOpenChange,
  eligible,
  selected,
  required,
  maxCount,
  blocked,
  onSave
}: {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eligible: string[];
  selected: string[];
  required: number;
  maxCount: number;
  blocked: string[];
  onSave: (serials: string[]) => void;
}) {
  const [values, setValues] = useState<string[]>([]);
  const [scan, setScan] = useState('');
  const [paste, setPaste] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setValues(selected);
    setScan('');
    setPaste('');
    setError('');
  }, [open, selected]);

  const available = useMemo(
    () => eligible.filter((serial) => !blocked.includes(serial) || values.includes(serial)),
    [eligible, blocked, values]
  );

  const addSerials = (incoming: string[]) => {
    const ineligible = incoming.find((serial) => !eligible.includes(serial) && !selected.includes(serial));
    if (ineligible) return setError(`Serial is not eligible stock: ${ineligible}`);
    const next = [...values, ...incoming.filter((serial) => !values.includes(serial))];
    const duplicates = duplicateSerials(next, blocked.filter((serial) => !values.includes(serial)));
    if (duplicates.length) return setError(`Serial already selected elsewhere: ${duplicates[0]}`);
    if (next.length > maxCount) return setError(`This line can use at most ${maxCount} serials.`);
    setValues(next);
    setError('');
  };

  const scanOne = () => {
    const serial = scan.trim();
    if (!serial) return;
    if (!eligible.includes(serial) && !selected.includes(serial)) return setError('This serial is not eligible stock for this product.');
    addSerials([serial]);
    setScan('');
  };

  const save = () => {
    if (required > 0 && values.length !== required) return setError(`Select exactly ${required} serials before completing this line.`);
    onSave(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl scrollbar-thin">
        <DialogHeader>
          <DialogTitle>Serial numbers <span className="font-bn text-sm font-normal text-ink-500">· সিরিয়াল নম্বর</span></DialogTitle>
          <DialogDescription>{product.name} · {values.length} selected{required ? ` / ${required} required` : ` / up to ${maxCount}`}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative min-w-0 flex-1">
              <ScanLine className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
              <Input
                value={scan}
                onChange={(e) => setScan(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); scanOne(); } }}
                placeholder="Scan or type serial"
                className="pl-8"
                autoFocus
              />
            </div>
            <Button variant="outline" onClick={scanOne}>Add</Button>
          </div>

          <div>
            <p className="mb-1.5 text-[12px] font-medium text-ink">Paste multiple <span className="font-bn text-[11px] font-normal text-ink-400">· একসাথে পেস্ট</span></p>
            <textarea value={paste} onChange={(e) => setPaste(e.target.value)} placeholder={"SN-001\nSN-002"} className="min-h-20 w-full rounded-md border border-input bg-card px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20" />
            <button type="button" className="mt-1 text-xs font-medium text-teal-700 hover:underline" onClick={() => { addSerials(normalizeSerials(paste)); setPaste(''); }}>Add pasted serials</button>
          </div>

          <div>
            <p className="mb-2 text-[12px] font-medium text-ink">Eligible serials <span className="text-ink-400">({available.length})</span></p>
            <div className="max-h-44 overflow-y-auto rounded-lg border border-border p-1">
              {available.map((serial) => {
                const checked = values.includes(serial);
                return <button key={serial} type="button" onClick={() => checked ? setValues((items) => items.filter((item) => item !== serial)) : addSerials([serial])} className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs ${checked ? 'bg-teal-50 text-teal-800' : 'text-ink-600 hover:bg-ink-50'}`}><span>{serial}</span><span>{checked ? 'Selected' : 'Available'}</span></button>;
              })}
              {!available.length && <p className="px-2 py-5 text-center text-xs text-ink-500">No eligible serials available.</p>}
            </div>
          </div>

          {values.length > 0 && <div className="flex flex-wrap gap-1.5">
            {values.map((serial) => <span key={serial} className="inline-flex items-center gap-1 rounded-md bg-ink-50 px-2 py-1 text-xs text-ink-700">{serial}<button type="button" onClick={() => setValues((items) => items.filter((item) => item !== serial))}><X className="size-3" /></button></span>)}
          </div>}

          {error && <p className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">{error}</p>}
        </div>

        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={save}>Use serials</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

