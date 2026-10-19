# 009 — Restore the last workspace and open tabs

Status: Implemented. Accepted: 2026-10-19. Implemented: 2026-10-19.

## Problem and intended outcome

SpecSpace does not remember the selected workspace or open documents after a normal application quit. Returning to an editing session requires opening the folder and finding each document again. Restore the last workspace and clean open tabs on the next normal launch so the user can resume navigation quickly, while keeping Markdown files as the source of truth.

## Relationship to VISION

Aligns with Horizon 1 — Authoring Workspace, especially continuity and confidence in longer editing sessions. This proposal narrows that direction to session navigation; it does not add crash recovery or autosave.

## Scope and behavior

- Persist only the most recently selected workspace path and the relative paths of open Markdown tabs, plus enough information to retain tab order and the active tab.
- On normal application startup, offer or perform restoration of that workspace and those tabs using the existing workspace boundary and file validation. Restore only files that still exist and are valid Markdown documents inside the selected workspace.
- Reopened tabs load current disk content through the existing Rust read path and start clean. Never restore unsaved editor text or claim crash recovery.
- If the workspace or a document is unavailable, do not block startup. Show a concise notice and let the user continue with the available workspace or welcome screen.
- Update the saved session as workspace and tab state changes, and clear it when the user explicitly closes the workspace if such an action exists.
- Keep the state local to the app. Do not sync it, include document contents, or expand webview filesystem access.

## Exclusions

Autosave; recovery of unsaved edits; crash or power-loss guarantees; saving scroll positions, selections, undo histories, editor modes, or Connections state; multiple named workspaces; recent-workspace history; file watching; cloud sync; and changes to Markdown or filesystem safety rules.

## Acceptance criteria

1. After a normal quit with a workspace and multiple tabs open, relaunch restores the same workspace, tab order, and active document with current on-disk contents and clean save state.
2. No unsaved editor text is persisted or restored. The existing close/quit guard continues to require its current save/discard/cancel resolution.
3. Missing, renamed, invalid, or out-of-workspace paths are skipped safely with an understandable notice; remaining valid tabs can still open.
4. Session metadata contains paths and navigation state only, is stored locally, and is not exposed through a new general filesystem API to the webview.
5. Automated tests cover persistence, normal restart reconstruction, stale paths, and preservation of the existing save/lifecycle protections. Build, formatting, Rust checks, and `git diff --check` pass.
6. Validate the behavior in an isolated packaged macOS app across normal quit/relaunch, preserving the user's open app session.

## Open decisions and risks

- Should restoration happen automatically, or should startup offer a **Restore session** action? Prefer automatic restoration unless testing shows surprising behavior when a workspace is moved or shared.
- Use a small Rust-owned app configuration record or an established Tauri plugin, subject to dependency and platform behavior review. Store no document contents.
- A workspace path can become stale or refer to removable storage. Restoration must be best-effort and must not silently choose a different folder with the same name.

## Acceptance record

Accepted by the user with “aceptada” on 2026-10-19 and implementation authorized with “aceptado el plan, implementar”. Implementation evidence and limits are recorded in [plan 009](../plans/009-session-continuity.md).

## Plan

See the matching [plan 009](../plans/009-session-continuity.md).

## Closure

Implemented locally on 2026-10-19. Rust stores only the last workspace, relative tab paths, and active-tab index in a bounded atomic JSON file under the app config directory. Normal startup restores valid tabs from current disk content; stale paths are skipped, and unsaved content is never persisted. Tests and isolated packaged-app quit/relaunch evidence are in plan 009.
