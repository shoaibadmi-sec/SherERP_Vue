import {NumericInput} from '../NumericInput';
import {AppSelect} from '../AppSelect';
import {productUnitFactor} from '../../utils/unitChain';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import { AlertTriangle, Eye, GripVertical, ScanLine, X } from 'lucide-react';
import { ProductCombobox } from './ProductCombobox';
import { CompoundQuantityInput } from '../transactions/CompoundQuantityInput';
import {MultiUnitQuantityInput} from '../transactions/MultiUnitQuantityInput';
import {saleLineBaseQty,saleLineTotal,saleLineQuantities} from '../../utils/posMultiUnit';
import { ProductThumb } from '../ProductThumb';
import { SerialPickerDialog } from './SerialPickerDialog';
import { StockShortageDialog } from './StockShortageDialog';
import type { CartLine } from '../../hooks/usePosCart';
import type { Product } from '../../types/erp';
import { formatStock, unitsFor } from '../../utils/units';
import { formatNumber, taka } from '../../utils/currency';
import { normalizeCompoundQuantity } from '../../utils/posQuantity';
import { stockLots } from '../../data/productInventory';
import { salesInvoices } from '../../data/sales';
import { availableSerials, productStockBreakdown, requiredSerialCount } from '../../utils/productFeatures';
import { quantityFromBaseStock } from '../../utils/posStock';
import {allocatePosStock} from '../../vendor/vendorStock';
import { useUiCopy } from '../../i18n/useUiCopy';
import { usePreviewCatalog } from '../../bundles/usePreviewCatalog';
import { getBundleVersion } from '../../data/productImportPreviewStore';
import { availableStockLots } from '../../data/erpDemoStore';
import { getBundleProjection } from '../../bundles/bundleProjection';
import { priceBundleComponents } from '../../bundles/bundlePricing';
import { expandCartStockDemand } from '../../bundles/bundleCart';
import {planComponentFulfillment,maxAffordableBundleSets,componentSourceKey} from '../../bundles/bundleFulfillment';

type CartTableProps = {
  lines: CartLine[];
  lastAdded: string | null;
  onAdd: (p: Product) => void;
  onUpdate: (key: string, patch: Partial<Pick<CartLine, 'qty' | 'secondaryQty' | 'unitQuantities' | 'unit' | 'price' | 'serials' | 'stockSource' | 'bundleSources' | 'bundleSerials'>>) => void;
  onRemove: (key: string) => void;
  onReorder: (orderedKeys: string[]) => void;
  onMove: (key: string, delta: number) => void;
  searchRef: React.RefObject<HTMLInputElement>;
};

const grid = 'grid min-w-0 grid-cols-[36px_minmax(130px,1fr)_160px_88px_168px_112px_28px] items-center gap-1.5';

const cellInput =
'h-9 w-full rounded-md border border-transparent bg-transparent px-2 text-right text-sm text-ink hover:border-border focus:border-teal-500 focus:bg-card focus:outline-none focus:ring-2 focus:ring-teal-500/20';

/** Drag only from the handle, leaving numeric inputs and product actions fully interactive. */
function SortableCartRow({
  line, index, count, onMove, children
}: {
  line: CartLine;
  index: number;
  count: number;
  onMove: (key: string, delta: number) => void;
  children: React.ReactNode;
}) {
  const controls = useDragControls();
  return (
    <Reorder.Item
      as="div"
      value={line.key}
      dragControls={controls}
      dragListener={false}
      dragMomentum={false}
      data-testid="pos-cart-row" data-cart-row="sale" data-compound={productUnitFactor(line.product,line.unit)>1}
      data-line-key={line.key}
      className={`${grid} relative bg-card px-3 py-1.5`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.16 }}
      whileDrag={{ zIndex: 20, boxShadow: '0 4px 16px rgba(15, 23, 42, 0.13)' }}
    >
      <div className="flex items-center justify-end gap-1">
        <span className="text-right text-sm text-ink-400">{index + 1}.</span>
        <button
          type="button"
          data-testid="pos-drag-handle"
          aria-label={`Reorder ${line.product.name}, position ${index + 1} of ${count}`}
          aria-keyshortcuts="ArrowUp ArrowDown"
          title="Drag to reorder · use ↑/↓ keys"
          onPointerDown={(event) => controls.start(event)}
          onKeyDown={(event) => {
            if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
            event.preventDefault();
            event.stopPropagation();
            onMove(line.key, event.key === 'ArrowUp' ? -1 : 1);
          }}
          style={{ touchAction: 'none' }}
          className="flex size-7 shrink-0 cursor-grab items-center justify-center rounded-md text-ink-400 hover:bg-ink-50 hover:text-teal-700 active:cursor-grabbing focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-500"
        >
          <GripVertical className="size-4" aria-hidden="true" />
        </button>
      </div>
      {children}
    </Reorder.Item>
  );
}

