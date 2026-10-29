# HisabIQ complete UI design guide

Version 2.2 · 26 October 2026 · Sher Software Solutions

Purpose: give every designer and AI the same vocabulary, components, values and interaction rules. Build new screens by composing the existing HisabIQ system. Keep it easy for a shopkeeper who uses the software alone, on a keyboard or an inexpensive phone.

## 01. Authority and how to use this guide

Read this guide before designing, generating, implementing, polishing or reviewing any HisabIQ UI. Then inspect the actual shared component and the reference screen for the task. Completion means every visible control, state, overlay, table and responsive layout has a named source or a documented gap.

Authority order: the user's current explicit decision; repository AGENTS.md and current binding contracts; this consolidated guide; actual approved shared components and reference screens; older Magic Patterns illustrations. An incidental legacy implementation is not a new rule. If two binding rules conflict, report the precise conflict and retain the narrower, latest dated rule while resolving it.

Evidence baseline: GitHub shuvodelux-commits/hisabiq_ui main at 79c51fdbbc8ce47364488127a1e2c5762f6526d9; Magic Patterns editor t6q3mxi6nhuak3qjvx8cwn, active artifact 6d7e6f96-3b50-43fb-adb2-d0be21b393b7 at review time; supplied magic-patterns.zip starter. The live editor includes later Reports, Settings and SaaS work absent from that ZIP. The connected Magic Patterns account is agnishuvo@gmail.com. GitHub is the implementation source of truth.

Rule labels: EXISTING means backed by current code or an existing contract. STANDARD means a precise default established by this guide where older examples left a choice open. GAP means a specified pattern has no complete shared implementation yet. A rule is not evidence that every old page conforms.

The guide is a specification and a component catalogue, not certification of every ERP screen. UI preview work may use clearly labelled sample data and simulated actions. Production financial and stock behavior requires the real backend. Preserve the distinction throughout design, tests and completion messages.

## 02. KISS and the product character

HisabIQ is calm, compact, information rich and practical. Useful context comes before decoration. Reuse Dashboard for summary composition, Party Ledger for record workspaces and underline navigation, Products for tables and POS V2 for transaction editing.

- Show the frequent task, current balance or stock, and one primary next action. Put uncommon options in Advanced and secondary record operations in More.
- Complete ordinary related work in context. Quick Add a missing customer, supplier, product, category, brand or unit; automatically select it and return to the preserved draft.
- Keep one clear visual primary action per action area. Separate record creation, payment, return and correction by explicit names.
- Use information that helps the next decision: name, amount, stock, unit, source, date and state. Avoid repetitive helpers, decorative metrics and cards inside cards.
- Flexibility means editable fields, column preferences, filters and progressive disclosure within the same components. It does not mean a new visual system per tenant or module.
- Keep user choices and drafts on failures. Show the restriction and next step when an action is unavailable.
- A toast follows an outcome. A menu item must open the relevant editor, preview, print, export or intentionally disabled explanation. A success toast alone is not a completed business operation.

## 03. Brand, logo and assets

EXISTING: use src/components/brand/Logo.tsx exports LogoMark, Wordmark and LogoLockup. The product name is HisabIQ, one word with H, I and Q capitalized. Use the supplied Bangla lockup for Bangla-first contexts; keep IQ in the master treatment.

| Asset | Use | Rule |
| --- | --- | --- |
| LogoLockup | App header, sign-in, documents | Mark plus wordmark; size is mark height |
| LogoMark | Favicon, app icon, collapsed sidebar | Preserve the 40 by 40 master geometry |
| Wordmark | When mark is already nearby | Use component; do not retype with a substitute font |
| color | Light surfaces | Ink word, Teal IQ, Mint signal on dark tile |
| inverse | Ink surfaces | Existing inverse master |
| mono-ink / mono-white | One-color print | Existing monochrome master |

EXISTING LogoSection rules: clear space at least half the mark height on every side; mark minimum 16px on screen or 6mm in print; full horizontal lockup minimum 96px on screen or 25mm in print. App header mark is normally 26–32px. Preserve aspect ratio. The tile radius is 10 in the 40-unit master; it scales with the asset. Do not stretch, recolor, tilt, add gradients, shadows, glow, outlines, decorative growth arrows or AI sparkles. Use the receipt and invoice assets rather than generating another identity.

## 04. Color tokens and themes

EXISTING: src/theme.css is authoritative for runtime RGB channels; tailwind.config.js maps semantic classes to them. Use bg-background, bg-card, bg-popover, text-ink, text-ink-500, text-helper, border-border, border-input, bg-primary and text-primary-foreground. Apply opacity through the configured token classes. The generated design-system.json contains every light and dark channel and alias from the source.

| Role | Light | Dark | Use |
| --- | --- | --- | --- |
| background | #F5F7FA | #0B1A2C | Workspace canvas |
| card / popover | #FFFFFF | #14263B | Panels, fields, menus |
| foreground / ink | #0B1A2C | #EDF3FA | Main text |
| muted-foreground | #5A6B80 | #B1BED0 | Secondary text |
| helper | #607086 | #9FAFC3 | Small useful helpers |
| primary | #0D7C74 | #3DB8AC | Primary action and selection |
| primary-hover | #0A625C | #55CBBD | Opaque filled-button hover |
| primary-foreground | #FFFFFF | #0B1A2C | Text on primary |
| accent | #EAF6F4 | #133B3A | Quiet selected/context surface |
| accent-foreground | #0A625C | #7EDBD0 | Text on accent |
| border | #E3E8EE | #2E425B | Panels and dividers |
| input | #7B8999 | #6A819C | Available control boundary token |
| ring | #0D7C74 | #3DB8AC | Keyboard focus |
| inverse | #0B1A2C | #22364F | Inverse summary surfaces |
| mint | #3DD6B5 | #3DD6B5 | Brand signal on suitable dark surface |

| Meaning | Light text / background | Dark text / background | Use |
| --- | --- | --- | --- |
| success | #116F35 / #E8F5EC | #7DDFAB / #13392C | Paid, money in, valid outcome |
| warning | #974407 / #FDF3E3 | #F7C47B / #3B2B17 | Partial, low stock, attention |
| danger | #B92E25 / #FCEBEA | #FFAAA1 / #402328 | Error, money out, payable, destructive action |
| info | #1E56D3 / #EAF0FD | #A4CBFF / #1D2F4B | Neutral information, supplier context |

The original brand swatches remain historical identity references; runtime semantic colors were darkened for readability. Use current tokens in UI, not the old #15803D/#B45309/#C0362C/#2563EB literals. Mint is not small text on white. Color always has a label/icon/sign as a second cue. Positive receivable is green/teal; payable is red; ordinary amounts stay neutral unless direction/state matters. Stock zero, negative stock and a low-stock warning are different conditions. A red amount alone does not prove overdue status.

Dark mode uses the same structure, sizes, component states and meaning. Popovers rendered in portals must inherit the active theme. Brand identity boards may use an explicit light presentation; production components must use runtime tokens. Filled success/danger actions use the solid color paired with readable foreground rather than the light dark-mode text color as a fill. Test actual contrast: normal text 4.5:1, large text 3:1, essential control boundaries/focus 3:1 against adjacent colors. Do not claim contrast from a color name.

## 05. Typography and numbers

EXISTING: Geist for English and UI; Hind Siliguri for Bangla. Use the installed font stacks. No money, balance, quantity, reference or count uses a monospace font. Current table contract requires proportional digits: do not add tabular-nums or tnum within table surfaces. Older global body tnum and brand specimens are legacy drift; the table role override is authoritative. STANDARD for newly authored non-table product UI: proportional Geist digits too.

