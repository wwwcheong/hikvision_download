---
title: 'Dockerize Hikvision Download App'
slug: 'dockerize-hikvision-app'
created: '2026-02-05'
status: 'completed'
stepsCompleted: [1, 2, 3, 4, 5, 6]
tech_stack: ['Node.js', 'Express', 'React', 'Vite', 'Docker']
files_to_modify: ['backend/server.js', 'Dockerfile', 'docker-compose.yaml', '.dockerignore']
code_patterns: ['Multi-stage Docker build', 'Express static file serving', 'SPA fallback routing']
test_patterns: ['Container startup verification', 'Port accessibility check']
---

# Tech-Spec: Dockerize Hikvision Download App

**Created:** 2026-02-05

## Review Notes
- Adversarial review completed
- Findings: 5 total, 3 fixed, 2 skipped (low impact/by design)
- Resolution approach: auto-fix
  - Fixed: Duplicate health check, .dockerignore missing files, static asset cache headers
  - Skipped: Hardcoded EXPOSE (Dockerfile limit), CORS default (Dev convenience)

## Overview

### Problem Statement

The application currently runs as separate local processes (Vite dev server and Node.js server), which is difficult to deploy and manage in a production-like environment.

### Solution

Create a unified `Dockerfile` that performs a multi-stage build (building the React frontend and then serving it via the Express backend) and a `docker-compose.yaml` for orchestration.

### Scope

**In Scope:**
- Multi-stage `Dockerfile` using `node:20-alpine`.
- Integration of the Vite build output into the Express backend static file serving.
- `docker-compose.yaml` with configurable `PORT` and `CORS_ORIGIN`.
- Support for production-ready backend execution.

**Out of Scope:**
- CI/CD pipeline configuration.
- SSL/TLS termination within the container.
- Persistent volume storage.

## Context for Development

### Codebase Patterns

- **Frontend Build:** Vite defaults to `dist` output.
- **Backend Serving:** Express needs to serve static files from the build directory and handle SPA routing (wildcard `*` route serving `index.html`).
- **Configuration:** Environment variables `PORT` and `CORS_ORIGIN` control server behavior.

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `backend/server.js` | Main Express server entry point. Needs modification to serve static assets. |
| `frontend/vite.config.js` | Vite build configuration. Defaults to `dist`. |
| `frontend/package.json` | Dependencies for build stage. |
| `backend/package.json` | Dependencies for runtime stage. |

### Technical Decisions

- **Single Container Architecture:** The backend will serve the static frontend files. This simplifies deployment to a single artifact.
- **Base Image:** `node:20-alpine` for reduced image size.
- **Environment Configuration:** `PORT` and `CORS_ORIGIN` will be passed via `docker-compose`.
- **Build Context:** The Docker build context will be the project root to access both `frontend` and `backend` directories.
- **Static Asset Path:** Frontend build artifacts will be copied to `backend/public` (or similar) inside the container.

## Implementation Plan

### Tasks

- [x] Task 1: Modify Backend to Serve Static Files
  - File: `backend/server.js`
  - Action: Import `path`. Add `express.static('public')` middleware. Add catch-all `*` route (after API routes) to serve `public/index.html`.
  - Notes: Ensure API routes take precedence.

- [x] Task 2: Create Docker Ignore File
  - File: `.dockerignore`
  - Action: Create file and exclude `node_modules`, `.git`, `.env`, `dist`, `coverage`, `tests`, `_bmad`, `_bmad-output`.
  - Notes: Prevents unnecessary files from invalidating the build cache.

- [x] Task 3: Create Multi-Stage Dockerfile
  - File: `Dockerfile`
  - Action: Create multi-stage build.
    - Stage 1 (builder): `node:20-alpine`. Copy frontend package files, install deps. Copy frontend source, run `npm run build`.
    - Stage 2 (runner): `node:20-alpine`. Workdir `/app`. Copy backend package files, install production deps (`npm ci --omit=dev`). Copy backend source. Copy `frontend/dist` from builder to `/app/public`. Expose port. CMD `node server.js`.
  - Notes: Ensure build args/env vars are handled if necessary (though mostly runtime here).

- [x] Task 4: Create Docker Compose Configuration
  - File: `docker-compose.yaml`
  - Action: Define `app` service. Build context `.`. Ports `${PORT:-5000}:5000`. Env vars `PORT=5000`, `CORS_ORIGIN=*`.
  - Notes: Allows easy local testing of the production container.

### Acceptance Criteria

- [x] AC 1: Docker build succeeds
  - Given the project root
  - When `docker-compose build` is run
  - Then the image builds successfully without errors

- [x] AC 2: Container starts and listens
  - Given a built image
  - When `docker-compose up` is run
  - Then the container starts and listens on port 5000

- [x] AC 3: Frontend is served
  - Given the running container
  - When accessing `http://localhost:5000/`
  - Then the React application loads

- [x] AC 4: API is accessible
  - Given the running container
  - When the frontend makes a request to `/api/health`
  - Then it receives a `200 OK` response

- [x] AC 5: SPA routing works
  - Given the running container
  - When accessing a non-root path (e.g., `/download`) directly
  - Then the React app loads (via `index.html` fallback)

## Additional Context

### Dependencies

- Docker
- Docker Compose

### Testing Strategy

- Build the Docker image.
- Run the container using `docker-compose up`.
- Verify the frontend loads on the configured port.
- Verify API calls from frontend to backend work correctly.
- Check container logs for any startup errors.

### Notes

- Ensure `backend/server.js` modifications are backward compatible with local dev if possible, or at least don't break it. Adding a check `if (process.env.NODE_ENV === 'production')` for the static serving logic is recommended.