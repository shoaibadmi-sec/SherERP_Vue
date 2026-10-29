import type {PreviewInstallmentAgreement} from '../data/installmentPreviewStore.ts';
import type {InstallmentPaymentPreviewEvent} from './collections.ts';
import {projectInstallmentLifecycle,type InstallmentLifecycleEvent} from './lifecycle.ts';

const escapeHtml=(value:unknown)=>String(value??'').replace(/[&<>"']/g,c=>({
 '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[c]!));
const money=(paisa:number)=>'৳'+(paisa/100).toLocaleString('en-BD',{
 minimumFractionDigits:2,maximumFractionDigits:2
});
const row=(cells:readonly string[])=>'<tr>'+cells.map(cell=>'<td>'+cell+'</td>').join('')+'</tr>';
/** Pure, HTML-escaped, read-only print artifact — never a real posted invoice/receipt. */
export function renderInstallmentLifecyclePrint(
 agreement:PreviewInstallmentAgreement,
 receipts:readonly InstallmentPaymentPreviewEvent[],
 events:readonly InstallmentLifecycleEvent[],asOf:string
):string{
 const view=projectInstallmentLifecycle(agreement,receipts,events,asOf);
 const reversedIds=new Set(events.filter(e=>e.type==='receipt-reversal'&&e.effectiveDate<=asOf)
  .map(e=>(e as Extract<InstallmentLifecycleEvent,{type:'receipt-reversal'}>).sourceReceiptId));
 const baseRows=agreement.schedule.map((s,i)=>row([
  String(i+1),escapeHtml(s.dueDate),escapeHtml(money(s.amountPaisa))
 ])).join('');
 const nextRows=view.rows.map((s,i)=>row([
  String(i+1),escapeHtml(s.id),escapeHtml(s.dueDate),
  escapeHtml(money(s.paidPaisa)),escapeHtml(money(s.outstandingPaisa)),
  escapeHtml(s.status)
 ])).join('');
 const receiptsRows=receipts.map((r,i)=>row([
  String(i+1),escapeHtml(r.id),escapeHtml(r.date),escapeHtml(money(r.amountPaisa)),
  reversedIds.has(r.id)?'Reversed in preview':'Preview receipt'
 ])).join('');
 const actionRows=view.audit.map((e,i)=>row([
  String(i+1),escapeHtml(e.revision),escapeHtml(e.effectiveDate),
  escapeHtml(e.type),escapeHtml(e.reason),escapeHtml(e.actorId)
 ])).join('');
 return [
 '<!doctype html><html lang="en"><head><meta charset="utf-8"/>',
 '<title>HisabIQ PREVIEW installment history · '+escapeHtml(agreement.invoiceReference)+'</title>',
 '<style>@page{size:A4;margin:14mm}body{font-family:Geist,"Hind Siliguri",Arial,sans-serif;color:#0B1A2C;font-size:12px;line-height:1.45}',
 'header{text-align:center;border-bottom:2px solid #0D7C74;padding-bottom:12px;margin-bottom:15px}',
 '.notice{border:2px solid #0B1A2C;padding:9px;text-align:center;font-weight:700;font-size:14px}',
 'h1{font-size:17px;margin:10px 0}h2{font-size:13px;margin:18px 0 5px}',
 '.grid{display:grid;grid-template-columns:1fr 1fr;gap:6px 12px}',
 'table{width:100%;border-collapse:collapse;table-layout:auto}th,td{padding:6px;text-align:left;border-bottom:1px solid #d9e0e5;overflow-wrap:anywhere}',
 'th{background:#f2f6f7;font-weight:600}.money{font-weight:700}',
 '.caution{font-size:10px;color:#475569;padding:9px 0}',
 '@media print{body{margin:0}tr{break-inside:avoid}header,h2{break-after:avoid}}</style></head><body>',
 '<header><div class="notice">PREVIEW — NOT POSTED</div>',
 '<h1>HisabIQ · Installment history</h1>',
 '<div>Agreement '+escapeHtml(agreement.id)+' · Invoice '+escapeHtml(agreement.invoiceReference)+'</div></header>',
 '<div class="grid">',
 '<div>Customer: <strong>'+escapeHtml(agreement.customerName)+'</strong></div>',
 '<div>As of: '+escapeHtml(asOf)+'</div>',
 '<div>Original agreed total: <strong>'+money(agreement.totalPaisa)+'</strong></div>',
 '<div>Initial down payment: <strong>'+money(agreement.downPaymentPaisa)+'</strong></div>',
 '<div>Current outstanding: <strong>'+money(view.totalOutstandingPaisa)+'</strong></div>',
 '<div>Overdue: <strong>'+money(view.overduePaisa)+'</strong></div>',
 '<div>Pending credit/refund decision: <strong>'+money(view.surplusPaisa)+'</strong></div>',
 '<div>Schedule version: '+view.revision+'</div></div>',
 '<h2>Original installment schedule</h2><table><thead><tr><th>#</th><th>Due date</th><th>Scheduled amount</th></tr></thead><tbody>'+baseRows+'</tbody></table>',
 '<h2>Current source-derived installment schedule</h2><table><thead><tr><th>#</th><th>Row</th><th>Due</th><th>Paid</th><th>Outstanding</th><th>Status</th></tr></thead><tbody>'+nextRows+'</tbody></table>',
 '<h2>Receipts (preview only)</h2><table><thead><tr><th>#</th><th>Source ID</th><th>Received date</th><th>Amount</th><th>State</th></tr></thead><tbody>'+receiptsRows+'</tbody></table>',
 '<h2>Audited lifecycle events</h2><table><thead><tr><th>#</th><th>Version</th><th>Date</th><th>Action</th><th>Reason</th><th>Actor</th></tr></thead><tbody>'+actionRows+'</tbody></table>',
 '<p class="caution">Browser-only preview; no actual invoice, customer ledger, bank, cash, MFS, stock, refund or credit was posted.</p>',
 '</body></html>'
 ].join('\n');
}
