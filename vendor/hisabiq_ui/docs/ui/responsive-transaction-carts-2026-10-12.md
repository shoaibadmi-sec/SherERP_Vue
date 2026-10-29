# Mobile and tablet transaction carts

Uses actual POS CartTable, PurchaseCart and shared TransactionCartEditor (Quotation/Online/Vendor goods). No copied cart, product picker, calculator or posting logic.

Below 1280px, the same numbered row places product/actions first, compound quantity and price unit next, then price/total. Purchase retains both unit cost and lot selling price with labels. Fields have short English/Bangla helpers, editable controls stay inside the row and the inline Add product search fits the screen. Desktop grid, row order, quick-add, compound units, stock shortage, serials, price overrides and all event handlers remain.

Verification: build, 327 helper tests, UI contract and existing Purchase/compound-unit/POS reorder/Quotation/Online Sales journeys. New `scripts/mobile-carts-browser.cjs` checks controls/search/remove and row geometry in light/dark at 390/768/1024/1440px. Mobile POS/Purchase screenshots inspected. Backend integration and global language coverage remain pending.

Depends on the shared responsive/dialog PR; test together before merging. No merge authorized.
