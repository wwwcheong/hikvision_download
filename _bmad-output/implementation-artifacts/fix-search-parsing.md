# Fix Search Result Parsing

## Story
As a user, I want the search results to correctly display start time, end time, and file size, so that I can identify the recordings.

Currently, these fields are missing, but they are available within the `playbackURI` string returned by the API.

## Status
done

## Acceptance Criteria

- [x] Search results JSON must include `startTime` extracted from `playbackURI`.

- [x] Search results JSON must include `endTime` extracted from `playbackURI`.

- [x] Search results JSON must include `size` extracted from `playbackURI`.

- [x] Timestamps should be in a readable format `YYYY-MM-DD HH:mm:ss` in the frontend.

- [x] File size column added to frontend, displaying in MB (e.g., `1013M`).

- [x] Fix `400 Bad Request` during download by implementing partial encoding for `playbackURI`.



## Dev Agent Record

- File List:

    - backend/controllers/nvrController.js

    - backend/tests/nvr.test.js

    - frontend/src/components/ResultsTable.jsx
