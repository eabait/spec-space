# 020 — Copy Markdown tables and clarify outline hierarchy

Status: Implemented locally on 2026-10-27. Accepted by the user with “aceptada” on 2026-10-27.

## Problem and intended outcome

Preview tables are useful for reading, but users need to reuse the authored table in another Markdown document. The outline currently presents nested headings with insufficient visual indentation, making sequences such as H1 → H2 → H3 difficult to scan.

Add a direct action to copy each table's original Markdown source and make outline hierarchy visibly left-aligned with indentation that follows heading depth.

## Relationship to VISION

**Aligns** with Horizon 1 — Understanding and Review Workspace by improving reuse of authored artifacts and orientation within long documents.

## Scope and behavior

- Add a compact, accessible **icon-only Copy Markdown** action to each rendered Preview table. The button has an accessible name and tooltip, but no visible text; it copies the exact authored Markdown table block, including its header, delimiter row, body rows, cell text, alignment markers, and line ending style where available. It must use minimal chrome space and not widen or add a separate toolbar row to the table.
- Copying a table must not copy rendered HTML, normalize or rewrite the document, alter the source buffer, change dirty state, or affect the clipboard's unrelated formats. Show transient success or failure feedback on the table action and keep the control usable from keyboard focus.
- Identify each table from its Markdown source position rather than reconstructing Markdown from rendered cells. A table with escaped pipes, inline formatting, empty cells, or alignment markers remains copyable as authored.
- Keep the existing local table overflow and readable cell layout. The action may sit in the table region chrome without reducing the table's usable scroll area.
- Render the outline buttons left-aligned. Preserve document order and nested structure, and add clear indentation for each child level (H2 under H1, H3 under H2, and so on) without centering titles or changing heading text.
- Keep outline labels and H-level indicators accessible, keyboard-operable, and usable with duplicate headings. Indentation is presentation only and must not change navigation targets or source offsets.

## State and preservation

Copy is read-only and must preserve Markdown bytes, pending edits, selection, undo/redo history, active tab, and scroll positions. It must use the active unsaved buffer so a table edited in Source can be copied before saving. Outline presentation changes must preserve existing navigation and focus behavior.

## Exclusions

No HTML-table export, CSV export, table editing, source normalization, clipboard persistence, multi-table selection, outline filtering, heading reordering, or changes to Markdown parsing and document storage. Existing table alignment behavior remains left-aligned in Preview while authored alignment markers remain in Source.

## Acceptance criteria and validation

1. Every rendered Markdown table exposes a labelled icon-only Copy Markdown action. Activating it copies the exact corresponding table block from the active Markdown buffer and provides success or failure feedback without adding visible text or unnecessary table space.
2. Copying works for tables with alignment markers, escaped pipes, inline formatting, empty cells, multiple tables, and unsaved source edits; it does not modify source content, dirty state, selection, undo history, or active document.
3. The table remains locally scrollable and readable after the action is added; keyboard users can focus and activate the control without selecting table text accidentally.
4. The outline renders all titles left-aligned, with visible indentation proportional to heading depth. H1, H2, and H3 sequences remain readable; duplicate headings and navigation to exact source offsets continue to work.
5. Automated tests cover table-source extraction, clipboard success/failure feedback, unsaved content, multiple tables, and outline indentation/accessibility. Frontend tests, build, formatting, and `git diff --check` pass.
6. Verify the rebuilt packaged macOS app with a disposable workspace: copy at least two tables into another Markdown-capable document, including one unsaved edit, and inspect the outline with repeated H1/H2/H3 headings. Preserve the user's running session and record any limitations.

## Risks and implementation decisions

- ReactMarkdown exposes source positions on table nodes; use those positions against the active buffer and account for the BOM offset consistently with outline handling.
- Clipboard access may be unavailable in some test or non-secure contexts. Surface a useful failure message and keep the source unchanged.
- The copy action must not depend on reconstructing a table from rendered React children, which would lose authored syntax.

## Acceptance and plan

On 2026-10-27, the user requested two improvements: copying a Markdown table for reuse in other documents, and left-aligned, indented outline titles. Both `specs/` and `plans/` were enumerated before assigning 020. The user accepted this contract with “aceptada”; implementation follows [plan 020](../plans/020-copy-markdown-tables-and-outline-indentation.md).

## Implementation outcome

Preview tables now expose a compact icon-only Copy Markdown button. It slices the exact table block from the active BOM-stripped Markdown buffer using the rendered node's source offsets, preserving authored syntax and unsaved edits. The outline keeps its existing navigation and now indents nested lists by heading level while keeping titles left-aligned.

Automated validation passed with 56 frontend tests, build, formatting, and diff checks. The release macOS bundle was rebuilt at `src-tauri/target/release/bundle/macos/SpecSpace.app`. Packaged-app copy/paste and outline inspection remain pending.
