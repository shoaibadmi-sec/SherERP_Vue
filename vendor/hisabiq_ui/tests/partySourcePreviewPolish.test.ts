import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (file: string) => readFileSync(file, 'utf8');

test('ERP-wide button polish retains existing component events and variants', () => {
  const button = read('src/components/Button.tsx');
  const css = read('src/index.css');
  for (const value of ['DesignButton', '{...props}', 'size={size}', 'variant={variant}', 'hisabiq-button']) {
    assert.ok(button.includes(value), value);
  }
  for (const value of ['data-hisabiq-variant="outline"', 'data-hisabiq-variant="secondary"',
    'background-color: var(--card)', '--erp-control-height: 36px', 'height: var(--erp-control-height) !important']) {
    assert.ok(css.includes(value), value);
  }
  assert.ok(css.includes('data-cart-row'));
});

test('Ledger closing balances provide contextual meanings without modifying ledger numbers', () => {
  const component = read('src/components/parties/PartyClosingBalance.tsx');
  for (const name of ['receivable', 'payable', 'credit', 'capital', 'settled', 'Customer credit',
    'taka(Math.abs(balance))', 'data-testid="party-closing-balance"']) assert.ok(component.includes(name), name);
  for (const file of ['LedgerTable.tsx', 'LedgerTableResponsive.tsx', 'PartyStatementDialog.tsx']) {
    assert.ok(read('src/components/parties/' + file).includes('<PartyClosingBalance'), file);
  }
});

test('Invoice/source quick previews use real store records with safe missing-source fallback', () => {
  const preview = read('src/components/parties/PartySourceQuickPreview.tsx');
  for (const name of ['getSalesPreviewSnapshot', 'availablePurchases', 'sale.lines.map', 'purchase.cartSnapshot',
    'source.method', 'source.financeType', 'partySourceRoute', 'Item-level source data is unavailable',
    'data-testid="party-source-quick-preview"']) assert.ok(preview.includes(name), name);
  for (const name of ['PartyDetail.tsx', 'PartyDetailResponsive.tsx']) {
    const detail = read('src/components/parties/' + name);
    assert.ok(detail.includes('<PartySourceQuickPreview'), name);
    assert.ok(detail.includes("onLedgerAction('source', row)"), name);
    assert.ok(detail.includes('onOpenAttachment={openLedgerAttachment}'), name);
  }
});

test('Attachment quick preview offers image/PDF rendering and safe file URLs', () => {
  const viewer = read('src/components/parties/PartyAttachmentQuickPreview.tsx');
  for (const value of ['safeUrl', "parsed.protocol === 'https:'", 'data:application', '<iframe',
    '<img', 'Open file', 'data-testid="party-attachment-preview"']) assert.ok(viewer.includes(value), value);
  const party = read('src/pages/Parties.tsx');
  assert.ok(party.includes('receiptByPurchase'));
  assert.ok(party.includes('attachment:source.kind'));
});

test('Ledger amount colors are neutral while semantic movement icons are colored on every viewport', () => {
  const renderer = read('src/components/parties/LedgerImpactAmount.tsx');
  for(const kind of ["in: 'text-emerald-700", "out: 'text-rose-700", "adjustment: 'text-amber-700",
    "due: 'text-ink-400", "opening: 'text-ink-400"]) {
    assert.ok(renderer.includes(kind), 'Icon mapping ' + kind);
  }
  assert.ok(renderer.includes('font-semibold leading-tight text-ink'),'Money amount has neutral ink');
  assert.ok(renderer.includes('font-normal leading-tight text-ink-500'),'Caption has muted neutral ink');
  const desktop=read('src/components/parties/LedgerTable.tsx');
  const tablet=read('src/components/parties/LedgerTableResponsive.tsx');
  assert.ok(desktop.includes('<LedgerImpactAmount'),'Desktop uses shared semantic movement presentation');
  assert.ok(tablet.includes('<LedgerImpactAmount'),'Tablet and phone use shared semantic movement presentation');
  assert.ok(!tablet.includes('<CompactAmount'),'Plain tablet amount renderer is no longer used');
});

