import {unzipSync} from 'fflate';

const MAX_ENTRIES=1000;
const MAX_UNCOMPRESSED=30_000_000;
const MAX_ENTRY=12_000_000;
const MAX_RATIO=200;
const decoder=new TextDecoder('utf-8',{fatal:true});

function fail(message:string):never { throw new Error('Unsafe XLSX workbook: '+message); }

/** Inspect ZIP central directory before inflation; reject zip bombs and formulas. */
export function validateXlsxSafety(bytes:Uint8Array):void {
 if(bytes.byteLength<22 || bytes.byteLength>5_000_000)fail('invalid ZIP size (5 MB maximum).');
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 let end=-1;
 for(let i=bytes.byteLength-22;i>=Math.max(0,bytes.byteLength-65557);i--){
  if(view.getUint32(i,true)===0x06054b50){end=i;break;}
 }
 if(end<0)fail('ZIP end-of-central-directory not found.');
 const count=view.getUint16(end+10,true);
 const length=view.getUint32(end+12,true);
 const offset=view.getUint32(end+16,true);
 if(!count||count>MAX_ENTRIES||offset+length>bytes.byteLength)fail('invalid ZIP central directory.');
 let cursor=offset,total=0,hasWorkbook=false,hasTypes=false,hasSheet=false;
 const names=new Set<string>();
 for(let n=0;n<count;n++){
  if(cursor+46>bytes.byteLength||view.getUint32(cursor,true)!==0x02014b50)fail('damaged ZIP entry.');
  const flags=view.getUint16(cursor+8,true);
  const compressed=view.getUint32(cursor+20,true);
  const inflated=view.getUint32(cursor+24,true);
  const nameLen=view.getUint16(cursor+28,true);
  const extraLen=view.getUint16(cursor+30,true);
  const commentLen=view.getUint16(cursor+32,true);
  if(cursor+46+nameLen+extraLen+commentLen>bytes.byteLength)fail('truncated ZIP entry.');
  const name=decoder.decode(bytes.subarray(cursor+46,cursor+46+nameLen));
  if((flags&1)||name.startsWith('/')||name.includes('..')||name.includes('\\'))fail('encrypted or unsafe path.');
  if(names.has(name))fail('duplicate archive entry.');
  names.add(name);
  if(inflated>MAX_ENTRY||(compressed===0&&inflated>0)||
     (compressed>0&&inflated/compressed>MAX_RATIO))fail('excessive decompression ratio.');
  total+=inflated;
  if(total>MAX_UNCOMPRESSED)fail('excessive decompressed workbook size.');
  if(name==='xl/workbook.xml')hasWorkbook=true;
  if(name==='[Content_Types].xml')hasTypes=true;
  if(/^xl\/worksheets\/[^/]+\.xml$/.test(name))hasSheet=true;
  if(/(?:^|\/)vbaProject\.bin$/i.test(name)||/^xl\/externalLinks\//i.test(name))fail('macros/external links not supported.');
  cursor+=46+nameLen+extraLen+commentLen;
 }
 if(cursor>offset+length||!hasWorkbook||!hasTypes||!hasSheet)fail('not an Excel XLSX workbook.');
 let inflated:Record<string,Uint8Array>;
 try {inflated=unzipSync(bytes);}catch {fail('could not decompress ZIP entries.');}
 for(const [name,entry] of Object.entries(inflated)){
  if(entry.length>MAX_ENTRY)fail('entry exceeded declared limit.');
  if(/^xl\/worksheets\/[^/]+\.xml$/.test(name)){
   const xml=decoder.decode(entry);
   if(/<(?:[A-Za-z0-9]+:)?f(?:\s|>)/i.test(xml))fail('formula cell detected; paste values and retry.');
  }
 }
}
