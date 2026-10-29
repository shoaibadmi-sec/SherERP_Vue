import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const file=(p:string)=>readFileSync(p,'utf8');

test('audit print localizes presentation while audit CSV keeps its existing columns and records',()=>{
 const audit=file('src/pages/AuditLedger.tsx');
 assert.match(audit,/downloadReport\('hisabiq-audit-ledger\.csv',reportHeaders,reportRows\)/);
 assert.match(audit,/printReport\(\{title:documentLabel\(language,'Audit Ledger'\),language/);
 assert.match(audit,/headers:reportHeaders\.map\(h=>documentLabel\(language,h\)\)/);
 assert.match(audit,/const reportRows=filtered\.map\(source=>/);
 assert.match(audit,/applyDelete\(/);
});
test('accounting CSV sources, calculations, and posting identifiers are untouched',()=>{
 const accounts=file('src/pages/Accounts.tsx'),statements=file('src/components/accounts/StatementsView.tsx');
 const ledger=file('src/components/accounts/LedgerView.tsx');
 const trial=file('src/components/accounts/TrialBalanceView.tsx');
 assert.match(accounts,/const header = 'Date,Type,Reference,Description,Posted by,Amount,Status'/);
 assert.match(statements,/\['Statement', 'Line', 'Amount'\]/);
 assert.match(statements,/balanceSheet\(postings,/);
 assert.match(statements,/printReport\(\{title:text\('Financial statements'/);
 assert.match(ledger,/\['Date', 'Transaction Date', 'Created Date', 'Reference', 'Details', 'Debit', 'Credit', 'Balance'\]/);
 assert.match(trial,/\['Code', 'Account', 'Group', 'Debit', 'Credit'\]/);
});
test('Party statement CSV still serializes unchanged financial values and ledger direction',()=>{
 const statement=file('src/components/parties/PartyStatementDialog.tsx');
 assert.match(statement,/serializePartyStatementCsv\(statement,/);
 assert.match(statement,/statementPrintRows\(statement\)/);
 assert.match(statement,/statement\.periodDebit/);
 assert.match(statement,/statement\.periodCredit/);
 const toolbar=file('src/components/parties/PartyLedgerToolbar.tsx');
 assert.match(toolbar,/options=\{kinds\.map\(item=>\(\{\.\.\.item,label:text/);
});
test('Bangla strings never replace persisted filter or correction identifiers',()=>{
 const audit=file('src/components/audit/AuditFilters.tsx'),edit=file('src/components/audit/AuditEditDialog.tsx');
 assert.match(audit,/value:'All sources',label:text/);
 assert.match(audit,/options=\{\['All status', 'Posted', 'Deleted'\]\.map\(v=>\(\{value:v,label:text/);
 assert.match(edit,/applyCorrection\(command, state\)/);
 assert.match(edit,/validateCorrection\(command, state\)/);
});
