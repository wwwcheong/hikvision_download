---
title: 'Show Download Queue on Login'
slug: 'show-download-queue-on-login'
created: '2026-02-01T00:00:00.000Z'
status: 'Completed'
stepsCompleted: [1, 2, 3, 4]
tech_stack: ['React', 'MUI', 'Axios', 'date-fns']
files_to_modify: ['frontend/src/App.jsx', 'frontend/src/components/ResultsTable.jsx', 'frontend/src/components/DownloadQueueMonitor.jsx', 'frontend/src/components/DownloadQueueMonitor.test.jsx']
code_patterns: ['Component Extraction', 'Conditional Rendering', 'Lifted State', 'Material UI Stack/Box']
test_patterns: ['Jest', 'React Testing Library', 'renderHook']
---

# Overview

## Problem Statement
The download queue persistence allows downloads to resume after a page refresh and login. However, the UI for the download queue is currently nested inside the `ResultsTable` component. This means the user cannot see the progress or status of resumed downloads until they perform a new search, which is confusing and makes the feature feel broken or invisible.

## Solution
Extract the download queue UI (progress bars, status text, "Cancel All", and "Retry" buttons) into a standalone `DownloadQueueMonitor` component. Render this component in `App.jsx` whenever credentials are present, ensuring it's visible even without active search results.

## Scope

### In Scope
- Create `frontend/src/components/DownloadQueueMonitor.jsx`.
- Extract progress calculation and UI logic from `ResultsTable.jsx` to the new component.
- Modify `App.jsx` to render `DownloadQueueMonitor` below the connection/search section.
- Clean up `ResultsTable.jsx` to focus only on search results and selection.
- Create unit tests for `DownloadQueueMonitor`.

### Out of Scope
- Modifying `useDownloadQueue` hook logic.
- Changing how search results are fetched.
- Styling changes beyond moving existing elements.

# Context for Development

## Codebase Patterns
- **Lifting State**: `App.jsx` holds `downloadState` via `useDownloadQueue` hook.
- **MUI Usage**: Consistent use of `Box`, `Stack`, `Typography`, `LinearProgress`, and `Button`.
- **Conditional Rendering**: `App.jsx` uses logical `&&` for rendering sections based on `credentials` and `results`.
- **Hook Data**: `useDownloadQueue` returns an object with `queue` (array) and various status/action properties.

## Files to Reference
| File | Role |
| :--- | :--- |
| `frontend/src/hooks/useDownloadQueue.js` | Source of truth for queue data and actions. |
| `frontend/src/App.jsx` | Orchestrates high-level layout and state distribution. |
| `frontend/src/components/ResultsTable.jsx` | Current home of queue UI; target for extraction. |

## Technical Decisions
- **Independence from Search**: `DownloadQueueMonitor` will render if `credentials` exist and `queue.length > 0`, regardless of whether `results` (search results) exist.
- **Component Props**: `DownloadQueueMonitor` will accept `downloadState` as a single prop to avoid spreading every individual state piece.
- **Visibility Logic**: The component will return `null` if the queue is empty, handling its own visibility logic internally rather than relying solely on the parent.

# Implementation Plan

- [x] Task 1: Create `DownloadQueueMonitor` Component
  - File: `frontend/src/components/DownloadQueueMonitor.jsx`
  - Action: Create new component.
  - Detail: Copy the "Batch Actions & Progress" logic from `ResultsTable.jsx`. Implement `activeProgress`, `completedCount`, etc. Accept `downloadState` and `onCancelAll` props. Ensure it returns `null` if `queue.length === 0`.
  - Verification: Component renders nothing when queue is empty, renders UI when queue has items.

- [x] Task 2: Create Unit Tests for Monitor
  - File: `frontend/src/components/DownloadQueueMonitor.test.jsx`
  - Action: Create test file.
  - Detail: Test cases:
    1. Returns null when queue is empty.
    2. Renders progress bar when `isProcessing` is true.
    3. Renders error message and "Retry" button when `errorCount > 0`.
    4. Calls `onCancelAll` when "Cancel All" is clicked.

- [x] Task 3: Integrate Monitor into `App.jsx`
  - File: `frontend/src/App.jsx`
  - Action: Import `DownloadQueueMonitor`. Render it after `<SearchForm />`.
  - Detail: Pass `downloadState` and `onCancelAll={() => setOpenCancelDialog(true)}`.
  - Condition: Render inside `credentials` check, but outside `results` check.

- [x] Task 4: Clean up `ResultsTable.jsx`
  - File: `frontend/src/components/ResultsTable.jsx`
  - Action: Remove the extracted UI code.
  - Detail: Delete the "Batch Actions & Progress" section. Remove unused progress calculation variables. Keep the "Download Selected" button logic.

# Acceptance Criteria

- [x] AC 1: Queue Visibility on Login
  - Given the user has resumed a session with pending downloads (queue not empty),
  - When the user logs in (connects) but hasn't searched yet,
  - Then the `DownloadQueueMonitor` should be visible showing the queue status.

- [x] AC 2: Empty Queue Visibility
  - Given the download queue is empty,
  - When the user is logged in,
  - Then the `DownloadQueueMonitor` should NOT be visible.

- [x] AC 3: Download Trigger
  - Given search results are displayed,
  - When the user clicks "Download Selected",
  - Then the items are added to the queue AND the `DownloadQueueMonitor` appears/updates immediately.

- [x] AC 4: Progress Tracking
  - Given active downloads,
  - When progress updates,
  - Then the `DownloadQueueMonitor` accurately reflects current file progress and batch completion status.

# Testing Strategy

- **Unit Tests**:
  - `DownloadQueueMonitor.test.jsx`: Verify rendering conditions and event handling.
- Manual Verification:
  - Start a download -> Reload page -> Login -> Verify Monitor appears immediately.
  - Clear queue -> Verify Monitor disappears.

## Review Notes
- Adversarial review completed
- Findings: 3 total, 3 fixed, 0 skipped
- Resolution approach: auto-fix