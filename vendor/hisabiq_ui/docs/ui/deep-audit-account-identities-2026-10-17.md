# Finance account identity follow-up — 17 October 2026

This change fixes two browser-reproduced identity mismatches in Finance. Transfers now store source and destination account IDs and post or reverse balances against those IDs. Account names in transfer history and ledgers follow the referenced IDs after a rename. Existing name-only transfer rows resolve to an ID only while the endpoint name is unique; ambiguous legacy rows keep their stored label and are not assigned to an arbitrary duplicate.

Finance transaction corrections keep showing the exact saved inactive account, marked Inactive, while the shared payment-source selector continues to offer only active accounts for new selections. The historical account ID remains unchanged unless the editor explicitly selects another account.

The Playwright regression covers duplicate-name transfers, exact balance movement, rename followed by reversal, transfer ledger filtering, and correction of a transaction whose account has since been deactivated. CI runs the workflows in English, English + Bangla, and Bangla across light and dark themes at 320×700, 360×800, 390×844, 430×932, 768×1024, 1024×768, 1280×800, and 1440×900.

The app currently stores Finance records in local UI state. This change preserves existing IDs and calculations and does not certify backend persistence or server-side audit behavior.
