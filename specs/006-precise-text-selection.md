# 006 — Precise text selection

Status: Discarded by the user on 2026-10-19 after packaged-app validation.

## Problem and intended outcome

When selecting text by dragging, the visible selection can wait until it reaches a sentence or paragraph boundary. The user has now narrowed the behavior: a horizontal drag does not start selecting, while a downward drag does. This makes it hard to see whether the intended text is selected while the pointer is moving and makes copying a precise fragment feel delayed and unpredictable.

Users need text selection to follow the pointer continuously, with character-level control and immediate visible feedback.

## Relationship to VISION

**Aligns** with Horizon 1 — Authoring Workspace by reducing friction in everyday editing and copy/paste. It does not change document storage or Markdown semantics.

## Scope and behavior

- In the Markdown source editor and rendered prose preview, dragging across selectable text updates the selection continuously as the pointer moves.
- The visible highlight follows the current pointer position without waiting for a sentence or paragraph boundary.
- Dragging selects the exact character range between the anchor and current pointer position; it does not expand or snap to a sentence or paragraph.
- Preserve normal platform gestures such as click placement, shift-click extension, double-click word selection, and triple-click line or paragraph selection where supported.
- Copying selected source text copies the exact Markdown source range. Copying selected preview prose copies the selected rendered text and does not include surrounding controls or interface labels.
- Selection and copying do not change document content, dirty state, or undo history.

## Exclusions

Changing Markdown rendering, smart punctuation, clipboard formats, diagram-image copying, editor keybindings, drag-and-drop file behavior, touch selection, or adding a selection toolbar.

## Acceptance criteria

1. In the packaged macOS application, dragging over prose in the source editor and rendered preview visibly updates the highlight during the drag, without sentence or paragraph snapping.
2. Dragging can select and copy a substring that starts and ends in the middle of words; the clipboard contains exactly the selected content for that surface.
3. Standard click, shift-click, double-click, and triple-click selection gestures continue to work where supported by the platform and surface.
4. Selection and copy leave source bytes, pending edits, dirty state, and undo history unchanged.
5. Verify selection feedback and copying in the rebuilt packaged app at normal and minimum supported window sizes. Include short and long paragraphs and selections across line wraps.

## Open questions and risks

- Identify whether the horizontal-drag failure occurs in the source editor, rendered preview, or both before choosing a surface-specific fix. The proposal covers both text surfaces so the interaction is consistent.
- Diagnose whether the delay comes from selection behavior, styling, or event handling before choosing an implementation. Do not add sentence or paragraph snapping as a replacement behavior.
- Native text-selection behavior can differ between CodeMirror and the platform webview; test both surfaces in the packaged application.

## Acceptance and plan

Accepted by the user with “avanzar” on 2026-10-19. See [plan 006](../plans/006-precise-text-selection.md) for implementation and validation.

## Resolution

The user confirmed that selection works very well in Preview, while horizontal selection in Source remains broken even when dragging across several words. The user accepts this as a tradeoff and asked to discard the increment. The SPEC 006 source implementation was reverted. The existing packaged app still contains the previous build; rebuilding it is pending because `cargo` is unavailable, as recorded in plan 006.
