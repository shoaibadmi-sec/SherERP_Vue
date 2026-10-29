import type { LedgerEntry, Party, PartyRole } from '../types/erp';
import type { PartyPreviewState, PartySourceRecord, PartyLedgerSource } from '../types/partyLedger';
import { expenseDateIso } from '../utils/dateRange.ts';
import { salesInvoices } from './sales.ts';
import { purchases } from './purchases.ts';
import { financeTransactions } from './financeAccounts.ts';

/** Deliberately explicit: never join two financial people on the basis of matching names. */
export const financePersonIdByPartyId: Readonly<Record<string,string>> = { o1: 'fp1' };

export function normalizePartyFixture(parties: Party[], legacy: LedgerEntry[]): PartyPreviewState {
  const sources: PartySourceRecord[] = [];
  let sequence = 0;
  const push = (row: Omit<PartySourceRecord,'sequence'>) => {
    if (!row.date) return;
    sources.push({...row, sequence:++sequence});
  };
  const validIds = new Set(parties.map(p => p.id));
  const economicRefs = new Set<string>();
  const dedupKey = (partyId:string, role:PartyRole, kind:string, ref?:string) => JSON.stringify([partyId,role,kind,ref]);
  for (const invoice of salesInvoices) {
    if (!invoice.partyId || !validIds.has(invoice.partyId)) continue;
    const ref = invoice.invoice;
    economicRefs.add(dedupKey(invoice.partyId,'Customer','sale',ref));
    push({id:'sale:'+invoice.id,partyId:invoice.partyId,relationship:'Customer',kind:'sale',
      date:expenseDateIso(invoice.date),reference:ref,description:invoice.lines.map(x=>x.name).join(', '),
      debit:invoice.total, credit:0, status:'Active'});
    if(invoice.paid>0) push({id:'sale-paid:'+invoice.id,partyId:invoice.partyId,
      relationship:'Customer',kind:'customer-payment',date:expenseDateIso(invoice.date),
      reference:'PAY-'+ref,invoiceId:ref,description:'Paid with '+ref,
      debit:0,credit:invoice.paid,amountPaid:invoice.paid,
      provenance:invoice.payments?.length?'verified':'legacy-unverified',status:'Active'});
  }
  for (const purchase of purchases) {
    if (!validIds.has(purchase.supplierId)) continue;
    economicRefs.add(dedupKey(purchase.supplierId,'Supplier','purchase',purchase.ref));
    push({id:'purchase:'+purchase.id,partyId:purchase.supplierId,relationship:'Supplier',kind:'purchase',
      date:expenseDateIso(purchase.date),reference:purchase.ref,description:purchase.items,
      debit:0,credit:purchase.total,status:'Active'});
    if(purchase.paid>0)push({id:'purchase-paid:'+purchase.id,partyId:purchase.supplierId,
      relationship:'Supplier',kind:'supplier-payment',date:expenseDateIso(purchase.date),
      reference:'PAY-'+purchase.ref,invoiceId:purchase.ref,description:'Paid with '+purchase.ref,
      debit:purchase.paid,credit:0,amountPaid:purchase.paid,
      provenance:purchase.payments?.length?'verified':'legacy-unverified',status:'Active'});
  }
  for (const party of parties) {
    const fp = financePersonIdByPartyId[party.id];
    if (!fp) continue;
    for (const txn of financeTransactions.filter(t=>t.partyId===fp)) {
      if (txn.status !== 'Active') continue;
      const role: PartyRole = txn.type.startsWith('Owner') || txn.type === 'Opening Owner Capital' ? 'Owner'
        : txn.type.startsWith('Lender') || txn.type === 'Opening Loan' ? 'Lender' : 'Borrower';
      const increase = txn.type.endsWith('Credit') || txn.type.startsWith('Opening') || txn.type === 'Borrower Debit';
      const debit = role === 'Borrower' ? (increase ? txn.amount : 0) : (increase ? 0 : txn.amount);
      const credit = role === 'Borrower' ? (increase ? 0 : txn.amount) : (increase ? txn.amount : 0);
      push({id:'finance:'+txn.id,partyId:party.id,relationship:role,kind:'finance',
        date:expenseDateIso(txn.date),reference:txn.reference??txn.id,description:txn.type,financeType:txn.type,
        debit,credit,status:'Active'});
    }
  }
  for (const entry of legacy) {
    const party = parties.find(p=>p.id===entry.partyId);
    if (!party) continue;
    const role:PartyRole = entry.type === 'purchase' ? 'Supplier'
      : entry.type === 'payment' && party.roles.includes('Supplier') && !party.roles.includes('Customer') ? 'Supplier'
      : entry.type === 'opening' && party.roles.includes('Supplier') && entry.credit > 0 ? 'Supplier'
      : party.roles.includes('Customer') ? 'Customer' : party.roles[0];
    const kind:PartyLedgerSource = entry.type === 'invoice' ? 'sale'
      : entry.type === 'purchase' ? 'purchase'
      : entry.type === 'payment' ? (role === 'Supplier' ? 'supplier-payment' : 'customer-payment')
      : entry.type === 'return' ? (role === 'Supplier' ? 'purchase-return' : 'sale-return')
      : entry.type;
    if (economicRefs.has(dedupKey(party.id,role,kind,entry.ref))) continue;
    push({id:'legacy:'+entry.id,partyId:party.id,relationship:role,kind,date:expenseDateIso(entry.date),
      reference:entry.ref,description:entry.description,debit:entry.debit,credit:entry.credit,status:'Active'});
  }
  return {parties:parties.map(p=>({...p,roles:[...p.roles]})),sources,audit:[],revision:0};
}
