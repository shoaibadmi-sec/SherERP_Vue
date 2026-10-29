# Cheque and bank-account identity audit — 17 October 2026

## Findings

**CHQ-ID-01 · P0 · Account rename can change a cheque's financial source.** A cheque stored its deposit account only as a display name. In Playwright, I created a second bank with the same name as the seeded Dutch-Bangla account, renamed the second bank, then opened cheque `458923`. Its detail changed to the renamed duplicate even though it had been linked to the original account. The clearance handler also resolved and moved money by that ambiguous name, so the wrong bank could receive the cleared amount.

**FIN-ACT-01 · P1 · Bangla account actions shared a misleading accessible name.** At 320×700 through 430×932 in Bangla, Playwright tapped the account dialog's “Close” name and opened the account deactivation confirmation instead. Both **Deactivate** and **Close** were labeled `বন্ধ করুন`.

## Changes

- Cheque records retain both the account display name and stable `depositAccountId`. New cheques select an account by ID; duplicate account labels include a distinct account number or ID suffix.
- Existing seeded cheque rows now carry their known account IDs. Legacy name-only records resolve only when exactly one bank matches. Ambiguous legacy sources cannot clear until an account is explicitly selected.
- Account rename updates cheque references by account ID; it upgrades a legacy name-only reference only if the old bank name was unique. Clearance resolves the same ID and moves only that account's balance.
- Editing preserves the selected bank identity and can retain a currently linked inactive account while preventing it from being used for a new clearance.
- Account and Finance people deactivation controls use `নিষ্ক্রিয় করুন` / `সক্রিয় করুন`, distinct from the Close action.

## Verification

`scripts/deep-cheque-account-identity-browser.cjs` covers new duplicate-bank selection, account rename, existing and new cheque details, clearances, balance deltas, account action labels and scoped axe checks. The full matrix passed **48/48** journeys at 320×700, 360×800, 390×844, 430×932, 768×1024, 1024×768, 1280×800 and 1440×900 in light/dark and English, English + Bangla and Bangla. It recorded 12 scoped axe scans with zero violations and no browser runtime errors. Touch was used through 1024px.

The existing cheque lifecycle smoke passed 12/12 journeys after the identity change; the existing nested Finance people/account smoke passed 10/10 journeys after the Bangla action-label change. The unit suite passed 122 files; TypeScript, lint (0 errors, 185 existing warnings), UI contract and production build passed. The build reports the existing large-chunk advisory. Focused unit tests cover ID-first resolution, ambiguous legacy rejection, unique legacy migration on rename, and inactive account clear blocking. `npm run test:cheque-account-identity` reruns the browser matrix locally.

This is local React preview state, not backend persistence or authenticated bank posting. Physical keyboard behavior, downloaded font rendering, actual banking integrations and manual screen-reader operation remain outside this audit slice. No PR was merged.
