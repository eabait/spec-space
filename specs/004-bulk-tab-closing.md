# 004 — Bulk tab closing

Status: Implemented. Date: 2026-10-18.

## Problem and intended outcome

Closing a review session currently requires closing documents one at a time. Users need to close all tabs or keep only the active tab without losing pending work accidentally.

## Relationship to VISION

**Aligns** with Horizon 1 — Authoring Workspace and the user-requested tab management priority. Assisted inventory remains deferred.

## Scope and behavior

- Add **Close All Tabs** and **Close Other Tabs** to the native File menu. Keep the existing single-tab close action and shortcut unchanged; no new shortcuts are required.
- Close All Tabs targets all open document tabs. Close Other Tabs targets all tabs except the active document at invocation, regardless of whether the editor or Connections view is visible.
- Disable Close All Tabs when no documents are open. Disable Close Other Tabs when there is no active document or no other tab to close. Revalidate these conditions when handling the command.
- Clean targets close without a prompt. If targets contain pending edits, show one prompt listing their workspace-relative paths with **Save All**, **Discard Changes**, and **Cancel**. The prompt concerns only targeted dirty documents, including when only one target is dirty.
- Save All uses the existing revision-checked save behavior for each dirty target. Remove the targeted tabs only after every required save succeeds.
- If a save fails or conflicts, stop, display the affected path and error, and keep every tab open. Earlier successful saves remain saved; unsaved buffers remain intact. Do not promise rollback of disk writes.
- Discard Changes closes the targeted tabs without writing their pending content to disk. Cancel keeps every tab, active selection, buffer, and undo history unchanged.
- Close Other Tabs preserves the active document, pending edits, undo history, and editor mode. Its dirty state alone must not cause a prompt.
- Close All Tabs leaves the workspace, explorer, and connections available with no active document. In the editor view, show the existing no-document state; Connections may remain visible.
- Serialize the operation with other workspace actions. Pending prompts and saves must prevent edits or competing commands from changing the target set or content being resolved. Cancellation or a failed save must not recreate retained editors or reset undo history.

## Exclusions

Tab reordering, pinned tabs, session restore, reopening closed tabs, autosave, per-document choices within the bulk prompt, tab context menus, new keyboard shortcuts, clipboard changes, Mermaid export, and changes to filesystem permissions or save guarantees.

## Acceptance criteria

1. Native menu actions correctly handle zero, one, and multiple tabs, with availability matching their valid targets.
2. Closing clean targets performs no writes and preserves the workspace; keeping the active tab preserves its content and undo history.
3. A mix of dirty and clean targets produces one prompt naming only dirty targets. Save All saves only those targets and closes the complete target set after success.
4. Discard Changes does not write; Cancel closes nothing and changes no editor state.
5. A conflict or write error on a later target keeps all tabs open, preserves remaining edits, and reflects earlier successful saves accurately.
6. A dirty active tab excluded by Close Other Tabs remains dirty and does not cause a prompt by itself.
7. Repeated commands and attempted edits during the operation cannot bypass protection or silently lose newer content. Existing single-tab closing, workspace switching, and normal quit protection continue working.
8. Verify the packaged macOS menu and prompt at normal and minimum supported window sizes using disposable documents, without closing user sessions.

## Planned validation

Focused interaction tests for target selection, all three prompt choices, partial-save failure, retained editor history, and competing actions. Run frontend tests, build, formatting, and diff checks. Build Tauri and inspect the actual release executable with disposable workspace files. Reuse existing Rust save protections; this proposal introduces no new filesystem operation.

## Risks and alternatives

A single Save All choice is intentionally simpler than per-document decisions. Successful saves before a later failure are durable and must be explained clearly. Long path lists must remain readable and scrollable at the minimum window size. Native menu state and command handlers must agree, including while Connections is shown.

## Acceptance and plan

Accepted by the user with “aceptada” on 2026-10-18. Implementation is authorized. See [plan 004](../plans/004-bulk-tab-closing.md) for steps and validation evidence.

## Closure

Implemented and validated locally on 2026-10-18. Native menu availability, target-only prompts, cancel/save/discard behavior, retained editor history, and minimum-window layout were checked against the release executable in an isolated disposable session. Automated tests cover partial-save failure, competing commands, and existing close protections. See plan 004 for exact evidence. No commit or publication was performed.
