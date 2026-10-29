import type {ImportCell,ImportTable} from './importTypes.ts';
import {validateXlsxSafety} from './safeXlsx.ts';

const MAX_CSV_BYTES=1_000_000;
const MAX_XLSX_BYTES=5_000_000;
const MAX_ROWS=5000;
const encoder=new TextEncoder();
const decoder=new TextDecoder('utf-8',{fatal:true});

function notEmpty(row:ImportCell[]):boolean {return row.some(value=>value!==null&&String(value).trim()!=='');}
function toCell(cell:unknown):ImportCell {
 if(cell===null||cell===undefined)return null;
 if(cell instanceof Date)return cell;
 if(typeof cell==='boolean'||typeof cell==='number'||typeof cell==='string')return cell;
 return String(cell);
}

export function parseImportCsv(input:string,fileName:string):ImportTable {
 if(encoder.encode(input).length>MAX_CSV_BYTES)throw new Error('CSV exceeds the 1 MB preview limit.');
 const text=input.replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n');
 const records:Array<{sourceRow:number;cells:ImportCell[]}>=[];
 let start=1,line=1,field='',fields:string[]=[],quoted=false,closed=false;
 const fieldEnd=()=>{fields.push(field);field='';closed=false;};
 const rowEnd=()=>{fieldEnd();if(fields.some(v=>v.trim()))records.push({sourceRow:start,cells:[...fields]});fields=[];start=line+1;};
 for(let i=0;i<text.length;i++){
  const ch=text[i];
  if(quoted){
   if(ch==='"'){
    if(text[i+1]==='"'){field+='"';i++;}
    else {quoted=false;closed=true;}
   }else{field+=ch;if(ch==='\n')line++;}
  }else if(ch==='"'){
   if(field||closed)throw new Error('Invalid quoted CSV field at line '+line+'.');
   quoted=true;
  }else if(ch===',')fieldEnd();
  else if(ch==='\n'){rowEnd();line++;}
  else{
   if(closed&&!/\s/.test(ch))throw new Error('Unexpected text after a quoted CSV field.');
   field+=ch;
  }
 }
 if(quoted)throw new Error('Unterminated quoted CSV field.');
 if(field||fields.length)rowEnd();
 if(!records.length)throw new Error('The CSV has no nonempty rows.');
 const [header,...values]=records;
 if(values.length>MAX_ROWS)throw new Error('Import accepts at most 5,000 data rows.');
 return {fileName,sheet:'CSV',sheetNames:['CSV'],headers:header.cells.map(v=>String(v??'').trim()),
   rows:values.map(r=>({sourceRow:r.sourceRow,cells:r.cells}))};
}

export async function parseImportFile(file:File):Promise<ImportTable[]>{
 const lower=file.name.toLocaleLowerCase();
 if(!lower.endsWith('.xlsx')&&!lower.endsWith('.csv'))throw new Error('Only .xlsx and .csv are supported; .xls and .xlsm are not supported.');
 if(lower.endsWith('.csv')){
  if(file.size>MAX_CSV_BYTES)throw new Error('CSV exceeds the 1 MB preview limit.');
  const contents=decoder.decode(await file.arrayBuffer());
  return [parseImportCsv(contents,file.name)];
 }
 if(file.size>MAX_XLSX_BYTES)throw new Error('XLSX exceeds the 5 MB preview limit.');
 const bytes=new Uint8Array(await file.arrayBuffer());
 validateXlsxSafety(bytes);
 const {default:readExcelFile}=await import('read-excel-file/browser');
 const sheets=await readExcelFile(file);
 if(!Array.isArray(sheets)||!sheets.length)throw new Error('The Excel workbook contains no sheets.');
 const sheetNames=sheets.map(x=>x.sheet);
 return sheets.map(sheet=>{
  const data=sheet.data as unknown[][];
  const first=data.findIndex(row=>row.some(cell=>cell!==null&&cell!==undefined&&String(cell).trim()!==''));
  if(first<0)return {fileName:file.name,sheet:sheet.sheet,sheetNames,headers:[],rows:[]};
  const headers=data[first].map(cell=>String(cell??'').trim());
  const rows=data.slice(first+1).flatMap((cells,index)=>{
   const normalized=cells.map(toCell);
   return notEmpty(normalized)?[{sourceRow:first+index+2,cells:normalized}]:[];
  });
  if(rows.length>MAX_ROWS)throw new Error('Import accepts at most 5,000 data rows per worksheet.');
  return {fileName:file.name,sheet:sheet.sheet,sheetNames,headers,rows};
 });
}
