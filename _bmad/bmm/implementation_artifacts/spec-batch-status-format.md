---
title: 'batch-status-format'
type: 'feature'
created: '2026-04-30'
status: 'done'
route: 'one-shot'
context: []
---

## Intent

**Problem:** Batch status text in DownloadQueueMonitor showed "5/10, 1 failed" format which is unclear.

**Approach:** Changed to "Done: 5/10, Fail: 1" format for clarity.

## Code Map

- `frontend/src/components/DownloadQueueMonitor.jsx:117-119` -- batchStatusText format change

## Tasks & Acceptance

**Execution:**
- [x] `frontend/src/components/DownloadQueueMonitor.jsx` -- Update batchStatusText format -- clearer "Done: X/Y, Fail: Z" format

**Acceptance Criteria:**
- Given errors exist, when rendered, then shows "Done: X/Y, Fail: Z"
- Given no errors, when rendered, then shows "Done: X/Y"

## Verification

**Manual checks (if no CLI):**
- Inspect `frontend/src/components/DownloadQueueMonitor.jsx:169` for correct batchStatusText rendering in Download section
