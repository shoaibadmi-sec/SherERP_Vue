# Approved Settings library and toolbar

Approved 28 October 2026: reuse Reports → Report Library's actual sidebar and toolbar composition. Keep selected section title, primary underline tabs and Party's 768/1024px bands.

1. Extract the existing Reports sidebar/search and toolbar shells into shared components. Consume the same shells from Reports and Settings; desktop sidebar is 215px, neutral rows with quiet teal selection and no bottom underline. Phone/tablet keep horizontal sub-tabs. Sidebar search filters navigation without changing drafts.
2. Wrap Settings search in the shared toolbar. Employees gain working name/email/role search, role/status filters, protected identity/action columns, reset and pagination. Keep existing RBAC, multiple roles and staged Save. Column preferences use the existing URL approach used by Reports. Do not invent phone/joined fields absent from employee records.
3. Add search, actual Asia/Dhaka event-date range, section filters and columns to existing Settings activity. Use shared date range picker and column chooser. Update the visual specimen/guide and verify Reports plus Settings in phone/tablet/desktop, keyboard, light/dark and bilingual modes.

No backend/security/financial change. The mockup's joined-date control is applied to real Settings activity dates instead; existing employee data has no joined date. No decorative comparison/saved-view actions on forms. No merge is included.

## Approved follow-up: details, recovery and document languages

- Add optional `joinedDate` to employees, strict calendar validation and an editable shared date picker. New employee defaults to Dhaka Today; old employees remain unknown until entered. Add actual joined-date filtering and an optional Joined column.
- Add encrypted SQL settings snapshots, using browser Web Crypto AES-256-GCM, a fresh random salt/IV and PBKDF2-SHA-256 derived user-held HisabIQ secret key. Never embed a universal key, persist the key or run uploaded SQL. Parse only the exact HisabIQ snapshot format, validate tenant/schema/roles, show review, and use existing authorized, revision-checked restore. State explicitly that a browser Settings snapshot includes preferences, roles, employees and activity; full server database backups remain a backend feature. Preserve existing JSON compatibility.
- Improve the existing three invoice templates with discoverable language presets: Full English, Full Bangla and English with Bangla helpers. Render bilingual labels as real secondary helper text, localized SKU and language-aware amount-in-words. Preserve user-entered record names and historical document snapshots; no invented translations.

Review focus: SQL tampering/wrong keys/oversized files, unknown historical joined dates, save-time RBAC, document language leakage, navigation focus and hidden columns, draft survival and responsive overflow. No server or production database claims.
