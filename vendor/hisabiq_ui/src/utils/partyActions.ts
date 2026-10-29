import type { PartyAction, PartyLedgerRow, PartyLedgerSource } from '../types/partyLedger';

type Capability={group:string;actions:PartyAction[]};
const capabilities:Record<PartyLedgerSource,Capability>={
  sale:{group:'sales',actions:['view','edit','delete','print','return','source']},
  'sale-return':{group:'sales',actions:['view','print']},
  'customer-payment':{group:'sales',actions:['view','edit','delete','print']},
  'customer-credit-refund':{group:'sales',actions:['view','edit','delete','print']},
  'customer-credit-apply':{group:'sales',actions:['view','print']},
  purchase:{group:'purchases',actions:['view','edit','delete','print','return','source']},
  'purchase-return':{group:'purchases',actions:['view','print']},
  'supplier-payment':{group:'purchases',actions:['view','edit','delete','print']},
  'supplier-credit-refund':{group:'purchases',actions:['view','edit','delete','print']},
  finance:{group:'finance',actions:['view','edit','reverse','print']},
  expense:{group:'expenses',actions:['view','edit','delete','print']},
  opening:{group:'accounts',actions:['view','edit']},
  note:{group:'parties',actions:['view','edit','delete']}
};

export function partySourceRoute(row:PartyLedgerRow):string|null {
  if(row.status!=='Active'||!row.sourceId)return null;
  if(row.source==='sale'&&/^INV-[A-Za-z0-9-]+$/.test(row.reference??''))
    return '/app/pos?mode=edit&invoice='+encodeURIComponent(row.reference!);
  return null;
}

export function ledgerActionAvailability(
  row:PartyLedgerRow,granted:ReadonlySet<string>,supported:ReadonlySet<PartyAction>
):Array<{action:PartyAction;enabled:boolean;reason?:string}> {
  const config=capabilities[row.source];
  return config.actions.map(action=>{
    const permission=config.group+'.'+(action==='view'||action==='print'||action==='source'?'view':
      action==='delete'||action==='reverse'?'delete':'edit');
    let reason='';
    if(!supported.has(action))reason='This source action is not connected in the preview.';
    else if(row.status!=='Active'&&action!=='view')reason='Transaction is reversed or deleted.';
    else if(!row.sourceId&&action!=='view')reason='Missing original source record.';
    else if(!granted.has(permission))reason='Permission required: '+permission;
    else if(action==='source'&&!partySourceRoute(row))reason='No verified direct source link.';
    return {action,enabled:!reason,...(reason?{reason}:{})};
  });
}
