import {useFinancialDisplay} from '../../financial-display/useFinancialDisplay';
import {financialContexts,type FinancialContext} from '../../financial-display/model';
import { PartyClosingBalance } from './PartyClosingBalance';
import { StickyNote, FileText, BookOpen, RefreshCcw, HandCoins, ChevronRight } from 'lucide-react';
import { LedgerImpactAmount } from './LedgerImpactAmount';
import { PartyLedgerAttachment, PartyLedgerSourceBadge } from './PartyLedgerIndicators';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../Table';
import { PartyLedgerRowActions } from './PartyLedgerRowActions';
import type { LedgerStatement, PartyAction, PartyLedgerRow } from '../../types/partyLedger';
import { formatMoneyNumber, taka } from '../../utils/currency';
import { useUiCopy } from '../../i18n/useUiCopy';
import { partyLedgerSourceLabel } from '../../i18n/partyLedgerCopy';

type ActionAvailability = { action: PartyAction; enabled: boolean; reason?: string };
type Row = LedgerStatement['rows'][number];
type Props = {
  statement: LedgerStatement;
  visibleRows: Row[];
  actionsForRow: (row: PartyLedgerRow) => ActionAvailability[];
  onAction: (action: PartyAction, row: PartyLedgerRow) => void;
  onOpenAttachment: (row: PartyLedgerRow) => void;
};

const formatLedgerDate = (iso: string) => {
  const date = new Date(iso + 'T12:00:00Z');
  return Number.isNaN(date.getTime()) ? iso :
    new Intl.DateTimeFormat('en-GB', {day:'2-digit',month:'short',year:'numeric',timeZone:'UTC'}).format(date);
};

function LedgerTypeIcon({ row }: { row: PartyLedgerRow }) {
  const Icon = row.source === 'note' ? StickyNote : row.source === 'opening' ? BookOpen :
    row.source === 'sale' || row.source === 'purchase' ? FileText :
    row.source.includes('return') || row.source.includes('refund') ? RefreshCcw : HandCoins;
  return <Icon className="size-4 shrink-0 text-ink-400" aria-hidden="true" />;
}

