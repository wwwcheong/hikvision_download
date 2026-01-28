---
title: 'Hikvision NVR Web Downloader'
slug: 'hikvision-nvr-web-downloader'
created: '2026-01-28'
status: 'completed'
stepsCompleted: [1, 2, 3, 4]
tech_stack: ['React', 'Express', 'Node.js', 'Vite', 'Material UI', 'Axios', 'xml2js']
files_to_modify: ['frontend/src/App.jsx', 'frontend/src/components/ConnectionForm.jsx', 'frontend/src/components/SearchForm.jsx', 'frontend/src/components/ResultsTable.jsx', 'backend/server.js', 'backend/routes/nvrRoutes.js', 'backend/controllers/nvrController.js', 'backend/utils/isapi.js', 'backend/utils/digestAuth.js', 'backend/tests/nvr.test.js', 'frontend/src/components/ConnectionForm.test.jsx']
code_patterns: ['REST API', 'Proxy Pattern', 'Component-Based UI', 'Separation of Concerns']
test_patterns: ['Jest (Backend)', 'React Testing Library (Frontend)']
---

# Tech-Spec: Hikvision NVR Web Downloader

**Created:** 2026-01-28

## Overview

### Problem Statement

Users currently lack a lightweight, web-based tool to search for and download specific video segments from Hikvision NVRs, likely relying on heavy native clients. A simplified interface for querying by time range and downloading is needed.

### Solution

A web application with a React frontend and Express.js backend. The frontend provides a form for NVR credentials and time selection. The backend acts as a middleware proxy, handling ISAPI authentication (Digest) to auto-discover cameras, search recordings, and proxy file downloads to the client.

### Scope

**In Scope:**
- **Frontend:** React-based single page application (SPA).
  - Connection form (IP, Port, Username, Password).
  - Date/Time range picker.
  - Search results table (Camera Name, Start Time, End Time, Size).
  - Download button (supports multiple selections/queue).
- **Backend:** Express.js REST API.
  - Proxy endpoints for NVR ISAPI communication.
  - Implementation of HTTP Digest Authentication.
  - Camera list discovery logic (for mapping IDs to Names).
  - Search logic iterating through all cameras.
  - Stream-based download proxying (NVR -> Backend -> Client).

**Out of Scope:**
- Live video streaming/preview.
- PTZ controls.
- Playback within the browser (download only).
- Management of multiple NVRs simultaneously.
- User management/Login system for the app itself (app is stateless/passthrough).

## Context for Development

### Codebase Patterns

- **Frontend (React + Vite + MUI):**
    - `src/components/`: Reusable UI components (ConnectionForm, SearchForm, ResultsTable).
    - `src/api/`: Axios instances for communicating with the backend.
    - `src/App.jsx`: Main layout and state management.
- **Backend (Express):**
    - `server.js`: Entry point, middleware setup.
    - `routes/`: API route definitions.
    - `controllers/`: Request handling logic.
    - `services/`: Business logic (NVR communication, XML parsing).
    - `utils/`: Helper functions (Digest Auth wrapper).

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `ISAPI.md` | API documentation for Hikvision ISAPI protocols (Auth, Search, Download). |

- **Download:** Backend streams the binary response from NVR directly to the client response to avoid storing large files on the server disk.
- **Sequential Search:** To avoid overloading the NVR CPU, the backend will perform per-camera searches sequentially rather than in parallel.
- **Stream Verification:** The backend will monitor the `Content-Length` of the NVR response and compare it to the bytes transferred to ensure file integrity.
- **Styling:** Material UI (MUI) for a clean, modern, and quick-to-build interface.
- **Build Tool:** Vite for fast frontend development and building.

## Implementation Plan

### Tasks

- [x] Task 1: Project Initialization
  - File: `package.json`, `backend/package.json`, `frontend/package.json`
  - Action: Set up monorepo structure (root, backend, frontend). Install dependencies: `express`, `cors`, `xml2js`, `axios`, `digest-fetch` (backend); `react`, `vite`, `@mui/material`, `axios` (frontend).
  - Notes: Ensure concurrently is set up to run both servers.

- [x] Task 2: Backend Core Setup
  - File: `backend/server.js`
  - Action: Initialize Express app, configure CORS to allow frontend, parse JSON bodies.
  - Notes: Set up basic health check endpoint.

- [x] Task 3: ISAPI Utility Service
  - File: `backend/services/isapiService.js`
  - Action: Implement helper functions for ISAPI calls.
    - `createClient(ip, port, user, pass)`: Returns an HTTP client with Digest Auth.
    - `parseXml(xmlString)`: Wraps xml2js to return JSON.
    - `buildSearchXml(searchParams)`: Generates the XML body for `/ISAPI/ContentMgmt/search`.
  - Notes: Use `digest-fetch` or similar for handling the challenge-response.

