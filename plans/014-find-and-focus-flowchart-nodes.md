# Plan 014 — Find and focus flowchart nodes

Status: In progress. SPEC accepted on 2026-10-21 with “aceptado”.
Contract: [SPEC 014](../specs/014-find-and-focus-flowchart-nodes.md).

## Initial state

Pele is pinned to 1.6.0. Preview sanitizes rendered SVG; App stores the selected SVG and title for DiagramFocusView. No node model is currently passed. Existing uncommitted increments 012 and 013 must be preserved.

## Sequence and decision gate

1. Inspect installed public Pele types and output and relevant primary documentation. Exercise labeled, implicit, duplicate-label, multiline, styled, and nested nodes. Establish authored node IDs, ordering, plain text, sanitized element mapping, and bounds.
2. Record a pass/fail decision before production changes. If reliable mapping needs renderer replacement, weakened sanitization, or reduced feature scope, stop and present the specific decision required by SPEC 014.
3. On pass, add a small node adapter and tests; carry current diagram/source identity through Preview and App. Reuse current output rather than rerendering on search.
4. Add icon-triggered search, keyboard results, centering, and a separate highlight overlay to DiagramFocusView. Preserve pristine export content and reset stale search state. Keep document/editor state intact.
5. Run targeted tests and standard frontend build/format checks. Inspect viewport geometry and search in the packaged app at normal/minimum sizes with isolated configuration. Record actual evidence, not assumed results.
6. Update current contract, architecture, status, and indices only to reflect delivered behavior.

## Risks and alternatives

Generated SVG classes may not be a public identity contract. A version-pinned adapter requires evidence and a compatibility guard. Never infer identity from labels alone. Test repeated labels and separate diagrams. Keep any exploration disposable; a failed gate does not accept a weaker product contract.

## Evidence

### Feasibility and implementation

The identity investigation passed before production work. Pele's documented `pele-node`, `pele-label`, and `data-id` conventions identify authored nodes; see [Pele theming documentation](https://github.com/obsidianmd/pele/blob/main/website/src/content/docs/theming.md). Installed 1.6.0 output was checked with duplicate labels, multiline/quoted labels, implicit nodes, styles, nested subgraphs, shape variants, and changed source. Sanitization preserved IDs while continuing to remove forbidden resources. Source models provide the expected node-ID set, excluding container IDs; the adapter refuses incomplete/duplicate mappings. Result order follows the current sanitized SVG node order.

Implemented `diagram-search.ts`, source-derived IDs in `pele-renderer.ts`, identity propagation in Preview/App, and the search UI in DiagramFocusView. The modal uses a native HTML dialog for background isolation and keyboard focus; node bounds are measured from the displayed SVG relative to its scaled art container. Highlights are separate HTML overlays. Search activation never rerenders through Pele. App clears the focused view on document/content/generation, mode, Connections, or guarded-action changes.

### Observed checks on 2026-10-21

- Production frontend build passed; 50 frontend tests passed (six new tests cover label identity, exclusions, revision isolation, focus geometry, keyboard search/clear, pristine export input, and unsupported diagram types).
- Built an isolated release app with identifier `com.specspace.qa014` and product name `SpecSpace QA 014`. The user's running `com.specspace.desktop` session was preserved.
- Rebuilt the standard release bundle after the isolated QA build: `src-tauri/target/release/bundle/macos/SpecSpace.app`. Formatting, documentation links, and diff checks passed after recording delivery and drafting proposal 015.
- Packaged-app checks used `/private/tmp/specspace-014-fixtures/Search.md`, including a 29-node wide flowchart with repeated Billing labels, multiline labels and a subgraph, a separate two-node flowchart sharing node IDs, and a sequence diagram.
- Observed search opening, two distinct Billing results, keyboard activation of A then B, centered highlighting, Escape closing search before the modal, and return to the unchanged document. A second diagram started with fresh search state and returned only its own Other Billing result. The ordinary Preview source and Save-disabled state remained unchanged.
- The normal-size packaged screenshot visibly confirmed the selected node at the center of the available canvas while the result panel remained beside it. It retained the fitted zoom instead of enlarging a small node, as specified.

### Approval and validation limits

The user stated “definamos un proximo incremento, el anterior quedo aprobado” after the implementation and normal-size packaged checks. This records user approval of the delivered increment; it is not evidence that every remaining validation case was manually exercised.

The 850 × 580 packaged check, real copied/saved image inspection after search, a full native dirty-buffer/undo round trip, and runtime renderer-call instrumentation were not completed before the user requested the next proposal. Automated tests verified export receives the original SVG without the overlay. The existing jsdom canvas warning uses Pele's fallback measurement; the production build retains its large-chunk warning. Do not present these checks as completed or the 50-test suite as native layout evidence.
