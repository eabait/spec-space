# Plan 013 — Explore a diagram in a focused view

SPEC: [013 — Explore a diagram in a focused view](../specs/013-focused-diagram-view.md)
Status: In progress. Accepted: 2026-10-21 by the user's instruction to focus on UI, use icons instead of labels, and start implementation.

## Initial state and dependencies

`Preview.tsx` renders sanitized Pele SVG inside each diagram and exports PNG through `diagram-image.ts` and Rust commands. `App.tsx` owns document/tab state and renders panes; it can own a modal overlay while keeping the editor mounted. React and lucide-react are already installed. Existing user changes in SPEC 012 and related files must be preserved.

## Steps

1. Refactor diagram rendering to expose its sanitized SVG, readiness, and export actions, with an icon-only **Explore diagram** control. Opening/navigation must not invoke Pele again.
2. Add an accessible modal owned by the document workspace, with explicit diagram and close lifecycle. Keep the editor mounted; lock background interaction while preserving guarded native quit behavior.
3. Implement SVG-sized viewport layout, fit/reset, anchored zoom, wheel pan/modified zoom, drag pan, keyboard controls, resize handling, and a compact icon toolbar with accessible names and tooltips.
4. Reuse existing PNG export from the full untransformed SVG. Check saved dimensions and clipboard image payload.
5. Add focused tests for viewport transforms, modal return, and dirty editor state. Run relevant frontend checks and inspect an isolated packaged macOS app with representative diagrams and gestures. Preserve the user's running app.

## Affected areas

- `src/Preview.tsx`: diagram controls and rendered SVG ownership.
- New `src/DiagramFocusView.tsx`: modal, toolbar, viewport and transform state.
- Optional `src/diagram-viewport.ts`: pure transform math.
- `src/App.tsx`: modal lifecycle and document overlay.
- `src/styles.css`: modal and responsive icon toolbar.
- Focused frontend tests; `ARCHITECTURE.md`, `SPEC.md`, `PROJECT_STATUS.md` on closure.

## Risks and rollback

- Pele SVG dimensions and viewBox may differ across diagram types. Establish natural dimensions without altering sanitized output.
- Avoid rendering the same SVG twice with duplicate IDs; move the live diagram into the overlay or keep only one live copy.
- CSS transforms must not affect export geometry; export the original complete SVG.
- Keep native menus and quit guards authoritative; do not introduce a second window.
- Rollback by reverting focused-view components and integration while preserving unrelated working-tree changes.

## Validation record

Pending. Record commands, interaction evidence, fixture dimensions, export results, and limitations.

## Closure

Pending implementation and validation. Update SPEC 013, ARCHITECTURE, SPEC, PROJECT_STATUS, and README as warranted.
