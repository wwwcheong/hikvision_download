---
title: Download Status Section Refactor
type: refactor
created: 2026-04-30
status: in-review
context:
  - frontend/src/components/DownloadQueueMonitor.jsx
  - frontend/src/hooks/useDownloadQueue.js
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The `DownloadQueueMonitor` component currently hides itself when the download queue is empty (returns `null`). The layout is a single vertical stack, not split into left/right sections, and the copy/button text doesn't match the requested format.

**Approach:** Refactor `DownloadQueueMonitor` to always render, split into left/right sections that stack on narrow viewports, and display the batch status in `{done}/{total}, {failed} failed` format with CLEAR DONE and CANCEL ALL buttons on the left, and filename + circular progress + cancel button on the right.

## Boundaries & Constraints

**Always:**
- Component must render regardless of queue state (no early `null` return)
- Left/right layout uses CSS flexbox with `flexWrap: 'wrap'`
- Buttons use MUI `variant="outlined"` with `color="success"` (clear done) and `color="error"` (cancel all)

**Ask First:** N/A — scope is fully defined

**Never:**
- Do not add new external dependencies — use inline SVG for circular progress
- Do not change the `downloadState` prop shape or `onCancelAll` callback signature

</frozen-after-approval>

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| EMPTY_QUEUE | queue = [] | Renders "0/0, 0 failed", both buttons disabled | N/A |
| MIXED_QUEUE | queue with 9 done, 1 failed, 0 pending of 10 total | Shows "9/10, 1 failed", CLEAR DONE enabled, CANCEL ALL disabled | N/A |
| ACTIVE_DOWNLOAD | currentProgress = 45, currentFileName = "video.mp4" | Circular progress shows 45%, filename displayed, cancel button enabled | N/A |
| NARROW_VIEWPORT | width < 600px | Layout stacks vertically (left above right) | N/A |

## Code Map

- `frontend/src/components/DownloadQueueMonitor.jsx` -- Primary component to refactor
- `frontend/src/hooks/useDownloadQueue.js` -- Provides queue state and callbacks (unchanged)

## Tasks & Acceptance

**Execution:**
- [x] `frontend/src/components/DownloadQueueMonitor.jsx` -- Add CircularProgress component (inline SVG) -- Replaces LinearProgress for single-file progress
- [x] `frontend/src/components/DownloadQueueMonitor.jsx` -- Add CancelButton component (inline SVG icon) -- Custom circle-with-cross icon
- [x] `frontend/src/components/DownloadQueueMonitor.jsx` -- Remove early `if (stats.total === 0) return null` -- Always render component
- [x] `frontend/src/components/DownloadQueueMonitor.jsx` -- Implement left/right flex layout with responsive wrap -- Split sections
- [x] `frontend/src/components/DownloadQueueMonitor.jsx` -- Update batch status format to `{done}/{total}, {failed} failed` -- Matches spec copy
- [x] `frontend/src/components/DownloadQueueMonitor.jsx` -- Update buttons to CLEAR DONE (success) and CANCEL ALL (error) -- Button text changes
- [x] `frontend/src/components/DownloadQueueMonitor.jsx` -- Add proper disabled states for buttons -- CLEAR DONE disabled when completed=0, CANCEL ALL disabled when not processing

**Acceptance Criteria:**
- Given queue is empty, when component renders, then it displays "0/0, 0 failed" and both buttons are disabled
- Given 9 of 10 items completed with 1 failed, when component renders, then shows "9/10, 1 failed" with CLEAR DONE enabled and CANCEL ALL disabled
- Given an active download at 45% on "video.mp4", when component renders, then circular progress displays 45%, filename is shown, and cancel button is enabled
- Given viewport width under 600px, when component renders, then left and right sections stack vertically

## Spec Change Log

<!-- Empty until first review loopback -->

## Design Notes

**Circular Progress SVG:**
```jsx
<svg width={size} height={size} viewBox="0 0 48 48">
  <circle cx="24" cy="24" r="20" fill="none" stroke="#e0e0e0" strokeWidth="4"/>
  <circle cx="24" cy="24" r="20" fill="none" stroke="primary" strokeWidth="4"
    strokeDasharray={`${2 * Math.PI * 20}`}
    strokeDashoffset={`${2 * Math.PI * 20 * (1 - value / 100)}`}
    transform="rotate(-90 24 24)"/>
  <text x="24" y="24" textAnchor="middle" dy="0.3em" fontSize="12">{value}%</text>
</svg>
```

**Cancel Button SVG (circle with cross/plus inside):**
```jsx
<svg width="24" height="24" viewBox="0 0 24 24">
  <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"/>
  <path d="M8 8L16 16M16 8L8 16" stroke="currentColor" strokeWidth="2"/>
</svg>
```

**Layout:** `flexDirection: 'row'` on desktop, `flexWrap: 'wrap'` to stack at ~600px breakpoint.

## Verification

**Commands:**
- `cd frontend && npm run lint -- --fix --quiet` -- expected: no errors
- `cd frontend && npm test -- --testPathPattern="DownloadQueueMonitor"` -- expected: tests pass

**Manual checks (if no CLI):**
- Open browser devtools, set viewport to 1200px, verify left/right layout
- Set viewport to 500px, verify vertical stack layout
- Verify empty queue shows "0/0, 0 failed" with disabled buttons
- Verify active download shows circular progress with percentage
