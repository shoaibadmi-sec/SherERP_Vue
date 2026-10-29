import {useEffect,useMemo,useRef,useState} from 'react';
import {ArrowLeft,Eye,Plus,Trash2} from 'lucide-react';
import {Button} from '../Button';
import {Input} from '../Input';
import {ProductThumb} from '../ProductThumb';
import {QuickAddSelect} from '../QuickAddSelect';
import {AppSelect} from '../AppSelect';
import {productUnitFactor} from '../../utils/unitChain';
import {unitsFor} from '../../utils/units';
import {ProductCombobox} from '../pos/ProductCombobox';
import {CompoundQuantityInput} from '../transactions/CompoundQuantityInput';
import type {BundleComponent,BundleDraft,BundleVersion,Product} from '../../types/erp';
import {getBundleVersion} from '../../data/productImportPreviewStore';
import {availableProductCategories,availableStockLots,createPreviewProductCategory} from '../../data/erpDemoStore';
import {makeBundleComponent,validateBundleDraft} from '../../bundles/bundleValidation';
import {priceBundleComponents} from '../../bundles/bundlePricing';
import {useUiCopy} from '../../i18n/useUiCopy';
import {taka} from '../../utils/currency';

type Row={productId:string;unit:string;qty:string;secondary:string};
export type BundleEditorProps={
 initialProduct?:Product|null;
 catalog:readonly Product[];
 onSave:(draft:BundleDraft,expectedRevision:number|null,expectedRecipe?:BundleVersion)=>void;
 onCancel:()=>void;
};
const grid='grid min-w-0 grid-cols-[36px_minmax(130px,1fr)_160px_88px_168px_112px_28px] items-center gap-1.5';
/** Same mobile/tablet cart layout and component controls as POS V2; no inventory posting. */
export function BundleEditor({initialProduct=null,catalog,onSave,onCancel}:BundleEditorProps){
 const {text}=useUiCopy();
 const [expectedRecipe]=useState(()=>initialProduct?getBundleVersion(initialProduct.id):undefined);
 const [expectedRevision]=useState(()=>expectedRecipe?.revision??null);
 const [productId]=useState(()=>initialProduct?.id??'bundle-'+Date.now()+'-'+Math.random().toString(36).slice(2,7));
 const [name,setName]=useState(initialProduct?.name??'');
 const [nameBn,setNameBn]=useState(initialProduct?.nameBn??'');
 const [sku,setSku]=useState(initialProduct?.sku??'');
 const [category,setCategory]=useState(initialProduct?.category??'Hardware');
 const [categories,setCategories]=useState(availableProductCategories);
 const [price,setPrice]=useState(initialProduct?String(initialProduct.sellPrice):'');
 const [rows,setRows]=useState<Row[]>(()=>expectedRecipe?.components.map(comp=>({
  productId:comp.productId,unit:comp.selectedUnit,qty:comp.primaryQty,secondary:comp.secondaryQty
 }))??[]);
 const [error,setError]=useState('');
 const [revealed,setRevealed]=useState<string|null>(null);
 const [lastAdded,setLastAdded]=useState<string|null>(null);
 const searchRef=useRef<HTMLInputElement>(null);
 const quantityRefs=useRef<Record<string,HTMLInputElement|null>>({});
 const smallRefs=useRef<Record<string,HTMLInputElement|null>>({});
 useEffect(()=>{
  if(!lastAdded)return;
  const input=quantityRefs.current[lastAdded];
  input?.focus();input?.select();
 },[lastAdded,rows.length]);
 const stockProducts=useMemo(()=>catalog.filter(p=>p.active&&(!p.kind||p.kind==='Stock')),[catalog]);
 const selectedIds=new Set(rows.map(r=>r.productId));
 const productFor=(row:Row)=>catalog.find(p=>p.id===row.productId);
 const setRow=(index:number,patch:Partial<Row>)=>{
  setRows(current=>current.map((r,i)=>i===index?{...r,...patch}:r));setError('');
 };
 const addProduct=(product:Product)=>{
  if(selectedIds.has(product.id)){setError(text('Product already included.','এই পণ্যটি আগেই আছে।'));return;}
  setRows(old=>[...old,{productId:product.id,unit:product.stockViewUnit&&unitsFor(product).includes(product.stockViewUnit)?product.stockViewUnit:product.altUnit?.unit??product.unit,qty:'1',secondary:''}]);
  setLastAdded(product.id);setError('');
 };
 const selectUnit=(index:number,product:Product,row:Row,unit:string)=>{
  if(row.unit===unit)return;
  // Changing retail/quantity display unit must never silently change component stock quantity.
  try{
   const base=makeBundleComponent(product,row.unit,row.qty,row.secondary,index).baseQty;
   if(unit===product.unit)setRow(index,{unit,qty:String(base),secondary:''});
   else if(productUnitFactor(product,unit)>1){
    const factor=productUnitFactor(product,unit);
    const whole=Math.floor((base+1e-9)/factor);
    const remaining=Number((base-whole*factor).toFixed(4));
    setRow(index,{unit,qty:String(whole),secondary:remaining?String(remaining):''});
   }
  }catch(e){setError(e instanceof Error?e.message:'Review this quantity before changing the unit.');}
 };
 const components=useMemo(()=>{
  const items:BundleComponent[]=[];
  for(const [index,row] of rows.entries()){
   const product=catalog.find(p=>p.id===row.productId);
   if(!product)continue;
   try{items.push(makeBundleComponent(product,row.unit,row.qty,row.secondary,index));}catch{ /* Save reports inline error. */ }
  }
  return items;
 },[rows,catalog]);
 const pricing=useMemo(()=>priceBundleComponents(
  components,catalog,availableStockLots(),Number(price)
 ),[components,catalog,price]);
 const findPrice=(id:string)=>pricing.lines.find(l=>l.productId===id);
 const save=()=>{
  try{
   const parsedPrice=Number(price);
   if(!price.trim()||!Number.isFinite(parsedPrice)||parsedPrice<=0)throw new Error('Enter a valid package price.');
   const exact=rows.map((row,i)=>{
    const product=productFor(row);
    if(!product)throw new Error('One component no longer exists.');
    return makeBundleComponent(product,row.unit,row.qty,row.secondary,i);
   });
   const product:BundleDraft['product']={
    id:productId,kind:'Bundle',name:name.trim(),nameBn:nameBn.trim()||undefined,
    sku:sku.trim(),category,unit:'Set',stock:0,minStock:0,
    purchasePrice:0,sellPrice:parsedPrice,active:initialProduct?.active??true
   };
   const draft={product,components:exact};
   const issues=validateBundleDraft(draft,catalog);
   if(issues.length)throw new Error(issues.join(' '));
   onSave(draft,expectedRevision,expectedRecipe);
  }catch(e){setError(e instanceof Error?e.message:'Package could not be saved.');}
 };
 const cancel=()=>{
  if((rows.length>0||name||price)&&!window.confirm(text('Discard unsaved package changes?','প্যাকেজের পরিবর্তনগুলো বাতিল করবেন?')))return;
  onCancel();
 };
 const costNumber=(v:number)=>taka(v,Math.abs(v)%1?2:0);
 const zeroOrInvalid=!Number.isFinite(Number(price))||Number(price)<=0;
 const summary=[
  {name:'Component purchase cost',bn:'পণ্যগুলোর কেনা দাম',amount:pricing.componentPurchaseCost},
  {name:'Products at POS prices',bn:'পণ্য আলাদা বিক্রির মোট দাম',amount:pricing.componentsRetailTotal},
  {name:'Package selling price',bn:'প্যাকেজ বিক্রির দাম',amount:Number(price)||0},
  {name:'Estimated package profit',bn:'প্যাকেজের আনুমানিক লাভ',amount:pricing.estimatedProfit}
 ];
 return <section data-testid="bundle-editor" className="mx-auto w-full max-w-[1440px] min-w-0 space-y-3">
  <div className="flex flex-wrap items-center justify-between gap-3">
   <div>
    <button type="button" onClick={cancel} className="mb-1 inline-flex items-center gap-1 text-xs text-ink-500 hover:text-ink">
     <ArrowLeft className="size-4"/>{text('Back to products','পণ্য তালিকায় ফিরুন')}
    </button>
    <h1 className="text-lg font-semibold text-ink">{initialProduct?text('Edit package','প্যাকেজ বদলান'):text('New package','নতুন প্যাকেজ')}</h1>
    <p className="text-xs text-ink-500">{text('Build a package from stock products. Sold recipes remain protected.','স্টকের পণ্য দিয়ে প্যাকেজ তৈরি করুন। বিক্রির পুরনো প্যাকেজ অপরিবর্তিত থাকবে।')}</p>
   </div>
   <div className="flex gap-2"><Button size="sm" variant="outline" onClick={cancel}>{text('Cancel','বাতিল')}</Button>
    <Button size="sm" onClick={save}>{text('Save package','প্যাকেজ সংরক্ষণ')}</Button></div>
  </div>
  <div className="rounded-xl border border-border bg-card p-3 shadow-card sm:p-4">
   <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
    <label className="min-w-0 space-y-1 text-xs font-medium text-ink">
     <span>{text('Package name','প্যাকেজের নাম')}</span>
     <Input aria-label="Package name" value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Tubewell Set"/>
    </label>
    <label className="min-w-0 space-y-1 text-xs font-medium text-ink">
     <span>{text('Package SKU','প্যাকেজ কোড')}</span>
     <Input aria-label="Package SKU" value={sku} onChange={e=>setSku(e.target.value)} placeholder="PKG-001"/>
    </label>
    <div className="min-w-0 space-y-1 text-xs font-medium text-ink">
     <p>{text('Category','ধরন')}</p>
     <QuickAddSelect label="Category" value={category} options={categories.filter(c=>c!=='All')} onChange={setCategory}
      onCreate={value=>{createPreviewProductCategory(value);setCategories(availableProductCategories());setCategory(value);}}/>
    </div>
    <label className="min-w-0 space-y-1 text-xs font-medium text-ink">
     <span>{text('Bangla name (optional)','বাংলা নাম (ঐচ্ছিক)')}</span>
     <Input aria-label="Bangla name" value={nameBn} onChange={e=>setNameBn(e.target.value)}/>
    </label>
    <label className="min-w-0 space-y-1 text-xs font-medium text-ink">
     <span>{text('Price per Set','প্রতি সেটের দাম')}</span>
     <Input aria-label="Price per Set" inputMode="decimal" value={price}
      onChange={e=>setPrice(e.target.value.replace(/[^\d.]/g,''))} placeholder="0.00"/>
    </label>
    <div className="flex flex-col justify-end">
     <Button size="sm" variant="outline" onClick={()=>setPrice(String(Number(pricing.componentsRetailTotal.toFixed(2))))}
      disabled={rows.length===0||pricing.componentsRetailTotal<=0}>{text('Use POS price total','POS দামের মোট বসান')}</Button>
    </div>
   </div>
  </div>
  <div className="grid min-w-0 gap-3 2xl:grid-cols-[minmax(0,1fr)_310px]">
   <div className="min-w-0 space-y-2">
    <div className="flex flex-wrap items-center justify-between gap-2 px-1">
     <h2 className="text-sm font-semibold text-ink">{text('Included products','প্যাকেজের পণ্য')} · {rows.length}</h2>
     <span className="text-xs text-ink-500">{text('POS-style quantity, unit, price and total','POS-এর মতো পরিমাণ, একক, দাম ও মোট')}</span>
    </div>
    <div data-cart-kind="sale" data-bundle-cart className="min-w-0 overflow-x-auto rounded-xl border border-border bg-card shadow-card">
     <div data-cart-header className={grid+' border-b border-border px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-ink-400'}>
      <span>#</span><span>{text('Product','পণ্য')}</span><span>{text('Quantity','পরিমাণ')}</span>
      <span>{text('Price in','দামের একক')}</span><span>{text('POS price','POS দাম')}</span>
      <span className="text-right">{text('Total','মোট')}</span><span/>
     </div>
     <div className="divide-y divide-border" data-testid="bundle-cart">
      {rows.map((row,index)=>{
       const product=productFor(row);
       if(!product)return <div key={row.productId} className="p-3 text-sm text-danger">{row.productId}: {text('Product missing','পণ্য নেই')}</div>;
       const amounts=findPrice(row.productId);
       const units=unitsFor(product);
       const isLarge=productUnitFactor(product,row.unit)>1;
       return <div key={row.productId} data-cart-row="sale" data-compound={isLarge} data-testid="bundle-component-row"
        className={grid+' relative bg-card px-3 py-1.5'}>
        <div className="flex items-center justify-end"><span className="text-xs text-ink-400">{index+1}.</span></div>
        <div className="flex min-w-0 items-center gap-2">
         <ProductThumb src={product.image} size={32}/>
         <div className="min-w-0">
          <p className="truncate text-[13px] font-medium text-ink">{product.name}</p>
          <p data-table-helper="" className="truncate text-[11px] text-ink-500">{product.sku} · {product.category}</p>
         </div>
        </div>
        <div data-cart-field="Quantity · পরিমাণ">
         <CompoundQuantityInput key={row.unit} product={product} unit={row.unit} primary={row.qty} secondary={row.secondary}
          primaryLabel={'Quantity for '+product.name} secondaryLabel={'Small quantity for '+product.name}
          primaryRef={el=>{quantityRefs.current[row.productId]=el;}}
          secondaryRef={el=>{smallRefs.current[row.productId]=el;}}
          onPrimaryChange={qty=>setRow(index,{qty})} onSecondaryChange={secondary=>setRow(index,{secondary})}
          onPrimaryEnter={()=>{if(isLarge){smallRefs.current[row.productId]?.focus();smallRefs.current[row.productId]?.select();}else searchRef.current?.focus();}}
          onSecondaryEnter={()=>searchRef.current?.focus()}/>
        </div>
        <div data-cart-field="Price in · একক" className="min-w-0">
         {units.length>1?units.length>2?(
          <AppSelect label={'Unit for '+product.name} value={row.unit}
            options={units} onChange={unit=>selectUnit(index,product,row,unit)}/>
         ):<div role="radiogroup" aria-label={'Unit for '+product.name}
           className="flex h-9 min-w-0 rounded-md bg-ink-50 p-0.5">
          {units.map(u=><button key={u} type="button" role="radio" aria-checked={row.unit===u}
            onClick={()=>selectUnit(index,product,row,u)}
            className={'min-w-0 flex-1 rounded px-1 text-[11px] font-medium '+(row.unit===u?'bg-card text-ink shadow-card ring-1 ring-primary':'text-ink-500 hover:text-ink')}>{u}</button>)}
         </div>:<span className="px-2 text-sm text-ink-600">{row.unit}</span>}
        </div>
        <div data-cart-field="Price · দাম" className="min-w-0">
         <div className="relative flex min-w-0 items-center gap-1">
         <div className="flex h-9 min-w-0 flex-1 items-center rounded-md border border-border bg-ink-50/50 px-2 text-sm text-ink">
          <span className="min-w-0 whitespace-nowrap">{amounts?costNumber(amounts.retailUnitPrice):'—'}</span>
         </div>
         <button type="button" aria-label={'Show purchase cost for '+product.name} aria-pressed={revealed===product.id}
          onClick={()=>setRevealed(v=>v===product.id?null:product.id)}
          className="flex size-6 shrink-0 items-center justify-center rounded text-ink-500 hover:bg-teal-50 hover:text-teal-700">
          <Eye className="size-3.5"/>
         </button>
         {revealed===product.id&&amounts&&<div className="absolute right-0 top-full z-30 mt-1 min-w-[180px] rounded-md border border-border bg-card px-2 py-1.5 text-[11px] text-ink-700 shadow-pop">
          <p>{text('Estimated purchase','আনুমানিক কেনা দাম')}: {costNumber(amounts.purchaseTotal)}</p>
          <p>{text('Purchase per base unit','প্রতি ছোট একক কেনা')}: {costNumber(amounts.purchaseTotal/amounts.baseQty)}/{product.unit}</p>
          {amounts.stockShort>0&&<p className="text-warning">{text('Cost includes missing-stock estimate','কম স্টকের আনুমানিক দাম ধরা হয়েছে')}</p>}
         </div>}
         </div>
        </div>
        <span data-cart-field="Total · মোট" className="text-right text-[13px] font-semibold text-ink">
         {amounts?costNumber(amounts.retailTotal):'—'}
        </span>
        <button type="button" aria-label={'Remove '+product.name} title={text('Remove product','পণ্য বাদ দিন')}
         onClick={()=>{setRows(old=>old.filter((_,i)=>i!==index));setRevealed(null);setError('');}}
         className="flex size-8 items-center justify-center rounded-md text-ink-400 hover:bg-danger-bg hover:text-danger">
         <Trash2 className="size-4"/>
        </button>
       </div>;
      })}
      <div data-cart-add className={grid+' border-t border-border bg-teal-50/35 px-3 py-2'}>
       <span className="text-right text-sm text-teal-600">{rows.length+1}.</span>
       <ProductCombobox ref={searchRef} ariaLabel="Find stock component" mode="purchase"
        products={stockProducts.filter(p=>!selectedIds.has(p.id))} onSelect={addProduct}/>
       <span className="text-xs text-ink-400">{text('Qty','পরিমাণ')}</span>
       <span className="text-xs text-ink-400">{text('Unit','একক')}</span>
       <span className="text-xs text-ink-400">{text('Price','দাম')}</span>
       <span className="text-right text-xs text-ink-400">{text('Total','মোট')}</span><span/>
      </div>
     </div>
    </div>
    {rows.length<2&&<p className="px-1 text-xs text-ink-500">{text('Add at least two stock products.','অন্তত দুটি স্টক পণ্য যোগ করুন।')}</p>}
   </div>
   <aside data-testid="bundle-pricing-summary" className="min-w-0 space-y-3 self-start rounded-xl border border-border bg-card p-3 shadow-card sm:p-4">
    <h2 className="text-sm font-semibold text-ink">{text('Package price & profit','প্যাকেজের দাম ও লাভ')}</h2>
    <div className="grid grid-cols-2 gap-2 2xl:grid-cols-1">
     {summary.map(item=><div key={item.name} className="rounded-lg border border-border bg-ink-50/40 px-3 py-2">
      <p className="text-[11px] text-ink-500">{text(item.name,item.bn)}</p>
      <p className={'mt-1 text-base font-semibold '+(item.name==='Estimated package profit'&&item.amount!==null&&item.amount<0?'text-danger':'text-ink')}>
       {item.amount===null||item.name==='Estimated package profit'&&zeroOrInvalid?'—':costNumber(item.amount)}
      </p>
     </div>)}
    </div>
    <div className="text-xs text-ink-500">
     {pricing.estimatedMarginPercent!==null&&<p>{text('Estimated margin','আনুমানিক লাভের হার')}: {pricing.estimatedMarginPercent.toFixed(1)}%</p>}
     <p>{pricing.costFromAvailableLots?
      text('Current lot-based cost estimate. Final cost depends on sale allocations.','বর্তমান লট অনুযায়ী আনুমানিক খরচ। বিক্রির লট অনুযায়ী চূড়ান্ত খরচ হবে।'):
      text('Some stock is missing; catalog purchase price was used for those quantities.','কিছু স্টক কম আছে; সেগুলোর জন্য তালিকার কেনা দাম ধরা হয়েছে।')}</p>
    </div>
    {error&&<p role="alert" className="rounded-lg border border-danger/30 bg-danger-bg p-2 text-sm text-danger">{error}</p>}
    <Button className="w-full" onClick={save}><Plus className="size-4"/>{text('Save package','প্যাকেজ সংরক্ষণ')}</Button>
   </aside>
  </div>
  {error&&<p role="alert" className="text-sm text-danger 2xl:hidden">{error}</p>}
  <p className="text-[11px] text-ink-500">{text('Preview only — no inventory, payment or ledger is posted.','শুধু প্রিভিউ — স্টক, টাকা বা খাতায় কোনো লেনদেন জমা হয় না।')}</p>
 </section>;
}
