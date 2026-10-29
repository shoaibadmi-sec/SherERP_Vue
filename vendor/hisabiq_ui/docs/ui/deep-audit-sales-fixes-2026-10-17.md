# Sales audit fixes — 17 October 2026

Scope: the five Sales findings from this audit, plus selected-return page overflow and passive touch-toast interception discovered while verifying the fixes. Baseline source matched fetched `origin/main` (`8516a0baa0f6af3416f0418455ce995269d718b8`). Existing bundle return preview behavior is retained. No backend posting or complete ERP certification is claimed.

## Findings and resulting behavior

| Finding | Result | Regression evidence |
| --- | --- | --- |
| Ordinary return limit never consumed | Store source invoice/line IDs, quantity, refund allocation and serials on each preview return. The remaining balance decreases and survives navigation within the preview session. Reject cumulative over-return. | `salesReturn.test.ts`; browser exhausts 220 Kg and refuses an additional 1 Kg, including after leaving Sales. |
| Editable, unrestricted refund rate | Historical net allocation determines refunds in integer paisa, including the remainder across partial returns. Rate is read-only. Exact sold base quantity is retained for compound sources; current product prices and unit factors never determine a historical refund. | Tests cover the 42 Pcs line with a historical total of ৳910, partial-cent allocation, malformed quantities, missing allocation and source mismatch. |
| Template Edit only showed a toast | A contextual dialog edits name, customer and product cart; Save changes the actual shared template. Cancel discards only child edits. | Browser edits, cancels, reopens, saves and verifies compound quantities. |
| Created/copied templates unavailable in POS | Sales and POS read the same session preview template records. Creation, edits, duplication and deletion use that record; POS loads the saved lines by ID. | Unit store lifecycle and browser create → edit → duplicate → use in POS → back → delete. |
| Return-history Customer ledger dropped identity | Resolve the original customer ID from the return or its source invoice; use a legacy name only if unambiguous. Open the Customer role. Disable the action with a reason for unlinked walk-ins. | Identity/ambiguity unit coverage and actual return-menu navigation to customer `c1`. |
| Passive notifications blocked table actions at 320px | Extend the existing passive-toast pointer rule to coarse-pointer screens. Notifications with controls remain interactive; desktop swipe dismissal is retained. | Real touch through queued template toasts, an actual Sonner action-button test, and the previous six 360px Finance transfer/validation-toast journeys. |
| Selected-return table widened the mobile page | Give the return grid a bounded single-column track and children that can shrink. The existing table wrapper owns horizontal scrolling. | Filled/exhausted-return overflow assertion at every tested viewport. |

The previous report's example of returning 1 Kg twice was incomplete: separate partial returns are valid while enough quantity remains. The regression demonstrates the actual defect by exhausting the original balance and then attempting to exceed it.

## Components and state

- Reuse `CartTable`, `ProductCombobox`, `CompoundQuantityInput`, `CustomerPicker`, `usePosCart`, shared Dialog/Input/Button and current design tokens. No second product cart or picker was introduced.
- Extract the existing POS preset-to-cart adapter into `salePresets.ts` and reuse it in both editors. Validate planned template quantities/units/prices without taking payments or requiring stock fulfillment.
- `salesPreviewStore.ts` is one in-memory preview snapshot for this browser session, consistent with the existing preview-store pattern. It does not persist to a server, change stock, write Party ledgers or post cash. Reload resets preview data; navigation does not.
- Preserve template customer IDs and recipe revision/signature. Saved templates do not reserve serials, stock allocations or payment sources.
- Source-only concerns about duplicate-name customer payment allocation remain outside these five reproduced findings; this change does not certify those separate workflows.

## Safety limits

Historical discounted/rounded sales require a recorded net line allocation. Legacy prior returns require structured quantity/refund/serial evidence. If that evidence is absent, completion is disabled with an explanation. The UI does not infer historical allocations from today's product master. Existing bundle/mixed returns remain preview-only and do not enter the ordinary return mutator.

## Verification

Baseline full unit suite: 133 files passed before edits.

Final local results:

- `npm test` — 135 test files passed, zero failures.
- `npx tsc --noEmit` — passed.
- `npm run lint` — zero errors; 199 existing warnings remain.
- `npm run check:ui-contract` — passed.
- `npm run build` — passed; existing large-chunk advisory remains.
- `PLAYWRIGHT_EXECUTABLE_PATH=/usr/bin/chromium npm run test:sales-audit` — 48 complete interaction journeys passed; 96 axe scans, zero violations; zero page-overflow failures.
- Existing Sales language script — 6/6 journeys passed, including CSV generation and stored reason/settlement values.
- Existing bundle return script — phone/tablet previews passed with no stock/refund/credit mutation.
- Existing POS reorder script — keyboard/drag reorder, total invariance and receipt order passed.
- Existing Finance transfer/validation-toast script — 6/6 journeys passed at 360px, across all language/theme combinations.
- Visually inspected 320px dark Bangla filled-template and invalid-return screenshots.

Existing browser scripts were run from scratch copies that only adapt the Vite import, free port, system Chromium path and external-font/load bootstrap for this environment. The new checked-in Sales script runs directly through `npm run test:sales-audit`. No GitHub workflow was used as testing evidence.

The Sales browser matrix uses English, English + Bangla and Bangla; light/dark; 320×700, 360×800, 390×844, 430×932, 768×1024, 1024×768, 1280×800 and 1440×900. It uses actual touch/pointer/keyboard actions, semantic waits and axe scans of the filled template dialog and exhausted return view. No forced clicks or arbitrary sleeps. External font requests are blocked for deterministic local tests; downloaded-font rendering, real software keyboards, manual screen readers and backend integration remain unverified.
