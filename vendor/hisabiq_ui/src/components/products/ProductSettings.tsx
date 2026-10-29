import { MotionTabList, MotionTabIndicator } from '../../motion/MotionTabList';
import { Link, useSearchParams } from 'react-router-dom';
import { useTenantSettings } from '../../settings/TenantSettingsProvider';
import React, { useState } from 'react';
import { MoreHorizontal, Plus, Ruler, Settings2, Tags } from 'lucide-react';
import { toast } from 'sonner';
import {
  availableProductCategories, availableProductBrands, availableProductUnits,
  createPreviewProductCategory, createPreviewProductBrand, createPreviewProductUnit
} from '../../data/erpDemoStore';
import { Button } from '../Button';
import { Input } from '../Input';
import { StatusBadge } from '../StatusBadge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../Table';
import { FloatingPanel } from '../layout/FloatingPanel';
import {useUiCopy} from '../../i18n/useUiCopy';
import {productFormLabel} from '../../i18n/productFormsCopy';

type SettingsTab = 'categories' | 'units' | 'brands' | 'defaults';

type NamedSetting = {
  id: string;
  name: string;
  nameBn?: string;
  usage: number;
  active: boolean;
};

type UnitSetting = NamedSetting & {
  symbol: string;
  kind: 'Base' | 'Compound-ready';
};

const initialCategories: NamedSetting[] = [
  { id: 'cat-1', name: 'Plumbing', nameBn: 'প্লাম্বিং', usage: 3, active: true },
  { id: 'cat-2', name: 'Electrical', nameBn: 'ইলেকট্রিক্যাল', usage: 3, active: true },
  { id: 'cat-3', name: 'Steel', nameBn: 'স্টিল', usage: 2, active: true },
  { id: 'cat-4', name: 'Building', nameBn: 'বিল্ডিং', usage: 1, active: true },
  { id: 'cat-5', name: 'Hardware', nameBn: 'হার্ডওয়্যার', usage: 4, active: true }
];

const initialUnits: UnitSetting[] = [
  { id: 'u-1', name: 'Piece', symbol: 'Pcs', kind: 'Compound-ready', usage: 6, active: true },
  { id: 'u-2', name: 'Gira', symbol: 'Gira', kind: 'Compound-ready', usage: 1, active: true },
  { id: 'u-3', name: 'Kilogram', symbol: 'Kg', kind: 'Base', usage: 2, active: true },
  { id: 'u-4', name: 'Feet', symbol: 'Ft', kind: 'Compound-ready', usage: 0, active: true },
  { id: 'u-5', name: 'Bag', symbol: 'Bag', kind: 'Base', usage: 1, active: true },
  { id: 'u-6', name: 'Coil', symbol: 'Coil', kind: 'Base', usage: 1, active: true },
  { id: 'u-7', name: 'Pair', symbol: 'Pair', kind: 'Base', usage: 1, active: true },
  { id: 'u-8', name: 'Litre', symbol: 'L', kind: 'Base', usage: 0, active: true }
];

const initialBrands: NamedSetting[] = [
  { id: 'br-1', name: 'RFL', nameBn: 'আরএফএল', usage: 2, active: true },
  { id: 'br-2', name: 'Vision', nameBn: 'ভিশন', usage: 1, active: true },
  { id: 'br-3', name: 'Shah Cement', nameBn: 'শাহ সিমেন্ট', usage: 1, active: true },
  { id: 'br-4', name: 'Generic / No brand', nameBn: 'ব্র্যান্ড নেই', usage: 9, active: true }
];