| Role | Size / line height | Weight | Source or use |
| --- | --- | --- | --- |
| Brand display | 36 / 44px | 600 | Identity board only |
| Page title | 20 / 28px | 600 | PageHeader; compact 18px then 20px at xl |
| Workspace / dialog heading | 18 / 26px | 600 | Short contextual heading |
| Panel title | 14 / 20px | 600 | Panel |
| Body | 14 / 20px | 400 | Forms and explanatory copy |
| Ordinary input value / textarea | 13 / 20px at every breakpoint | 400 | Shared input typography contract; Ink 600 values, muted placeholders |
| Form label | 13 / 20px | 500 | Label above field |
| Main table / responsive row data | 13 / 20px | 400 or 500 | Products authority |
| Column heading | 12 / 16px | 500 | All data tables |
| Table helper / badge | 11 / 16px | 400 or 500 | Explicit helper role |
| Non-table caption | 12 / 16px | 400 | Useful secondary context |
| Dashboard figure | 22 / 28px | 600 | Compact metric card |
| Major financial summary | 28 / 34px | 600 | Checkout / prominent summary only |
| Standard button | 14 / 20px default | 500 | Existing default; sm 12.8px, xs 12px remain legacy size-prop variants |
| Terminal transaction CTA | 15 / 20px | 600 | Explicit 48px completion/review action |

Existing page-title and table roles take priority over the old Brand Guide 24px H1 specimen. Use tight tracking for short English headings only. Bangla uses normal letter spacing, natural word wrapping and adequate line height; never uppercase Bangla or clip vowel signs. Keep the 13/12/11 table roles in every language; grow row height for wrapped content instead of shrinking the font.

Use src/utils/currency.ts: taka, formatMoneyNumber, formatNumber and takaCompact. Format ৳1,25,400, −৳350 and ৳120.50, preserving paisa where present. Use compact K/L/Cr only for chart axes and restricted summaries; expose the full amount in details. Numeric columns align right; names and prose align left. Phone, barcode, OTP and PIN are identifiers, preserve leading zeros, and must not acquire number steppers or money grouping. Keep input text editable; format monetary display after parsing with the existing domain helper. Never alter arithmetic or stored precision for a visual change.

## 06. Spacing, geometry and density

STANDARD scale: 4, 8, 12, 16, 20, 24, 32, 40 and 48px. Use 2px for optical adjustments and 6px for existing compact control gaps; avoid arbitrary page-local spacing. Measure component content before adding space.

| Relationship | Default |
| --- | --- |
| Label to field | 6px |
| Field to helper/error | 4px |
| Icon to text | 6–8px |
| Actions / toolbar controls | 8px; existing compact 6px |
| Fields within a form grid | 16px; tight related inline pair 8px |
| Related sections inside panel | 16px |
| Panels / page sections | 16–24px |
| Panel body padding | 16px |
| Panel header | 16px horizontal, 12px vertical |
| Workspace gutters | 12px phone, 16px sm, 24px lg |
| Workspace vertical padding | 16px phone, 20px sm and above |
| Modal content padding | Existing default 16px; STANDARD roomy editor 24px |
| Popup offset | 4px from trigger, at least 8px viewport margin |

EXISTING radii: standalone field focus contract 8px; ordinary button 10px; Panel/card 12px; default modal 12px from shared design-system; large identity board 16px; badge 6px; pill only for actual pill/avatar/dot. The shared primitive owns the final shape. Borders are 1px. Use shadow-card only where the existing panel/card calls for it; shadow-pop for floating layers. The token definitions are card: 0 1px 2px rgba(11,26,44,.04), 0 1px 1px rgba(11,26,44,.03); pop: 0 12px 32px -8px rgba(11,26,44,.18), 0 2px 6px rgba(11,26,44,.06).

Comfortable density changes cell padding through the existing preference. It does not change fonts, field heights or financial emphasis. There is no universal 44px row minimum. Rows grow with content and controls; they must not clip or overlap.

## 07. Universal component state contract

Every applicable component must cover default, hover, focus-visible, active/pressed, selected, disabled, read-only, loading, empty, invalid/error and success/result states. Not every component needs every state; explicitly mark irrelevant ones in review. Preserve its value and geometry across states.

| State | Required behavior |
| --- | --- |
| Hover | Quiet token change; optional fine-pointer feedback; nothing essential hidden from touch |
| Focus-visible | Visible ring; no layout shift; keyboard focus distinct from selection |
| Active | Immediate feedback; no double submission |
| Selected | Label plus checked/active indicator; persistent while navigating related details |
| Disabled | Actual disabled semantics and concise reason where needed; not merely faded CSS |
| Read-only | Value readable/selectable; no edit affordance; distinct from disabled |
| Loading | Stable label and width, busy announcement; block duplicate mutation, keep draft |
| Empty | Explain what is empty and relevant next action; retain filters |
| Error | Specific corrective text near field plus summary for a long form; focus first invalid field |
| Success | Visible outcome tied to real/simulated operation; announce without hijacking focus |

Use aria-invalid and aria-describedby for field errors; role=status for passive async progress and role=alert for actionable failures. Do not put required instructions only in a tooltip. Maintain focus when clear/reset, retry, selection and nested quick-add return.

## 08. Buttons and action priority

EXISTING: src/components/Button.tsx wraps the exported design-system Button. Import it rather than a raw styled button for normal actions. The wrapper forwards its ref to the real button; focus restoration must target a connected control, including More → sheet action → modal → close. All size props, ordinary primary/outline/secondary/ghost/destructive/link buttons, toolbar/filter actions, dialog Save/Cancel and standalone icon actions have 36px visual height. Icon action outer box is 36 by 36px.

| Variant | Intended use | Appearance |
| --- | --- | --- |
| default | One primary action in its area | primary fill, primary-foreground text, opaque primary-hover |
| outline | Normal secondary task, Clear, Print, More | card background, thin border, neutral text; quiet hover |
| secondary | Existing alternative grouping only | Retain shared white/thin-border ERP override; not a second gray button system |
| ghost | Low-emphasis contextual utility | Transparent default, quiet hover, visible keyboard focus |
| destructive | Explicit destructive operation | Shared danger treatment; label action and confirm impact where required |
| link | Inline navigation/action | Semantic link appearance; use a real link for navigation |
| icon sizes | Filter, close, settings, row actions | Accessible name, visible focus; glyph usually 16px |

48px is reserved for an explicitly designated major transaction review/completion CTA, currently POS sale, purchase and sales return. It requires data-erp-workflow-action="complete" on the shared Button. Primary color, lg size, phone viewport and a Save label do not trigger 48px. Terminal CTA text may include final amount. Normal Cancel and Back stay 36px.

Use sentence-case verbs: New sale, Receive payment, Review purchase, Save draft, Clear filters. Use one consistent Plus glyph for creation. Preserve label during loading; show busy state without shifting neighboring controls. Never use a navigational tab styled as a filled action button. Nested clear icons and numeric half-steppers are internal controls, not standalone 36px peers; use their existing geometry.

## 09. Text, search and multiline inputs

EXISTING: src/components/Input.tsx routes actual quantities to NumericInput and gives controlled search/find/filter fields the shared X clear action. Ordinary fields are 36px high, full available width, card surface, 8px radius. The bundled Input uses 10px horizontal padding; existing numeric/joined assemblies own their insets. Use the default Button variant size for new ordinary actions, keeping one 14px action-label baseline; inherited sm/xs text sizes are legacy differences, not new layout choices. Label above the control, required marker where genuinely required; placeholder is an example, never the only label.

Input values are deliberately quieter than headings and totals: 13px / 20px, weight 400, normal letter spacing, existing Geist/Hind Siliguri and proportional digits in every viewport and language. Use Ink 600 for entered, read-only and numeric values; use muted foreground for placeholders at regular weight. A surrounding medium-weight label must not make its input or textarea bold. The shared --erp-input-* tokens and src/index.css own this typography, including numeric/joined editors and native text entry inside the app. Do not restore the bundled 16px/14px input sizes or add page-local semibold/black input values. Labels keep their separate 13px medium role; totals and headings keep their existing emphasis. Disabled opacity, error messages/borders, alignment and edit behavior stay unchanged. Calculator scratchpad text retains its own specific contract.

Focus uses primary border and one 2px teal-100 halo. Error uses destructive border and a 2px danger halo on focus. Joined fields own a single outer focus treatment; nested editors do not add rings. src/index.css owns these rules; do not recreate them page by page.

