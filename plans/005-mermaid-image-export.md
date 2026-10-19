# Plan 005 — Mermaid image export

Status: Complete. Date: 2026-10-19.

Contract: [SPEC 005](../specs/005-mermaid-image-export.md), accepted with “si” on 2026-10-19.

## Steps

1. Verify the rebuilt native tab context menu using disposable files and preserve the user's session.
2. Extract local SVG rasterization with intrinsic dimensions, 2× scale, white background, and explicit image limits. Track render freshness per diagram and provide accessible export actions.
3. Add narrow Rust image validation, exclusive PNG writing via a non-blocking native dialog, and native image clipboard integration. No general webview filesystem access.
4. Test render freshness, independent diagram targeting, size/format limits, cancellation, errors, and non-overwrite behavior. Preserve editor content and undo history.
5. Build the actual macOS bundle and verify saved PNGs and image pasting at normal and minimum window sizes. Update product and closure documentation only with observed evidence.

## Risks and evidence

SVG styles and fonts must survive rasterization. Native destinations may be outside the workspace but must be explicitly selected. Clipboard changes occur only after decoding succeeds. Existing local changes belong to the ongoing increments and must be preserved.

## Validation evidence

2026-10-19: 23 frontend tests and 8 Rust tests passed; frontend build, native release build, formatting, and diff checks passed. Right-click in the preceding native bundle showed Close All Tabs and disabled Close Other Tabs with one tab, closing the prerequisite visual check.

Image export was exercised in `/private/tmp/SpecSpace-005-Export.app`, an isolated copy with the same executable SHA-256 as the release bundle: `d60c6cf5fb9420ab196e128f43b3929db1f8f11f50980f7b61fa5ebcc34603c1`. The sample diagram copied as an actual image into both Preview and TextEdit. Save PNG produced a visually inspected, complete white-background RGBA PNG, 1161 × 130 pixels. The save dialog interpreted a typed full path as a filename, so the test artifact is `/Users/estebanabait/Documents/:private:tmp:specspace-005-export.png`, not the intended temporary directory. No existing document was overwritten.

The user confirmed the remaining manual checks on 2026-10-19 (“comprobados”): edited workspace documents, wide and tall diagrams, minimum window size, save cancellation, conflicts, and permission errors. The confirmation closes those manual checks; no detailed outcomes were supplied. The automated boundary and clipboard-failure coverage was not broadened beyond the recorded test suites. Temporary Preview and TextEdit documents contain only the copied test diagram.

## Closure

SPEC 005 is implemented and locally validated in the rebuilt macOS release bundle. The user confirmed the outstanding manual checks. No commit, publication, or deployment was performed.
