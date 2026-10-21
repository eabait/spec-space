# 015 — Inspect a node's direct connections

Status: Accepted. Created and accepted: 2026-10-21.

## Problem and intended outcome

Finding a component in a flowchart helps locate it, but users still have to trace its lines manually to understand which other components it connects to. Select a node, inspect its direct connections, and navigate to a connected node while retaining diagram context.

## Relationship to VISION

**Aligns** with the authoring workspace and **refines** Architecture Explorer toward explicit diagram relationships. Extends [014 — Find and focus flowchart nodes](014-find-and-focus-flowchart-nodes.md). An arrow remains a diagram connection, not evidence of a technical dependency, implementation, or change impact.

## Scope and experience

### Select a component

- In an expanded, supported flowchart or C4 diagram, clicking a node selects it and opens a compact **Node details** panel. Show its displayed label and authored ID. Clicking the node does not automatically change zoom or position.
- Activating a search result continues to center and highlight the node and makes its details available. Search and Node details share one side panel with an accessible switch between them; do not consume both sides of the canvas. On activation, retain the query and results so the user can switch back without searching again.
- Treat a pointer movement of more than 6 CSS pixels as canvas panning, not node selection. Pointer cancellation never selects a node. A background click clears selection; an actual drag preserves it.
- Provide keyboard access through the existing search results. The details panel, its controls, and connection entries are keyboard-operable. Do not make every SVG shape a separate tab stop.

### Show direct connections

- Highlight the selected node and its directly incident connections. Mark directly connected nodes with a lighter outline while preserving authored colors and labels. Keep other content visible and do not relayout or rerender the diagram.
- The panel groups connections as **Incoming**, **Outgoing**, **Two-way**, and **Undirected**, based on explicit arrowheads. Do not infer direction from source declaration order. If a rendered endpoint style cannot establish direction reliably, show **Other connections** and retain its actual label and endpoints rather than guessing.
- Each entry shows the other node's label, its ID for disambiguation, and the edge label when present. Unlabelled edges show **No label**. Counts refer to connections, not distinct neighboring nodes.
- Keep parallel edges as separate entries even when their labels or endpoints match. A self-loop appears once under **Self-connections**, identifies the selected node as both endpoints, and is highlighted without double counting.
- Show **No direct connections** for an isolated node. Use bounded, internally scrolling lists so the canvas and toolbar remain usable.
- Only inspect node-to-node connections within the current diagram. Subgraph/container endpoints are outside v1: report their excluded connection count explicitly when applicable; do not label a node isolated if excluded connections exist.

### Follow a connection

- Activating a connection entry selects the connected node, centers it using increment 014's existing focus behavior, and updates its direct connections. Keep the prior zoom unless the node needs a wider view to fit.
- Following a self-loop keeps the current selection and viewport. No recursive expansion, traversal history, or breadcrumbs are included.
- Provide an icon action **Clear selection** with accessible name and tooltip. Clearing selection removes node/edge highlights and details without moving the viewport. Existing Fit remains available.
- Switching between Search and Node details retains selection. Editing or clearing the query follows increment 014's existing rule: clear selection and highlights without panning. Closing the side panel clears selection and search state. Escape closes the panel first and the expanded view second.
- All toolbar actions use icons with accessible names and tooltips; node names, edge labels, group headings, and counts remain text.

## Data, lifecycle, and safety

- Build the connection model from the same source revision that produced the current rendered diagram. Use authored node IDs and reliable edge identities scoped to that diagram/revision; never join entities by label text.
- Selection and connection following are transient and local. They do not change Markdown, dirty state, undo history, files, or session metadata.
- Closing or replacing the diagram, changing its document/source/rendered revision, or a render failure clears all inspection state. A stale model must never act on a newer rendering.
- View highlights must remain separate from pristine diagram output, including image export and the ordinary Markdown preview. Do not add links, images, scripts, renderer permissions, or remote resources.
- Other diagram types retain their existing viewing behavior. Node search remains available independently when connection inspection cannot be supported reliably.

## Required technical checkpoint

Before production interaction changes, verify the installed Pele parser and sanitized SVG against simple and reversed arrows, two-way edges, plain lines, dotted/thick edges, repeated edges, self-loops, labelled edges, and subgraph endpoints. Establish how arrowheads and line groups map to parsed edges; endpoint decoration is not automatically direction.

Record the supported mapping, explicit exclusions, and compatibility checks in the implementation plan. If edge identity is ambiguous or the promised highlighting would require a renderer replacement or weakened sanitization, return that decision before implementation. Do not rely on label equality or an unverified SVG enumeration order.

## Acceptance criteria and validation

1. Selecting a node by pointer or through search identifies exactly that node and shows the correct direct relationships; repeated node labels do not merge entities.
2. Incoming, outgoing, two-way, undirected, self-loop, and parallel-edge cases are counted and displayed correctly. C4 relationship variants use exact alias endpoints; C4 boundaries and ambiguous edge identities remain excluded. Unsupported endpoint semantics and flowchart subgraph exclusions remain explicit.
3. Following an entry centers/selects the correct neighbor and refreshes the details. Clearing selection or closing the panel removes every inspection highlight without changing source or moving the canvas.
4. Dragging from either a node or background pans without accidentally selecting another component. Search, keyboard navigation, Escape, Fit, zoom, and native close/quit guards continue to work.
5. Search and details fit the normal and minimum 850 × 580 app window, with readable labels, bounded scrolling, visible focus, and a usable canvas.
6. Exported PNG and clipboard images contain the complete pristine diagram with no selection/connection highlights. Source changes cannot leave actionable stale nodes or edges.
7. Add meaningful mapping and interaction tests, run the production build, formatting and diff checks, and inspect the packaged app in an isolated session. Record actual evidence and limitations separately from user approval.

## Exclusions

Multi-hop exploration, path finding, graph filtering or isolation, semantic dependency inference, inspectors for diagram types other than supported flowcharts and C4, boundary/subgraph selection, document/specification links, persistent navigation history, visual editing, and AI analysis.

## Acceptance and plan

The user accepted this detailed contract with “aceptada” on 2026-10-21.

See [plan 015](../plans/015-inspect-direct-node-connections.md) for the technical checkpoint, implementation sequence, and evidence.