Search has a leading Search glyph if the existing assembly supplies one, typed query, optional trailing X, actual filtering and a clear no-results message. Clearing keeps focus and updates results. Search terms and selected entity are separate states. Use an appropriate input type: tel for phone; password for secrets; email for email; text/search for identifiers/search. Use autocomplete correctly for sign-in and personal fields.

STANDARD textarea: shared field surface/focus and 13/20 regular input typography, 12px padding, minimum 3 text lines, vertical resize where safe. Notes may grow; count only where a real limit exists. Calculator follows its own multiline scratchpad reference: input always visible, one line initially, at least four visible lines for multiline work. Do not apply 36px max-height to multiline content or calculator keys.

## 10. Numeric, money, unit and compound fields

EXISTING: NumericInput.tsx, MoneyUnitInput.tsx, transactions/CompoundQuantityInput.tsx and MultiUnitQuantityInput.tsx. Keep one 36px outer shell for joined money/unit controls. Numbers align right in data contexts. Unit is a readable word or selected label, never an unexplained suffix.

NumericInput shows increment/decrement arrows on focus and fine-pointer hover; geometry reserves arrow space so text/caret do not move. ArrowUp/ArrowDown and focused mouse wheel use the existing stepping helper, normally one whole unit. Unfocused wheel scrolls normally. Respect min/max, disabled/read-only, composition input and existing decimal parser; do not infer a new fractional stepping policy from the HTML step prop.

Multi-unit products expose the actual configured chain, such as 1 carton = 12 box, 1 box = 20 pcs, 1 pcs = 120 feet. Display 3 Pipe 10 Feet, not an invented decimal conversion. Single-unit products keep the simple entry. Returns always show the multi-unit inputs for multi-unit products. Preserve source unit, selected-unit price, conversion precision and returnable amount. Never encode phone/PIN/OTP as quantities. Amount-in-words uses AmountInWordsDisplay; it supports understanding but stays secondary to the numeric total.

## 11. Selects, comboboxes and Quick Add

| Need | Existing source | Choice |
| --- | --- | --- |
| Short fixed list | AppSelect.tsx; FormSelect.tsx adapter | Payment method, status or a short unit list |
| Large/master data list | SearchSelect.tsx | Searchable names, phone, SKU or useful metadata |
| Create missing dependency | SearchSelect with onCreate; QuickAddDialog.tsx / QuickAddSelect.tsx | Inline + Add new inside dropdown |
| Transaction products | pos/ProductCombobox.tsx; transactions/TransactionCartEditor.tsx | Canonical integrated product search and rows |
| Date(s) | AppDateRangePicker.tsx exports AppDatePicker and AppDateRangePicker | Single-date wrapper or range mode |

Trigger stays 36px and matches fields. A short-list option uses a 36px row; rich product/entity results grow for metadata and are not compressed to one line. The existing select popup sizes/placement win: AppSelect default maximum 264px; SearchSelect up to 380px; neither may escape the viewport. Use popover/card tokens, border, shadow-pop and selected checkmark. Opening flips above when space below is insufficient and clamps horizontally with 8px margin. Reposition on scroll, resize and on-screen keyboard changes where supported. Menus in a dialog remain owned by that dialog.

Keyboard: open with Enter/Space or arrows as supported; Up/Down move the active option; Enter commits once; Escape closes the innermost surface; Tab follows the established form order; Home/End where the component supports them. Make active and selected states distinct. Scroll the active option into view. Touch selection must work without hover or double activation. Use real IDs/values independently from translated labels.

Quick Add carries the search text into a short creation surface, checks duplicates under the real tenant/domain rules, preserves the parent draft and selects the created entity. Cancel returns to the same selector. Category, Brand and Unit additions stay inside Product entry. Put the add action inside the dropdown; no external plus button beside every select. Avoid cascades of overlapping dialogs; use the shared nested creation flow. Data loading, error/retry, empty options, no match, permission restriction and duplicate result are required states.

GAP: there is no authored universal ActionMenu wrapper at this baseline. AppDatePicker does exist: import it from AppDateRangePicker.tsx; there is no separate AppDatePicker.tsx file. Inspect exports, not filenames alone. If extraction is needed, make one shared implementation with existing tokens and verify its callers.

## 12. Dates, time, calendars and ranges

EXISTING: AppDateRangePicker.tsx exports AppDatePicker for value:string/onChange(date:string), and AppDateRangePicker for range values plus optional single mode; src/utils/dateRange.ts supplies business date helpers and src/i18n/datePickerCopy.ts supplies localized display copy. Use the business date and Asia/Dhaka context rather than raw host UTC for visible Today. Stored ISO values remain stable. Distinguish transaction date, created time and due date in labels.

Range picker: show selected From and To, presets appropriate to existing screen, pending selection and explicit Apply/Cancel behavior. Picking days must not silently change a report until its existing commit model says so. Cancel/Escape discards the picker draft. A missing/invalid end date has a clear correction; reversed dates normalize or validate through the shared implementation. Date buttons keep the existing calendar-day sizing, not 36px universal control forcing. The picker is keyboard operable, highlights Today/selected/range without relying solely on color and keeps its footer reachable on phones.

STANDARD display: short clear dates such as 26 Oct 2026 and times such as 11:42 AM with business timezone stated where ambiguity matters. Use the existing locale formatter for Bangla mode. Preserve period and filters when opening a source record and returning. Never label a future planned date as a posted transaction date.

## 13. Checkboxes, switches, radios and segmented choices

EXISTING: Switch.tsx re-exports the design-system Switch; product fields/ToggleRow.tsx, KindToggle.tsx and SegmentedControl.tsx show actual choice patterns. Switch is the supplied native input API with checked/onCheckedChange; inspect its types rather than assuming a Radix button API. Checkbox/radio glyphs and switch tracks keep intrinsic dimensions; the whole labelled row supplies a comfortable click target.

Use checkbox for independent selections and bulk-select; show indeterminate state when some visible rows are selected. Radio is one choice from a small set. Switch is on/off for a setting; label what on means, show a short consequence when needed. Group label, disabled reason, focus and screen-reader state are required. Define whether a setting saves immediately or waits for the Save bar and show unsaved state accordingly.

Segmented controls are for short mutually exclusive field values or payment/quantity modes. Preserve the existing shared style. They are not module navigation. Underline tabs are for navigating content sections. Do not use switches for destructive actions or a radio card solely to make a form look decorative.

## 14. Forms, validation and editability

Use product fields/FormField.tsx, LabelText.tsx, FieldMessage.tsx, SectionHeading.tsx and Disclosure.tsx as the current form family. Reuse a domain editor, not its copied markup. Place the normal sequence first and rare fields in Advanced. New Product is full page: Type → English name → Bangla name → Brand → Category → Unit → Unit cost → Selling price → Opening stock → Minimum stock → Advanced stock → warranty/serial/expiry/offers.

STANDARD form grid: one column on phone; two only when each field remains readable; align fields and action baselines, place a shared error area below its field, let long translated labels wrap. Keep labels visible for prefilled values. Group logically related controls with fieldset/legend or equivalent semantics. Optional text belongs on genuinely optional fields; required state must be explicit without visual noise.

Validate locally when it helps correction, validate on submit, preserve all valid values. Long forms show ErrorSummary and focus the first invalid field. Avoid error flashes while a user is composing Bangla or entering an intermediate numeric value. Distinguish zero, empty and unknown. Use the domain's exact permitted values rather than silently clamping everything.

Dirty form navigation offers Save Draft & Continue/Switch, Discard & Continue/Switch, Stay Here when the workflow supports saving. Close/backdrop/Escape use the same policy; don't lose a half-filled parent on Quick Add. Cancel does not commit changes. Save/Apply scope must be explicit. Record corrections preserve source/audit behavior. Editable historical return price shows Reset historical net price; above-original changes require the existing reason/confirmation and expense adjustment context, not a new visual posting shortcut.

## 15. Dialogs, confirmations, drawers and sheets

EXISTING: Dialog.tsx provides portal, keyboard/focus containment, body scroll lock and return focus. Use DialogTitle and DialogDescription. Standard content is a 12px-radius popover surface with the shared subtle ring/border, overlay and 16px padding. The default bundled width cap is 384px; select an explicit editor cap when the content needs it. DialogContent has max-height calc(100dvh - 2rem), vertical scroll and overscroll containment. Keep header, first invalid field, footer and close control reachable with the on-screen keyboard.

