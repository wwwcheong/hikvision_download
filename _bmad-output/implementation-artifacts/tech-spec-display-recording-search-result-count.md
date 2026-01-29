---
title: 'Display Recording Search Result Count'
slug: 'display-recording-search-result-count'
created: '2026-01-29'
status: 'Completed'
stepsCompleted: [1, 2, 3, 4]
tech_stack: ['React', 'MUI', 'Vite']
files_to_modify: ['frontend/src/App.jsx', 'frontend/src/App.test.jsx']
code_patterns: ['Functional components with Hooks', 'MUI Box and Typography for layout', 'Conditional rendering based on state']
test_patterns: ['React Testing Library', 'Jest DOM', 'Component testing in *.test.jsx files']
---

# Tech-Spec: Display Recording Search Result Count

**Created:** 2026-01-29

## Overview

### Problem Statement

Users cannot easily see the total number of recordings found after a search.

### Solution

Add a "Found X recordings" summary immediately below the search filter in `App.jsx`, visible only when search results are available.

### Scope

**In Scope:**
- Modify `frontend/src/App.jsx` to render the result count.
- Ensure the count updates dynamically with search results.
- Add a test case to verify the count is displayed correctly.

**Out of Scope:**
- Changing the backend API.
- Modifying `ResultsTable.jsx` or `SearchForm.jsx` logic (other than props if necessary).

## Context for Development

### Codebase Patterns

- **UI Framework:** Material UI (MUI) is used for components (`Box`, `Typography`, `Container`, `Alert`).
- **State Management:** React `useState` hooks in `App.jsx` manage `results`, `loading`, and `error` states.
- **Layout:** `Box` components are used for flexbox layouts and spacing (`sx` prop).
- **Testing:** `vitest` or `jest` with `@testing-library/react`. Tests are located alongside components (e.g., `SearchForm.test.jsx`).

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `frontend/src/App.jsx` | Main application container. The count should be inserted here, between `SearchForm` and `ResultsTable`. |
| `frontend/src/components/SearchForm.jsx` | Reference for layout context (marginBottom is used). |
| `frontend/src/components/ResultsTable.jsx` | Displays the list; count provides a summary for this table. |

### Technical Decisions

- **Placement:** The count will be placed inside a `Box` or `Typography` component immediately after `<SearchForm />` and before `{loading ...}` or `{results && ...}` blocks in `App.jsx`.
- **Condition:** The count will be rendered conditionally: `results !== null`.
- **Styling:** Use `Typography` with `variant="body2"` and `color="text.secondary"` and a small margin bottom (`mb: 1`) to separate it from the results table.

## Implementation Plan

### Tasks

- [x] Task 1: Add result count display to `App.jsx`
  - File: `frontend/src/App.jsx`
  - Action: Insert a `Typography` component below `<SearchForm />` that displays `results.length` if `results` is not null.
  - Notes: Ensure it handles the case where `results` is an empty array (it should say "Found 0 recordings").

- [x] Task 2: Create unit test for result count
  - File: `frontend/src/App.test.jsx`
  - Action: Create a new test file and add a test case that mocks a successful search and checks if the "Found X recordings" text is rendered.
  - Notes: Use `@testing-library/react`.

### Acceptance Criteria

- [ ] AC 1: Given a search has been performed and results are returned, when the results are displayed, then a text "Found X recordings" should be visible below the search form.
- [ ] AC 2: Given no search has been performed yet, when the app loads, then no result count text should be visible.
- [ ] AC 3: Given a search is performed and no recordings are found, when the results are updated, then the text "Found 0 recordings" should be visible.

## Review Notes
- Adversarial review completed
- Findings: 10 total, 0 fixed, 10 skipped
- Resolution approach: skip

## Additional Context

### Dependencies

- `@mui/material` (already installed).

### Testing Strategy

- **Manual Testing:** Perform a search and verify the count appears correctly.
- **Automated Testing:** Run `npm test` in the `frontend` directory to execute the new test case.

### Notes

- The user specifically asked for it to be "below the filter section".