- [x] Task 4: Camera Discovery Endpoint
  - File: `backend/controllers/nvrController.js`, `backend/routes/nvrRoutes.js`
  - Action: Create `POST /api/connect` endpoint.
    - Accepts credentials.
    - Calls `GET /ISAPI/System/deviceInfo` to verify connection.
    - Calls `GET /ISAPI/ContentMgmt/InputProxy/channels` (or similar) to list cameras.
    - Returns list of cameras {id, name}.

- [x] Task 5: Search Recording Endpoint
  - File: `backend/controllers/nvrController.js`, `backend/routes/nvrRoutes.js`
  - Action: Create `POST /api/search` endpoint.
    - Accepts credentials, start/end time.
    - Retrieves camera list (if not cached/provided) to get all IDs.
    - Iterates through ALL camera IDs SEQUENTIALLY to perform ISAPI search for each.
    - Aggregates results, mapping `trackID` back to Camera Name.
    - Returns flat list of recordings with Camera Name included.

- [x] Task 6: Download Proxy Endpoint
  - File: `backend/controllers/nvrController.js`, `backend/routes/nvrRoutes.js`
  - Action: Create `GET /api/download` endpoint.
    - Accepts credentials and `playbackURI` (and potentially range params).
    - Initiates request to NVR.
    - Pipes NVR response stream directly to Express response.
    - Sets appropriate Content-Disposition headers for file download.

- [x] Task 7: Frontend Connection Form
  - File: `frontend/src/components/ConnectionForm.jsx`
  - Action: Create form with fields for IP, Port, Username, Password. Submit calls `/api/connect`.
  - Notes: Store credentials in parent state (App.jsx) upon success.

- [x] Task 8: Frontend Search & Results
  - File: `frontend/src/components/SearchForm.jsx`, `frontend/src/components/ResultsTable.jsx`
  - Action:
    - SearchForm: Date/Time pickers ONLY (Camera selection removed).
    - ResultsTable: Display list with "Camera Name" column. Checkbox for selection.
    - Download Logic: Button triggers window.open or hidden iframe for `/api/download` URL.

### Acceptance Criteria

- [x] AC 1: Given valid NVR credentials, when user clicks "Connect", then the app displays a list of available cameras.
- [x] AC 2: Given invalid credentials, when user clicks "Connect", then an error message is shown.
- [x] AC 3: Given a selected camera and date range, when user clicks "Search", then a table of recordings (start, end, size) is displayed.
- [x] AC 4: Given a list of search results, when user selects a file and clicks "Download", then the browser initiates a file download of the video.
- [x] AC 5: The application handles NVR network timeouts gracefully with a user-friendly error.

## Additional Context

### Dependencies

- **Frontend:** `react`, `react-dom`, `@mui/material`, `@emotion/react`, `@emotion/styled`, `axios`, `date-fns` (for date formatting).
- **Backend:** `express`, `cors`, `body-parser`, `axios`, `xml2js` (for XML parsing/building), `node-fetch` (compatible with digest-fetch) or `urllib`.

### Testing Strategy

- **Backend:** Unit tests for `xml2js` parsing of NVR responses and XML generation for search requests. Integration tests for API endpoints using mocks for NVR calls.
- **Frontend:** Component testing for forms and tables to ensure correct state updates and API calls.
- **Fuzz Testing:** Provide malformed XML to the ISAPI parser in the backend tests to ensure stability.

### Notes

- Reference `ISAPI.md` strictly for ISAPI endpoints and XML structures.
- Important: Browser cannot do Digest Auth directly to NVR due to CORS, hence the proxy requirement.

## Review Notes
- Adversarial review completed
- Findings: 8 total, 8 fixed, 0 skipped
- Resolution approach: walk-through & auto-fix

## Senior Developer Review Fixes (AI)
- **Implemented Missing Tests:** Added `backend/tests/nvr.test.js` covering `POST /connect` and `POST /search` with mocks. Added `frontend/src/components/ConnectionForm.test.jsx`.
- **Configured Test Infrastructure:** Added `jest`, `babel-jest`, `supertest` to backend; `vitest`, `@testing-library/react` to frontend. Fixed ESM/CJS interop issues with `digest-fetch` using Babel.
- **Code Cleanup:** Removed unused `axios` dependency from backend.
- **Bug Fix:** Fixed `TypeError: DigestFetch is not a constructor` in `isapiService.js` by correctly accessing the default export of the ESM package in CommonJS.
- **Documentation:** Added clarification comment for trackID magic number logic in `nvrController.js`.

