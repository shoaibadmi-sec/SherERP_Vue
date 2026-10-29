import type {ColumnMapping,ImportTarget,ImportTable,StagedImportRow,ImportCell} from './importTypes.ts';
import {fieldsFor} from './fieldSchemas.ts';
const normalize=(value:string)=>value.normalize('NFKC').trim().toLocaleLowerCase().replace(/[\s_./()-]/g,'');
const rawText=(cell:ImportCell):string=>cell instanceof Date?cell.toISOString().slice(0,10):cell===null?'':String(cell);
export function suggestColumnMapping(target:ImportTarget,headers:readonly string[]):{mapping:ColumnMapping;ambiguities:string[]}{
 const mapping:ColumnMapping={};const ambiguities:string[]=[];
 const used=new Map<number,string>();
 for(const f of fieldsFor(target)){
   const aliases=new Set(f.aliases.map(normalize));
   const matches=headers.flatMap((h,i)=>aliases.has(normalize(h))?[i]:[]);
   const candidate=matches.length===1?matches[0]:null;
   if(matches.length>1)ambiguities.push(f.key+': multiple candidate columns');
   if(candidate!==null&&used.has(candidate)){
    ambiguities.push(f.key+': same source column also matches '+used.get(candidate));
    mapping[f.key]=null;
    mapping[used.get(candidate)!]=null;
   }else{
    mapping[f.key]=candidate;
    if(candidate!==null)used.set(candidate,f.key);
   }
 }
 return{mapping,ambiguities};
}
export function mapImportRows(table:ImportTable,mapping:ColumnMapping):StagedImportRow[]{
 const indices=Object.values(mapping).filter((x):x is number=>typeof x==='number');
 if(new Set(indices).size!==indices.length)throw new Error('The same source column cannot be mapped more than once.');
 if(indices.some(index=>index<0||!Number.isInteger(index)||index>=table.headers.length))throw new Error('Invalid source column.');
 const target:ImportTarget=Object.prototype.hasOwnProperty.call(mapping,'sellingPrice')?'product':Object.prototype.hasOwnProperty.call(mapping,'openingDirection')?'customer':'customer';
 // Customer and Supplier share the same column schema.
 for(const field of fieldsFor(target)){
  if(field.required&&mapping[field.key]===null)throw new Error('Required column is missing: '+field.label);
 }
 return table.rows.map(row=>{
  const original:Record<string,string>={};
  table.headers.forEach((header,i)=>{original[header]=rawText(row.cells[i]??null)});
  const mapped:Record<string,unknown>={};
  for(const [key,index] of Object.entries(mapping))if(index!==null)mapped[key]=row.cells[index]??'';
  return validateMappedRow({sourceSheet:table.sheet,sourceRow:row.sourceRow,original,mapped,issues:[],decision:'create' as const},target);
 });
}

/** Preview-level checks only; Product/Party domain adapters perform full validation later. */
export function validateMappedRow(row:StagedImportRow,target:ImportTarget):StagedImportRow{
 const issues=[] as StagedImportRow['issues'];
 for(const field of fieldsFor(target)){
  const value=row.mapped[field.key];
  if(field.required&&(value===null||value===undefined||String(value).trim()==='')){
   issues.push({sourceRow:row.sourceRow,field:field.key,severity:'error' as const,message:field.label+' is required.'});
  }
 }
 for(const key of ['name','nameBn','sku','category','brand']){
  const value=row.mapped[key];
  if(typeof value==='string'&&/^\s*[=+@]/.test(value)){
   issues.push({sourceRow:row.sourceRow,field:key,severity:'error' as const,message:'Spreadsheet formula-like text is not allowed.'});
  }
 }
 return {...row,issues};
}
