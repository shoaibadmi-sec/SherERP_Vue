# HisabIQ ERP — Control Size Contract
**Updated 2026-10-25.** This supersedes the earlier all-buttons-at-36px decision, which overrode the original Magic Patterns Brand Guide's 48px checkout action.

## Canonical dimensions
| Control | Visual height |
| --- | --- |
| Regular primary, secondary, outline, destructive, toolbar, small, icon, filter and dialog Button | **36px** |
| Single-line Input, search, date, numeric, native/select/combobox, joined money+unit shell | **36px** |
| Explicit major transaction completion/review CTA (POS sale, purchase, sales return) | **48px** |
| Calendar day, checkbox/radio, drag handle, numeric stepper half-buttons, calculator key, multiline content and rich list rows | Intrinsic / context-specific |

The 48px exception requires `data-erp-workflow-action="complete"` on an existing shared Button. It must not follow automatically from green/teal color, `variant="default"`, `size="lg"`, screen width or English/Bangla choice. One clear terminal action is the target, not every Save, Confirm, Cancel or inline action.

Use `--erp-control-height: 36px` and `--erp-workflow-action-height: 48px` in `src/index.css`. Preserve all shared controls, focus styling, price/quantity interactions and multi-unit behavior. Avoid a broad mobile `min-height: 44px` because that previously distorted compact rows. Respect adequate touch spacing around 36px buttons.

Keep separate table typography authority: **Products** data 13px, heading 12px, helper/badge 11px. Geist/Hind Siliguri, proportional digits, colors, margins and rounding remain unchanged.

## Release checks
Run `npm run check:ui-contract` (includes cheap semantic CTA tests), `npm run test:field-size-parity` (normal 36px / explicit CTA 48px at 390/768/1440), `npm run test:field-alignment`, `npm run test:table-typography`, and `npm run build`. Inspect opened POS, purchase and Sales Return flows in both themes and all language modes.

## History
The 2026-10-23 work fixed real inconsistencies between ordinary inputs, buttons, selects and native controls. Its 36px baseline remains binding for *ordinary* controls. The historic module-by-module audit is retained, but its earlier prohibition on all taller transaction buttons is no longer current policy.
