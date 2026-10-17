# SpecSpace — current product

Status: implemented baseline, documented on 2026-10-17. This specification describes the existing MVP; it does not imply retrospective acceptance under an SDD process that did not yet exist. It is the source of truth for current behavior. Proposals belong in `specs/` until implemented and validated.

## Purpose and document model

A local desktop editor for technical specifications on macOS. A workspace is a folder selected by the user; each document is an existing UTF-8 `.md` or `.markdown` file. A tab tracks its text, saved version, and on-disk revision. Mermaid diagrams are blocks in the same Markdown file, not separate documents. There is no database or proprietary format.

## Current functionality

The primary open action is **File → Open Folder…** (⌘O), in the native menu. The upper-right button has been removed. Opening from the welcome screen and tab bar remains available.

- Native folder picker; lazily expanded directory explorer with refresh and filename filtering within expanded folders.
- Multiple document tabs, dirty indicators, independent editor undo histories, and source / split / preview layouts.
- CodeMirror Markdown editing with line numbers, syntax highlighting, search, undo/redo, and line wrapping.
- GitHub-flavored Markdown preview with tables, task lists, fenced code, and debounced Mermaid rendering with inline errors.
- Relative Markdown links navigate within the workspace.
- Explicit save, reload from disk, and save/discard/cancel protection on tab close, workspace switch, window close, and normal application quit.
- `⌘O` opens a workspace, `⌘S` saves, `⌘W` closes the current tab, and `⌘Q` quits; CodeMirror's `⌘F` searches the active document.

## Content and filesystem guarantees

Markdown source is never reconstructed from the preview. Frontmatter, comments, unknown syntax, UTF-8 BOM, final newline presence, and untouched line endings remain in the source. Inserted newlines use the document's first line ending; existing mixed line endings remain intact outside edited ranges.

The Rust backend owns the selected workspace. It accepts only relative paths, checks canonical containment, rejects symlink path components, and permits reads/writes only to existing `.md`/`.markdown` files. Invalid UTF-8, binary content, and documents over 8 MiB are rejected. Hidden files and build/dependency directories are omitted from the explorer.

A save checks a SHA-256 revision against the current file, writes and syncs a same-directory temporary file, checks the revision again, and atomically replaces the destination, preserving Unix permission bits. A conflict leaves both the editor and existing disk file untouched. Copy your edits somewhere safe or explicitly reload the disk version; remote merges remain your responsibility. This is optimistic concurrency: another process writing in the tiny interval between the final check and rename cannot be locked out. Atomic replacement does not preserve hard-link identity or all extended filesystem metadata.

Preview HTML is disabled. Mermaid uses strict mode and sanitized SVG; image and navigation elements are removed from diagrams. Remote images, arbitrary external links, and embedded resources are disabled. No general-purpose filesystem or shell permission is granted to the webview.

## Current limits

Existing files only: create, rename, and delete files using Finder or your existing tools, then refresh. There is no auto-save, crash recovery, session restore, file watcher, Git UI, cloud sync, or remote collaboration. A clean open tab does not automatically refresh after external edits; use **Reload from disk**. Force quit and power loss cannot show a pending-change prompt. Images and non-Markdown attachments are not rendered yet. Scroll positions in source and preview are independent. Frontmatter stays editable in source and is omitted from the rendered preview; there is no separate metadata UI.

## Baseline acceptance criteria

- Open a folder and browse documents in tabs without changing files merely by opening them.
- Edit, save, and reopen content while preserving syntax and untouched text.
- Render Markdown and Mermaid; show diagram errors without losing the editor.
- Reject a write if the on-disk revision changed; keep edits in memory.
- Offer save, discard, or cancel for pending changes when closing or switching workspaces.
- Reject path traversal, symlinks, non-UTF-8 files, and operations outside the workspace.

Available evidence and its limits are recorded in [PROJECT_STATUS.md](PROJECT_STATUS.md).