function SettingActions({
  label,
  active,
  onToggle,
  onDelete
}: {
  label: string;
  active: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const {language}=useUiCopy();
  const pl=(english:string)=>productFormLabel(language,english);
  return (
    <FloatingPanel
      label={`${pl('Actions for')} ${label}`}
      width={180}
      trigger={({ toggle, open }) => (
        <button
          onClick={toggle}
          aria-expanded={open}
          aria-label={`${pl('Actions for')} ${label}`}
          className="rounded-md p-1.5 text-ink-400 hover:bg-ink-50 hover:text-ink">
          <MoreHorizontal className="size-4" />
        </button>
      )}>
      {(close) => (
        <div className="py-1">
          <button
            onClick={() => { close(); onToggle(); }}
            className="w-full px-3 py-2 text-left text-[13px] text-ink-700 hover:bg-ink-50">
            {pl(active ? 'Deactivate' : 'Activate')}
          </button>
          <button
            onClick={() => { close(); onDelete(); }}
            className="w-full px-3 py-2 text-left text-[13px] text-danger hover:bg-danger-bg">
            {pl('Delete')}
          </button>
        </div>
      )}
    </FloatingPanel>
  );
}

export function ProductSettings() {
  const {language}=useUiCopy();
  const pl=(english:string)=>productFormLabel(language,english);
  const [searchParams] = useSearchParams();
  const { state } = useTenantSettings();
  const [tab, setTab] = useState<SettingsTab>(() => ['categories','units','brands'].includes(searchParams.get('tab') || '') ? searchParams.get('tab') as SettingsTab : 'categories');
  const [categories, setCategories] = useState<NamedSetting[]>(() => [
    ...initialCategories,
    ...availableProductCategories().filter((name) =>
      name !== 'All' && !initialCategories.some((item) => item.name.toLowerCase() === name.toLowerCase()))
      .map((name, index) => ({ id: 'cat-preview-' + index, name, usage: 0, active: true }))
  ]);
  const [units, setUnits] = useState<UnitSetting[]>(() => [
    ...initialUnits,
    ...availableProductUnits().filter((unit) => !initialUnits.some((item) =>
      item.symbol.toLowerCase() === unit.symbol.toLowerCase()))
      .map((unit, index) => ({ id: 'unit-preview-' + index, name: unit.name, symbol: unit.symbol, kind: 'Compound-ready' as const, usage: 0, active: true }))
  ]);
  const [brands, setBrands] = useState<NamedSetting[]>(() => [
    ...initialBrands,
    ...availableProductBrands().filter((name) => !initialBrands.some((item) =>
      item.name.toLowerCase() === name.toLowerCase()))
      .map((name, index) => ({ id: 'brand-preview-' + index, name, usage: 0, active: true }))
  ]);
  const [newName, setNewName] = useState('');
  const [newBn, setNewBn] = useState('');
  const [newSymbol, setNewSymbol] = useState('');

  const clearNew = () => {
    setNewName('');
    setNewBn('');
    setNewSymbol('');
  };

  const addNamed = () => {
    if (!newName.trim()) return;
    if (tab === 'categories') {
      createPreviewProductCategory(newName.trim());
      setCategories((items) => [...items, {
        id: `cat-${Date.now()}`,
        name: newName.trim(),
        ...(newBn.trim() ? { nameBn: newBn.trim() } : {}),
        usage: 0,
        active: true
      }]);
    } else if (tab === 'brands') {
      createPreviewProductBrand(newName.trim());
      setBrands((items) => [...items, {
        id: `br-${Date.now()}`,
        name: newName.trim(),
        ...(newBn.trim() ? { nameBn: newBn.trim() } : {}),
        usage: 0,
        active: true
      }]);
    } else if (tab === 'units') {
      createPreviewProductUnit(newName.trim(), newSymbol.trim() || newName.trim());
      setUnits((items) => [...items, {
        id: `u-${Date.now()}`,
        name: newName.trim(),
        symbol: newSymbol.trim() || newName.trim(),
        kind: 'Compound-ready',
        usage: 0,
        active: true
      }]);
    }
    toast.success(`${newName.trim()} ${pl('Add')}`);
    clearNew();
  };

  const tabs: Array<[SettingsTab, string, React.ElementType]> = [
    ['categories', 'Categories', Tags],
    ['units', 'Units', Ruler],
    ['brands', 'Brands', Tags],
    ['defaults', 'Defaults', Settings2]
  ];

  return (
    <div>
      <MotionTabList className="flex flex-nowrap gap-1 overflow-x-auto border-b border-border px-3 scrollbar-thin" role="tablist">
        {tabs.map(([id, label, Icon]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => { setTab(id); clearNew(); }}
            className={`flex shrink-0 items-center gap-1.5 px-2.5 py-2.5 text-[13px] font-medium ${tab === id ? 'text-ink' : 'text-ink-500 hover:text-ink'}`}>
            <Icon className="size-3.5" /> {pl(label)}
          <MotionTabIndicator active={tab === id} /></button>
        ))}
      </MotionTabList>

      {tab !== 'defaults' && (
        <div className="flex flex-col gap-2 border-b border-border bg-ink-50/40 p-3 lg:flex-row lg:items-end">
          <label className="min-w-0 flex-1 text-[12px] font-medium text-ink lg:max-w-xs">
            {pl(tab === 'categories' ? 'Category name' : tab === 'brands' ? 'Brand name' : 'Unit name')}
            <Input className="mt-1" value={newName} onChange={(event) => setNewName(event.target.value)} placeholder={pl(tab === 'units' ? 'e.g. Meter' : 'Enter name')} />
          </label>
          {tab !== 'units' && (
            <label className="min-w-0 flex-1 text-[12px] font-medium text-ink lg:max-w-xs">
              {pl('Bangla name')}
              <Input className="font-bn mt-1" value={newBn} onChange={(event) => setNewBn(event.target.value)} placeholder="বাংলা নাম (ঐচ্ছিক)" />
            </label>
          )}
          {tab === 'units' && (
            <label className="w-full text-[12px] font-medium text-ink lg:w-36">
              {pl('Symbol')}
              <Input className="mt-1" value={newSymbol} onChange={(event) => setNewSymbol(event.target.value)} placeholder={pl("e.g. m")} />
            </label>
          )}
          <Button size="sm" onClick={addNamed} disabled={!newName.trim()}>
            <Plus className="size-4" /> {pl("Add")}
          </Button>
        </div>
      )}

      {tab === 'categories' && (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-9 pl-4 text-xs">{pl('Category')}</TableHead>
              <TableHead className="h-9 text-xs">{pl('Bangla')}</TableHead>
              <TableHead className="h-9 text-right text-xs">{pl('Products')}</TableHead>
              <TableHead className="h-9 text-xs">{pl('Status')}</TableHead>
              <TableHead className="h-9 pr-4 text-right text-xs">{pl('Action')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((item) => (
              <TableRow key={item.id} className="text-[13px]">
                <TableCell className="py-2 pl-4 font-medium text-ink">{item.name}</TableCell>
                <TableCell className="font-bn py-2 text-ink-600">{item.nameBn ?? '—'}</TableCell>
                <TableCell className="py-2 text-right">{item.usage}</TableCell>
                <TableCell className="py-2"><StatusBadge tone={item.active ? 'success' : 'neutral'} dot={item.active}>{pl(item.active ? 'Active' : 'Inactive')}</StatusBadge></TableCell>
                <TableCell className="py-2 pr-4 text-right">
                  <SettingActions
                    label={item.name}
                    active={item.active}
                    onToggle={() => setCategories((items) => items.map((value) => value.id === item.id ? { ...value, active: !value.active } : value))}
                    onDelete={() => item.usage > 0 ? toast.error(pl('Category is used by products')) : setCategories((items) => items.filter((value) => value.id !== item.id))}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {tab === 'units' && (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-9 pl-4 text-xs">{pl('Unit')}</TableHead>
              <TableHead className="h-9 text-xs">{pl('Symbol')}</TableHead>
              <TableHead className="h-9 text-xs">{pl('Use')}</TableHead>
              <TableHead className="h-9 text-right text-xs">{pl('Products')}</TableHead>
              <TableHead className="h-9 text-xs">{pl('Status')}</TableHead>
              <TableHead className="h-9 pr-4 text-right text-xs">{pl('Action')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {units.map((item) => (
              <TableRow key={item.id} className="text-[13px]">
                <TableCell className="py-2 pl-4 font-medium text-ink">{item.name}</TableCell>
                <TableCell className="py-2 text-ink-600">{item.symbol}</TableCell>
                <TableCell className="py-2"><StatusBadge tone={item.kind === 'Compound-ready' ? 'teal' : 'neutral'}>{pl(item.kind)}</StatusBadge></TableCell>
                <TableCell className="py-2 text-right">{item.usage}</TableCell>
                <TableCell className="py-2"><StatusBadge tone={item.active ? 'success' : 'neutral'} dot={item.active}>{pl(item.active ? 'Active' : 'Inactive')}</StatusBadge></TableCell>
                <TableCell className="py-2 pr-4 text-right">
                  <SettingActions
                    label={item.name}
                    active={item.active}
                    onToggle={() => setUnits((items) => items.map((value) => value.id === item.id ? { ...value, active: !value.active } : value))}
                    onDelete={() => item.usage > 0 ? toast.error(pl('Unit is used by products')) : setUnits((items) => items.filter((value) => value.id !== item.id))}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {tab === 'brands' && (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-9 pl-4 text-xs">{pl('Brand')}</TableHead>
              <TableHead className="h-9 text-xs">{pl('Bangla')}</TableHead>
              <TableHead className="h-9 text-right text-xs">{pl('Products')}</TableHead>
              <TableHead className="h-9 text-xs">{pl('Status')}</TableHead>
              <TableHead className="h-9 pr-4 text-right text-xs">{pl('Action')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {brands.map((item) => (
              <TableRow key={item.id} className="text-[13px]">
                <TableCell className="py-2 pl-4 font-medium text-ink">{item.name}</TableCell>
                <TableCell className="font-bn py-2 text-ink-600">{item.nameBn ?? '—'}</TableCell>
                <TableCell className="py-2 text-right">{item.usage}</TableCell>
                <TableCell className="py-2"><StatusBadge tone={item.active ? 'success' : 'neutral'} dot={item.active}>{pl(item.active ? 'Active' : 'Inactive')}</StatusBadge></TableCell>
                <TableCell className="py-2 pr-4 text-right">
                  <SettingActions
                    label={item.name}
                    active={item.active}
                    onToggle={() => setBrands((items) => items.map((value) => value.id === item.id ? { ...value, active: !value.active } : value))}
                    onDelete={() => item.usage > 0 ? toast.error(pl('Brand is used by products')) : setBrands((items) => items.filter((value) => value.id !== item.id))}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {tab === 'defaults' && <div className="space-y-3 p-4"><h3 className="text-sm font-semibold text-ink">{pl("Business product defaults")}</h3><p className="text-sm text-ink-600"> {pl("Base unit:")} {state.sections.products.defaultUnit} · {pl("Serial tracking:")} {state.sections.products.serial} · {pl("Lot allocation:")} {state.sections.products.allocation}</p><p className="text-xs text-ink-500">{pl("Product defaults are shared with Business settings. Existing products keep their own units and conversions.")}</p><Link className="inline-flex rounded-md border border-input bg-card px-3 py-2 text-sm text-ink" to="/app/settings/products">{pl("Configure product defaults →")}</Link></div>}
    </div>
  );
}

