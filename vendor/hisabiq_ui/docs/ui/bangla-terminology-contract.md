# HisabIQ Bangla terminology — phase 1

The ERP has three existing preferences: **English + Bangla** (default), **English** and **Bangla**. Use the existing `personal.language`; never add another language switch or translate stored transaction values, method IDs, invoice status codes or option identifiers.

This phase introduces `src/i18n/uiCopy.ts` and `src/i18n/useUiCopy.ts` for *rendered* text. English + Bangla retains the existing English primary label and a secondary Bangla helper only where the component has one. English hides that helper. Bangla displays the Bangla primary label. Larger untranslated workflows are **not** certified complete.

## Canonical everyday words

| Meaning | Bangla interface | Accounting/formal notes |
| --- | --- | --- |
| Product | পণ্য | Never মাল for goods |
| Stock | স্টক | মজুত in formal inventory reports |
| Sales | বিক্রি | বিক্রয় in formal records |
| Purchases | কেনাকাটা / পণ্য কেনা | ক্রয় বিল in formal documents |
| Customer due | ক্রেতার কাছে পাওনা / বাকি | Never describe this as supplier payable |
| Supplier payable | সরবরাহকারীকে দেনা | Distinguish credit and advance |
| Receive payment | টাকা নিন | A receipt, not an invoice creation |
| Pay supplier | সরবরাহকারীকে টাকা দিন | A payment, not goods return |
| Return goods to vendor | পণ্য ফেরত দিন | Direction matters |
| Receive goods back from vendor | পণ্য ফেরত নিন | Direction matters |
| Discount | ছাড় | Distinguish cash discount and noncash settlement |
| Reconciliation | হিসাব মেলানো | Formal: reconciliation |
| Quotation | কোটেশন | It is non-posting |
| Walk-in customer | সাধারণ ক্রেতা | Do not infer a ledger Party |
| Cash | ক্যাশ | Distinct from Nagad mobile wallet |
| Vendor | ভেন্ডর লেনদেন | Page helper: পণ্য নেওয়া-দেওয়া ও হিসাব |
| Gross profit | বিক্রির মোট লাভ | Never conflate with net profit |
| Opening balance | শুরুর জের | Customer's opening due may use আগের বাকি |
| Data import | Excel থেকে ডেটা আনুন | Upload is not the same as an import |
| Data export | ডেটা ডাউনলোড করুন | Actual export/download only |

## UX and financial safeguards

- Keep POS and Purchase transaction cart implementations and keyboard focus behavior unchanged.
- Do not translate payment-method **values**; only displayed labels.
- Do not translate audit, source or persisted ledger identifiers.
- Preserve the `UI preview only` distinction whenever real posting is absent.
- Bangla size adjustments must be measured; no global 15px increase in this phase.
- Before merge, check the three modes at 390×844 and 1440×900 and review light/dark contrast.
- Future slices: Counter error messages and confirmations, Sales list/actions, Expenses forms, Purchases cart, remaining modules, and locale-aware dates/status labels.
