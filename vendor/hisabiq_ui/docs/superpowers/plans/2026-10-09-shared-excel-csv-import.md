# Shared Excel/CSV Import Center Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a real, keyboard/touch-friendly Excel and CSV import preview for HisabIQ Products (including opening stock) and Customer/Supplier Parties (including opening balances), with correct duplicate handling and no fake accounting postings.

**Architecture:** One four-step React wizard consumes a shared, bounded and security-checked tabular reader and schema-driven column mapper. Two domain planners produce independently validated, typed change sets; the Product and Party preview adapters commit each approved batch coherently and auditably without inventing a backend. **Three sequential reviewable PR slices (A shared wizard, B Products, C Parties)**; each provides useful, testable behavior and does not enable actions that are not yet implemented.

**Tech Stack:** React 18, TypeScript 5.5, Vite 5, Tailwind/shadcn-style UI, existing HisabIQ components, Node 22 `--experimental-strip-types` tests, Playwright Chromium, GitHub Actions; proposed exact read/write/ZIP dependencies below.

**Spec:** `docs/superpowers/specs/2026-10-09-shared-excel-csv-import-design.md` — approved scope, committed in documentation branch `docs/shared-excel-csv-import-20261009` (PR #34). Merge the spec before executing this plan.

## Global Constraints

- Only modify `shuvodelux-commits/hisabiq_ui` UI/preview repository. Do **not** modify production `hisabiq` or `legacy/`, and do not claim a persistent tenant backend.
- Preserve Magic Patterns appearance, compact tables, English labels with Bangla helper, no monospaced digits, light/dark contrast, keyboard/touch access, proper ARIA and existing shadcn-style components.
- Supported inputs: UTF-8 `.csv` (with BOM) up to **1 MB**, `.xlsx` up to **5 MB**; **5,000 nonempty data rows**, one selected worksheet. Reject old `.xls` and macro-enabled `.xlsm`. Max **one opening lot per newly created Stock product row**.
- **Recommended dependency pins to verify at implementation:** `read-excel-file@9.3.12` (browser worker-backed read), `write-excel-file@4.1.1` (XLSX template writer), `fflate@0.8.2` (bounded ZIP preflight/formula detection). Install **only** in Slice A and update `package-lock.json`. Avoid `exceljs@4.4.0` because of recent reported security advisories; do not use formula cached values as trusted literals.
- Before `read-excel-file`, ZIP central-directory preflight must reject absurd inflated sizes, compressed-to-uncompressed ratios, unexpected macro/external-link content, and worksheet `<f>` formulas. Formula-bearing workbooks are **rejected** in v1 with "Paste values and retry", since the reader may otherwise return cached formula results. No remote URLs fetched or formulas executed.
- All source phone numbers, SKUs, reference IDs are treated as text; do not infer a missing Bangladesh leading zero. Errors indicate source sheet/row/field. No silent name-based Party merge or replacement of verified opening balances.
- Product base-unit conversion: `toBasePrice(1200,'Box','Pcs','Box',10)===120`; `toBaseQuantity(2,'Box','Pcs','Box',10)===20`. A new stock quantity > 0 creates **one** `StockLot(source:'Opening')` and `StockMovement(type:'Opening')` with matched date/quantity/reference.
- Customer opening `Dr` is receivable; Supplier opening `Cr` is payable; Customer `Cr` is unverified/non-refundable; Supplier `Dr` is advance. Every opening is relationship-specific, never cash/bank movement. No bulk replacement of existing role openings.
- Never mutate live preview during file parse, mapping or review. Selected valid rows commit as **one coherent batch** or not at all, with session idempotency and source row audit. No double stock count from mirrored stores.
- Do not introduce another accounting ledger engine. Reuse `src/data/partyPreviewStore.ts`, `src/utils/partyOpening.ts` and `src/utils/partySettlement.ts`, preserving current invoice/payment/finance tests.
- Do not use subagents for execution (user has previously selected **Native implementation**). Keep code slices in independently reviewable GitHub PRs; only merge/deploy when requested. During execution, follow `superpowers:executing-plans` and TDD.
- Every shell command given to the user needs a one-line description. Commands below are for the plan executor.

## Review Focus

Five easy-to-miss real-world inputs; **the corresponding numbered task must test each one**:

1. **Bangladesh mobile entered as Excel number:** never silently reconstruct a lost `0`. Task 2 test asserts flagged numeric phone; Task 9 tests correction to literal `017...`.
2. **Workbook formula with cached price:** do not import the cached result. Task 2 test creates an XLSX with `<f>` and asserts an explicit refusal.
3. **Duplicate SKU inside the same file plus in existing inventory:** Task 6 test rejects uncontrolled overwrite; default is Skip, updating existing Product never creates stock lot.
4. **Two roles for the same person with conflicting openings:** Task 9 test keeps independent Customer Dr and Supplier Cr; Task 10 rejects overwriting an existing active opening and rolls back all rows.
5. **Failure late in a large import (bad conversion/date/serial):** Task 7 and Task 10 tests assert no partial product/lot/Party/ledger writes and no second import on session replay.

---

## File responsibility map (fixed before implementation)

**Shared / Slice A**

- Create `src/import/importTypes.ts`: `ImportTarget`, `ImportIssue`, `ImportTable`, `ColumnMapping`, `StagedImportRow`, `ImportRowDecision`, result types.
- Create `src/import/fieldSchemas.ts`: field descriptors, required/optional rules, English/Bangla aliases, example values.
- Create `src/import/columnMapping.ts`: deterministic heading normalization, suggestions, ambiguities, normalized staged rows.
- Create `src/import/safeXlsx.ts`: preflight ZIP entries and reject formula workbook before reader parses cells.
- Create `src/import/fileReader.ts`: CSV/XLSX reader, limits, sheets and original row numbers; no domain mapping.
- Create `src/import/importTemplates.ts`: actual CSV and XLSX template generation; safe CSV serialization and Blob download.
- Create `src/components/import/ImportWizard.tsx`, `ImportUploadStep.tsx`, `ImportMappingStep.tsx`, `ImportReviewStep.tsx`, `ImportFinishStep.tsx`: shared accessible wizard and its four focused views. Split UI state from row conversion.
- Modify `src/pages/Products.tsx` in Slice A **only** to mount `ImportWizard(target:'product')` with no apply callback and visibly disabled Confirm. Slice B adds the apply callback.
- Tests: `tests/importSchema.test.ts`, `tests/importFileReader.test.ts`, `tests/importTemplates.test.ts`, `scripts/import-wizard-browser.cjs`.

**Products / Slice B**

- Create `src/import/productImport.ts`: `planProductImport` and domain validation, normalized product + optional opening lot + movement.
- Create `src/data/productImportPreviewStore.ts`: one atomic batch commit over a coherent Product/Lot/Movement preview snapshot; expose query and subscription functions (or a narrow batch commit adapter integrated with current store).
- Modify `src/data/erpDemoStore.ts`, `src/pages/Products.tsx`: route both Add Product and bulk import through consistent preview projections, without double-adding inventory. Keep current adjustments/offers intact.
- Tests: `tests/productImport.test.ts`, `tests/productImportCommit.test.ts`, `scripts/product-import-browser.cjs`.

**Parties / Slice C**

- Create `src/import/partyImport.ts`: typed Customer/Supplier planner with suggested matches and explicit role/opening decisions.
- Modify `src/data/partyPreviewStore.ts`: one `import-party-batch` command commits Party identities, role additions and opening sources with one revision/notification or rejects the entire plan; audit preserves session and row provenance.
- Modify `src/pages/Parties.tsx`, `src/components/parties/PartyImportDialog.tsx`: replace existing CSV-only path with shared wizard; keep existing Party views and public CSV behavior compatible.
- Tests: `tests/partyImportPlan.test.ts`, `tests/partyImportBatch.test.ts`, `scripts/party-import-browser.cjs`.

**CI / Slice A–C:** modify `package.json`, `package-lock.json`, `.github/workflows/ui-check.yml` to run focused tests and existing Playwright regression scripts.

## Shared interfaces (names must remain consistent)

```ts
type ImportTarget = 'product' | 'customer' | 'supplier';
type ImportRowDecision = 'create' | 'update-master' | 'add-role' | 'skip' | 'reject';
type ImportIssue = {
  sourceRow: number;
  field?: string;
  severity: 'error' | 'warning';
  message: string;
};
type ImportCell = string | number | boolean | Date | null;
type ImportTable = {
  fileName: string;
  sheet: string;             // 'CSV' for CSV
  sheetNames: string[];
  headers: string[];
  rows: Array<{ sourceRow: number; cells: ImportCell[] }>;
};
type ColumnMapping = Record<string, number | null>; // target field -> source column index
type StagedImportRow = {
  sourceSheet: string;
  sourceRow: number;
  original: Record<string, string>;
  mapped: Record<string, unknown>;
  issues: ImportIssue[];
  match?: { kind: 'strong' | 'suggested'; existingId: string; label: string };
  decision: ImportRowDecision;
};
type ImportResult = {
  sessionId: string;
  created: number;
  masterUpdated: number;
  roleAdded: number;
  openingSources: number;
  openingLots: number;
  skipped: number;
  rejected: number;
  errors: ImportIssue[];
};
```

Fields and interfaces are UI-preview contracts, not a production API. `importFileReader` exposes `parseImportFile(file: File): Promise<ImportTable[]>`, all sheet names and selected worksheet data; code must not unexpectedly parse a second sheet into the active import.

---

## Slice A: safe shared wizard and real templates

### Task 1: Shared schemas, aliases and column mapper

**Files:** Create `src/import/importTypes.ts`, `src/import/fieldSchemas.ts`, `src/import/columnMapping.ts`; Test `tests/importSchema.test.ts`.

**Interfaces:**
- `fieldsFor(target: ImportTarget): readonly ImportFieldSchema[]`, where `ImportFieldSchema={key:string;label:string;labelBn?:string;required:boolean;aliases:readonly string[];example:string}`.
- `suggestColumnMapping(target:ImportTarget, headers:readonly string[]):{mapping:ColumnMapping;ambiguities:string[]}`.
- `mapImportRows(table:ImportTable,mapping:ColumnMapping):StagedImportRow[]`.

- [ ] **1.1 Write failing tests.** Assert `suggestColumnMapping('product',['পণ্যের নাম','SKU','Selling Price'])` maps `name,sku,sellingPrice`; duplicate `Name` columns produce an ambiguity, not a silent selection; mapping one source column to two fields is rejected; row 19 remains row 19 after ignoring empty rows.
- [ ] **1.2 Run `node --experimental-strip-types --test tests/importSchema.test.ts`.** Expected RED (missing exports).
- [ ] **1.3 Implement schema/mapper** with deterministic lowercase/whitespace/dash/Bangla alias normalization; reject missing required mappings, keep unmapped optionals null. Use table `sourceRow`, never reindex by array position.
- [ ] **1.4 Run same targeted test.** Expected PASS; also `npm test` (no legacy breakage).
- [ ] **1.5 Commit** `feat(import): define shared mapping contracts and bilingual schemas`.

### Task 2: Bounded and safe Excel/CSV file reader

**Files:** Create `src/import/safeXlsx.ts`, `src/import/fileReader.ts`; Modify `package.json` and `package-lock.json`; Test `tests/importFileReader.test.ts`.

**Interfaces:**
- `validateXlsxSafety(bytes:Uint8Array):void`: central-directory limits and worksheet formula rejection; no XLSX cell evaluation.
- `parseImportFile(file:File):Promise<ImportTable[]>`: returns sheet choices with original row numbers; caller chooses one.
- `parseImportCsv(text:string,fileName:string):ImportTable`: RFC 4180-like quoting, BOM, Bangla, embedded newlines; reuse or adapt `src/utils/partyImport.ts` CSV tokenization without weakening its existing tests.

- [ ] **2.1 Write failing tests.** CSV `"01712345678"` remains text; quoted `"Pipe, 20 ft"` and Bangla survive; `.xls`, `.xlsm`, oversized `.xlsx`, >5,000 nonempty rows, corrupted ZIP, suspicious inflated entry and `<f>` formula worksheet fail explicitly. A numeric Excel phone cell is distinguishable as `number` so the Party planner can flag missing leading zero.
- [ ] **2.2 Run `node --experimental-strip-types --test tests/importFileReader.test.ts`.** Expected RED.
- [ ] **2.3 Install vetted pinned dependencies, then implement.** Command: `npm install --save-exact read-excel-file@9.3.12 write-excel-file@4.1.1 fflate@0.8.2`; lazy-load XLSX reader from `read-excel-file/browser`. Preflight compressed/uncompressed ZIP metadata before decompression and inspect worksheet XML for formula cells; refuse unsafe inputs instead of trusting cached values. CI must use `npm ci`.
- [ ] **2.4 Rerun targeted tests, `npm test`, and `npm run build`.** Expected PASS. Confirm Excel read module is not eagerly part of the default POS route bundle.
- [ ] **2.5 Commit** `feat(import): read bounded CSV and XLSX safely with sheet selection`.

### Task 3: Downloadable Excel/CSV templates and error CSV

**Files:** Create `src/import/importTemplates.ts`; Test `tests/importTemplates.test.ts`.

**Interfaces:**
- `makeTemplateCsv(target:ImportTarget):string`.
- `makeTemplateXlsx(target:ImportTarget):Promise<Blob>` (writer internally using `write-excel-file/browser` 4.1.1).
- `makeImportErrorCsv(rows:readonly StagedImportRow[]):string`.
- `downloadImportBlob(blob:Blob,fileName:string):void` (browser-only utility, invoked by a real button).

- [ ] **3.1 Write failing tests.** Each target exports headers and one realistic example; product example `2 Box` with factor `10`, `1200 / Box`; Customer example phone string `017...` and Dr opening; Supplier example Cr opening; Bangla example labels; reject/report CSV values beginning with `=,+,-,@,tab,CR` by safe escaping; XLSX template reads back with same headers and *text* phone/SKU. Tests must use v4 writer API (`.toBlob()` or documented equivalent), not removed `fileName` return behavior.
- [ ] **3.2 Run `node --experimental-strip-types --test tests/importTemplates.test.ts`.** Expected RED.
- [ ] **3.3 Implement** header schemas and `write-excel-file/browser` 4.x method; CSV as BOM-prefixed UTF-8. Show actual downloads, not toast-only "exported".
- [ ] **3.4 Rerun tests and `npm run build`.** Expected PASS.
- [ ] **3.5 Commit** `feat(import): add real bilingual CSV and XLSX templates`.

### Task 4: Four-step wizard UI with a deliberately disabled commit

**Files:** Create `src/components/import/{ImportWizard,ImportUploadStep,ImportMappingStep,ImportReviewStep,ImportFinishStep}.tsx`; Create `scripts/import-wizard-browser.cjs`; Modify `src/pages/Products.tsx` (Import button and inert wizard only), `package.json`, `.github/workflows/ui-check.yml` (register `test:import-wizard`).

**Interfaces:**
- `ImportWizard({target,open,onClose,onApply}:{target:ImportTarget;open:boolean;onClose:()=>void;onApply?:(rows:StagedImportRow[],sessionId:string)=>Promise<ImportResult>})`. With no `onApply`, **Confirm is disabled**, visibly "Available once import integration is ready"; not a fake success.
- Upload owns `ImportTable[]` and selected sheet; mapping uses `suggestColumnMapping`; review owns decisions and staged edits. `ImportResultSummary` finish consumes `ImportResult`.

- [ ] **4.1 Write failing Playwright browser script.** Open dialog, upload real UTF-8 CSV; select another worksheet in multi-sheet XLSX; map a renamed column, fix an error, filter Ready/Errors, move Back and Next while preserving staged state; download CSV + XLSX; test Escape/cancel without changing preview; assert disabled Confirm if `onApply` missing; test narrow viewport and dark theme.
- [ ] **4.2 Run `node scripts/import-wizard-browser.cjs`.** Expected RED.
- [ ] **4.3 Implement** Product-page Import button and wizard state, step headings, accessible error alerts, issue counts, focus restoration and user-facing "UI preview only" disclosure. Reuse `Dialog`, `Input`, `AppSelect`, `AppDatePicker`, `Table` and status labels. Wire task 2 reader and task 3 templates. No domain persistence in Slice A.
- [ ] **4.4 Rerun browser script, `npm test`, `npm run build`, `npm run test:theme`.** Expected PASS.
- [ ] **4.5 Commit** `feat(import): build accessible shared four-step import wizard`.

**Slice A PR gate:** Real templates and file parsing; unambiguous mapping; responsive wizard; Confirm cannot execute until domain adapters exist; existing Party CSV path remains usable. Open `feat/shared-import-wizard` PR; CI green and visual review before Slice B.

---

## Slice B: Products and opening inventory

### Task 5: Product row planner and quantity/price rules

**Files:** Create `src/import/productImport.ts`; Test `tests/productImport.test.ts`.

**Interfaces:**
- `planProductImport(rows:readonly StagedImportRow[],existing:readonly Product[],existingLots:readonly StockLot[],options:{sessionId:string;today:string;baseRevision:number}):ProductImportPlan`.
- `ProductImportPlan={sessionId:string;baseRevision:number;creates:Array<{sourceRow:number;product:Product;openingLot?:StockLot;openingMovement?:StockMovement}>;updates:Array<{sourceRow:number;productId:string;patch:Partial<Pick<Product,'name'|'nameBn'|'category'|'brand'|'sellPrice'|'purchasePrice'|'minStock'|'active'>>}>;issues:ImportIssue[];skipped:number}`. Only new Stock products may carry an opening lot and movement; no update path accepts stock mutations.
- `ProductImportPlan` must **not contain** a stock lot for `update-master` rows.

- [ ] **5.1 Write failing tests.** `2 Box -> 20 Pcs`, `1200 / Box -> 120 / Pcs`, `1 Gauge = 16 Gira`, large-unit explicit selling price retained, default cost from purchase price shown, dated opening lot and movement agree, invalid factor (0, NaN), serial mismatch and expiry date fail, Service rejects nonzero stock.
- [ ] **5.2 Run `node --experimental-strip-types --test tests/productImport.test.ts`.** Expected RED.
- [ ] **5.3 Implement** deterministic base-unit normalization using existing `src/utils/productEntry.ts`; valid dates via `src/utils/dateRange.ts`, product validation aligned with `AddProductDialog`. Require explicit serials for Required mode, no silent rounding of impossible quantities.
- [ ] **5.4 Rerun targeted test and `npm test`.** Expected PASS.
- [ ] **5.5 Commit** `feat(import): plan product master data and opening lots`.

### Task 6: Product duplicate resolution and controlled master updates

**Files:** Modify `src/import/productImport.ts`, `src/import/importTypes.ts`; Test `tests/productImport.test.ts` (new cases).

**Interfaces:**
- `resolveProductDecisions(rows:readonly StagedImportRow[],existing:readonly Product[]):StagedImportRow[]`.
- Product plan accepts `create`, `update-master`, `skip`, `reject`. Allowed updates: `name,nameBn,category,brand,sellPrice,purchasePrice,minStock,active` only; no stock/lot mutation. Strong key: normalized SKU. Generated missing SKUs must be previewed and batch-unique before commit.

- [ ] **6.1 Write failing cases.** Same SKU twice in CSV -> second Duplicate/Skip; existing SKU -> Skip; explicit Update changes allowable price but preserves `stock,unit,altUnit,stockViewUnit` and zero new opening lots; strong SKU collision prevents "Create separately".
- [ ] **6.2 Run targeted test; confirm RED.**
- [ ] **6.3 Implement** deterministic SKU and batch match index, per-row decision validation, reasoned errors for illegal base-unit or lot alteration; taxonomy values are staged until confirmation.
- [ ] **6.4 Rerun focused suite; confirm PASS.**
- [ ] **6.5 Commit** `feat(import): guard duplicate SKU and safe product updates`.

### Task 7: Atomic Product/Lot/Movement preview commit

**Files:** Create `src/data/productImportPreviewStore.ts`; Modify `src/data/erpDemoStore.ts` and minimally `src/pages/Products.tsx`; Test `tests/productImportCommit.test.ts`.

**Interfaces:**
- `getProductImportPreviewSnapshot():ProductImportPreviewSnapshot` with `{revision,appliedSessionIds,products,lots,movements}` and a subscribe function.
- `commitProductImportPreview(plan:ProductImportPlan):ImportResult`, rechecking current SKU, session, dependencies and snapshot revision **before** updating a single observable snapshot.
- Refactor the affected Product Add/Import display seam to read coherent created products and opening lots/movements from the same preview snapshot. Existing purchase-derived lot quantities must not be added twice; preserve existing adjustments/offers.

- [ ] **7.1 Write failing tests.** Two valid products commit 2 products, 2 Opening lots and 2 Opening movements with correct quantities; invalid second product causes **zero** changes and unchanged snapshot identity/revision; replay session has no double posting; Product Update creates no Opening lot; product list/lot/history agree on quantity after switching page.
- [ ] **7.2 Run `node --experimental-strip-types --test tests/productImportCommit.test.ts`.** Expected RED.
- [ ] **7.3 Implement** staged clone/revalidate/commit + one subscriber notification; adapt existing product lookup projections, preserving source `Opening` and import row metadata. Do not write separately to inconsistent arrays.
- [ ] **7.4 Rerun focused test, `npm test` and `npm run build`.** Expected PASS.
- [ ] **7.5 Commit** `feat(import): atomically commit products and opening inventory in preview`.

### Task 8: Product page integration and browser acceptance

**Files:** Modify `src/pages/Products.tsx`, `src/components/import/ImportWizard.tsx`, `package.json`, `.github/workflows/ui-check.yml`; Create `scripts/product-import-browser.cjs` (register `test:import-products`).

**Interfaces:** Product UI supplies `onApply(rows,sessionId)` by planning with task 5/6 and committing task 7. In v1 `ImportResult` is authoritative for finish screen; never derive toast counts from uploaded rows.

- [ ] **8.1 Write failing browser flow.** Click `Import` beside Add Product; upload sample XLSX with `LED Light, 2 Box, factor 10`, review normalized `20 Pcs` and purchase rate `120/Pcs`, confirm, inspect Product list and Opening Stock lot/history, navigate away/back; import duplicate SKU -> Skip; product update -> no new lot; mobile cards have working actions.
- [ ] **8.2 Run `node scripts/product-import-browser.cjs`.** Expected RED.
- [ ] **8.3 Wire** existing Product-page Import wizard to task 5–7 validation and commit callback; preserve current Add Product/duplicate/adjust/lot workflows, and make review/finish reflect real amounts/quantities and saved preview state only.
- [ ] **8.4 Rerun browser, `npm test`, `npm run build`, `npm run test:purchases`, `npm run test:product-quick-add`, `npm run test:pos-reorder`.** Expected PASS.
- [ ] **8.5 Commit** `feat(import): enable Product Excel CSV import and opening stock flow`.

**Slice B PR gate:** Product import operates independently; one stock opening per new product; no double counting, invalid row, duplicate SKU or unit mismatch; light/dark/mobile tested. PR `feat/product-import-opening`.

---

## Slice C: Customers, Suppliers and independently audited opening balances

### Task 9: Party row planner, identity matching and opening direction

**Files:** Create `src/import/partyImport.ts`; Test `tests/partyImportPlan.test.ts`.

**Interfaces:**
- `planPartyImport(rows:readonly StagedImportRow[],target:'customer'|'supplier',existing:PartyPreviewState,options:{sessionId:string;today:string}):PartyImportPlan`.
- `PartyImportPlan={sessionId:string;baseRevision:number;changes:PartyImportChange[];issues:ImportIssue[];skipped:number}`.
- `PartyImportChange` union: `{action:'create';sourceRow:number;draft:PartyDraft;opening?:Omit<PartyOpeningPayload,'partyId'>}` or `{action:'add-role';sourceRow:number;partyId:string;role:'Customer'|'Supplier';opening?:Omit<PartyOpeningPayload,'partyId'>}`. No accidental full Party replacement.

- [ ] **9.1 Write failing tests.** CSV phone `01712345678` retained, numeric Excel `1712345678` flagged for literal correction; matches by explicit partyId strong, phone-only suggested (never automerge); imported Customer Dr `+500`, Supplier Cr `-750`, Supplier Dr advance; same person can have both independent roles; missing/invalid direction or opening date rejects; duplicate Party within one file has explicit decision.
- [ ] **9.2 Run `node --experimental-strip-types --test tests/partyImportPlan.test.ts`.** Expected RED.
- [ ] **9.3 Implement** normalization/duplicate hints and role-scoped opening proposal using `validatePartyDraft` and `validateOpening` rules. Strong same-ID conflict is not "Create separately"; fuzzy matching is a suggestion and needs explicit Add Role consent.
- [ ] **9.4 Rerun tests and `npm test`.** Expected PASS.
- [ ] **9.5 Commit** `feat(import): plan customer supplier identity roles and openings`.

### Task 10: One atomic audited Party batch command

**Files:** Modify `src/data/partyPreviewStore.ts`, `src/types/partyLedger.ts` only if audit fields require it; Test `tests/partyImportBatch.test.ts`.

**Interfaces:**
- Extend `PartyPreviewCommand`: `{type:'import-party-batch';plan:PartyImportPlan}`.
- Dispatch through **one call** `dispatchPartyPreview({type:'import-party-batch',plan})`; commit `PartyPreviewState` once, with `revision + 1` and one subscriber notification. Audit captures session id, sourceRow, affected Party/relationship and before/after for identity/role/opening records.
- Reuse `validateOpening` and settlement replay on staged source array before commit; existing opening source is a conflict and requires Skip/re-review. Explicit new Party IDs generated collision-free under one batch.

- [ ] **10.1 Write failing tests.** Create two Parties with independent Dr/Cr opens, one `revision+1` and one notification; linked customer refund credit is zero for unverified opening; no account cash posting; missing Party, duplicate session, stale snapshot and existing same-role opening fail atomically; later bad source causes zero state writes/audit append.
- [ ] **10.2 Run `node --experimental-strip-types --test tests/partyImportBatch.test.ts`.** Expected RED.
- [ ] **10.3 Implement** copy/revalidate/apply once; add source row/session audit metadata. Preserve existing single Party Edit/Open/Payment/Finance actions and legacy `import-parties` compatibility.
- [ ] **10.4 Rerun focused tests plus `npm test`, `npm run build`, `npm run test:party-opening`, `npm run test:party-settlement`.** Expected PASS.
- [ ] **10.5 Commit** `feat(import): atomically create role-specific Parties and opening sources`.

### Task 11: Party UI integration and per-row identity decisions

**Files:** Modify `src/pages/Parties.tsx`, `src/components/parties/PartyImportDialog.tsx`, `src/components/import/ImportWizard.tsx`, `package.json`, `.github/workflows/ui-check.yml`; Create `scripts/party-import-browser.cjs` (register `test:import-parties`).

**Interfaces:** `Parties.tsx` supplies the wizard target based on selected `Customer` or `Supplier` role; when filter `All`, prompt one explicit choice, then call task 9 planner and task 10 commit.

- [ ] **11.1 Write failing browser flow.** Import Customer XLSX with phone `017...`, `Dr 500`, open Party ledger and confirm Opening source; reimport same phone -> suggestion/Skip, not merge; import existing Customer as Supplier with explicit `Add Role` -> supplier `Cr 750` independent; existing balance never overwritten; malformed date/row yields downloadable CSV report. Regression: old CSV Party workflow still works through new screen.
- [ ] **11.2 Run `node scripts/party-import-browser.cjs`.** Expected RED.
- [ ] **11.3 Wire** entry selector, mapping, explicit duplicate/role decisions, opening date/direction editor and result screen. Reuse live Party preview ledger projection and statement; display `UI preview only`.
- [ ] **11.4 Rerun browser and `npm run test:parties`, `npm run test:party-ledger`, `npm run test:party-opening`, `npm run test:party-settlement`, `npm test`.** Expected PASS.
- [ ] **11.5 Commit** `feat(import): connect customer supplier Excel CSV import to Party ledger`.

### Task 12: Full UX safety, dark/light, error reports and end-to-end gate

**Files:** Modify `src/components/import/{ImportWizard,ImportReviewStep,ImportFinishStep}.tsx`, `src/import/importTemplates.ts`, `scripts/import-wizard-browser.cjs`, `scripts/party-import-browser.cjs`, `scripts/product-import-browser.cjs`, `.github/workflows/ui-check.yml` as needed.

**Interfaces:** Existing public functions only; no new domain subsystem. `ImportResult` is the sole finish-state source, `makeImportErrorCsv` is the sole rejected-row export.

- [ ] **12.1 Add failing browser cases.** Imported counts survive return to view, Cancel/Back never post; filtered Ready/Duplicate/Error/Skipped labels use color **plus words**; long Bangla error does not overflow mobile; keyboard tab/focus restores on close; wrong/corrupted files show useful alerts; dark selects/date pickers contrast; CSV error report escapes `=HYPERLINK(...)`; no duplicate session commits on double-click.
- [ ] **12.2 Run `node scripts/import-wizard-browser.cjs` and targeted domain scripts.** Expected RED for remaining gaps.
- [ ] **12.3 Make minimum changes** to satisfy accessibility and error-report behavior; disable Submit during commit, preserve review state on apply error, and clear session on Import Another.
- [ ] **12.4 Run full acceptance commands:** `npm ci`, `npm test`, `npm run build`, `npm run test:parties`, `npm run test:party-ledger`, `npm run test:party-opening`, `npm run test:party-settlement`, `npm run test:product-quick-add`, `npm run test:purchases`, `npm run test:pos-reorder`, `npm run test:theme`, `npm run test:themed-filters`, `npm run test:saas`, `npm run test:settings`, and `npm run test:import-wizard`, `npm run test:import-products` and `npm run test:import-parties` (register these exact script names as part of Tasks 4/8/11). Expected every command PASS.
- [ ] **12.5 Commit** `test(import): complete bilingual responsive import acceptance gates`.

**Slice C PR gate:** All previous UI tests green; no unverified refundable Party credit, silent Party merge, overwritten ledger opening, or duplicate Product stock. PR `feat/party-import-openings`; final visual review **before any merge or Cloudflare deploy**.

## Execution sequence and review handoffs

1. Spec PR #34 should be approved/merged before touching code so implementation and review always cite the canonical document on `main`.
2. **Slice A:** Tasks 1–4 -> unit/build/browser gate -> PR #A -> visual review; merge only on user's request.
3. **Slice B:** Tasks 5–8 -> Product opening stock gate -> PR #B -> visual review; merge only on user's request. Rebase from Slice A merge or use stacked branch if pending.
4. **Slice C:** Tasks 9–12 -> Party balances and full regression gate -> PR #C -> visual review; merge only on user's request.
5. **Native execution is preselected**. After user reviews this plan, use the Superpowers `executing-plans` workflow task-by-task in the GitHub UI repo, not subagent-driven execution.
6. Production HisabIQ backend integration, multi-tenant transaction posting and server-side migration jobs are separate future work, not represented as implemented by these UI preview commits.

## Final acceptance checklist

- [ ] Import both real `.xlsx` and UTF-8 `.csv`; choose sheet; template download works.
- [ ] Import product `2 Box` with factor `10`, and price `৳1200/Box`; view `20 Pcs` and `৳120/Pcs` and exactly one Opening lot/movement.
- [ ] Import Customer Dr and Supplier Cr for same Party without netting balances or creating cash payments.
- [ ] Duplicate SKU/phone, existing opening, invalid serial, formula cell, truncated phone and overlarge ZIP fail safely with actionable errors.
- [ ] No partial preview writes, no repeated import session, no stock double count, no fake Export/Import success.
- [ ] Full CI passes; keyboard/mobile/Bangla/dark/light verified; no production backend/deployment claim.

**Status:** Implementation plan awaiting user review. No app code is changed by writing this plan.
