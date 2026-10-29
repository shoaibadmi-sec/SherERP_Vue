# Vendor as a Top-Level Module; Consistent Party Profiles
**Superpowers architecture/design specification · 2026-10-10 · revised per owner feedback · awaiting written approval**

## 1. User's clarified decision

**Vendor is a TOP-LEVEL ERP module**, alongside POS, Sales and Purchases, not a subsection beneath Parties. Every Vendor operation belongs to the top-level **Vendor** workspace. **Parties** remains a general directory and profile/ledger area where a Vendor behaves like Customer, Supplier, Lender, Borrower, Owner or Payee: same profile layout, same base five profile tabs, same search, date filters and standard record actions.

This revises the earlier proposal to put the Vendor's five operational tabs inside their Party profile. That former proposal is **superseded**. The already-approved *Vendor work* tabs and simple-English/Bangla language standard remain.

The intent is to make a shopkeeper understand two separate concepts:
- **Party** answers: "Who is this person or business, what do we owe each other, and what happened with them?"
- **Vendor** answers: "What work do I need to do with goods taken or given to other shops, and how do I finish it?"

The same Party identity and underlying transactions appear from both modules. No second Vendor identity, copied payments, duplicate ledger or parallel implementations.

## 2. Main sidebar and routes

Top-level navigation order near commercial workflows:

```text
Dashboard
POS / New Sale
Sales
Purchases
Vendor          ← NEW top-level module, directly in main sidebar
Products & Stock
Parties & Ledger
Expenses
Finance & Accounts
...
```

- Route: **`/app/vendors`** for the Vendor module. Root opens its own Vendor selector/list first, like Purchase list/management.
- Optional deep link: **`/app/vendors?partyId=<canonical-party-id>&tab=taken|given|purchases|payments|ledger`**. A Party link may open a filtered Vendor workspace but the destination stays the top-level Vendor module.
- Implement registration in `src/App.tsx`; register the leaf in `src/navigation/erpNavigation.ts`, `erpRoutePaths` and the shared desktop/mobile `ErpNavMenu`. Preserve existing commercial routes, nav checks, permissions and active-state handling.
- Keep **Vendors** within the Parties directory role filter as a *contact-category filter*, because other roles retain their own category entries. That child link opens `/app/parties?role=Vendor`, **not** the operational Vendor module. Distinguish these in clear labels: **Vendor** (operational module) vs **Vendors** (people directory under Parties). Do not show a second full Vendor menu inside Parties.
- Top-level sidebar entry must be a single visible item (no extra nested five tabs in sidebar). In-page tabs own the five workflows.

## 3. Top-level Vendor workflow, inspired by Purchases

### 3A. When no Vendor selected
- Top-level **Vendor** page shows compact **Choose Vendor · ভেন্ডর বাছুন** searchable combobox with clear selection and **+ Add Vendor · নতুন ভেন্ডর** in the same module. Quick Add attaches Vendor role to an existing canonical Party where appropriate; never silently creates a duplicate person.
- Show lightweight Vendor directory/list (name, phone, **You owe**, **Vendor owes**, **Price not set** count) and a useful search. Selecting one opens the five-tab workspace **within the same page**, not a huge dialog. Exclude unrelated roles; one Party can hold both Vendor and Supplier roles.
- Optional filter **Needs price** helps find work requiring attention. No dashboard full of metric cards needed for V1.
- Preserve selected Vendor in query state for reload/back navigation; reset per-Vendor record edits on Vendor change, with an unsaved draft warning.

