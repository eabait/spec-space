# 014 — Find and focus flowchart nodes

Status: Implemented locally and approved by the user on 2026-10-21. Remaining validation limits are recorded in plan 014.

## Problem and intended outcome

After expanding a large diagram, users still need to pan and zoom manually to find a particular component. Let them search visible node labels, choose a result, and locate that node in the focused diagram view.

## Relationship to VISION

**Aligns** with Horizon 1 — Authoring Workspace by improving diagram reading and navigation. Builds on [increment 013](013-focused-diagram-view.md); it does not interpret architectural dependencies.

## Scope and behavior

### Search interface

- Add a magnifying-glass icon to the focused diagram toolbar for supported flowcharts, with the accessible name and tooltip **Find node**. It opens a compact search field and focuses it. Toolbar actions remain icons with accessible names and tooltips; search input and results use readable text.
- Search only nodes in the current expanded diagram by their displayed plain-text labels. Support case-insensitive substring matching, trimming the query and collapsing whitespace in both query and labels. Do not use regular expressions, fuzzy matching, or inferred synonyms.
- Node labels, including multiline labels, produce one result per node. Exclude edge labels, diagram titles, and subgraph/container titles. Use the authored node ID as the displayed label when a node has no separate label.
- An empty query shows a short instruction to enter a component name, without moving the viewport or listing every node. Nonempty queries update a bounded, internally scrolling result list and a match count. Zero results show **No matching nodes**.
- Keep distinct nodes with identical labels as separate results. Display the authored node ID as secondary text to distinguish them. Preserve deterministic ordering within the current rendered revision; the feasibility investigation must establish the ordering method before implementation.
- Typing never moves the canvas automatically. Activating a result centers that node in the canvas area remaining beside/below the results and highlights its outline. Preserve the current zoom if the entire node fits with padding; otherwise zoom out enough to include it within the supported viewport bounds. Do not enlarge a small node automatically.
- Only the activated node receives the search highlight. An accessible selected-result state identifies the same node in the result list. Highlights must remain visible across authored colors and zoom levels without altering labels or authored styles.
- Changing the query clears the previous selection and highlight without moving the canvas. Clearing or closing search removes all search highlights and preserves the last viewport. The existing Fit action remains available to recover the whole-diagram view.

### Keyboard and lifecycle

- In the search field, Down/Up choose the next/previous result, clamped at the list ends; Enter activates it. With no previous choice, Enter activates the first result. Moving through choices alone does not pan the canvas. Expose the active choice to assistive technology.
- Results also support pointer activation and keyboard access. While search is open, Escape closes search and returns focus to the magnifying-glass button. A subsequent Escape follows the focused view's existing close behavior. Stop canvas shortcuts from handling typing in the field.
- Search controls and results remain usable at normal and 850 × 580 window sizes. The results must not cover the selected node or make the return control inaccessible.
- Search state is ephemeral: reset it when the focused diagram closes or its document/source/rendered revision changes. Do not retain stale node IDs, geometry, or highlights after a new rendering. Pending or failed renders cannot supply searchable nodes.
- Other Mermaid diagram types retain the existing focused viewing experience. Do not offer node search where a reliable mapping is unavailable; unsupported flowchart constructs must be identified by the feasibility work rather than silently returning incomplete results.

## Data, preservation, and security

- Derive node identity, label, and geometry locally from the current source/render pair. Scope identities to that diagram and rendered revision; IDs need not be globally unique or stable after arbitrary source edits.
- Do not modify Markdown, dirty state, undo history, or files. Do not add persistent metadata or a workspace-wide index.
- Search and result activation never trigger another Pele rendering. Highlighting belongs to the viewing layer and must not appear in copied or saved images or the ordinary Markdown preview.
- Preserve the current SVG sanitizer and disabled diagram links/images. No callbacks from authored Mermaid, remote resources, or expanded webview permissions are permitted.

## Required feasibility gate

After acceptance and creation of the matching plan, investigate the installed Pele version before production interaction work:

1. Demonstrate a reliable mapping from a flowchart node's authored ID and plain-text label to its sanitized SVG element and bounds. Do not infer node identity from label text alone or undocumented generated CSS classes without a documented stability strategy.
2. Exercise duplicate labels, multiline/quoted labels, implicit nodes, styled nodes, subgraphs, multiple diagram blocks, and changed source. Confirm that edge and container text do not become node results and that same-named nodes in separate diagrams remain distinct.
3. Verify coordinate conversion after zoom/pan and resizing, and check that highlighting leaves exported content clean and preserves sanitization.
4. Record the supported constructs, limitations, mapping mechanism, and evidence in the plan. If mapping is incomplete, ambiguous, or requires a renderer replacement or security change, stop before production implementation and return the affected scope for a decision. A successful investigation alone does not mark this feature implemented.

## Acceptance criteria and validation

1. In a representative large flowchart, a user can find and center a component by a partial label without manual scanning. Record the fixture's node count and dimensions when validating it; do not claim arbitrary-size performance.
2. Case differences, surrounding whitespace, multiline labels, repeated labels, empty queries, and no matches behave as specified. Each result resolves to exactly its own node.
3. Search handles only the current diagram/revision; changes, removal, failed rendering, or switching documents cannot activate a stale result.
4. Keyboard operation, focus, result announcements, visible selection, pan/zoom coexistence, and layout work in the packaged app at normal and minimum sizes.
5. Source, dirty state, undo history, existing diagram navigation, and exports remain correct. Exported images do not contain search highlighting. Search does not call the renderer.
6. Complete targeted behavior tests, production build, formatting, and diff checks. Inspect an isolated packaged macOS app without closing a user-owned session; record actual results and any checks performed by the user separately from agent-observed evidence.

## Exclusions

Search outside the active diagram; search in other Mermaid types; direct canvas node selection; edge search or selection; connection highlighting; dependency analysis; inspectors; cross-document navigation; visual editing; persistent search history; AI assistance.

## Acceptance and plan

On 2026-10-21, the user replied “bien” to the recommendation to prepare SPEC 014 for finding and focusing flowchart nodes, with a technical feasibility gate. This authorized preparation of the proposal; subsequent explicit acceptance is recorded below.

The user explicitly accepted this contract with “aceptado” on 2026-10-21. See [plan 014](../plans/014-find-and-focus-flowchart-nodes.md) for the feasibility gate, implementation sequence, and evidence.
