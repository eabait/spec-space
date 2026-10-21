# Plan 015 — Inspect a node's direct connections

Status: Complete, with a C4 inspection correction on 2026-10-21 following the user's report that connected C4 nodes appeared isolated.
Contract: [SPEC 015](../specs/015-inspect-direct-node-connections.md).

## Initial state

Pele 1.6.0 renders flowchart node groups and edge groups in sanitized SVG. `diagram-search.ts` reads current node identities from `g.pele-node[data-id]`. Focused viewing and transient search live in `DiagramFocusView.tsx`; export uses the original SVG. Keep increment 014 behavior intact.

## Sequence

1. Inspect Pele 1.6.0 public flowchart model types and generated SVG. Exercise incoming, outgoing, reversed, two-way, undirected, labelled, parallel, self-loop, dotted/thick, and subgraph endpoint edges. Map authored edge identities, endpoints and directions to sanitized SVG elements; confirm identifiers and geometry survive sanitization.
2. Record support and exclusions. If edge identity/direction is ambiguous or requires changing renderer/security boundaries, stop and report the concrete finding before implementation.
3. On a reliable mapping, add a revision-scoped direct-connection adapter, model tests, and explicit classifications including subgraph exclusions.
4. Add node selection/highlight, shared Search/Node details panel, accessible connection lists and follow-to-neighbor behavior. Preserve search behavior, source state and pristine exports.
5. Run focused tests, build, formatter and diff checks. Validate in an isolated packaged macOS app at normal and minimum sizes, with representative graph shapes and export checks.
6. Record observed results and limitations; update product, architecture and status documentation on closure.

## Risks and rollback

SVG edge paths may be a compound rendering of several semantic edges, so matching by DOM order is unsafe without evidence. Edge labels may be empty, duplicated or styled. Native arrowhead markers must not be mistaken for direction when absent. Roll back only new adapter/panel behavior; preserve 014 and earlier user work.

## Evidence

### Technical checkpoint

The installed Pele 1.6.0 `parse(source)` model provides authored edge IDs, endpoints, explicit edge type, and labels. The rendered flowchart emits matching `g.pele-edge[data-id]` groups, while node groups use authored `data-id`; this exact identity mapping survives the existing DOMPurify SVG sanitization. Direction is based only on explicit endpoint styles: `arrow_point` is oriented from parsed start to end, `double_arrow_point` is two-way, and `arrow_open` is undirected. Unknown styles remain Other. Parser/renderer output was inspected for reversed arrows, labels, repeated/parallel edges, self-loops, dotted/thick edges, and subgraph endpoints; inspection does not depend on DOM enumeration order or label equality. Container endpoint edges are excluded and counted, while edges to ordinary nodes inside a subgraph remain inspectable.

### Implementation

Added `DiagramEdge` and classification/incident-edge helpers in `diagram-search.ts`; Pele's render adapter now carries parsed edges with the same diagram render result. Preview and App pass those records into the focused view. The Node details icon opens the same side panel as Find node. Selecting a node highlights it, its neighbors, and all incident edges in the focused SVG copy. The bounded panel groups incoming, outgoing, two-way, undirected, other, and self-connections, retaining labels, IDs, parallel edges, and counts. Following an entry centers the node and refreshes details. Background clicks clear inspection; drags preserve it. A captured click after selecting/dragging is suppressed from being misread as a background click. Search, selection, details, and highlights remain transient; export still uses the original sanitized SVG.

### Validation on 2026-10-21

- `npm test`: 52 frontend tests passed, including edge classification, clicked-node selection under pointer capture, search activation and query retention, connection follow, pristine export input, unsupported diagrams, and prior application coverage.
- `npm run build`, `npm run format:check`, and `git diff --check` passed.
- Built an isolated release app as `SpecSpace QA 015.app` with identifier `com.specspace.qa015`; the user's normal `com.specspace.desktop` app was left running and untouched.
- In the packaged app, opened a disposable workspace at `/private/tmp/specspace-015-fixtures`. The diagram verified incoming Gateway (`request`), two outgoing connections including parallel Ledger edges, a two-way Ledger edge, undirected Audit, a self-loop, and exactly one excluded edge targeting a subgraph. The screenshot showed the selected node, its neighboring nodes, and incident edges highlighted, with unrelated canvas content retained. The inspector's Ledger entry was followed natively; Ledger became selected and its connections refreshed. A direct Billing pointer click opened details while zoom stayed at 100% and retained the current canvas transform.
- Native activation through Search, direct pointer selection, follow-to-neighbor, and background clearing were observed. Automated interaction verifies pointer selection and suppression of the captured follow-up click. Native window resizing to the 850 × 580 minimum and PNG/clipboard export with selection active were not repeated in this isolated session; automated tests confirm image export receives the original unmodified SVG. The existing large frontend chunk warning and jsdom canvas fallback warning remain unchanged.

### Closure

SPEC 015 remains accepted and is implemented locally. Current product and implementation boundaries are updated in SPEC.md and ARCHITECTURE.md; indices and PROJECT_STATUS.md record this delivery. No commit, publish, or deployment was performed.

### C4 inspection correction (2026-10-21)

The user reported that selecting a C4 node showed no connected-node details. Pele rendered C4 nodes as `g.pele-node[data-id=<alias>]` and relationships as `g.pele-edge[data-id=<from>-<to>]`, but the adapter only derived an inspection model for flowcharts. The pointer handler could therefore select a C4 node while its details model was empty. Added the installed Pele C4 parser as the source of shape aliases and relationships, carrying them with the render result. `Rel` variants are directed, `BiRel` is two-way, and `Rel_U` is undirected. C4 container/boundary inspection remains excluded; no label-based or DOM-order matching was introduced.

Focused renderer tests verify exact node and edge ID correspondence after SVG sanitization and displayed node/relationship labels. Interaction tests select a C4 node, inspect incoming and two-way relationships, verify highlighted edges, and follow a connected node.

- `npm test`: 55 frontend tests passed; `npm run build`, `npm run format:check`, and `git diff --check` passed.
- Built the isolated `SpecSpace QA 015 C4.app` and checked a disposable C4 diagram natively. Selecting API showed User (`calls`, incoming) and Database (`reads and writes`, two-way), highlighted the API and both connections, and following Database updated the panel to API (`reads and writes`, two-way) and User (`observes`, undirected).
- Native verification exposed a handoff reclassification in Preview that turned C4 relationships into “Other”; Preview now carries the renderer's semantic classifications unchanged. Rebuilt and verified the corrected isolated app.
- Built the standard local release bundle at `src-tauri/target/release/bundle/macos/SpecSpace.app`. The large frontend chunk warning and jsdom canvas fallback warning remain; no user's app session was closed or modified. The currently running standard app needs a restart to load this rebuilt bundle.
