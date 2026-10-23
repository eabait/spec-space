# SpecSpace — current product

Status: current product, updated on 2026-10-21 with [increment 015](specs/015-inspect-direct-node-connections.md), including direct node inspection for supported flowcharts and C4 diagrams; validation limits are in plan 015. The original MVP predates SDD; its documentation does not imply retrospective acceptance. This is the source of truth for current behavior. Proposals belong in `specs/` until implemented and validated.

## Purpose and document model

A local desktop editor for technical specifications on macOS. A workspace is a folder selected by the user; each document is an existing UTF-8 `.md` or `.markdown` file. A tab tracks its text, saved version, and on-disk revision. Mermaid diagrams are blocks in the same Markdown file, not separate documents. There is no database or proprietary format.

## Current functionality

The primary open action is **File → Open Folder…** (⌘O), in the native menu. Opening from the welcome screen and the **Open workspace** control beside **Connections** in the top bar remains available.

- Native folder picker; lazily expanded directory explorer with refresh and filename filtering within expanded folders.
- **File → Close All Tabs / Close Other Tabs**, also available by right-clicking any tab, close all documents or retain the clicked tab. One prompt lists only affected dirty paths and offers Save All, Discard Changes, or Cancel. A failed save keeps every tab open and retains any earlier successful saves. The active tab and its undo history survive Close Other Tabs; closing all keeps the workspace open.
- Multiple document tabs, dirty indicators, independent editor undo histories, and source / split / preview layouts.
- A warm editorial and blueprint-inspired visual system across workspace chrome, source editing, Markdown reading, diagrams, and Connections. Wide windows use a broad reading canvas beside Source; at compact widths the existing controls focus on Source or Preview while keeping the editor mounted and preserving its state. The macOS icon uses connected architectural modules rather than a book motif.
- After a normal quit, restore the last workspace and open Markdown tabs from current disk content, preserving tab order and the active document. Session metadata stores paths and navigation state locally; unsaved text, editor history, and view state are not restored. Unavailable documents are skipped with a status notice.
- **Outline** opens a transient nested heading list for the active document. It follows the active tab and current unsaved source, distinguishes repeated titles, and navigates to the selected heading in Source, Preview, or both Split panes. The panel is keyboard-operable, scrolls internally, and does not change document text or ordinary pane scroll coupling.
- GFM tables in Preview keep readable minimum cell widths and scroll horizontally within their own labelled region when they exceed the reading width. Header and body text align left for consistent scanning; source content and GFM alignment markers remain unchanged.
- CodeMirror Markdown editing with line numbers, syntax highlighting, search, undo/redo, and line wrapping.
- GitHub-flavored Markdown preview with tables, task lists, fenced code, and debounced local Mermaid-syntax rendering through Pele, with inline errors.
- Rendered diagrams can expand into a focused view with icon controls for zoom, Fit, Reset, image copying/saving, and return. Supported flowcharts offer **Find node**: case-insensitive label search, distinct results for repeated labels, and keyboard/pointer activation to center and highlight a node. **Node details** shows its direct incoming, outgoing, two-way, undirected, other, and self-connections; entries navigate to the connected node. Unresolved subgraph/container endpoints are counted separately. Search and inspection are local to the displayed diagram and do not modify source or exported images.
- Relative Markdown links navigate within the workspace.
- Explicit save, reload from disk, and save/discard/cancel protection on tab close, workspace switch, window close, and normal application quit.
- Create a new empty Markdown document from File → New Markdown Document… (⌘N) or the explorer plus action. A native save dialog chooses an existing workspace directory; omitted extensions become `.md`, and only `.md`/`.markdown` are accepted. Creation never overwrites an existing file. Existing Markdown conflicts can be opened and reuse an existing tab.
- `⌘O` opens a workspace, `⌘S` saves, `⌘W` closes the current tab, and `⌘Q` quits; CodeMirror's `⌘F` searches the active document.

## Content and filesystem guarantees

Markdown source is never reconstructed from the preview. Frontmatter, comments, unknown syntax, UTF-8 BOM, final newline presence, and untouched line endings remain in the source. Inserted newlines use the document's first line ending; existing mixed line endings remain intact outside edited ranges.

The Rust backend owns the selected workspace. It accepts only relative paths, checks canonical containment, rejects symlink path components, and permits reads/writes only to existing `.md`/`.markdown` files. Invalid UTF-8, binary content, and documents over 8 MiB are rejected. Hidden files and build/dependency directories are omitted from the explorer.