### 3B. When Vendor selected
- Compact top header: back to Vendors, Vendor name (+ Bangla name), phone, area, Edit Party/profile link.
- Compact summary row, keeping **four separate amounts/quantities**, never netting them: **You owe (Taken)**, **Price not set (quantity/count)**, **Vendor owes (Given)**, **Purchase due**. Summary links may open the corresponding filtered tab. If price unknown, show "Price not set", not ৳0. No monospaced digits.
- Five **horizontal underline** tabs (the Party reference screenshot's style), one contextual primary action per tab. Use shadcn-style line tabs and theme tokens. No eight-button toolbar, no separate permanent opening-balance row, no row with five competing actions:
  1. **Ledger · হিসাব**
  2. **Taken · নেওয়া পণ্য**
  3. **Given · দেওয়া পণ্য**
  4. **Purchases · কেনাকাটা**
  5. **Payments · টাকা লেনদেন**
- Default after picking a Vendor: **Taken** if there are records whose price needs to be set; otherwise **Ledger**. Deep-link tab wins over defaults. This behavior may be simplified to Ledger for V1 if predictable tab persistence is more valuable; decide in implementation plan, never change randomly.

### 3C. Work per tab

| Tab | Primary button | What happens without leaving Vendor |
|---|---|---|
| **Ledger · হিসাব** | **Print Ledger · হিসাব প্রিন্ট** | Combined chronological Vendor activity with date-range, search and export; item links, color + explicit “Money in”/“Money out” labels, source-linked corrections and cancellation history. Unknown-price source appears as “Price not set”, not a made-up cash amount. Each balance type remains explicitly named. |
| **Taken · নেওয়া পণ্য** | **Take Products · পণ্য নিন** | Record goods taken from another shop (manual or POS-linked), POS-like multi-product editor, quantity with compound units, optional price, reference/date, list of outstanding sources. Per-row **Set Price · দাম ঠিক করুন**, **Pay Money · টাকা দিন**, **Return Products · পণ্য ফেরত দিন**, **Clear Due · বাকি মেটান**, details and guarded corrections. Prices can be set and dues cleared **at any time**. |
| **Given · দেওয়া পণ্য** | **Give Products · পণ্য দিন** | Use common POS-style multi-product cart to give owned products to a Vendor, agreed prices, stock checks, memo/date. After giving: **Receive Money · টাকা নিন** or **Get Products Back · পণ্য ফেরত নিন**, partial receipts and source audit. Vendor owes merchant; no normal customer Sale is silently created. |
| **Purchases · কেনাকাটা** | **Buy Products · পণ্য কিনুন** | Reuse the **existing PurchaseEditor** full-width with selected Vendor prefilled. Standard owned-stock purchase, invoice, supplier memo, discount, unit switching, Quick Add, Cash/Bank/MFS split payments, outstanding Purchase due. List, print, view, correct, purchase return/refund must use the same existing Purchase route/logic; any incomplete operation clearly flagged for later verified work. **Never embed PurchaseEditor in the oversized VendorPurchaseDialog.** |
| **Payments · টাকা লেনদেন** | **Record Payment · টাকা লেনদেন যোগ করুন** | Choose money given/received, link to **Taken/Given/Purchase** source or invoice and correct balance direction, payment accounts and splits, history with date/filter, correction/audited cancellation. Contextual **Pay** links from other tabs may preselect this tab + source; return to originating tab after recording. |

Only one large editor visible at a time; product cart input on top, compact list or table below or switchable "New / History" area inside tab as needed. A modal may be used for small confirmations, previews or destructive corrections, **not full Purchase/Given/Take editors**.

## 4. Parties: same visual profile, Vendor-appropriate information and actions

The user's **Supplier Party profile screenshot (2026-10-10)** is the **visual and interaction reference** for **every Party role**, including Vendor. The Vendor Party profile must **look like that Supplier screenshot**, not like a second mini-Vendor dashboard. Use the same:
- Avatar, name with Bangla, phone, place, roles, Edit Party control and compact balance header
- One modest horizontal quick-action toolbar below the header (no button wall)
- **Ledger | Invoices | Payments | Notes | Attachments** in the same position and same active underline/badge style
- Date-range picker, transaction filter, search, page size, clear filters and Print Statement
- Opening balance / period debit / period credit summary row
- Compact ledger with **Date | Particulars | Debit | Credit | Running | Actions**, badges, short descriptions and row “…” menu; keyboard/touch/print layout identical to Supplier

**Structural requirement:** `src/pages/Parties.tsx` currently special-cases `relationship==='Vendor'` to render `VendorWorkspace`, instead of the standard `PartyDetail`. Remove this special case when implementing. All roles render **`PartyDetail` or one shared composition based on it**. Do NOT relocate the five operational Vendor tabs into Party. The Vendor module remains a **top-level** `/app/vendors` page for complete work.

### 4A. Vendor Party quick actions in this shared profile

The profile must be useful without becoming a second working module:

| Same position as Supplier screenshot | Vendor-specific behavior |
|---|---|
| Primary **Pay Vendor · টাকা দিন** | Records a payment **against a chosen outstanding Taken source**, never a generic unlabeled balance. Prefer the existing small Party-style payment dialog backed by the **same Vendor settlement command/service** as `/app/vendors`. Allow split accounts where shared controls already support them. Must not create an independent Party-only transaction. |
| Secondary **Receive Money · টাকা নিন** | Records money received **against a chosen Given memo/amount owed by Vendor**. Same shared Vendor payment operation and exact source reference. Display only if applicable; otherwise offer a clear empty state through Payments tab, not a fake success. |
| **Opening Balance · শুরুর হিসাব** | One compact action with an explicit choice **You owe** vs **Vendor owes**, supports dated opening/edit where permitted. Reuse the existing Vendor opening commands and audit rules. Ordinary Purchase opening belongs under Supplier relationship, not Vendor source payable. |
| **Open Vendor Work · ভেন্ডরের কাজ** | Navigates to `/app/vendors?partyId=<canonical-id>` with Vendor preselected. This is the entry to Take Products, Give Products, set prices, return goods, partial/mixed clear due and other full Vendor work. |
| **Add Note · নোট লিখুন** | Opens the same Notes tab/editor as any Party; attachments likewise stay in the common Party UI. |

Do **not** display irrelevant **Refund Credit**, **New Invoice**, or **Send Statement** buttons as disabled clutter. Where a genuinely supported action exists, offer it in the same compact placement or related tab. **Print Statement** remains in the Ledger filter bar, just like the screenshot. Infrequent corrections/cancellations belong under the row **…** menu with required reason and source review; keep source-linked audit history.

**Quick actions do not duplicate implementation.** If direct Pay Vendor / Receive Money in the Party profile cannot use the same validated Vendor money command or cannot target an exact source, do **not** fake a posting. Provide a link to the **Payments** tab of the top-level Vendor module prefilled with the correct Vendor, direction and source until shared action support is verified. The user should not need to reselect the Vendor.

### 4B. Vendor ledger and document tabs — same visuals, different data

- **Ledger:** display **real Vendor taken/given source and settlement events**, along with their canonical references. Preserve both payable and receivable sides without **netting**. Because the screenshot has only one **Running** column, a Vendor ledger must offer a simple **Taken (You owe)** / **Given (Vendor owes)** balance filter with the proper running balance **for that side**. If **All activity** shows both sides, do not show a fabricated combined running number; use `—` or a clearly labeled per-side balance. Display **Price not set** for unpriced sources without pretending its monetary value is ৳0. Debit/Credit are always shown with a short **Money paid / Money received / Amount owed increased** description matching the selected account; color supplements the words, never replaces them. Period summaries and print/export are scoped to the chosen side or separately categorized.
- **Header balance:** preserve the same top-right balance-card visual language shown in the screenshot. Unlike Supplier's single balance, a Vendor can have **You owe** and **Vendor owes** simultaneously; show them as **two separate compact figures** (stacked or side by side depending on width), with a small **Price not set** indicator as needed. Do not display a misleading net figure or invent an amount for unpriced goods. Ordinary **Purchase due** is shown in the Vendor full module's fourth summary and in the relevant Supplier relationship, never silently mixed into these two figures.
- **Invoices/Bills:** retain the tab slot and layout from the shared profile, but present the actual document kind. For Vendor relationship, label the tab **Bills & Memos · বিল ও মেমো** if there are Taken/Given memos; include references to linked POS sales and ordinary Purchase bills only where the relationship and record type truly applies. **Do not call a Given memo a sales invoice**. Counts, viewing and print links come from the original records.
- **Payments:** same compact Payments tab as Customer/Supplier, with Vendor-specific **Money paid / Money received** descriptions, linked source/memo, date, account, amount and action menu. No duplicate ledger entries or cloned payment records; cancellations use the Vendor audited reversal command.
- **Notes and Attachments:** **identical** UI and behavior for Vendor, Supplier, Customer, Lender, Borrower etc. Preserve profile identity and relationships when switching role.
- An inactive Vendor remains visible in history; block new money/stock movement with a clear reason.

**Single source of truth:** Current `partyPreviewStore` and `vendorPreviewStore` contain different demo projections. Adapt the Vendor events into the **standard Party ledger/invoice/payment selectors** keyed by canonical Party ID + source ID. Do not copy the Vendor transactions into Party store or double count ordinary Purchases. One Party may be both Vendor and Supplier; the role switch must show the appropriate financial side without losing other roles' history. The same event must appear and reconcile consistently in both the Party profile and top-level Vendor workspace.

## 5. Reuse architecture, not cloned pages

```text
                         Canonical Party identity
                                  │
                  ┌───────────────┴────────────────┐
                  │                                │
     /app/vendors (work module)             /app/parties (profile)
       Vendor chooser/list                     PartyDirectory
       Five operational tabs                   PartyDetail for ALL roles
       Inline carts/payments                   Ledger/Invoices/Payments/Notes/Files
                  │                                │
                  └───────────────┬────────────────┘
                                  │
                         Shared read-only projections
                                  │
             Existing Vendor source + Purchase + Party ledgers
```

- Route page e.g. `src/pages/Vendors.tsx` manages selector, tabs and compact summaries.
- Reuse existing `src/vendor/vendorModel.ts`, `vendorPreviewStore.ts`, `vendorCorrection.ts`, `vendorActivity.ts`; business commands stay independent of which page starts them.
- Use existing `PurchaseEditor embedded initialSupplierId onCompleted` in **Vendor Purchases**. No duplicated purchase posting. Purchase returns/refunds should call the same workflow as `/app/purchases`, not a Vendor-specific imitation.
- Reuse the common POS/Purchase **product picker/cart row and CompoundQuantityInput** for Given/Taken. Reuse cart **UI and keyboard/touch behavior**, not POS sale posting, Purchase posting or a copied domain reducer for source movements.
- Use one shared split-payment component; a payment linked to Vendor borrowing affects the Vendor source payable, one linked to a normal Purchase affects the ordinary Supplier payable, and a receipt for Given affects Vendor receivable.
- Keep all dependent monetary and stock corrections auditable and idempotent. If **Clear Due** mixes payment with returning goods, validate and commit both as **one all-or-nothing transaction**, or mark that combination unavailable until implemented; never perform half the operation and claim full completion.
- No true consignment in V1. UI remains demo-only until the separate NestJS backend is integrated and tested with tenant isolation.

## 6. Simple English + Bangla helper; no time-based settlement

| Avoid | Use |
|---|---|
| Evening settlement, account settlement | **Clear Due · বাকি মেটান** |
| Sourcing, borrowed stock, source event | **Taken Products · নেওয়া পণ্য** |
| Goods issue memo | **Give Products · পণ্য দিন** |
| Confirm Vendor source price | **Set Price · দাম ঠিক করুন** |
| Price pending / unpriced | **Price not set · দাম ঠিক হয়নি** |
| Known payable | **You owe · আপনার দেনা** (Taken context) |
| Receivable | **Vendor owes · পাওনা** (Given context) |
| Ordinary purchase payable | **Purchase due · কেনাকাটার বাকি** |
| Reversal | **Cancel Entry · এন্ট্রি বাতিল** with “A record of this change will be kept” |
| Balance allocation | **Which bill? · কোন বিলের টাকা?** |
| Issue goods | **Give Products · পণ্য দিন** |
| Supplier Purchase | **Buy Products · পণ্য কিনুন** |

Translate errors, empty states and hints consistently; don't expose internal terms to shopkeepers. The action is available at any date/time subject to valid transaction dates; **no “evening” wording anywhere**. Labels must make direction and source unambiguous, even if shortened.

## 7. UX quality and accessibility

- Desktop: wide product cart and optional sticky totals panel, compact rows, no competing toolbar and no nested scrollbars.
- Mobile: 320–430px width tested; Vendor chooser, two-column summary when feasible, single-row horizontally scrollable tabs, single-column cart, no clipped footer or page-level horizontal scroll.
- Dark/light: use existing theme tokens for dropdowns, date-range, tooltip, menu, dialog and popovers.
- Keyboard: role/tab arrows, Home/End, Escape, visible focus; Enter sequence Add Product → Quantity → Add Product. Purchase shortcuts (F2/F8/F9) work only in the currently visible editor and never steal focus when another tab or dialog is active.
- Draft preservation when switching tabs; warn before changing Vendor/Party with unsaved cart. Search and date-range state scoped to the selected Vendor.
- Money in/out uses direction **and words**, never only green/red colors. Known sums are integer paisa; unknown values remain null; real compound unit is shown, never generic "base units" when product symbol is available.
- Clear demo labels, no toast implying real posted inventory or cash. Empty, success, validation, disabled, insufficient stock, wrong source/Vendor, duplicates and correction-blocker states designed.

## 8. Acceptance tests and dependency order

1. `/app/vendors` appears **as its own top-level nav entry** on desktop/mobile and in route-path whitelist, alongside POS/Sales/Purchases; navigation and permission tests confirm correct active sidebar state and no broken existing routes.
2. Vendor list/chooser searches the canonical Party records, Quick Adds from module, deep-links from Party profile preselect the correct Vendor; updating role and changing Vendor never loses or mixes another Party's data.
3. `/app/parties?role=Vendor&id=...` matches the **supplied Supplier profile screenshot** in header, action row, five standard profile tabs, filters, debit/credit/running ledger, print and row menus; Vendor-specific Pay/Receive/Opening Balance actions use authoritative source-linked Vendor operations, not duplicate postings. Taken/Given sides never net. No special VendorWorkspace; Vendor profile links back to `/app/vendors`.
4. Five operational Vendor tabs work, with full-sized inline POS-style editors where needed, no giant Purchase modal, one prominent action per tab; label conventions and keyboard/mobile/dark-mode checks pass.
5. POS stock shortage → Taken (optional price) → Set Price → Clear Due via money, matching goods or both. Given multi-line memo → receive money/products. Ordinary Purchase → independently tracked due/returns/refunds without duplicate stock. Review source-linked customer returns safely.
6. Ledger/Payments display identical underlying canonical Vendor transactions from both module and Party profile, once each. Original audit history remains visible after correct/void; no false zero, no unapproved netting, source-linked corrections validated.
7. Verify purchase returns/refunds and correction operations before claiming they exist. Missing backend posting/tenancy/security must be stated honestly.
8. Complete `npm test`, `npm run build`, `npm run check:ui-contract`, Vendor/POS/Purchases/Party/browser/theme/a11y checks and full CI on exact head. GitHub Actions has previously failed before starting a runner; do not call tests green until actual output confirms it. No merges/deploy without separate user approval.

## 9. Implementation handoff — pending spec approval

This is a **written design revision only**; it does not authorize writing application components yet. Once approved:
1. Produce an ordered native Superpowers implementation plan, including route/nav, shared PartyDetail data projection, Vendor chooser and tabs, shared cart/payment reuse and regression gates.
2. Execute native implementation in an isolated stacked branch above Vendor PR #57, retaining the prior financial model.
3. Request user visual review and merge approval only after tests actually execute. Do not edit the separate production `/home/shoaib/hisabiq` NestJS project or legacy Apps Script ERP.

This spec supersedes the earlier “five Vendor tabs inside Party profile” architecture. **Vendor is a top-level working module; Party profiles are uniform across relationship types.**
