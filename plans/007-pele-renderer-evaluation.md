# Plan 007 — Evaluate Pele as a Mermaid renderer

Status: In progress. Date: 2026-10-19.

Contract: [SPEC 007](../specs/007-pele-renderer-evaluation.md), accepted with “hagamos la comparación” on 2026-10-19.

## Initial state

SpecSpace renders Mermaid 11.17.2 diagrams from `src/Preview.tsx` in strict mode, disables HTML labels, sanitizes the generated SVG with DOMPurify, and uses the SVG for PNG export and clipboard copying. Pele is a separate implementation with a different layout engine and CSS-variable theming. Its documentation describes Mermaid 12.1.0 compatibility.

## Steps

1. Prepare an isolated comparison harness using the exact current Mermaid version and a pinned Pele version; do not add Pele to production dependencies.
2. Use paired Mermaid sources covering the SPEC 007 diagram types, long/wide labels, styles/directives, invalid syntax, and a wide layout.
3. Compare successful output, visual layout, sanitizer compatibility, and PNG rasterization compatibility.
4. Measure repeated render durations in the same browser and compare production bundle contributions using local build outputs.
5. Record evidence, limitations, and a recommendation. Leave production renderer and exports unchanged.

## Affected files

Expected: this plan, SPEC 007, `specs/README.md`, `plans/README.md`, and `PROJECT_STATUS.md`. Any harness and dependency installation should remain temporary or explicitly development-only and be removed after evaluation.

## Risks and preservation

- Do not trust vendor benchmark ratios as local results; measure both libraries under matched conditions.
- Keep Mermaid's current strict mode, sanitization, disabled remote images/links, and export requirements as comparison constraints.
- Pele's own layout and color system may change diagram readability even when syntax parses successfully.

## Validation

Pending. Record exact versions, environment, diagram corpus, timings, bundle sizes, sanitizer/export observations, and final recommendation here.
