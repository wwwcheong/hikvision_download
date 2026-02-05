---
title: 'Frontend Camera Search Filter'
slug: 'frontend-camera-search-filter'
created: '2026-02-05'
status: 'Completed'
stepsCompleted: [1, 2, 3, 4, 5, 6]
tech_stack: ['React 19', 'MUI 7', 'Vite', 'Vitest', 'Axios', 'date-fns']
files_to_modify: ['frontend/src/App.jsx', 'frontend/src/App.test.jsx', 'frontend/src/components/ResultsTable.jsx', 'backend/controllers/nvrController.js']
code_patterns: ['Functional Components', 'Hooks (useState, useEffect, useMemo)', 'State Lifting', 'MUI Autocomplete', 'Derived State Filtering']
test_patterns: ['Vitest', 'React Testing Library', 'Integration Testing']
---

# Tech-Spec: Frontend Camera Search Filter

**Created:** 2026-02-05

## Overview

### Problem Statement

Users currently see all search results for all cameras. There is no way to filter the results to focus on specific cameras without performing a new backend search (which is slow) or manually scanning the list.

### Solution

Implement a frontend-only camera filter using a multi-select Autocomplete component. This filter will allow users to select one, many, or all cameras. The `ResultsTable` will only display recordings from the selected cameras. The results summary will be updated to show both total and filtered counts.

### Scope

**In Scope:**
- `selectedCameras` state in `App.jsx`.
- Multi-select `Autocomplete` component in `App.jsx` for camera selection.
- "Select All" and "Select None" helper buttons/options.
- Filtering logic for the `results` array before passing to `ResultsTable`.
- UI update for recording count: "Found X recordings, filtered to Y recordings".
- Persistence of selection across new searches (within the same session).

**Out of Scope:**
- Backend-side filtering (API calls will still fetch all results).
- Persistence of camera selection in `localStorage` (across browser restarts).

## Context for Development

### Codebase Patterns
- **MUI usage**: The project uses Material UI components (Box, Typography, Button, Autocomplete, TextField, etc.).
- **State Lifting**: `App.jsx` manages global state including `credentials`, `channels`, and `results`.
- **Derived State**: Filtered results should be computed during render from `results` and `selectedCameras` to ensure consistency.
- **Testing**: Vitest and React Testing Library are used for integration and component testing.

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `frontend/src/App.jsx` | Main state container and where the filter will be implemented. |
| `frontend/src/components/ResultsTable.jsx` | Displays the filtered results. |
| `frontend/src/components/SearchForm.jsx` | Reference for MUI form patterns and layout. |
| `frontend/src/App.test.jsx` | Reference for testing patterns. |

### Technical Decisions
- **Frontend Filtering**: Keeps the UI responsive and avoids redundant backend calls.
- **MUI Autocomplete**: Provides a robust, searchable multi-select experience.
- **Derived State**: `filteredResults = results.filter(...)` inside `App` render ensures the table always reflects the current selection.
- **Persistence**: `selectedCameras` state is maintained in `App`, so it survives new searches but resets on page reload.

## Implementation Plan

### Tasks

- [x] Task 1: Add `selectedCameras` state and imports to `App.jsx`
- [x] Task 2: Implement the `Autocomplete` multi-select UI
- [x] Task 3: Add "Select All" and "Select None" helper buttons
- [x] Task 4: Implement filtering logic and update count display
- [x] Task 5: Pass filtered results to `ResultsTable`

### Acceptance Criteria

- [x] AC 1: Given a connected NVR with multiple cameras, when I search for recordings, then the filter dropdown is populated with the names of all discovered cameras.
- [x] AC 2: Given search results, when I select one or more cameras in the filter, then the ResultsTable only displays rows belonging to those cameras.
- [x] AC 3: Given a filter selection, when I click "Select None", then the ResultsTable becomes empty and the count shows "filtered to 0 recordings".
- [x] AC 4: Given no cameras selected, when I click "Select All", then all recordings found in the search are displayed in the table.
- [x] AC 5: Given a filter selection and current results, when I perform a new search, then the filter selection remains active and is applied to the new set of results immediately.

## Review Notes
- Adversarial review completed by `codebase_investigator`.
- Findings: 7 total, 6 fixed, 1 skipped (out of scope).
- Fixed issues:
    - Added `cameraID` to search results for robust filtering and logging.
    - Added `isOptionEqualToValue` to `Autocomplete`.
    - Fixed `ResultsTable` to preserve hidden selections during batch actions.
    - Switched to `playbackURI` as key in `ResultsTable`.
- Skipped: Backend-side filtering (confirmed out of scope for this feature).



## Additional Context

### Dependencies
- No new external dependencies. Using existing `@mui/material`.

### Testing Strategy
- **Manual Test**: Connect to NVR, search, select camera A, verify only A rows show. Select camera B, verify A and B show. Click "Select None", verify table empty.
- **Automated Test**: Add a test case to `frontend/src/App.test.jsx` that mocks search results for multiple cameras and verifies the filtering behavior by checking the number of rows or the count text.

### Notes
- **Edge Case**: If the backend search returns a camera name that doesn't match the names in `channels` (unlikely but possible), the filtering logic should handle it gracefully (e.g., using `cameraID` if available or exact name match).
- **Default State**: Initial state will be "All Cameras" selected upon first connection to ensure immediate visibility of results.
