---
title: 'download-monitor-sticky-bottom'
type: 'feature'
created: '2026-04-30'
status: 'done'
route: 'one-shot'
---

## Intent

**Problem:** The DownloadQueueMonitor was pushed down when loading or error sections appeared in the main content area, making it less visible during active downloads.

**Approach:** Wrapped the scrollable content area (results, loading, error states) in a flex-grow Box with overflow-auto, keeping the DownloadQueueMonitor as a fixed bottom sibling in the flex column.

## Code Map

- `frontend/src/App.jsx:163-301` -- Restructured Main Content flex layout so DownloadQueueMonitor stays pinned at bottom

## Tasks & Acceptance

**Execution:**
- [x] `frontend/src/App.jsx` -- Wrap scrollable content in flex-grow Box with overflow-auto -- ensures content scrolls internally
- [x] `frontend/src/App.jsx` -- Move DownloadQueueMonitor outside scrollable area as bottom sibling -- monitor always visible

**Acceptance Criteria:**
- Given loading state is active, when rendered, then DownloadQueueMonitor remains visible at bottom
- Given error state is active, when rendered, then DownloadQueueMonitor remains visible at bottom
- Given results are displayed, when user scrolls, then DownloadQueueMonitor stays fixed at bottom

## Verification

**Manual checks (if no CLI):**
- Inspect `frontend/src/App.jsx:163-301` for correct flex layout structure with pinned bottom monitor
- Load app, trigger a search with loading state, verify monitor stays visible at bottom
- Trigger an error state, verify monitor stays visible at bottom
