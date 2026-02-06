---
title: 'Cross-Tab Download Queue Synchronization'
slug: 'cross-tab-sync'
created: '2026-02-05'
status: 'in-progress'
stepsCompleted: [1, 2, 3, 4]
tech_stack: ['React', 'localStorage', 'Web Storage API', 'Web Locks API']
files_to_modify: ['frontend/src/hooks/useDownloadQueue.js']
code_patterns: ['React Hooks', 'Event Listeners', 'Atomic State Management', 'Leader Election']
test_patterns: ['Vitest', 'Playwright (Multi-tab)']
---

# Tech-Spec: Cross-Tab Download Queue Synchronization

**Created:** 2026-02-05

## Overview

### Problem Statement

When multiple tabs of the Hikvision NVR Downloader are open, they all attempt to process the same download queue stored in `localStorage`. This leads to race conditions where multiple tabs might start downloading the same file, and state updates from one tab can overwrite updates from another, resulting in erratic behavior and double downloads.

### Solution

Implement a coordination mechanism using the Web Storage API and a "Leader Election" pattern:
1.  **Shared State Synchronization**: Use the `storage` event to keep the queue in sync across all tabs in real-time.
2.  **Leader Election**: Use the **Web Locks API (`navigator.locks`)** to ensure only one tab (the "leader") processes the pending items in the queue.
3.  **Atomic State Updates**: Use dedicated command keys in `localStorage` to signal actions like cancellations across tabs, ensuring the leader can respond to user actions taken in follower tabs.

### Scope

**In Scope:**
- Real-time synchronization of the download queue across all open tabs.
- Ensuring only one tab processes the download queue at any given time using `navigator.locks`.
- Shared visibility of download progress across all tabs via `localStorage`.
- Cross-tab command signaling (Cancel All, Cancel Item) via a dedicated `hik_queue_command` key.
- Robust handling of tab closure (leadership transfer managed by Web Locks API).

**Out of Scope:**
- Backend-side queue persistence (sticking to `localStorage` for now).
- Synchronization across different browsers.
- Resuming partial downloads.

## Context for Development

### Codebase Patterns

- **React Hooks**: The core logic is encapsulated in `useDownloadQueue.js`.
- **Side Effects**: `useEffect` is used for queue processing and `localStorage` persistence.
- **State Management**: Local `useState` is synchronized with `localStorage`.

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `frontend/src/hooks/useDownloadQueue.js` | Contains the core logic for queue processing and `localStorage` persistence. |
| `frontend/src/App.jsx` | Main application component that uses the queue hook. |

### Technical Decisions

- **Web Locks API**: Use `navigator.locks.request('hik_download_lock', ...)` to designate the processing tab. This ensures that even if a tab crashes, the browser releases the lock for others.
- **Storage Event Listener**: Listen for changes to `hik_download_queue` and `hik_queue_command`.
- **Command Signaling**: Use a `hik_queue_command` key in `localStorage` with a schema like `{ type: 'CANCEL_ALL', timestamp: Date.now() }`. The leader tab watches for this key to trigger local abort signals. The timestamp ensures that repeated commands are detected.

## Implementation Plan

### Tasks

- [x] Task 1: Implement Cross-Tab State Synchronization
  - File: `frontend/src/hooks/useDownloadQueue.js`
  - Action: Add a `useEffect` that listens for the `storage` event. If the key is `hik_download_queue`, parse the value and call `setQueue`. Add a guard to prevent unnecessary state updates if the data matches the current local state.
- [x] Task 2: Implement Leader Election with Web Locks
  - File: `frontend/src/hooks/useDownloadQueue.js`
  - Action: Modify the `processQueue` effect. Wrap the processing logic (from finding a pending item to completion) inside a `navigator.locks.request('hik_download_lock', async () => { ... })` call. Ensure `processingRef.current` and `setIsProcessing` are correctly managed within the lock scope.
- [x] Task 3: Implement Cross-Tab Command Signaling
  - File: `frontend/src/hooks/useDownloadQueue.js`
  - Action: Update `cancelAll` and `cancelItem` (if added) to write to a new `localStorage` key `hik_queue_command`. In the leader tab (inside the lock), add a listener or check this key to trigger the `abortController`.
- [x] Task 4: Refine Persistence and Atomic Updates
  - File: `frontend/src/hooks/useDownloadQueue.js`
  - Action: Ensure `addToQueue` and other state updates merge correctly with the latest data from `localStorage` to prevent overwriting changes made by other tabs in the brief window before the `storage` event fires.

### Review Follow-ups (AI)
- [ ] [AI-Review][HIGH] Implement fallback processing for environments without Web Locks (navigator.locks) [frontend/src/hooks/useDownloadQueue.js:189]
- [ ] [AI-Review][HIGH] Reorder onDownloadSuccess callback to execute after localStorage persistence of completed status [frontend/src/hooks/useDownloadQueue.js:237]
- [ ] [AI-Review][MEDIUM] Ensure processQueue effect can react to credential changes during active downloads [frontend/src/hooks/useDownloadQueue.js:183]
- [ ] [AI-Review][MEDIUM] Debounce UI reset in storage listener to prevent flicker during leadership transitions [frontend/src/hooks/useDownloadQueue.js:77]
- [ ] [AI-Review][MEDIUM] Standardize network requests to use axios for consistency across fetch/token calls [frontend/src/hooks/useDownloadQueue.js:114]
- [ ] [AI-Review][LOW] Optimize processQueue dependency array and queue monitoring [frontend/src/hooks/useDownloadQueue.js:283]
- [ ] [AI-Review][LOW] Externalize API_URL configuration for better environment flexibility [frontend/src/hooks/useDownloadQueue.js:4]

### Acceptance Criteria

- [x] AC 1: Sync Visibility: Given two tabs A and B, when a download is added in tab A, then it immediately appears in the queue display of tab B.
- [x] AC 2: Single Execution: Given two tabs A and B, when both are open, then only one tab (the leader) initiates the network requests to the backend for downloading.
- [x] AC 3: Progress Mirroring: Given a download in progress in the leader tab, when the progress increases, then the progress percentage is updated in real-time in all other open tabs.
- [x] AC 4: Cross-Tab Cancellation: Given tab A is the leader and tab B is a follower, when the user clicks "Cancel All" in tab B, then the active download in tab A is aborted, and the queue is cleared in both tabs.
- [x] AC 5: Leadership Handoff: Given tab A is the leader and has pending items, when tab A is closed, then tab B immediately requests the lock and begins processing the next pending item.

## Additional Context

### Dependencies

- Web Storage API.
- Web Locks API.
- `axios` (existing).

### Testing Strategy

- **Manual Verification**: 
  1. Open two tabs side-by-side.
  2. Start a batch of 5 downloads.
  3. Verify only one tab shows network activity in DevTools.
  4. Verify both tabs show the progress bar moving.
  5. Close the downloading tab and verify the other tab picks up the next item.
  6. Click "Cancel All" in the non-downloading tab and verify the other tab stops.

## Review Notes
- Adversarial review completed.
- Findings: 5 total, 5 fixed, 0 skipped.
- Resolution approach: [F] Fix automatically.
- Fixed F1: Web Locks support check and fallback.
- Fixed F2: Multi-tab atomicity for queue edits using a dedicated lock.
- Fixed F3: Effect dependency optimization to prevent redundant runs during progress updates.
- Fixed F4: Throttled localStorage writes (5% increments) to prevent main thread blocking.
- Fixed F5: Enhanced unmount safety within asynchronous lock callbacks.