STANDARD width choices: small confirmation/Quick Add 448px, normal editor 512px, detailed editor 672px, source/transaction preview 896px; use max-width calc(100vw - 32px). These are content caps, not fixed phone widths. A complex product or transaction editor uses its existing full page/contextual workspace rather than another oversized dialog.

Title names the task; description gives party/source and consequence; fields follow; footer has Cancel then the primary action on desktop, safe wrapping on phone. Buttons retain 36px unless an explicitly eligible terminal transaction CTA. Close X has an accessible name. Escape closes the innermost popup first, then the top modal subject to dirty-state rules. Background cannot receive keyboard interaction. Restore focus to a connected opener. Portal dropdowns inside dialogs remain selectable and focusable.

Confirmation states the action, source, amount/items, account/destination and meaningful effect. Destructive or posted correction needs impact preview and reason where the domain requires it; a generic Are you sure is insufficient. A read-only attachment preview is different from an editor. Use the existing PartyActionSheet and responsive SearchSelect sheet where present. GAP: no general Drawer component is exported; composing a new sheet requires one shared accessible pattern, not a page-local simulated modal.

## 16. Menus, tooltips and contextual actions

EXISTING: Tooltip.tsx and PartyLedgerRowActions.tsx / sales/SalesMobileLayout.tsx / PartyActionSheet.tsx are current concrete patterns. Menu trigger is ordinary More or a named 36px icon action. Desktop may use three-dot glyph; compact mobile Sales/Party uses the approved square More action. Party edit belongs under More. No inert View button when the record name already opens details.

Keep frequent actions visible: for example Receive payment and New invoice in the relevant workspace. Group secondary actions logically; place destructive actions last with a separator only where it separates groups. Disabled items show why. Menu outcomes preserve selected record, period, scroll and parent draft. Support keyboard opening, focus movement, selection, Escape, click-outside and return focus; a tooltip is not a menu.

Tooltip is supplementary, concise and available by keyboard focus. It labels unexplained icon meaning or an abbreviation, not a required instruction. No tooltip-only validation or essential finance information. Do not place hover-only controls in touch workflows. Attachment uses Paperclip and opens a readable quick preview. Eye opens useful detail/cost context with proper permissions; it is not decoration.

## 17. Panels, cards, KPIs and detail headers

EXISTING: Panel.tsx, dashboard/MetricCard.tsx, WidgetFrame.tsx, parties/PartyBalanceCard.tsx, PartyClosingBalance.tsx, PartyAvatar.tsx and ProductThumb.tsx. Panel is rounded-xl, border-border, bg-card, shadow-card, min-width zero; header/body spacing follows section 06. Use actual components where applicable.

Card hierarchy: short label, optional small helper, prominent value, one useful contextual line, optional clear link/action. Avoid putting every field in its own card. Use neutral surfaces; semantic tint is for meaningful balance/state. Add a trend only with a valid comparison period and units. Missing comparison is unavailable, not 0% growth. Do not count up money or animate changing balances.

Party detail header shows name, role/contact and compact balance. Desktop may show last activity on a third line; mobile keeps name, phone and balance only. Place additional actions in More on mobile. The balance label says Receivable · পাবো, Payable · দেবো or Settled and retains role meaning. A generic signed amount is insufficient for customer/supplier/owner/loan roles. Use existing avatar initials/fallback; images have useful alt text or are decorative when name is adjacent.

## 18. Tables, rows, columns and totals

EXISTING: Products is the typography authority. Use Table.tsx (automatically data-erp-table), or mark a necessary native table with data-erp-table. Responsive row containers use data-erp-table-view. Use data-table-helper for secondary text and data-table-badge for custom status labels. Control values, balances and money stay main data; do not wrap them in a helper marker to shrink them.

| Part | Default rule |
| --- | --- |
| Table heading | 12/16px, medium, quiet canvas background, sentence case |
| Main cell | 13/20px, regular; medium name and semibold meaningful total only |
| Helper / status | 11/16px, readable semantic text |
| Alignment | Text left; qty, cost, price, total, balance right; actions end |
| Cell spacing | Existing reference padding; STANDARD 12px horizontal, 8px vertical for read-only rows |
| Row geometry | Intrinsic; read-only single-line usually 36–40px; 36px control plus padding may need 44–52px |
| Dividers | One thin row border where useful; avoid duplicate horizontal rules |
| Hover | Quiet themed row background; selection distinct and labelled |
| Identity | Clickable record/product/customer name where applicable |
| Totals | Label and exact values, aligned with columns, after filtered results |

Supporting text may wrap to two lines. Do not truncate the sole record identity with no way to reveal it; numeric columns remain fully visible. Sticky heading/identity/action columns are allowed when the existing table uses them; keep background opaque and avoid overlaying focus rings. Retain horizontal scrolling for genuinely comparative wide tables within a labelled, keyboard-reachable region. Whole-page horizontal overflow is a defect.

Sorting uses a labelled header with direction and aria-sort. Default Products order is latest first. Different domains keep their meaningful order; ledger running balances require chronological order and an explicit period opening balance. Sorting/filtering a list must not recalculate historical balances as if hidden records never existed. Totals clearly say filtered period/page/all results. Decimal precision and right alignment stay consistent within a column.

Column chooser has stable defaults, display labels, checked state, protected identity/action essentials and Reset columns. Persist through the existing preference scope; do not invent a new storage system. Tablet Sales hides Items and Payment columns by default, with neutral ordinary amount text. Bulk selection explicitly states this page versus all matching records; changing filters must not silently expand the selection. Row menu acts on its own row. Loading, empty, filtered-empty, partial error and large result pagination are required.

## 19. Search, filters, toolbar, pagination and export

Use current SalesWideToolbar, PartyLedgerToolbar/Responsive, Reports/ReportToolbar and AppDateRangePicker as structural references. Toolbar order is search → meaningful short filters/date → utilities such as columns/print/export → primary creation action. Let controls wrap before shrinking fields or labels. Heights remain 36px in all languages.

Keep the primary search and a Filter trigger visible; show active-filter count. Existing Sales filter panel starts collapsed on desktop/tablet; do not expose every possible filter by default. More complex filters open inline/on demand. Show the applied state and Clear filters only when useful. A filter draft requires explicit Apply/Cancel; immediate filters update immediately; don't mix the two models inside the same panel without labels.

Clear filters resets search, filters and page to the documented defaults, not user records, column preferences or drafts. Preserve the selected date range when opening records. Filter badges are removable with a named X, and long values remain understandable. Debounce remote search only through the existing data layer; local preview filtering must visibly change results. Distinguish no records from no matches; the latter offers Clear filters.

Pagination shows range and total, current page, previous/next disabled states and page-size selector. Reset or clamp page when filters shrink the result set. Use the existing ledger rows-style select for page size rather than a new large control. Export/print state scope: current filters, selected records or all results. Export must produce an actual file at preview level, or be clearly disabled with a reason. Do not show downloaded success with no download. Print is a document action, not a screenshot of hidden UI.

## 20. Navigation, tabs and page structure

EXISTING: AppShell, Sidebar, TopBar, ErpNavMenu and PageHeader. Expanded desktop sidebar 256px, collapsed rail 64px; desktop shell at lg (1024px). Top bar is 56px at ordinary widths and may wrap on phone. Keep its existing account/business controls, global search and utilities.

Parent sidebar module with children is one full-row expandable button; label, icon and chevron toggle the same group. First child is landing page. Direct modules such as POS are links. One submenu open; route changes reveal the active parent. Ctrl/Cmd+B and SidebarTrigger toggle collapse; persist the existing preference. Collapsed group selection expands to the group; direct links remain direct. Mobile menu is an accessible drawer and child navigation closes it. Do not turn the decorative business card into a fake working switcher.

