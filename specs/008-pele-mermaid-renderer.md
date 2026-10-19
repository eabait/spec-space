# 008 — Replace Mermaid with Pele for diagram previews

Status: Implemented. Accepted: 2026-10-19. Implemented: 2026-10-19.

## Problem and intended outcome

The current Mermaid renderer adds substantial frontend bundle weight and rendering cost. SPEC 007 compared Pele 1.6.0 with Mermaid 11.17.2 and found that Pele renders the tested diagrams faster with a smaller renderer bundle, while retaining usable SVG output for the existing export path. Pele has a distinct layout and visual style and does not support every Mermaid feature.

Use Pele as SpecSpace's local Mermaid-syntax preview renderer while preserving source documents, export and copy actions, and the app's SVG security boundary. Unsupported or invalid diagrams should show a readable error without injecting source text into HTML.

## Relationship to VISION

Aligns with Horizon 1 — Authoring Workspace by improving diagram preview responsiveness and reducing the renderer bundle.

## Scope and behavior

- Replace Mermaid with Pele as the renderer for fenced `mermaid` blocks in Preview; load diagram implementations lazily.
- Keep rendering local, asynchronous, queued, and debounced. Stale renders must not replace a newer diagram.
- Keep the existing DOMPurify SVG sanitization policy. Disable links and images in Pele options, and do not allow document-authored configuration to broaden renderer permissions.
- Preserve PNG save and image clipboard actions, feedback, diagram ordering, and original Markdown text.
- Keep a neutral, readable presentation using Pele's supported CSS variables. Mermaid theme directives may not reproduce their previous colors or layout; the overall Pele visual style change is accepted.
- Render syntax, unsupported feature, and size errors as text. Do not fall back to Mermaid.
- Remove Mermaid from production dependencies after migration.

## Exclusions

Matching Mermaid's exact layout/theme output, supporting arbitrary HTML labels or external Mermaid plugins, adding links/images/interactions, remote rendering, changing the Markdown editing contract, and changing PNG size limits or native clipboard behavior.

## Acceptance criteria

1. Representative checked-in Markdown diagrams from the current workspace render through Pele, including every diagram type used in checked-in documents, plus styles/directives and invalid syntax where present.
2. The renderer remains lazy and queued; editing a diagram while a prior render is pending never installs stale SVG.
3. Sanitized output contains no links, images, `foreignObject`, scripts, or event-handler attributes; the Pele invocation disables links and images, and error content is displayed as text.
4. Existing per-diagram PNG save and image-copy actions operate on Pele output without changing file naming, clipboard IPC, or feedback behavior.
5. Mermaid is removed from application dependencies and the production build includes Pele's lazy chunks.
6. Frontend tests, production build, formatting, and Rust checks pass. A rebuilt packaged macOS app is visually checked for representative diagrams and PNG actions when a safe isolated app session is available.

## Risks and open questions

- Pele documents compatibility with Mermaid 12.1.0; the current app uses Mermaid 11.17.2. The in-repository corpus cannot prove compatibility with every external workspace document.
- Mermaid themes and `themeVariables` differ from Pele's CSS-variable styling. Layout and colors will change, and some Mermaid directives may have no equivalent effect.
- Pele's lazy API loads each diagram type on demand. The adapter must preserve render order and ignore completion from obsolete source revisions.
- Keep the app's sanitizer even though Pele filters its own SVG output; source files remain untrusted.

## Acceptance and plan

Accepted by the user with “avanzar” on 2026-10-19, following the SPEC 007 recommendation to perform a controlled production migration with the observed visual change. See [plan 008](../plans/008-pele-mermaid-renderer.md).
