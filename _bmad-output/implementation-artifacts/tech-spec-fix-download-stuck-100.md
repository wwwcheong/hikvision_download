---
title: 'Fix Download Stuck at 100%'
slug: 'fix-download-stuck-100'
created: '2026-02-01'
status: 'completed'
stepsCompleted: [1, 2, 3, 4, 5, 6]
tech_stack: ['React', 'Fetch API', 'Node.js', 'Express']
files_to_modify: ['frontend/src/hooks/useDownloadQueue.js', 'frontend/src/hooks/useDownloadQueue.test.jsx']
code_patterns: ['ReadableStream', 'Manual Stream Consumption', 'Blob Construction', 'Force Completion Logic', 'Retry Logic']
test_patterns: ['Jest', 'React Hooks Testing Library', 'Mocking fetch and ReadableStream']
---

# Overview

## Problem Statement
Users report that downloads occasionally get stuck at 100% in the browser. They don't receive the file, the next download in the queue doesn't start, and no error is reported. This likely happens because the frontend attempts to download the entire file as a `Blob` using Axios before triggering the browser's save dialog. For large video files, this can exceed browser memory limits or cause the UI thread to hang when creating a `blob:` URL. Additionally, if the NVR doesn't provide a `Content-Length` header, Axios cannot accurately report progress or know when the stream is truly finished in a way that aligns with the user's expectations.

## Solution
The "stuck at 100%" issue often occurs when the server (or NVR proxy) finishes sending data but fails to close the socket or send the final "end" signal, causing Axios (which waits for the connection to close) to hang indefinitely.

To resolve this while preserving the sequential "queue" behavior and progress tracking:

1.  **Replace `axios` with `fetch`**: Use the native `fetch` API which exposes the `ReadableStream`.
2.  **Manual Stream Reading**: Implement a loop using `reader.read()` to consume the stream chunks.
3.  **Active Completion Check**:
    - Track `receivedLength` vs `contentLength`.
    - If `receivedLength >= contentLength`, **forcefully close the stream** and consider the download complete. This bypasses the "zombie connection" issue.
    - Ensure `reader.cancel()` is called to cleanly terminate the connection.
5.  **Auto-Retry Logic**:
    - Wrap the stream process in a retry mechanism.
    - **Max Retries**: 2 (Total attempts: 3).
    - If a stream error occurs (network drop, timeout), retry automatically.
    - If all retries fail, mark as 'error' and **proceed to the next item** in the queue.
