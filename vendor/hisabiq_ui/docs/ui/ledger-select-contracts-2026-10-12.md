# Ledger actions and value/label dropdown contracts

Supplier credit refunds and customer credit applications were missing from the ledger capability table. Opening their actions could dereference an undefined configuration. Supplier refunds now follow purchase permissions and existing payment correction/reversal; credit application is view/print only because the preview has no source correction command for it. Both have readable ledger labels.

FormSelect now accepts the existing AppSelect string or value/label options. Audit corrections retain the party ID while displaying its name; uncontrolled fields initialize from the first option's value. The correction dialog scrolls within the screen so phone users can reach Cancel and Review. No visual primitives or accounting calculations changed.

Validation: helper capability regression, actual Audit correction selection with pointer and keyboard at 390/768/1024/1440 in light/dark, existing Party payment correction/reversal, build and UI contract. Backend posting and durable audit remain integration work. Existing project-wide TypeScript/lint failures are tracked separately.
