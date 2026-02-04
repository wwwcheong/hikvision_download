---
title: 'Remember Downloaded Recordings and Allow Skipping'
slug: 'remember-downloaded-recordings'
created: '2026-02-03'
status: 'Completed'

## Review Notes
- Adversarial review completed
- Findings: 10 total, 8 fixed (including false positives verified), 2 skipped
- Resolution approach: Fix automatically
stepsCompleted: [1, 2, 3, 4]
tech_stack: ['React', 'JavaScript', 'Material-UI']
files_to_modify:
  - 'frontend/src/hooks/useDownloadQueue.js'
  - 'frontend/src/components/ResultsTable.jsx'
files_to_create:
  - 'frontend/src/hooks/useDownloadedLog.js'
code_patterns: ['React Hooks', 'localStorage API']
test_patterns: ['Vitest', 'React Testing Library']
---

## 1. Overview

### Problem Statement

The application currently has no memory of which files have been downloaded. Users who need to re-run searches or who download files across multiple sessions have no way to easily avoid re-downloading the same files. The "Select All" feature is inefficient if many files have already been acquired.

### Solution

We will use the browser's `localStorage` to keep a persistent log of successfully downloaded recordings. A new UI option will be added to the results table that modifies the "Select All" behavior to exclude these previously downloaded recordings from the selection. A visual indicator will also be added to show which files have been downloaded.

**Note:** This solution is client-side only; the download log is temporary and will be lost if the user clears their browser cache or switches machines.

### Scope

#### In Scope
- Creating a new custom hook (`useDownloadedLog`) to manage a `localStorage`-backed log of downloaded file identifiers.
- The unique identifier will be a composite key: `IP:Port-cameraID-startTime-endTime`.
- Integrating this hook into the download process (`useDownloadQueue`) to mark files as downloaded upon success.
- Adding a "Skip downloaded files" checkbox to the `ResultsTable`.
- Modifying the "Select All" functionality in `ResultsTable` to respect the "Skip downloaded files" option.
- Adding a visual indicator (e.g., a disabled checkbox and a greyed-out row) to recordings that have already been downloaded.

