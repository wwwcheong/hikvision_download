# SPEC: Scroll Shadow Indicators

## Overview

Refactors scrollable containers to display visual shadow indicators when content overflows, providing users with clear feedback that more content is available above or below the visible area.

## Changes

### Files Changed
- `frontend/src/index.css` — Added `.scroll-shadows` CSS class
- `frontend/src/components/ResultsTable.jsx` — Separated sticky header from scrollable body
- `frontend/src/components/SidebarFilters.jsx` — Applied scroll-shadows class to filter container

---

## CSS — `.scroll-shadows`

**Purpose:** Adds gradient shadow overlays at top/bottom of overflow containers to indicate scroll position.

**Implementation:** Four layered background gradients using `local` attachment for cover shadows and `scroll` attachment for edge shadows. Shadow opacity fades from 20% black to transparent.

**Applied to:**
- `ResultsTable` scrollable body container
- `SidebarFilters` overflow container

---

## Component: ResultsTable

**Before:** Single `<Box sx={tableScrollSx}>` containing both `<thead>` (sticky) and `<tbody>`.

**After:**
- Header `<thead>` extracted into separate `<Box sx={{ flexShrink: 0, overflow: 'hidden', minWidth: 700 }}>` — non-scrolling, outside the scroll container
- Body wrapped in `<Box sx={tableScrollSx} className="scroll-shadows">` — scrolls independently

**Why:** Sticky header inside a scrolling container produces unreliable scroll shadow behavior. Separating them allows the body scroll to trigger shadows independently.

---

## Component: SidebarFilters

**Before:** `overflowY: 'auto'` on filter container Box.

**After:** Removed `overflowY: 'auto'`, added `className="scroll-shadows"` — leverages the CSS class for overflow handling and shadow rendering simultaneously.

---

## Acceptance Criteria

- [x] Scroll shadow gradients visible at top when scrolled down (content below)
- [x] Scroll shadow gradients visible at bottom when scrolled up (content above)
- [x] No shadows when content fits entirely within viewport
- [x] ResultsTable header remains fixed while body scrolls
- [x] SidebarFilters shows scroll shadows when content overflows
