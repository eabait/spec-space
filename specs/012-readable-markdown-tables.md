# 012 — Keep Markdown tables readable in the preview

Status: In progress. Direction and plan were accepted before implementation; implementation is ready for final horizontal-scroll confirmation.

## Problem and intended outcome

In the Markdown preview, narrow columns in wide tables can collapse until ordinary header words wrap at arbitrary character boundaries. This makes stakeholder maps and similar tables difficult to scan. Keep table columns readable and allow horizontal scrolling when the full table does not fit the available reading width.

## Relationship to VISION

**Aligns** with Horizon 1 — Authoring Workspace by improving Markdown reading without changing document semantics.

## Scope and behavior

- In the rendered Preview, place each Markdown table in a horizontally scrollable region constrained to the document reading width.
- Give the table a content-based minimum width so cells do not collapse to very narrow columns; when it exceeds the available width, scroll the table region horizontally.
- Preserve normal Markdown table markup, row order, cell content, keyboard access, and source text. In Preview, left-align all header and body cell text for consistent scanning, regardless of GFM column alignment markers; keep those markers unchanged in Source.
- Keep horizontal scrolling local to the table. Do not add a global horizontal scrollbar to the whole document pane.

## Exclusions

Editing table content or alignment syntax; converting tables to cards; automatic column sizing metadata; changing Markdown parsing; modifying existing documents; adding table controls or user preferences; changing Source or Connections.

## Acceptance criteria

1. A wide table with a short first column and long later-column text does not split ordinary header words into fragments such as “Sponso” / “r”.
2. When the table exceeds the Preview reading width, it scrolls horizontally within its own region and the document pane itself does not gain horizontal overflow.
3. Tables that fit the reading area retain natural sizing and do not expand unnecessarily.
4. All headers and body cells are left-aligned in Preview, including columns whose Markdown separator marks center or right alignment. Links and cell content continue to render correctly; Markdown source is unchanged.
5. Frontend verification covers the layout behavior, production build passes, formatting passes, and `git diff --check` passes. Inspect the packaged app with a representative wide table at wide and compact window sizes.

## Decision record

The user selected the horizontal-scroll option on 2026-10-19 with “vamos con la primer opcion”, accepting readable minimum column widths and local horizontal scrolling as the direction.

The user clarified on 2026-10-19 that table cell content should appear left-aligned rather than centered. Preview normalizes rendered cell alignment to the left while retaining authored GFM alignment syntax in the source.

## Plan

Implementation and validation evidence, including the native gesture verification limit, are recorded in [plan 012](../plans/012-readable-markdown-tables.md).
