import test from 'node:test';
import assert from 'node:assert/strict';
import { ledgerActionAvailability, partySourceRoute } from '../src/utils/partyActions.ts';
import type { PartyLedgerRow, PartyAction } from '../src/types/partyLedger.ts';

const sale:PartyLedgerRow={id:'sale-1',partyId:'c1',relationship:'Customer',source:'sale',
  sourceId:'sale-1',reference:'INV-000241',date:'2026-10-01',description:'Hardware',
  debit:120,credit:0,status:'Active',sequence:1};
const supported=new Set<PartyAction>(['view','edit','delete','reverse','print','return','source']);
const avail=(r:PartyLedgerRow,granted:string[])=>ledgerActionAvailability(r,new Set(granted),supported);

test('sale edit is source-owned and permission gated, with verified POS route',()=>{
  assert.equal(partySourceRoute(sale),'/app/pos?mode=edit&invoice=INV-000241');
  const rows=avail(sale,['sales.view','sales.edit']);
  assert.equal(rows.find(x=>x.action==='view')?.enabled,true);
  assert.equal(rows.find(x=>x.action==='edit')?.enabled,true);
  assert.equal(rows.find(x=>x.action==='delete')?.enabled,false);
  assert.equal(rows.find(x=>x.action==='source')?.enabled,true);
});
test('purchase without verified deep-link never offers a fake source navigation',()=>{
  const purchase:PartyLedgerRow={...sale,id:'purchase-1',source:'purchase',reference:'PUR-000118',relationship:'Supplier'};
  assert.equal(partySourceRoute(purchase),null);
  assert.equal(avail(purchase,['purchases.view']).find(x=>x.action==='source')?.enabled,false);
});
test('reversed, missing source id, opening and note are mutation constrained',()=>{
  assert.equal(avail({...sale,status:'Reversed'},['sales.view','sales.edit','sales.delete']).find(x=>x.action==='edit')?.enabled,false);
  assert.equal(avail({...sale,sourceId:undefined},['sales.view','sales.edit']).find(x=>x.action==='edit')?.enabled,false);
  const opening={...sale,source:'opening' as const};
  assert.equal(avail(opening,['accounts.view','accounts.edit','accounts.delete']).find(x=>x.action==='delete'),undefined);
  const note={...sale,source:'note' as const};
  assert.equal(avail(note,['parties.view','parties.edit']).find(x=>x.action==='print'),undefined);
});
test('customer refund permission follows customer payments, finance has its own permissions',()=>{
  const refund={...sale,source:'customer-credit-refund' as const,reference:'CR-1'};
  assert.equal(avail(refund,['sales.edit']).find(x=>x.action==='edit')?.enabled,true);
  assert.equal(avail(refund,['finance.edit']).find(x=>x.action==='edit')?.enabled,false);
  const finance={...sale,relationship:'Lender' as const,source:'finance' as const};
  assert.equal(avail(finance,['finance.view','finance.edit']).find(x=>x.action==='edit')?.enabled,true);
});

test('supplier refund actions are purchase-owned and credit application is read-only',()=>{
  const refund={...sale,source:'supplier-credit-refund' as const,relationship:'Supplier' as const};
  assert.equal(avail(refund,['purchases.view','purchases.edit']).find(x=>x.action==='edit')?.enabled,true);
  assert.equal(avail(refund,['sales.edit']).find(x=>x.action==='edit')?.enabled,false);
  assert.equal(avail(refund,['purchases.view']).find(x=>x.action==='print')?.enabled,true);
  const used={...sale,source:'customer-credit-apply' as const};
  assert.deepEqual(avail(used,['sales.view','sales.edit','sales.delete']).map(x=>x.action),['view','print']);
  assert.ok(avail(used,['sales.view']).every(x=>x.enabled));
});
