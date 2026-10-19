# Current architecture

Updated: 2026-10-19, including session continuity and the visual experience (increments 009–010). Local desktop application built with Tauri 2, React 19, TypeScript, and Vite.

## Components and boundaries

| Component                                       | Responsibility                                                                     |
| ----------------------------------------------- | ---------------------------------------------------------------------------------- |
| `src/App.tsx`                                   | Workspace, lazy explorer, tabs, modes, prompts, and command coordination           |
| `src/Editor.tsx`                                | CodeMirror 6 instances, per-tab history, and edit events                           |
| `src/text.ts`                                   | Applying changes to original text and resolving relative links                     |
| `src/Preview.tsx`                               | React Markdown, GFM, omitted frontmatter, queued Pele rendering, and sanitized SVG |
| `src/pele-renderer.ts`                          | Lazy local Pele rendering with links and images disabled                           |
| `src/styles.css`                                | Presentation and responsive layout                                                 |
| `src-tauri/src/lib.rs`                          | Authorized workspace, session metadata, native pickers, reading, saving, menus     |
| `src-tauri/tauri.conf.json`                     | Window, CSP, and bundling                                                          |
| `src-tauri/capabilities/default.json`           | Minimal window capabilities                                                        |
| `tests/text.test.ts` and Rust tests in `lib.rs` | Text preservation, links, and filesystem boundaries                                |

## Data and operations

Rust maintains `Mutex<Option<PathBuf>>`: a canonicalized root selected through the native dialog. React tracks open documents with `content`, `saved`, `revision`, and a generation used to recreate the editor after reload. On normal relaunch, a small Rust-owned JSON record in Tauri's app config directory restores the last workspace, relative tab paths in order, and the active tab. It contains no document contents; restored files are read and validated through the existing Rust path boundary and start clean. Missing files are skipped, and a stale workspace leaves the welcome screen available. The app does not recover unsaved edits, editor history, or view state.

IPC commands include `load_session`, `save_session`, and `restore_workspace` alongside `choose_workspace`, `create_markdown_document`, `list_directory`, `open_document`, `write_document`, `workspace_snapshot`, and `check_reference_targets`. Session IPC reads and writes only the bounded navigation record; React has no general filesystem API. Rust resolves document paths, rejects symlink components, requires containment within the root, and uses exclusive creation for new documents.

Opening a file returns UTF-8 text and its SHA-256 revision. The editor applies changes to the original text while preserving the BOM and untouched line endings. Saving checks the revision, writes and syncs a temporary file next to the destination, checks again, then renames it. A concurrency window remains between the final check and rename; external writers are not locked out.

## Connections

`src-tauri/src/connections.rs` builds a bounded read-only workspace snapshot through shared directory enumeration and the existing authorized reader. `workspace_snapshot` runs blocking I/O on a worker thread. `check_reference_targets` validates absent targets without reading their contents, distinguishing missing, excluded, and unavailable destinations and returning canonical paths for existing files. Both commands use the selected Rust-owned workspace; neither adds a general-purpose filesystem API.

`src/connections.ts` parses saved Markdown with unified/remark and the same GFM/frontmatter conventions as the preview. It derives document records and directed reference pairs. `src/useConnections.ts` fetches snapshots, batches target checks, atomically replaces completed indexes, and retains a visibly stale snapshot on failure. Calls run inside App's serialized actions, preventing overlapping workspace changes and refreshes. Save errors propagate before indexing; indexing errors stay separate from successful disk writes.

`src/ConnectionsView.tsx` provides reference/backlink lists, missing-target reporting, and empty/error states. `src/ConnectionGraph.tsx` renders a deterministic SVG graph, fits it with ResizeObserver, and delegates navigation to App. Editors remain mounted inside a hidden wrapper during graph use. The graph and index are derived, in-memory state, with no semantic dependency model or persistent database.

`src/styles.css` owns the shared visual tokens and responsive presentation. `src/App.tsx` derives a compact effective pane mode from viewport width while preserving the selected mode and mounted editor state. Tauri's configured platform icons are generated from `src-tauri/icons/source.svg`.

`tests/connections.test.ts` covers Markdown semantics and resolution. `tests/connections-interactions.test.tsx` uses a simulated IPC boundary to cover saved/dirty buffers, navigation, save/scan failures, retries, refresh, and workspace switching. Native checks supplement these tests; they do not replace filesystem tests in Rust.

## Menus and lifecycle

File → Open Folder… emits `open-folder-requested` to the main window. The React listener uses the same guarded open flow as the welcome screen. ⌘O is registered natively; the web handler is only a browser fallback. Closing the window or quitting uses the unsaved-document guard. Force quit cannot protect edits in memory.

Session metadata is written atomically by Rust after workspace/tab navigation changes and before a guarded normal quit completes. The record is bounded and validates absolute workspace paths, relative Markdown paths, duplicate entries, and the active index. Startup canonicalizes the saved workspace and rejects a path that now resolves differently; each tab is reopened through `open_document`, which rejects traversal, symlinks, invalid Markdown, non-UTF-8 content, and oversized files. Persistence errors do not prevent editing or normal quit.

Bulk tab actions emit `close-tabs-requested` with an all/others scope. Rust stores menu handles in `TabMenu`; `set_tab_menu_state` only updates their enabled state. React queues availability updates in order and revalidates targets inside its action lock. It removes tabs only after the targeted dirty documents have been resolved; partial-save failures retain every editor and the successful saves already completed. The bulk prompt lists affected relative paths in a bounded scrollable list.

While an action is pending, background UI is inert. CodeMirror checks the synchronous action lock at transaction dispatch, including undo transactions that bypass transaction filters. This preserves mounted editor state/history and prevents edits during pending-close resolution without introducing new filesystem access.

## Preview and security

The preview never changes the source. HTML is disabled. Pele loads lazily to render Mermaid syntax; diagram links and images are disabled, and SVG is sanitized with DOMPurify, excluding links, images, and `foreignObject`. CSP restricts remote resources. See SPEC for the exact product scope and limits.

## Maintainability

`App.tsx` and `lib.rs` currently coordinate the MVP. Split workspace, tab, or file-service responsibilities when an increment calls for it; avoid speculative layers. New disk rules belong in Rust, and text transformations must retain preservation tests.
