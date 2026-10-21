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

Investigation pending. No production implementation changes for 014 yet.