export function LedgerTableResponsive({ statement, visibleRows, actionsForRow, onAction, onOpenAttachment }: Props) {
  const { text, language } = useUiCopy();
  const financial=useFinancialDisplay(financialContexts.includes(statement.relationship as FinancialContext)?statement.relationship as FinancialContext:'Customer');
  const reduceMotion = useReducedMotion();
  const balance = (value: number) => formatMoneyNumber(Math.abs(value)) + ' ' + (value>=0?'Dr':'Cr');

  const summary = <div className="grid grid-cols-3 gap-x-2 gap-y-1 bg-ink-50/70 px-3 py-2 md:flex md:flex-wrap md:items-center md:justify-start md:gap-x-5 md:gap-y-1 md:px-4 md:py-2" aria-label={text('Ledger summary', 'খাতার সারসংক্ষেপ')}>
    {[
      [text('Opening balance', 'শুরুর জের'), balance(statement.openingBalance)],
      [text('Period debit', 'এই সময়ের ডেবিট'), formatMoneyNumber(statement.periodDebit)],
      [text('Period credit', 'এই সময়ের ক্রেডিট'), formatMoneyNumber(statement.periodCredit)]
    ].map(([label, value]) => <div key={label} className="min-w-0 md:flex md:items-baseline md:gap-1.5">
      <p className="text-xs text-ink-500">{label}</p>
      <strong className="block break-words text-[13px] font-semibold text-ink">{value}</strong>
    </div>)}
  </div>;

  return <div className="min-w-0">
    <div className="hidden md:block">{summary}</div>

    <div className="hidden min-w-0 overflow-x-auto md:block">
      <Table scrollRegionLabel={text('Party ledger transactions', 'পার্টির খাতার লেনদেন')} className="w-full min-w-[655px]">
        <TableHeader>
          <TableRow className="h-8 bg-ink-50/30 hover:bg-transparent">
            <TableHead className="w-[105px] whitespace-nowrap pl-3 text-[11px]">{text('Date', 'তারিখ')}</TableHead>
            <TableHead className="min-w-[178px] text-[11px]">{text('Particulars', 'বিবরণ')}</TableHead>
            {financial.columns.map(side=><TableHead key={side} className="w-[96px] text-right text-[11px]">{financial.label(side)}</TableHead>)}
            <TableHead className="w-[116px] text-right text-[11px]">{text('Balance', 'জের')}</TableHead>
            <TableHead className="w-[40px] pr-2 text-right text-[11px]"><span className="sr-only">{text('Actions', 'কাজ')}</span></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visibleRows.map(row => <TableRow key={row.id} className="text-[12px] hover:bg-ink-50/40">
            <TableCell className="whitespace-nowrap pl-3 py-1.5 text-[11px] text-ink-500">{formatLedgerDate(row.date)}</TableCell>
            <TableCell className="min-w-[174px] py-1.5">
              <div className="flex items-start gap-1.5">
                <button type="button" aria-label={text('View transaction','লেনদেন দেখুন') + ' ' + (row.reference || row.id)}
                  onClick={() => onAction('view',row)}
                  className="group flex min-w-0 flex-1 items-start gap-1.5 rounded text-left transition-colors hover:text-teal-700 focus-visible:outline-2 focus-visible:outline-teal-500">
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 leading-tight">
                      <PartyLedgerSourceBadge source={row.source} label={partyLedgerSourceLabel(language,row.source)} />
                      <strong className="break-words text-[12px] font-semibold text-ink group-hover:text-teal-700">{row.reference || partyLedgerSourceLabel(language,row.source)}</strong>
                    </span>
                    {row.description && <span data-table-helper="" className="mt-0.5 block max-w-md truncate text-[11px] leading-tight text-ink-500" title={row.description}>{row.description}</span>}
                  </span>
                </button>
                {row.attachment && <PartyLedgerAttachment attachment={row.attachment}
                  label={text('Open attachment', 'সংযুক্ত ফাইল খুলুন')}
                  onClick={() => onOpenAttachment(row)} />}
              </div>
            </TableCell>
            {financial.columns.map(side=><TableCell key={side} className="py-1.5 text-right"><LedgerImpactAmount row={row} value={row[side]} language={language} currency /></TableCell>)}
            <TableCell className="whitespace-nowrap py-1.5 text-right font-semibold text-ink">{taka(Math.abs(row.runningBalance))} <span data-table-helper="" className="text-[10px] text-ink-500">{row.runningBalance>=0?'Dr':'Cr'}</span></TableCell>
            <TableCell className="py-1 pr-1.5 text-right">
              <div className="flex items-center justify-end gap-1"><PartyLedgerRowActions row={row} actions={actionsForRow(row)} onAction={onAction} /></div>
            </TableCell>
          </TableRow>)}
          {!visibleRows.length && <TableRow><TableCell colSpan={6} className="p-8 text-center text-sm text-ink-500">
            {text('No transactions match these filters.', 'এই ফিল্টারে কোনো লেনদেন নেই।')}
          </TableCell></TableRow>}
        </TableBody>
      </Table>
    </div>

    <ul data-erp-table-view="" className="divide-y divide-border md:hidden" aria-label={text('Transactions', 'লেনদেন')}>
      <AnimatePresence initial={false} mode="popLayout">
      {visibleRows.map(row => {
        const amount = row.debit || row.credit;
        const side = row.debit ? financial.label('debit') : row.credit ? financial.label('credit') : '';
        return <motion.li key={row.id} className="min-w-0 px-4 py-3.5"
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.18, ease: 'easeOut' }}>
          <button type="button" aria-label={text('View transaction','লেনদেন দেখুন') + ' ' + (row.reference || row.id)}
            onClick={() => onAction('view',row)}
            className="block w-full rounded-md text-left transition-colors hover:bg-ink-50/50 focus-visible:outline-2 focus-visible:outline-teal-500">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-1.5 text-xs text-ink-500">
                <LedgerTypeIcon row={row} />
                <PartyLedgerSourceBadge source={row.source} label={partyLedgerSourceLabel(language,row.source)} />
                <span aria-hidden="true">·</span>
                <span className="shrink-0">{row.date}</span>
              </div>
              <p className="mt-1 break-words text-[15px] font-semibold leading-tight text-ink">
                {row.reference || row.description || partyLedgerSourceLabel(language,row.source)}
              </p>
            </div>
            {amount !== 0 && <div className="min-w-0 shrink-0 text-right">
              <div className="text-[15px]"><LedgerImpactAmount row={row} value={amount} language={language} /></div>
              <p data-table-helper="" className="mt-0.5 text-xs text-ink-500">{side}</p>
            </div>}
          </div>
          {row.description && row.description !== row.reference && <p className="mt-1 line-clamp-2 break-words text-[13px] leading-snug text-ink-500">{row.description}</p>}
          </button>
          <div className="mt-2.5 flex min-w-0 items-center justify-between gap-2">
            <p className="min-w-0 break-words text-xs text-ink-500"><span data-table-helper="">{text('Balance', 'জের')}</span> <strong data-testid="ledger-running-balance" className="font-semibold text-ink">{balance(row.runningBalance)}</strong></p>
            <div className="flex shrink-0 items-center gap-1">
              {row.attachment && <PartyLedgerAttachment attachment={row.attachment}
                label={text('Open attachment', 'সংযুক্ত ফাইল খুলুন')}
                onClick={() => onOpenAttachment(row)} />}
              <ChevronRight className="size-4 shrink-0 text-ink-400" aria-hidden="true" />
              <PartyLedgerRowActions row={row} actions={actionsForRow(row)} onAction={onAction} />
            </div>
          </div>
        </motion.li>;
      })}
      </AnimatePresence>
      {!visibleRows.length && <li className="p-8 text-center text-sm text-ink-500">
        {text('No transactions match these filters.', 'এই ফিল্টারে কোনো লেনদেন নেই।')}
      </li>}
    </ul>

    <div className="border-t border-border md:hidden">{summary}</div>
    <PartyClosingBalance balance={statement.closingBalance} relationship={statement.relationship} compact />
  </div>;
}