export function CartTable({ lines, lastAdded, onAdd, onUpdate, onRemove, onReorder, onMove, searchRef }: CartTableProps) {
  const { word, text } = useUiCopy();
  const catalog=usePreviewCatalog();
  const qtyRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const secondaryQtyRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [revealedPurchase, setRevealedPurchase] = useState<string | null>(null);
  const [serialLine, setSerialLine] = useState<CartLine | null>(null);
  const [shortageLine, setShortageLine] = useState<CartLine | null>(null);
  const [shortageComponent,setShortageComponent]=useState<{lineKey:string;productId:string}|null>(null);
  const [serialComponent,setSerialComponent]=useState<{lineKey:string;productId:string}|null>(null);
  const soldSerials = useMemo(() => salesInvoices.flatMap((invoice) => invoice.lines.flatMap((line) => line.serials ?? [])), []);
  const bundleDemand=expandCartStockDemand(lines,catalog,(id,revision)=>getBundleVersion(id,revision));
  const sources=Object.fromEntries(lines.flatMap(l=>l.product.kind==='Bundle'
    ?Object.entries(l.bundleSources??{}).map(([productId,source])=>[componentSourceKey(l.key,productId),source])
    :l.stockSource?[[componentSourceKey(l.key,l.product.id),l.stockSource]]:[]));
  const serials=Object.fromEntries(lines.flatMap(l=>l.product.kind==='Bundle'
    ?Object.entries(l.bundleSerials??{}).map(([productId,values])=>[componentSourceKey(l.key,productId),values])
    :l.serials.length?[[componentSourceKey(l.key,l.product.id),l.serials]]:[]));
  const componentPlan=planComponentFulfillment(bundleDemand.demands,catalog,availableStockLots(),
    {sources,serials,soldSerials});
  const allocations=allocatePosStock(lines.filter(l=>l.product.kind!=='Bundle').map(l=>({key:l.key,product:l.product,
   requestedBaseQty:saleLineBaseQty(l),choice:l.stockSource})),stockLots);

  useEffect(() => {
    if (lastAdded) {
      const el = qtyRefs.current[lastAdded];
      el?.focus();
      el?.select();
    }
  }, [lastAdded, lines.length]);

  const backToSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      searchRef.current?.focus();
    }
  };
  const commitSecondary = (line: CartLine, focusSearch: boolean) => {
    const factor = productUnitFactor(line.product,line.unit)||1;
    onUpdate(line.key, normalizeCompoundQuantity(line.qty, line.secondaryQty, factor));
    if (focusSearch) searchRef.current?.focus();
  };

  return (
    <div data-cart-kind="sale" className="overflow-x-auto rounded-xl border border-border bg-card shadow-card">
      <div data-cart-header className={`${grid} border-b border-border px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-ink-400`}>
        <span className="text-right">#</span>
        <span>{word('product')}</span>
        <span className="text-right">{word("quantity")}</span>
        <span>{word('priceIn')}</span>
        <span className="text-right">{word("price")}</span>
        <span className="text-right">{word("total")}</span>
        <span className="sr-only">{word("remove")}</span>
      </div>

      <div data-testid="pos-cart">
        <Reorder.Group as="div" axis="y" values={lines.map((line) => line.key)} onReorder={onReorder}
          className="divide-y divide-border">
          <AnimatePresence initial={false}>
          {lines.map((l, i) => {
            const factor = productUnitFactor(l.product,l.unit)||1;
            const baseQty = saleLineBaseQty(l);
            const lineTotal = saleLineTotal(l);
            const recipe=l.product.kind==='Bundle'&&l.bundleRevision?getBundleVersion(l.product.id,l.bundleRevision):undefined;
            const bundleCost=recipe?priceBundleComponents(recipe.components,catalog,availableStockLots(),l.product.sellPrice):null;
            const bundleCostPending=l.product.kind==='Bundle'&&Object.values(l.bundleSources??{}).some(source=>
              source.mode==='Negative'||(source.mode==='Vendor'&&source.unitCost===null));
            const bundleAvailable=recipe?getBundleProjection(recipe,catalog,availableStockLots()).availableSets:0;
            const purchasePrice = l.product.kind==='Bundle' ? bundleCost?.componentPurchaseCost ?? 0 : factor > 1 ? l.product.purchasePrice * factor : l.product.purchasePrice;
            const units = unitsFor(l.product);
            const shortage = l.product.kind==='Bundle'?0:Math.max(0,baseQty-(allocations.find(a=>a.key===l.key)?.ownBaseQty??0));
            const relatedShortages=l.product.kind==='Bundle'&&recipe?componentPlan.rows.filter(s=>s.sourceLineKey===l.key&&s.shortageBaseQty>0&&!s.source):[];
            const invalidSets=l.product.kind==='Bundle'&&(!/^[1-9]\d*$/.test(l.qty.trim())||l.unit!=='Set'||Boolean(l.secondaryQty.trim()));
            const staleRecipe=l.product.kind==='Bundle'&&(!recipe||getBundleVersion(l.product.id)?.revision!==l.bundleRevision);
            return (
              <SortableCartRow key={l.key} line={l} index={i} count={lines.length} onMove={onMove}>
                <div className="flex min-w-0 items-center gap-2.5">
                  <ProductThumb src={l.product.image} size={32} />
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-medium text-ink">{l.product.name}</p>
                    <p data-table-helper="" className="truncate text-[11px] text-ink-500">
                      {l.product.nameBn && <span className="font-bn">{l.product.nameBn} · </span>}
                      {l.product.category}{l.product.kind==='Bundle'?` · Package · ${bundleAvailable} Set available`:l.product.kind === 'Service' ? ` · ${word('service')}` : l.product.expiry?.enabled ? ` · ${word('sellable')} ${formatStock({ ...l.product, stock: productStockBreakdown(l.product, stockLots).sellable })}` : ` · ${word('stock')} ${formatStock(l.product)}`}
                    </p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1">
                      {l.product.serialTracking && l.product.serialTracking !== 'Off' && (
                        <button
                          type="button" data-table-badge=""
                          onClick={() => setSerialLine(l)}
                          className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10.5px] font-medium ${
                            (l.product.serialTracking === 'Required' && l.serials.length !== requiredSerialCount(l.product, baseQty)) ||
                            l.serials.length > Math.ceil(baseQty)
                              ? 'bg-warning-bg text-warning'
                              : 'bg-teal-50 text-teal-700'
                          }`}>
                          <ScanLine className="size-3" />
                          {word('serials')} {l.serials.length}/{Math.max(requiredSerialCount(l.product, baseQty), Math.ceil(baseQty))}
                        </button>
                      )}
                      {l.product.kind==='Bundle'&&<span data-table-helper="" role="status" className="rounded bg-teal-50 px-1.5 py-0.5 text-[10px] text-teal-800">{text('Package','প্যাকেজ')} · {recipe?.components.length??0} {text('products','পণ্য')} · {text('Version','সংস্করণ')} {l.bundleRevision??'?'}</span>}
                      {invalidSets&&<span data-table-helper="" role="alert" className="rounded bg-danger-bg px-1.5 py-0.5 text-[10px] text-danger">{text('Whole Sets only','শুধু পূর্ণ সেট')}</span>}
                      {staleRecipe&&<span data-table-helper="" role="alert" className="rounded bg-warning-bg px-1.5 py-0.5 text-[10px] text-warning">{text('Bundle recipe changed — add again','প্যাকেজের পণ্য বদলেছে — আবার যোগ করুন')}</span>}
                      {relatedShortages.length>0&&<span data-table-helper="" role="alert" className="rounded bg-danger-bg px-1.5 py-0.5 text-[10px] text-danger">{text('Shared component shortage','প্যাকেজের পণ্য কম')} · {relatedShortages.map(s=>`${catalog.find(p=>p.id===s.componentProductId)?.name??s.componentProductId}: ${s.shortageBaseQty}`).join(', ')}</span>}
                      {l.product.kind==='Bundle'&&recipe&&<details className="text-[11px] text-ink-500">
                        <summary className="cursor-pointer">{text('View included products','ভেতরের পণ্য দেখুন')}</summary>
                        <div className="mt-1 space-y-1.5">
                          {recipe.components.map(child=>{
                            const item=catalog.find(p=>p.id===child.productId);
                            const row=componentPlan.rows.find(r=>r.sourceLineKey===l.key&&r.componentProductId===child.productId);
                            const selected=l.bundleSerials?.[child.productId]??[];
                            const needsSource=(row?.shortageBaseQty??0)>1e-7;
                            const source=l.bundleSources?.[child.productId];
                            const serialRequired=item?.serialTracking==='Required';
                            const serialOptional=item?.serialTracking==='Optional';
                            const totalQty=child.baseQty*Number(l.qty);
                            return <div key={child.productId} className="flex flex-wrap items-center gap-1.5 rounded-md bg-ink-50/60 px-2 py-1.5" data-testid="bundle-component-item">
                              <span className="min-w-0 flex-1">{item?.name??child.productId}: {totalQty} {item?.unit??''}</span>
                              {needsSource&&<button type="button" aria-label={`Choose source for ${item?.name??child.productId} in ${l.product.name}`}
                                className="rounded bg-warning-bg px-2 py-1 font-medium text-warning" onClick={()=>setShortageComponent({lineKey:l.key,productId:child.productId})}>
                                {source?.mode==='Vendor'?source.vendorName+(source.unitCost===null?' · Price pending':''):source?.mode==='Negative'?'Negative Sale':'Choose source'} · {row?.shortageBaseQty} {item?.unit}
                              </button>}
                              {(serialRequired||serialOptional)&&<button type="button"
                                aria-label={`Serial numbers for ${item?.name??child.productId} in ${l.product.name}`}
                                className={'rounded px-2 py-1 font-medium '+(serialRequired&&selected.length!==Math.ceil(row?.ownBaseQty??totalQty)?'bg-warning-bg text-warning':'bg-teal-50 text-teal-700')}
                                onClick={()=>setSerialComponent({lineKey:l.key,productId:child.productId})}>
                                <ScanLine className="mr-1 inline size-3"/>Serials {selected.length}/{Math.ceil(row?.ownBaseQty??totalQty)}
                              </button>}
                            </div>;
                          })}
                        </div>
                      </details>}
                      {shortage > 0 && (
                        <button
                          type="button"
                          onClick={() => setShortageLine(l)}
                          className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10.5px] font-medium ${
                            !l.stockSource
                              ? 'bg-danger-bg text-danger'
                              : l.stockSource.mode === 'Negative'
                                ? 'bg-warning-bg text-warning'
                                : 'bg-blue-50 text-blue-700'
                          }`}>
                          <AlertTriangle className="size-3" />
                          {!l.stockSource
                            ? `${word('short')} ${formatStock({ ...l.product, stock: shortage })} · ${word('chooseSource')}`
                            : l.stockSource.mode === 'Negative'
                              ? `${word('negativeSale')} · ${formatStock({ ...l.product, stock: shortage })}`
                              : `${l.stockSource.vendorName}${l.stockSource.unitCost===null?` · ${word('pricePending')}`:''} · ${formatStock({ ...l.product, stock: shortage })}`}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div data-cart-field="Quantity · পরিমাণ">{l.product.unitRelations && l.product.unitRelations.length>1 ?
                  <MultiUnitQuantityInput product={l.product} quantities={saleLineQuantities(l)}
                    primaryRef={el=>{qtyRefs.current[l.key]=el;}}
                    onChange={unitQuantities=>onUpdate(l.key,{unitQuantities})}
                    onLastEnter={()=>searchRef.current?.focus()}/>
                  : <CompoundQuantityInput key={l.unit} product={l.product} unit={l.unit} primary={l.qty} secondary={l.secondaryQty}
                  primaryRef={el=>{qtyRefs.current[l.key]=el;}} secondaryRef={el=>{secondaryQtyRefs.current[l.key]=el;}}
                  primaryLabel={factor>1?text(`${l.unit} quantity for ${l.product.name}`, `${l.unit} পরিমাণ: ${l.product.name}`):text(`Quantity for ${l.product.name}`, `পরিমাণ: ${l.product.name}`)}
                  secondaryLabel={text(`${l.product.unit} quantity for ${l.product.name}`, `${l.product.unit} পরিমাণ: ${l.product.name}`)}
                  onPrimaryChange={value=>onUpdate(l.key,{qty:value})}
                  onSecondaryChange={value=>onUpdate(l.key,{secondaryQty:value})}
                  onPrimaryEnter={()=>{if(factor>1){secondaryQtyRefs.current[l.key]?.focus();secondaryQtyRefs.current[l.key]?.select();}else searchRef.current?.focus();}}
                  onSecondaryBlur={()=>commitSecondary(l,false)}
                  onSecondaryEnter={()=>commitSecondary(l,true)}/>}</div>
                <div data-cart-field="Price in · একক">{units.length > 1 ?
                units.length > 2 ? (
                  <AppSelect label={text('Sale unit for '+l.product.name,'বিক্রির একক: '+l.product.name)}
                    value={l.unit} options={units} onChange={(next)=>onUpdate(l.key,{unit:next})}/>
                ) :
                <div className="flex h-9 rounded-md bg-ink-50 p-0.5" role="radiogroup" aria-label={word("unit")}>
                    {units.map((u) =>
                  <button
                    key={u}
                    type="button"
                    role="radio"
                    aria-checked={l.unit === u}
                    onClick={() => onUpdate(l.key, { unit: u })}
                    className={`flex-1 rounded px-1 text-xs font-medium transition-colors ${
                    l.unit === u ? 'bg-card text-ink shadow-card ring-1 ring-primary' : 'text-ink-500 hover:text-ink'}`
                    }>
                    
                        {u}
                      </button>
                  )}
                  </div> :

                <span className="px-2 text-sm text-ink-600">{l.unit}</span>
                }</div>
                <div data-cart-field="Price · দাম"><div data-pos-price-field className="relative flex min-w-0 items-center gap-1">
                  <div className="relative min-w-0 flex-1">
                    <span className="pointer-events-none absolute left-2 top-1/2 z-10 -translate-y-1/2 text-xs text-ink-400">৳</span>
                    <NumericInput stepperCompact
                      aria-label={text(`Price for ${l.product.name}`, `দাম: ${l.product.name}`)}
                      value={l.price}
                      inputMode="decimal"
                      onChange={(e) => onUpdate(l.key, { price: e.target.value })}
                      onKeyDown={backToSearch}
                      className={`${cellInput} pl-6 pr-2`} />
                  </div>
                  <button
                    type="button"
                    data-pos-cost-eye
                    aria-label={text(`Show purchase price for ${l.product.name}`, `কেনা দাম দেখুন: ${l.product.name}`)}
                    aria-pressed={revealedPurchase === l.key}
                    onClick={() => setRevealedPurchase((current) => current === l.key ? null : l.key)}
                    className="flex size-6 shrink-0 items-center justify-center rounded text-helper hover:bg-ink-50 hover:text-teal-700">
                    <Eye className="size-3.5" />
                  </button>
                  {revealedPurchase === l.key &&
                  <div className="absolute right-0 top-full z-30 mt-1 w-max max-w-[min(300px,calc(100vw-16px))] whitespace-normal break-words rounded-md border border-border bg-card px-2 py-1.5 text-[11px] text-ink-600 shadow-pop">
                      {l.product.kind==='Bundle'
                       ?<><span className="font-medium">{text('Package cost','প্যাকেজের কেনা খরচ')} · {text('estimated','আনুমানিক')}</span><span className="block">{taka(purchasePrice,purchasePrice%1?2:0)}/Set</span>
                         <span className="block text-ink-400">{text('Current component lots; not realized sale cost','বর্তমান পণ্যের লট; বিক্রির চূড়ান্ত খরচ নয়')}</span>
                         {bundleCost&&!bundleCost.costFromAvailableLots&&<span className="block text-warning">{text('Some component cost uses catalog estimate','কিছু পণ্যের আনুমানিক দাম ধরা হয়েছে')}</span>}
                         {bundleCostPending&&<span role="note" className="block font-medium text-warning">{text('Sourced component cost is pending — profit is not final','পণ্যের কেনা দাম বাকি — লাভ এখনও নিশ্চিত নয়')}</span>}</>
                       :<>{word('cost')} {taka(purchasePrice, purchasePrice % 1 ? 2 : 0)}/{l.unit}</>}
                    </div>
                  }
                </div></div>
                <span data-cart-field="Total · মোট" className="text-right text-sm font-semibold text-ink">
                  ৳{formatNumber(lineTotal, lineTotal % 1 ? 2 : 0)}
                </span>
                <button
                  type="button"
                  onClick={() => onRemove(l.key)}
                  aria-label={text(`Remove ${l.product.name}`, `পণ্য সরান: ${l.product.name}`)}
                  className="flex size-8 items-center justify-center rounded-md text-helper hover:bg-danger-bg hover:text-danger">
                  
                  <X className="size-4" />
                </button>
              </SortableCartRow>);

          })}
          </AnimatePresence>
        </Reorder.Group>
        <div data-testid="pos-add-row" data-cart-add className={`${grid} border-t border-border bg-teal-50/35 px-3 py-2`}>
          <span className="pr-3 text-right text-sm text-teal-600">{lines.length + 1}.</span>
          <ProductCombobox ref={searchRef} products={catalog} onSelect={onAdd} />
          <span className="pr-2 text-right text-sm text-helper">{word("qty")}</span>
          <span className="px-2 text-sm text-helper">{word("unit")}</span>
          <span className="pr-2 text-right text-sm text-helper">{word("price")}</span>
          <span className="text-right text-sm text-helper">{word("total")}</span>
          <span />
        </div>

      </div>

      {lines.length === 0 &&
      <p className="border-t border-border px-4 py-6 text-center text-sm text-ink-500">
          {word("cartEmpty")}
        </p>
      }

      {serialLine && (() => {
        const baseQty = saleLineBaseQty(serialLine);
        const blocked = lines.filter((line) => line.key !== serialLine.key).flatMap((line) => line.serials);
        return (
          <SerialPickerDialog
            product={serialLine.product}
            open
            onOpenChange={(open) => { if (!open) setSerialLine(null); }}
            eligible={[...new Set([...availableSerials(serialLine.product, stockLots).filter((serial) => !soldSerials.includes(serial)), ...serialLine.serials])]}
            selected={serialLine.serials}
            required={requiredSerialCount(serialLine.product, baseQty)}
            maxCount={Math.ceil(baseQty)}
            blocked={blocked}
            onSave={(serials) => {
              onUpdate(serialLine.key, { serials });
              setSerialLine(null);
            }}
          />
        );
      })()}

      {shortageComponent&&(()=>{
        const parent=lines.find(line=>line.key===shortageComponent.lineKey&&line.product.kind==='Bundle');
        const product=catalog.find(p=>p.id===shortageComponent.productId);
        const row=componentPlan.rows.find(r=>r.sourceLineKey===shortageComponent.lineKey&&r.componentProductId===shortageComponent.productId);
        if(!parent||!product||!row)return null;
        const available=row.ownBaseQty;
        const sets=maxAffordableBundleSets(parent.key,bundleDemand.demands,catalog,availableStockLots());
        const componentLine:CartLine={...parent,product,unit:product.unit,qty:String(row.requiredBaseQty),
          secondaryQty:'',stockSource:parent.bundleSources?.[product.id]};
        return <StockShortageDialog line={componentLine} open availableBaseQty={available}
          shortageBaseQty={row.shortageBaseQty}
          componentContext={parent.product.name+' · '+product.name}
          ownActionHint={sets>0?`Reduce package to ${sets} whole Set(s). Other cart lines keep their quantities.`:'No complete Set remains after other cart lines. Remove this package line.'}
          onOpenChange={open=>{if(!open)setShortageComponent(null);}}
          onUseOwnStock={()=>{
            if(sets<=0)onRemove(parent.key);
            else onUpdate(parent.key,{qty:String(sets),bundleSources:undefined,bundleSerials:undefined});
            setShortageComponent(null);
          }}
          onResolve={source=>{
            onUpdate(parent.key,{bundleSources:{...(parent.bundleSources??{}),[product.id]:source}});
            setShortageComponent(null);
          }}/>;
      })()}
      {serialComponent&&(()=>{
        const parent=lines.find(line=>line.key===serialComponent.lineKey&&line.product.kind==='Bundle');
        const product=catalog.find(p=>p.id===serialComponent.productId);
        if(!parent||!product)return null;
        const selection=parent.bundleSerials?.[product.id]??[];
        const own=componentPlan.rows.find(r=>r.sourceLineKey===parent.key&&r.componentProductId===product.id)?.ownBaseQty??0;
        const blocked=lines.flatMap(line=>[
          ...line.serials,
          ...Object.entries(line.bundleSerials??{})
            .filter(([id])=>line.key!==parent.key||id!==product.id).flatMap(([,values])=>values)
        ]);
        const eligible=availableSerials(product,availableStockLots()).filter(s=>!soldSerials.some(used=>used.toLowerCase()===s.toLowerCase()));
        return <SerialPickerDialog product={product} open
          onOpenChange={open=>{if(!open)setSerialComponent(null);}}
          eligible={[...new Set([...eligible,...selection])]}
          selected={selection} blocked={blocked}
          required={requiredSerialCount(product,own)} maxCount={Math.ceil(own)}
          onSave={values=>{
            onUpdate(parent.key,{bundleSerials:{...(parent.bundleSerials??{}),[product.id]:values}});
            setSerialComponent(null);
          }}/>;
      })()}
      {shortageLine && (() => {
        const baseQty = saleLineBaseQty(shortageLine);
        const allocation=allocations.find(a=>a.key===shortageLine.key);
        const available=allocation?.ownBaseQty??0;
        const shortage=Math.max(0,baseQty-available);
        return (
          <StockShortageDialog
            line={shortageLine}
            availableBaseQty={available}
            shortageBaseQty={shortage}
            open
            onOpenChange={(open) => { if (!open) setShortageLine(null); }}
            onUseOwnStock={() => {
              if (available <= 0) {
                onRemove(shortageLine.key);
              } else {
                const factor = productUnitFactor(shortageLine.product, shortageLine.unit);
                const useAlternate = factor > 1;
                onUpdate(shortageLine.key, {
                  ...quantityFromBaseStock(available, factor, useAlternate),
                  stockSource: undefined
                });
              }
              setShortageLine(null);
            }}
            onResolve={(source) => {
              onUpdate(shortageLine.key, { stockSource: source });
              setShortageLine(null);
            }}
          />
        );
      })()}
    </div>);

}
