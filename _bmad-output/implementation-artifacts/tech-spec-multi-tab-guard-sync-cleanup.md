---
title: 'Multi-Tab Guard and Sync Cleanup'
slug: 'multi-tab-guard-sync-cleanup'
created: 'Tuesday, February 10, 2026'
status: 'Completed'
stepsCompleted: [1, 2, 3, 4, 5, 6]
tech_stack: ['React', 'MUI', 'LocalStorage', 'BroadcastChannel']
files_to_modify: ['frontend/src/App.jsx', 'frontend/src/hooks/useDownloadQueue.js', 'frontend/src/components/MultiTabGuard.jsx', 'frontend/tests/multi_tab.test.cjs']
code_patterns: ['React Hooks', 'MUI Components', 'Custom Hooks']
test_patterns: ['Playwright Integration Tests']
---

# Tech-Spec: Multi-Tab Guard and Sync Cleanup

**Created:** Tuesday, February 10, 2026

## Overview

### Problem Statement

The current implementation of the download queue includes complex cross-tab synchronization logic using `localStorage`, `storage` events, and the Web Locks API (`navigator.locks`). This complexity is hard to maintain and prone to race conditions. Restricting the application to a single tab simplifies the state management significantly.

### Solution

1.  **Multi-Tab Guard:** Implement a mechanism to detect if the app is already open in another tab. If it is, display a warning screen and prevent the app from loading.
2.  **Sync Cleanup:** Remove all cross-tab synchronization logic, leadership election (implicit or explicit), and locking mechanisms from `useDownloadQueue.js`, reverting it to a simpler local-tab-only state management (still using `localStorage` for persistence, but without cross-tab messaging).

### Scope

**In Scope:**
- Create `MultiTabGuard` component to enforce single-tab usage.
- Integrate `MultiTabGuard` in `App.jsx`.
- Remove `navigator.locks` usage from `useDownloadQueue.js`.
- Remove `storage` event listener and cross-tab UI syncing from `useDownloadQueue.js`.
- Remove `hik_queue_command` logic.
- Simplify `addToQueue`, `processQueue`, `retryFailed`, `clearCompleted`, and `cancelAll` to operate without locks.

**Out of Scope:**
- Modifying the backend API or NVR communication.
- Redesigning the `DownloadQueueMonitor` UI (other than removing cross-tab artifacts).

## Context for Development

### Codebase Patterns

- **Functional React Components:** Use hooks (`useState`, `useEffect`, `useMemo`, `useCallback`, `useRef`).
- **MUI (Material UI):** All UI components use MUI for layout and styling.
- **Custom Hooks:** Business logic is encapsulated in hooks like `useDownloadQueue`.
- **LocalStorage:** Used for persistent queue storage across refreshes.

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `frontend/src/App.jsx` | Main application entry point where the guard will be added. |
| `frontend/src/hooks/useDownloadQueue.js` | Contains the locking and sync logic to be removed. |
| `frontend/src/components/DownloadQueueMonitor.jsx` | UI for the download queue, depends on `useDownloadQueue` state. |
| `frontend/tests/integration_playwright.cjs` | Reference for existing integration test patterns. |

### Technical Decisions

- **Single Tab Detection:** Use `BroadcastChannel('hik_tab_guard')` for modern, reliable tab communication.
- **Handshake Protocol:**
    1.  New tab sends `HEARTBEAT_QUERY` on mount.
    2.  Starts a 500ms timeout.
    3.  If an existing tab is active, it responds with `HEARTBEAT_ACK`.
    4.  If the new tab receives `HEARTBEAT_ACK` within the window, it enters "Blocked" mode.
    5.  If the timeout expires with no response, the new tab enters "Active" mode and will respond to future queries.
- **Queue Persistence:** Retain `localStorage` for persisting the queue within the active tab and across refreshes of that single tab. Remove all cross-tab "live" synchronization logic.
- **Lock Removal:** Since `MultiTabGuard` ensures only one instance of the queue logic is running, `navigator.locks` and `storage` event listeners are redundant and should be removed.

## Implementation Plan

### Tasks

- [x] Task 1: Create `MultiTabGuard.jsx` component
  - File: `frontend/src/components/MultiTabGuard.jsx`
  - Action: Implement the `BroadcastChannel` handshake logic with a 500ms timeout. Create an MUI warning screen with an Alert and instructions to refresh.
  - Notes: The component should wrap its `children` and only render them if the tab is "Active".

- [x] Task 2: Integrate `MultiTabGuard` in `App.jsx`
  - File: `frontend/src/App.jsx`
  - Action: Import and wrap the entire `App` component content within `<MultiTabGuard>`.
  - Notes: This ensures no other hooks or components initialize until the tab is confirmed as the leader.

- [x] Task 3: Clean up `useDownloadQueue.js`
  - File: `frontend/src/hooks/useDownloadQueue.js`
  - Action: 
    - Delete the `useEffect` block handling `storage` events.
    - Delete all `navigator.locks.request` wrappers.
    - Remove `latestQueue` re-parsing from inside previous lock blocks; use `queueRef.current` or local state directly.
    - Remove `hik_queue_command` logic from `cancelAll`.
    - Simplify `addToQueue`, `retryFailed`, `clearCompleted`, and `cancelAll` to perform synchronous `localStorage` updates.
  - Notes: Keep the `localStorage` updates for persistence on refresh, but remove all logic related to other tabs.

- [x] Task 4: Create Multi-Tab Integration Test
  - File: `frontend/tests/multi_tab.test.cjs`
  - Action: Create a Playwright test that opens two pages in the same context. Verify the second page shows the "Already Open" warning.
  - Notes: Use `page.goto()` and `page.locator()` to check for the Alert message.

### Acceptance Criteria

- [x] AC 1: Multi-Tab Blocking
  - Given the application is open in Tab A, when the application is opened in Tab B, then Tab B displays a warning: "Hikvision Downloader is already open in another tab. Please use the existing tab or close it and refresh this one."
- [x] AC 2: Single Tab Operation
  - Given the application is open in a single tab, when a search is performed and items added to queue, then downloads proceed normally without any "lock" related errors.
- [x] AC 3: Recovery after Crash/Close
  - Given Tab A is closed, when Tab B is refreshed, then Tab B becomes the active leader and functions normally.
- [x] AC 4: Code Cleanliness
  - Given the `useDownloadQueue.js` file is reviewed, then no references to `navigator.locks` or `storage` listeners remain.

## Review Notes
- Adversarial review completed.
- Findings: 10 total, 10 fixed, 0 skipped.
- Resolution approach: walk-through (automated).
- Code Review & Refactoring:
    - Simplified `useDownloadQueue` hook.
    - Centralized `localStorage` persistence in a single `useEffect`.
    - Removed redundant `syncQueueToStorage` calls.
    - Decoupled processing loop from progress updates to eliminate reactive loops.
    - Improved robustness with better error handling and cleaner state transitions.
    - Final refinement: Replaced `queue` dependency in processing `useEffect` with a targeted `processTrigger`.
    - Final refinement: Improved `blobUrl` cleanup in `downloadWithRetry`.
    - Final refinement: Centralized ID generation.

## Additional Context

### Dependencies

- MUI `@mui/material` for UI components.
- `BroadcastChannel` API (supported in all modern browsers).

### Testing Strategy

- **Manual Verification:** Open the app in two Chrome tabs. Verify the second shows the block. Close the first, refresh the second, verify it unblocks.
- **Automated Verification:** New Playwright test `multi_tab.test.cjs` will automate the two-tab scenario.

### Notes

The 500ms window in the handshake is a compromise between safety (avoiding race conditions) and perceived performance.