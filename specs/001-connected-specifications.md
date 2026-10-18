# 001 — Connected Specifications

Status: Implemented. Date: 2026-10-17.

Transitions on 2026-10-17: accepted from explicit user approval, then in progress after the plan was recorded, then implemented after local validation. See the plan for results.

## Problem and outcome

The existing explorer and relative Markdown navigation help read individual files, but do not expose incoming references or the structure of a documentation set. Users should understand and navigate explicit connections between saved workspace documents.

Relationship to VISION: **Aligns**, especially Horizon 2, Connected Specifications. An edge means “references”, not semantic dependency or proven change impact.

## Scope

- Index eligible Markdown documents throughout the selected workspace, including unopened folders.
- Show outgoing references and backlinks for a selected document.
- Report references to missing Markdown documents.
- Provide a basic directed document graph whose nodes open documents.
- Rebuild on workspace opening, successful saves, and explicit refresh. Reconstruct the index when reopening a workspace.

## Behavior and data contract

- Markdown files remain the sole source of truth. Indexing is read-only and derived from saved content. Unsaved edits are identified as absent from connections; refreshing never overwrites editor buffers.
- Recognize inline and reference-style Markdown links. Resolve relative `.md` and `.markdown` paths against the source directory, including URL-encoded paths. Deduplicate source/destination pairs. Code, images, HTML, frontmatter, unused link definitions, external URLs, and paths escaping the workspace do not create edges.
- A cross-document fragment can establish a document reference, but its section is neither validated nor navigated by this increment. Fragment-only links are ignored.
- Valid destinations have navigable references and backlinks. Missing destinations appear as broken references, without graph nodes for nonexistent files. Unreadable, excluded, or unindexed destinations must not be falsely reported as missing.
- Reuse Rust filesystem authorization, symlink rejection, UTF-8/binary checks, and the 8 MiB file limit. Hidden files and build/dependency folders follow explorer exclusions. Bounded scanning must clearly report incomplete results and skipped files.
- Index failures are visible and do not block successful saves. A previous snapshot, if retained after failure, is labeled stale. Workspace changes clear the previous workspace's connections.
- Graph and list navigation reuse existing tabs, preserving pending edits and editor history. Empty workspaces and documents with no links have explicit empty states. Controls support keyboard navigation and the existing minimum window size.
- No remote resources, webview filesystem permissions, or document-format changes.

## Exclusions

Section-level references, file watching, semantic relationships, inferred dependencies, impact analysis, AI, file creation/rename/delete, session recovery, and a generalized artifact model.

## Acceptance and validation

1. Opening this repository discovers Markdown in nested folders and exposes directed references, backlinks, and a navigable graph.
2. Inline and reference-style links, escaped/encoded paths, duplicate links, cycles, and missing files are handled correctly; code and unsupported resources do not create connections. Verify with parser fixtures.
3. Saving a changed link updates connections. Failed saves preserve the prior disk-derived connections. Refresh discovers external changes without replacing dirty buffers. Verify interactions.
4. Missing references are distinguishable from excluded/unreadable/partial results. Verify file fixtures, limits, errors, and empty states.
5. No scanning or navigation escapes workspace authorization or follows symlinks. Verify Rust boundary tests; preserve existing saving and text tests.
6. Graph/list navigation preserves open tabs and pending content. Verify keyboard interaction, graph rendering, and layout at normal and minimum window sizes.
7. Reopening rebuilds connections from disk without an index database. Validate locally in the updated macOS executable and record evidence and limitations.

## Acceptance record

The user replied **“aprobado”** on 2026-10-17 to the immediately preceding scoped recommendation: document index, references/backlinks, broken document references, basic navigable graph, and updates on save/refresh, with section links, file watching, semantic relationships, and impact analysis deferred. This is explicit acceptance; no repeat approval is required. Detailed parsing, error handling, and validation rules above make that scope concrete.

## Risks and alternatives

Large workspaces require bounded scanning and a readable graph. Files can change during scanning; the index is a best-effort snapshot, not a filesystem transaction. Standard Markdown parsing avoids false connections from regex matching. A simple derived document model avoids committing prematurely to semantic traceability.

Open product decisions: none blocking the accepted scope. Routine implementation choices and evidence belong in the [plan](../plans/001-connected-specifications.md).

## Closure

Implemented and validated on 2026-10-17. All seven criteria have evidence in [plan 001](../plans/001-connected-specifications.md). Current SPEC, ARCHITECTURE, README, and PROJECT_STATUS were updated. Changes remain local and uncommitted.
