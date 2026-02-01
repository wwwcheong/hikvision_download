---
title: 'Persistent State & Queue Management'
slug: 'persistent-state-queue'
created: '2026-02-01'
status: 'Completed'
stepsCompleted: [1, 2, 3, 4]
tech_stack: ['React', 'MUI', 'axios', 'date-fns']
files_to_modify: ['frontend/src/components/ConnectionForm.jsx', 'frontend/src/components/SearchForm.jsx', 'frontend/src/hooks/useDownloadQueue.js', 'frontend/src/App.jsx']
code_patterns: ['Functional Components', 'Hooks for State', 'Lifted State in App.jsx', 'Axios for API']
test_patterns: ['Vitest/Jest', 'React Testing Library']
---

## Overview

### Problem Statement
Currently, a page refresh clears all application state. Users lose their connection details (IP/Port/User), their configured search filters, and most importantly, their active download queue. This interrupts workflows and requires repetitive data entry.

### Solution
Implement `localStorage` persistence for key state:
1.  **Connection:** Persist IP, Port, and Username (NEVER password). Pre-fill the form on load.
2.  **Search:** Persist start/end date-times. Reset to "today" if the saved state is older than 1 week.
3.  **Queue:** Persist the download queue. On load, reset any 'downloading' items to 'pending' to allow auto-retry.
4.  **Controls:** Add a "Cancel All" button with a confirmation dialog to clear the queue easily.

### Scope
- **In Scope:**
    - `ConnectionForm.jsx`: Load/Save IP, Port, Username. Show "Restored" indicator when data is loaded.
    - `SearchForm.jsx`: Load/Save date/time values with staleness check. Show notification if filters are reset due to expiry.
    - `useDownloadQueue.js`: Persist queue to `localStorage`. Hydrate queue on mount (interrupted -> pending). Implement `cancelAll`.
    - `App.jsx`: Integrate new queue controls and the "Cancel All" confirmation dialog.
- **Out of Scope:**
    - Saving passwords.
    - Server-side database persistence.
    - Resuming partial downloads (technical constraint: in-memory blob construction).

## Context for Development
- **Security:** Strict requirement to NOT save passwords in `localStorage`.
- **UX (Queue):** Downloads interrupted by refresh should auto-retry from 0 (reset to pending).
- **UX (Feedback):** Explicitly indicate when state has been restored or reset. Temporary Snackbar for "restored" state.
- **UX (Safety):** "Cancel All" requires user confirmation via dialog.
- **Staleness:** Search filters > 1 week old should be discarded in favor of defaults.

## Context for Development (Updated)

### Codebase Patterns
- **State Management:** Local state (`useState`) is used extensively. Some state is lifted to `App.jsx` to coordinate between siblings (`ConnectionForm` -> `App` -> `SearchForm`).
- **Hooks:** Custom hooks (`useDownloadQueue`) encapsulate complex logic.
- **UI Library:** Material UI (`@mui/material`, `@mui/x-date-pickers`) is the standard component library.
- **Date Handling:** `date-fns` is used for date manipulation.

### Files to Reference & Modify
| File Path | Role | Change Strategy |
| :--- | :--- | :--- |
| `frontend/src/components/ConnectionForm.jsx` | Connection UI | Add `useEffect` to load from `localStorage`. Save on successful connect. Add "Restored" Snackbar. |
| `frontend/src/components/SearchForm.jsx` | Search UI | Add `useEffect` to load. Check `differenceInWeeks`. Save on search submit. |
| `frontend/src/hooks/useDownloadQueue.js` | Queue Logic | Sync `queue` state to `localStorage`. On mount, map `downloading` -> `pending`. Add `cancelAll` function. |
| `frontend/src/App.jsx` | Main Orchestrator | Pass `cancelAll` to UI. Manage "Cancel All" confirmation dialog state. |

