# Strict frontend quality gates

Remove compiler-proven unused import bindings using TypeScript's own import fixes; retain module initialization when a relative runtime import loses every binding. Remove six unused local declarations: keep the tenant-settings hook, remove only unused unit-factor calculations and unreachable callbacks, and remove the pure unused Vendor snapshot getter read. Remove the duplicate Audit note label while retaining its existing effective Internal note label (same correction as #70).

No compiler or authored lint rule is relaxed. UI Check now runs strict TypeScript and authored-source lint before the existing contract, helper and browser checks. This depends on #78's accurate design declarations and substantive contract repairs.

Validation: strict TypeScript passes, authored lint has zero errors (existing warnings remain), build and UI contract pass, 335 helper tests pass on this branch. Verify the combined pending Vendor/mobile/Finance changes independently before merging. This mechanical cleanup does not complete unfinished source editors or backend posting.

Reuse: all existing cart, picker, receipt and payment components remain unchanged in behavior; no replacement UI. No main-branch merge is authorized.

CI resize regression: reproduced an 880px viewport with the drawer still reporting its previous 812px height immediately after resize. Reuse #70's condition-based viewport/layout wait in the navigation browser check. All fullscreen, width, portal, scroll-lock and tap-interception assertions remain intact. This does not change application layout or weaken assertions.