Actual module and nested content tabs follow Party Ledger: horizontal text labels, optional counts, one 2px primary underline on the selected tab, thin shared baseline, neutral surface. Use MotionTabList and MotionTabIndicator with unique instance scope, role=tablist/tab, aria-selected, controlled panels and keyboard support. STANDARD strip: 36px minimum content area with natural extra height for a wrapped bilingual label; horizontal scroll when needed, no clipped active tab. Active count can use semantic accent; inactive count stays quiet. No filled pill navigation for Expenses, Sales, Vendor, Products, Purchases, Finance, Reports or Settings content sections.

Tabs are not payment modes, status filters or quantity toggles. URL/deep-link behavior belongs to the existing router; changing a tab does not remount/erase editors. Back returns to the same record, period, filter and scroll. Breadcrumbs reflect actual route; a document reference opens its true source. Preserve authorization and feature gates. For business switching with a dirty transaction use Save Draft & Switch / Discard & Switch / Stay Here.

## 21. Responsive behavior and touch

EXISTING breakpoints: sm 640px, md 768px, lg 1024px, xl 1280px, 2xl 1536px. Components can use their existing container queries; viewport width alone does not prove a wide cart fits. Test at 360/390px phone, 768px portrait tablet, 1024px landscape/tablet and 1440px desktop, plus zoom and on-screen keyboard.

Keep the desktop compact information hierarchy on tablet where space permits. Portrait POS/cart above payment; landscape side-by-side when available content width fits. Purchase layout uses its existing 1220px workspace container threshold with 330px checkout, purchase cart table at 840px, shared transaction cart table at 780px. Reuse these source rules; do not clone them into a new module. Mobile cart is compact and editable, keeping product, total and remove together, quantity/unit/price underneath.

Sales and Party use their approved responsive rows; same 13/12/11 role scale. Mobile Party shows name, phone, compact balance and More; hide last activity and extra action clutter. Tablet hides nonessential Items/Payment columns by default but retains Money In/Out/Adjust access. Name tap opens customer ledger on every device. Do not globally force min-height 44px on compact rows. Standalone ordinary controls stay 36px, with at least 8px useful separation or a nonoverlapping larger labelled hit region. Validate touch usability; exceptions belong to the shared component, not a hidden blanket CSS override.

Content wraps before overlapping. Keep totals, primary actions, errors and modal footers reachable above safe areas. Sticky panels do not cover data or focus. No hover-only actions; no fixed-width modal, offscreen dropdown or inaccessible sideways page. Show/hide columns using user preference and breakpoint defaults without losing the data's detail view.

## 22. Motion and animation

EXISTING: installed Framer Motion, src/motion/tokens.ts, MotionTabList and MotionNavIndicator. No second motion library. Motion acknowledges state; it never delays posting, validation, calculation, focus or navigation.

| Interaction | Duration | Easing / boundary |
| --- | --- | --- |
| Navigation hover | 110ms | [0.16, 1, 0.3, 1], fine hover only |
| Navigation active indicator | 190ms | Same, instance-scoped layout IDs |
| Number stepper visibility | 120ms | Opacity only; arithmetic and geometry unchanged |
| Sidebar toggle | 220ms | Explicit toggle only; initial render instant |
| Tab underline | 200ms | One 2px underline per tab strip |
| Dialog entry | 220ms | Opacity 0→1, margin-top 24→0; [0.32, 0.72, 0, 1] |
| Dialog veil | 180ms | Dialog-owned backdrop only |
| Field focus/color | 150ms | Border and box-shadow, no dimension changes |

Respect prefers-reduced-motion through the existing shared hooks/CSS. Underlines become static, dialog entry instant, steppers immediate. Do not add looping decoration, bouncing CTAs, count-up money, animated table reorder delays or parallax. Dialog implementation uses margin offset to preserve the design system's centering transform; do not overwrite that transform with a competing motion wrapper. General new transitions use the nearest existing motion token; request a shared extension only if none fits.

## 23. Icon language and mapping

EXISTING library: lucide-react. UI glyphs normally 16px; navigation/section glyphs 20px; quiet empty state 32px. The original icon board uses stroke 1.75; STANDARD for newly composed glyphs is 1.75, retaining existing component-owned strokes on reuse. Use consistent bounding boxes and align with the text baseline/center. Decorative icons aria-hidden; icon-only controls require a translated accessible name. Never encode the whole state by color alone.

| Meaning | Lucide export |
| --- | --- |
| Dashboard | LayoutDashboard |
| POS / new sale | ShoppingCart |
| Products / stock | Package |
| Parties / people | Users |
| Customer role | UserRound |
| Supplier / purchase | Truck |
| Vendor exchange context | ArrowLeftRight |
| Lender / borrowing context | Landmark |
| Owner | UserRoundCog |
| Borrower context | HandCoins |
| Sales invoice | FileText |
| Expense / receipt | Receipt |
| Finance / cash balance | Wallet |
| Cash payment | Banknote |
| Bank account | Landmark |
| Payment / collection | HandCoins |
| Money in | ArrowDownLeft |
| Money out | ArrowUpRight |
| Adjustment / reconciliation | Scale |
| Daybook / ledger | BookOpen |
| Reports / chart | ChartNoAxesCombined |
| Settings / manage people | Settings |
| Search | Search |
| Filter | SlidersHorizontal |
| Clear / close | X |
| Create / add | Plus |
| More | MoreHorizontal |
| Edit | Pencil |
| Delete | Trash2 |
| Detail / cost visibility | Eye |
| Attachment | Paperclip |
| Print | Printer |
| Export | Download |
| Import | Upload |
| Date / range | CalendarDays |
| Note | StickyNote |
| History | History |
| Phone | Phone |
| Address | MapPin |
| Success / selected | Check / CircleCheck |
| Warning | TriangleAlert |
| Error | CircleAlert |
| Info | Info |
| Calculator | Calculator |
| Sidebar | PanelLeft |
| Reorder | GripVertical |
| Expand / collapse | ChevronDown / ChevronUp |
| Password / PIN security | LockKeyhole |

EXISTING PARTY ACTION ICON RULE — screenshots 4, 5 and 6 are concrete authority for action semantics. The selected relationship, not a generic payment label or balance sign, selects the action and icon. Import src/components/parties/partyRoleActions.ts: partyFinanceActions and partyTradingActionIcons. Identity/role glyph suggestions above are distinct from these action buttons.

| Active relationship | Primary action / exact Lucide icon | Secondary action / exact icon | Current workflow source |
| --- | --- | --- | --- |
| Customer | Receive payment / HandCoins | Refund credit (text action); New invoice / FilePlus2 | PartyPaymentDialog, PartyCreditRefundDialog, POS V2 |
| Supplier | Make payment / Banknote | Refund credit (text action) | PartyPaymentDialog, PartyCreditRefundDialog |
| Owner | Add capital / PiggyBank | Owner drawing / Wallet | Owner Credit / Owner Debit in PartyFinanceDialog |
| Lender | Repay loan / Landmark | Loan received / ArrowDownLeft | Lender Debit / Lender Credit |
| Borrower | Collect repayment / HandCoins | Lend money / ArrowUpRight | Borrower Credit / Borrower Debit |
| Vendor with vendor profile | Pay Vendor / Banknote | Receive Money / HandCoins | VendorQuickSettlementDialog pay / receive-money |
| Payee | Current compact workspace: Opening balance / BookOpen | Expense payment belongs to its existing Expense context | PartyOpeningDialog; do not invent a customer receipt |

Customer and supplier refund availability comes from verified refundable credit at the selected date; disabled buttons explain why. Switching a multi-role party changes the action pair and its real finance type without mixing role balances. Owner drawing is not a supplier payment; borrowing is not sales income. Keep existing primary/outline priority and 36px controls. Mobile may place secondary operations under More; it must preserve the same icon, wording and source workflow. RoleBadge and PartyAvatar have their own identity/tint rules and must not determine the financial action. Future role-aware controls extend this shared map rather than adding a page-local icon choice.

The mapping is a STANDARD for a new use with no approved existing glyph; preserve current module/role glyphs when reusing a source component. Similar roles are differentiated by the existing RoleBadge and label/tint; do not add a new icon package to make every party unique. The generated inventory records every currently imported Lucide name and usage path, including legacy alternatives; it is an availability/audit index, not a second competing mapping. Brand imagery is literal and restrained; financial figures never use emoji as status.

