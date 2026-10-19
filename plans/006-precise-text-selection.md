# Plan 006 — Precise text selection

Status: Discarded by the user on 2026-10-19 after packaged-app validation.

Contract: [SPEC 006](../specs/006-precise-text-selection.md), accepted with “avanzar” on 2026-10-19.

## Initial state

The user reports that dragging to select text can appear to wait for a sentence or paragraph boundary before the highlight changes, and has narrowed the defect: horizontal dragging does not begin selecting, while downward dragging does. The editor is CodeMirror 6 and the preview is rendered HTML. Earlier checks confirmed exact final character ranges in both surfaces, but did not verify that the selection begins promptly during a horizontal drag. The color change improves visibility but did not resolve the underlying direction-specific behavior. Identify the affected surface and reproduce horizontal and downward drags before changing event behavior.

## Steps

1. Reproduce horizontal and downward drags separately in the source editor and rendered preview.
2. Make the source editor update a character selection directly from each pointer position during a simple primary-button drag, without taking over modified, multi-click, or existing-selection drags.
3. Add meaningful interaction coverage for selection/copy boundaries and preservation of editor content, dirty state, and undo history. Avoid tests that only restate a CSS implementation detail.
4. Run relevant frontend tests, build, formatting, and `git diff --check`.
5. Rebuild the macOS release bundle and verify selection in editor and preview at normal and minimum supported window sizes. Record which surface reproduced the issue and actual results.
6. Verify copy behavior and standard platform gestures before closing SPEC 006.

## Affected files

Expected: `src/Editor.tsx`, `src/Preview.tsx` or `src/styles.css` if the reproduction requires it, focused frontend interaction tests, this plan, SPEC 006, `ARCHITECTURE.md` if the implementation changes component behavior, and `PROJECT_STATUS.md`.

## Risks and preservation

- Platform text selection may already be character-based; the perceived delay could come from highlight styling, pointer handling, or testing a different surface. Do not add custom snapping or replace native selection gestures without evidence.
- Preview selection copies rendered prose while source selection copies Markdown. Both must preserve the exact selected text for their respective surfaces.
- Selection and copy must not mutate source content, dirty state, or undo history.

## Validation and resolution

The selection styling change in `src/Editor.tsx` and `src/styles.css` improves contrast: the active-line background is neutral gray, and selected source and preview text use a stronger blue highlight with a dark foreground. The user confirmed the color is better but reported the core defect remains in Source: horizontal dragging does not start selection, even across several words, while dragging down does. `src/immediateSelection.ts` now tracks simple primary-button drags that start in the editor and dispatches the exact character range at each pointer position. It leaves shift-modified, multi-click, and drags starting inside an existing selection to CodeMirror's normal handling.

- `npm test`: 25 frontend tests passed, including an interaction test that sends a horizontal mouse drag and verifies an exact partial-word range without changing the source or triggering `onChange`.
- `npm run build`: passed; Vite reports the existing large-chunk advisory.
- Prettier and `git diff --check`: passed.
- Rebuilt the isolated macOS test bundle with identifier `com.specspace.horizontalselectiontest`. The CUA drag attempt did not generate usable selection input, so no manual packaged-app result is claimed for the new horizontal-drag behavior. The earlier app checks verified exact final character ranges, but did not compare horizontal with downward drag onset.
- The open app session with the user's real workspace was left running and untouched. The usual `SpecSpace.app` bundle was rebuilt after confirming its `com.specspace.desktop` process was not running. The isolated test bundle uses the separate identifier `com.specspace.horizontalselectiontest`.

The user subsequently confirmed that selection works very well in Preview, but horizontal dragging in Source still does not select text even across several words. The user accepts this tradeoff and asked to discard SPEC 006. Reverted the 006-only source code, styling, and interaction test. Frontend tests (23), build, formatting, and `git diff --check` pass.

Rebuilding the standard macOS bundle after the rollback was attempted, but Tauri could not run because `cargo` is unavailable in this environment (`failed to run command cargo metadata: No such file or directory`). The existing packaged executable therefore has not been refreshed after the source rollback; rerun `npm run tauri build` when the Rust toolchain is available. No app session was closed.
