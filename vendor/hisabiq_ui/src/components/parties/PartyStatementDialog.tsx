import {useTenantSettings} from '../../settings/TenantSettingsProvider';
import {outputProfileDefaults} from '../../documents/outputProfile';
import {useFinancialDisplay} from '../../financial-display/useFinancialDisplay';
import {financialContexts,type FinancialContext} from '../../financial-display/model';
import { PartyClosingBalance } from './PartyClosingBalance';
import { Download, Printer } from 'lucide-react';
import { Button } from '../Button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../Dialog';
import type { Party } from '../../types/erp';
import type { LedgerStatement } from '../../types/partyLedger';
import { statementPrintRows, serializePartyStatementCsv } from '../../utils/partyStatement';
import { businessToday } from '../../utils/dateRange';
import { formatMoneyNumber } from '../../utils/currency';
import { ledgerImpact } from '../../utils/partyLedgerImpact';
import {useUiCopy} from '../../i18n/useUiCopy';
import {partyLedgerImpactText} from '../../i18n/partyFinancialCopy';

type Props={open:boolean;onClose:()=>void;party:Party;statement:LedgerStatement};
export function PartyStatementDialog({open,onClose,party,statement}:Props){
  const {text}=useUiCopy();
  const {state}=useTenantSettings();
  const profile=state.sections.invoices.profiles?.ledger??outputProfileDefaults("ledger");
  const language=profile.language;
  const docText=(en:string,bn:string)=>language==="Bangla"?bn:en;
  const financial=useFinancialDisplay(financialContexts.includes(statement.relationship as FinancialContext)?statement.relationship as FinancialContext:'Customer',language);
  const period=statement.from&&statement.to
    ? statement.from+' — '+statement.to
    : text('All time (through ','শুরু থেকে (')+businessToday()+')';
  const download=()=>{
    const csv=serializePartyStatementCsv(statement,{business:'HisabIQ · Business preview',party:party.name});
    const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;
    a.download='party-ledger-'+party.id+'-'+(statement.from||'all')+'-'+(statement.to||businessToday())+'.csv';
    document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
  };
  const rows=statementPrintRows(statement);
  return <Dialog open={open} onOpenChange={value=>!value&&onClose()}>
    <DialogContent role="dialog" aria-modal="true" aria-label={text("Party ledger statement","পক্ষের হিসাবের বিবরণ")}
      className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
      <DialogHeader>
        <DialogTitle>{text('Party ledger statement','পক্ষের হিসাবের বিবরণ')}</DialogTitle>
        <DialogDescription>{text('Clean dated statement. Print using your browser or Save as PDF; no backend posting.','তারিখ অনুযায়ী হিসাব। প্রিন্ট বা পিডিএফ সেভ করুন। আসল সার্ভারের খাতায় কোনো লেখা হবে না।')}</DialogDescription>
      </DialogHeader>
      <div id="party-statement-print" className="party-statement-print space-y-4 rounded-lg border border-border bg-card p-4 text-ink">
        <div className="border-b border-border pb-3">
          <style>{`@page{size:A4 ${profile.orientation.toLowerCase()};margin:${profile.margin}mm}`}</style>
          <h2 hidden={!profile.showBusiness} className="text-lg font-semibold">{language==="Bangla"?(state.sections.business.nameBn||state.sections.business.name):state.sections.business.name}</h2>
          <p className="text-xs text-ink-500">{docText('Unverified demo business identity — configure your tenant before sharing a statement.','এটি যাচাই না করা নমুনা ব্যবসার পরিচয়। বিবরণ শেয়ার করার আগে ব্যবসার তথ্য ঠিক করুন।')}</p>
          <div className="mt-2 flex flex-wrap justify-between gap-2">
            <div><strong>{party.name}</strong>{party.nameBn&&<span className="ml-2 font-bn">{party.nameBn}</span>}
              <p className="text-xs text-ink-500">{party.phone} · {party.area}</p>
            </div>
            <div className="text-right text-xs"><strong>{docText(statement.relationship,statement.relationship==='Customer'?'ক্রেতা':statement.relationship==='Supplier'?'সরবরাহকারী':statement.relationship==='Borrower'?'ঋণগ্রহীতা':statement.relationship==='Lender'?'ঋণদাতা':statement.relationship==='Owner'?'মালিক':statement.relationship)} {docText('ledger','খাতা')}</strong>
              <p>{period}</p><p>{docText('Printed:','প্রিন্টের তারিখ:')} {businessToday()}</p>
            </div>
          </div>
        </div>
        <div className="flex justify-between text-sm"><span title={docText("Balance before the selected date range; dated opening entries appear in the table","বাছা সময়ের আগের জের; শুরুর লেনদেন তারিখসহ তালিকায় আছে")}>{docText('Opening balance (brought forward)','আগের জের')}</span><strong>৳{formatMoneyNumber(statement.openingBalance)}</strong></div>
        <div className="overflow-x-auto">
          <table data-erp-table="" className="w-full border-collapse text-xs">
            <thead><tr className="border-y border-border bg-ink-50 text-ink-700">
              <th className="p-2 text-left">{docText('Date','তারিখ')}</th><th className="p-2 text-left">{docText('Particulars','বিবরণ')}</th>
              {financial.columns.map(side=><th key={side} className="p-2 text-right">{financial.label(side)}</th>)}<th className="p-2 text-right">{docText('Balance','জের')}</th>
            </tr></thead>
            <tbody>{rows.map(row=><tr key={row.id} className="border-b border-border/70">
              <td className="whitespace-nowrap p-2">{row.date}</td>
              <td className="p-2"><span className="font-medium">{row.reference||row.source}</span>
               <span data-table-helper="" className="ml-1 text-[10px] text-ink-500">· {partyLedgerImpactText(language,ledgerImpact(row).label)}</span>
               <p className="max-w-sm break-words text-ink-500">{row.description}</p></td>
              {financial.columns.map(side=><td key={side} className="p-2 text-right">{row[side]?formatMoneyNumber(row[side]):'—'}</td>)}
              <td className="p-2 text-right">{formatMoneyNumber(row.runningBalance)}</td>
            </tr>)}
            {!rows.length&&<tr><td colSpan={5} className="p-5 text-center">{docText('No transactions in this date range.','এই সময়ে কোনো লেনদেন নেই।')}</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="ml-auto max-w-sm space-y-1 border-t border-border pt-2 text-xs">
          <div className="flex justify-between"><span>{docText('Period debit','এই সময়ের ডেবিট')}</span><strong>{formatMoneyNumber(statement.periodDebit)}</strong></div>
          <div className="flex justify-between"><span>{docText('Period credit','এই সময়ের ক্রেডিট')}</span><strong>{formatMoneyNumber(statement.periodCredit)}</strong></div>
          <PartyClosingBalance balance={statement.closingBalance} relationship={statement.relationship} language={language} compact />
        </div>
        {profile.showSignatures&&<p className="mt-8 border-t border-border pt-3 text-xs">{docText('Signature','স্বাক্ষর')} __________________</p>}
        {profile.footer&&<p className="whitespace-pre-wrap text-xs">{profile.footer}</p>}
      </div>
      <div className="flex flex-wrap justify-end gap-2 party-statement-controls">
        <Button variant="outline" onClick={onClose}>{text('Close','বন্ধ করুন')}</Button>
        <Button variant="outline" onClick={download}><Download className="size-4"/> {text('Export CSV','CSV ডাউনলোড')}</Button>
        <Button onClick={()=>window.print()}><Printer className="size-4"/> {text('Print','প্রিন্ট')}</Button>
      </div>
    </DialogContent>
  </Dialog>;
}