test('Magic Patterns role action buttons preserve correct finance debit and credit transaction types', () => {
  const config=read('src/components/parties/partyRoleActions.ts');
  const finance=read('src/components/parties/PartyFinanceDialog.tsx');
  const mobile=read('src/components/parties/PartyDetailResponsive.tsx');
  const desktop=read('src/components/parties/PartyDetail.tsx');
  for (const [id,type] of [
    ['repay-loan','Lender Debit'],['loan-received','Lender Credit'],
    ['lend-money','Borrower Debit'],['collect-repayment','Borrower Credit'],
    ['add-capital','Owner Credit'],['owner-drawing','Owner Debit']
  ]) {
    assert.ok(config.includes("id:'"+id+"'"),id+' action exists');
    assert.ok(config.includes("financeType:'"+type+"'"),type+' accounting direction retained');
  }
  for (const icon of ['Banknote','Landmark','PiggyBank','Wallet','HandCoins','ArrowDownLeft','ArrowUpRight']) {
    assert.ok(config.includes(icon),icon+' reference action icon');
  }
  assert.ok(finance.includes('available[relationship].includes(initialType)'),'Finance type validated for role');
  assert.ok(finance.includes('initialType'),'Finance dialog accepts selected action');
  assert.ok(finance.includes('validatePartySplits(paymentSplits,money)'),'Finance validation unchanged');
  for (const view of [mobile,desktop]) {
    assert.ok(view.includes("partyFinanceActions(relationship)"),'Both viewports resolve role actions');
    assert.ok(view.includes('openRoleFinance(action.financeType)'),'Finance shortcuts use actual handler');
    assert.ok(view.includes('initialType={financeStartType}'),'Correct preselection used on dialog');
    assert.ok(view.includes('VendorQuickSettlementDialog'),'Vendor actions embed existing settlement inside Party');
    assert.ok(view.includes("setVendorSettlementMode('pay')"),'Pay Vendor opens the local modal');
    assert.ok(view.includes("setVendorSettlementMode('receive-money')"),'Receive Money opens the local modal');
  }
  assert.ok(mobile.includes("partyTradingActionIcons[relationship]"),'Distinct customer and supplier icons on mobile');
  assert.ok(desktop.includes("partyTradingActionIcons[relationship]"),'Distinct customer and supplier icons on desktop');
});

test('Vendor quick settlement embeds existing source-linked form and validates memo allocation', () => {
  const quick=read('src/components/parties/VendorQuickSettlementDialog.tsx');
  const vendor=read('src/components/parties/VendorActionDialog.tsx');
  for(const required of ["sourceOutstanding(state,source.id)","source.status==='Active'",
    "source.unitCostBasePaisa!==null","VendorActionDialog key=","inline mode={mode}",
    "onChange={setSelectedId}",'getVendorPreviewSnapshot','subscribeVendorPreview',
    "text('Pay Vendor'","text('Receive Money'"]) assert.ok(quick.includes(required),required);
  assert.ok(vendor.includes("type:'settle-source'"),'No parallel posting path: shared Vendor settlement');
  assert.ok(vendor.includes("amountPaisa:paidPaisa??returnPaisa"),'Allocation stays source-linked');
  assert.ok(vendor.includes("paidPaisa!>duePaisa"),'Overpaying remains forbidden');
});

test('Shared ERP Dialog adopts Magic Patterns Framer Motion entrance without changing existing form logic', () => {
  const dialog=read('src/components/Dialog.tsx');
  for(const source of ["import {animate,useReducedMotion} from 'framer-motion'",
    'useLayoutEffect(()=>{', 'if(!modal?.open||!ref.current||reduceMotion)return',
    'opacity:[0,1],marginTop:[24,0]', 'duration:0.22,ease:easing',
    'animate(backdrop,{opacity:[0,1]},{duration:0.18})',
    "data-modal-motion={reduceMotion?'reduced':'magic-patterns'}",
    'DesignContent {...props}', 'lockBodyScroll()', 'previous.focus({preventScroll:true})',
    "event.key==='Escape'", "event.key!=='Tab'"]) {
    assert.ok(dialog.includes(source), 'Dialog preserves semantics and motion: '+source);
  }
  assert.ok(dialog.includes('[0.32,0.72,0,1]'), 'Original Magic Patterns bezier is matched');
  const sheet=read('src/components/parties/PartyActionSheet.tsx');
  assert.ok(sheet.includes('AnimatePresence'), 'Mobile More action sheet retains its existing exit animation');
});
