# HisabIQ — Magic Patterns brand realignment, phase 1
**Date:** 2026-10-25. **Magic Patterns access:** reference files and editor read-only; no generation, prompt, new artifact, or credits.

## Verified sources
- Original Ghost starter: https://www.magicpatterns.com/c/t6q3mxi6nhuak3qjvx8cwn
- The provided `magic-patterns.zip` reproduces the starter Brand Guide and checkout. `src/components/brand/PrimitivesSection.tsx` explicitly calls for a large **48px Complete Sale** button. Original POS checkout also used `h-12`.
- Current production `src/index.css` had universal 36px `!important` plus `max-height`, overriding even the existing purchase `h-12` action; the POS action was itself changed to `h-9`.

## Approved hierarchy
- **36px:** all ordinary Button and Input controls, date/dropdown/search/number controls, filters, utility icons, toolbar, More, modal Save/Cancel. Same on desktop, tablet, mobile.
- **48px:** explicitly designated *major end-of-workflow* transaction action. In this phase: POS sale preview/complete, purchase review/complete, sales return complete/preview. Only use `data-erp-workflow-action="complete"`. Never enlarge all teal/green, primary, or `size="lg"` buttons.
- **Not normalized:** rich rows, tab panels, calculator, numeric arrows, multiline text, calendar days and card navigation. Keep compact mobile rows free of global 44px minima.

## Brand guide invariants
Keep Ink/Teal/Mint color tokens and semantic success/warning/danger; Geist and Hind Siliguri; shadcn-style borders/radii/focus; Taka notation and right-aligned proportional/tabular numbers; English plus helpful short Bangla labels. Keep the newly approved **Products table typography 13px data / 12px headings / 11px helper and badges** rather than restoring old demo table text sizes.

## Module-by-module visual review matrix
| Module | Source-of-truth details | Remaining rendered audit |
| --- | --- | --- |
| POS / checkout | Shared sale cart, 48px primary completion/review CTA | Payment split, F9, Bangla wrap, sticky panel at 390/768/1440 |
| Purchases | Shared purchase cart and 48px completion CTA | Supplier, lot/serial inputs, correction/confirmation views |
| Sales / returns | Compact history and 48px end-of-return CTA | Batch return, bundle preview, action row overflow |
| Products | Full-page Add Product and 36px fields | Unit/brand/category creation, advanced form and table density |
| Parties / ledger | Compact table, semantic balance colors | Print/Clear/More 36px, mobile icon spacing |
| Counter / Finance | Common payment forms and 36px ordinary controls | Review terminal CTAs individually before opting into 48px |
| Dashboard / Reports / Daybook | Consistent brand colors and Products table typography | Grid/cards, chart types, badges, filter and export |
| Settings / Auth | Standard shared 36px fields and buttons | Dialog states and multilingual labels |
| Navigation / overlays | Existing animations and tokens | No page shift on modal opening, keyboard focus and dark mode |

## Scope and verification
This PR changes *only* completion CTA sizing, a brand guide description, its contracts and tests. It does not rewrite business workflows, add mock data, alter fonts/colors/table density, or modify Magic Patterns. Full pixel-by-pixel module parity is not yet certified from GitHub source alone. Before merge: `npm run check:ui-contract`, `npm run test:field-size-parity`, `npm run test:field-alignment`, `npm run test:table-typography`, `npm run build`; manually inspect live checkout/returns in both themes, English/Bangla, phone/tablet/desktop.