#### Out of Scope
- Any changes to the backend API.
- A UI for manually managing the downloaded log (e.g., clearing the log or marking files as "not downloaded").
- Changes to the download queue persistence (that's a separate `localStorage` item).

## 2. Context for Development

### Codebase Analysis

#### Codebase Patterns
- **Architecture**: The frontend is a standard Vite-powered React application. State is primarily managed within components using `useState`, with logic encapsulated in custom hooks (`useDownloadQueue`).
- **State Management**: State is lifted to the nearest common ancestor component (`App.jsx`) and passed down via props. Custom hooks are used to contain complex, reusable, stateful logic.
- **Styling**: Material-UI (`@mui/material`) is used for UI components and styling.
- **Testing**: The project uses Vitest and React Testing Library for unit and component tests. Test files (`*.test.jsx`) are located alongside their corresponding source files.

#### Files to Reference
| File Path | Purpose |
| --- | --- |
| `frontend/src/App.jsx` | Main application component, orchestrates all other components. |
| `frontend/src/hooks/useDownloadQueue.js` | Manages the download queue, state, and execution. |
| `frontend/src/components/ResultsTable.jsx`| Displays search results and handles user selections. |
| `frontend/src/components/SearchForm.jsx` | Provides the UI for search parameters. |

### Technical Preferences & Constraints

- All logic should be implemented on the frontend within the existing React application.
- To avoid prop-drilling, the new `useDownloadedLog` hook should be instantiated directly by any component or hook that requires it (`useDownloadQueue`, `ResultsTable`).
- UI elements should use the existing Material-UI component library for consistency.
- The unique identifier for a recording must be constructed consistently to ensure reliable matching. The **canonical format** shall be: `{credentials.ip}:{credentials.port}-{item.cameraID}-{item.startTime}-{item.endTime}`.

## 3. Implementation Plan

1.  **Create the `useDownloadedLog` Hook**
    -   **File:** `frontend/src/hooks/useDownloadedLog.js` (New file)
    -   **Action:**
        -   Create a new React hook named `useDownloadedLog`.
        -   Use `useState` and `useEffect` to manage a `Set` of downloaded recording IDs, persisting it to `localStorage` under the key `hik_downloaded_log`.
        -   Export three functions:
            -   `isDownloaded(item, credentials)`: Takes a recording item and credentials, constructs the canonical ID, and returns `true` if the ID is in the set.
            -   `addToDownloadedLog(item, credentials)`: Constructs the canonical ID and adds it to the set.
            -   `downloadedIdSet`: The `Set` object itself for efficient lookups.
    -   **Notes:** The canonical ID format is `{credentials.ip}:{credentials.port}-{item.cameraID}-{item.startTime}-{item.endTime}`.

2.  **Integrate with `useDownloadQueue`**
    -   **File:** `frontend/src/hooks/useDownloadQueue.js`
    -   **Action:**
        -   Import and instantiate the `useDownloadedLog` hook.
        -   In the `downloadWithRetry` function, after the download is successful (after `link.click()`), call `addToDownloadedLog(item, credentials)`.
        -   Ensure the `item` and `credentials` objects are available in this part of the code.

3.  **Update the `ResultsTable` Component**
    -   **File:** `frontend/src/components/ResultsTable.jsx`
    -   **Action:**
        -   Import and instantiate the `useDownloadedLog` hook.
        -   Add a new `useState` variable: `const [skipDownloaded, setSkipDownloaded] = useState(true);`.
        -   Add a new `<FormControlLabel>` with a `<Checkbox>` next to the "Select All" checkbox. This checkbox will control the `skipDownloaded` state.
        -   Modify the `handleSelectAll` function:
            -   If `skipDownloaded` is true, filter the `results` to only include items where `isDownloaded(result, credentials)` is `false`.
            -   Create the set of selected IDs from this filtered list.
        -   In the table row mapping (`results.map`), for each `row`, check if `isDownloaded(row, credentials)`.
        -   If it is, apply `disabled` prop to the row's checkbox and add a `sx={{ color: 'text.disabled' }}` style to the `<TableRow>` to visually indicate it's already downloaded.

## 4. Acceptance Criteria

-   **AC-1: Mark as Downloaded:**
    -   **Given** a recording is not marked as downloaded.
    -   **When** the user successfully downloads that recording.
    -   **Then** the recording's unique ID is added to the `hik_downloaded_log` in `localStorage`.
-   **AC-2: Visual Indicator:**
    -   **Given** a recording's ID exists in the `hik_downloaded_log`.
    -   **When** the results table is displayed with that recording.
    -   **Then** the row for that recording appears greyed out, and its checkbox is disabled.
-   **AC-3: Skip in Select All:**
    -   **Given** there are 5 downloaded and 5 new recordings in the results list.
    -   **And** the "Skip downloaded files" checkbox is checked.
    -   **When** the user clicks the "Select All" checkbox.
    -   **Then** only the 5 new recordings are selected.
-   **AC-4: Do Not Skip in Select All:**
    -   **Given** there are 5 downloaded and 5 new recordings in the results list.
    -   **And** the "Skip downloaded files" checkbox is **not** checked.
    -   **When** the user clicks the "Select All" checkbox.
    -   **Then** all 10 recordings are selected.

## 5. Testing Strategy
-   **Unit Tests (`useDownloadedLog.js`):**
    -   Mock `localStorage`.
    -   Test that `addToDownloadedLog` correctly adds an ID to storage.
    -   Test that `isDownloaded` correctly returns true/false.
-   **Integration Tests (`ResultsTable.jsx`):**
    -   Use React Testing Library to render the component.
    -   Mock the `useDownloadedLog` hook to provide a set of "downloaded" IDs.
    -   Verify that the correct rows are disabled.
    -   Simulate clicking the "skip" and "select all" checkboxes and assert that the correct items are passed to the `addToQueue` mock function.
