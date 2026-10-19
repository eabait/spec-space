# 011 — Navigate long documents with a section outline

Status: Implemented and validated locally on 2026-10-19. SPEC and implementation plan were accepted before implementation.

## Problem and intended outcome

Long technical specifications are difficult to scan and revisit using only the document scroll bar. Connections helps move between files, but does not provide navigation within the active document. Add a section outline that makes the document structure visible and lets the user jump directly to a heading while reading or editing.

## Relationship to VISION

**Aligns** with Horizon 1 — Authoring Workspace, especially document navigation and reviewing Markdown. It complements Connections without adding semantic analysis or changing the Markdown document model.

## Scope and behavior

- Add an **Outline** action for the active document. Its panel lists that document's Markdown headings as a nested hierarchy, with heading text and level reflected accessibly.
- Derive the outline from the active editor buffer, including unsaved edits. Recognize ATX and Setext headings using the existing Markdown parsing conventions. Ignore headings inside fenced code and frontmatter. Keep duplicate heading text as separate entries in document order.
- Selecting an outline entry navigates to the corresponding heading in the active view: scroll the Preview heading into view, move the Source editor to the heading line, or synchronize both panes in Split mode.
- In Preview, use internal element identifiers for outline navigation; do not rewrite Markdown, introduce fragment semantics, or change cross-document link behavior.
- Make the outline keyboard-operable and accessible. It must remain usable at the supported minimum 850 × 580 window size and must not permanently reduce the Source or Preview reading/editing area. Closing the outline returns interaction to the document without changing text, dirty state, selection content, or undo history.
- Update the outline as the editor buffer changes and when the active document changes. Keep it scoped to one active document; no workspace-wide outline is added.

## Exclusions

Workspace-wide or multi-document outlines; semantic section links or fragment validation; generated table of contents inserted into Markdown; heading renaming or editing; bookmarks, annotations, search, change tracking, or navigation history; changes to Connections; automatic Markdown formatting; and any document content or persistence changes.

## Acceptance criteria

1. The Outline action opens a nested heading list for the active document in document order, with correct levels and duplicate headings retained separately.
2. ATX and Setext headings appear; code-fence contents and frontmatter do not create outline entries.
3. Selecting an entry navigates to the matching heading in Preview, Source, or both in Split mode, including headings with duplicate text.
4. Outline entries track unsaved source changes and follow active-tab changes without altering document text or save state.
5. Keyboard and assistive-technology users can open, inspect, navigate, and close the outline; focus returns to the document predictably.
6. At normal and 850 × 580 sizes, the outline remains readable and does not make the document panes unusable. No text, selection content, undo history, or dirty state is lost when opening, using, or closing it.
7. Frontend tests cover parsing, hierarchy, duplicate headings, source/preview navigation, live updates, and accessibility interactions. Build, formatting, and `git diff --check` pass.
8. Verify the behavior in the packaged macOS app using a long technical document at normal and minimum window sizes, preserving the user's running session and all workspace files.

## Risks and open decisions

- Markdown heading parsing must match rendered headings, including GFM and the current frontmatter handling. Use source offsets/positions to distinguish duplicate headings rather than text-derived slugs.
- A permanently docked outline could compress the editor, particularly at minimum size. Prefer an overlay or temporarily substituting view that preserves the existing pane dimensions; settle the interaction in the plan after a native prototype.
- In Split mode, two independent scroll positions need a predictable result. Navigating an outline entry should bring the same section into view in both panes without coupling ordinary scrolling.

## Acceptance record

The user selected “el mapa de secciones” on 2026-10-19 and accepted this proposal with “aceptada” on 2026-10-19. The matching plan was accepted with “aceptado” on 2026-10-19, authorizing implementation within this scope.

## Plan

Create [plan 011](../plans/011-document-section-outline.md) only after this SPEC is accepted.
