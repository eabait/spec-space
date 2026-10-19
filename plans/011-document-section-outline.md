# Plan 011 — Navigate long documents with a section outline

Status: Complete. Plan accepted and increment implemented: 2026-10-19.

Contract: [SPEC 011](../specs/011-document-section-outline.md), accepted with “aceptada” and this plan accepted with “aceptado” on 2026-10-19.

## Initial state

The active document currently has Source, Split, and Preview modes. Preview renders Markdown headings but does not assign navigation identifiers. Source is a mounted CodeMirror 6 instance owned by `Editor.tsx`; `App.tsx` coordinates active tabs and layout. The left workspace explorer remains visible independently from the document panes. Preserve all existing working-tree changes and do not edit example documents for testing.

## Decisions and dependencies

- Build the outline from the current active editor buffer using the existing `unified`/`remark-parse`, `remark-gfm`, and `remark-frontmatter` conventions. Use AST heading positions and source offsets to distinguish duplicate titles and navigate to the exact occurrence.
- Extend Preview's rendered heading elements with internal stable identifiers derived from source position for in-app outline navigation only. Do not change authored links, slugs, or fragment resolution.
- Add an imperative navigation capability to the existing Editor instance so outline selection can scroll the matching source line into view without replacing the editor, resetting its undo history, or modifying text.
- In Split mode, a selected outline entry scrolls both panes to the same source heading. Ordinary scrolling remains independent.
- Prototype the outline as a transient overlay anchored to the document toolbar, above the document area. It must not resize either pane or the explorer. At 850 × 580 it should fit within the window, scroll internally, and return focus to the invoking control when closed.
- Keep one document active in the outline. Switching tabs updates its entries. Source edits update the derived heading list from the current editor buffer; opening or closing the overlay never changes document state.

## Expected affected files

- `src/App.tsx`: outline visibility, active-document items, focus, and navigation coordination.
- `src/Editor.tsx`: expose a stable scroll-to-line/offset operation while retaining the mounted CodeMirror view.
- `src/Preview.tsx`: render outline-targetable heading IDs and support selecting/scrolling to source offsets.
- A small pure helper under `src/` for heading extraction from Markdown AST, if needed; avoid mixing parsing and navigation UI.
- `src/styles.css`: overlay, hierarchy, hover/focus/current-item, and compact-window presentation.
- Focused frontend tests for extraction and interaction; `ARCHITECTURE.md`, `SPEC.md`, `README.md`, indexes, and `PROJECT_STATUS.md` only as warranted by implemented behavior.

## Steps

1. [x] Inspected parser/render positions and prepared fixtures for ATX, Setext, nested, duplicate, frontmatter, fenced-code, BOM, and GFM headings.
2. [x] Implemented pure outline extraction with AST offsets, levels, visible titles, and a nested hierarchy from the active buffer.
3. [x] Added Preview source-offset targets and an imperative scroll-to-line operation for the mounted CodeMirror instance.
4. [x] Added the accessible transient Outline panel with keyboard navigation, focus return, active-tab changes, and unsaved-buffer updates.
5. [x] Coordinated explicit outline selection across Preview, Source, and Split while leaving later ordinary scrolling independent.
6. [x] Ran focused and full frontend tests, production build, formatting, and diff checks.
7. [x] Built and inspected an isolated packaged macOS app with a disposable 117-line technical Markdown file; verified hierarchy and exclusions, duplicate target, nested navigation in Preview and Split, and panel usability at normal and minimum 850 × 580 sizes. The user's running app and project files were not used or closed.
8. [x] Updated current-product documentation and recorded validation evidence below.

## Validation matrix

| Area                    | Evidence                                                                                                                            |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Heading parsing         | Automated fixtures cover ATX/Setext levels, nested headings, duplicate text, GFM, frontmatter, and headings inside code fences.     |
| Preview navigation      | Each outline item scrolls to the exact matching rendered heading, including duplicates.                                             |
| Source navigation       | Each item places the existing CodeMirror view at the exact heading line without changing text, selection contents, or undo history. |
| Split navigation        | Selecting a heading aligns both panes to that section; subsequent independent scrolling remains unchanged.                          |
| State and accessibility | Active-tab changes and unsaved edits update the list; keyboard interaction, focus return, and screen-reader labels are verified.    |
| Native layout           | Isolated packaged app verified at normal and 850 × 580 sizes with a disposable long document.                                       |

## Risks and preservation

- Parser positions and ReactMarkdown positions must refer to the same source with BOM/frontmatter handling normalized consistently. Test offsets with a BOM and frontmatter fixture.
- Repeated headings cannot use text-derived DOM IDs. Derive target identity from parser source offsets and verify the Preview renderer preserves the mapping.
- CodeMirror must remain mounted when the outline opens or navigation occurs; do not recreate the Editor to add an imperative ref.
- The compact window has limited space. Keep the panel inside the content region, constrain its height, and verify every row and close action remains reachable.
- Treat parser or navigation failures as a closed/unavailable outline state with a readable message; never mutate document text as recovery.
- No user documents, current editor buffers, or running app sessions may be used as writable QA fixtures.

## Progress and validation

- Automated extraction, live-update, active-tab, navigation, focus, and accessibility coverage: `npm test` — 9 files, 43 tests passed.
- `npm run build` passed; Vite reports the existing large-chunk advisory (largest bundle about 1.09 MB).
- `npm run format:check` and `git diff --check` passed.
- Built a separate `com.specspace.outlineqa` packaged app using an isolated Cargo target and temporary configuration. It opened `/private/tmp/spec-space-outline-qa/workspace/Blueprint.md` (117 lines, with nested and duplicate headings, BOM, frontmatter, and a fenced heading).
- Native inspection showed all real headings and both repeated-title entries while excluding frontmatter and fenced-code content. A nested selection navigated Source and Preview together in Split mode; Preview-only navigation landed on the second duplicate heading. Automated tests cover Source-only navigation and unsaved edits/tab changes.
- At 850 × 580, Source and Preview controls remained available; the floating outline stayed inside the document area with a reachable close action and internal scrolling. At normal size, Split retained both panes.
- The user's normal app remained running and untouched. No project document was used as a QA fixture; the test workspace is disposable under `/private/tmp`.

## Closure

SPEC 011 is implemented and locally validated. Automated and isolated packaged-app evidence covers the acceptance criteria. No commit or release publication was performed.
