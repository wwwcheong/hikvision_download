---
title: 'Clear Completed Downloads Button'
slug: 'clear-completed-downloads-button'
created: '2026-02-05'
status: 'Completed'
stepsCompleted: [1, 2, 3, 4]
tech_stack: ['React', 'MUI', 'Vite', 'Vitest']
files_to_modify: ['frontend/src/hooks/useDownloadQueue.js', 'frontend/src/components/DownloadQueueMonitor.jsx', 'frontend/src/hooks/useDownloadQueue.test.jsx']
code_patterns: ['Custom Hooks', 'MUI Components', 'Lifted State']
test_patterns: ['Vitest', 'React Testing Library (renderHook)']
---

# Overview

## Problem Statement
Users have no way to remove completed downloads from the queue summary. As downloads finish, the "Batch Status" count grows (e.g., "10 done"), cluttering the view and making it harder to focus on active or failed items.

## Solution
Implement a "Clear Completed" button within the `DownloadQueueMonitor` component. This button will remove all items with `status: 'completed'` from the active download queue state. 

**Critical Refactor**: To prevent race conditions when items are removed from the queue while a download is active, the `useDownloadQueue` hook will be refactored to update item status using unique `id`s instead of array indices.

This action is purely visual/state management for the active session and does **not** affect the persistent "downloaded log" used for the "skip downloaded" feature.

## Scope
### In Scope
-   Refactor `useDownloadQueue` to use `id`-based lookups for state updates.
-   Modify `useDownloadQueue` hook to include a `clearCompleted` function.
-   Update `DownloadQueueMonitor` UI to display the "Clear Completed" button when completed items exist.
-   Ensure the button is visually distinct and placed logically.

### Out of Scope
-   Detailed list view of completed items.
-   Modifying the "Download History" persistence logic.
-   Changing the "Cancel All" behavior.

# Context for Development

## Codebase Patterns
- **State Preservation**: The queue is persisted to `localStorage` in `useDownloadQueue.js`.
- **Sequential Processing**: `useDownloadQueue` uses `useEffect` to process one `pending` item at a time.
- **MUI Integration**: Standard MUI v5 patterns for buttons and layout.

## Files to Reference
| File | Purpose |
| --- | --- |
| `frontend/src/hooks/useDownloadQueue.js` | Core queue logic and state management. |
| `frontend/src/components/DownloadQueueMonitor.jsx` | UI for monitoring the queue. |
| `frontend/src/hooks/useDownloadQueue.test.jsx` | Unit tests for the hook. |

## Technical Decisions
- **ID-based Updates**: Refactoring from index-based updates to ID-based updates is mandatory to support removing items while processing.
- **Conditional Rendering**: The "Clear Completed" button will only be visible when `completed` count > 0.

# Implementation Plan

- [x] Task 1: Refactor `useDownloadQueue` to use ID-based updates
    - File: `frontend/src/hooks/useDownloadQueue.js`
    - Action: In `processQueue` effect, replace `idx === pendingIndex` logic with `qItem.id === item.id` in all `setQueue` calls.
- [x] Task 2: Implement `clearCompleted` in `useDownloadQueue`
    - File: `frontend/src/hooks/useDownloadQueue.js`
    - Action: Add `clearCompleted` function that filters the queue: `setQueue(prev => prev.filter(i => i.status !== 'completed'))`. Expose this function in the hook return object.
- [x] Task 3: Update unit tests for `useDownloadQueue`
    - File: `frontend/src/hooks/useDownloadQueue.test.jsx`
    - Action: Add a test case to verify `clearCompleted` removes only completed items and doesn't break active downloads.
- [x] Task 4: Add "Clear Completed" button to `DownloadQueueMonitor`
    - File: `frontend/src/components/DownloadQueueMonitor.jsx`
    - Action: Extract `clearCompleted` from `downloadState`. Add a "Clear Completed" button next to "Retry Failed" or "Cancel All". Use `stats.completed > 0` for conditional rendering.

## Review Notes
- Adversarial review completed
- Findings: 10 total, 6 fixed, 4 skipped
- Resolution approach: auto-fix
- Fixes applied:
    - F1: UI Inconsistency (button size)
    - F2: Test Code Quality (comments)
    - F3: Git Hygiene (newline)
    - F4: Documentation (JSDoc)
    - F9: Variable Naming (qItem -> queueItem)
    - F10: Test Fragility (mockRejectedValue)

# Acceptance Criteria

- [ ] AC 1: Given completed downloads in the queue, when "Clear Completed" is clicked, then completed items are removed from the active queue and summary.
- [ ] AC 2: Given an active download is running, when "Clear Completed" is clicked, then the active download continues without interruption.
- [ ] AC 3: Given failed downloads in the queue, when "Clear Completed" is clicked, then failed items remain in the queue.
- [ ] AC 4: Given the queue is cleared, when the page is refreshed, then cleared items do not reappear (persisted to localStorage).

# Additional Context

## Dependencies
- None beyond existing project dependencies.

## Testing Strategy
- **Unit Tests**: Run `npm test frontend/src/hooks/useDownloadQueue.test.jsx` after changes.
- **Manual Test**: 
    1. Start a few downloads.
    2. Wait for some to complete.
    3. Click "Clear Completed".
    4. Verify they are gone from the status text.
    5. Verify active downloads continue.

## Notes
- **Risk**: Race conditions during `setQueue` if not using functional updates with ID checks. Mitigated by Task 1.
- **UX**: The progress bar might jump because `total` items decreases. This is expected behavior as the "batch" being tracked is redefined by the user.