## 24. Bangla, English and accessible copy

EXISTING preferences: English + Bangla default, English, Bangla. Use personal.language and src/i18n/useUiCopy.ts / domain dictionaries. Translate displayed labels, helper text, option labels, status, errors, confirmation, empty states, accessible names, tooltips and print UI. Keep IDs, payment values, stored source codes, phone, barcode and entered names intact. Never build another language selector per module.

English + Bangla: concise English primary with a short useful Bangla helper only where needed. English: helper hidden. Bangla: Bangla primary; do not repeat the same helper underneath. Bilingual helpers are 11/16 inside tables; prose keeps its role size outside tables. Mark Bangla passages lang=bn and use font-bn. Use meaningful document language. Preserve readable line height, normal spacing and glyph marks on cheap Android/browser font fallback. Never force all Bangla UI globally to 15px.

| English meaning | Everyday Bangla | Distinction |
| --- | --- | --- |
| Product | পণ্য | Not মাল |
| Stock | স্টক | Formal report: মজুত |
| Sale / Sales | বিক্রি | Formal document: বিক্রয় |
| Purchase | পণ্য কেনা / কেনাকাটা | Document: ক্রয় বিল |
| Customer receivable | ক্রেতার কাছে পাওনা / পাবো | Not supplier payable |
| Supplier payable | সরবরাহকারীকে দেনা / দেবো | Distinguish advance/credit |
| Receive payment | টাকা নিন | Receipt operation |
| Pay supplier | সরবরাহকারীকে টাকা দিন | Payment operation |
| Money in / out | জমা / খরচ | Use context for transfers, loans and owner funds |
| Return to vendor | পণ্য ফেরত দিন | Outgoing goods |
| Receive goods back | পণ্য ফেরত নিন | Incoming goods |
| Discount | ছাড় | Separate cash discount and settlement |
| Opening balance | শুরুর জের | Customer helper: আগের বাকি |
| Walk-in customer | সাধারণ ক্রেতা | Does not imply a saved ledger party |
| Cash | ক্যাশ | Separate from Nagad wallet |
| Reconciliation | হিসাব মেলানো | Everyday action |
| Gross profit | বিক্রির মোট লাভ | Not net profit |
| Quotation | কোটেশন | Non-posting |
| Import | Excel থেকে ডেটা আনুন | Upload alone is not import |
| Export | ডেটা ডাউনলোড করুন | Produce actual file |
| Advanced | আরও সেটিংস | Hide uncommon choices here |

Numbers use existing domain/locale helpers. Current common money helper uses en-IN grouping even in bilingual contexts; do not globally convert digits by guessing. Bangla-digit display can use the existing module formatter when supported; parsing accepts the module's supported input forms, retains leading zeros for identifiers and stores normalized values. Date translation follows datePickerCopy. Test long names, mixed English/Bangla product names, compound units, paisa, minus signs and amount-in-words.

Copy is calm and exact: Couldn’t save the sale. Check your connection — your cart is kept. Explain error recovery only when the draft really is kept. State amount, party, date and next action. No all-caps urgency, finance shaming, invented AI certainty or vague Success messages.

## 25. Transaction carts and payment composition

EXISTING: POS V2 CartTable/ProductCombobox is the visual and interaction authority. Purchases/PurchaseCart and transactions/TransactionCartEditor share the family; preserve context-specific behavior. Inspect current exports rather than assuming future architecture names exist. Reuse CompoundQuantityInput/MultiUnitQuantityInput, shared pricing/unit helpers and the current Quick Add path.

Row content: reorder affordance where supported, line number, product thumbnail/name/Bangla helper, contextual stock/category, quantity, selected unit, selected-unit price, line total and contextual actions/remove. Search-add lives in the same inline cart location as POS. Enter flow is product → quantity → next product; allow deliberate unit/price/serial editing; do not double-add on Enter/click/blur. Reordering preserves stable identity, quantities, serials and printable order.

| Context | Main distinction |
| --- | --- |
| Sale | Selling price, stock availability, customer/walk-in, payments |
| Purchase | Supplier cost, lot price, serial/expiry, supplier payable |
| Quote / plan / purchase order | Intent and terms; not actual stock or payment posting |
| Online order | Delivery/COD/advance terms and true fulfillment state |
| Return | Source quantity, historical net unit price, refund/credit and reason |
| Opening stock | Cost, effective date, selected stock units |
| Bundle | One sellable product with component cost/stock context |

Payment-capable editors use the actual POS/Purchase/Finance split-payment family: method → conditional account → amount → remove, Add payment, sum, Total/Paid/Due/Change, discount/rounding, amount in words and review confirmation. Distinguish advance from income and refund from ordinary payment. Final Amount in Counter follows the sum of sources. Never apply sale posting semantics to a purchase, quotation, loan, owner contribution or transfer because the UI is shared.

Bundle sells/prints as one product; internal components are not independently editable, removable or returnable inside that invoice. Eye can show authorized package purchase cost. Product configuration/version behavior is domain logic, not a new design style. Walk-in invoice can capture name/phone; source-linked return/customer-credit workflow may create the proper party using those details. Preserve the approved source and phone grouping behavior.

## 26. Reports, charts and decision support

Use Dashboard/Reports panel, Products table and Party tabs. A report is title + business question, period/filters, a small set of meaningful totals, chart only when useful, data table and contextual next action. Basic reports answer what happened; premium insight helps decide what to do. Complexity changes information and permissions, not the design language or table fonts.

EXISTING chart palette: chart-1 Teal, chart-2 Ink comparison, chart-3 success, chart-4 warning, chart-5 helper, chart-6 info (all theme aware). Label series, axes, units and period; show exact values on keyboard/touch-accessible detail, not hover alone. Use legible 11–12px chart annotations, quiet dashed grid, full-value table/details and non-color legend cues. Bars compare categories, lines show time, stacked parts require meaningful totals. Never distort axes or hide losses to imply profit.

Clearly distinguish actual, projected, estimated and sample values. An ROI shown for UI preview is labelled sample/illustrative and has no claim of measured business benefit. Missing/short history is insufficient data, not an invented precise forecast. Show calculation inputs/assumptions in an expandable explanation; confidence only if backed by a real method.

Decision workflow: Report → relevant products/parties → selected purchase plan → editable quantities/cost/supplier → purchase order → receive/create purchase → review actual quantity/cost/payment → post via real backend when available. Preserve source references and selected items through the chain. Plan/order editing is not editing a posted purchase. Partial receiving, price changes, cancellations, correction and return remain distinct states. Report drilldown preserves filters/period and returns to the same view. A create-purchase button passes context into the canonical purchase editor rather than a new cart.

## 27. Feedback, loading, errors and connectivity

Use Sonner for brief passive feedback; it cannot cover the next POS/Counter click. Action-bearing toasts remain interactive, passive notices use the existing click-through behavior. STANDARD duration: keep current app default; use persistent inline error when a task remains blocked. Do not add an app-wide timing preference for one toast.

Loading placeholders reserve stable row/card geometry, carry a loading label and avoid fake live numbers. For partial load failure keep successful context and offer Retry. Empty data explains creation; filtered-empty explains clearing; unavailable permission explains access; offline state explains what is safely stored and which action must wait. Keep cart/draft on retry and avoid duplicate mutations. Use PageBoundary for route errors. Do not promise offline persistence, SMS delivery, courier booking, server save or accounting posting unless the integration actually provides it.

Destructive success announces what changed and a real Undo only when a reversal is actually available. Notification badges represent true unread/action counts at the relevant scope. No fake confetti or delayed success animation around money. Confirmation content uses the user's current language and relevant exact amount/source.

## 28. Files, attachments, import, print and documents

EXISTING: PhotoUploader, PartyAttachmentQuickPreview, ReceiptPreview/printReceipt, PartyStatementDialog and import/ImportWizard. File selection states are idle, selected/preview, uploading/processing, validation error, success and remove/replace where permitted. Show filename, type/size limits and meaningful progress from the actual process. A clip in the ledger opens its own source attachment, not a generic success toast. Treat previews as untrusted files; never execute embedded content.

