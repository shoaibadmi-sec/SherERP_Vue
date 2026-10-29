import type {Party, SaleLine, SalesInvoice, SalesReturn} from '../types/erp.ts';

const serialKey=(value:string)=>value.trim().toLocaleLowerCase();
const quantity=(value:string)=>/^(?:\d+(?:\.\d{1,6})?|\.\d{1,6})$/.test(value.trim())?Number(value):NaN;
const quant=(value:number)=>Math.round(value*1e6)/1e6;

/** Historical allocation only. No current product prices, stock or financial posting. */
export function planOrdinaryReturn(invoice:SalesInvoice,line:SaleLine,rawQuantity:string,serials:readonly string[],returns:readonly SalesReturn[]) {
  const issues:string[]=[];
  const original=invoice.lines.find(item=>item.id===line.id);
  if(!original||JSON.stringify(original)!==JSON.stringify(line)||line.bundleSnapshot)
    issues.push('Return line must match its ordinary source invoice.');
  // Plain quantities can prove original sold units. Compound sources require an explicit base balance.
  const plain=line.quantity.trim().match(/^([0-9]+(?:\.[0-9]+)?)(?:\s+(\S+))?$/);
  const sold=line.soldBaseQuantity??(plain&&(!plain[2]||plain[2]===line.unit)?Number(plain[1]):NaN);
  const history=returns.flatMap(item=>item.lineReturns??[]).filter(item=>item.invoiceId===invoice.id&&item.lineId===line.id);
  if(returns.some(item=>item.invoices.includes(invoice.invoice)&&!item.lineReturns&&!item.bundleReturns))
    issues.push('Historical return quantity and refund allocation is missing.');
  const returned=history.reduce((sum,item)=>sum+item.quantity,0);
  const refunded=history.reduce((sum,item)=>sum+Math.round(item.amount*100),0);
  const sourceCap=line.returnableQuantity??sold;
  if(!Number.isFinite(sold)||sold<=0||!Number.isFinite(sourceCap)||sourceCap<0||sourceCap>sold||
    history.some(item=>!Number.isFinite(item.quantity)||item.quantity<=0||!Number.isFinite(item.amount)||item.amount<0)||returned>sourceCap+1e-6)
    issues.push('Historical return quantity allocation is missing or inconsistent.');
  // Source cap is the opening returnable balance. Session events consume it, never reset it.
  const remaining=Number.isFinite(sold)&&Number.isFinite(sourceCap)?quant(Math.max(0,sourceCap-returned)):0;
  const qty=rawQuantity.trim()===''?0:quantity(rawQuantity);
  if(!Number.isFinite(qty)||qty<0||qty>remaining)
    issues.push('Enter a positive return quantity within the remaining source quantity.');
  const net=line.netSaleTotal??(invoice.discount===0&&invoice.rounding===0?line.total:null);
  const netPaisa=net===null?NaN:Math.round(net*100);
  const openingReturned=sold-sourceCap;
  const availablePaisa=netPaisa-Math.round(netPaisa*openingReturned/sold);
  if(net===null||!Number.isFinite(net)||net<0||!Number.isSafeInteger(netPaisa)||Math.abs(netPaisa/100-net)>1e-7||refunded>availablePaisa)
    issues.push('Historical net refund allocation is missing or inconsistent.');
  if(qty>0&&line.serials?.length){
    const soldSerials=new Set(line.serials.map(serialKey));
    const priorSerials=history.flatMap(item=>item.serials).map(serialKey);
    const selected=serials.map(serialKey);
    if(history.some(item=>item.serials.length!==item.quantity))issues.push('Historical returned serial allocation is missing.');
    if(!Number.isInteger(qty)||selected.length!==qty||new Set(selected).size!==selected.length||
      selected.some(value=>!value||!soldSerials.has(value)||priorSerials.includes(value)))
      issues.push('Select each original returned serial once; already returned serials cannot be reused.');
  }
  const amount=issues.length||!qty?0:
    Math.min(availablePaisa-refunded,Math.round(netPaisa*(openingReturned+returned+qty)/sold)-Math.round(netPaisa*(openingReturned+returned)/sold))/100;
  return {invoiceId:invoice.id,lineId:line.id,quantity:qty,remaining,amount,issues,
    unitPrice:Number.isFinite(netPaisa)&&sold>0?netPaisa/100/sold:null,serials:[...serials]};
}

/** Prefer immutable source IDs; only resolve a legacy name when it is unambiguous. */
export function salesReturnCustomerId(item:SalesReturn,invoices:readonly SalesInvoice[],parties:readonly Party[]):string|undefined {
  if(item.customerId)return item.customerId;
  const ids=new Set(invoices.filter(invoice=>item.invoices.includes(invoice.invoice)).map(invoice=>invoice.partyId).filter((id):id is string=>Boolean(id)));
  if(ids.size===1)return [...ids][0];
  if(ids.size>1)return undefined;
  const matches=parties.filter(party=>party.name===item.customer&&party.roles.includes('Customer'));
  return matches.length===1?matches[0].id:undefined;
}
