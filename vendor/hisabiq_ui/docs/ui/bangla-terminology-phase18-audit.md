# Phase 18 — ERP-wide Bangla coverage audit and release gates

Baseline: Phase 17 PR #107 merged at `f157229cbac840be7346ab151fdae3b223290da3`.

## Goal
Finish language coverage systematically without changing transaction values, financial posting, shared cart behavior, or existing Magic Patterns visual components.

## Audit scope and order
1. Inventory every routed ERP screen from `src/App.tsx`: Dashboard, POS, Counter, Sales, Quotations, Online Sales, Notifications, Warranty, Reconciliation, Finance, Daybook, Accounts, Audit Ledger, Products, Parties, Purchases, Purchase Editor, Vendors, Expenses, Reports, Business Settings, Subscription and Support.
2. For each page inspect headings, tables, filters, search placeholders, validation errors, empty states, confirmation dialogs, menus, toast messages, accessibility names, mobile overflow and print/export previews.
3. Check shared components separately: navigation, forms, product search, compound quantities, payment rows, print components, overlays, date controls and alerts. Do not duplicate local labels when a shared translation exists.
4. Run English, English + Bangla and Bangla modes at 390px mobile, 768px tablet and 1440px desktop; include keyboard, touch and dark/light.
5. Prioritize user-visible untranslated strings by frequency and risk: **P0** financial action/confirmation errors; **P1** routine forms/tables; **P2** rare settings and help copy.

## Acceptance matrix
| Area | English | Bilingual | Bangla | Mobile/tablet | Print/export | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Core selling (POS/Counter/Sales) | Audit | Audit | Audit | Audit | Audit | Preserve source amounts |
| Purchasing/Vendors | Audit | Audit | Audit | Audit | Audit | Preserve lot/vendor prices |
| Finance/Accounts/Daybook/Audit | Audit | Audit | Audit | Audit | Audit | Preserve debit/credit direction |
| Products/Inventory/Settings | Audit | Audit | Audit | Audit | Audit | Preserve units and conversions |
| Parties/Expenses/Reports | Audit | Audit | Audit | Audit | Audit | Preserve ledger balances |
| Online/Quotation/Warranty/Notifications | Audit | Audit | Audit | Audit | Audit | Preserve customer-entered values |
| Platform subscription/support | Audit | Audit | Audit | Audit | Audit | Separate SaaS and ERP terminology |

## Implementation rules
- Use existing `useUiCopy`, `uiText`, shared glossary and current shadcn-style components. In bilingual mode English remains the primary label with contextual Bangla helper.
- Translate display copy only; never translate persisted status/reason IDs, invoice references, user-entered fields, payment methods, enum values, calculation inputs, CSV machine headers or audit data.
- Preserve POS V2/shared cart, print source and existing workflows. No fake posting or success messages.
- Record each confirmed untranslated string with file, user-facing surface, priority and proposed Bangla wording before changing it.
- Add focused regression tests for each corrected module and keep full UI, accessibility, responsive and theme CI green.

## Known follow-up from Phase 17
- Sales template Edit currently shows an informational toast rather than an actual editor; track as a functional workflow defect, not a translation-only fix.

## Completion gate
Do not declare localization complete based on this checklist alone. Attach a measured census, screenshots/Playwright evidence, per-module completion status, remaining defects and green CI. Split implementation into small reviewable PRs.
