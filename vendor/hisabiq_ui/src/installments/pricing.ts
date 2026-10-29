/** Negotiated installment price math. Amounts here are whole, safe integer paisa. */
export type InstallmentPriceEdit = {mode:'direct'|'amount'|'percent'; value:string};
export type PricedLine = {key:string;amountPaisa:number};

function validPaisa(amount:number, field='Price'):number {
  if(!Number.isSafeInteger(amount)||amount<0)throw new Error(field+' must be a nonnegative whole paisa amount.');
  return amount;
}

function parseCurrency(value:string, signed=false):bigint {
  const s=value.trim();
  const numeric=signed?s.replace(/^[+-]/,''):s;
  if(!/^(?:\d+|\d{1,3}(?:,\d{2})*,\d{3}|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/.test(numeric)) {
    throw new Error('Enter a valid taka amount with at most two decimal places.');
  }
  const [whole, decimals='']=numeric.replace(/,/g,'').split('.');
  const amount=BigInt(whole)*100n+BigInt((decimals+'00').slice(0,2));
  return signed&&s.startsWith('-')?-amount:amount;
}

function safeNumber(value:bigint, field:string):number {
  if(value>BigInt(Number.MAX_SAFE_INTEGER)||value<BigInt(-Number.MAX_SAFE_INTEGER)){
    throw new Error(field+' is outside the supported amount range.');
  }
  return Number(value);
}

export function takaInputToPaisa(value:string):number {
  return validPaisa(safeNumber(parseCurrency(value),'Taka amount'),'Taka amount');
}

export function getInstallmentStartPrice(regularPaisa:number, matchingPresetPaisa?:number):number {
  validPaisa(regularPaisa,'Regular price');
  if(matchingPresetPaisa===undefined)return regularPaisa;
  return validPaisa(matchingPresetPaisa,'Installment preset price');
}

function signedPercentBasisPoints(value:string):bigint {
  const s=value.trim();
  if(!/^[+-]?\d+(?:\.\d{1,2})?$/.test(s))throw new Error('Enter a valid percentage with at most two decimal places.');
  const sign=s.startsWith('-')?-1n:1n;
  const digits=s.replace(/^[+-]/,'');
  const [whole, decimal='']=digits.split('.');
  return sign*(BigInt(whole)*100n+BigInt((decimal+'00').slice(0,2)));
}

/** Half-up/away-from-zero rounding of a signed exact integer ratio. */
function roundRatio(numerator:bigint, denominator:bigint):bigint {
  const negative=numerator<0n;
  const positive=negative?-numerator:numerator;
  const rounded=(positive+denominator/2n)/denominator;
  return negative?-rounded:rounded;
}

/** Direct, fixed amount and percentage are exclusive ways to set ONE price. */
export function negotiateInstallmentTotal(basePaisa:number, edit:InstallmentPriceEdit):number {
  validPaisa(basePaisa,'Starting price');
  let next:bigint;
  if(edit.mode==='direct')next=parseCurrency(edit.value);
  else if(edit.mode==='amount')next=BigInt(basePaisa)+parseCurrency(edit.value,true);
  else if(edit.mode==='percent')next=BigInt(basePaisa)+roundRatio(BigInt(basePaisa)*signedPercentBasisPoints(edit.value),10000n);
  else throw new Error('Invalid price negotiation mode.');
  return validPaisa(safeNumber(next,'Negotiated price'),'Negotiated price');
}

/** Deterministic largest remainder allocation, preserving zero-valued lines and exact totals. */
export function allocateNegotiatedInvoiceLines(lines:readonly PricedLine[],targetPaisa:number):PricedLine[] {
  validPaisa(targetPaisa,'Target amount');
  const seen=new Set<string>();
  let sum=0n;
  for(const line of lines){
    if(!line.key.trim()||seen.has(line.key))throw new Error('Duplicate or empty priced line key.');
    seen.add(line.key);
    validPaisa(line.amountPaisa,'Line amount');
    sum+=BigInt(line.amountPaisa);
  }
  if(sum===0n){
    if(targetPaisa>0)throw new Error('Cannot allocate a positive total without eligible product lines.');
    return lines.map(({key})=>({key,amountPaisa:0}));
  }
  const target=BigInt(targetPaisa);
  const shares=lines.map((line,index)=>{
    const numerator=BigInt(line.amountPaisa)*target;
    return {key:line.key,index,amountPaisa:Number(numerator/sum),remainder:numerator%sum};
  });
  const assigned=shares.reduce((n,row)=>n+row.amountPaisa,0);
  let undistributed=targetPaisa-assigned;
  const priority=shares.filter(row=>row.remainder>0n).sort((a,b)=>
    a.remainder===b.remainder?a.index-b.index:a.remainder>b.remainder?-1:1);
  for(const row of priority){if(undistributed<=0)break;row.amountPaisa++;undistributed--;}
  if(undistributed!==0)throw new Error('Cannot reconcile allocated invoice amount.');
  return shares.sort((a,b)=>a.index-b.index).map(({key,amountPaisa})=>({key,amountPaisa}));
}
