import {readPreviewSettings,reconstructInvoiceCopy} from '../documents/previewSettings.ts';
import type { SalesInvoice, SalesReturn } from '../types/erp';
import type { ReceiptPreviewProps } from '../components/brand/ReceiptPreview';
import type { Report } from './reportOutput';
import type {UiLanguage} from '../i18n/uiCopy';
import {documentLabel,documentMethod} from '../i18n/documentCopy.ts';

export const invoiceQuantity = (line: SalesInvoice['lines'][number]) =>
  line.quantity.toLowerCase().includes(line.unit.toLowerCase()) ? line.quantity : `${line.quantity} ${line.unit}`;

export function invoiceReceipt(invoice: SalesInvoice, language?: UiLanguage): ReceiptPreviewProps {
  if(invoice.documentSnapshot)return structuredClone(invoice.documentSnapshot);
  const result:ReceiptPreviewProps={
    language,
    invoice: invoice.invoice, customer: invoice.party === 'Walk-in customer' ? undefined : invoice.party,
    customerPhone: invoice.phone, guardianName: invoice.guardianName, customerAddress: invoice.address,
    lines: invoice.lines.map(line => ({name:line.name,qty:invoiceQuantity(line),price:line.price,total:line.total,serials:line.serials,warranty:line.warranty,bundleSnapshot:line.bundleSnapshot})),
    subtotal: invoice.subtotal, discount: invoice.discount, rounding: invoice.rounding,
    total: invoice.total, paid: invoice.paid, due: invoice.due,
    payments:invoice.payments.map(payment=>({...payment})),
    method: invoice.payments.length > 1 ? 'Multiple' : invoice.method, dateTime: `${invoice.date}, ${invoice.time}`
  };
  const settings=readPreviewSettings();return settings?reconstructInvoiceCopy(result,settings):result;
}

export function returnDocument(item: SalesReturn, language:UiLanguage='English + Bangla'): Report {
  const label=(english:string)=>documentLabel(language,english);
  return {title:item.id,language,subtitle:label('Sales return source preview'),headers:[label('Field'),label('Value')],rows:[
    [label('Date'),item.date],[label('Customer'),item.customer],[label('Original invoices'),item.invoices.join(', ')],
    [label('Items'),item.items],[label('Return amount'),item.amount],[label('Settlement'),documentLabel(language,item.settlement)],
    [label('Refund method'),item.refundMethod ? documentMethod(language,item.refundMethod) : '—'],[label('Refund account'),item.refundAccount ?? '—']
  ]};
}
