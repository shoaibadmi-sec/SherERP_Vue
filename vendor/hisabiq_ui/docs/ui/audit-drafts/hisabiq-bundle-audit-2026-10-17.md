# HisabIQ bundle audit — 2026-10-17

**Status:** Audit finished. Read-only review; no source files changed.

## Scope and method

Reviewed merged bundle work from PRs #149, #150, and #153 on `main` (`8516a0baa0f6af3416f0418455ce995269d718b8`), against base `7c2239a5568429ccaa0f6cbc0d19c2c4f60ad2ce`. The standards review checked `AGENTS.md`, the transaction cart contract, and the ERP workflow contract. The spec review used the PR descriptions. A Playwright repro ran at 390×844 using the actual Sales Return page and a fixture with missing historical net allocation.

The audit confirmed that bundle checkout and return flows remain explicitly preview-only. It found no confirmed hard breach of the documented component reuse and posting-safety standards.

## Verified finding

### P2 — Missing historical bundle price blocks the return preview

The return planner correctly returns a `null` refund estimate and an issue when a discounted invoice has no saved net parent-line allocation (`src/bundles/bundleReturn.ts:63`). The Sales Return page displays “Pending historical price,” but `completeReturn` checks `returnAmount <= 0` before it checks `includesBundleReturn` and opens the preview (`src/pages/Sales.tsx:908`). Since a null bundle estimate contributes zero to `returnAmount`, the user gets blocked and cannot see the planner’s explanation in the preview.

**Playwright reproduction:** removed `netSaleTotal` from the fictional discounted bundle invoice, selected it, entered one whole Set, and clicked “Preview return only.” The page displayed “Pending historical price”; the bundle preview dialog count stayed `0`.

**Suggested fix for implementation:** let a selected positive whole-Set bundle return open its preview even when its refund estimate is pending or zero. Keep settlement and posting disabled; show the historical allocation issue in the preview. Add a browser regression for the missing-allocation path.

## Reviewed limitation, not counted as a defect

`createBundleSaleSnapshot` captures the selected recipe and quantities, but not the per-component serial, source, lot, or cost decisions from the POS preview (`src/bundles/bundleDocuments.ts:16`). Current POS checkout explicitly produces a “Sale preview · Not posted,” and the audited phase defers real posting. Those source fields therefore need to be added by the future authenticated posting path before actual bundle returns or realized COGS can rely on them. The UI must continue to treat missing history as unavailable rather than inventing it.

## Recommendation

Fix the verified preview gate before treating the bundle return preview as complete. No code changes were made in this audit; implementation is left for the next model as requested.
