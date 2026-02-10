---
title: 'Fix Multi-Tab Guard Reload Race Condition'
slug: 'fix-multi-tab-guard-reload-race'
created: '2026-02-10'
status: 'Completed'
stepsCompleted: [1, 2, 3, 4, 5, 6]
tech_stack: ['React', 'MUI', 'BroadcastChannel', 'Playwright']
files_to_modify: ['frontend/src/components/MultiTabGuard.jsx', 'frontend/tests/multi_tab.test.cjs']
code_patterns: ['Singleton Tab Handshake', 'Manual-only Refresh', 'Instance ID Tie-breaker']
test_patterns: ['Playwright (Multi-tab)']
---

# Overview

## Problem Statement
The current `MultiTabGuard` implementation fails when the active tab is reloaded. During reload, the active tab stops responding to heartbeats, causing blocked tabs to incorrectly auto-unblock due to aggressive background polling. This results in multiple functional tabs being open simultaneously.

## Solution
Simplify the guard to a "Check-on-Mount" only model. Remove all background polling and auto-unblocking logic. The guard will only detect leadership status during initialization. To handle simultaneous loads, an `instanceId` tie-breaker will be used.

## Scope
- **In Scope**:
    - Refactor `MultiTabGuard.jsx` to remove `setInterval` and background unblocking.
    - Implement `instanceId` (random string/number) for tie-breaking during simultaneous loads.
    - Maintain a passive listener in the active tab to respond to new tab queries.
    - Update Playwright tests to verify manual-only refresh behavior.
- **Out of Scope**:
    - Background monitoring for leadership changes.
    - Redesigning the warning UI.

# Context for Development

## Codebase Patterns
- **BroadcastChannel Communication**: Uses `hik_tab_guard` channel for cross-tab coordination.
- **Handshake Protocol**: Mount -> QUERY -> WAIT -> (ACK ? BLOCKED : ACTIVE).
- **MUI Integration**: Uses standard MUI components (`Container`, `Alert`, `Button`) for the blocked UI.

## Files to Reference
| File | Role |
| :--- | :--- |
| `frontend/src/components/MultiTabGuard.jsx` | Implementation of the guard logic and UI. |
| `frontend/tests/multi_tab.test.cjs` | Integration test for multi-tab scenarios. |
| `frontend/src/main.jsx` | Integration point for the guard. |

## Technical Decisions
- **Stable Channel**: The `BroadcastChannel` should be initialized once and stored in a `useRef` to avoid missed messages during state transitions.
- **Manual-Only**: Remove the `setInterval` that periodically checks for leadership.
- **Tie-breaker**: The message payload for `HEARTBEAT_QUERY` will include an `instanceId`. If a tab in `checking` state receives a `QUERY` from another `checking` tab, the one with the lower `instanceId` will yield (block).
- **Graceful Active Listener**: The active tab must always respond to `QUERY` with `ACK`.

# Implementation Plan

- [x] Task 1: Refactor `MultiTabGuard.jsx` to use Stable Channel and Tie-breaker
  - File: `frontend/src/components/MultiTabGuard.jsx`
  - Action: 
    - Generate a random `instanceId` on component mount.
    - Use a `useRef` to maintain a single `BroadcastChannel` instance.
    - Update `useEffect` to send `HEARTBEAT_QUERY` containing the `instanceId`.
    - Implement tie-breaker logic in `onmessage`: if `status === 'checking'` and received `QUERY.instanceId > myInstanceId`, then `setStatus('blocked')`.
    - Remove the `setInterval` and auto-unblock logic.
    - Ensure the 'active' tab always responds to `QUERY` with `ACK`.

- [x] Task 2: Update Playwright Integration Test
  - File: `frontend/tests/multi_tab.test.cjs`
  - Action:
    - Update the test to verify that a blocked tab *remains* blocked after the leader is closed.
    - Verify that a blocked tab only becomes active after a manual `page.reload()`.
    - Add a test case for simultaneous load (opening two tabs at once) to verify the tie-breaker.

# Acceptance Criteria

- [x] AC 1: Multi-Tab Blocking (Static)
  - Given Tab A is active, when Tab B is opened, then Tab B must transition to the "Already Open" screen within 1 second and stay there.
- [x] AC 2: Manual Refresh Requirement
  - Given Tab A is closed and Tab B is blocked, when 5 seconds pass, then Tab B must still be blocked. When the user clicks "Refresh" in Tab B, then Tab B must become active.
- [x] AC 3: Simultaneous Load Race
  - Given no tabs are open, when Tab A and Tab B are opened simultaneously (within 100ms), then exactly one tab must become active and the other must be blocked.
- [x] AC 4: Reload Gap Resilience
  - Given Tab A is active, when Tab A is reloaded and Tab C is opened immediately during the reload, then Tab A (once loaded) or Tab C must become the leader, but never both.

# Dependencies
- None (Standard React/MUI/Web APIs).

# Testing Strategy
- **Integration**: Run `node frontend/tests/multi_tab.test.cjs`.
- **Manual**: Open the app in two tabs, close the first, observe the second remains blocked, click refresh, observe it becomes active.

# Notes
- **Handshake Timeout**: 1000ms is chosen to balance UX with race resilience.
- **Tie-breaker**: Using a random string/number is sufficient for this low-concurrency application.

## Review Notes
- Adversarial review completed.
- Findings: 12 total, 12 fixed/mitigated, 0 skipped.
- Resolution approach: auto-fix applied for all real findings.
- Key improvements: Stronger instanceId, BroadcastChannel error handling, debug logging, and improved test robustness.