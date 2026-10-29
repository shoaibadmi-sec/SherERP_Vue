import { AppSelect } from '../AppSelect';
import { useMemo } from 'react';
import { Search } from 'lucide-react';
import { Button } from '../Button';
import { StatusBadge, type StatusTone } from '../StatusBadge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../Table';
import type { Product, StockLot, StockMovement, StockMovementType } from '../../types/erp';
import { taka } from '../../utils/currency';
import { formatStock } from '../../utils/units';
import { lotExpiryState } from '../../utils/productFeatures';
import {useUiCopy} from '../../i18n/useUiCopy';
import {productInventoryLabel} from '../../i18n/productInventoryCopy';

function productById(products: Product[], id: string) {
  return products.find((product) => product.id === id);
}

function ProductFilterSelect({
  products,
  value,
  onChange
}: {
  products: Product[];
  value: string;
  onChange: (productId: string) => void;
}) {
  const {language}=useUiCopy();
  const pl=(english:string)=>productInventoryLabel(language,english);
  return <AppSelect label={pl('Filter inventory by product')} value={value} onChange={onChange}
    options={[{ value: '', label: pl('All products') }, ...products.filter((product) => product.kind !== 'Service')
      .map((product) => ({ value: product.id, label: product.name }))]} />;

}

export function StockLotsView({
  products,
  lots,
  productFilter,
  onProductFilter,
  onAdjust
}: {
  products: Product[];
  lots: StockLot[];
  productFilter: string;
  onProductFilter: (productId: string) => void;
  onAdjust: (product: Product) => void;
}) {
  const {language}=useUiCopy();
  const pl=(english:string)=>productInventoryLabel(language,english);
  const filtered = useMemo(
    () => lots.filter((lot) => !productFilter || lot.productId === productFilter),
    [lots, productFilter]
  );
  const availableLots = filtered.filter((lot) => lot.available > 0);
  const value = availableLots.reduce((sum, lot) => sum + lot.available * lot.unitCost, 0);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-card">
          <p className="text-xs text-ink-500">{pl("Available lots")}</p>
          <p className="mt-0.5 text-lg font-semibold text-ink">{availableLots.length}</p>
          <p className="text-[11px] text-ink-400">{pl("Lots with remaining stock")}</p>
        </div>
        <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-card">
          <p className="text-xs text-ink-500">{pl("Lot stock value")}</p>
          <p className="mt-0.5 text-lg font-semibold text-ink">{taka(value, value % 1 ? 2 : 0)}</p>
          <p className="text-[11px] text-ink-400">{pl("At lot purchase cost")}</p>
        </div>
        <div className="col-span-2 rounded-xl border border-border bg-card px-4 py-3 shadow-card lg:col-span-1">
          <p className="text-xs text-ink-500">{pl("Selected product")}</p>
          <p className="mt-0.5 truncate text-sm font-semibold text-ink">
            {productFilter ? productById(products, productFilter)?.name ?? pl('Unknown') : pl('All products')}
          </p>
          <p className="text-[11px] text-ink-400">{pl("Filter lots by product")}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-card">
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
          <div className="min-w-[220px] flex-1 sm:max-w-sm">
            <ProductFilterSelect products={products} value={productFilter} onChange={onProductFilter} />
          </div>
          {productFilter && (
            <Button variant="outline" size="sm" onClick={() => onProductFilter('')}>{pl('Clear product')}</Button>
          )}
          {productFilter && productById(products, productFilter) && (
            <Button size="sm" onClick={() => onAdjust(productById(products, productFilter)!)}>
              {pl('Adjust stock')}
            </Button>
          )}
        </div>

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-9 text-xs">{pl("Source / lot")}</TableHead>
              <TableHead className="h-9 text-xs">{pl("Product")}</TableHead>
              <TableHead className="h-9 text-xs">{pl("Received")}</TableHead>
              <TableHead className="h-9 text-right text-xs">{pl("Qty in")}</TableHead>
              <TableHead className="h-9 text-right text-xs">{pl("Available")}</TableHead>
              <TableHead className="h-9 text-right text-xs">{pl("Unit cost")}</TableHead>
              <TableHead className="h-9 text-right text-xs">{pl("Lot sale")}</TableHead>
              <TableHead className="h-9 text-right text-xs">{pl("Value")}</TableHead>
              <TableHead className="h-9 text-xs">{pl("Lot details")}</TableHead>
              <TableHead className="h-9 text-xs">{pl("Status")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((lot) => {
              const product = productById(products, lot.productId);
              if (!product) return null;
              const lotValue = lot.available * lot.unitCost;
              const expiryState = lotExpiryState(lot, product.expiry?.warningDays ?? 0);
              return (
                <TableRow key={lot.id} className="text-[13px]">
                  <TableCell className="py-2">
                    <p className="font-medium text-ink">{lot.label}</p>
                    {lot.reference && <p data-table-helper="" className="text-[11px] text-ink-400">{lot.reference}</p>}
                  </TableCell>
                  <TableCell className="py-2">
                    <p className="font-medium text-ink">{product.name}</p>
                    {product.nameBn && <p data-table-helper="" className="font-bn text-[11px] text-ink-400">{product.nameBn}</p>}
                  </TableCell>
                  <TableCell className="py-2 text-ink-600">{lot.receivedAt}</TableCell>
                  <TableCell className="py-2 text-right text-ink-600">{formatStock({ ...product, stock: lot.quantity })}</TableCell>
                  <TableCell className="py-2 text-right font-medium text-ink">{formatStock({ ...product, stock: lot.available })}</TableCell>
                  <TableCell className="py-2 text-right text-ink-600">{taka(lot.unitCost, lot.unitCost % 1 ? 2 : 0)}/{product.unit}</TableCell>
                  <TableCell className="py-2 text-right text-ink-600">{lot.sellingPrice !== undefined ? `${taka(lot.sellingPrice, lot.sellingPrice % 1 ? 2 : 0)}/${product.unit}` : pl("Default")}</TableCell>
                  <TableCell className="py-2 text-right font-medium text-ink">{taka(lotValue, lotValue % 1 ? 2 : 0)}</TableCell>
                  <TableCell className="py-2">
                    <p className="text-ink-600">{lot.batchNumber ? `${pl('Batch')} ${lot.batchNumber}` : pl('No batch')}</p>
                    <p data-table-helper="" className="text-[11px] text-ink-400">{lot.expiryDate ? `${pl('Exp')} ${lot.expiryDate}` : pl('No expiry')}{lot.serials?.length ? ` · ${lot.serials.length} ${pl('serials')}` : ''}</p>
                  </TableCell>
                  <TableCell className="py-2">
                    <StatusBadge tone={lot.available <= 0 ? 'neutral' : expiryState === 'Expired' ? 'danger' : expiryState === 'Expiring soon' ? 'warning' : 'success'} dot>
                      {pl(lot.available <= 0 ? 'Depleted' : expiryState === 'No expiry' ? 'Open' : expiryState)}
                    </StatusBadge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {filtered.length === 0 && <p className="px-4 py-10 text-center text-sm text-ink-500">{pl("No stock lots match this product.")}</p>}
      </div>
    </div>
  );
}

const movementTone: Record<StockMovementType, StatusTone> = {
  Opening: 'neutral',
  Purchase: 'teal',
  Sale: 'info',
  Return: 'success',
  Adjustment: 'warning'
};

export function StockHistoryView({
  products,
  movements,
  productFilter,
  onProductFilter
}: {
  products: Product[];
  movements: StockMovement[];
  productFilter: string;
  onProductFilter: (productId: string) => void;
}) {
  const {language}=useUiCopy();
  const pl=(english:string)=>productInventoryLabel(language,english);
  const filtered = useMemo(
    () => movements
      .filter((movement) => !productFilter || movement.productId === productFilter)
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date)),
    [movements, productFilter]
  );

  return (
    <div className="rounded-xl border border-border bg-card shadow-card">
      <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
        <div className="relative flex-1 text-sm text-ink-500">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
          <div className="h-9 rounded-md border border-border pl-8 pr-3 leading-9">{pl('Stock movement audit trail')}</div>
        </div>
        <div className="w-full sm:w-64">
          <ProductFilterSelect products={products} value={productFilter} onChange={onProductFilter} />
        </div>
        {productFilter && <Button variant="outline" size="sm" onClick={() => onProductFilter('')}>{pl('Clear')}</Button>}
      </div>

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="h-9 text-xs">{pl("Date")}</TableHead>
            <TableHead className="h-9 text-xs">{pl("Product")}</TableHead>
            <TableHead className="h-9 text-xs">{pl("Movement")}</TableHead>
            <TableHead className="h-9 text-right text-xs">{pl("Quantity")}</TableHead>
            <TableHead className="h-9 text-right text-xs">{pl("Balance")}</TableHead>
            <TableHead className="h-9 text-xs">{pl("Reference")}</TableHead>
            <TableHead className="h-9 text-xs">{pl("Note")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((movement) => {
            const product = productById(products, movement.productId);
            if (!product) return null;
            const absolute = Math.abs(movement.quantity);
            return (
              <TableRow key={movement.id} className="text-[13px]">
                <TableCell className="py-2 text-ink-600">{movement.date}</TableCell>
                <TableCell className="py-2">
                  <p className="font-medium text-ink">{product.name}</p>
                  {product.nameBn && <p data-table-helper="" className="font-bn text-[11px] text-ink-400">{product.nameBn}</p>}
                </TableCell>
                <TableCell className="py-2"><StatusBadge tone={movementTone[movement.type]}>{pl(movement.type)}</StatusBadge></TableCell>
                <TableCell className={`py-2 text-right font-medium ${movement.quantity < 0 ? 'text-danger' : 'text-success'}`}>
                  {movement.quantity > 0 ? '+' : movement.quantity < 0 ? '−' : ''}{formatStock({ ...product, stock: absolute })}
                </TableCell>
                <TableCell className="py-2 text-right font-medium text-ink">{formatStock({ ...product, stock: movement.balance })}</TableCell>
                <TableCell className="py-2 text-ink-600">{movement.reference ?? '—'}</TableCell>
                <TableCell className="max-w-[260px] py-2 text-ink-500">{movement.note ?? '—'}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {filtered.length === 0 && <p className="px-4 py-10 text-center text-sm text-ink-500">{pl("No stock movements match this product.")}</p>}
    </div>
  );
}

