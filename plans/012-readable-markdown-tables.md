# Plan 012 — Keep Markdown tables readable in the preview

Status: In progress. Accepted and implemented locally on 2026-10-19; horizontal gesture confirmation remains outstanding.

Contract: [SPEC 012](../specs/012-readable-markdown-tables.md), direction selected on 2026-10-19 and implementation plan accepted on 2026-10-19.

## Initial state

Preview uses `ReactMarkdown` with `remark-gfm`. `src/styles.css` styles Markdown table header/background and cell padding, but table layout has no minimum width or local horizontal overflow wrapper. The current change is scoped to rendered Preview presentation; no Markdown source conversion or Rust filesystem change is needed.

## Decisions and dependencies

- Wrap rendered tables in a semantic, focusable horizontal scrolling container with an accessible label so trackpad, keyboard, and assistive-technology users can reach overflow content.
- Let the table size to its content with a conservative minimum width per column, rather than assigning equal widths. Keep short tables at their natural width and constrain overflow to the wrapper.
- Render all table headers and body cells left-aligned for consistent scanning, even when GFM alignment markers specify center/right. Keep authored markers and source text unchanged.
- Prefer a Preview component wrapper around the existing GFM `table` renderer. Avoid changing document parsing or source text.
- Add focused component coverage for wrapper semantics and styles/overflow constraints, and inspect the packaged macOS app using a disposable table fixture at wide and minimum supported widths.

## Expected affected files

- `src/Preview.tsx`: wrap rendered GFM tables in a local scroll region and normalize rendered cell alignment to left.
- `src/styles.css`: table intrinsic/minimum sizing, overflow, focus, and compact-width presentation.
- Focused frontend Preview tests; `ARCHITECTURE.md`, `SPEC.md`, `README.md`, and `PROJECT_STATUS.md` if needed after implementation.

## Steps

1. Confirm ReactMarkdown's GFM table component props and create representative narrow, wide, center/right-aligned, and linked-cell fixtures.
2. Implement the accessible local overflow wrapper and content-based minimum sizing without changing source.
3. Add focused component tests for left alignment, wrapper semantics, and regression cases.
4. Run focused tests, `npm test`, `npm run build`, `npm run format:check`, and `git diff --check`.
5. Build an isolated packaged macOS app. Verify a wide stakeholder-style table at normal size and 850 × 580, including local horizontal scrolling, no document-level horizontal overflow, and natural width for a short table. Preserve the user's running app and workspaces.
6. Record actual evidence; update current-product documentation and close the SPEC/plan only after criteria pass.

## Risks and preservation

- A global table width or equal column distribution could waste space on small tables or keep the narrow-first-column failure. Prefer content-based width and verify both short and wide tables.
- CSS `min-width` by itself may not bound the scrollable element; test the actual native webview viewport and ensure the document container does not widen.
- Keyboard scrolling should be discoverable without adding a permanent focus stop when no horizontal overflow exists.
- Use only disposable fixtures; never edit examples or user documents for visual testing.

## Progress and validation

- `npx vitest run tests/preview-table.test.tsx` — 1 focused test passed with centered/right GFM markers. Full `npm test` after the left-alignment correction — 10 files, 44 tests passed.
- `npm run build`, `npm run format:check`, and `git diff --check` passed. Vite continues to report the existing large-chunk advisory (main bundle about 1.09 MB).
- Isolated app bundle built as `com.specspace.outlineqa` with a separate Cargo target. QA fixture: `/private/tmp/spec-space-outline-qa/workspace/Tables.md`; it has a three-column stakeholder table with a long description and a two-column compact table.
- At normal size, the wide table stayed inside the preview reading measure with the first header reading “Sponsor”; the short table used its natural width. At 850 × 580, the wide table remained confined to its region and the page retained its normal width. The region has an accessible name and visible focus ring.
- After user feedback, Preview now explicitly left-aligns every rendered header and body cell, even when GFM alignment markers specify center or right. The disposable app confirmed “Sponsor” and “Responsibility” begin at their cell padding edge; the source still visibly retains `:---:` and `---:` markers.
- Limitation: UI automation focused the region and inspected layout but did not demonstrate horizontal scrolling via a trackpad gesture. Horizontal overflow is configured on the local wrapper; confirm the scroll gesture manually if needed.
- The primary SpecSpace session and repository documents were not used as QA content and remained untouched. No commit or release publication was performed.

## Closure

The implementation and automated checks are complete. Packaged-app layout inspection passes; keep this plan in progress until horizontal trackpad scrolling is confirmed manually.
