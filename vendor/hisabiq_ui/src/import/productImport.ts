import type {Product,StockLot,StockMovement,ProductKind,WarrantyDurationUnit,WarrantyType} from '../types/erp.ts';
import type {ImportIssue,StagedImportRow} from './importTypes.ts';
import {toBasePrice,toBaseQuantity} from '../utils/productEntry.ts';
import {normalizeSerials,duplicateSerials} from '../utils/productFeatures.ts';

export type ProductImportCreate={sourceRow:number;product:Product;openingLot?:StockLot;openingMovement?:StockMovement};
export type ProductImportUpdate={sourceRow:number;productId:string;patch:Partial<Pick<Product,'name'|'nameBn'|'category'|'brand'|'sellPrice'|'purchasePrice'|'minStock'|'active'>>};
export type ProductImportPlan={
 sessionId:string;baseRevision:number;creates:ProductImportCreate[];updates:ProductImportUpdate[];
 issues:ImportIssue[];skipped:number;
};
const text=(value:unknown)=>value===null||value===undefined?'':String(value).trim();
const key=(value:unknown)=>text(value).toLocaleUpperCase();
const cleanId=(value:string)=>value.replace(/[^a-zA-Z0-9_-]/g,'-').slice(0,70);
const has=(row:StagedImportRow,k:string)=>text(row.mapped[k])!=='';
function numberFrom(row:StagedImportRow,field:string,required=false):number {
 const raw=text(row.mapped[field]);
 if(!raw) {if(required)throw new Error(field+' is required.');return 0;}
 if(!/^(?:\d+(?:\.\d+)?|\.\d+)$/.test(raw))throw new Error(field+' must be a non-negative finite number.');
 const num=Number(raw);
 if(!Number.isFinite(num))throw new Error(field+' must be finite.');
 return num;
}
function dateFrom(row:StagedImportRow,field:string,today:string):string|undefined{
 const value=row.mapped[field];const raw=value instanceof Date?value.toISOString().slice(0,10):text(value);
 if(!raw)return undefined;
 if(!/^\d{4}-\d{2}-\d{2}$/.test(raw)||Number.isNaN(Date.parse(raw))||new Date(raw+'T00:00:00Z').toISOString().slice(0,10)!==raw)
  throw new Error(field+' must be a real YYYY-MM-DD date.');
 if(field==='openingDate'&&raw>today)throw new Error('Opening date cannot be in the future.');
 return raw;
}
function selectedUnit(row:StagedImportRow,field:string,base:string,large?:string):string {
 const unit=text(row.mapped[field])||base;
 if(unit!==base&&unit!==large)throw new Error(field+' must be '+base+(large?' or '+large:'')+'.');
 return unit;
}
function baseQty(row:StagedImportRow,field:string,unitField:string,base:string,large:string|undefined,factor:number):number{
 const result=toBaseQuantity(numberFrom(row,field),selectedUnit(row,unitField,base,large),base,large,factor);
 if(!Number.isFinite(result)||result<0||Math.abs(Math.round(result*1e8)-result*1e8)>1e-5)throw new Error(field+' has invalid base-unit precision.');
 return Math.round(result*1e8)/1e8;
}
function basePrice(row:StagedImportRow,field:string,unitField:string,base:string,large:string|undefined,factor:number,required=false):number {
 const result=toBasePrice(numberFrom(row,field,required),selectedUnit(row,unitField,base,large),base,large,factor);
 if(!Number.isFinite(result)||result<0)throw new Error(field+' has invalid unit conversion.');
 return Math.round(result*1e8)/1e8;
}
export function resolveProductDecisions(rows:readonly StagedImportRow[],existing:readonly Product[]):StagedImportRow[]{
 const known=new Map(existing.map(item=>[key(item.sku),item]));
 const inFile=new Set<string>();
 return rows.map(row=>{
  const raw=text(row.mapped.sku);
  const sku=raw||('IMP-'+cleanId(row.sourceSheet)+'-'+row.sourceRow);
  const normalized=key(sku),already=inFile.has(normalized),match=known.get(normalized);
  inFile.add(normalized);
  const issues=row.issues.filter(i=>!(i.field==='sku'&&i.severity==='warning'));
  if(already)issues.push({sourceRow:row.sourceRow,field:'sku',severity:'warning',message:'Duplicate SKU in this file. Row skipped.'});
  else if(match)issues.push({sourceRow:row.sourceRow,field:'sku',severity:'warning',message:'SKU belongs to '+match.name+'. Choose Update master data or Skip.'});
  const wasAutoSkip=row.match?.kind==='strong'&&row.decision==='skip';
  let decision=row.decision;
  if(already)decision='skip';
  else if(match&&decision!=='update-master')decision='skip';
  else if(!match&&(decision==='update-master'||wasAutoSkip))decision='create';
  return {...row,mapped:{...row.mapped,sku},match:match?{kind:'strong' as const,existingId:match.id,label:match.name}:undefined,decision,issues};
 });
}
export function planProductImport(
 rows:readonly StagedImportRow[],existing:readonly Product[],existingLots:readonly StockLot[],
 options:{sessionId:string;today:string;baseRevision:number}
):ProductImportPlan{
 const plan:ProductImportPlan={sessionId:options.sessionId,baseRevision:options.baseRevision,creates:[],updates:[],issues:[],skipped:0};
 const known=new Map(existing.map(p=>[key(p.sku),p]));
 const seen=new Set<string>();
 const serials=existingLots.flatMap(lot=>lot.serials??[]);
 for(const row of rows){
  if(row.decision==='skip'||row.decision==='reject'){plan.skipped++;continue;}
  const error=(field:string,message:string)=>plan.issues.push({sourceRow:row.sourceRow,field,severity:'error',message});
  for(const issue of row.issues.filter(i=>i.severity==='error'))plan.issues.push(issue);
  if(row.issues.some(i=>i.severity==='error'))continue;
  try{
   const name=text(row.mapped.name),sku=text(row.mapped.sku)||('IMP-'+cleanId(options.sessionId)+'-'+row.sourceRow);
   if(!name)throw new Error('name is required.');
   const duplicateKey=key(sku);
   if(seen.has(duplicateKey))throw new Error('Duplicate SKU inside file.');
   seen.add(duplicateKey);
   const matching=known.get(duplicateKey);
   if(row.decision==='update-master'){
    if(!matching)throw new Error('Update requires a matching existing SKU.');
    if(has(row,'baseUnit')&&text(row.mapped.baseUnit)!==matching.unit)throw new Error('Cannot change existing base unit through import.');
    if(has(row,'largeUnit')&&text(row.mapped.largeUnit)!==matching.altUnit?.unit)throw new Error('Cannot change existing large unit through import.');
    if(has(row,'conversionFactor')&&Number(text(row.mapped.conversionFactor))!==(matching.altUnit?.factor??1))throw new Error('Cannot change existing unit conversion through import.');
    if(numberFrom(row,'openingStock')!==0)throw new Error('Updating a master cannot import opening stock.');
    const patch:ProductImportUpdate['patch']={name};
    if(has(row,'nameBn'))patch.nameBn=text(row.mapped.nameBn);
    if(has(row,'category'))patch.category=text(row.mapped.category);
    if(has(row,'brand'))patch.brand=text(row.mapped.brand);
    const b=matching.unit,l=matching.altUnit?.unit,f=matching.altUnit?.factor??1;
    if(has(row,'sellingPrice'))patch.sellPrice=basePrice(row,'sellingPrice','sellingPriceUnit',b,l,f,true);
    if(has(row,'purchasePrice'))patch.purchasePrice=basePrice(row,'purchasePrice','purchasePriceUnit',b,l,f);
    if(has(row,'minimumStock'))patch.minStock=baseQty(row,'minimumStock','minimumStockUnit',b,l,f);
    plan.updates.push({sourceRow:row.sourceRow,productId:matching.id,patch});continue;
   }
   if(row.decision!=='create')throw new Error('Unsupported import decision.');
   if(matching)throw new Error('SKU already exists; choose Skip or Update master data.');
   const kindText=text(row.mapped.kind)||'Stock';
   if(!['stock','service'].includes(kindText.toLowerCase()))throw new Error('Invalid Product Type.');
   const kind:ProductKind=kindText.toLowerCase()==='service'?'Service':'Stock';
   const base=text(row.mapped.baseUnit)||(kind==='Service'?'Service':'');
   if(!base)throw new Error('baseUnit is required for stock items.');
   const large=text(row.mapped.largeUnit)||undefined;
   if(large===base)throw new Error('Larger and base unit cannot be identical.');
   if(Boolean(large)!==has(row,'conversionFactor'))throw new Error('Larger unit and conversion factor must both be provided.');
   const factor=large?numberFrom(row,'conversionFactor',true):1;
   if(factor<=0||!Number.isFinite(factor))throw new Error('Conversion factor must be positive.');
   if(kind==='Service'&&(large||has(row,'serialNumbers')||has(row,'batchNumber')||has(row,'expiryDate')))throw new Error('Service cannot carry inventory/serial/lot fields.');
   const view=text(row.mapped.stockViewUnit)||large||base;
   if(view!==base&&view!==large)throw new Error('Unknown stock display unit.');
   const purchasePrice=basePrice(row,'purchasePrice','purchasePriceUnit',base,large,factor);
   const sellPrice=basePrice(row,'sellingPrice','sellingPriceUnit',base,large,factor,true);
   if(sellPrice<=0)throw new Error('Selling price must be greater than zero.');
   const stock=baseQty(row,'openingStock','openingStockUnit',base,large,factor);
   const minStock=baseQty(row,'minimumStock','minimumStockUnit',base,large,factor);
   if(kind==='Service'&&(stock||minStock))throw new Error('Service cannot have opening or minimum stock.');
   const rawSerial=text(row.mapped.serialTracking)||'Off';
   const serialTracking=(['Off','Optional','Required'] as const).find(v=>v.toLowerCase()===rawSerial.toLowerCase());
   if(!serialTracking)throw new Error('Invalid serial tracking mode.');
   const importedSerials=normalizeSerials(text(row.mapped.serialNumbers));
   if(serialTracking==='Off'&&importedSerials.length)throw new Error('Serials provided but tracking is Off.');
   if(kind==='Service'&&serialTracking!=='Off')throw new Error('Service cannot track serials.');
   const repeated=duplicateSerials(importedSerials,serials);
   if(repeated.length)throw new Error('Duplicate serial: '+repeated[0]);
   if(serialTracking==='Required'&&(!Number.isInteger(stock)||importedSerials.length!==stock))
    throw new Error('Required serial tracking must list exactly one serial per opening base unit.');
   const openingDate=dateFrom(row,'openingDate',options.today);
   const manufactureDate=dateFrom(row,'manufactureDate',options.today);
   const expiryDate=dateFrom(row,'expiryDate',options.today);
   if(manufactureDate&&expiryDate&&expiryDate<=manufactureDate)throw new Error('Expiry must follow manufacture date.');
   if(stock>0&&!openingDate)throw new Error('Opening date is required for nonzero stock.');
   if(kind==='Service'&&(has(row,'openingDate')||has(row,'openingUnitCost')))throw new Error('Service cannot have opening lot details.');
   const explicitCost=has(row,'openingUnitCost')?basePrice(row,'openingUnitCost','openingCostUnit',base,large,factor):undefined;
   const mode=text(row.mapped.warrantyDurationUnit)||'Months';
   if(has(row,'warrantyDuration')&&!['Days','Months','Years'].includes(mode))throw new Error('Invalid warranty unit.');
   const warrantyType=text(row.mapped.warrantyType)||'Seller';
   if(has(row,'warrantyDuration')&&!['Seller','Manufacturer','Service','Replacement'].includes(warrantyType))throw new Error('Invalid warranty type.');
   const warrantyDuration=numberFrom(row,'warrantyDuration');
   if(has(row,'warrantyDuration')&&warrantyDuration<=0)throw new Error('Warranty must be positive.');
   const productId='imp-'+cleanId(options.sessionId)+'-'+row.sourceRow;
   const product:Product={
    id:productId,kind,name,nameBn:text(row.mapped.nameBn)||undefined,sku,
    category:text(row.mapped.category)||'Uncategorized',
    brand:text(row.mapped.brand)||undefined,unit:base,
    altUnit:large?{unit:large,factor,price:has(row,'largeUnitSellingPrice')?numberFrom(row,'largeUnitSellingPrice'):undefined}:undefined,
    stock:kind==='Stock'?stock:0,stockViewUnit:kind==='Stock'?view:undefined,
    minStock:kind==='Stock'?minStock:0,sellPrice,purchasePrice,
    serialTracking:kind==='Service'?'Off':serialTracking,
    expiry:kind==='Service'?undefined:{enabled:Boolean(expiryDate),dateRequired:Boolean(expiryDate),warningDays:30,allocationMethod:'FIFO'},
    warranty:{enabled:warrantyDuration>0,duration:warrantyDuration||undefined,durationUnit:mode as WarrantyDurationUnit,type:warrantyType as WarrantyType},
    active:true
   };
   const change:ProductImportCreate={sourceRow:row.sourceRow,product};
   if(stock>0){
    const reference='IMP-'+cleanId(options.sessionId)+'-ROW-'+row.sourceRow;
    change.openingLot={id:'lot-'+productId+'-opening',productId,label:'Opening Stock',source:'Opening',receivedAt:openingDate!,
     quantity:stock,available:stock,unitCost:explicitCost??purchasePrice,reference,
     batchNumber:text(row.mapped.batchNumber)||undefined,manufactureDate,expiryDate,
     serials:importedSerials.length?importedSerials:undefined};
    change.openingMovement={id:'mov-'+productId+'-opening',productId,date:openingDate!,type:'Opening',
     quantity:stock,balance:stock,reference,note:'Imported opening stock · sheet '+row.sourceSheet+' row '+row.sourceRow};
    serials.push(...importedSerials);
   }
   plan.creates.push(change);known.set(duplicateKey,product);
  }catch(e){error('product',e instanceof Error?e.message:'Invalid product import row.');}
 }
 return plan;
}
