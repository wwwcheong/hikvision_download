---
title: 'Frontend Date Auto Select'
slug: 'frontend-date-auto-select'
created: '2026-01-29'
status: 'Completed'
stepsCompleted: [1, 2, 3, 4]
tech_stack: ['React', 'MUI', 'date-fns', 'Vitest']
files_to_modify: ['frontend/src/components/SearchForm.jsx']
code_patterns: ['Functional Components', 'Hooks', 'MUI styling']
test_patterns: ['Vitest', 'React Testing Library']
---

# Tech-Spec: Frontend Date Auto Select

**Created:** 2026-01-29

## Overview

### Problem Statement

Users have to manually select both start and end dates. This is tedious and allows for invalid ranges (start > end).

### Solution

Modify `SearchForm` to automatically set the corresponding date (start/end) when one is selected, maintaining a 1-hour difference if the other is empty. Also correct invalid ranges by adjusting the other date to maintain the 1-hour difference. Use `date-fns` for date manipulation.

### Scope

**In Scope:**
- Modify `frontend/src/components/SearchForm.jsx`.
- Implement auto-select logic.
- Implement validation/correction logic.
- Create unit tests for `SearchForm`.

**Out of Scope:**
- Backend changes.
- Styles/CSS.

## Context for Development

### Codebase Patterns

- React functional components with hooks (`useState`).
- MUI components (`TextField`, `Box`).
- `date-fns` for date operations.
- Testing with Vitest and React Testing Library.

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `frontend/src/components/SearchForm.jsx` | Search form component handling date inputs. |
| `frontend/vite.config.js` | Test configuration. |
| `frontend/src/setupTests.js` | Test setup. |

### Technical Decisions

- Use `date-fns` for reliable date math (addHours, subHours, isAfter, isBefore).
- Handle `datetime-local` string format (`YYYY-MM-DDTHH:mm`).
- Logic will be implemented in `handleChange` or a `useEffect` if dependency tracking is cleaner, but `handleChange` is probably better for direct user interaction control.
- Ensure "empty" checks handle empty strings correctly.

## Implementation Plan

### Tasks

- [x] Task 1: Create Unit Tests
  - File: `frontend/src/components/SearchForm.test.jsx`
  - Action: Create test file using Vitest and React Testing Library. Add tests for all 4 scenarios (auto-fill end, auto-fill start, correct end, correct start).
  - Notes: Mock `onSearch` prop.

- [x] Task 2: Implement Date Logic
  - File: `frontend/src/components/SearchForm.jsx`
  - Action: Import `addHours`, `subHours`, `parseISO`, `format`, `isAfter`, `isBefore` from `date-fns`. Update `handleChange` to implement the logic.
  - Notes: `datetime-local` format is `yyyy-MM-ddTHH:mm`. Ensure `date-fns` formatting matches.

- [x] Task 3: Verify Implementation
  - File: `frontend/src/components/SearchForm.jsx`
  - Action: Run tests and ensure they pass. Manually verify in UI if possible (optional in CLI).

### Acceptance Criteria

- [x] AC 1: Given start and end are empty, when user selects start date (T), then end date is set to T + 1 hour.
- [x] AC 2: Given start and end are empty, when user selects end date (T), then start date is set to T - 1 hour.
- [x] AC 3: Given both dates are selected (S, E), when user changes start date to S' > E, then end date is set to S' + 1 hour.
- [x] AC 4: Given both dates are selected (S, E), when user changes end date to E' < S, then start date is set to E' - 1 hour.

## Additional Context

### Dependencies

- date-fns

### Testing Strategy

- Unit tests in `frontend/src/components/SearchForm.test.jsx`.

### Notes

- None

## Review Notes
- Adversarial review completed
- Findings: 10 total, 0 fixed, 10 skipped
- Resolution approach: skip