A save checks a SHA-256 revision against the current file, writes and syncs a same-directory temporary file, checks the revision again, and atomically replaces the destination, preserving Unix permission bits. A conflict leaves both the editor and existing disk file untouched. Copy your edits somewhere safe or explicitly reload the disk version; remote merges remain your responsibility. This is optimistic concurrency: another process writing in the tiny interval between the final check and rename cannot be locked out. Atomic replacement does not preserve hard-link identity or all extended filesystem metadata.

Preview HTML is disabled. Pele renders Mermaid syntax locally with sanitized SVG; diagram links and images are disabled and image/navigation/foreign-content elements are removed from diagrams. Pele's diagram layout and theme styling differ from Mermaid's. Remote images, arbitrary external links, and embedded resources are disabled. No general-purpose filesystem or shell permission is granted to the webview.

## Connected specifications

The **Connections** button opens a workspace graph and a document details panel. Nodes open or select existing tabs; **Go to editor** returns to the selected document. The editor remains mounted, preserving pending content and undo history. Directed edges mean “references”; outgoing references and backlinks are deduplicated by source/destination. The graph fits the available area, supports zoom and scrolling, and offers keyboard-operable nodes plus an All documents list with full paths.

The index reads saved Markdown throughout the workspace, including unexpanded folders. Inline and reference-style links to relative `.md` and `.markdown` files create connections. Code, images, HTML, frontmatter, unused definitions, external URLs, and paths escaping the workspace do not. A cross-document fragment establishes only a document reference; its section is not validated. Fragment-only links are ignored.

Missing document targets appear in Broken references. Rust checks absent targets so inaccessible, excluded, or unindexed files are not falsely labeled missing. Existing files on case-insensitive volumes resolve through their canonical paths. Hidden paths, `node_modules`, `target`, `dist`, and symlinks remain outside the index scope.

Opening a workspace, successfully saving or reloading a file, and explicitly refreshing rebuild connections from disk. Refresh workspace also refreshes the explorer. Refreshing connections never reloads editor buffers. Pending edits are labeled as absent from the graph. A scan failure preserves the previous snapshot with a stale warning and retry; it does not reverse or misreport a successful save. Changing workspaces clears the old snapshot. Reopening reconstructs it without a database.

Scans are bounded to 500 document/issue entries, 32 MiB total content, 10,000 directory entries, and 64 levels of nested directories, in addition to the existing 8 MiB per-file limit. Partial scans and unreadable files are reported. Connections are a best-effort saved-file snapshot; concurrent external writes can make it stale until refresh. No file watcher, semantic dependencies, or impact analysis is included.

## Current limits

Create Markdown files within the workspace using the native File menu or **+ New** in the explorer. Rename and delete files using Finder or your existing tools, then refresh. There is no auto-save or recovery of unsaved edits after a crash or power loss, file watcher, Git UI, cloud sync, or remote collaboration. A clean open tab does not automatically refresh after external edits; use **Reload from disk**. Force quit and power loss cannot show a pending-change prompt. Images and non-Markdown attachments are not rendered yet. Scroll positions in source and preview are independent. Frontmatter stays editable in source and is omitted from the rendered preview; there is no separate metadata UI.

## Baseline acceptance criteria

- Open a folder and browse documents in tabs without changing files merely by opening them.
- Edit, save, and reopen content while preserving syntax and untouched text.
- Render Markdown and Mermaid; show diagram errors without losing the editor.
- Reject a write if the on-disk revision changed; keep edits in memory.
- Offer save, discard, or cancel for pending changes when closing or switching workspaces.
- Reject path traversal, symlinks, non-UTF-8 files, and operations outside the workspace.

Available evidence and its limits are recorded in [PROJECT_STATUS.md](PROJECT_STATUS.md).

## Release preparation

The repository contains a macOS release-preparation workflow for version tags and manual retries. It checks versions and builds Apple Silicon/Intel ZIPs with checksums, then prepares a draft GitHub release for human review and publication. Developer ID signing, notarization, automatic publication, and app updates are excluded. Local validation has passed; actual hosted execution remains pending under [SPEC 018](specs/018-github-release-workflow.md) and [plan 018](plans/018-github-release-workflow.md). This infrastructure does not change application behavior.
