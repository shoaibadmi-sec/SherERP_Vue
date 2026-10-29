# Settings navigation — Party breakpoint alignment

The user-approved responsive design uses Party's existing viewport rules, not an 800px cutoff.

| Band | Source | Settings behavior |
| --- | --- | --- |
| Phone: below 768px | `Parties.tsx` tablet query; Tailwind `md` | Scrollable underline main/sub-tabs; stacked controls and fields. |
| Tablet: 768–1023px | `Parties.tsx`; `PartyDetailResponsive.tsx` | Compact underline tabs; fields may use two readable columns. |
| Desktop: at least 1024px | `PartyDetailAdaptive.tsx`; Tailwind `lg` | Main tabs above; sub-settings list left and editor right where sub-settings exist. |

Party's 900px content adjustments and 1280px directory sizing are local fit rules, not additional device bands. Reuse `useMediaQuery`, `MotionTabList`, `MotionTabIndicator` and existing Settings controls. Keep one editor mounted across viewport changes so resizing never discards drafts or changes permissions.

Implementation: selected section title at the top; remove the section dropdown and category disclosure; compact preview/employee/mode controls; business and invoice sub-pages and existing employee/role tabs use responsive navigation. Sections without sub-pages retain full editor width. Search must reveal the right sub-page, and parent Save validates the complete draft.

Verification: inspect both sides of 768px and 1024px, plus 799/800px to reject the previous assumption; check long Bangla, light/dark, keyboard tabs, horizontal scrolling, unsaved changes and draft preservation during resize. Update existing navigation/browser checks and the design guide.

Main tabs retain keyboard focus after route changes, including navigation resumed through the dirty guard. Selected horizontal tabs remain visible after resizing and language changes. Nested-tab changes keep the section draft; shared Save validates every sub-page.


Approved library follow-up: desktop lists use the actual 215px Report Library shell with sidebar search and teal row selection; horizontal compact tabs retain their underline. WorkspaceToolbar is shared with Reports. Employee and activity filters act on their own lists; form search stays separate. No 800px breakpoint was introduced.


Header/search follow-up: global Search settings is compact in the header before Preview as and wraps to full width below 768px. The previous full-width search/card below the category tabs is removed. Sidebar and employee searches remain local to their content. Search results retain subsection reveal and dirty guards in a bounded dropdown, with keyboard clear/result access and Escape focus return.

Horizontal Settings tab rows have working ‹ / › shared icon buttons when their labels overflow the available row. Boundary buttons disable, scrolling leaves selection/drafts intact, and touch/trackpad/manual keyboard tabs continue to work. The controls disappear when the whole strip fits, and never appear in the desktop vertical library. Selected tabs are revealed after viewport/locale/selection changes.
