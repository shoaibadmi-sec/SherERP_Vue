import type {ImportTarget,StagedImportRow} from './importTypes.ts';
import {fieldsFor} from './fieldSchemas.ts';

const examples:Record<ImportTarget,Record<string,string>>={
 product:{
  name:'LED Bulb 12W',nameBn:'এলইডি বাল্ব',sku:'LED-0120',kind:'Stock',
  category:'Electrical',brand:'Vision',baseUnit:'Pcs',largeUnit:'Box',
  conversionFactor:'10',stockViewUnit:'Box',
  purchasePrice:'1200',purchasePriceUnit:'Box',sellingPrice:'165',sellingPriceUnit:'Pcs',
  largeUnitSellingPrice:'1550',minimumStock:'10',minimumStockUnit:'Pcs',
  openingStock:'2',openingStockUnit:'Box',openingDate:'2026-10-01',
  openingUnitCost:'1200',openingCostUnit:'Box',serialTracking:'Off'
 },
 customer:{name:'Rahim Hardware',nameBn:'রহিম হার্ডওয়্যার',phone:'01712345678',area:'Dhaka',
  openingAmount:'5000',openingDirection:'Dr',openingDate:'2026-10-01',openingNote:'From old ledger'},
 supplier:{name:'Karim Traders',nameBn:'করিম ট্রেডার্স',phone:'01712345678',area:'Dhaka',
  openingAmount:'7500',openingDirection:'Cr',openingDate:'2026-10-01',openingNote:'From old ledger'}
};

function csvSafe(value:unknown):string{
 let s=value===null||value===undefined?'':String(value);
 // Spreadsheet software may execute any of these prefixes as a formula.
 if(/^[\s]*[=+@\t\r\n]/.test(s)||/^[\s]*-(?!\d+(?:\.\d+)?$)/.test(s))s="'"+s;
 return /[",\r\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;
}
function linesToCsv(rows:readonly (readonly unknown[])[]):string{
 return '\uFEFF'+rows.map(row=>row.map(csvSafe).join(',')).join('\r\n')+'\r\n';
}
export function makeTemplateCsv(target:ImportTarget):string{
 const fields=fieldsFor(target);
 return linesToCsv([fields.map(f=>f.key),fields.map(f=>examples[target][f.key]??'')]);
}
export async function makeTemplateXlsx(target:ImportTarget):Promise<Blob>{
 const {default:writeExcelFile}=await import('write-excel-file/browser');
 const fields=fieldsFor(target);
 const data=[
  fields.map(f=>({value:f.key,type:String})),
  fields.map(f=>({value:examples[target][f.key]??'',type:String}))
 ];
 const output=await writeExcelFile(data).toBlob();
 return output;
}
export function makeImportErrorCsv(rows:readonly StagedImportRow[]):string{
 const names=[...new Set(rows.flatMap(row=>Object.keys(row.original)))];
 const contents:unknown[][]=[['Row','Sheet','Field','Reason',...names]];
 for(const row of rows){
  const errors=row.issues.filter(x=>x.severity==='error');
  if(!errors.length&&row.decision!=='reject')continue;
  contents.push([row.sourceRow,row.sourceSheet,errors.map(x=>x.field??'').join('; '),
   errors.map(x=>x.message).join('; '),...names.map(name=>row.original[name]??'')]);
 }
 return linesToCsv(contents);
}
export function downloadImportBlob(blob:Blob,fileName:string):void{
 const url=URL.createObjectURL(blob);
 const link=document.createElement('a');
 link.href=url;link.download=fileName;document.body.append(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1500);
}
