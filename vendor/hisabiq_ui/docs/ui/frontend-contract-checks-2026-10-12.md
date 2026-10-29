# Frontend contracts and lint checks

Keep strict TypeScript and authored-source lint enabled. This slice fixes the substantive failures before the separate unused-import cleanup:

- Use the exact design-package declarations from PR #71. No runtime/library/style changes, broad `any` or strict-mode suppression.
- Audit opening-balance records now fit their real permission-source contract. They still require Audit and Accounts rights; a Finance right cannot authorize them.
- Explicit Vendor settlement mode checks narrow to the actual supported commands. Demo seed commands retain their discriminated types with `satisfies`.
- Vendor unit cost is readonly within a source snapshot; price changes already create audited replacement snapshots. This also makes known-versus-unknown cost narrowing safe in the unpriced settlement UI from #66.
- ES2021 declarations match existing String.replaceAll usage. The JavaScript compilation target stays ES2020; no new runtime feature is introduced.
- Lint excludes only Magic Patterns' precompiled/minified library.js. Its authored declarations, wrappers and actual browser workflows remain checked. Linting compiled minified React names produced false hook/global errors; authored app rules are not relaxed.
- Rename the ordinary credit-consumption function so it is not mistaken for a React Hook; allocation math is unchanged. Preserve phone-regex and SMS ASCII/Unicode behavior with equivalent lint-safe expressions.
- Show notification-rule errors rather than swallowing them. Inline Vendor editors explicitly stay open after save. Test fixtures use const/no-op returns where appropriate.

Validation: opening-balance permission regression plus the full helper suite; authored lint has zero errors. Remaining TypeScript diagnostics are unused declarations/imports and are handled next, with no change to strict compiler options. Recheck Vendor unknown-price/settlement, Party credit/refund, notification/SaaS and module browser journeys before review. Backend posting and unfinished frontend workflows remain separate tasks.

The declarations duplicate PR #71 exactly so this branch is independently checkable. Stack after #77; do not merge without approval.
