# 003 — Create Markdown documents

Status: Implemented. Date: 2026-10-18.

## Problem and intended outcome

SpecSpace currently opens existing Markdown documents in a selected workspace. Starting a new specification requires leaving the application to create a file elsewhere. Users need a direct, safe way to create a Markdown document in the workspace and begin editing it.

The outcome is one new `.md` or `.markdown` file created within the open workspace and opened in an editor tab, using the existing source-preserving editing and explicit-save behavior.

## Relationship to VISION

**Aligns** with Horizon 1 — Authoring Workspace, especially completing the basic create, edit, preview, and save loop. It supports simple local Markdown authoring without adding a document-management platform.

## Scope

- Provide a clear create-document action when a workspace is open.
- Ask for a filename and a location within the current workspace.
- Accept `.md` or `.markdown` extensions; if the user omits an extension, append `.md`.
- Create an empty UTF-8 Markdown file and open it in a new active tab.
- Reveal or expand its containing folder in the explorer and refresh the relevant workspace view.
- Keep creation within the existing Rust-owned workspace boundary and existing hidden/symlink exclusions.
- Use exclusive creation so an existing file is never overwritten.
- If another open tab already refers to the selected path, focus that tab instead of creating a duplicate editor buffer.
- Leave all existing tabs and their pending edits untouched.

## Behavior and data contract

- The create action is unavailable until a workspace is open. The web preview without Tauri reports that local creation requires the desktop application.
- Accept a single filename, not a path containing separators. The chosen parent directory must be an existing directory inside the workspace; this increment does not create directories.
- Reject empty names, `.`/`..`, path separators, unsupported extensions, invalid filename characters on the current platform, and names that resolve outside the selected directory or workspace. Show an actionable error and keep the application state intact.
- An omitted extension becomes `.md`. Preserve a case-insensitive `.md` or `.markdown` extension as entered. Do not silently rewrite other extensions.
- If a file already exists at the requested location, do not alter it. Report the conflict and offer to open the existing Markdown file if applicable; otherwise leave the current view unchanged.
- Create the file atomically with create-new semantics. Do not follow symlinks. Recheck the parent and destination against the canonical workspace root at the filesystem boundary.
- A newly created tab starts clean with an empty source buffer. The user explicitly saves subsequent content using the existing save action. There is no starter template, automatic content, or autosave.
- If tab opening or explorer refresh fails after file creation, report the partial result and retain the created file. Do not attempt silent deletion as rollback.
- The new document participates in existing workspace scanning and connections after the applicable refresh; this increment does not add semantic links or alter graph meaning.

## Exclusions

Creating folders; renaming, moving, or deleting documents; templates; frontmatter forms; automatic headings or starter content; duplicate-name auto-renaming; import from non-Markdown formats; multi-file creation; file watchers; session restore; automatic saving; external workspace writes; and changes to Markdown preservation or preview rules.

## Acceptance criteria

1. With a workspace open, a user can create a document in the workspace root or an existing nested directory, and it appears in a new active tab and the explorer.
2. A name without an extension creates an `.md` file; `.md` and `.markdown` names are accepted case-insensitively. Other extensions and invalid names produce a clear error without creating a file.
3. Attempting to create an existing file never changes its bytes. The user can choose to open the existing Markdown document when appropriate, with no duplicate tab for the same path.
4. Traversal, absolute paths, symlinks, and destinations outside the workspace are rejected at the Rust boundary; filesystem fixtures verify these protections.
5. Creating a document leaves all existing tab contents, saved states, and undo histories intact. Editing and explicitly saving the new file uses the established save/conflict protections.
6. Canceling the filename/location interaction creates no file and leaves the workspace unchanged. Creation is unavailable without an open workspace.
7. Validate in the macOS application at normal and minimum supported window sizes; update SPEC, ARCHITECTURE, README, and PROJECT_STATUS with observed behavior and limitations.

## Decisions for implementation plan

- Use the native Save dialog, initially rooted at the open workspace. If the user selects a location outside the workspace, reject it at the Rust boundary and explain how to choose a location within the workspace.
- On an existing Markdown file, offer to open it; reuse its existing tab if already open. Other existing file types remain unchanged and show a conflict error.
- Add **New Markdown Document…** to the native File menu and a plus action in the workspace explorer header. Both use the same guarded flow.
- The dialog may select a filename with or without extension; Rust normalizes the extension after selection and returns the resolved workspace-relative path.

## Acceptance record

Accepted by the user with “aceptada” on 2026-10-18. Implementation decisions and validation evidence are recorded in the plan.

## Closure

Implemented locally on 2026-10-18. The native File menu and explorer action open a non-blocking save dialog, Rust validates containment and creates with exclusive semantics, and the new document opens in a clean active tab. Existing Markdown conflicts can be opened without duplicate tabs. Build, Rust tests, formatting, and diff checks passed. Packaged-app dialog behavior and the minimum-window visual check remain outstanding before release.
