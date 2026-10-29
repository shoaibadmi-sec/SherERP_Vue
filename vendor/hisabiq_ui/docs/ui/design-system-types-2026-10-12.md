# Exported design-system type contract

Adds accurate React props and forwarded refs for the sixteen components currently imported through HisabIQ's shared Button/Input/Dialog/Table/Badge/Switch wrappers. Declares the actual generated Button variants/sizes, native input/DOM handlers and Switch checked behavior; publishes the declaration through the package `types` field. The runtime design bundle and visual output are unchanged.

Missing package declarations caused missing-export and cascading implicit-any diagnostics across the project. This slice removes those diagnostics without disabling strict checking or casting application data to any.

TypeScript still reports existing unused imports/declarations and several real source issues: missing Party credit/refund capabilities, incomplete Vendor command narrowing, Audit opening-balance permission types, object options in the FormSelect adapter, missing Party type import and a duplicate impact label (handled separately by the ledger slice). This PR does not claim the entire compiler gate passes. Remaining diagnostics are recorded by `npx tsc --noEmit`.

Build and UI contract pass. Type declaration lint passes. Separate source cleanup is needed before TypeScript/lint become mandatory clean CI gates.
