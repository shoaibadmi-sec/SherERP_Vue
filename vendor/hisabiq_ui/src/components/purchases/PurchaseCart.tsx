import {NumericInput} from '../NumericInput';
import React from 'react';
import { ChevronDown, ChevronUp, PackagePlus, Plus, ScanLine, Trash2 } from 'lucide-react';
import { Button } from '../Button';
import { FormSelect } from '../FormSelect';
import { AppSelect } from '../AppSelect';
import { Input } from '../Input';
import { ProductThumb } from '../ProductThumb';
import { ProductCombobox } from '../pos/ProductCombobox';
import { CompoundQuantityInput } from '../transactions/CompoundQuantityInput';
import {MultiUnitQuantityInput} from '../transactions/MultiUnitQuantityInput';
import { formatStock, unitsFor } from '../../utils/units';
import { taka } from '../../utils/currency';
import { normalizeCompoundQuantity } from '../../utils/posQuantity';
import { normalizeSerials, requiredSerialCount } from '../../utils/productFeatures';
import {
  baseQty, selectedConversion, describeQty, lineAmount, lotBaseSellPrice,
  priceInUnit, rounded, type PurchaseCartLine
} from '../../utils/purchaseCart';
import type { Product } from '../../types/erp';

type Props = {
  sourceLocked?: boolean;
  lines: PurchaseCartLine[];
  products: Product[];
  searchRef: React.RefObject<HTMLInputElement>;
  qtyRefs: React.MutableRefObject<Record<string, HTMLInputElement | null>>;
  smallRefs: React.MutableRefObject<Record<string, HTMLInputElement | null>>;
  costRefs: React.MutableRefObject<Record<string, HTMLInputElement | null>>;
  lotPriceRefs: React.MutableRefObject<Record<string, HTMLInputElement | null>>;
  onAdd: (product: Product) => void;
  onCreate: () => void;
  onUpdate: (id: string, patch: Partial<PurchaseCartLine>) => void;
  onRemove: (id: string) => void;
  onCostUnitChange: (line: PurchaseCartLine, unit: string) => void;
};

const grid = 'grid min-w-0 grid-cols-[24px_minmax(165px,1fr)_166px_84px_105px_120px_100px_28px] items-center gap-1.5';
const entryInput = 'h-9 w-full min-w-0 rounded-md border border-input bg-card px-2 text-right text-[13px] text-ink outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20';
const unitOptions = unitsFor;

