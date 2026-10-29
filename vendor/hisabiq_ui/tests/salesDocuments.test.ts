import test from 'node:test';
import assert from 'node:assert/strict';
import { invoiceReceipt, invoiceQuantity, returnDocument } from '../src/utils/salesDocuments.ts';
import { salesInvoices, salesReturns } from '../src/data/sales.ts';

test('receipt preserves source line order, compound quantities and customer/totals without recalculating', () => {
  const original = salesInvoices[0];
  const before = JSON.stringify(original);
  const receipt = invoiceReceipt(original);
  assert.deepEqual(receipt.lines.map(line => line.name), original.lines.map(line => line.name));
  assert.equal(receipt.lines[1].qty, '3 Box 6 Pcs');
  assert.equal(invoiceQuantity({...original.lines[0], quantity:'220'}), '220 Kg');
  assert.equal(receipt.customerPhone, original.phone);
  assert.equal(receipt.guardianName, original.guardianName);
  assert.equal(receipt.customerAddress, original.address);
  assert.equal(receipt.due, original.due);
  assert.equal(receipt.total, original.total);
  assert.equal(JSON.stringify(original), before);
});
test('receipt retains serial/warranty data, exact discounts/rounding and multiple payment label', () => {
  const original = salesInvoices[0];
  const invoice = {...original, party:'Walk-in customer', discount:2.5, rounding:-0.5, total:original.total-3, payments:[{id:'a',method:'Cash' as const,account:'Cash counter',amount:10},{id:'b',method:'Bank' as const,account:'Dutch-Bangla Bank · 4582',amount:20}], lines:[{...original.lines[0],serials:['SERIAL-1'],warranty:{duration:1,durationUnit:'Years' as const,type:'Seller' as const,terms:'Original source terms'}}]};
  const receipt = invoiceReceipt(invoice);
  assert.equal(receipt.customer, undefined);
  assert.equal(receipt.method,'Multiple');
  assert.deepEqual(receipt.payments,invoice.payments);
  assert.notStrictEqual(receipt.payments?.[0],invoice.payments[0],'receipt owns a snapshot of each payment source');
  assert.equal(receipt.discount,2.5); assert.equal(receipt.rounding,-0.5);
  assert.deepEqual(receipt.lines[0].serials,['SERIAL-1']);
  assert.equal(receipt.lines[0].warranty?.terms,'Original source terms');
});
test('return document uses the original references, settlement and amount; no synthetic refund', () => {
  const source = salesReturns[0]; const report = returnDocument(source);
  assert.equal(report.title, source.id);
  assert.deepEqual(report.rows.find(row=>row[0]==='Original invoices'),['Original invoices',source.invoices.join(', ')]);
  assert.deepEqual(report.rows.find(row=>row[0]==='Return amount'),['Return amount',source.amount]);
  assert.deepEqual(report.rows.find(row=>row[0]==='Settlement'),['Settlement',source.settlement]);
});