6.  **Blob Construction**: Reassemble the chunks into a `Blob` (preserving the current architecture's memory usage but fixing the hang) and trigger the download.

## In Scope
- Refactoring `useDownloadQueue.js` to use `fetch` + `reader`.
- Implementing the "Force Complete" logic when size matches `Content-Length`.
- Implementing **2x Auto-Retry** logic for failed downloads.
- Handling cases where `Content-Length` is missing (fallback to standard stream end).

## Out of Scope
- Switching to "StreamSaver.js" or FileSystem APIs (unless memory issues prove blocking).
- Backend changes.

# Context for Development
- The project uses a token-based download system.
- Users want to maintain the "Sequential Queue" UX (Item A finishes -> Item B starts).
- "Stuck at 100%" implies the data is transferred, but the completion event is missing.
- **Constraint:** Must keep the sequential download pattern (awaiting completion).

# Investigation Results
- `frontend/src/hooks/useDownloadQueue.js` currently uses `axios.get(url, { responseType: 'blob', ... })`.
- `backend/controllers/nvrController.js` pipes the NVR stream directly to the response.
- Browser memory limits for Blobs vary but are often around 2GB-4GB, which high-def video can approach or hit during long sessions.

# Technical Context (Step 2)

## Codebase Patterns
- **Frontend Hook Pattern**: The download logic is encapsulated in a custom React hook `useDownloadQueue`.
- **State Management**: Uses `useState` and `useRef` to manage queue status and download progress.
- **API Interaction**: Currently uses `axios` for both token retrieval and file download.
- **Testing**: Uses `jest` and `@testing-library/react-hooks` for unit testing hooks.

## Files to Reference
| File Path | Description |
| :--- | :--- |
| `frontend/src/hooks/useDownloadQueue.js` | The core hook managing the download queue and execution logic. Target for refactoring. |
| `frontend/src/hooks/useDownloadQueue.test.jsx` | Unit tests for the hook. Needs updates to mock `fetch` instead of `axios`. |
| `backend/controllers/nvrController.js` | Backend controller handling the download stream. Useful for understanding headers (`Content-Length`). |

## Technical Decisions
- **Fetch API vs Axios**: Switching to `fetch` because it exposes the low-level `ReadableStream` interface, allowing us to inspect chunks and manually close the stream, which `axios` abstracts away.
- **Manual Completion**: We will trust the `Content-Length` header (if available) as the "truth" for file size. If `receivedLength >= Content-Length`, we treat the download as complete, solving the "hanging socket" issue.
- **Blob Reassembly**: We will collect chunks in an array and create a `Blob` at the end. This maintains the existing "save" behavior but changes how the data is acquired. Note: Memory usage remains a constraint, but this fix targets the *hanging connection*, not the memory footprint.

# Implementation Plan (Step 3)

## Task Breakdown

- [x] Task 1: Update Tests to Mock Fetch
  - File: `frontend/src/hooks/useDownloadQueue.test.jsx`
  - Action: Remove `axios` mocks for the download step (keep it for token if needed, or switch both).
  - Action: Implement `global.fetch` mock that returns a `ReadableStream`.
  - Action: Add test cases:
    - `should download successfully with fetch stream`
    - `should retry download on stream error`
    - `should fail after max retries`
    - `should force close stream when content-length is reached`

- [x] Task 2: Refactor `useDownloadQueue` to use Fetch & Stream
  - File: `frontend/src/hooks/useDownloadQueue.js`
  - Action: Replace `axios.get` for the file download with `fetch`.
  - Action: Implement the `while (true)` loop with `reader.read()`.
  - Action: Accumulate chunks into a `chunks` array.
  - Action: Calculate progress manually: `(receivedLength / contentLength) * 100`.
  - Action: Add logic: `if (contentLength && receivedLength >= contentLength) { reader.cancel(); break; }`.
  - Action: Create `Blob` from `chunks` and trigger download.

- [x] Task 3: Implement Auto-Retry Logic
  - File: `frontend/src/hooks/useDownloadQueue.js`
  - Action: Wrap the download logic in a function `downloadWithRetry(attempts = 0)`.
  - Action: If `fetch` or stream reading throws, catch error.
  - Action: If `attempts < 2`, wait 1000ms and call `downloadWithRetry(attempts + 1)`.
  - Action: If `attempts >= 2`, throw error to be caught by the outer queue processor.

## Review Notes
- Adversarial review completed
- Findings: 10 total, 5 fixed, 5 skipped
- Resolution approach: auto-fix

## Acceptance Criteria

- [ ] AC 1: Given a download queue, when a download starts, then it uses the Fetch API and streams data chunk by chunk.
- [ ] AC 2: Given a file with a known Content-Length (e.g., 100MB), when the downloaded bytes reach 100MB, then the stream is forcefully closed and the save dialog appears immediately.
- [ ] AC 3: Given a network interruption during download, when the stream fails, then the system automatically retries the download up to 2 times.
- [ ] AC 4: Given a persistent network failure, when all 3 attempts fail, then the item is marked as 'error' and the queue proceeds to the next item automatically.
- [ ] AC 5: Given a large file download, when the download is in progress, then the UI shows the correct percentage based on bytes received vs Content-Length.

## Dependencies
- None. `fetch` is native to modern browsers.

## Testing Strategy
- **Unit Tests**:
  - Use `jest.spyOn(global, 'fetch')` to mock the stream.
  - Test the "Force Close" logic by mocking a stream that sends bytes equal to Content-Length but doesn't close.
  - Test the retry logic by mocking a fetch that throws errors for the first 2 calls and succeeds on the 3rd.
- **Manual Testing**:
  - Use network throttling in DevTools to simulate slow connections.
  - "Offline" mode in DevTools to trigger retries (though `fetch` might fail instantly).
  - Validating against the actual NVR (if available) to ensure `Content-Length` is handled correctly.

## Notes
- **Memory Warning**: We are still creating a `Blob` in memory. If users try to download 5GB files on a low-memory machine, the browser might crash *after* the download finishes but *before* the save dialog. This is a known limitation of the current architecture (Blob-based) but is outside the scope of fixing the "stuck at 100%" bug.
- **Content-Length**: If the NVR does NOT send `Content-Length`, the "Force Close" logic will not trigger, and we fall back to waiting for the stream to end naturally. This is the correct fallback behavior.