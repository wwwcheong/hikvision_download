---
title: 'Rebuild Filter with Separated Date/Time'
slug: 'rebuild-filter-separated-datetime'
created: '2026-01-29'
status: 'implementation-complete'
stepsCompleted: [1, 2, 3, 4]
tech_stack: ['React', 'MUI', 'date-fns', 'Vite', 'Vitest']
files_to_modify: ['frontend/package.json', 'frontend/src/main.jsx', 'frontend/src/components/SearchForm.jsx', 'frontend/src/App.test.jsx']
code_patterns: ['Functional Components', 'Hooks', 'MUI Components']
test_patterns: ['Integration testing with Vitest/RTL', 'Axios mocking']
---

## Overview

### Problem Statement
The current search filter combines date and time into single inputs, making selection cumbersome. Additionally, the auto-correction logic (automatically adjusting start/end times to enforce order) can be confusing for users.

### Solution
Refactor the `SearchForm` component to separate date and time selection into four distinct fields: Start Date, Start Time, End Date, and End Time. Implement default values (Today, 00:00 - 23:59). Replace auto-correction with a visible warning when the start time is after the end time.

### Scope
**In Scope:**
- Refactor `SearchForm.jsx` to use 4 separate fields.
- Integrate `@mui/x-date-pickers` for improved UX.
- Implement default values: Start/End Date = Today, Start Time = 00:00, End Time = 23:59.
- Implement validation logic: Show a warning message AND disable the Search button if Start > End.
- Construct ISO strings from the 4 fields to pass to the parent component.
- Use 24-hour time format for time selection.

**Out of Scope:**
- Backend changes.
- Changes to `App.jsx` logic (other than consuming the search event).

## Context for Development
- **Library:** User explicitly requested `@mui/x-date-pickers`. This will need to be installed.
- **Validation:** Warning alert + disabled Search button on invalid range.
- **Defaults:** Today's date and full day range.
- **Time Format:** 24-hour format (ampm=false).
- **Codebase Patterns:**
    - React Functional Components with Hooks.
    - MUI for UI components.
    - `date-fns` for date manipulation.
    - `SearchForm` encapsulates form logic; `App` handles API calls.
- **Files to Reference:**
    | File | Purpose |
    |------|---------|
    | `frontend/src/components/SearchForm.jsx` | Target for refactoring. Current logic combines date/time. |
    | `frontend/src/main.jsx` | Entry point. Needs `LocalizationProvider`. |
    | `frontend/src/App.test.jsx` | Integration tests. Will need updates to match new inputs. |
- **Technical Decisions:**
    - Wrap application in `LocalizationProvider` at `main.jsx` level.
    - Use `DatePicker` and `TimePicker` components.
    - State management in `SearchForm` will track 4 separate values.
    - Tests must be updated to find inputs by new labels ("Start Date", "Start Time", etc.).

## Files to Modify
- `frontend/package.json` (add dependencies)
- `frontend/src/main.jsx` (add provider)
- `frontend/src/components/SearchForm.jsx` (refactor)
- `frontend/src/App.test.jsx` (update tests)
