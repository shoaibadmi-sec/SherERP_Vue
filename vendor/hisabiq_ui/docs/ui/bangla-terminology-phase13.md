# HisabIQ Bangla Phase 13 — Online Sales fulfillment print documents

## Objective
Show the existing **Order confirmation**, **Packing list** and **Delivery challan** print bodies in the tenant's selected interface language. Preserve the existing Magic Patterns visual system, compact table, print path and source records.

## Scope
- `FulfillmentDocumentPreview` is the **same existing** document component. No second print implementation, cart, order store or delivery workflow.
- `useUiCopy` reads the current `personal.language` preference (English / English + Bangla / Bangla). `fulfillmentLabel` only maps visible strings; English + Bangla keeps English primary with the existing small Bangla helper where appropriate.
- Headers, product/quantity/price columns, destination, courier and tracking labels, amount summary and disclaimer are translated. Packing and delivery forms retain signature lines.
- The output retains raw order identifier, customer and phone/address, products, unit values, channel and provider names, tracking ID, source dates, delivery date placeholders, monetary values and line order.
- Stored `OrderStage` remains untouched even when its **printed label** is Bangla.
- Order confirmation retains totals; packing list and delivery challan never show the money columns. All forms state they are previews, not stock/cash/bank/SMS/courier posting, and are **not** a sales invoice.
- Existing `printFulfillment`, `#fulfillment-print-document` and scoped A4 `fulfillmentPrintCss` are reused unchanged.

## Acceptance criteria
- `npm test`: `banglaPhase13FulfillmentContract.test.ts` verifies display strings, source-store/amount invariants, distinct document types and print boundaries.
- `npm run test:bangla-fulfillment`: 3 languages × 390/1440px × 3 types; asserts document title/labels/customer/source identifiers, quantity, exact total, no money columns in packing/challan, per-document notices, print media/A4 and no page errors/overflow.
- Existing `npm run test:fulfillment-sms`, `npm run test:online-sales`, `npm run test:quotations`, `npm run test:bangla-quotations` and `npm run check:ui-contract` must pass.
- CI: strict TypeScript, lint, all Node contracts, production build, UI Check, responsive light/dark checks. Test paper print by hand, on 390px screen, tablet, and 1440px desktop. Do not call this production certified.
- No PR merge until checks pass and the user approves.

## Dependency and integration
Created independently from verified `main` at `2d855a2`, as previously opened PRs #100 (Vendor), #101 (Warranty) and #102 (Online Sales) had not merged when this phase began. This phase changes **only** the existing fulfillment document component, one new i18n dictionary, the language print tests, package script and CI workflow. If #102 lands first, resolve the narrow package/workflow overlap on rebase; no application code overlap is intended.

## Deferred
Real courier/waybill integration, durable order posting, finance/stock mutation, collection/reconciliation, genuine sales invoice generation, custom templates, and any changes to customer-provided information.
