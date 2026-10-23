# 016 — Jump from a diagram node to its Markdown definition

Status: Rejected on 2026-10-21 at the user's direction.

## Problem and intended outcome

The focused diagram can identify a node and show its direct connections, but editing that node still requires manually finding its declaration in the Mermaid source. Let the user move from a selected diagram node to the exact authored source range that defines it.

## Relationship to VISION

**Aligns** with Horizon 1 — Authoring Workspace and **refines** diagram navigation by connecting read-only exploration to source editing. The source remains authoritative; the diagram remains a rendered view.

## Scope and experience

- In the focused view's **Node details** panel, provide an icon action with accessible name and tooltip **Go to source definition** for the selected node.
- Limit the initial scope to flowchart and C4 nodes supported by increments 014 and 015. Other diagram types retain their existing behavior.
- Activating the action closes the focused view, opens the owning document in Source mode, scrolls to the node's definition within the correct Mermaid block, and selects that authored source range.
- Target the source statement that defines the rendered node label/shape. For a node with no explicit definition, target its first authored node reference. If the renderer/source mapping is stale, unavailable, or ambiguous, do not navigate to a guessed occurrence; keep the action unavailable and leave the focused view open.
- Source navigation is local and transient. It does not edit or save text, alter dirty state or undo history, or change tabs except to restore the document that owns the focused diagram.
- Preserve Markdown, Mermaid syntax, comments, frontmatter, line endings, and the current source revision exactly. Do not create persistent IDs or metadata.

## Data, lifecycle, and safety

- Resolve the target from the same source revision and Mermaid block that produced the focused SVG. The mapping must identify a source range, not merely search for a matching label or ID string.
- Clear or invalidate the target when the document, Mermaid block, source revision, or rendered diagram changes. Never apply an old range to new source text.
- Do not modify the SVG, renderer sanitization, webview permissions, filesystem access, or export contents.

## Required feasibility checkpoint

Pele 1.6.0's public `FlowNode` and `C4Shape` models expose node identities and labels but no source-range fields. Before implementing interaction, verify whether an existing parser mapping can provide exact declaration ranges. If not, prove a syntax-aware local mapping for the supported constructs without relying on label equality, first text occurrence, or unverified line scanning.

Exercise chained flowchart statements, implicit and explicit nodes, repeated node IDs, duplicate labels, multiline declarations, comments, multiple Mermaid blocks, C4 shape declarations, frontmatter, and changed source revisions. Confirm offsets against the original Markdown and verify that ambiguous mappings disable the action. If exact mapping cannot be demonstrated without replacing the renderer or risking a wrong jump, return the affected scope for a decision before production interaction work.

## Acceptance criteria and validation

1. From a selected flowchart node or C4 shape, the action navigates to that node's exact declaration in the correct Markdown block and selects its source range.
2. Implicit nodes navigate to their first authored node reference. Ambiguous or unsupported mappings do not navigate or select a different node.
3. Duplicate labels, chained statements, multiple diagrams, frontmatter, comments, multiline source, and distinct documents preserve node identity and correct source offsets.
4. Navigation returns to the same owning document, switches to Source, and preserves all Markdown bytes, pending edits, dirty state, and undo history.
5. Source changes, failed renders, or diagram replacement cannot leave a stale target actionable.
6. The action has a visible focus state, accessible name, and tooltip, and works with pointer and keyboard at normal and 850 × 580 window sizes.
7. Add mapping and interaction tests; run the production build, formatting, and diff checks; validate navigation in an isolated packaged macOS app. Record observed evidence and limitations separately from user acceptance.

## Exclusions

Editing diagram syntax from the focused view; creating or renaming nodes; source jumps for diagram types other than supported flowcharts and C4; navigation to connections, styles, or subgraphs/boundaries; persistent source maps; cross-document navigation; automatic source rewriting; and AI assistance.

## Open decisions

- Whether a node with conflicting explicit declarations has a single stable source definition. The action must remain unavailable unless the feasibility work establishes one deterministic target.
- Whether selecting the full declaration statement is usable for chained flowchart syntax or whether the selected range should be only that node's authored segment. Resolve this in the accepted plan using verified parser/source mapping evidence.

## Acceptance and plan

The user rejected this proposal with “descartar” on 2026-10-21. No reason was specified. No implementation plan was created, and no behavior was implemented.