Import sequence: upload → mapping → validation/review → explicit import → result. Keep source rows and corrective messages, distinguish warning from rejected data, show duplicates and partial success accurately. Download an error report when available. Opening stock and party opening balances must retain units, role, date and real tenant/domain rules. Previewing a CSV does not mean data was imported.

Print/export uses the existing document pipeline. A4 portrait statements use current 12mm margins unless the document template says otherwise; thermal receipts use the actual supported printer width and preview. Repeat table headers, avoid splitting a line item, keep source/ref/date/party, opening/closing balances and totals understandable. Printed rows follow invoice order. Print light surfaces/readable dark text in either app theme, remove navigation/action controls, preserve Bengali fonts and exact money. Print typography is its own template contract; do not blindly apply UI data attributes to standalone generated PDFs. State period/filter scope on statements and reports.

## 29. Settings, authentication and SaaS surfaces

Settings use the same controls, cards, underline content tabs and concise helpers. Place settings under the correct business/user/module scope and show Save/Cancel/unsaved state consistently. Feature visibility, read-only permission, payment entitlement, trial expiry and temporary support access are distinct states. A hidden column is a preference, not removal of data permission. Do not expose implementation terminology in shopkeeper flows.

Authentication reuses features/auth/AuthLayout, LoginPreviewPage and AuthFlowPage. Match Geist/Hind Siliguri, Teal focus, 36px controls and branding. Mobile and Google sign-in, phone capture, recovery, trusted-account selection and PIN previews must label their UI-preview status where backend auth is absent. Phone and six-digit codes use identifier inputs; password reveal is labelled and retains focus. Autocomplete, paste, resend delay, invalid/expired code and retry states must be explicit when supported.

Existing approved UX: authorized device window 90 days, optional six-digit PIN, idle lock after 30 minutes with user setting, authorized account selection only when needed, last permitted business, dirty-draft business switch guard. These describe UI requirements, not security guarantees from a static prototype. Full security actions use the real backend's reauthentication flow.

SaaS administration remains a separate workspace with the same visual tokens and component sizes. Payments, package/offer building, SMS credits, feature grants and support consent need source/status/expiry/scope and audit context. A plan price, usage limit or tax is data, not hardcoded design guidance. Support access shows consent, duration and capabilities; a simulated admin toggle never proves production feature enforcement.

## 30. Accessibility and interaction acceptance

Use semantic headings, landmarks, labels, real buttons/links, visible focus and a skip link. A click on a name is a keyboard-accessible link/button too. Every icon action, clear button and contextual menu has an understandable translated accessible name. Use connected label IDs, required/invalid state, descriptions and live regions deliberately. Avoid nested interactive elements.

Keyboard must reach all routine tasks without traps: Tab/Shift+Tab, Enter/Space, Escape, arrows within selects/calendars/tabs and existing POS shortcuts. A dialog traps focus, background is inert to its flow, nested popup receives Escape first and closing returns focus. Tabs need roving focus/arrow navigation and associated tabpanel IDs; MotionTabList is presentation-only and does not supply the keyboard behavior by itself. GAPs must be fixed when a surface is touched; do not claim the wrapper guarantees a complete tab pattern.

Test text zoom 200%, reflow 320 CSS px for normal content, and larger text/translated content without loss. Comparative data tables may scroll within their own region. Target spacing follows section 21 and must be verified with touch. Error and status remain readable without color; reduced motion is respected. Screen-reader announcements report state once and do not reread the entire table on each keystroke. Tooltip and focus ring remain visible above popovers without obscuring the active control.

The actual current z-index stack has component-specific levels: sidebar 20, top bar 30, mobile nav 80, search sheet 150, date popup 155, select/search popup 160, skip link 200, plus component-owned dialog/toast layers. These are an inventory, not permission to stack everything higher. Reuse each shared portal/ownership behavior; a popup inside an overlay must appear above it and unrelated background portals must not steal focus. GAP: consolidate layered-overlay policy in a future shared fix if testing finds conflicts; avoid page-local z-9999 hacks.

## 31. Visual component library, catalogue and extension policy

The visible library at /#/design-system starts with rendered, interactive component specimens, not a file-name list. src/data/componentCatalog.json identifies each specimen's sources, covered states and whether it is used in HisabIQ or is a prepared future composition. Screenshots 1–3 map to actual Input focus/search, ReportToolbar plus AppDateRangePicker, and ReportHelp/Tooltip. Screenshots 4–6 map to the Party role-action rules in section 23.

The library currently contains 12 rendered specimen groups, covering Party role actions; report tables/filtering/columns/saved views; button variants/busy/radio; page headers/cards/charts; text/search states; quantity/money/units; selectors/Quick Add; single/range calendars; bilingual help/menus/dialogs/switches; future feedback/Advanced; and photos. Existing Dashboard chart tooltips/metric footnotes and upload thumbnail copy have documented language/accessibility gaps; they are inspected source examples, not certified future defaults.

Every new or changed shared UI family must add/update a visual specimen and its state coverage. For a reproducible prototype-only source export, run npm run export:component-library. It derives the same theme utilities/tokens and copies the current source dependency graph. Its adapters are limited to the prototype SDK entries, isolated preview language, pure report defaults/date validation and scoped theme hosts for portals; adapters do not belong in production business modules.

The inventory is supplementary; a source-file count does not substitute for a usable demonstration. A specimen provides controlled isolated state, a meaningful result for every active action, readable source names and the actual shared implementation. Source/detail previews preserve filters; saved-view examples restore their column/filter state; a missing result shows a clear empty state. Prepared components, such as FeedbackState, are labelled and must never be described as already used across all modules. ColumnVisibilityEditor is shared by actual Reports and the library. Actual Lucide glyphs appear in the atlas via generated static imports of the used set only.

The generated docs/ui/design-system.json is the complete authored TSX-file, shared-export, token and imported-icon inventory at this revision. It includes components, pages, providers and UI outside the components directory, labelled by kind. It is generated from source; it does not imply every authored domain component is an independent primitive or should be reused across unrelated business domains. The following is the canonical family map.

| Family | Actual source | Reuse instruction |
| --- | --- | --- |
| Ordinary actions | components/Button.tsx | Shared visual wrapper and semantics |
| Text/search | components/Input.tsx | Clearable controlled search; numeric routing |
| Number | components/NumericInput.tsx | Existing arrows/focus/wheel behavior |
| Money/unit | components/MoneyUnitInput.tsx | Joined amount + selected unit |
| Static list | components/AppSelect.tsx, FormSelect.tsx | Short fixed values |
| Searchable entity | components/SearchSelect.tsx | Search, create callback, popup/sheet |
| Quick creation | components/QuickAddSelect.tsx, QuickAddDialog.tsx | Preserve draft; auto-select |
| Dates | components/AppDateRangePicker.tsx | AppDatePicker export for single date; AppDateRangePicker for range |
| Form labels / messages | components/products/fields | Compose existing family, preserve i18n |
| Toggle | components/Switch.tsx | Exported input-based API |
| Badge/status | components/Badge.tsx, StatusBadge.tsx | Tone + visible state, intrinsic 20px badge |
| Tables | components/Table.tsx | Role scale, overflow and data markers |
| Panel | components/Panel.tsx | Header/actions/body composition |
| Page title | components/PageHeader.tsx | Existing title/action/language layout |
| Dialog | components/Dialog.tsx | Shared portal, focus, scroll and entry |
| Confirmation | components/TransactionReviewDialog.tsx | Domain-specific impact and review |
| Tooltip | components/Tooltip.tsx | Supplementary content only |
| Navigation | components/layout | Existing Sidebar/TopBar/menu/route structure |
| Content tabs | motion/MotionTabList.tsx | Indicator plus existing domain tab handlers |
| Product transaction | components/pos, purchases, transactions | Same cart family with correct domain adapters |
| Multi-unit quantities | components/transactions | CompoundQuantityInput / MultiUnitQuantityInput |
| Payment split | pos/CheckoutPanel, purchases/PurchasePaymentPanel, finance/FinancePaymentSplitEditor | Existing family, source/account semantics |
| Party context | components/parties | Detail, balance, toolbar, ledger, More, sheets |
| Product form | components/products/form/AddProductForm.tsx | Full page; existing field/advanced flow |
| Reports | components/reports | Toolbar, overview, result, details, guidance |
| Dashboard | components/dashboard | WidgetFrame, MetricCard and existing charts |
| Files / import | components/import, products/PhotoUploader, parties/PartyAttachmentQuickPreview | Existing preview/review pipeline |
| Documents | components/brand/ReceiptPreview.tsx, printReceipt.tsx | Existing receipt identity/pipeline |
| Authentication | features/auth | Existing layout and preview screens |
| Feedback | sonner plus layout/PageBoundary | Outcome feedback and error recovery |

