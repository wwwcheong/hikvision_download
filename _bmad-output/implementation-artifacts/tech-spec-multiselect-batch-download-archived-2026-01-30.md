---
title: 'Multiselect Batch Download'
slug: 'multiselect-batch-download'
created: '2026-01-30T00:00:00.000Z'
status: 'Completed'
stepsCompleted: [1, 2, 3]
tech_stack: ['React', 'MUI v7', 'Axios', 'Vite']
files_to_modify: ['frontend/src/components/ResultsTable.jsx', 'frontend/src/hooks/useDownloadQueue.js']
code_patterns: ['Functional Components', 'Custom Hooks', 'MUI Table Components']
test_patterns: ['Vitest', 'React Testing Library']
---

# Overview

## Problem Statement
Users currently have to manually click the "Download" button for every single recording they want to save. This is inefficient and tedious when retrieving multiple segments.

## Solution
Implement a multiselect interface in the `ResultsTable` that allows users to select multiple recordings (via checkboxes or row clicks) and trigger a batch download. The system will process these downloads sequentially (one after another) to ensure stability and reliability.

## Scope
### In Scope
- Add checkbox column to `ResultsTable`.
- Implement "Select All" functionality in the table header.
- Allow row clicking to toggle selection (checking/unchecking the box).
- Add a "Download Selected" button (visible only when items are selected).
- Implement a sequential download queue manager (`useDownloadQueue` hook) in the frontend.
- **Critical Fix**: Use a hidden `<a>` tag click method instead of `window.open` to avoid pop-up blockers.
- **Critical Logic**: Request download tokens *just-in-time* before each file download (not all at once) to avoid the 30-second expiry.
- Display progress/status of the batch operation (e.g., "Downloading 1/5...").

### Out of Scope
- Server-side ZIP generation.
- Merging video files.
- Background downloads (must keep tab open).

# Context for Development
- **UX Preference**: Row click toggles selection.
- **Download Strategy**: Strict sequential processing (wait for finish before starting next).
- **Token Strategy**: Lazy token fetching (fetch -> download -> wait -> fetch next).
- **Browser Safety**: Use anchor tag download attribute; avoid `window.open` loops.
- **State Management**:
    - `selectedIds`: Set/Map for O(1) selection lookup.
    - `queueStatus`: Tracks 'pending', 'active', 'completed', 'failed' per item.

## Technical Decisions
- **Hook Extraction**: Create `frontend/src/hooks/useDownloadQueue.js` to isolate the complex sequential download logic (queue management, token fetching, retry safety) from the UI.
- **UI Components**: Use MUI `Checkbox` for selection and `LinearProgress` (or similar status indicator) for batch progress.
- **Selection State**: Local state in `ResultsTable` is sufficient as selection doesn't need to persist across searches.

# Implementation Plan

- [x] Task 1: Create `useDownloadQueue` Hook
  - File: `frontend/src/hooks/useDownloadQueue.js`
  - Action: Implement a custom hook that accepts a list of items and credentials.
  - Logic: 
      - State: `queue` (array of items with status: pending, downloading, completed, error).
      - Function: `addToQueue(items)` adds items to the queue.
      - Function: `processQueue()` (internal effect) picks the next 'pending' item.
      - Logic: Fetch token -> Create hidden `<a>` -> Trigger click -> Wait -> Mark complete -> Trigger next.
      - **Crucial**: Ensure `processQueue` waits for the download to at least "start" (token fetch success + minimal delay) before moving to next.

- [x] Task 2: Update `ResultsTable` with Selection Logic
  - File: `frontend/src/components/ResultsTable.jsx`
  - Action: Add `selectedIds` state (Set).
  - Action: Add `handleSelectAll` and `handleSelectRow` functions.
  - Action: Update table columns to include a checkbox at the start.
  - Action: Make `TableRow` clickable to toggle selection (ignoring clicks on the "Action" button itself).

- [x] Task 3: Integrate Download Queue in UI
  - File: `frontend/src/components/ResultsTable.jsx`
  - Action: Import and use `useDownloadQueue`.
  - Action: Add a "Download Selected ({count})" button above the table (or in header).
  - Action: Replace the individual row "Download" button logic to use the queue (add single item to queue) to ensure consistent behavior.
  - Action: Add a status bar/indicator showing "Downloading X/Y...".

- [x] Task 4: Fix Pop-up Blocker Issue
  - File: `frontend/src/hooks/useDownloadQueue.js` (or wherever download triggers)
  - Action: Instead of `window.open`, dynamically create:
    ```javascript
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename); // essential for direct download
    document.body.appendChild(link);
    link.click();
    link.remove();
    ```

# Acceptance Criteria

- [ ] AC 1: Select/Deselect Rows
  - Given I see a list of recordings, when I click a row or checkbox, then the row is selected/deselected.
  - When I click "Select All" in the header, then all visible rows are selected.

- [ ] AC 2: Batch Download Trigger
  - Given I have selected 3 recordings, when I click "Download Selected", then 3 separate download files start arriving.
  - Then the downloads happen one by one (or with a small stagger), NOT all at once.

- [ ] AC 3: Sequential Processing
  - Given a batch of 10 items, when the download starts, then the system requests a token for Item 1, downloads it, waits, then requests token for Item 2.
  - Then I do NOT get 401/403 errors for "expired token" on the 10th item.

- [ ] AC 4: Pop-up Blocker Safety
  - Given I am on a standard browser (Chrome/Firefox) with default settings, when I batch download, then the browser does NOT block the files as "pop-ups".

- [ ] AC 5: Progress Feedback
  - Given a batch is running, when a file is downloading, then I see which file is currently active.
  - Then I can see how many are left.

## Review Notes
- Adversarial review completed
- Findings: 10 total, 5 fixed, 5 skipped
- Resolution approach: auto-fix
