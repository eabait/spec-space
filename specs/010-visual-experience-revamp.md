# 010 — Visual experience for reading and navigating specifications

Status: Validated by user. Evaluation and implementation scope accepted: 2026-10-19. Implementation completed: 2026-10-19. User validation recorded: 2026-10-19.

## Problem and intended outcome

The current interface presents SpecSpace as a conventional Markdown editor. Its restrained gray surfaces and book icon do not communicate the product's role as a workspace for reading and navigating the blueprints of a software system. Long technical documents also need a clearer reading hierarchy.

Apply the reviewed visual direction as a cohesive desktop redesign: make long-form Markdown easier to read, give the existing workspace and Connections view a consistent system-blueprint identity, and replace the book-shaped app icon with a recognizable architecture mark. Keep the local Markdown workflow and its safety guarantees intact.

## Relationship to VISION

**Aligns** with Horizon 1 — Authoring Workspace: improve the everyday experience of viewing, editing, and navigating technical specifications. It refines the product identity around the vision of an understandable system workspace without adding semantic analysis or changing the document model.

## Accepted visual direction

- Use warm, low-glare reading surfaces with dark navy text, restrained teal and copper accents, and blueprint linework limited to chrome, separators, and diagram framing.
- Establish editorial hierarchy and comfortable reading measure and rhythm for long documents. Make headings, links, code, tables, quotes, lists, and diagrams easy to distinguish.
- Keep the file tree, tabs, document toolbar, source/preview modes, save state, and Connections behavior recognizable and accessible. Treat source as an editing surface with clear monospaced typography and line numbers.
- At wide desktop sizes, support a balanced source/preview split with a larger reading canvas and preserve the existing workspace navigation. At the minimum 850 × 580 window, retain a practical single-pane Source or Preview mode through the existing view controls; do not squeeze both panes until either is unusable.
- Give Connections the same visual language while retaining it as the existing separate view.
- Replace the book icon with a simple rounded-square mark of connected architectural modules or system layers. Keep it legible at small sizes and visually consistent across the macOS app icon assets.

## Scope

- Update application visual tokens, surfaces, typography, spacing, controls, document panes, Markdown preview styling, and Connections styling as needed to apply the accepted direction.
- Make the existing source/split/preview controls usable at wide and minimum supported window sizes. A compact layout may adapt the pane arrangement, but must retain access to both source and preview without changing document content or state.
- Replace the source SVG and all packaged Tauri icon variants consistently; include visual checks at native app-icon sizes.
- Use local/system fonts and existing dependencies unless an implementation need is documented in the plan.
- Keep all existing menu, keyboard, tab, save, unsaved-change, link navigation, diagram rendering/export, workspace, and session behavior intact.

## Exclusions

New navigation features such as an outline or contextual reference rail; changing Connections information or graph behavior; new editor features, themes, or user settings; Markdown or diagram semantics; document storage, filesystem permissions, save/session contracts, or webview capabilities; remote resources, semantic analysis, AI, collaboration, and document-format changes.

## Acceptance criteria

1. The application applies one coherent visual system to the workspace, document toolbar, tabs, source editor, Markdown preview, diagrams, and Connections.
2. A long technical document has a comfortable reading measure, clear heading hierarchy, and legible paragraph rhythm, code, tables, quotes, links, lists, and diagrams.
3. Source remains recognizably an editor with legible monospaced text, line numbers, selection/focus states, and sufficient room for sustained writing.
4. At the normal desktop size, source and preview can be viewed together with clear separation and the reading canvas receiving the larger share of space.
5. At 850 × 580, Source and Preview remain individually usable through the existing mode controls; resize transitions do not lose edits, active selection, undo history, or the user's chosen mode unexpectedly.
6. Workspace navigation, tabs, Connections, document links, diagram actions, dirty indicators, status, and save/close protections remain understandable and functional after the visual changes.
7. A replacement icon uses the accepted connected-module/blueprint direction, contains no book motif or lettering, and is recognizable in the macOS Dock and Finder at small sizes. All configured platform icon files are updated consistently.
8. Frontend tests, build, formatting, diff checks, Rust tests/formatting when Rust/icon packaging changes require them, and packaged macOS visual checks at normal and minimum sizes pass. Verify the actual rebuilt executable and icon while preserving the user's app session.

## Risks and decisions

- Blueprint decoration can compete with text or reduce contrast. Keep it out of dense reading areas and verify contrast in real preview content.
- The minimum window cannot comfortably show navigation, source, and preview at once. Use the existing view controls to focus on one pane while retaining a clear route to the other.
- A warm page tone must preserve visibility of editor selection, focus indicators, errors, and dirty state.
- Icon updates touch multiple generated sizes and platform formats; produce one approved vector concept and regenerate or export each configured asset from it.

## Acceptance record

The user accepted the visual-evaluation direction with “aceptada” on 2026-10-19 and reviewed the generated concept positively with “está muy bueno”. The user accepted the implementation scope with “aceptada”, then accepted the matching plan with “aceptado” and requested implementation. These decisions authorize the completed implementation recorded in plan 010.

## Plan

See [plan 010](../plans/010-visual-experience-revamp.md).

## Evaluation outcome

The generated boards and their limits are recorded in [plan 010](../plans/010-visual-experience-revamp.md). They establish the warm editorial/blueprint direction; some mockup copy is illustrative rather than exact product content.

## Implementation outcome

All acceptance criteria were verified locally; see [plan 010](../plans/010-visual-experience-revamp.md) for automated and packaged-app evidence and the QA boundaries.

## User validation

The user validated the increment with “valide el incremento” on 2026-10-19.
