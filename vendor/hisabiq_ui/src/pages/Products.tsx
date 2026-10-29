import {useModuleColumns} from '../settings/useModuleColumns';
import { MotionTabList, MotionTabIndicator } from '../motion/MotionTabList';
import {matchesSearch as fuzzyMatch} from '../utils/fuzzySearch';
import { useSearchParams } from 'react-router-dom';
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { Check, ChevronDown, Download, Upload, MoreHorizontal, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/Dialog';
import { Input } from '../components/Input';
import { PageHeader } from '../components/PageHeader';
import { ProductThumb } from '../components/ProductThumb';
import { StatusBadge, type StatusTone } from '../components/StatusBadge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/Table';
import { AddProductDialog, type ProductOpeningMeta } from '../components/products/AddProductDialog';
import { BundleEditor } from '../components/products/BundleEditor';
import { ImportWizard } from '../components/import/ImportWizard';
import { ManageOffersDialog, ProductDetailsDialog, StockAdjustmentDialog, StockLotDialog, type StockAdjustmentResult } from '../components/products/ProductInventoryDialogs';
import { StockHistoryView, StockLotsView } from '../components/products/ProductInventoryViews';
import { FloatingPanel } from '../components/layout/FloatingPanel';
import { ProductSettings } from '../components/products/ProductSettings';
import { availableProducts, availableProductCategories, availableStockLots, availableStockMovements } from '../data/erpDemoStore';
import {planProductImport,resolveProductDecisions} from '../import/productImport.ts';
import {commitProductImportPreview,getProductImportPreviewSnapshot,upsertProductPreview,upsertBundlePreview,getBundleVersion,canDeleteBundlePreview,deleteBundlePreview,subscribeProductImportPreview} from '../data/productImportPreviewStore.ts';
import {getBundleProjection,bundleInventoryValue} from '../bundles/bundleProjection';
import { productOffers as seedOffers } from '../data/productOffers';
import { salesInvoices } from '../data/sales';
import type { Product, ProductOffer, StockLot, StockMovement } from '../types/erp';
import { formatStock, stockStatus, type StockStatus } from '../utils/units';
import { taka } from '../utils/currency';
import { downloadReport } from '../utils/reportOutput';
import { useUiCopy } from '../i18n/useUiCopy';
import { productLabel } from '../i18n/productsCopy';

const statusMeta: Record<StockStatus, {label: string;tone: StatusTone;}> = {
  in: { label: 'In stock', tone: 'success' },
  low: { label: 'Low stock', tone: 'warning' },
  out: { label: 'Out of stock', tone: 'danger' },
  inactive: { label: 'Inactive', tone: 'neutral' },
  service: { label: 'Service', tone: 'info' }
};

type StockFilter = 'all' | 'low' | 'out';
type ProductColumn = 'index' | 'product' | 'category' | 'stock' | 'stockValue' | 'unit' | 'purchase' | 'selling' | 'status';

const productColumns: Array<{ id: ProductColumn; label: string }> = [
  { id: 'index', label: '#' },
  { id: 'product', label: 'Product' },
  { id: 'category', label: 'Category' },
  { id: 'stock', label: 'Stock' },
  { id: 'stockValue', label: 'Stock value' },
  { id: 'unit', label: 'Unit' },
  { id: 'purchase', label: 'Purchase' },
  { id: 'selling', label: 'Selling' },
  { id: 'status', label: 'Status' }
];

const defaultVisibleColumns: Record<ProductColumn, boolean> = {
  index: true,
  product: true,
  category: true,
  stock: true,
  stockValue: true,
  unit: true,
  purchase: true,
  selling: true,
  status: true
};

const columnStorageKey = 'hisabiq-products-visible-columns';

function ProductColumnPicker({
  visible,
  onToggle
}: {
  visible: Record<ProductColumn, boolean>;
  onToggle: (column: ProductColumn) => void;
}) {
  const {language}=useUiCopy();
  const pl=(english:string)=>productLabel(language,english);
  return (
    <FloatingPanel
      label={pl('Choose product table columns')}
      width={210}
      trigger={({ toggle, open }) => (
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          className="flex h-8 items-center gap-2 rounded-md border border-border bg-card px-2.5 text-xs font-medium text-ink-700 hover:bg-ink-50">
          {pl('Columns')}
          <ChevronDown className={`size-3.5 text-ink-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      )}>
      {() => (
        <div className="py-1">
          {productColumns.map((column) => (
            <button
              key={column.id}
              type="button"
              disabled={["product","stock","selling"].includes(column.id)}
              role="menuitemcheckbox"
              aria-checked={visible[column.id]}
              onClick={() => onToggle(column.id)}
              className="flex w-full items-center justify-between gap-4 px-3 py-2 text-left text-[13px] text-ink-700 hover:bg-ink-50">
              <span>{pl(column.label)}</span>
              {visible[column.id] && <Check className="size-4 text-ink" />}
            </button>
          ))}
        </div>
      )}
    </FloatingPanel>
  );
}

function ProductActions({
  product,
  onView,
  onEdit,
  onAdjust,
  onAddLot,
  onLots,
  onHistory,
  onOffers,
  onDuplicate,
  onToggle,
  onDelete
}: {
  product: Product;
  onView: () => void;
  onEdit: () => void;
  onAdjust: () => void;
  onAddLot: () => void;
  onLots: () => void;
  onHistory: () => void;
  onOffers: () => void;
  onDuplicate: () => void;
  onToggle: () => void;
  onDelete?: () => void;
}) {
  const {language}=useUiCopy();
  const pl=(english:string)=>productLabel(language,english);
  const itemClass = 'w-full px-3 py-2 text-left text-[13px] text-ink-700 hover:bg-ink-50';

  return (
    <FloatingPanel
      label={`${pl('Actions for')} ${product.name}`}
      width={210}
      trigger={({ toggle, open }) => (
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-label={`${pl('Actions for')} ${product.name}`}
          className="rounded-md p-1 text-ink-400 hover:bg-ink-50 hover:text-ink">
          <MoreHorizontal className="size-4" />
        </button>
      )}>
      {(close) => (
        <div className="py-1">
          <button type="button" onClick={() => { close(); onView(); }} className={itemClass}>{pl('View details')}</button>
          <button type="button" onClick={() => { close(); onEdit(); }} className={itemClass}>{pl('Edit product')}</button>
          {product.kind !== 'Service' && product.kind !== 'Bundle' && <button type="button" onClick={() => { close(); onAdjust(); }} className={itemClass}>{pl('Adjust stock')}</button>}
          {product.kind !== 'Service' && product.kind !== 'Bundle' && <button type="button" onClick={() => { close(); onAddLot(); }} className={itemClass}>{pl('Add stock lot')}</button>}
          <button type="button" onClick={() => { close(); onOffers(); }} className={itemClass}>{pl('Manage offers')}</button>
          <div className="my-1 border-t border-border" />
          {product.kind !== 'Service' && product.kind !== 'Bundle' && <button type="button" onClick={() => { close(); onLots(); }} className={itemClass}>{pl('Stock lots & serials')}</button>}
          <button type="button" onClick={() => { close(); onHistory(); }} className={itemClass}>{pl('Product history')}</button>
          <button
            type="button"
            onClick={() => {
              close();
              void navigator.clipboard?.writeText(product.sku);
              toast.success(pl('SKU copied'), { description: product.sku });
            }}
            className={itemClass}>
            {pl('Copy SKU / barcode')}
          </button>
          <div className="my-1 border-t border-border" />
          <button type="button" onClick={() => { close(); onDuplicate(); }} className={itemClass}>{pl('Duplicate')}</button>
          {product.kind==='Bundle' && onDelete && <button type="button" onClick={() => {close();onDelete();}}
            className={itemClass+' text-danger'}>{pl('Delete package')}</button>}
          <button type="button" onClick={() => { close(); onToggle(); }} className={itemClass}>
            {pl(product.active ? 'Deactivate' : 'Activate')}
          </button>
        </div>
      )}
    </FloatingPanel>
  );
}

type ProductView = 'list' | 'lots' | 'history' | 'settings';

export function Products() {
  const {language,showHelper}=useUiCopy();
  const pl=(english:string)=>productLabel(language,english);
  const [searchParams,setSearchParams] = useSearchParams();
  const requestedView=searchParams.get('view');
  const readView=():ProductView=>['list','lots','history','settings'].includes(requestedView??'')?requestedView as ProductView:'list';
  const [view,setView]=useState<ProductView>(readView);
  useEffect(()=>{setView(readView());},[requestedView]);
  const chooseView=(next:ProductView)=>{setView(next);setSearchParams(previous=>{
   const params=new URLSearchParams(previous);if(next==='list')params.delete('view');else params.set('view',next);
   if(next!=='settings')params.delete('tab');return params;
  },{replace:true});};
  const [list, setList] = useState<Product[]>(availableProducts);
  const routeQuery=searchParams.get('q') ?? '';
  const [query, setQuery] = useState(routeQuery);
  useEffect(()=>setQuery(routeQuery),[routeQuery]);
  const [category, setCategory] = useState('All');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [creatingBundle,setCreatingBundle] = useState(false);
  const [bundleEditorProduct,setBundleEditorProduct] = useState<Product|null>(null);
  const [deleteBundleTarget,setDeleteBundleTarget] = useState<Product|null>(null);
  const previewSnapshot=useSyncExternalStore(subscribeProductImportPreview,getProductImportPreviewSnapshot);
  const [detailsProduct, setDetailsProduct] = useState<Product | null>(null);
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null);
  const [lotProduct, setLotProduct] = useState<Product | null>(null);
  const [offerProduct, setOfferProduct] = useState<Product | null>(null);
  const [lots, setLots] = useState<StockLot[]>(availableStockLots);
  const [movements, setMovements] = useState<StockMovement[]>(availableStockMovements);
  const [offers, setOffers] = useState<ProductOffer[]>(seedOffers);
  const [inventoryProductFilter, setInventoryProductFilter] = useState('');
  const soldSerials = useMemo(() => salesInvoices.flatMap((invoice) => invoice.lines.flatMap((line) => line.serials ?? [])), []);
  const knownSerials = useMemo(() => [...lots.flatMap((lot) => lot.serials ?? []), ...soldSerials], [lots, soldSerials]);
  const {columns:visibleColumns,setColumns:setVisibleColumns}=useModuleColumns('products',columnStorageKey,defaultVisibleColumns);
  const toggleColumn=(column:ProductColumn)=>setVisibleColumns(current=>({...current,[column]:!current[column]}));

  const openLots = (product: Product) => {
    setInventoryProductFilter(product.id);
    setView('lots');
  };

  const openHistory = (product: Product) => {
    setInventoryProductFilter(product.id);
    setView('history');
  };

  const applyAdjustment = (product: Product, result: StockAdjustmentResult) => {
    const today = new Date().toISOString().slice(0, 10);
    const reference = `ADJ-${String(movements.length + 1).padStart(4, '0')}`;

    setList((items) => items.map((item) => item.id === product.id ? { ...item, stock: result.newStock } : item));

    setLots((current) => {
      if (result.delta > 0) {
        const newLot: StockLot = {
          id: `lot-${product.id}-adj-${Date.now()}`,
          productId: product.id,
          label: 'Stock Adjustment',
          receivedAt: today,
          quantity: result.delta,
          available: result.delta,
          unitCost: product.purchasePrice,
          source: 'Adjustment',
          reference
        };
        return [newLot, ...current];
      }

      if (result.delta < 0) {
        let remaining = Math.abs(result.delta);
        return current.map((lot) => {
          if (lot.productId !== product.id || remaining <= 0 || lot.available <= 0) return lot;
          const deduction = Math.min(lot.available, remaining);
          remaining -= deduction;
          return { ...lot, available: lot.available - deduction };
        });
      }

      return current;
    });

    const movement: StockMovement = {
      id: `mov-${product.id}-adj-${Date.now()}`,
      productId: product.id,
      date: today,
      type: 'Adjustment',
      quantity: result.delta,
      balance: result.newStock,
      reference,
      note: result.note ? `${result.reason} · ${result.note}` : result.reason
    };
    setMovements((current) => [movement, ...current]);
    setAdjustProduct(null);
    toast.success(pl('Stock adjusted'), { description: `${product.name} · ${formatStock({ ...product, stock: result.newStock })}` });
  };

  const addLot = (product: Product, lot: StockLot) => {
    setLots((current) => [lot, ...current]);
    setList((items) => items.map((item) => item.id === product.id ? { ...item, stock: item.stock + lot.quantity } : item));
    setMovements((current) => [{
      id: `mov-${product.id}-purchase-${Date.now()}`,
      productId: product.id,
      date: lot.receivedAt,
      type: 'Purchase',
      quantity: lot.quantity,
      balance: product.stock + lot.quantity,
      reference: lot.reference,
      note: lot.expiryDate ? `Lot ${lot.batchNumber ?? '—'} · expiry ${lot.expiryDate}` : 'Stock lot received'
    }, ...current]);
    setLotProduct(null);
    toast.success(pl('Stock lot added'), { description: `${product.name} · +${formatStock({ ...product, stock: lot.quantity })}` });
  };

  const saveProductOffers = (product: Product, nextProductOffers: ProductOffer[]) => {
    setOffers((current) => [
      ...current.filter((offer) => offer.productId !== product.id),
      ...nextProductOffers
    ]);
    toast.success(pl('Offers updated'), { description: product.name });
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list.filter((p) => {
      if (category !== 'All' && p.category !== category) return false;
      const s = stockStatus(p);
      if (stockFilter === 'low' && s !== 'low') return false;
      if (stockFilter === 'out' && s !== 'out') return false;
      if (!q) return true;
      return fuzzyMatch(q,[p.name,p.nameBn,p.sku,p.brand]);
    });
  }, [list, query, category, stockFilter]);

  const stockValue = list.reduce((s, p) => s + bundleInventoryValue(p), 0);
  const lowCount = list.filter((p) => stockStatus(p) === 'low').length;
  const outCount = list.filter((p) => stockStatus(p) === 'out').length;

  const summary = [
  { label: 'Products', value: String(list.length), sub: `${list.filter((p) => p.active).length} ${pl('active')}` },
  { label: 'Stock value', value: taka(stockValue), sub: 'At purchase price' },
  { label: 'Low stock', value: String(lowCount), sub: 'Below minimum', tone: 'text-warning' },
  { label: 'Out of stock', value: String(outCount), sub: 'Needs reorder', tone: 'text-danger' }];


  if(creatingBundle||bundleEditorProduct){
    return <BundleEditor key={bundleEditorProduct?.id ?? 'new-bundle'} initialProduct={bundleEditorProduct} catalog={list}
      onCancel={()=>{setCreatingBundle(false);setBundleEditorProduct(null);}}
      onSave={(draft,revision,originalRecipe)=>{
        upsertBundlePreview(draft,revision,originalRecipe);
        setList(availableProducts());
        setCreatingBundle(false);setBundleEditorProduct(null);
        toast.success(pl('Package saved'),{description:pl('Included products are saved. No stock or ledger posted.')});
      }}/>;
  }
  const productEditor = (
    <AddProductDialog presentation="page"
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingProduct(null);
        }}
        initialProduct={editingProduct}
        existingSerials={knownSerials}
        onSave={(product, opening?: ProductOpeningMeta) => {
          if (editingProduct) {
            const stockAtSource=getProductImportPreviewSnapshot().products.find(item=>item.id===product.id)?.stock??product.stock;
            upsertProductPreview({...product,stock:stockAtSource});
            setList((items) => items.map((item) => item.id === product.id ? product : item));
            setDetailsProduct((current) => current?.id === product.id ? product : current);
            toast.success(`${product.name} ${pl('updated')}`);
          } else {
            setList((items) => [product, ...items]);
            if (product.kind !== 'Service' && product.stock > 0) {
              const today = new Date().toISOString().slice(0, 10);
              const lot: StockLot = {
                id: `lot-${product.id}-opening`,
                productId: product.id,
                label: 'Opening Stock',
                receivedAt: today,
                quantity: product.stock,
                available: product.stock,
                unitCost: product.purchasePrice,
                source: 'Opening',
                serials: opening?.serials.length ? opening.serials : undefined,
                batchNumber: opening?.batchNumber,
                manufactureDate: opening?.manufactureDate,
                expiryDate: opening?.expiryDate
              };
              const movement: StockMovement = {
                id: `mov-${product.id}-opening`,
                productId: product.id,
                date: today,
                type: 'Opening',
                quantity: product.stock,
                balance: product.stock,
                reference: 'Opening Stock',
                note: opening?.expiryDate ? `Opening lot · expiry ${opening.expiryDate}` : 'Opening balance'
              };
              upsertProductPreview(product,lot,movement);
              setLots((current) => [lot, ...current]);
              setMovements((current) => [movement, ...current]);
            } else {
              upsertProductPreview(product);
            }
            toast.success(`${product.name} ${pl('added')}`, { description: product.kind === 'Service' ? pl('Service product') : product.altUnit ? `1 ${product.altUnit.unit} = ${product.altUnit.factor} ${product.unit}` : undefined });
          }
          setDialogOpen(false);
          setEditingProduct(null);
        }} />
  );
  if (dialogOpen) return productEditor;

  return (
    <div className="mx-auto max-w-[1440px] space-y-4">
      <PageHeader
        title="Products"
        titleBn="পণ্য তালিকা"
        description={
          view === 'list'
            ? pl('Stock, units and prices for everything you sell.')
            : view === 'lots'
              ? pl('See where current stock came from and what remains in each lot.')
              : view === 'history'
                ? pl('Audit purchases, sales, returns and manual stock adjustments.')
                : pl('Categories, units, brands and defaults used across the product module.')
        }
        actions={view === 'list' ? (
          <>
            <Button variant="outline" size="sm" onClick={() => downloadReport('hisabiq-products.csv',['Name','Bangla name','SKU','Category','Brand','Base unit','Stock (base unit)','Minimum stock (base unit)','Purchase price (base unit)','Selling price (base unit)','Active'],filtered.map(p => [p.name,p.nameBn ?? '',p.sku,p.category,p.brand ?? '',p.unit,p.stock,p.minStock,p.purchasePrice,p.sellPrice,p.active ? 'Yes' : 'No']))}>
              <Download className="size-4" /> {pl('Export')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
              <Upload className="size-4" /> {pl('Import')}
            </Button>
            <Button variant="outline" size="sm" onClick={()=>{setBundleEditorProduct(null);setCreatingBundle(true);}}>
              <Plus className="size-4" /> {pl('Add package')}
            </Button>
            <Button size="sm" onClick={() => { setEditingProduct(null); setDialogOpen(true); }}>
              <Plus className="size-4" /> {pl('Add product')}
            </Button>
          </>
        ) : undefined} />
      

      <MotionTabList className="flex flex-nowrap gap-1 overflow-x-auto border-b border-border scrollbar-thin" role="tablist">
        {([
          ['list', 'Product list', 'পণ্য তালিকা'],
          ['lots', 'Stock lots', 'স্টক লট'],
          ['history', 'Stock history', 'স্টক হিস্ট্রি'],
          ['settings', 'Product settings', 'পণ্য সেটিংস']
        ] as Array<[ProductView, string, string]>).map(([id, label, bn]) => (
          <button
            key={id}
            role="tab"
            aria-selected={view === id}
            onClick={() => chooseView(id)}
            className={`flex shrink-0 items-baseline gap-1.5 px-2.5 py-2.5 text-[13px] font-medium ${view === id ? 'text-ink' : 'text-ink-500 hover:text-ink'}`}>
            {pl(label)} {showHelper&&<span className="font-bn text-[10.5px] font-normal text-ink-400">· {bn}</span>}
          <MotionTabIndicator active={view === id} /></button>
        ))}
      </MotionTabList>

      {view === 'list' && (
        <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {summary.map((s) =>
        <div key={s.label} className="rounded-xl border border-border bg-card px-4 py-3 shadow-card">
            <p className="text-[12.5px] text-ink-500">{pl(s.label)}</p>
            <p className={`mt-0.5 text-lg font-semibold ${s.tone ?? 'text-ink'}`}>{s.value}</p>
            <p className="text-[11px] text-ink-400">{pl(s.sub)}</p>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card shadow-card">
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 z-10 size-4 -translate-y-1/2 text-ink-400" aria-hidden="true" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={pl("Search name, বাংলা, SKU…")}
              aria-label={pl("Search products")}
              className="h-8 w-full rounded-md border border-border pl-8 pr-3 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20" />
            
          </div>
          <div className="flex flex-wrap gap-1">
            {availableProductCategories().map((c) =>
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`h-8 rounded-md px-2.5 text-xs font-medium transition-colors ${
              category === c ? 'bg-inverse text-white' : 'text-ink-600 hover:bg-ink-50'}`
              }>
              
                {c==='All'?pl(c):c}
              </button>
            )}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex rounded-md bg-ink-50 p-0.5" role="radiogroup" aria-label={pl("Stock filter")}>
              {(
              [
              ['all', 'All stock'],
              ['low', `Low (${lowCount})`],
              ['out', `Out (${outCount})`]] as
              [StockFilter, string][]).
              map(([id, label]) =>
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={stockFilter === id}
                onClick={() => setStockFilter(id)}
                className={`h-7 rounded px-2.5 text-xs font-medium ${stockFilter === id ? 'bg-card text-ink shadow-card' : 'text-ink-500'}`}>
                
                  {id==='all'?pl(label):`${pl(id==='low'?'Low':'Out')} (${id==='low'?lowCount:outCount})`}
                </button>
              )}
            </div>
            <ProductColumnPicker visible={visibleColumns} onToggle={toggleColumn} />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {visibleColumns.index && <TableHead className="h-9 w-10 pl-4 text-xs">#</TableHead>}
              {visibleColumns.product && <TableHead className="h-9 text-xs">{pl("Product")}</TableHead>}
              {visibleColumns.category && <TableHead className="h-9 text-xs">{pl('Category')}</TableHead>}
              {visibleColumns.stock && <TableHead className="h-9 text-right text-xs">{pl('Stock')}</TableHead>}
              {visibleColumns.stockValue && <TableHead className="h-9 text-right text-xs" title={pl("Stock × purchase price")}>{pl("Stock value")}</TableHead>}
              {visibleColumns.unit && <TableHead className="h-9 text-xs">{pl('Unit')}</TableHead>}
              {visibleColumns.purchase && <TableHead className="h-9 text-right text-xs">{pl('Purchase')}</TableHead>}
              {visibleColumns.selling && <TableHead className="h-9 text-right text-xs">{pl('Selling')}</TableHead>}
              {visibleColumns.status && <TableHead className="h-9 text-xs">{pl('Status')}</TableHead>}
              <TableHead className="h-9 w-10 pr-4"><span className="sr-only">{pl("Actions")}</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p, i) => {
              const projection = p.kind==='Bundle' ? (getBundleVersion(p.id) ? getBundleProjection(getBundleVersion(p.id)!,list,lots) : null) : null;
              const s = p.kind==='Bundle' ? (!p.active?'inactive':(projection?.availableSets ?? 0)>0?'in':'out') : stockStatus(p);
              const rowStockValue = bundleInventoryValue(p);
              return (
                <TableRow key={p.id} className="text-[13px]">
                  {visibleColumns.index && <TableCell className="py-2 pl-4 text-ink-400">{i + 1}.</TableCell>}
                  {visibleColumns.product &&
                  <TableCell className="py-2">
                    <div className="flex items-center gap-2.5">
                      <ProductThumb src={p.image} size={34} />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ink">{p.name}</p>
                        <p data-table-helper="" className="truncate text-[11px] text-ink-500">
                          {p.nameBn && <span className="font-bn">{p.nameBn}</span>}
                          {p.nameBn ? ' · ' : ''}{p.sku}
                        </p>
                      </div>
                    </div>
                  </TableCell>}
                  {visibleColumns.category && <TableCell className="py-2 text-ink-600">
                    {p.category}{p.brand && p.brand !== 'Generic / No brand' && <span data-table-helper="" className="block text-[11px] text-ink-400">{p.brand}</span>}
                  </TableCell>}
                  {visibleColumns.stock &&
                  <TableCell className={`py-2 text-right font-medium ${s === 'low' ? 'text-warning' : s === 'out' ? 'text-danger' : 'text-ink'}`}>
                    {p.kind === 'Service' ? '—' : p.kind==='Bundle' ? (projection?.availableSets??0)+' Set' : formatStock(p)}
                    {p.kind !== 'Service' && p.kind !== 'Bundle' && <span data-table-helper="" className="block text-[11px] font-normal text-ink-400">{pl("min")} {formatStock({ ...p, stock: p.minStock })}</span>}
                  </TableCell>}
                  {visibleColumns.stockValue &&
                  <TableCell className="py-2 text-right font-medium text-ink">
                    {p.kind === 'Service' || p.kind === 'Bundle' ? '—' : taka(rowStockValue, rowStockValue % 1 ? 2 : 0)}
                    {p.kind !== 'Service' && p.kind !== 'Bundle' && <span data-table-helper="" className="block text-[11px] font-normal text-ink-400">{pl("at purchase price")}</span>}
                  </TableCell>}
                  {visibleColumns.unit &&
                  <TableCell className="py-2 text-ink-600">
                    {p.altUnit ?
                    <span>
                        {p.altUnit.unit} / {p.unit}
                        <span data-table-helper="" className="block text-[11px] text-ink-400">1 {p.altUnit.unit} = {p.altUnit.factor} {p.unit}</span>
                        <span data-table-helper="" className="block text-[11px] text-teal-700">{pl("POS default:")} {p.stockViewUnit ?? p.altUnit.unit}</span>
                      </span> :

                    p.unit
                    }
                  </TableCell>}
                  {visibleColumns.purchase &&
                  <TableCell className="py-2 text-right text-ink-600">
                    {p.kind==='Bundle' ? '—' : taka(p.purchasePrice, p.purchasePrice % 1 ? 2 : 0)}
                  </TableCell>}
                  {visibleColumns.selling &&
                  <TableCell className="py-2 text-right font-medium text-ink">
                    {taka(p.sellPrice, p.sellPrice % 1 ? 2 : 0)}
                    <span className="font-normal text-ink-400">/{p.unit}</span>
                    {p.altUnit &&
                    <span data-table-helper="" className="block text-[11px] font-normal text-ink-500">
                        {taka(p.altUnit.price ?? p.sellPrice * p.altUnit.factor)}/{p.altUnit.unit}
                      </span>
                    }
                  </TableCell>}
                  {visibleColumns.status &&
                  <TableCell className="py-2">
                    <StatusBadge tone={statusMeta[s].tone} dot>{pl(statusMeta[s].label)}</StatusBadge>
                  </TableCell>}
                  <TableCell className="py-2 pr-4">
                    <ProductActions
                      product={p}
                      onView={() => setDetailsProduct(p)}
                      onEdit={() => { if(p.kind==='Bundle'){setBundleEditorProduct(p);setCreatingBundle(false);}else{setEditingProduct(p);setDialogOpen(true);} }}
                      onAdjust={() => setAdjustProduct(p)}
                      onAddLot={() => setLotProduct(p)}
                      onLots={() => openLots(p)}
                      onHistory={() => openHistory(p)}
                      onOffers={() => setOfferProduct(p)}
                      onDuplicate={() => {
                        const copy = {
                          ...p,
                          id: `p${Date.now()}`,
                          name: `${p.name} Copy`,
                          sku: `${p.sku}-COPY`,
                          stock: 0
                        };
                        if(p.kind==='Bundle'){
                          const recipe=getBundleVersion(p.id);
                          if(!recipe)return toast.error('Package recipe missing');
                          const draft={product:{...copy,kind:'Bundle' as const,unit:'Set' as const,stock:0,minStock:0,purchasePrice:0},components:recipe.components};
                          try{upsertBundlePreview(draft,null);setList(availableProducts());}catch(error){return toast.error(error instanceof Error?error.message:'Could not copy package');}
                        }else setList((items) => [copy, ...items]);
                        toast.success(`${p.name} ${pl('duplicated')}`, { description: pl('Product settings copied with zero opening stock.') });
                      }}
                      onToggle={() => setList((items) => items.map((item) => item.id === p.id ? { ...item, active: !item.active } : item))}
                      onDelete={p.kind==='Bundle' && canDeleteBundlePreview(p.id) && !previewSnapshot.bundleSaleReferences.some(ref=>ref.bundleProductId===p.id)
                        ?()=>setDeleteBundleTarget(p):undefined}
                    />
                  </TableCell>
                </TableRow>);

            })}
          </TableBody>
        </Table>

        {filtered.length === 0 &&
        <div className="px-4 py-10 text-center">
            <p className="font-medium text-ink">{pl("No products match")}</p>
            <p className="mt-1 text-sm text-ink-500">{pl("Try another search or clear filters.")}</p>
            <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => {
              setQuery('');
              setCategory('All');
              setStockFilter('all');
            }}>
            
              {pl('Clear filters')}
            </Button>
          </div>
        }

        <div className="flex items-center justify-between border-t border-border px-4 py-2.5 text-xs text-ink-500">
          <span>
            {pl('Showing')} {filtered.length} / {list.length} {pl('products')}
          </span>
          <span>{pl('Prices include VAT where applicable')}</span>
        </div>
      </div>

        </>
      )}

      {view === 'lots' && (
        <StockLotsView
          products={list}
          lots={lots}
          productFilter={inventoryProductFilter}
          onProductFilter={setInventoryProductFilter}
          onAdjust={setAdjustProduct}
        />
      )}

      {view === 'history' && (
        <StockHistoryView
          products={list}
          movements={movements}
          productFilter={inventoryProductFilter}
          onProductFilter={setInventoryProductFilter}
        />
      )}

      {view === 'settings' && (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
          <ProductSettings />
        </div>
      )}

      <ImportWizard target="product" open={importOpen} onClose={()=>setImportOpen(false)}
        prepareRows={(rows)=>{
          const cleaned=rows.map(row=>({...row,issues:row.issues.filter(issue=>issue.field!=='product')}));
          const resolved=resolveProductDecisions(cleaned,availableProducts());
          const validation=planProductImport(resolved,availableProducts(),availableStockLots(),{
            sessionId:'product-review',today:new Date(Date.now()+21600000).toISOString().slice(0,10),
            baseRevision:getProductImportPreviewSnapshot().revision
          });
          return resolved.map(row=>({...row,issues:[...row.issues,...validation.issues.filter(issue=>
            issue.sourceRow===row.sourceRow&&issue.field==='product')]}));
        }}
        onApply={async(rows,sessionId)=>{
          const snapshot=getProductImportPreviewSnapshot();
          const plan=planProductImport(rows,availableProducts(),availableStockLots(),{
            sessionId,today:new Date(Date.now()+21600000).toISOString().slice(0,10),baseRevision:snapshot.revision
          });
          if(plan.issues.some(issue=>issue.severity==='error')){
            const problems=plan.issues.filter(issue=>issue.severity==='error');
            throw new Error(problems.slice(0,3).map(issue=>'Row '+issue.sourceRow+': '+issue.message).join(' • ')+
              (problems.length>3?' ('+problems.length+' errors total)':''));
          }
          const result=commitProductImportPreview(plan);
          setList(availableProducts());
          setLots(availableStockLots());
          setMovements(availableStockMovements());
          return result;
        }}/>


      <Dialog open={Boolean(deleteBundleTarget)} onOpenChange={open=>{if(!open)setDeleteBundleTarget(null);}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{pl('Delete package')}</DialogTitle>
            <DialogDescription>{pl('Delete unsold package? This cannot be undone.')}</DialogDescription>
          </DialogHeader>
          {deleteBundleTarget && <p className="text-sm font-medium text-ink">{deleteBundleTarget.name} · {deleteBundleTarget.sku}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={()=>setDeleteBundleTarget(null)}>{pl('Cancel')}</Button>
            <Button onClick={()=>{
              if(!deleteBundleTarget)return;
              try{
                deleteBundlePreview(deleteBundleTarget.id);
                setList(availableProducts());
                setDetailsProduct(current=>current?.id===deleteBundleTarget.id?null:current);
                toast.success(pl('Package deleted'));
                setDeleteBundleTarget(null);
              }catch(error){toast.error(error instanceof Error?error.message:pl('Could not delete package'));}
            }}>{pl('Delete package')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ProductDetailsDialog
        product={detailsProduct}
        lots={lots}
        offers={offers}
        movements={movements}
        open={Boolean(detailsProduct)}
        onOpenChange={(open) => { if (!open) setDetailsProduct(null); }}
        onAdjust={(product) => { setDetailsProduct(null); setAdjustProduct(product); }}
        onAddLot={(product) => { setDetailsProduct(null); setLotProduct(product); }}
        onManageOffers={(product) => { setDetailsProduct(null); setOfferProduct(product); }}
      />

      <StockAdjustmentDialog
        product={adjustProduct}
        open={Boolean(adjustProduct)}
        onOpenChange={(open) => { if (!open) setAdjustProduct(null); }}
        onSave={(result) => {
          if (adjustProduct) applyAdjustment(adjustProduct, result);
        }}
      />

      <StockLotDialog
        product={lotProduct}
        existingLots={lots}
        soldSerials={soldSerials}
        open={Boolean(lotProduct)}
        onOpenChange={(open) => { if (!open) setLotProduct(null); }}
        onSave={(lot) => { if (lotProduct) addLot(lotProduct, lot); }}
      />

      <ManageOffersDialog
        product={offerProduct}
        offers={offers}
        open={Boolean(offerProduct)}
        onOpenChange={(open) => { if (!open) setOfferProduct(null); }}
        onSaveOffers={(next) => { if (offerProduct) saveProductOffers(offerProduct, next); }}
      />
      
    </div>);

}
