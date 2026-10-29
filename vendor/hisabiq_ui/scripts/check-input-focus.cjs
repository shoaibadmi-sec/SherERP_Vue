/* ERP control dimensions/focus source guard. Keep this check fast for PR CI. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const load = file => fs.readFileSync(path.join(__dirname,'..',file),'utf8');
const css = load('src/index.css');
const input = load('src/components/Input.tsx');
const numeric = load('src/components/NumericInput.tsx');
const joined = load('src/components/MoneyUnitInput.tsx');
const party = load('src/components/parties/PartyLedgerToolbarResponsive.tsx');
const sales = load('src/pages/Sales.tsx');
const salesMobile = load('src/components/sales/SalesMobileLayout.tsx');
const salesCss = load('src/components/sales/sales-mobile.css');
const components = [
 ['AppSelect','src/components/AppSelect.tsx','data-hisabiq-select=""'],
 ['SearchSelect','src/components/SearchSelect.tsx','data-hisabiq-select=""'],
 ['Date picker','src/components/AppDateRangePicker.tsx','data-hisabiq-select=""'],
 ['Numeric','src/components/NumericInput.tsx','data-hisabiq-numeric=""'],
 ['Joined amount/unit','src/components/MoneyUnitInput.tsx','data-hisabiq-field-shell=""']
];
for (const [name,file,marker] of components) {
  assert.ok(load(file).includes(marker),name+' must use shared control styling');
}
assert.equal((input.match(/data-hisabiq-input=""/g)||[]).length,2,'Plain and clearable input markers');
assert.ok(input.includes('className={alignedClass}'),'Shared input 36px baseline');
assert.ok(css.includes('--erp-control-height: 36px;'),'36px canonical control token');
assert.ok(css.includes('height: var(--erp-control-height) !important;'),'Universal control height override');
assert.ok(css.includes('button[data-slot="button"]'),'Direct design-system buttons included');
assert.ok(css.includes('button[role="combobox"]'),'Dropdowns included');
assert.ok(css.includes('input[data-slot="input"]'),'Inputs included');
assert.ok(css.includes('[data-hisabiq-numeric]'),'Numeric shells included');
assert.ok(css.includes('[data-hisabiq-field-shell]'),'Joined amount/unit shell included');
assert.ok(css.includes('--ctl-h: var(--erp-control-height);'),'Product form uses shared height');
assert.ok(!css.includes('data-hisabiq-action-context="page"'),'No priority resizing');
assert.ok(css.includes('[aria-expanded="true"]'),'Dropdown open focus stays visible');
assert.ok(css.includes('[aria-invalid="true"]'),'Invalid input treatment stays visible');
assert.ok(numeric.includes('data-numeric-input'),'Preserve numeric stepper');
assert.ok(joined.includes('data-numeric-joined'),'Preserve joined input');
assert.equal((party.match(/data-ledger-filter-action=""/g)||[]).length,2,'Party toolbar actions');
assert.equal((party.match(/h-9 min-h-9 flex-1 md:flex-none/g)||[]).length,2,'Party action sizing');
assert.ok(sales.includes('data-sales-header-new=""'),'Sales header new-sale marker');
assert.ok(salesMobile.includes('size-9 shrink-0 p-0'),'Sales overflow 36px square');
assert.ok(!/(?:min-)?height:\s*(?:40|44|48)px;/.test(salesCss),'No enlarged Sales mobile controls');
console.log('ERP shared 36px size + focus source contract: PASS');