### Technical Decisions
- **Persistence Key Naming:** Use namespaced keys like `hik_connection`, `hik_search_params`, `hik_download_queue` to avoid collisions.
- **Queue Serialization:** Store the full queue object. On hydration, ensure strictly that `status: 'downloading'` becomes `status: 'pending'` to trigger the `processQueue` effect naturally.
- **Security:** Explicitly exclude `password` field from the saved connection object.
- **Validation:** Add validation on hydration to prevent XSS. If `localStorage` data is malformed or suspicious, silently discard it.

## Implementation Plan

### Tasks
- [x] Task 1: Implement Queue Persistence in `useDownloadQueue`
  - File: `frontend/src/hooks/useDownloadQueue.js`
  - Action: Add `useEffect` to sync `queue` to `localStorage` (key: `hik_download_queue`). Initialize state by loading from `localStorage`, mapping any `downloading` status back to `pending`. Add `cancelAll` function that clears state, `localStorage`, and aborts any active controller.
- [x] Task 2: Implement Connection Persistence in `ConnectionForm`
  - File: `frontend/src/components/ConnectionForm.jsx`
  - Action: Use `useEffect` to load IP, Port, and Username from `localStorage` (key: `hik_connection`) on mount. Save these fields (excluding password) upon successful connection. Add an MUI `Snackbar` to notify the user when details are restored.
- [x] Task 3: Implement Search Filter Persistence in `SearchForm`
  - File: `frontend/src/components/SearchForm.jsx`
  - Action: Save search params + `timestamp` to `localStorage` (key: `hik_search_params`) when a search is triggered. On mount, load if `timestamp` is < 7 days old. If older, keep defaults (today) and show a `Snackbar` notifying the reset.
- [x] Task 4: Integrate "Cancel All" and Confirmation in `App`
  - File: `frontend/src/App.jsx`
  - Action: Manage `openCancelDialog` state. Implement the `Dialog` component. Trigger `cancelAll` from `useDownloadQueue` upon confirmation. Add a "Cancel All" button/link in the results header.

## Review Notes
- Adversarial review completed
- Findings: 4 total, 3 fixed, 1 skipped
- Resolution approach: auto-fix
- Fixed unused prop in ResultsTable, inefficient localStorage usage in cancelAll, and flaky tests.
- Skipped minor optimization in ConnectionForm.

### Acceptance Criteria
- [ ] AC 1: Connection Restoration: Given valid saved data, when the page refreshes, then connection fields are pre-filled and a "Restored" Snackbar appears.
- [ ] AC 2: Search Persistence: Given a recent search, when the page refreshes, then search filters are preserved.
- [ ] AC 3: Search Staleness Reset: Given a search > 7 days old, when the page refreshes, then filters reset to "today" with a notification.
- [ ] AC 4: Queue Recovery: Given an active/pending queue, when the page refreshes, then items are restored as 'pending' and auto-resume.
- [ ] AC 5: Cancel All Queue: Given a non-empty queue, when the user confirms "Cancel All", then the queue is wiped, `localStorage` is cleared, and active requests are aborted.
- [ ] AC 6: No Password Storage: Given any state is saved, when checking `localStorage`, then the `password` field MUST NOT be present.

## Additional Context

### Dependencies
- `localStorage` browser API.
- `date-fns` for staleness calculations.
- MUI `Snackbar`, `Alert`, `Dialog` for feedback.

### Testing Strategy
- **Unit Tests:** Verify `useDownloadQueue` correctly syncs with `localStorage` and handles the `downloading -> pending` transition.
- **Manual Verification:** 
  1. Fill form -> Refresh -> Confirm pre-fill.
  2. Start multi-download -> Refresh -> Confirm auto-resume.
  3. Wait/Simulate 1 week -> Refresh -> Confirm search filter reset.
  4. Inspect `localStorage` via DevTools to confirm no passwords.

### Notes
- High Risk: If `localStorage` fills up (unlikely for this volume), `setItem` might throw. Wrap in try/catch.
- Future: Consider `indexedDB` if queue history grows extremely large, though `localStorage` is sufficient for current scope (~5mb).