export function PurchaseCart({
  sourceLocked=false, lines, products, searchRef, qtyRefs, smallRefs, costRefs, lotPriceRefs, onAdd, onCreate, onUpdate, onRemove, onCostUnitChange
}: Props) {
  const quickItems = products.filter((p) => p.active && p.kind !== 'Service').slice(0, 8);

  const normalizeQty = (line: PurchaseCartLine, moveToSearch: boolean) => {
    if (selectedConversion(line) > 1) {
      const normalized = normalizeCompoundQuantity(line.bigQty, line.smallQty, selectedConversion(line));
      onUpdate(line.id, { bigQty: normalized.primaryQty, smallQty: normalized.secondaryQty });
    }
    if (moveToSearch) searchRef.current?.focus();
  };

  const changeLotSellUnit = (line: PurchaseCartLine, unit: string) => {
    const inUnit = priceInUnit(lotBaseSellPrice(line), line.product, unit);
    onUpdate(line.id, { lotSellUnit: unit, lotSellPrice: String(Math.round(inUnit * 10000) / 10000) });
  };

  return (
    <>
      <section data-cart-kind="purchase" className="min-w-0 rounded-xl border border-border bg-card shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2.5">
          <div>
            <p className="text-[13px] font-semibold text-ink">Purchase cart <span data-table-helper="" className="font-bn text-[11px] font-normal text-ink-400">· ক্রয়ের পণ্য</span></p>
            <p data-table-helper="" className="text-[11px] text-ink-500">Add products inline, same as POS · 2 Box 5 Pcs / 1 Gauge 12 Gira</p>
          </div>
          <Button disabled={sourceLocked} size="sm" variant="outline" onClick={onCreate}>
            <PackagePlus className="size-4" /> New product <span data-table-helper="" className="font-bn text-[11px] font-normal">· নতুন পণ্য</span>
          </Button>
        </div>

        <div className="min-w-0 overflow-x-auto">
          <div data-cart-header className={grid + ' border-b border-border px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-ink-400'}>
            <span className="text-right">#</span><span>Product</span><span className="text-right">Quantity</span>
            <span>Cost in</span><span className="text-right">Unit cost</span><span className="text-right">Lot sale</span><span className="text-right">Total</span><span aria-hidden="true" />
          </div>
          <div data-testid="purchase-cart" className="divide-y divide-border">
            {lines.map((line, index) => {
              const product = line.product;
              const count = normalizeSerials(line.serialText).length;
              const required = requiredSerialCount(product, baseQty(line));
              const showSerials = product.serialTracking !== undefined && product.serialTracking !== 'Off' || Boolean(product.warranty?.enabled);
              const showExpiry = Boolean(product.expiry?.enabled);
              return (
                <div key={line.id} data-testid="purchase-cart-row" className="bg-card">
                  <div data-cart-row="purchase" data-compound={selectedConversion(line)>1} className={grid + ' px-3 py-1.5'}>
                    <span className="text-right text-[13px] text-ink-400">{index + 1}.</span>
                    <div className="flex min-w-0 items-center gap-2.5">
                      <ProductThumb src={product.image} size={34} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium text-ink">{product.name}</p>
                        <p data-table-helper="" className="truncate text-[11px] text-ink-500"><span className="font-bn">{product.nameBn}</span>{product.nameBn ? ' · ' : ''}{product.category} · Stock {formatStock(product)}</p>
                        <button
                          type="button"
                          onClick={() => onUpdate(line.id, { detailsOpen: !line.detailsOpen })}
                          aria-expanded={line.detailsOpen}
                          className="mt-1 inline-flex min-w-0 max-w-full items-center gap-1 overflow-hidden whitespace-nowrap rounded bg-ink-50 px-1.5 py-0.5 text-[10.5px] text-ink-600 hover:bg-teal-50 hover:text-teal-700">
                          {showSerials ? <ScanLine className="size-3" /> : <ChevronDown className="size-3" />}
                          {showSerials ? 'Serials ' + count + '/' + Math.max(required, Math.ceil(baseQty(line))) + ' · ' : ''}
                          Lot sale {taka(lotBaseSellPrice(line))}/{product.unit}
                          <span className="sr-only"> · Lot details for {product.name}</span>
                          {line.detailsOpen ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                        </button>
                      </div>
                    </div>
                    <div data-cart-field="Quantity · পরিমাণ">{product.unitRelations && product.unitRelations.length>1 ?
                      <MultiUnitQuantityInput product={product} quantities={line.unitQuantities??{[line.costUnit]:line.bigQty,[product.unit]:line.smallQty}}
                        primaryRef={node=>{qtyRefs.current[line.id]=node;}} disabled={sourceLocked}
                        onChange={unitQuantities=>onUpdate(line.id,{unitQuantities})}
                        onLastEnter={()=>{costRefs.current[line.id]?.focus();costRefs.current[line.id]?.select();}}/>
                      : <CompoundQuantityInput key={line.costUnit} product={product} unit={line.costUnit}
                      primary={selectedConversion(line)>1?line.bigQty:line.smallQty}
                      secondary={line.smallQty}
                      primaryRef={node=>{qtyRefs.current[line.id]=node;}}
                      secondaryRef={node=>{smallRefs.current[line.id]=node;}}
                      primaryLabel={selectedConversion(line)>1?
                        line.costUnit+' quantity for '+product.name:'Quantity for '+product.name}
                      secondaryLabel={product.unit+' quantity for '+product.name}
                      onPrimaryChange={value=>onUpdate(line.id,
                       selectedConversion(line)>1?{bigQty:value}:{smallQty:value})}
                      onSecondaryChange={value=>onUpdate(line.id,{smallQty:value})}
                      onPrimaryEnter={()=>{
                       if(selectedConversion(line)>1){
                        smallRefs.current[line.id]?.focus();smallRefs.current[line.id]?.select();
                       }else{costRefs.current[line.id]?.focus();costRefs.current[line.id]?.select();}
                      }}
                      onSecondaryBlur={()=>normalizeQty(line,false)}
                      onSecondaryEnter={()=>{
                       normalizeQty(line,false);
                       costRefs.current[line.id]?.focus();costRefs.current[line.id]?.select();
                      }}/>}</div>
                    <div data-cart-field="Cost in · একক">{unitOptions(product).length > 1 ? (
                      unitOptions(product).length > 2 ? (
                        <AppSelect label={'Unit for ' + product.name} value={line.costUnit}
                          options={unitOptions(product)} onChange={(unit) => onCostUnitChange(line, unit)} />
                      ) : (
                      <div className="flex h-9 rounded-md bg-ink-50 p-0.5" role="radiogroup" aria-label={'Unit for ' + product.name}>
                        {unitOptions(product).map((unit) => (
                          <button key={unit} type="button" role="radio" aria-checked={line.costUnit === unit}
                            onClick={() => onCostUnitChange(line, unit)}
                            className={'flex-1 rounded px-1 text-xs font-medium transition-colors ' +
                              (line.costUnit === unit ? 'bg-card text-ink shadow-card ring-1 ring-primary' : 'text-ink-500 hover:text-ink')}>
                            {unit}
                          </button>
                        ))}
                      </div>
                      )
                    ) : <span className="px-2 text-sm text-ink-600">{product.unit}</span>}</div>
                    <div data-cart-field="Unit cost · ক্রয়মূল্য"><div className="relative">
                      <span data-table-helper="" className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[11px] text-ink-400">৳</span>
                      <NumericInput ref={(node) => { costRefs.current[line.id] = node; }}
                        aria-label={'Purchase cost for ' + product.name} inputMode="decimal" value={line.cost} readOnly={sourceLocked}
                        className={entryInput + ' pl-5'}
                        onChange={(event) => onUpdate(line.id, { cost: event.target.value.replace(/[^\d.]/g, '') })}
                        onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); lotPriceRefs.current[line.id]?.focus(); lotPriceRefs.current[line.id]?.select(); } }} />
                    </div></div>
                    <div data-cart-field="Lot sale · বিক্রয়মূল্য"><div className="relative">
                      <span data-table-helper="" className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[11px] text-ink-400">৳</span>
                      <NumericInput stepperInset={48}
                        ref={(node) => { lotPriceRefs.current[line.id] = node; }}
                        aria-label={'Lot selling price for ' + product.name}
                        inputMode="decimal"
                        value={line.lotSellPrice} readOnly={sourceLocked}
                        className={entryInput + ' pl-5 pr-12'}
                        onChange={(event) => onUpdate(line.id, { lotSellPrice: event.target.value.replace(/[^\d.]/g, '') })}
                        onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); searchRef.current?.focus(); } }}
                      />
                      <span data-table-helper="" className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-ink-400">{line.lotSellUnit}</span>
                    </div></div>
                    <span data-cart-field="Total · মোট" className="text-right text-[13px] font-semibold text-ink">{taka(lineAmount(line))}</span>
                    <button type="button" aria-label={'Remove ' + product.name} onClick={() => onRemove(line.id)}
                      className="flex size-8 items-center justify-center rounded-md text-ink-400 hover:bg-danger-bg hover:text-danger">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  {!sourceLocked && line.detailsOpen && (
                    <div className="border-t border-border/60 bg-ink-50/50 px-3 py-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p data-table-helper="" className="text-[12px] font-semibold text-ink">Purchase lot details <span className="font-bn font-normal text-ink-400">· লটের তথ্য</span></p>
                        <p data-table-helper="" className="text-[10.5px] text-ink-500">Lot price applies to this batch, not the product's default price</p>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="min-w-0">
                          <p data-table-helper="" className="mb-1 text-[11px] font-medium text-ink">Lot selling price unit <span className="font-bn text-ink-500">· বিক্রয় একক</span></p>
                          <FormSelect className="w-full [&>select]:text-xs"
                            value={line.lotSellUnit} options={unitOptions(product)}
                            onChange={(event) => changeLotSellUnit(line, event.target.value)} />
                          <p data-table-helper="" className="mt-1 text-[10.5px] text-ink-500">Base {taka(lotBaseSellPrice(line))}/{product.unit} · Cost {taka(lineAmount(line))} total</p>
                        </div>
                        <label className="block min-w-0 text-[11px] font-medium text-ink">
                          Batch / lot number <span className="font-bn font-normal text-ink-400">· ব্যাচ</span>
                          <Input className="mt-1" value={line.batchNumber} onChange={(event) => onUpdate(line.id, { batchNumber: event.target.value })}
                            placeholder="Optional supplier batch" />
                        </label>
                        {showExpiry && (
                          <>
                            <label className="block text-[11px] font-medium text-ink">Manufacture date
                              <Input className="mt-1" type="date" value={line.manufactureDate} onChange={(event) => onUpdate(line.id, { manufactureDate: event.target.value })} />
                            </label>
                            <label className="block text-[11px] font-medium text-ink">
                              Expiry date {product.expiry?.dateRequired && <span className="text-danger">*</span>}
                              <Input className="mt-1" type="date" value={line.expiryDate} onChange={(event) => onUpdate(line.id, { expiryDate: event.target.value })} />
                            </label>
                          </>
                        )}
                        {showSerials && (
                          <label className="block text-[11px] font-medium text-ink sm:col-span-2 lg:col-span-3">
                            Warranty / inventory serials <span className="font-bn text-ink-500">· সিরিয়াল নম্বর</span>
                            <textarea
                              aria-label={'Serial numbers for ' + product.name}
                              className="mt-1 min-h-20 w-full rounded-md border border-input bg-card px-3 py-2 text-xs text-ink outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                              value={line.serialText}
                              placeholder="Scan, type or paste serial numbers · one per line or comma separated"
                              onChange={(event) => onUpdate(line.id, { serialText: event.target.value })}
                            />
                            <span data-table-helper="" className="mt-1 block text-[11px] font-normal text-ink-500">{count} entered · {required} mandatory · {baseQty(line)} base units purchased</span>
                          </label>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {!sourceLocked && <div data-testid="purchase-add-row" data-cart-add className={grid + ' bg-teal-50/35 px-3 py-2'}>
              <span className="text-right text-[13px] font-medium text-teal-700">{lines.length + 1}.</span>
              <ProductCombobox products={products} ref={searchRef} mode="purchase" onSelect={onAdd}
                onCreate={onCreate} ariaLabel="Search product to add to purchase" />
              <span data-table-helper="" className="pr-2 text-right text-[12px] text-ink-400">Qty</span>
              <span data-table-helper="" className="text-[12px] text-ink-400">Unit</span>
              <span data-table-helper="" className="text-right text-[12px] text-ink-400">Cost</span>
              <span data-table-helper="" className="text-right text-[12px] text-ink-400">Lot sale</span>
              <span data-table-helper="" className="text-right text-[12px] text-ink-400">Total</span><span />
            </div>}
          </div>
        </div>
        {lines.length === 0 && <p data-table-helper="" className="border-t border-border p-5 text-center text-[12px] text-ink-500">Search above or tap a quick item below. <span className="font-bn">পণ্য যোগ করুন।</span></p>}
        <div className="flex items-center justify-between gap-2 border-t border-border bg-ink-50/50 px-3 py-2.5 text-xs text-ink-500">
          <span>{lines.length} product line{lines.length === 1 ? '' : 's'}</span>
          <span className="font-medium text-ink">{lines.length ? describeQty(lines[lines.length - 1]) + ' · ' : ''}Subtotal {taka(rounded(lines.reduce((sum, line) => sum + lineAmount(line), 0)))}</span>
        </div>
      </section>

      {!sourceLocked && <section>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[13px] font-semibold text-ink">Quick items <span className="font-bn text-[11px] font-normal text-ink-400">· দ্রুত যোগ</span></p>
          <span className="text-[11px] text-ink-500">Tap to add · touch friendly</span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
          {quickItems.map((product) => (
            <button key={product.id} type="button" aria-label={'Quick add ' + product.name + ' ' + taka(product.purchasePrice) + '/' + product.unit}
              onClick={() => onAdd(product)}
              className="flex min-w-0 items-center gap-2 rounded-xl border border-border bg-card p-2.5 text-left shadow-xs transition-colors hover:border-teal-400 hover:bg-teal-50 active:bg-teal-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-500">
              <ProductThumb src={product.image} size={36} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12px] font-medium text-ink">{product.name}</span>{' '}
                <span className="block truncate text-[11px] text-ink-500">{taka(product.purchasePrice)}/{product.unit}</span>
              </span>
              <Plus className="size-4 shrink-0 text-ink-400" />
            </button>
          ))}
        </div>
      </section>}
    </>
  );
}
