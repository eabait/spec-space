# 005 — Mermaid image export

Status: Implemented locally. Date: 2026-10-19.

## Problem and intended outcome

Users need to reuse individual Mermaid diagrams in presentations, messages, and documents without taking screenshots or leaving SpecSpace to render them again.

## Relationship to VISION

**Aligns** with Horizon 1 — Authoring Workspace and the explicit request to save Mermaid diagrams as PNG files and copy them as images. General text clipboard improvements and assisted inventory remain separate.

## Scope and behavior

- Each successfully rendered Mermaid block offers **Save PNG…** and **Copy Image** in split and preview modes, with accessible labels identifying the diagram.
- Both actions capture the entire diagram, including portions outside the visible scroll area, without editor chrome or action buttons. Use a white background and a fixed 2× raster scale relative to the SVG's intrinsic dimensions, independent of display density.
- Export the current rendered content, including unsaved edits. Disable actions while that block is rendering or invalid; never silently export an older successful render after a source change.
- Save PNG opens a non-blocking native save dialog with a suggested document-based filename and diagram ordinal. The user may choose a destination outside the workspace. This is a narrowly scoped image export, not general filesystem access.
- Add `.png` when no extension is given; reject other extensions with a clear error. For this increment, never overwrite existing files: report the conflict and let the user choose another filename.
- Copy Image places an actual image on the macOS clipboard, suitable for pasting into an image-capable application. It does not copy SVG markup, a data URL, or Markdown text. Replace clipboard contents only after image generation succeeds.
- Report success only after the write or clipboard operation succeeds. Canceling the save dialog is a no-op. Failures keep the document and preview intact and allow retry.
- Preserve Markdown source, dirty state, selection, and undo history. Export neither saves nor modifies the source document.
- Keep rendering local and retain existing SVG sanitization and remote-resource restrictions. Validate image format and size at the native boundary; permit at most 16 megapixels and 8192 pixels on either dimension. Reject larger exports explicitly rather than silently clipping or reducing scale.

## Exclusions

SVG/PDF export, whole-document export, bulk diagram export, transparency or scale settings, automatic overwriting, remote rendering, general-purpose clipboard fixes, and new diagram editing features.

## Acceptance criteria

1. A document with multiple diagrams exports or copies the selected block only, in split and preview modes.
2. PNG output includes the complete diagram with readable labels, white background, fixed scale, and no clipping or UI controls; verify wide and tall diagrams.
3. Unsaved edits appear in the export after rendering finishes. Pending or failed renders cannot export stale content.
4. Save works inside and outside the workspace only through the chosen native destination. Cancellation, existing files, unsupported extensions, permission failures, and image-size limits preserve existing files and editor state.
5. Copy Image pastes as an image into macOS Preview and another available image-capable application. Failure does not report success or replace the clipboard prematurely.
6. Source bytes, pending edits, and undo history survive successful, canceled, and failed actions.
7. Verify controls and feedback at normal and minimum supported window sizes in the newly built macOS release executable, identified by full path. Browser builds alone do not establish completion.

## Planned validation and risks

Use focused interaction tests for render freshness, individual block targeting, and error states; native tests for image validation and exclusive writes; and real packaged-app save/paste checks with disposable documents. Inspect generated PNGs visually, including long labels and large diagrams. SVG rasterization must retain the fonts and styles needed by the sanitized preview without fetching resources.

Before beginning implementation, finish the outstanding packaged context-menu verification from increment 004. This proposal does not imply that verification already passed.

## Acceptance and plan

Accepted by the user with “si” on 2026-10-19. Implemented locally; the user confirmed the remaining manual checks with “comprobados” on 2026-10-19. See [plan 005](../plans/005-mermaid-image-export.md) for implementation and validation evidence.
