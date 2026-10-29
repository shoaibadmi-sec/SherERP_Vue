import { partyRoles } from '../data/parties.ts';
import type { PartyRole } from '../types/erp';
import type { PartyDraft } from '../types/partyLedger';
import { validatePartyDraft } from './partyIdentity.ts';

export type PartyCsvResult = { valid:PartyDraft[]; rejected:Array<{row:number;reason:string}> };

function csvRows(input:string):string[][] {
  if(input.length>1_000_000)throw new Error('CSV exceeds the 1 MB preview limit.');
  const rows:string[][]=[];
  let fields:string[]=[], field='', quoted=false, closedQuote=false;
  const addField=()=>{fields.push(field);field='';closedQuote=false;};
  const addRow=()=>{addField();if(fields.some(v=>v.trim()))rows.push(fields);fields=[];};
  for(let i=0;i<input.length;i++){
    const ch=input[i];
    if(quoted){
      if(ch==='"'){
        if(input[i+1]==='"'){field+='"';i++;}
        else {quoted=false;closedQuote=true;}
      }else field+=ch;
    }else if(ch==='"'){
      if(field||closedQuote)throw new Error('Invalid quoted field in CSV.');
      quoted=true;
    }else if(ch===','){addField();}
    else if(ch==='\n'){addRow();}
    else if(ch==='\r'){if(input[i+1]!=='\n')addRow();}
    else {
      if(closedQuote&&!/\s/.test(ch))throw new Error('Unexpected content after quoted field.');
      field+=ch;
    }
  }
  if(quoted)throw new Error('Unterminated quoted field in CSV.');
  if(field||fields.length)addRow();
  return rows;
}
const risky=(text:string)=>/^[\s]*[=+@]/.test(text)||/^[\s]*-[=+@a-z]/i.test(text);

export function parsePartyCsv(content:string):PartyCsvResult {
  const rows=csvRows(content.replace(/^\uFEFF/,''));
  if(!rows.length)throw new Error('Choose a CSV containing party details.');
  const headers=rows[0].map(h=>h.trim().toLocaleLowerCase().replace(/[\s_-]/g,''));
  const index=(...names:string[])=>headers.findIndex(h=>names.includes(h));
  const nameCol=index('name','partyname','customername','suppliername');
  if(nameCol<0)throw new Error('A name column is required.');
  const bnCol=index('namebn','banglaname','bnname');
  const phoneCol=index('phone','mobile','phonenumber');
  const areaCol=index('area','address','location');
  const rolesCol=index('roles','role','type');
  const idCol=index('id','partyid');
  const valid:PartyDraft[]=[];
  const rejected:PartyCsvResult['rejected']=[];
  const seenPhones=new Set<string>();
  for(let ri=1;ri<rows.length;ri++){
    const row=rows[ri];
    const at=(col:number)=>col<0?'':(row[col]??'').trim();
    const rolesRaw=at(rolesCol)||'Customer';
    const roles=rolesRaw.split(/[|;]/).map(raw=>partyRoles.find(role=>role.toLowerCase()===raw.trim().toLowerCase())).filter((r):r is PartyRole=>Boolean(r));
    const draft:PartyDraft={
      id:at(idCol)||undefined,name:at(nameCol),nameBn:at(bnCol)||undefined,
      phone:at(phoneCol),area:at(areaCol),roles
    };
    const errors=validatePartyDraft(draft,[]);
    if(roles.length!==rolesRaw.split(/[|;]/).length)errors.push('Unknown party role.');
    if([draft.name,draft.nameBn??'',draft.area].some(risky))errors.push('Spreadsheet formula-like text is not allowed.');
    if(draft.phone&&seenPhones.has(draft.phone.replace(/\D/g,'')))errors.push('Duplicate phone in import; review manually.');
    if(errors.length)rejected.push({row:ri+1,reason:errors.join(' ')});
    else {valid.push(draft);if(draft.phone)seenPhones.add(draft.phone.replace(/\D/g,''));}
    if(ri>=5000)throw new Error('Import accepts at most 5,000 data rows.');
  }
  return {valid,rejected};
}
