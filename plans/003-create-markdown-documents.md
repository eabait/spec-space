# Plan 003 — Create Markdown documents

Status: Complete. Date: 2026-10-18.

Contract: [SPEC 003](../specs/003-create-markdown-documents.md), accepted by the user's “aceptada” on 2026-10-18.

## Initial state

The existing native Rust boundary can list, read, and safely save Markdown files within the selected canonical workspace. It rejects traversal and symlink components. The React app has tabs, unsaved-edit protection, a lazily loaded explorer, and native File → Open Folder…. There is no create-file operation. Existing local 001 changes are uncommitted; preserve them.

## Decisions

- Use the native Save dialog initialized to the workspace root. Rust revalidates the selected absolute path against the current canonical workspace, rejects escapes/symlinks, normalizes an omitted extension to `.md`, and accepts `.md`/`.markdown` case-insensitively.
- Use Rust exclusive creation (`create_new`) to prevent overwrite races. Do not rely on dialog state for safety.
- If the destination exists and is Markdown, return a typed conflict outcome. The UI offers to open it; `open()` focuses an existing tab or opens one new tab. Other file types remain untouched and produce an error.
- Place the action in the native File menu and explorer header. A single emitted menu event invokes the same React guarded flow.
- No confirmation is needed for creating a new file. Existing open tabs and dirty buffers remain mounted. The new empty document opens clean and subsequent edits use the current explicit save flow.

## Steps

1. Implement a small Rust create operation and path validation helpers. Require the open workspace, canonical containment, existing in-root parent, non-symlink components, supported extension, and exclusive destination creation. Return the relative path for a newly created file; represent existing Markdown as a non-error conflict result for the UI.
2. Add focused Rust tests for extension normalization, root and nested destinations, existing-file non-overwrite, invalid names, traversal, parent symlinks, and workspace containment.
3. Add native File menu event **New Markdown Document…**. In React, open a native Save dialog at the workspace root; cancel without side effects; call the Rust operation only after selection. Add an accessible plus control to the explorer heading.
4. Handle success by refreshing the destination's explorer parent and connections, opening the document as the active clean tab, and preserving other tab state. Handle Markdown conflict with Open existing/Cancel; show clear errors for other conflicts or failed creation. Describe partial refresh failure without deleting the file.
5. Add interaction coverage for cancellation, success, existing open-tab reuse, existing-file choice, error handling, and preservation of dirty tabs. Build and inspect native menu/dialog flow and explorer layout at normal and minimum supported window sizes.
6. Run relevant Rust/TypeScript checks, formatting, build, `git diff --check`, and native verification. Update SPEC, ARCHITECTURE, README, PROJECT_STATUS, and indexes with measured behavior and limitations.

## Affected files

Expected: `src-tauri/src/lib.rs`; `src/App.tsx`; `src/styles.css`; focused Rust and React interaction tests; `specs/003-create-markdown-documents.md`; this plan; `SPEC.md`; `ARCHITECTURE.md`; `README.md`; `PROJECT_STATUS.md`; `specs/README.md`; possibly `plans/README.md`. Keep Rust as the only filesystem writer and avoid expanding webview filesystem permissions.

## Risks and preservation

- Save dialogs can return paths outside the workspace; the Rust command must independently reject them before creating anything.
- A check-then-create sequence can overwrite a racing file; use exclusive OS create semantics.
- Native dialogs and in-app command events must be tested in the packaged desktop application, not inferred from browser preview.
- After creation, opening or refreshing can fail. Report the created relative path and preserve the file so the user can recover it.
- Existing documents and pending edits must remain intact. No rollback may delete a successfully created file.

## Validation

Completed locally: `npm run build` passed; `cargo test --manifest-path src-tauri/Cargo.toml` passed with 7 tests; formatting and `git diff --check` passed; `npm run tauri build` produced the macOS bundle. The first implementation used the blocking dialog API on the UI command path and could make the application appear unresponsive. It was replaced with the plugin's callback based non-blocking `save_file` API; the result is emitted back to React after the dialog closes. The user confirmed on 2026-10-19 that the document-creation dialog in the packaged macOS app is OK. Minimum-window visual inspection remains outstanding.

## Closure

Implementation and local validation are complete. The user confirmed the packaged-app dialog is OK; minimum-window visual inspection remains outstanding. No commit or publication was performed.
