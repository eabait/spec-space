# 019 — Resize the three main panels

Status: Implemented and user-validated on 2026-10-27. Accepted by the user with “aceptado” on 2026-10-27; manual validation confirmed with “probado y aceptado el cambio”.

## Problem and intended outcome

The workspace explorer has a fixed width and Split mode assigns a fixed proportion of the document area to Source. Long file names, source corrections, and wide Preview content need different amounts of space. Let users resize the three main panels—Explorer, Source, and Preview—by dragging their vertical boundaries.

## Relationship to VISION

**Aligns** with Horizon 1 — Understanding and Review Workspace. Adjustable space makes navigation, reading, and occasional source corrections more comfortable while preserving the current local document workflow.

## Scope and behavior

- Add two visible vertical resize handles: one between Explorer and the main document area, and one between Source and Preview in Split mode. Use a horizontal-resize cursor and clear hover, focus, and active feedback consistent with the current visual system.
- Dragging the Explorer boundary changes its width and gives the remaining space to the main area. Preserve the preferred Source/Preview proportion within that remaining space, subject to minimum widths.
- Dragging the Source/Preview boundary changes their relative widths without moving the Explorer boundary. Both panes update continuously during the drag; releasing the pointer ends resizing even when it is outside the handle.
- Enforce usable minimum widths and constrain both handles to the available area. A drag must not collapse a pane, overlap controls, or create horizontal overflow of the application shell. Existing local overflow for wide tables and diagram content remains available. Record concrete size bounds in the implementation plan and verify them in the packaged app.
- Preserve the current compact behavior at viewport widths of 1100 px or less: Source and Preview remain individually available through their existing controls, and Split is temporarily unavailable. The inner resize handle is absent in single-pane and compact modes. At wider widths, cap Explorer resizing so both Split panes remain usable; do not switch modes merely because the user drags a handle.
- The Explorer boundary remains usable in Source, Preview, Connections, and welcome/zero-tab views when Explorer is visible. The Source/Preview handle is absent when no document is open. Hiding Explorer removes its handle; reopening it restores its preferred width within the available space. This increment does not add resizing inside Connections, Outline, or the focused diagram view.
- Retain the preferred Explorer width and Source/Preview proportion across tab changes, workspace changes, view changes, sidebar toggling, and window resizing during the current app session. Temporary clamping must not overwrite the preferred values; expanding the window restores the preferred arrangement when it fits.
- Start a new app session with the current defaults: a 248 px Explorer at wide sizes, 210 px in compact layout, and a 44% Source share in Split mode. Before an explicit resize, preserve those responsive defaults. Add a compact visible **Reset panel sizes** control with an accessible name and tooltip to return both preferences to these defaults during the session.
- Expose both handles as labelled, focusable vertical separators with their current value and available bounds. Support Left/Right adjustment when a handle has focus. These are local control interactions, not new application shortcuts.
- End an active drag cleanly on pointer cancellation, lost capture, window blur or resize, hidden views, or a guarded operation. Do not leave text selection disabled or a resize cursor active after interaction ends.

## State and preservation

Panel sizes are transient frontend view state shared across documents. Do not store them in Markdown, the workspace, or session metadata in this increment. Restart persistence can be considered separately.

Resizing must preserve open tabs, active document, source bytes, dirty state, editor selection, and undo/redo history. Keep editor instances mounted. Resizing may reflow text and clamp scroll positions to their new valid ranges, but must not reset either pane to the top or couple their independent scrolling. Handle interactions must not select document text or invoke save/reload operations. Existing unsaved-change guards and filesystem boundaries remain unchanged.

## Exclusions

No horizontal panel stacking, panel reordering, new collapse gestures, layout presets, settings screen, cross-session size persistence, new pane types, resizing of secondary panels, new dependencies required by the contract, remote resources, or webview permission changes. SPEC 017 remains independently accepted and pending.

## Acceptance criteria and validation

1. In a wide window with an open document, both handles can be dragged in either direction. Explorer, Source, and Preview visibly receive the requested space within the defined limits, with no layout overlap or application-level horizontal overflow.
2. Each handle affects its intended boundary. Dragging beyond the limits, releasing outside a handle, cancelling the pointer, or interrupting a drag leaves a usable, non-dragging layout.
3. Source-only, Preview-only, hidden Explorer, Connections, and empty-document states show only applicable handles. Changing these states preserves preferences and does not leave invisible interactive separators.
4. At 850 × 580, compact controls still provide usable Source and Preview views. Shrinking and re-expanding the window restores the previous Split choice unless the user explicitly chose Source or Preview while compact; explicit mode changes remain respected. Preferred dimensions return when feasible, and repeated resize cycles do not progressively alter the preferences.
5. Reset panel sizes restores the responsive defaults. Tab/workspace/view changes preserve preferences during the session; a fresh app launch uses defaults.
6. Separator labels, focus feedback, value/bound announcements, and focused Left/Right adjustment are usable. Normal text selection and pointer behavior resume after every completed or interrupted drag.
7. With an unsaved edit, a selection, and undo/redo history in an open document, both resizing paths and compact transitions preserve that state. Wide tables and diagrams remain usable, and resizing does not save or modify source content.
8. Focused automated checks cover boundary clamping, preference restoration, interaction cleanup, mode transitions, and editor-state preservation. Frontend tests, build, formatting for affected files, and `git diff --check` pass. Avoid tests that merely mirror CSS declarations.
9. Verify the rebuilt packaged macOS executable with a disposable workspace at normal and minimum sizes, including actual drag interactions, long file names, a wide table, a diagram, and an unsaved edit. Preserve the user's running session and record any unperformed checks explicitly.

## Risks and implementation decisions

- Existing compact behavior is expressed in both React and CSS. Keep their thresholds and handle visibility consistent.
- Viewport width alone does not describe the area left after Explorer resizing. Size bounds must account for the available content width and the handles themselves.
- Frequent layout updates must not recreate CodeMirror editors or rerender unchanged diagram source. Keep resizing responsibilities small and separate from document mutations.
- Reading content can reflow during resizing; native inspection is needed to verify useful minimum widths and stable reading context. Exact size bounds, pointer handling, and update scheduling belong in the plan.

## Acceptance and plan

On 2026-10-27, the user requested an improvement allowing the three main panels to be resized. This proposal interprets those panels as Explorer, Source, and Preview. The user accepted this written contract with “aceptado” on 2026-10-27.

Both `specs/` and `plans/` were enumerated before assigning 019. The matching plan is [plan 019](../plans/019-resizable-main-panels.md).

## Implementation outcome

The Explorer and Source/Preview boundaries are draggable with pointer capture and keyboard arrow adjustment. Explorer is clamped to 180–420 px; Split preserves a session-only Source share and keeps both panes at least 280 px when the available width allows it. A Reset layout control restores responsive defaults. Compact layouts retain the existing Source/Preview mode controls and hide the inner separator. Editors remain mounted and no document state is persisted or modified by resizing.

Frontend tests, build, formatting, and diff checks passed. The release macOS bundle was rebuilt at `src-tauri/target/release/bundle/macos/SpecSpace.app`. The user tested the change and accepted it on 2026-10-27.