Paths in this map are under src/. Typed ERP shadcn exports currently declared in index.d.ts are Button, Input, Badge, Switch, Dialog family and Table family. The compiled library also contains many additional runtime exports; the generated inventory lists them separately. They need inspected types and guide-aligned integration before use. Do not assume an installed shadcn registry component is available by name. There is no approved authored ERP Card, Drawer, ActionMenu, TransactionCart or ProductPicker wrapper merely because a plan used those names; bundled Card/Drawer availability alone does not supply the ERP focus, size and workflow contracts. Today Panel and the named cart/picker components are the sources.

Missing visual pattern procedure: identify the nearest family; compose existing primitives with these tokens; add one semantic variant or shared component only when composition cannot represent the need; specify its states/keyboard/i18n/responsive behavior; add it to this guide and regenerate inventory. Record exact additions in review. Do not generate an alternate Button/Input/Modal or bring another component/icon/motion library. Sliders, color pickers, rich-text editors, tree views, maps, kanban, timelines and drag surfaces are not general defaults; use an existing domain component where present, otherwise mark a gap and add only the smallest business-justified extension. Exact money uses a numeric field rather than an imprecise slider.

## 32. AI handoff, change control and verification

AI workflow: read AGENTS.md → this guide → relevant existing contract → actual shared files/reference screen → list component reuse → compose the requested change → verify at required states/languages/viewports → report evidence and gaps. Keep the request's scope. New backend integration, broad visual redesign and changing a token globally are separate changes requiring their appropriate review.

Before writing JSX, map every planned element to an existing family or one named gap. Check default/hover/focus/selected/disabled/read-only/loading/empty/error; amount/phone/date/long Bangla; no results/filter reset; unsaved parent Quick Add; dialog Escape/return focus; mobile touch; light/dark/reduced motion. Describe actual behavior at UI-preview level without claiming production posting.

Update docs/ui/HISABIQ-DESIGN-GUIDE.md as the authored rule source, then run node scripts/sync-design-guide.cjs. It derives the visual guide data and machine inventory from this document and current source; do not edit generated caches by hand. Run the same script with --check to detect drift. Magic Patterns receives the same guide/data version and the relevant source-faithful examples, not a differently worded competing rulebook. Keep previous versions available in Git history/design timeline. A change log states which rule changed and which components migrate.

Required relevant checks: TypeScript, build, lint for changed code, npm run check:ui-contract, guide sync --check and focused browser checks of the guide and touched business surfaces. Use npm run test:field-size-parity for controls, test:table-typography for table roles, test:motion-navigation for tabs, and the domain's existing browser scripts when those components change. Do not run every ERP workflow for a guide-text-only edit. Record commands, passed/failed/blocked results, widths, languages/themes and pre-existing failures. A source inventory is not rendered verification.

Acceptance checklist: one guide version; existing brand identity; full tokens; complete shared family inventory; states; buttons/inputs/choices; dates/menus/overlays; cards/tables/filters; navigation/responsive rules; motion; icons; Bangla; financial/cart patterns; report/print/import/auth/settings context; accessibility; extension policy; actual evidence. There is always room for a future business feature, but a future AI should select and compose the declared system instead of inventing a look.

Current change log: v2.1 adds screenshot-complete live specimens, exact relationship-dependent Party action rules, the visual glyph atlas, a shared Reports column chooser and labelled future feedback compositions. v2.0 consolidates binding 36px/48px and 13/12/11 rules, replaces ambiguous identity specimens as implementation instructions, inventories current tokens/components/icons, specifies missing states and composition defaults, and documents known gaps without claiming their migration is done. It does not change ERP-wide transaction behavior, authentication guarantees or backend posting.

### Settings and document compositions — 27 October 2026

Settings uses the existing field/button/select/dialog families. `src/settings/FinancialTerminologySettings.tsx` and `src/financial-display/model.ts` supply context-owned names/helpers and whole-column order; the library specimen uses isolated sample state. `DocumentDesignSettings` and `OutputDesignSettings` use the same `InvoiceDocument`/report rendering paths as print. These are local UI-preview consumers, not production authorization, financial posting or payment fulfillment. NestSherERP roles/permissions are ported through `src/settings/rbac.ts`, preserving legacy multi-role records; real reauthentication remains a server boundary. Business Pad applies its content-start offset once. Settings changes never rewrite historical financial facts.


### Settings responsive navigation — 28 October 2026

Settings follows Party's actual viewport bands: phone below 768px, tablet 768–1023px, desktop at 1024px and above. The 900px Party content-fit rules do not define a desktop band, and Settings must not introduce an 800px device cutoff. `SettingsTabs` reuses `useMediaQuery`, `MotionTabList` and `MotionTabIndicator`; its nested strip becomes a left list only at desktop `lg`. Main sections remain horizontal underline tabs. The selected section is the page title. Business/invoice sub-pages and employee/role views keep their parent draft across navigation and resizing; sections without multiple sub-pages retain full width. Search reveals the target sub-page. Preserve the same fonts, 36px controls, permissions, shared Save and conflict/dirty guards in each band.


### Settings library, recovery and document language — 28 October 2026

The approved desktop Settings sidebar reuses Reports' `WorkspaceLibrary`: 215px column, inset search, quiet group text, compact neutral rows and a subtle teal selected surface. No underline in the vertical library; compact screens retain Party underline sub-tabs below 1024px. `WorkspaceToolbar` is the actual shell shared with ReportToolbar, employee search and activity controls. Global Search settings lives in the page header immediately before Preview as; do not add another full-width search toolbar below the tabs. Results open in a bounded, scrollable header dropdown; retain the shared clear action, keyboard access, Escape and existing draft guards. Horizontal Settings tabs show shared left/right icon buttons only on overflow, disabled at their respective ends. These controls scroll without selecting another section; desktop vertical libraries have no scroll arrows. Show filters/columns/date only for their real data: employee name/email/roles/status/joined date, or actual activity date/section. Old employees have no inferred joined date; new employee entry defaults to Dhaka Today. Resizing/navigation/search never resets the parent draft.

`EmployeeDirectory` retains permission-gated view/edit actions, multiple role assignments, staged Save and a protected identity/actions column chooser. Its column preference follows Reports' URL-view approach (`employeeColumns`) without changing business settings. `SettingsActivity` uses the actual shared date range picker and `ColumnVisibilityEditor`. The date picker portal stays inside a native modal dialog when opened there, so it remains selectable and Escape returns focus.

Encrypted SQL backup is an explicitly scoped Settings snapshot, not a full ERP/server database dump. It contains business settings, designs, roles, employees and activity only. `SettingsSqlBackup` uses `sqlBackup.ts`: authenticated AES-256-GCM, PBKDF2-SHA-256, fresh random salt/IV and a user-held secret of at least 12 characters. Never embed/store/log a universal key. Import parses only the declared HisabIQ SQL snapshot grammar, never executes uploaded SQL, validates business/schema/roles and enters the existing owner-authorized, revision-checked restore review. Existing JSON backup remains compatible. Missing key and damaged files preserve current settings.

Standard, Classic and Compact invoice templates support Full English, Full Bangla and English with secondary Bangla helpers, independently of app language. `InvoiceDocument` renders actual helper spans and stored product translations; `AmountInWordsDisplay` accepts an explicit document language while its existing callers retain Bangla by default. Full English localizes the default footer and amount words; custom names/notes remain their entered values. The same renderer supplies preview and print; captured historical designs remain unchanged.
